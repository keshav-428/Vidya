import React from 'react';
import { useTranslation } from 'react-i18next';
import VIcon from '../../prototype/icons';
import { VTopBar, VSoftBackdrop } from '../../prototype/shared';
import { classChapters } from '../../content/syllabus';
import api from '../../api/vidya';
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
}

function TileGrid({ items, value, onSelect, columns = 2 }: TileGridProps) {
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
  eyebrow?: React.ReactNode;
  children?: React.ReactNode;
  primaryDisabled?: boolean;
  onPrimary?: () => void;
  primaryLabel?: React.ReactNode;
}

function OnbShell({ variant = 'warm', back, progress, eyebrow, children, primaryDisabled, onPrimary, primaryLabel }: OnbShellProps) {
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

export default function ClassScreen({ go, state, set }: ScreenProps) {
  const { t } = useTranslation('onboarding');
  // Once a class is picked, show its full NCERT syllabus right here — the
  // "everything is covered" trust moment, merged into the class step.
  const cls = api.toGrade(state.classLevel);
  const chapters = state.classLevel ? classChapters(cls) : [];
  const topicCount = chapters.reduce((n, c) => n + c.subtopics.length, 0);

  return (
    <OnbShell variant="cool" back={() => go('onb-language')}
      progress={{ value: 2, total: 5 }}
      onPrimary={() => go('onb-subject')}
      primaryDisabled={!state.classLevel}>
      <h1 className="v-h1 v-enter" style={{ fontSize: 30, marginBottom: 8, whiteSpace: 'pre-line' }}>
        {t('class.title')}
      </h1>
      <p className="v-enter" style={{ fontFamily: 'Inter', fontSize: 14, color: 'var(--muted)', marginBottom: 28, lineHeight: 1.5 }}>
        {t('class.subtitle')}
      </p>
      <div className="v-enter">
        <TileGrid columns={3} value={state.classLevel} onSelect={(v) => set({ classLevel: v })}
          items={[
            { id: '6', label: t('class.label', { n: '6' }) },
            { id: '7', label: t('class.label', { n: '7' }) },
            { id: '8', label: t('class.label', { n: '8' }) }
          ]} />
      </div>

      {chapters.length > 0 ? (
        <div className="v-enter-fade" style={{ marginTop: 24 }}>
          <div className="v-eyebrow-sm" style={{ marginBottom: 10 }}>
            YOUR CLASS {cls} SYLLABUS · {chapters.length} CHAPTERS · {topicCount} TOPICS
          </div>
          <div className="v-card" style={{ padding: 0, overflow: 'hidden' }}>
            {chapters.map((c, i) => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderTop: i ? '1px solid var(--border-soft)' : 'none' }}>
                <div style={{ width: 24, height: 24, borderRadius: 7, background: 'var(--indigo-air)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 12, fontWeight: 600, color: 'var(--indigo)' }}>
                  {c.num}
                </div>
                <div style={{ flex: 1, minWidth: 0, fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 14, lineHeight: 1.2 }}>{c.title}</div>
                <VIcon name="check" size={14} color="var(--accent-success)" />
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, color: 'var(--muted-2)', marginTop: 12, lineHeight: 1.5 }}>
            Everything in your NCERT book — fully covered, chapter by chapter.
          </p>
        </div>
      ) : (
        <p className="v-enter" style={{ fontSize: 12, color: 'var(--muted-2)', marginTop: 20, lineHeight: 1.5 }}>
          {t('class.footnote')}
        </p>
      )}
    </OnbShell>
  );
}
