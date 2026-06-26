import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import VIcon from '../../prototype/icons';
import { VSoftBackdrop, VTopBar, VidyaAvatar } from '../../prototype/shared';
import type { ScreenProps } from '../../types';

export default function DiagBuildingScreen({ go }: ScreenProps) {
  const { t } = useTranslation('onboarding2');
  const [stepIdx, setStepIdx] = useState(0);
  const lines = [
    t('diagBuilding.lines.1'),
    t('diagBuilding.lines.2'),
    t('diagBuilding.lines.3'),
    t('diagBuilding.lines.4'),
  ];

  useEffect(() => {
    const t = setInterval(() => {
      setStepIdx((s) => {
        if (s >= lines.length - 1) {
          clearInterval(t);
          setTimeout(() => go('diag-result'), 700);
          return s;
        }
        return s + 1;
      });
    }, 850);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once on mount; `go`/`lines` are stable for the screen's lifetime
  }, []);

  return (
    <VSoftBackdrop variant="warm">
      <VTopBar transparent />
      <div style={{ padding: '72px 24px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100%' }}>
        <div className="v-enter-scale" style={{ position: 'relative', marginBottom: 40 }}>
          <VidyaAvatar size={120} animated />
          <div style={{ position: 'absolute', inset: -12, borderRadius: 9999, border: '2px solid var(--accent-blue-soft)', animation: 'vPulseRing 1.4s ease-out infinite' }} />
        </div>
        <div className="v-eyebrow" style={{ marginBottom: 14 }}>{t('diagBuilding.eyebrow')}</div>
        <h1 className="v-h1" style={{ fontSize: 30, textAlign: 'center', marginBottom: 18, lineHeight: 1.15, whiteSpace: 'pre-line' }}>
          {t('diagBuilding.title')}
        </h1>
        <p style={{ fontFamily: 'Inter', fontSize: 13, color: 'var(--muted)', textAlign: 'center', marginBottom: 24, lineHeight: 1.5, maxWidth: 280 }}>
          {t('diagBuilding.subtitle')}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'flex-start' }}>
          {lines.map((l, i) =>
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: i <= stepIdx ? 1 : 0.35, transition: 'opacity .35s' }}>
              <div style={{
                width: 18, height: 18, borderRadius: 9999,
                border: i < stepIdx ? 'none' : '1.5px solid var(--muted-2)',
                background: i < stepIdx ? 'var(--ink)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {i < stepIdx && <VIcon name="check" size={11} color="#fff" strokeWidth={2.5} />}
                {i === stepIdx && <div style={{ width: 6, height: 6, borderRadius: 9999, background: 'var(--ink)', animation: 'vDot 1.2s infinite' }} />}
              </div>
              <span style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 17, color: i <= stepIdx ? 'var(--ink)' : 'var(--muted-2)' }}>{l}</span>
            </div>
          )}
        </div>
      </div>
    </VSoftBackdrop>
  );
}
