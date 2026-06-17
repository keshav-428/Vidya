import React from 'react';
import VIcon from '../../prototype/icons';
import { VTopBar, VSoftBackdrop, VOptionButton } from '../../prototype/shared';

function RoleCard({ active, onClick, icon, title, sub, disabled }) {
  return (
    <div className="v-tap" onClick={disabled ? undefined : onClick} style={{
      display: 'flex', alignItems: 'center', gap: 16,
      padding: '20px 22px',
      background: active ? 'var(--ink)' : '#fff',
      color: active ? '#fff' : 'var(--ink)',
      border: active ? '1.5px solid var(--ink)' : '1px solid var(--border)',
      borderRadius: 22,
      opacity: disabled ? 0.4 : 1,
      cursor: disabled ? 'not-allowed' : 'default',
      transition: 'all 160ms ease'
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 14,
        background: active ? 'rgba(255,255,255,0.12)' : 'var(--indigo-air)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
      }}>
        <VIcon name={icon} size={20} color={active ? '#fff' : 'var(--indigo)'} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 20, fontWeight: 500, marginBottom: 2, letterSpacing: '-0.01em' }}>{title}</div>
        <div style={{ fontSize: 12.5, color: active ? 'rgba(255,255,255,0.7)' : 'var(--muted-2)', lineHeight: 1.4 }}>{sub}</div>
      </div>
      <VIcon name="arrow-right" size={16} color={active ? '#fff' : 'var(--muted-2)'} />
    </div>
  );
}

function OnbShell({ variant = 'warm', back, progress, eyebrow, children, primary, primaryDisabled, onPrimary, primaryLabel = 'Continue', secondary }) {
  return (
    <VSoftBackdrop variant={variant}>
      <VTopBar showBack={!!back} onBack={back} transparent />
      <div style={{ padding: '72px 24px 32px', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        {progress && <>
          <div className="v-progress" style={{ marginBottom: 12 }}>
            <div className="v-progress-fill" style={{ width: `${progress.value / progress.total * 100}%` }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 28, fontFamily: 'Inter', fontSize: 11, color: 'var(--muted-2)', letterSpacing: '0.05em' }}>
            <span>{eyebrow || `Step ${progress.value} of ${progress.total}`}</span>
            <span>{Math.round(progress.value / progress.total * 100)}%</span>
          </div>
        </>}
        {!progress && eyebrow && <div className="v-eyebrow" style={{ marginBottom: 18 }}>{eyebrow}</div>}
        {children}
        <div style={{ flex: 1, minHeight: 24 }} />
        {primary !== false && (
          <button className="v-btn-primary v-tap" onClick={onPrimary} disabled={primaryDisabled}
            style={{ opacity: primaryDisabled ? 0.4 : 1 }}>
            {primaryLabel} <VIcon name="arrow-right" size={14} color="#fff" />
          </button>
        )}
        {secondary}
      </div>
    </VSoftBackdrop>
  );
}

export default function RoleScreen({ go, state, set }) {
  const role = state.role;
  return (
    <OnbShell variant="warm" back={() => go('splash')}
      eyebrow="Welcome"
      onPrimary={() => go(role === 'tutor' ? 'role' : 'onb-language')}
      primaryDisabled={!role}>
      <h1 className="v-h1 v-enter" style={{ fontSize: 32, marginBottom: 8, lineHeight: 1.1 }}>
        Who's joining<br />Vidya today?
      </h1>
      <p className="v-enter" style={{ fontFamily: 'Inter', fontSize: 14, color: 'var(--muted)', marginBottom: 32, lineHeight: 1.5 }}>
        Choose how you'll use the app. You can change this later.
      </p>
      <div className="v-enter" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <RoleCard
          active={role === 'student'}
          onClick={() => set({ role: 'student' })}
          icon="user"
          title="I'm a student"
          sub="Learning at my own pace" />
        <RoleCard
          active={role === 'tutor'}
          onClick={() => set({ role: 'tutor' })}
          icon="book"
          title="I'm a tutor or teacher"
          sub="Coming soon"
          disabled />
      </div>
    </OnbShell>
  );
}
