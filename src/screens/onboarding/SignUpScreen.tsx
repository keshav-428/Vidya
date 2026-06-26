import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import VIcon from '../../prototype/icons';
import { VSoftBackdrop, VTopBar, VidyaMark } from '../../prototype/shared';
import type { ScreenProps } from '../../types';

// Email-entry step. Works for both "create account" and "sign in" — the
// mode is carried in state.authMode and used again on the password screen.
export default function SignUpScreen({ go, state, set }: ScreenProps) {
  const { t } = useTranslation(['onboarding2', 'common']);
  const mode = state?.authMode === 'signup' ? 'signup' : 'login';
  const [email, setEmail] = useState((state?.authEmail as string) || '');
  const valid = /\S+@\S+\.\S+/.test(email);

  const isSignup = mode === 'signup';

  return (
    <VSoftBackdrop variant="warm">
      <VTopBar showBack onBack={() => go('splash')} transparent />
      <div style={{ padding: '72px 24px 32px', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <VidyaMark size={56} />
        </div>
        <h1 className="v-h1 v-enter" style={{ fontSize: 34, textAlign: 'center', marginBottom: 8 }}>
          {isSignup ? t('signUp.titleSignup') : t('signUp.titleLogin')}
        </h1>
        <p className="v-enter" style={{ fontFamily: 'Inter', fontSize: 14, color: 'var(--muted)', textAlign: 'center', marginBottom: 36 }}>
          {isSignup ? t('signUp.subtitleSignup') : t('signUp.subtitleLogin')}
        </p>

        <div className="v-eyebrow" style={{ marginBottom: 8 }}>{t('signUp.emailLabel')}</div>
        <input
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
          onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter' && valid) { set({ authEmail: email.trim() }); go('password'); } }}
          placeholder={t('signUp.emailPlaceholder')}
          type="email" autoCapitalize="none" autoCorrect="off" inputMode="email"
          style={{ width: '100%', padding: '14px 16px', background: '#fff', border: '1px solid var(--border)', borderRadius: 14, fontFamily: 'Inter', fontSize: 15, outline: 'none', marginBottom: 24, boxSizing: 'border-box' }}
        />

        <button className="v-btn-primary v-tap" onClick={() => { set({ authEmail: email.trim() }); go('password'); }}
          disabled={!valid} style={{ opacity: valid ? 1 : 0.4 }}>
          {t('common:continue')} <VIcon name="arrow-right" size={14} color="#fff" />
        </button>

        <div className="v-tap" onClick={() => set({ authMode: isSignup ? 'login' : 'signup' })}
          style={{ textAlign: 'center', marginTop: 18, fontFamily: 'Inter', fontSize: 13, color: 'var(--muted)' }}>
          {isSignup ? t('signUp.haveAccountPrompt') : t('signUp.newHerePrompt')}
          <span style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>{isSignup ? t('common:signIn') : t('signUp.createAccountLink')}</span>
        </div>

        <div style={{ flex: 1 }} />
        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--muted-2)', lineHeight: 1.6, marginTop: 32 }}>
          {t('signUp.terms')}<br />
          <span style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>{t('signUp.termsOfService')}</span> {t('signUp.and')} <span style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>{t('signUp.privacyPolicy')}</span>
        </p>
      </div>
    </VSoftBackdrop>
  );
}
