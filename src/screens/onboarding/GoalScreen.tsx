import React from 'react';
import { useTranslation } from 'react-i18next';
import VIcon from '../../prototype/icons';
import { VTopBar, VSoftBackdrop, VOptionButton } from '../../prototype/shared';
import type { ScreenProps } from '../../types';

interface OnbShellProps {
  variant?: string;
  back?: () => void;
  progress?: { value: number; total: number };
  children?: React.ReactNode;
  primaryDisabled?: boolean;
  onPrimary?: () => void;
  primaryLabel?: React.ReactNode;
}

function OnbShell({ variant = 'warm', back, progress, children, primaryDisabled, onPrimary, primaryLabel }: OnbShellProps) {
  const { t } = useTranslation('common');
  return (
    <VSoftBackdrop variant={variant}>
      <VTopBar showBack={!!back} onBack={back} transparent />
      <div style={{ padding: '72px 24px 32px', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        {progress && <>
          <div className="v-progress" style={{ marginBottom: 12 }}>
            <div className="v-progress-fill" style={{ width: `${progress.value / progress.total * 100}%` }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 28, fontFamily: 'Inter', fontSize: 11, color: 'var(--muted-2)', letterSpacing: '0.05em' }}>
            <span>{t('stepOf', { value: progress.value, total: progress.total })}</span>
            <span>{Math.round(progress.value / progress.total * 100)}%</span>
          </div>
        </>}
        {children}
        <div style={{ flex: 1, minHeight: 24 }} />
        <button className="v-btn-primary v-tap" onClick={onPrimary} disabled={primaryDisabled}
          style={{ opacity: primaryDisabled ? 0.4 : 1 }}>
          {primaryLabel || t('continue')} <VIcon name="arrow-right" size={14} color="#fff" />
        </button>
      </div>
    </VSoftBackdrop>
  );
}

export default function GoalScreen({ go, state, set }: ScreenProps) {
  const { t } = useTranslation('onboarding');
  const rawGoal = state.goal as string | string[] | undefined;
  const goals: string[] = Array.isArray(rawGoal) ? rawGoal : rawGoal ? [rawGoal] : [];
  const toggle = (id: string) => {
    let next: string[];
    if (id === 'unsure') {
      next = goals.includes('unsure') ? [] : ['unsure'];
    } else {
      const without = goals.filter((g) => g !== 'unsure' && g !== id);
      next = goals.includes(id) ? without : [...without, id];
    }
    set({ goal: next as unknown as string });
  };
  return (
    <OnbShell variant="cool" back={() => go('onb-subject')}
      progress={{ value: 4, total: 5 }}
      onPrimary={() => go('onb-name')}
      primaryDisabled={goals.length === 0}>
      <h1 className="v-h1 v-enter" style={{ fontSize: 30, marginBottom: 8, whiteSpace: 'pre-line' }}>
        {t('goal.title')}
      </h1>
      <p className="v-enter" style={{ fontFamily: 'Inter', fontSize: 14, color: 'var(--muted)', marginBottom: 28, lineHeight: 1.5 }}>
        {t('goal.subtitle')}
      </p>
      <div className="v-enter" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          { id: 'understand', label: t('goal.understand'), sub: t('goal.understandSub') },
          { id: 'practice', label: t('goal.practice'), sub: t('goal.practiceSub') },
          { id: 'tests', label: t('goal.tests'), sub: t('goal.testsSub') },
          { id: 'unsure', label: t('goal.unsure'), sub: t('goal.unsureSub') }
        ].map((o) =>
          <VOptionButton key={o.id} label={o.label} sub={o.sub} multi
            selected={goals.includes(o.id)}
            onClick={() => toggle(o.id)} />
        )}
      </div>
    </OnbShell>
  );
}
