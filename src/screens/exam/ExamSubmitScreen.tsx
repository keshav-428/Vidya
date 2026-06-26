import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import VIcon from '../../prototype/icons';
import { VTopBar } from '../../prototype/shared';
import type { ScreenProps } from '../../types';

export default function ExamSubmitScreen({ go }: ScreenProps) {
  const { t } = useTranslation('exam');
  const [conf, setConf] = useState(false);

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)' }}>
      <VTopBar transparent showBack onBack={() => go('exam-photo')} />
      <div style={{ padding: '72px 24px 32px', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        <div className="v-eyebrow" style={{ marginBottom: 8 }}>{t('submit.stepConfirm')}</div>
        <h1 className="v-h1" style={{ fontSize: 30, marginBottom: 24 }}>{t('submit.title')}</h1>

        <div className="v-card" style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}><span style={{ fontSize: 13, color: 'var(--muted)' }}>{t('submit.paper')}</span><span style={{ fontSize: 13, fontFamily: "'Baloo 2','Quicksand','Nunito',system-ui,sans-serif" }}>{t('submit.paperValue')}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}><span style={{ fontSize: 13, color: 'var(--muted)' }}>{t('submit.totalMarks')}</span><span style={{ fontSize: 13, fontFamily: "'Baloo 2','Quicksand','Nunito',system-ui,sans-serif" }}>80</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}><span style={{ fontSize: 13, color: 'var(--muted)' }}>{t('submit.pagesUploaded')}</span><span style={{ fontSize: 13, fontFamily: "'Baloo 2','Quicksand','Nunito',system-ui,sans-serif" }}>3</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}><span style={{ fontSize: 13, color: 'var(--muted)' }}>{t('submit.timeTaken')}</span><span style={{ fontSize: 13, fontFamily: "'Baloo 2','Quicksand','Nunito',system-ui,sans-serif" }}>2h 12m</span></div>
        </div>

        <div className="v-card" style={{ background: '#FFF9F0', borderColor: 'rgba(245,158,11,0.2)', marginBottom: 24 }}>
          <div className="v-eyebrow-sm" style={{ color: '#F59E0B', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <VIcon name="lightbulb" size={14} color="#F59E0B" /> {t('submit.beforeSubmit')}
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--muted)' }}>
            {t('submit.guideNote')}
          </div>
        </div>

        <label className="v-tap" onClick={() => setConf(!conf)} style={{ display: 'flex', gap: 12, padding: '14px 18px', background: '#fff', border: '1px solid var(--border)', borderRadius: 14, marginBottom: 24, alignItems: 'flex-start' }}>
          <div style={{ width: 20, height: 20, borderRadius: 6, border: conf ? 'none' : '1.5px solid var(--border)', background: conf ? 'var(--ink)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2, flexShrink: 0 }}>
            {conf && <VIcon name="check" size={12} color="#fff" strokeWidth={3} />}
          </div>
          <span style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>{t('submit.reviewedConfirm')}</span>
        </label>

        <div style={{ flex: 1, minHeight: 24 }} />
        <button className="v-btn-primary v-tap" onClick={() => conf && go('exam-eval-loading')} disabled={!conf} style={{ opacity: conf ? 1 : 0.4 }}>
          {t('submit.submitForEvaluation')} <VIcon name="send" size={14} color="#fff" />
        </button>
      </div>
    </div>
  );
}
