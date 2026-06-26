import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import VIcon from '../../prototype/icons';
import { VTopBar } from '../../prototype/shared';
import api from '../../api/vidya';
import type { ScreenProps, QuizFeedback } from '../../types';

interface QuizMistake {
  question: string;
  user_answer: unknown;
  correct_answer: unknown;
}

export default function SessionAnalysisScreen({ go, state }: ScreenProps) {
  const { t } = useTranslation('progress');
  const topicTitle = (state?.lastQuizTopic as string | undefined) || 'Fractions';

  const score = (state?.lastQuizScore as number | undefined) ?? 4;
  const total = (state?.lastQuizTotal as number | undefined) ?? 5;
  const pct = Math.round((score / total) * 100);
  const mistakes = (state?.lastQuizMistakes as QuizMistake[] | undefined) || [];

  // LLM quiz feedback: { win, pattern, next_step }
  const [feedback, setFeedback] = useState<QuizFeedback | null>(null);   // null = loading
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    api.quizFeedback({
      userId: state?.userId || 'local-student',
      topic: topicTitle,
      score, total, mistakes,
      language: state?.language || 'English',
    })
      .then((d) => {
        // backend may return an object or a JSON string
        let parsed = d;
        if (typeof d === 'string') { try { parsed = JSON.parse(d); } catch { parsed = { win: d }; } }
        if (alive) setFeedback(parsed || {});
      })
      .catch(() => { if (alive) { setFailed(true); setFeedback({}); } });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scoreColor = pct >= 80 ? '#1A7A4A' : pct >= 60 ? '#B45309' : '#B84030';
  const scoreBg = pct >= 80 ? '#EDFAF3' : pct >= 60 ? '#FFFBEB' : '#FEF2F2';
  const topic = { title: topicTitle };

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)', position: 'relative' }}>
      <VTopBar transparent showBack onBack={() => go('home')} title={t('analysis.topbarTitle')} />
      <div style={{ padding: '72px 22px 100px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        <div className="v-enter">
          <div style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: 6 }}>
            {t('analysis.sessionLabel', { topic: topic.title })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '18px 20px', background: scoreBg, borderRadius: 18, border: '1px solid ' + scoreColor + '33' }}>
            <div style={{ textAlign: 'center', flexShrink: 0 }}>
              <div style={{ fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 44, fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{score}</div>
              <div style={{ fontFamily: 'Inter', fontSize: 11, color: scoreColor + 'aa', marginTop: 2 }}>{t('analysis.outOf', { total })}</div>
            </div>
            <div style={{ width: 1, height: 48, background: scoreColor + '33', flexShrink: 0 }} />
            <div>
              <div style={{ fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 16, fontWeight: 700, color: scoreColor, marginBottom: 3 }}>
                {pct >= 80 ? t('analysis.verdict.strong') : pct >= 60 ? t('analysis.verdict.good') : t('analysis.verdict.needsPractice')}
              </div>
              <div style={{ fontFamily: 'Inter', fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
                {pct >= 80 ? t('analysis.verdictSub.strong') : pct >= 60 ? t('analysis.verdictSub.good') : t('analysis.verdictSub.needsPractice')}
              </div>
            </div>
          </div>
        </div>

        {/* LLM feedback — loading */}
        {!feedback && (
          <div className="v-enter" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '18px 20px', background: '#fff', borderRadius: 14, border: '1px solid var(--border)' }}>
            <span className="v-spin" style={{ width: 18, height: 18, border: '2px solid var(--border)', borderTopColor: 'var(--indigo)', borderRadius: '50%', flexShrink: 0 }} />
            <div style={{ fontFamily: 'Inter', fontSize: 13, color: 'var(--muted)' }}>{t('analysis.loading')}</div>
          </div>
        )}

        {/* What you understood */}
        {feedback?.win && (
          <div className="v-enter">
            <div style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: 10 }}>
              {t('analysis.whatYouUnderstood')}
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '13px 15px', background: '#EDFAF3', borderRadius: 12, border: '1px solid #1A7A4A22' }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                <VIcon name="check" size={11} color="#1A7A4A" strokeWidth={2.5} />
              </div>
              <div style={{ fontFamily: 'Inter', fontSize: 13, color: 'var(--ink)', lineHeight: 1.55 }}>{feedback.win}</div>
            </div>
          </div>
        )}

        {/* The pattern in your mistakes */}
        {feedback?.pattern && (
          <div className="v-enter">
            <div style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: 10 }}>
              What to improve
            </div>
            <div style={{ padding: '13px 15px', background: '#FFF7ED', borderRadius: 12, border: '1px solid #B4530922' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                  <VIcon name="x" size={11} color="#B84030" strokeWidth={2.5} />
                </div>
                <div style={{ fontFamily: 'Inter', fontSize: 13, color: 'var(--ink)', lineHeight: 1.55 }}>{feedback.pattern}</div>
              </div>
              {mistakes.length > 0 && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #B4530922', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {mistakes.map((m, i) => (
                    <div key={i} style={{ fontFamily: 'Inter', fontSize: 11, color: 'var(--muted)', lineHeight: 1.45 }}>
                      <span style={{ color: 'var(--ink)', fontWeight: 600 }}>{m.question}</span> — you chose {String(m.user_answer)}, answer was {String(m.correct_answer)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Next step strategy */}
        {feedback?.next_step && (
          <div className="v-enter">
            <div style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: 10 }}>
              Your next step
            </div>
            <div className="v-tap" onClick={() => go('practice')} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', background: '#fff', borderRadius: 12, border: '1px solid var(--border)' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--indigo-air)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <VIcon name="target" size={12} color="var(--indigo)" />
              </div>
              <div style={{ flex: 1, fontFamily: 'Inter', fontSize: 13, color: 'var(--ink)', lineHeight: 1.45 }}>{feedback.next_step}</div>
              <VIcon name="arrow-right" size={13} color="var(--muted-2)" />
            </div>
          </div>
        )}

        {failed && (
          <div className="v-enter" style={{ fontFamily: 'Inter', fontSize: 12, color: 'var(--muted-2)', textAlign: 'center' }}>
            Couldn't load Vidya's analysis — your score is saved above.
          </div>
        )}

        <button className="v-btn-primary v-tap v-enter" onClick={() => go('home')} style={{ marginTop: 4 }}>
          Done — back to home <VIcon name="check" size={14} color="#fff" />
        </button>
      </div>
    </div>
  );
}
