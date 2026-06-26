import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import VIcon from '../../prototype/icons';
import { VSoftBackdrop, VTopBar } from '../../prototype/shared';
import { useAuth } from '../../auth/auth-context';
import { migrateGuestState } from '../../lib/storage';
import type { ScreenProps, ScreenId } from '../../types';

export default function PasswordScreen({ go, state }: ScreenProps) {
  const { t } = useTranslation(['onboarding2', 'common']);
  const { signUp, logIn } = useAuth();
  const mode = state?.authMode === 'signup' ? 'signup' : 'login';
  const email = (state?.authEmail as string) || '';
  const isSignup = mode === 'signup';

  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!pw || busy) return;
    setBusy(true); setError(null);
    try {
      if (isSignup) {
        const res = await signUp(email, pw);
        // Carry any guest progress into the new account.
        migrateGuestState(res.uid);
        // Signed up up front (no onboarding yet) → onboard; otherwise resume.
        go(state?.classLevel ? ((state?.afterAuth as ScreenId) || 'home') : 'onb-language');
      } else {
        await logIn(email, pw);
        // Returning user → their state restores by uid. Straight to home.
        go('home');
      }
    } catch (e) {
      setError((e instanceof Error ? e.message : null) || t('password.authError'));
      setBusy(false);
    }
  };

  return (
    <VSoftBackdrop variant="warm">
      <VTopBar showBack onBack={() => go('signup')} />
      <div style={{ padding: '80px 24px 32px', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        <h1 className="v-h1 v-enter" style={{ fontSize: 30, marginBottom: 8 }}>
          {isSignup ? t('password.titleSignup') : t('password.titleLogin')}
        </h1>
        <p className="v-enter" style={{ fontFamily: 'Inter', fontSize: 14, color: 'var(--muted)', marginBottom: 36 }}>
          {email ? t('password.forEmail', { email }) : ''}
        </p>

        <div style={{ position: 'relative', marginBottom: 14 }}>
          <input type={show ? 'text' : 'password'} value={pw}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setPw(e.target.value); setError(null); }}
            onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter') submit(); }}
            placeholder={isSignup ? t('password.placeholderSignup') : t('password.placeholderLogin')} autoFocus
            style={{ width: '100%', padding: '16px 48px 16px 18px', background: '#fff', border: `1px solid ${error ? 'var(--accent-warn)' : 'var(--border)'}`, borderRadius: 14, fontFamily: 'Inter', fontSize: 15, outline: 'none', boxSizing: 'border-box' }} />
          <button onClick={() => setShow(!show)} style={{ position: 'absolute', right: 8, top: 8, background: 'transparent', border: 'none', padding: 8, cursor: 'default' }}>
            <VIcon name="eye" size={18} color="var(--muted-2)" />
          </button>
        </div>

        {error && (
          <div style={{ fontFamily: 'Inter', fontSize: 12.5, color: 'var(--accent-warn)', marginBottom: 20, lineHeight: 1.5 }}>{error}</div>
        )}
        {!error && !isSignup && (
          <div style={{ textAlign: 'right', marginBottom: 32 }}>
            <span className="v-link">{t('password.forgotPassword')}</span>
          </div>
        )}
        {!error && isSignup && <div style={{ marginBottom: 32 }} />}

        <button className="v-btn-primary v-tap" onClick={submit} disabled={busy || !pw} style={{ opacity: busy || !pw ? 0.5 : 1 }}>
          {busy ? t('password.pleaseWait') : isSignup ? t('password.createAccount') : t('common:signIn')}
          {!busy && <VIcon name="arrow-right" size={14} color="#fff" />}
        </button>
        <div style={{ flex: 1 }} />
      </div>
    </VSoftBackdrop>
  );
}
