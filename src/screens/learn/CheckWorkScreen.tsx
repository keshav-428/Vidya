import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import VIcon from '../../prototype/icons';
import { VTopBar, VidyaAvatar } from '../../prototype/shared';
import { classChapters } from '../../content/syllabus';
import api from '../../api/vidya';
import type { ScreenProps, CheckWorkResult, CheckedQuestion, Verdict, PracticeSelection } from '../../types';

// ─────────────────────────────────────────────────────────────
//  "How did I do?" — marks the student's OWN working.
//
//  A tick and a cross is what school already gives them, and it teaches
//  nothing. What this screen is for is the line where it went wrong, and
//  the case where the answer is right but the method is fragile.
//
//  When the page has no working on it, the same call comes back in
//  'hints' mode instead — a blank page means they're stuck, not that
//  they wanted something else.
// ─────────────────────────────────────────────────────────────

const VERDICT_TONE: Record<Exclude<Verdict, ''>, { bg: string; fg: string; border: string; icon: string }> = {
  correct:                   { bg: '#EDFAF3', fg: '#1A7A4A', border: '#A8D5B9', icon: 'check' },
  right_method_wrong_answer: { bg: '#FCF4E6', fg: '#B45309', border: '#EBD5A8', icon: 'target' },
  wrong:                     { bg: '#FBEFE8', fg: '#C2410C', border: '#EFC6AE', icon: 'x' },
  incomplete:                { bg: 'var(--indigo-air)', fg: 'var(--indigo)', border: 'var(--border)', icon: 'chevron-right' },
  unreadable:                { bg: 'var(--bg-warm)', fg: 'var(--muted)', border: 'var(--border)', icon: 'camera' },
};

function QuestionCard({ q, idx, mode }: { q: CheckedQuestion; idx: number; mode: 'marked' | 'hints' }) {
  const { t } = useTranslation(['learn', 'common']);
  const [open, setOpen] = useState(false);
  const verdict = (q.verdict || '') as Verdict;
  const tone = verdict ? VERDICT_TONE[verdict] : null;

  return (
    <div className="v-card" style={{ padding: 0, overflow: 'hidden' }}>
      <div className="v-tap" onClick={() => setOpen((o) => !o)}
        style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px' }}>
        <div style={{
          width: 28, height: 28, borderRadius: 9999, flexShrink: 0,
          background: tone ? tone.bg : 'var(--indigo-air)',
          color: tone ? tone.fg : 'var(--indigo)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Inter', fontSize: 11.5, fontWeight: 700,
        }}>
          {q.number || idx + 1}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Inter', fontSize: 13.5, color: 'var(--ink)', lineHeight: 1.5 }}>{q.question}</div>
          {mode === 'marked' && verdict && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                background: tone!.bg, color: tone!.fg, border: `1px solid ${tone!.border}`,
                borderRadius: 9999, padding: '3px 9px',
                fontFamily: 'Inter', fontSize: 10.5, fontWeight: 700,
              }}>
                <VIcon name={tone!.icon} size={10} color={tone!.fg} strokeWidth={2.5} />
                {t(`checkWork.verdict.${verdict}`)}
              </span>
              {q.correct_but_slow && (
                <span style={{
                  background: 'var(--indigo-air)', color: 'var(--indigo)', borderRadius: 9999,
                  padding: '3px 9px', fontFamily: 'Inter', fontSize: 10.5, fontWeight: 700,
                }}>
                  {t('checkWork.slowBadge')}
                </span>
              )}
            </div>
          )}
        </div>
        <VIcon name={open ? 'chevron-down' : 'chevron-right'} size={15} color="var(--muted-2)" />
      </div>

      {open && (
        <div className="v-enter-fade" style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border-soft)' }}>
          {/* The whole point of the screen: which line went wrong. */}
          {q.broke_at && (
            <div style={{ marginTop: 14, padding: '11px 13px', background: 'var(--bg-warm)', borderRadius: 12 }}>
              <div className="v-eyebrow-sm" style={{ marginBottom: 3 }}>{t('checkWork.brokeAt')}</div>
              <div style={{ fontFamily: 'Inter', fontSize: 12.5, color: 'var(--ink)', lineHeight: 1.5 }}>{q.broke_at}</div>
            </div>
          )}
          {q.improve && (
            <div style={{ marginTop: 10, padding: '11px 13px', background: 'var(--indigo-air)', borderRadius: 12 }}>
              <div className="v-eyebrow-sm" style={{ marginBottom: 3 }}>{t('checkWork.improve')}</div>
              <div style={{ fontFamily: 'Inter', fontSize: 12.5, color: 'var(--ink)', lineHeight: 1.5 }}>{q.improve}</div>
            </div>
          )}
          {/* Hints mode: nudge first, exactly as homework help used to. */}
          {q.hint && (
            <div style={{ marginTop: 14, padding: '11px 13px', background: 'var(--indigo-air)', borderRadius: 12 }}>
              <div className="v-eyebrow-sm" style={{ marginBottom: 3 }}>{t('homework.hint')}</div>
              <div style={{ fontFamily: 'Inter', fontSize: 12.5, color: 'var(--ink)', lineHeight: 1.5 }}>{q.hint}</div>
            </div>
          )}
          {q.next_step && (
            <div style={{ marginTop: 10, padding: '11px 13px', background: 'var(--bg-warm)', borderRadius: 12 }}>
              <div className="v-eyebrow-sm" style={{ marginBottom: 3 }}>{t('homework.firstStep')}</div>
              <div style={{ fontFamily: 'Inter', fontSize: 12.5, color: 'var(--ink)', lineHeight: 1.5 }}>{q.next_step}</div>
            </div>
          )}

          {(q.steps || []).length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div className="v-eyebrow-sm" style={{ marginBottom: 8 }}>{t('checkWork.working')}</div>
              {(q.steps || []).map((st, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 20, height: 20, borderRadius: 9999, background: 'var(--indigo-air)', color: 'var(--indigo)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'Inter', fontSize: 10, fontWeight: 700 }}>{i + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'Inter', fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>{st.label}</div>
                    <div style={{ fontFamily: 'Inter', fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.5 }}>{st.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {(q.correct_answer || q.answer) && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#EDFAF3', border: '1px solid #A8D5B9', borderRadius: 12, padding: '9px 13px', marginTop: 4 }}>
              <VIcon name="check" size={13} color="#1A7A4A" strokeWidth={2.5} />
              <span style={{ fontFamily: 'Inter', fontSize: 13, fontWeight: 700, color: '#1A7A4A' }}>{q.correct_answer || q.answer}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CheckWorkScreen({ go, set, state }: ScreenProps) {
  const { t } = useTranslation(['learn', 'common']);
  const cls = api.toGrade(state?.classLevel);
  const [result, setResult] = useState<CheckWorkResult | null>((state?.checkResult as CheckWorkResult) || null);
  const images = (state?.photoImages as string[]) || [];
  // Both start settled when there's nothing to fetch — already marked, or no
  // photo to mark — so returning to this screen never flashes a spinner or
  // pays for a second vision call.
  const [busy, setBusy] = useState(!result && images.length > 0);
  const [err, setErr] = useState<string | null>(
    !result && !images.length ? t('checkWork.errNoPhoto') : null,
  );

  useEffect(() => {
    if (result || !images.length) return;
    let live = true;
    const chapters = classChapters(cls);
    api.checkWork({
      images,
      mimeTypes: (state?.photoMimes as string[]) || null,
      // Real NCERT ids come back in weak_sections, so "learn what I got
      // wrong" can open the actual subtopic rather than a guessed title.
      syllabus: chapters.map((c) => ({
        chapter_id: c.id,
        chapter_title: c.title,
        subtopics: c.subtopics.map((sb) => ({ section: sb.num, title: sb.title })),
      })),
      grade: cls,
      language: state?.language || 'English',
    })
      .then((res) => {
        if (!live) return;
        setBusy(false);
        if (!res.detected || !res.questions?.length) { setErr(res.summary || t('checkWork.errNone')); return; }
        setResult(res);
        set && set({ checkResult: res });
      })
      .catch(() => { if (live) { setBusy(false); setErr(t('checkWork.errGeneric')); } });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once for this photo
  }, []);

  const weak = result?.weak_sections || [];

  // The follow-up that makes marking worth doing: teach exactly the subtopics
  // behind the wrong answers, then quiz those same ones.
  const learnWeak = () => {
    const sel: PracticeSelection[] = weak.map((w) => ({ chapterId: w.chapter_id, section: w.section, title: w.title }));
    if (!sel.length) return;
    set && set({ lessonSel: sel, lessonNext: 'navigable-quiz', revisionSel: sel });
    go('learn-concept');
  };

  const quizWeak = () => {
    const sel: PracticeSelection[] = weak.map((w) => ({ chapterId: w.chapter_id, section: w.section, title: w.title }));
    if (!sel.length) return;
    const first = weak[0];
    set && set({ quizScope: { chapterId: first.chapter_id, section: first.section, topic: first.title }, skillId: null });
    go('navigable-quiz');
  };

  if (busy) {
    return (
      <div style={{ minHeight: '100%', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
        <VTopBar transparent showBack onBack={() => go('photo-options')} title={t('checkWork.topbar')} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, padding: 32, minHeight: '70vh' }}>
          <VidyaAvatar size={64} animated />
          <div style={{ fontFamily: 'Inter', fontSize: 14, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.5 }}>
            {t('checkWork.reading')}
          </div>
        </div>
      </div>
    );
  }

  if (err || !result) {
    return (
      <div style={{ minHeight: '100%', background: 'var(--bg)' }}>
        <VTopBar transparent showBack onBack={() => go('photo-options')} title={t('checkWork.topbar')} />
        <div style={{ padding: '72px 22px 40px' }}>
          <div style={{ marginBottom: 16, borderRadius: 14, padding: '12px 14px', background: 'var(--bg-warm)', border: '1px solid var(--saffron)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <VIcon name="camera" size={15} color="var(--saffron)" />
            <div style={{ flex: 1, fontFamily: 'Inter', fontSize: 12.5, color: 'var(--ink)', lineHeight: 1.45 }}>{err}</div>
          </div>
          <button className="v-btn-secondary v-tap" style={{ width: '100%' }} onClick={() => go('home')}>
            <VIcon name="camera" size={14} color="var(--ink)" /> {t('checkWork.tryAnother')}
          </button>
        </div>
      </div>
    );
  }

  const marked = result.mode === 'marked';

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)' }}>
      <VTopBar transparent showBack onBack={() => go('photo-options')} title={t('checkWork.topbar')} />
      <div style={{ padding: '72px 22px 40px' }}>
        <div className="v-eyebrow" style={{ marginBottom: 6 }}>
          {marked ? t('checkWork.eyebrowMarked') : t('checkWork.eyebrowHints')}
        </div>
        <h1 className="v-h1" style={{ fontSize: 26, marginBottom: 8, lineHeight: 1.18 }}>
          {marked
            ? t('checkWork.score', { correct: result.correct, total: result.total })
            : t('checkWork.found', { count: result.total })}
        </h1>
        <p className="v-body" style={{ marginBottom: 20 }}>{result.summary}</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {result.questions.map((q, i) => <QuestionCard key={i} q={q} idx={i} mode={result.mode} />)}
        </div>

        {/* "These went wrong — want to fix them?" The offer only exists when
            there is something specific to teach. */}
        {marked && weak.length > 0 && (
          <div className="v-card" style={{ padding: '18px 18px 16px', marginBottom: 14 }}>
            <div className="v-eyebrow-sm" style={{ marginBottom: 6 }}>{t('checkWork.nextEyebrow')}</div>
            <div style={{ fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 17, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.2, marginBottom: 6 }}>
              {t('checkWork.nextTitle', { count: weak.length })}
            </div>
            <div style={{ fontFamily: 'Inter', fontSize: 12.5, color: 'var(--muted-2)', lineHeight: 1.45, marginBottom: 14 }}>
              {weak.map((w) => w.title).join(' · ')}
            </div>
            <button className="v-btn-primary v-tap" style={{ marginBottom: 8 }} onClick={learnWeak}>
              {t('checkWork.learnThese')} <VIcon name="arrow-right" size={14} color="#fff" />
            </button>
            <button className="v-btn-secondary v-tap" onClick={quizWeak}>
              {t('checkWork.quizThese')}
            </button>
          </div>
        )}

        <button className="v-btn-secondary v-tap" style={{ width: '100%' }}
          onClick={() => { set && set({ photoImages: null, photoMimes: null, photoAnalysis: null, checkResult: null }); go('home'); }}>
          <VIcon name="camera" size={14} color="var(--ink)" /> {t('checkWork.tryAnother')}
        </button>
      </div>
    </div>
  );
}
