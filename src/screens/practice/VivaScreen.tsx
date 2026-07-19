import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import VIcon from '../../prototype/icons';
import { VTopBar, VidyaAvatar } from '../../prototype/shared';
import { chapterTitleById } from '../../content/syllabus';
import api, { type VivaQuestion, type VivaFeedback } from '../../api/vidya';
import { appendActivity } from '../../lib/progress';
import type { ScreenProps } from '../../types';

// ─────────────────────────────────────────────────────────────
//  Viva — explain it out loud. Vidya asks a question, the student
//  answers by talking (MediaRecorder), Gemini listens to the audio
//  and gives kind, specific feedback with 1-3 stars.
// ─────────────────────────────────────────────────────────────

type Phase = 'idle' | 'recording' | 'thinking' | 'feedback';
const MAX_SECONDS = 90;

// Pick a recording format the browser AND Gemini both understand.
function pickMime(): string {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
  for (const c of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(c)) return c;
  }
  return '';
}

export default function VivaScreen({ go, state, set }: ScreenProps) {
  const { t } = useTranslation(['practice', 'common']);
  const grade = api.toGrade(state?.classLevel);
  const chapterIds = (state?.vivaChapters as string[]) || [];
  const topics = chapterIds.map((id) => chapterTitleById(id)).filter(Boolean) as string[];

  const [questions, setQuestions] = useState<VivaQuestion[] | null>(null);
  const [loadErr, setLoadErr] = useState(false);
  const [qIdx, setQIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>('idle');
  const [seconds, setSeconds] = useState(0);
  const [feedback, setFeedback] = useState<VivaFeedback | null>(null);
  const [results, setResults] = useState<VivaFeedback[]>([]);
  const [micErr, setMicErr] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);

  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mimeRef = useRef<string>('');

  // Load the questions once.
  useEffect(() => {
    let alive = true;
    api.generateViva({ topics: topics.length ? topics : ['general maths'], grade, language: state?.language || 'English', num: 3 })
      .then((qs) => { if (alive) { qs.length ? setQuestions(qs) : setLoadErr(true); } })
      .catch(() => { if (alive) setLoadErr(true); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stop everything on unmount.
  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    recRef.current?.stream.getTracks().forEach((t) => t.stop());
  }, []);

  const startRecording = async () => {
    setMicErr(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = pickMime();
      mimeRef.current = mime || 'audio/webm';
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        submitAnswer();
      };
      recRef.current = rec;
      rec.start();
      setSeconds(0);
      setPhase('recording');
      timerRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s + 1 >= MAX_SECONDS) stopRecording();
          return s + 1;
        });
      }, 1000);
    } catch {
      setMicErr(t('viva.micDenied'));
    }
  };

  const stopRecording = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (recRef.current && recRef.current.state !== 'inactive') recRef.current.stop();
  };

  const submitAnswer = () => {
    const q = questions![qIdx];
    const blob = new Blob(chunksRef.current, { type: mimeRef.current });
    if (blob.size < 1000) {   // essentially empty recording
      setMicErr(t('viva.micSilent'));
      setPhase('idle');
      return;
    }
    setPhase('thinking');
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = String(reader.result).split(',')[1] || '';
      api.evaluateViva({
        audio: b64,
        mimeType: mimeRef.current.split(';')[0],
        question: q.question,
        listenFor: q.listen_for,
        grade,
        language: state?.language || 'English',
      })
        .then((fb) => { setFeedback(fb); setResults((r) => [...r, fb]); setPhase('feedback'); })
        .catch(() => { setMicErr(t('viva.evalFail')); setPhase('idle'); });
    };
    reader.readAsDataURL(blob);
  };

  const next = () => {
    if (!questions) return;
    if (qIdx + 1 >= questions.length) {
      // Mark the day active for the streak.
      set && set({
        activityLog: appendActivity(state?.activityLog, {
          kind: 'session', date: new Date().toISOString(), topic: `Viva · ${topics.join(', ')}`,
          score: 0, total: 0,
        }, { oncePerDay: true }),
      });
      setFinished(true);
      return;
    }
    setQIdx((i) => i + 1);
    setFeedback(null);
    setPhase('idle');
  };

  const star = (n: number, filled: boolean, size = 18) => (
    <VIcon key={n} name="star" size={size} color={filled ? 'var(--saffron)' : 'var(--border)'} />
  );

  // ── Loading / error ──
  if (!questions) {
    return (
      <div style={{ minHeight: '100%', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
        <VTopBar showBack onBack={() => go('home')} title={t('viva.topbar')} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, padding: 32 }}>
          <VidyaAvatar size={64} animated />
          <div style={{ fontFamily: 'Inter', fontSize: 14, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.5 }}>
            {loadErr ? t('viva.prepFail') : t('viva.preparing')}
          </div>
          {loadErr && (
            <button className="v-btn-secondary v-tap" onClick={() => go('home')}>{t('viva.backHome')}</button>
          )}
        </div>
      </div>
    );
  }

  // ── Summary ──
  if (finished) {
    const totalStars = results.reduce((a, r) => a + (r.stars || 0), 0);
    return (
      <div style={{ minHeight: '100%', background: 'var(--bg)' }}>
        <VTopBar title={t('viva.doneTitle')} />
        <div style={{ padding: '72px 24px 40px' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <VidyaAvatar size={64} />
            <h1 className="v-h1" style={{ fontSize: 26, margin: '14px 0 6px' }}>{t('viva.greatTalking', { name: state?.name || '' })}</h1>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 6 }}>
              {[1, 2, 3].map((n) => star(n, totalStars >= n * results.length, 22))}
            </div>
            <div style={{ fontFamily: 'Inter', fontSize: 13, color: 'var(--muted)' }}>
              {t('viva.starsEarned', { earned: totalStars, total: results.length * 3 })}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {questions.map((q, i) => (
              <div key={i} className="v-card" style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', gap: 3, marginBottom: 6 }}>
                  {[1, 2, 3].map((n) => star(n, (results[i]?.stars || 0) >= n, 13))}
                </div>
                <div style={{ fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 14, lineHeight: 1.3, marginBottom: 4 }}>{q.question}</div>
                <div style={{ fontFamily: 'Inter', fontSize: 12, color: 'var(--muted)', lineHeight: 1.45 }}>💡 {results[i]?.tip}</div>
              </div>
            ))}
          </div>

          <button className="v-btn-primary v-tap" style={{ width: '100%' }} onClick={() => go('home')}>
            {t('viva.done')} <VIcon name="check" size={14} color="#fff" />
          </button>
        </div>
      </div>
    );
  }

  const q = questions[qIdx];

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <VTopBar showBack onBack={() => go('home')}
        right={<span style={{ fontFamily: 'Inter', fontSize: 12, color: 'var(--muted-2)', fontWeight: 600 }}>{qIdx + 1} / {questions.length}</span>} />
      <div style={{ padding: '72px 24px 32px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontFamily: 'Inter', fontSize: 10, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--indigo)', marginBottom: 10 }}>
          {t('viva.eyebrow')}
        </div>
        <h1 className="v-h1 v-enter" style={{ fontSize: 24, lineHeight: 1.3, marginBottom: 18 }}>{q.question}</h1>

        {micErr && (
          <div style={{ marginBottom: 14, borderRadius: 14, padding: '12px 14px', background: 'var(--bg-warm)', border: '1px solid var(--saffron)', fontFamily: 'Inter', fontSize: 12.5, color: 'var(--ink)', lineHeight: 1.45 }}>
            {micErr}
          </div>
        )}

        {/* Feedback card */}
        {phase === 'feedback' && feedback && (
          <div className="v-enter v-card" style={{ padding: '16px 18px', marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
              {[1, 2, 3].map((n) => star(n, (feedback.stars || 0) >= n))}
            </div>
            <div style={{ fontFamily: 'Inter', fontSize: 13, color: 'var(--ink)', lineHeight: 1.55, marginBottom: 10 }}>{feedback.heard}</div>
            {feedback.good.map((g, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                <VIcon name="check" size={13} color="#1A7A4A" strokeWidth={2.5} />
                <span style={{ flex: 1, fontFamily: 'Inter', fontSize: 12.5, color: '#1A7A4A', lineHeight: 1.45 }}>{g}</span>
              </div>
            ))}
            {feedback.missing.map((m, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                <VIcon name="arrow-right" size={13} color="#B45309" />
                <span style={{ flex: 1, fontFamily: 'Inter', fontSize: 12.5, color: '#B45309', lineHeight: 1.45 }}>{m}</span>
              </div>
            ))}
            <div style={{ marginTop: 10, padding: '10px 12px', background: 'var(--indigo-air)', borderRadius: 12, fontFamily: 'Inter', fontSize: 12.5, color: 'var(--ink)', lineHeight: 1.5 }}>
              💡 {feedback.tip}
            </div>
          </div>
        )}

        <div style={{ flex: 1 }} />

        {/* Mic zone */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, paddingBottom: 8 }}>
          {phase === 'idle' && (
            <>
              <button className="v-tap" onClick={startRecording} aria-label="Start answering"
                style={{ width: 84, height: 84, borderRadius: 9999, border: 'none', background: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(28,25,23,0.25)' }}>
                <VIcon name="mic" size={32} color="#fff" />
              </button>
              <div style={{ fontFamily: 'Inter', fontSize: 12.5, color: 'var(--muted)' }}>{t('viva.micIdleHint')}</div>
            </>
          )}
          {phase === 'recording' && (
            <>
              <button className="v-tap" onClick={stopRecording} aria-label="Done answering"
                style={{ width: 84, height: 84, borderRadius: 9999, border: 'none', background: '#B84030', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 10px rgba(184,64,48,0.15)', animation: 'vPulse 1.2s ease-in-out infinite' }}>
                <div style={{ width: 26, height: 26, borderRadius: 6, background: '#fff' }} />
              </button>
              <div style={{ fontFamily: 'Inter', fontSize: 13, fontWeight: 700, color: '#B84030' }}>
                {t('viva.listening', { time: `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}` })}
              </div>
              <div style={{ fontFamily: 'Inter', fontSize: 12, color: 'var(--muted-2)' }}>{t('viva.stopHint')}</div>
            </>
          )}
          {phase === 'thinking' && (
            <>
              <VidyaAvatar size={64} animated />
              <div style={{ fontFamily: 'Inter', fontSize: 13, color: 'var(--muted)' }}>{t('viva.thinking')}</div>
            </>
          )}
          {phase === 'feedback' && (
            <div style={{ display: 'flex', gap: 10, width: '100%' }}>
              <button className="v-btn-secondary v-tap" style={{ flex: 1 }} onClick={() => { setFeedback(null); setPhase('idle'); setResults((r) => r.slice(0, -1)); }}>
                {t('viva.tryAgain')}
              </button>
              <button className="v-btn-primary v-tap" style={{ flex: 2 }} onClick={next}>
                {qIdx + 1 >= questions.length ? t('viva.finish') : t('viva.nextQuestion')} <VIcon name="arrow-right" size={14} color="#fff" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
