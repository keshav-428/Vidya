import React, { useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import VIcon from '../../prototype/icons';
import { VTopBar, VSectionHeader } from '../../prototype/shared';
import type { ScreenProps } from '../../types';

interface RevisionLevel {
  id: string;
  nameKey: string;
  metaKey: string;
  dot: string;
}

const recent: string[] = [
  'Fractions: parts of a whole',
  'Decimals: place value',
  'Adding unlike fractions',
  'Linear equations',
  'Perimeter of rectangles',
];
const levels: RevisionLevel[] = [
  { id: 'Thinker', nameKey: 'reviseClass.levelThinker', metaKey: 'reviseClass.levelThinkerMeta', dot: 'var(--accent-success)' },
  { id: 'Scholar', nameKey: 'reviseClass.levelScholar', metaKey: 'reviseClass.levelScholarMeta', dot: 'var(--accent-amber)' },
  { id: 'Genius', nameKey: 'reviseClass.levelGenius', metaKey: 'reviseClass.levelGeniusMeta', dot: 'var(--accent-warn)' },
];

export default function ReviseClassScreen({ go }: ScreenProps) {
  const { t } = useTranslation('practice');
  const [topic, setTopic] = useState<string | null>(null);
  const [level, setLevel] = useState<string | null>(null);
  const levelName = (id: string) => {
    const l = levels.find((x) => x.id === id);
    return l ? t(l.nameKey) : id;
  };

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)' }}>
      <VTopBar transparent showBack onBack={() => go('home')} title={t('reviseClass.topBarTitle')} />
      <div style={{ padding: '72px 24px 32px' }}>
        <div className="v-eyebrow" style={{ marginBottom: 8 }}>{t('common:stepOf', { value: topic ? (level ? 3 : 2) : 1, total: 3 })}</div>
        <h1 className="v-h1" style={{ fontSize: 30, marginBottom: 8, lineHeight: 1.2 }}>
          {!topic ? t('reviseClass.step1Title') : !level ? t('reviseClass.step2Title') : t('reviseClass.step3Title')}
        </h1>
        <p className="v-body" style={{ marginBottom: 28 }}>
          {!topic ? t('reviseClass.step1Subtitle')
            : !level ? t('reviseClass.step2Subtitle', { topic })
              : t('reviseClass.step3Subtitle')}
        </p>

        {!topic && (
          <>
            <VSectionHeader title={t('reviseClass.recentInClass')} />
            <div className="v-card" style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
              {recent.map((t, i) => (
                <div key={t} className="v-tap" onClick={() => setTopic(t)} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px',
                  borderTop: i ? '1px solid var(--border)' : 'none',
                }}>
                  <VIcon name="book" size={18} color="var(--muted)" />
                  <span style={{ flex: 1, fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 16 }}>{t}</span>
                  <VIcon name="chevron-right" size={16} color="var(--muted-2)" />
                </div>
              ))}
            </div>
            <button className="v-btn-secondary v-tap" onClick={() => go('concept-library')}>
              {t('reviseClass.searchAnother')}
            </button>
          </>
        )}

        {topic && !level && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {levels.map(l => (
              <div key={l.id} className="v-tap" onClick={() => setLevel(l.id)} style={{
                background: '#fff', borderRadius: 20, border: '1px solid var(--border)',
                padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14,
              }}>
                <div style={{ width: 10, height: 10, borderRadius: 9999, background: l.dot, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 18, marginBottom: 2 }}>{t(l.nameKey)}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted-2)' }}>{t(l.metaKey)}</div>
                </div>
                <VIcon name="chevron-right" size={16} color="var(--muted-2)" />
              </div>
            ))}
          </div>
        )}

        {topic && level && (
          <div className="v-card" style={{ padding: 24 }}>
            <div className="v-eyebrow-sm" style={{ color: 'var(--indigo)', marginBottom: 10 }}>{t('reviseClass.ready')}</div>
            <div style={{ fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 22, marginBottom: 6, lineHeight: 1.3 }}>{topic}</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>
              <Trans i18nKey="reviseClass.levelQuestions" t={t} values={{ level: levelName(level) }} components={{ 1: <strong /> }} />
            </div>
            <button className="v-btn-primary v-tap" onClick={() => go('navigable-quiz')}>
              {t('reviseClass.startPractice')} <VIcon name="arrow-right" size={14} color="#fff" />
            </button>
            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button className="v-btn-secondary v-tap" onClick={() => go('learn-concept')} style={{ flex: 1 }}>
                {t('reviseClass.understandConcept')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
