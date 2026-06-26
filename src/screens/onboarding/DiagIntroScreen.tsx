import React from 'react';
import { useTranslation } from 'react-i18next';
import VIcon from '../../prototype/icons';
import { VTopBar, VSoftBackdrop, VidyaAvatar, VidyaIcon } from '../../prototype/shared';
import type { ScreenProps } from '../../types';

export default function DiagIntroScreen({ go, state, set }: ScreenProps) {
  const { t } = useTranslation('onboarding');
  const name = state.name || 'there';
  return (
    <VSoftBackdrop variant="cool">
      <VTopBar showBack onBack={() => go('onb-name')} transparent />
      <div style={{ padding: '64px 22px 28px', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        <div className="v-enter" style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <VidyaAvatar size={72} />
        </div>
        <div className="v-eyebrow v-enter" style={{ textAlign: 'center', marginBottom: 12 }}>{t('diagIntro.eyebrow')}</div>
        <h1 className="v-h1 v-enter" style={{ fontSize: 29, textAlign: 'center', marginBottom: 12, lineHeight: 1.12, whiteSpace: 'pre-line' }}>
          {t('diagIntro.title', { name })}
        </h1>
        <p className="v-enter" style={{ fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 16, color: 'var(--muted)', textAlign: 'center', margin: '0 6px 24px', lineHeight: 1.5 }}>
          {t('diagIntro.subtitle')}
        </p>

        {/* Journey A — diagnostic */}
        <div className="v-card v-enter v-tap" onClick={() => go('diag-q1')} style={{
          padding: 0, overflow: 'hidden', marginBottom: 14,
          border: '1.5px solid var(--indigo)',
          boxShadow: '0 16px 34px -18px rgba(56,72,168,0.55)'
        }}>
          <div style={{ padding: '20px 20px 18px', background: 'linear-gradient(135deg,#EEF1FF 0%,#F4EEFF 100%)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
                <VidyaIcon size={40} />
                <div style={{ fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 20, fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.01em' }}>{t('diagIntro.diagnosticTitle')}</div>
              </div>
              <div className="v-pill" style={{ background: 'var(--indigo)', color: '#fff', fontWeight: 700, fontSize: 9.5, letterSpacing: '0.07em', flexShrink: 0 }}>{t('diagIntro.recommended')}</div>
            </div>
            <p style={{ fontFamily: 'Inter', fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.5, margin: '0 0 14px' }}>
              {t('diagIntro.diagnosticDesc')}
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <div className="v-pill" style={{ background: '#fff' }}><VIcon name="compass" size={11} color="var(--indigo)" /> {t('diagIntro.coversAll')}</div>
              <div className="v-pill" style={{ background: '#fff' }}><VIcon name="clock" size={11} color="var(--indigo)" /> {t('diagIntro.duration')}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: '#fff' }}>
            <span style={{ fontFamily: 'Inter', fontSize: 13, fontWeight: 600, letterSpacing: '0.02em', color: 'var(--indigo)' }}>{t('diagIntro.startDiagnostic')}</span>
            <VIcon name="arrow-right" size={16} color="var(--indigo)" />
          </div>
        </div>

        {/* Journey B — build own plan */}
        <div onClick={() => { set({ ownPlan: true, coachStep: 0 }); if (state?.userId) { go('home'); } else { set({ afterAuth: 'home' }); go('save-progress'); } }} className="v-card v-enter v-tap" style={{ padding: '17px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 13, background: 'var(--bg-warm)', border: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <VIcon name="edit" size={16} color="var(--ink)" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 17, color: 'var(--ink)' }}>{t('diagIntro.ownTitle')}</div>
            <div style={{ fontSize: 12.5, color: 'var(--muted-2)', marginTop: 2, lineHeight: 1.4 }}>{t('diagIntro.ownSub')}</div>
          </div>
          <VIcon name="chevron-right" size={16} color="var(--muted-2)" />
        </div>

        <div style={{ flex: 1, minHeight: 18 }} />
        <p className="v-enter" style={{ fontSize: 11.5, color: 'var(--muted-2)', textAlign: 'center', lineHeight: 1.5, margin: '14px 8px 0' }}>
          {t('diagIntro.footnote')}
        </p>
      </div>
    </VSoftBackdrop>
  );
}
