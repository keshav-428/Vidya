import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import VIcon from '../../prototype/icons';
import { VSoftBackdrop, VTopBar, VOptionButton, VidyaAvatar } from '../../prototype/shared';
import { STATIC_FALLBACK, scoreFromSet, weakestChapterForDrill, scoreDrillSet, type GenQ } from '../../content/diagnostic';
import api, { type DiagnosticDrillQ } from '../../api/vidya';
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

  const [phase, setPhase] = useState<'initial' | 'drill'>('initial');
  const [initialQuestions, setInitialQuestions] = useState<GenQ[] | null>(null);  // null = generating
  const [drillQuestions, setDrillQuestions] = useState<DiagnosticDrillQ[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const startedRef = useRef(false);
  const lockRef = useRef(false);

  // Generate initial diagnostic (chapter-level, ~10 questions).
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    const apply = (qs: GenQ[]) => {
      const set_ = qs && qs.length >= 4 ? qs : STATIC_FALLBACK;
      setInitialQuestions(set_);
      set && set({ diagSet: set_ });
    };
    api.generateDiagnostic({ grade, goal: goalFlavor(state?.goal), language: state?.language || 'English' })
      .then(apply)
      .catch(() => apply(STATIC_FALLBACK));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When initial diagnostic completes, go to summary screen to show findings.
  const onInitialComplete = () => {
    if (!initialQuestions) return;
    const answers = initialQuestions.map((_, i) => {
      const ans = state?.[`diag_${i}`];
      return typeof ans === 'number' ? ans : null;
    });
    const outcome = scoreFromSet(initialQuestions, answers);
    set && set({ diagOutcome: outcome });
    go('diag-summary');
  };

  // ── Loading: show animated book loader ──
  const isGenerating = (phase === 'initial' && !initialQuestions) || (phase === 'drill' && !drillQuestions);
  if (isGenerating) {
    return (
      <VSoftBackdrop variant="cool">
        <VTopBar showBack onBack={() => (phase === 'drill' ? setPhase('initial') : go('diag-intro'))} transparent />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, padding: 32, minHeight: '70vh' }}>
          <VidyaAvatar size={72} animated />
          <div style={{ fontFamily: 'Inter', fontSize: 14, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.5 }}>
            {phase === 'drill' ? t('diagQ.drilling') || 'Analyzing your answers...' : t('diagQ.building')}
          </div>
        </div>
      </VSoftBackdrop>
    );
  }

  const questions = phase === 'initial' ? initialQuestions : drillQuestions;
  if (!questions) {
    go('diag-intro');
    return null;
  }

  const total = questions.length;
  const q = questions[idx];
  const isLast = idx === total - 1;
  const isDrill = phase === 'drill';

  const answered = picked !== null;
  const restoreFor = (i: number) => {
    const stateKey = isDrill ? `drill_${i}` : `diag_${i}`;
    const prev = state?.[stateKey];
    setPicked(typeof prev === 'number' ? prev : null);
    lockRef.current = false;
  };
  const goNext = () => {
    if (isLast) {
      if (isDrill) {
        go('diag-building');
      } else {
        onInitialComplete();
      }
      return;
    }
    const n = idx + 1;
    setIdx(n);
    restoreFor(n);
  };
  const goPrev = () => {
    if (idx === 0) {
      if (isDrill) {
        setPhase('initial');
        setIdx(initialQuestions!.length - 1);
      } else {
        go('diag-intro');
      }
      return;
    }
    const p = idx - 1;
    setIdx(p);
    restoreFor(p);
  };
  const onPick = (optIdx: number) => {
    if (lockRef.current || answered) return;
    lockRef.current = true;
    setPicked(optIdx);
    const stateKey = isDrill ? `drill_${idx}` : `diag_${idx}`;
    set && set({ [stateKey]: optIdx });
    setTimeout(goNext, 850);
  };

  return (
    <VSoftBackdrop variant={idx % 2 ? 'warm' : 'cool'}>
      <VTopBar showBack onBack={goPrev} transparent />
      <div style={{ padding: '72px 22px 32px', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        {/* current area/subtopic pills */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          {!isDrill && (q as GenQ).area && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 9999, background: 'var(--indigo)', color: '#fff' }}>
              <span style={{ fontFamily: 'Inter', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.03em' }}>
                {t(`diagQ.chapters.${(q as GenQ).area}`, (q as GenQ).area)}
              </span>
            </div>
          )}
          {('subtopic' in q && (q as DiagnosticDrillQ).subtopic) && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 9999, background: 'var(--accent-blue)', color: '#fff' }}>
              <span style={{ fontFamily: 'Inter', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.03em' }}>
                Subtopic: {(q as DiagnosticDrillQ).subtopic}
              </span>
            </div>
          )}
        </div>
        <div className="v-progress" style={{ marginBottom: 12 }}>
          <div className="v-progress-fill" style={{ width: `${(idx + 1) / total * 100}%` }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 28, fontFamily: 'Inter', fontSize: 11, color: 'var(--muted-2)', letterSpacing: '0.05em' }}>
          <span>{t('diagQ.questionOf', { value: idx + 1, total })}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--indigo)', fontWeight: 600 }}>
            <VIcon name="sparkles" size={11} color="var(--indigo)" /> {isDrill ? 'Pinpointing...' : t('diagQ.adapting')}
          </span>
        </div>

        <h1 className="v-h1 v-enter" style={{ fontSize: 26, marginBottom: 24, lineHeight: 1.25 }}>{q.prompt}</h1>

        <div className="v-enter" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {q.options.map((opt: string, oi: number) => {
            const isCorrect = oi === q.correct_index;
            return (
              <VOptionButton key={oi} label={opt}
                selected={!answered && picked === oi}
                correct={answered && isCorrect}
                wrong={answered && picked === oi && !isCorrect}
                onClick={() => onPick(oi)} />
            );
          })}
        </div>
        <div style={{ flex: 1, minHeight: 24 }} />
      </div>
    </VSoftBackdrop>
  );
}
