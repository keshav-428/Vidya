import React from 'react';
import VIcon from '../../prototype/icons';
import { VTopBar, VSoftBackdrop, VOptionButton } from '../../prototype/shared';

function OnbShell({ variant = 'warm', back, progress, children, primaryDisabled, onPrimary, primaryLabel = 'Continue' }) {
  return (
    <VSoftBackdrop variant={variant}>
      <VTopBar showBack={!!back} onBack={back} transparent />
      <div style={{ padding: '72px 24px 32px', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        {progress && <>
          <div className="v-progress" style={{ marginBottom: 12 }}>
            <div className="v-progress-fill" style={{ width: `${progress.value / progress.total * 100}%` }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 28, fontFamily: 'Inter', fontSize: 11, color: 'var(--muted-2)', letterSpacing: '0.05em' }}>
            <span>{`Step ${progress.value} of ${progress.total}`}</span>
            <span>{Math.round(progress.value / progress.total * 100)}%</span>
          </div>
        </>}
        {children}
        <div style={{ flex: 1, minHeight: 24 }} />
        <button className="v-btn-primary v-tap" onClick={onPrimary} disabled={primaryDisabled}
          style={{ opacity: primaryDisabled ? 0.4 : 1 }}>
          {primaryLabel} <VIcon name="arrow-right" size={14} color="#fff" />
        </button>
      </div>
    </VSoftBackdrop>
  );
}

export default function GoalScreen({ go, state, set }) {
  const goals = Array.isArray(state.goal) ? state.goal : state.goal ? [state.goal] : [];
  const toggle = (id) => {
    let next;
    if (id === 'unsure') {
      next = goals.includes('unsure') ? [] : ['unsure'];
    } else {
      const without = goals.filter((g) => g !== 'unsure' && g !== id);
      next = goals.includes(id) ? without : [...without, id];
    }
    set({ goal: next });
  };
  return (
    <OnbShell variant="cool" back={() => go('onb-subject')}
      progress={{ value: 4, total: 5 }}
      onPrimary={() => go('onb-name')}
      primaryDisabled={goals.length === 0}>
      <h1 className="v-h1 v-enter" style={{ fontSize: 30, marginBottom: 8 }}>
        What do you need<br />help with most?
      </h1>
      <p className="v-enter" style={{ fontFamily: 'Inter', fontSize: 14, color: 'var(--muted)', marginBottom: 28, lineHeight: 1.5 }}>
        Pick one or more. You can change this anytime.
      </p>
      <div className="v-enter" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          { id: 'understand', label: 'Understand concepts', sub: 'I want the "why" behind topics' },
          { id: 'practice', label: 'Practice better', sub: 'I want more questions to try' },
          { id: 'tests', label: 'Prepare for tests', sub: 'I have a test coming up' },
          { id: 'unsure', label: "I'm not sure", sub: "Let Vidya decide for me" }
        ].map((o) =>
          <VOptionButton key={o.id} label={o.label} sub={o.sub} multi
            selected={goals.includes(o.id)}
            onClick={() => toggle(o.id)} />
        )}
      </div>
    </OnbShell>
  );
}
