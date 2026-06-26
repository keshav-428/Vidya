import React from 'react';
import { useTranslation } from 'react-i18next';
import VIcon from '../../prototype/icons';
import { VTopBar, VSoftBackdrop } from '../../prototype/shared';
import type { ScreenProps } from '../../types';

interface TileItem {
  id: string;
  label: React.ReactNode;
  sub?: React.ReactNode;
  glyph?: React.ReactNode;
  disabled?: boolean;
}

interface TileGridProps {
  items: TileItem[];
  value?: string;
  onSelect: (id: string) => void;
  columns?: number;
  soonLabel?: React.ReactNode;
}

function TileGrid({ items, value, onSelect, columns = 2, soonLabel = 'Soon' }: TileGridProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns},1fr)`, gap: 12 }}>
      {items.map((it) => {
        const active = value === it.id;
        const disabled = it.disabled;
        return (
          <div key={it.id} className="v-tap" onClick={disabled ? undefined : () => onSelect(it.id)} style={{
            position: 'relative',
            padding: '22px 16px',
            background: active ? 'var(--ink)' : '#fff',
            color: active ? '#fff' : 'var(--ink)',
            border: active ? '1.5px solid var(--ink)' : '1px solid var(--border)',
            borderRadius: 22,
            display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6,
            opacity: disabled ? 0.45 : 1,
            cursor: disabled ? 'not-allowed' : 'default',
            transition: 'all 160ms ease',
            minHeight: columns === 2 ? 108 : 86
          }}>
            {it.glyph && (
              <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 24, opacity: 0.8, marginBottom: 4,
                color: active ? 'rgba(255,255,255,0.8)' : 'var(--indigo)' }}>{it.glyph}</div>
            )}
            <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 19, fontWeight: 500, letterSpacing: '-0.01em', lineHeight: 1.15 }}>{it.label}</div>
            {it.sub && <div style={{ fontSize: 12, color: active ? 'rgba(255,255,255,0.65)' : 'var(--muted-2)', lineHeight: 1.35 }}>{it.sub}</div>}
            {disabled && (
              <div style={{
                position: 'absolute', top: 14, right: 14, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase',
                color: 'var(--muted-2)', padding: '3px 8px', borderRadius: 9999, background: 'var(--bg-warm)'
              }}>{soonLabel}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

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

export default function SubjectScreen({ go, state, set }: ScreenProps) {
  const { t } = useTranslation(['onboarding', 'common']);
  return (
    <OnbShell variant="warm" back={() => go('onb-class')}
      progress={{ value: 3, total: 5 }}
      onPrimary={() => go('onb-goal')}
      primaryDisabled={!state.subject}>
      <h1 className="v-h1 v-enter" style={{ fontSize: 30, marginBottom: 8, whiteSpace: 'pre-line' }}>
        {t('subject.title')}
      </h1>
      <p className="v-enter" style={{ fontFamily: 'Inter', fontSize: 14, color: 'var(--muted)', marginBottom: 28, lineHeight: 1.5 }}>
        {t('subject.subtitle')}
      </p>
      <div className="v-enter">
        <TileGrid columns={2} value={state.subject} onSelect={(v) => set({ subject: v })} soonLabel={t('common:soon')}
          items={[
            { id: 'maths', label: t('subject.maths'), sub: t('subject.mathsSub'), glyph: 'π' },
            { id: 'science', label: t('subject.science'), sub: t('common:comingSoon'), glyph: '⚛', disabled: true },
            { id: 'english', label: t('subject.english'), sub: t('common:comingSoon'), glyph: 'Aa', disabled: true },
            { id: 'social', label: t('subject.social'), sub: t('common:comingSoon'), glyph: '◯', disabled: true }
          ]} />
      </div>
    </OnbShell>
  );
}
