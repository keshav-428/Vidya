import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import VIcon from '../../prototype/icons';
import { VSoftBackdrop, VidyaLockup, VidyaAvatar } from '../../prototype/shared';
import type { ScreenProps } from '../../types';

const LAUNCH_MS = 1700;

export default function SplashScreen({ go, set }: ScreenProps) {
  const { t } = useTranslation(['onboarding', 'common']);
  // Phase 1 = animated brand launch (auto-advances); Phase 2 = welcome + CTAs.
  const [phase, setPhase] = useState<'launch' | 'welcome'>('launch');

  useEffect(() => {
    if (phase !== 'launch') return;
    const id = setTimeout(() => setPhase('welcome'), LAUNCH_MS);
    return () => clearTimeout(id);
  }, [phase]);

  // ── Phase 1: launch splash — centered animated mascot, tap to skip ──
  if (phase === 'launch') {
    return (
      <div
        onClick={() => setPhase('welcome')}
        style={{
          minHeight: '100%', position: 'relative', cursor: 'pointer',
          background: 'radial-gradient(120% 80% at 50% 32%, #FFF3E9 0%, #FFE7D6 46%, #F2E9FF 100%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22,
        }}
      >
        <div className="v-pop">
          <VidyaAvatar size={128} animated />
        </div>
        <div style={{ animation: 'vFadeUp 500ms cubic-bezier(.16,1,.3,1) both', animationDelay: '200ms' }}>
          <VidyaLockup height={34} />
        </div>
        {/* loading dots */}
        <div style={{ position: 'absolute', bottom: 48, display: 'flex', gap: 7 }}>
          {[0, 1, 2].map((i) => (
            <span key={i} style={{
              width: 7, height: 7, borderRadius: 9999, background: 'var(--saffron)',
              display: 'inline-block', animation: 'vDot 1.2s infinite', animationDelay: `${i * 0.16}s`,
            }} />
          ))}
        </div>
      </div>
    );
  }

  // ── Phase 2: welcome ──
  return (
    <VSoftBackdrop variant="warm">
      <div style={{ padding: '56px 28px 32px', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        <div className="v-enter" style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <VidyaLockup height={26} />
        </div>

        <div className="v-enter-scale" style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <VidyaAvatar size={96} animated />
        </div>

        <div className="v-eyebrow v-enter" style={{ textAlign: 'center', marginBottom: 14, color: 'var(--muted-2)' }}>
          {t('splash.eyebrow')}
        </div>
        <h1 className="v-h1 v-enter" style={{
          fontSize: 38, textAlign: 'center', whiteSpace: 'pre-line',
          margin: '0 0 16px', lineHeight: 1.05, letterSpacing: '-0.025em'
        }}>
          {t('splash.title')}
        </h1>
        <p className="v-enter" style={{
          fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 18, color: 'var(--muted)',
          textAlign: 'center', margin: '0 16px 8px', lineHeight: 1.5 }}>
          {t('splash.subtitle')}
        </p>

        <div style={{ flex: 1, minHeight: 24 }} />

        <button className="v-btn-primary v-tap" onClick={() => { set && set({ authMode: 'signup' }); go('signup'); }}>
          {t('common:getStarted')} <VIcon name="arrow-right" size={14} color="#fff" />
        </button>
        <button className="v-btn-secondary v-tap" onClick={() => { set && set({ role: 'student' }); go('onb-language'); }} style={{ marginTop: 10 }}>
          Continue as guest
        </button>
        <div className="v-tap" onClick={() => { set && set({ authMode: 'login' }); go('signup'); }} style={{
          textAlign: 'center', marginTop: 18,
          fontFamily: 'Inter', fontSize: 13, color: 'var(--muted)', letterSpacing: '0.02em'
        }}>
          {t('common:haveAccount')} <span style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>{t('common:signIn')}</span>
        </div>
      </div>
    </VSoftBackdrop>
  );
}
