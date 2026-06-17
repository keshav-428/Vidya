import React, { useState, useEffect } from 'react';
import VIcon from '../../prototype/icons';
import { VTopBar, VSoftBackdrop } from '../../prototype/shared';

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

export default function NameScreen({ go, state, set }) {
  const [name, setName] = useState(state.name || '');
  useEffect(() => { setName(state.name || ''); }, [state.name]);
  const onContinue = () => {
    const n = name.trim();
    if (!n) return;
    set({ name: n });
    go('diag-intro');
  };
  return (
    <OnbShell variant="warm" back={() => go('onb-goal')}
      progress={{ value: 5, total: 5 }}
      onPrimary={onContinue}
      primaryDisabled={!name.trim()}>
      <h1 className="v-h1 v-enter" style={{ fontSize: 30, marginBottom: 8 }}>
        Last thing —<br />what's your name?
      </h1>
      <p className="v-enter" style={{ fontFamily: 'Inter', fontSize: 14, color: 'var(--muted)', marginBottom: 28, lineHeight: 1.5 }}>
        Just so Vidya knows what to call you.
      </p>
      <div className="v-enter">
        <div className="v-eyebrow" style={{ marginBottom: 8 }}>Your name</div>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Aarav"
          autoFocus
          style={{ width: '100%', padding: '18px 18px', background: '#fff', border: '1px solid var(--border)', borderRadius: 18, fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 22, outline: 'none', color: 'var(--ink)' }} />
        <p style={{ fontSize: 12, color: 'var(--muted-2)', marginTop: 12, lineHeight: 1.5 }}>
          We use this only inside the app. Nothing is shared.
        </p>
      </div>
    </OnbShell>
  );
}
