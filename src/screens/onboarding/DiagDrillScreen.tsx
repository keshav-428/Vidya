import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import VIcon from '../../prototype/icons';
import { VSoftBackdrop, VTopBar, VOptionButton, VidyaAvatar } from '../../prototype/shared';
import { scoreDrillSet } from '../../content/diagnostic';
import { type DiagnosticDrillQ } from '../../api/vidya';
import api from '../../api/vidya';
import type { ScreenProps } from '../../types';

export default function DiagDrillScreen({ go, state, set }: ScreenProps) {
  const { t } = useTranslation(['onboarding2', 'common']);

  const questions = (state?.diagDrillQuestions as DiagnosticDrillQ[]) || [];
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const lockRef = React.useRef(false);

  if (!questions || questions.length === 0) {
    go('diag-result');
    return null;
  }

  const total = questions.length;
  const q = questions[idx];
  const isLast = idx === total - 1;
  const answered = picked !== null;

  const restoreFor = (i: number) => {
    const prev = state?.[`drill_${i}`];
    setPicked(typeof prev === 'number' ? prev : null);
    lockRef.current = false;
  };

  const goNext = () => {
    if (isLast) {
      const answers = questions.map((_, i) => {
        const ans = state?.[`drill_${i}`];
        return typeof ans === 'number' ? ans : null;
      });
      const drillOutcome = scoreDrillSet(questions, answers);
      set && set({ diagDrillOutcome: drillOutcome });
      go('diag-result');
      return;
    }
    const n = idx + 1;
    setIdx(n);
    restoreFor(n);
  };

  const goPrev = () => {
    if (idx === 0) {
      go('diag-summary');
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
    set && set({ [`drill_${idx}`]: optIdx });
    setTimeout(goNext, 850);
  };

  return (
    <VSoftBackdrop variant={idx % 2 ? 'warm' : 'cool'}>
      <VTopBar showBack onBack={goPrev} transparent />
      <div style={{ padding: '72px 22px 32px', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        {/* Subtopic badge */}
        <div style={{ display: 'flex', marginBottom: 14 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 9999, background: 'var(--accent-blue)', color: '#fff' }}>
            <span style={{ fontFamily: 'Inter', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.03em' }}>
              Subtopic: {q.subtopic}
            </span>
          </div>
        </div>

        <div className="v-progress" style={{ marginBottom: 12 }}>
          <div className="v-progress-fill" style={{ width: `${(idx + 1) / total * 100}%` }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 28, fontFamily: 'Inter', fontSize: 11, color: 'var(--muted-2)', letterSpacing: '0.05em' }}>
          <span>Question {idx + 1} of {total}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--accent-blue)', fontWeight: 600 }}>
            <VIcon name="zap" size={11} color="var(--accent-blue)" /> Deep dive
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
