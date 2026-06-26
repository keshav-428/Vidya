import React from 'react';
import { useTranslation } from 'react-i18next';
import VIcon from '../../prototype/icons';
import { VTopBar, VSoftBackdrop } from '../../prototype/shared';
import type { ScreenProps } from '../../types';

export default function QuizResultSummaryScreen({ go, set }: ScreenProps) {
  const { t } = useTranslation('quiz');
  return (
    <VSoftBackdrop variant="rose">
      <VTopBar transparent />
      <div style={{ padding: '72px 24px 32px', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
        <div className="v-eyebrow" style={{ marginBottom: 8 }}>{t('resultSummary.eyebrow')}</div>
        <h1 className="v-h1" style={{ fontSize: 34, marginBottom: 24 }}>{t('resultSummary.title')}</h1>

        <div className="v-card v-enter" style={{ padding: 32, marginBottom: 24, textAlign: 'center' }}>
          <div className="v-eyebrow-sm" style={{ marginBottom: 16 }}>{t('resultSummary.youScored')}</div>
          <div style={{ fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontWeight: 700, fontSize: 80, lineHeight: 1, color: 'var(--ink)' }}>8/10</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 12 }}>{t('resultSummary.improvement', { count: 3 })}</div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <div className="v-card-soft" style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 28, color: 'var(--ink)' }}>4:32</div>
            <div className="v-eyebrow-sm" style={{ marginTop: 6 }}>{t('resultSummary.time')}</div>
          </div>
          <div className="v-card-soft" style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 28, color: 'var(--ink)' }}>27s</div>
            <div className="v-eyebrow-sm" style={{ marginTop: 6 }}>{t('resultSummary.avgPerQ')}</div>
          </div>
        </div>

        <div className="v-eyebrow" style={{ marginBottom: 12 }}>{t('resultSummary.questionReview')}</div>
        <div className="v-card" style={{ padding: 0, marginBottom: 32, overflow: 'hidden' }}>
          {[
            { q: '½ + ⅓', ok: true },
            { q: '2x − 5 = 11', ok: true },
            { q: 'Area, r=7', ok: false },
            { q: 'HCF 24, 36', ok: true },
          ].map((r, i) => (
            <div key={i} className="v-tap" onClick={() => { set && set({ reviewIdx: i, reviewFrom: 'quiz-result-summary' }); go('quiz-review-question'); }} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderTop: i ? '1px solid var(--border)' : 'none' }}>
              <div style={{ width: 24, height: 24, borderRadius: 9999, background: r.ok ? 'var(--accent-success)' : 'var(--accent-warn)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <VIcon name={r.ok ? 'check' : 'x'} size={12} color="#fff" strokeWidth={3} />
              </div>
              <span style={{ flex: 1, fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 18 }}>{r.q}</span>
              <span className="v-link">{t('resultSummary.review')}</span>
            </div>
          ))}
        </div>

        <button className="v-btn-primary v-tap" onClick={() => go('home')}>{t('resultSummary.backToHome')} <VIcon name="arrow-right" size={14} color="#fff" /></button>
        <div style={{ textAlign: 'center', marginTop: 14 }}><span className="v-link v-tap" onClick={() => go('final-review')}>{t('resultSummary.finalReviewLink')}</span></div>
      </div>
    </VSoftBackdrop>
  );
}
