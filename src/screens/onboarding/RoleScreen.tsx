import React from 'react';
import { useTranslation } from 'react-i18next';
import VIcon from '../../prototype/icons';
import { VTopBar, VSoftBackdrop } from '../../prototype/shared';
import { LANGUAGE_PICKER_ENABLED } from '../../lib/features';
import type { ScreenProps, IconName } from '../../types';

interface RoleCardProps {
  active?: boolean;
  onClick?: () => void;
  icon: IconName;
  title: React.ReactNode;
  sub: React.ReactNode;
  disabled?: boolean;
}

function RoleCard({ active, onClick, icon, title, sub, disabled }: RoleCardProps) {
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

interface OnbShellProps {
  variant?: string;
  back?: () => void;
  progress?: { value: number; total: number };
  eyebrow?: React.ReactNode;
  children?: React.ReactNode;
  primary?: boolean;
  primaryDisabled?: boolean;
  onPrimary?: () => void;
  primaryLabel?: React.ReactNode;
  secondary?: React.ReactNode;
}

function OnbShell({ variant = 'warm', back, progress, eyebrow, children, primary, primaryDisabled, onPrimary, primaryLabel, secondary }: OnbShellProps) {
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
            <span>{eyebrow || t('stepOf', { value: progress.value, total: progress.total })}</span>
            <span>{Math.round(progress.value / progress.total * 100)}%</span>
          </div>
        </>}
        {!progress && eyebrow && <div className="v-eyebrow" style={{ marginBottom: 18 }}>{eyebrow}</div>}
        {children}
        <div style={{ flex: 1, minHeight: 24 }} />
        {primary !== false && (
          <button className="v-btn-primary v-tap" onClick={onPrimary} disabled={primaryDisabled}
            style={{ opacity: primaryDisabled ? 0.4 : 1 }}>
            {primaryLabel || t('continue')} <VIcon name="arrow-right" size={14} color="#fff" />
          </button>
        )}
        {secondary}
      </div>
    </VSoftBackdrop>
  );
}

export default function RoleScreen({ go, state, set }: ScreenProps) {
  const { t } = useTranslation('onboarding');
  const role = state.role;
  return (
    <OnbShell variant="warm" back={() => go('splash')}
      eyebrow={t('role.eyebrow')}
      onPrimary={() => go(role === 'tutor' ? 'role' : (LANGUAGE_PICKER_ENABLED ? 'onb-language' : 'onb-class'))}
      primaryDisabled={!role}>
      <h1 className="v-h1 v-enter" style={{ fontSize: 32, marginBottom: 8, lineHeight: 1.1, whiteSpace: 'pre-line' }}>
        {t('role.title')}
      </h1>
      <p className="v-enter" style={{ fontFamily: 'Inter', fontSize: 14, color: 'var(--muted)', marginBottom: 32, lineHeight: 1.5 }}>
        {t('role.subtitle')}
      </p>
      <div className="v-enter" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <RoleCard
          active={role === 'student'}
          onClick={() => set({ role: 'student' })}
          icon="user"
          title={t('role.student')}
          sub={t('role.studentSub')} />
        <RoleCard
          active={role === 'tutor'}
          onClick={() => set({ role: 'tutor' })}
          icon="book"
          title={t('role.tutor')}
          sub={t('role.tutorSub')}
          disabled />
      </div>
    </OnbShell>
  );
}
