import React from 'react';
import { useTranslation } from 'react-i18next';
import VIcon from '../../prototype/icons';
import { VSoftBackdrop, VTopBar } from '../../prototype/shared';
import { type DiagOutcome } from '../../content/diagnostic';
import type { ScreenProps } from '../../types';

export default function DiagSummaryScreen({ go, state }: ScreenProps) {
  const { t } = useTranslation(['onboarding2', 'common']);

  const outcome = (state?.diagOutcome as DiagOutcome) || null;
  if (!outcome) {
    go('diag-intro');
    return null;
  }

  return (
    <VSoftBackdrop variant="cool">
      <VTopBar showBack onBack={() => go('diag-q1')} transparent />
      <div style={{ padding: '72px 22px 32px', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        <div className="v-eyebrow v-enter" style={{ marginBottom: 6 }}>{t('diagSummary.eyebrow')}</div>
        <h1 className="v-h1 v-enter" style={{ fontSize: 28, marginBottom: 12, lineHeight: 1.1 }}>
          {t('diagSummary.title')}
        </h1>
        <p className="v-enter" style={{ fontFamily: 'Inter', fontSize: 13, color: 'var(--muted)', marginBottom: 20, lineHeight: 1.5 }}>
          {t('diagSummary.sub')}
        </p>

        {/* Weak areas */}
        {outcome.weak.length > 0 && (
          <div className="v-card v-enter" style={{ padding: '18px', marginBottom: 18, background: '#FFF7ED' }}>
            <div className="v-eyebrow-sm" style={{ marginBottom: 12 }}>{t('diagSummary.weakHeader')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {outcome.weak.slice(0, 3).map((area) => (
                <div key={area} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ width: 20, height: 20, borderRadius: 9999, background: 'var(--accent-warn)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                    <VIcon name="alert-circle" size={11} color="#fff" strokeWidth={2} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{area}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted-2)', marginTop: 2 }}>{t('diagSummary.weakSub')}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Strong areas */}
        {outcome.strong.length > 0 && (
          <div className="v-card v-enter" style={{ padding: '18px', marginBottom: 18, background: '#ECFDF5' }}>
            <div className="v-eyebrow-sm" style={{ marginBottom: 12 }}>{t('diagSummary.strongHeader')}</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {outcome.strong.map((area) => (
                <div key={area} style={{ padding: '6px 12px', borderRadius: 9999, background: '#fff', border: '1px solid var(--accent-success)', fontSize: 12, fontWeight: 600, color: 'var(--accent-success)' }}>
                  {area}
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ flex: 1, minHeight: 18 }} />

        <div className="v-enter">
          <button className="v-btn-primary v-tap" onClick={() => go('diag-result')} style={{ width: '100%' }}>
            {t('diagSummary.buildPlan')} <VIcon name="arrow-right" size={14} color="#fff" />
          </button>
        </div>
      </div>
    </VSoftBackdrop>
  );
}
