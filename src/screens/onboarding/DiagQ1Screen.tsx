import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import VIcon from '../../prototype/icons';
import { VSoftBackdrop, VTopBar, VOptionButton, VidyaAvatar } from '../../prototype/shared';
import { STATIC_FALLBACK, type GenQ } from '../../content/diagnostic';
import api from '../../api/vidya';
import type { ScreenProps } from '../../types';

// Pick a single goal flavor from the (multi-select) goal answer.
function goalFlavor(goal: unknown): string {
  const goals = Array.isArray(goal) ? goal : goal ? [goal] : [];
  return goals.length === 1 && ['understand', 'practice', 'tests'].includes(goals[0])
    ? (goals[0] as string)
    : 'mixed';
}

export default function DiagQ1Screen({ go, state, set }: ScreenProps) {
  const { t } = useTranslation(['onboarding2', 'common']);
  const grade = api.toGrade(state?.classLevel);

  const [questions, setQuestions] = useState<GenQ[] | null>(null);  // null = generating
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [acked, setAcked] = useState(false);
  const startedRef = useRef(false);

  // Generate the placement set once, tuned to class + goal (no prior data exists).
  // startedRef dedupes the StrictMode double-invoke; on any failure we fall back to
  // the static set so onboarding never hangs.
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    const apply = (qs: GenQ[]) => {
      const set_ = qs && qs.length >= 4 ? qs : STATIC_FALLBACK;
      setQuestions(set_);
      set && set({ diagSet: set_ });
    };
    api.generateDiagnostic({ grade, goal: goalFlavor(state?.goal), language: state?.language || 'English' })
      .then(apply)
      .catch(() => apply(STATIC_FALLBACK));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Generating: show the animated book loader ──
  if (!questions) {
    return (
      <VSoftBackdrop variant="cool">
        <VTopBar showBack onBack={() => go('diag-intro')} transparent />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, padding: 32, minHeight: '70vh' }}>
          <VidyaAvatar size={72} animated />
          <div style={{ fontFamily: 'Inter', fontSize: 14, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.5 }}>
            {t('diagQ.building')}
          </div>
        </div>
      </VSoftBackdrop>
    );
  }

  const total = questions.length;
  const q = questions[idx];
  const isLast = idx === total - 1;

  const restoreFor = (i: number) => {
    const prev = state[`diag_${i}`];
    setPicked(typeof prev === 'number' ? prev : null);
    setAcked(false);
  };
  const goNext = () => {
    if (isLast) { go('diag-building'); return; }
    const n = idx + 1; setIdx(n); restoreFor(n);
  };
  const goPrev = () => {
    if (idx === 0) { go('diag-intro'); return; }
    const p = idx - 1; setIdx(p); restoreFor(p);
  };
  const onPick = (optIdx: number) => {
    if (acked) return;
    setPicked(optIdx);
    set({ [`diag_${idx}`]: optIdx });
    setTimeout(() => setAcked(true), 140);
  };

  return (
    <VSoftBackdrop variant={idx % 2 ? 'warm' : 'cool'}>
      <VTopBar showBack onBack={goPrev} transparent />
      <div style={{ padding: '72px 22px 32px', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        {/* current area pill */}
        <div style={{ display: 'flex', marginBottom: 14 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 9999, background: 'var(--indigo)', color: '#fff' }}>
            <span style={{ fontFamily: 'Inter', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.03em' }}>{t(`diagQ.chapters.${q.area}`, q.area)}</span>
          </div>
        </div>
        <div className="v-progress" style={{ marginBottom: 12 }}>
          <div className="v-progress-fill" style={{ width: `${(idx + 1) / total * 100}%` }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 28, fontFamily: 'Inter', fontSize: 11, color: 'var(--muted-2)', letterSpacing: '0.05em' }}>
          <span>{t('diagQ.questionOf', { value: idx + 1, total })}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--indigo)', fontWeight: 600 }}>
            <VIcon name="sparkles" size={11} color="var(--indigo)" /> {t('diagQ.adapting')}
          </span>
        </div>

        <h1 className="v-h1 v-enter" style={{ fontSize: 26, marginBottom: 24, lineHeight: 1.25 }}>{q.prompt}</h1>

        <div className="v-enter" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {q.options.map((opt, oi) =>
            <VOptionButton key={oi} label={opt}
              selected={picked === oi}
              onClick={() => onPick(oi)} />
          )}
        </div>

        {acked && (
          <div className="v-enter-fade" style={{ marginTop: 18, padding: '14px 18px', borderRadius: 16, background: 'rgba(255,255,255,0.7)', border: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 24, height: 24, borderRadius: 9999, background: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <VIcon name="check" size={12} color="#fff" strokeWidth={2.5} />
            </div>
            <div style={{ fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 16, color: 'var(--ink)' }}>
              {isLast ? t('diagQ.gotItLast') : t('diagQ.gotItNext')}
            </div>
          </div>
        )}

        <div style={{ flex: 1, minHeight: 24 }} />
        <button className="v-btn-primary v-tap" onClick={goNext} disabled={!acked} style={{ opacity: acked ? 1 : 0.4 }}>
          {isLast ? t('diagQ.finish') : t('common:continue')} <VIcon name="arrow-right" size={14} color="#fff" />
        </button>
      </div>
    </VSoftBackdrop>
  );
}
