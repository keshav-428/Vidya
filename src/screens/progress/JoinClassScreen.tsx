import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import VIcon from '../../prototype/icons';
import { VTopBar } from '../../prototype/shared';
import { useAuth } from '../../auth/auth-context';
import api from '../../api/vidya';
import type { ScreenProps } from '../../types';

// ─────────────────────────────────────────────────────────────
//  "My teacher gave me a code."
//
//  The one way a student ends up in a teacher's class. Entirely opt-in:
//  a student who never types a code is unaffected, and nothing else in
//  the app changes once they have.
//
//  The code is written on a blackboard and copied by an 11-year-old, so
//  the input is forgiving — lower case and stray spaces are fine, and the
//  backend's alphabet already excludes the characters that get misread.
// ─────────────────────────────────────────────────────────────

const CODE_LENGTH = 6;

export default function JoinClassScreen({ go }: ScreenProps) {
  const { t } = useTranslation(['profile', 'common']);
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [joined, setJoined] = useState<{ name: string } | null>(null);

  const clean = code.replace(/\s/g, '').toUpperCase();

  const submit = async () => {
    if (clean.length < CODE_LENGTH) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await api.joinClass(clean);
      setJoined({ name: res.name });
    } catch (e) {
      const msg = (e as Error).message || '';
      setErr(msg === 'SIGNED_OUT' ? t('joinClass.errSignedOut')
        : msg.toLowerCase().includes('code') || msg.includes('404') ? t('joinClass.errBadCode')
        : t('joinClass.errGeneric'));
    } finally {
      setBusy(false);
    }
  };

  if (joined) {
    return (
      <div style={{ minHeight: '100%', background: 'var(--bg)' }}>
        <VTopBar transparent showBack onBack={() => go('profile')} title={t('joinClass.topbar')} />
        <div style={{ padding: '96px 24px 40px', textAlign: 'center' }}>
          <div className="v-pop" style={{ width: 72, height: 72, borderRadius: 9999, background: '#EDFAF3', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <VIcon name="check" size={30} color="#047857" strokeWidth={2.5} />
          </div>
          <h1 className="v-h1" style={{ fontSize: 26, marginBottom: 10 }}>
            {t('joinClass.doneTitle', { name: joined.name })}
          </h1>
          <p className="v-body" style={{ marginBottom: 28 }}>{t('joinClass.doneBody')}</p>
          <button className="v-btn-primary v-tap" onClick={() => go('home')}>
            {t('common:continue')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)' }}>
      <VTopBar transparent showBack onBack={() => go('profile')} title={t('joinClass.topbar')} />
      <div style={{ padding: '72px 24px 40px' }}>
        <h1 className="v-h1" style={{ fontSize: 26, marginBottom: 8 }}>{t('joinClass.title')}</h1>
        <p className="v-body" style={{ marginBottom: 24 }}>{t('joinClass.body')}</p>

        {!user && <div className="v-card-soft" style={{ marginBottom: 16, fontSize: 13, color: 'var(--accent-warn)' }}>{t('joinClass.errSignedOut')}</div>}
        {err && (
          <div style={{ marginBottom: 16, borderRadius: 14, padding: '12px 14px', background: '#FBEFE8', border: '1px solid #EFC6AE', fontFamily: 'Inter', fontSize: 12.5, color: 'var(--accent-warn)', lineHeight: 1.45 }}>
            {err}
          </div>
        )}

        <div className="v-card" style={{ marginBottom: 18 }}>
          <div className="v-eyebrow-sm" style={{ marginBottom: 10 }}>{t('joinClass.label')}</div>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.slice(0, CODE_LENGTH + 4))}
            onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
            placeholder="ABC123"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            inputMode="text"
            aria-label={t('joinClass.label')}
            style={{
              width: '100%', textAlign: 'center', border: '1px solid var(--border)',
              borderRadius: 18, padding: '18px 12px', background: 'var(--indigo-air)',
              fontFamily: "'Quicksand','Baloo 2',system-ui,sans-serif", fontWeight: 700,
              fontSize: 32, letterSpacing: '0.2em', color: 'var(--indigo-ink)',
              textTransform: 'uppercase', outline: 'none',
            }}
          />
        </div>

        <button className="v-btn-primary v-tap" disabled={busy || clean.length < CODE_LENGTH || !user}
          onClick={submit}>
          {busy ? t('joinClass.joining') : t('joinClass.cta')}
        </button>

        <p className="v-body" style={{ fontSize: 12.5, marginTop: 16, textAlign: 'center' }}>
          {t('joinClass.note')}
        </p>
      </div>
    </div>
  );
}
