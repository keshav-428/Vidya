// ─────────────────────────────────────────────────────────────
//  Sign in / create a teacher account.
//
//  Email and password only. A teacher signs in once on their own phone
//  and stays signed in; anything more elaborate is a barrier at the exact
//  moment we have not yet shown them anything useful.
// ─────────────────────────────────────────────────────────────
import { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../firebase';

export default function SignIn() {
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) { setErr('Sign-in is not configured yet.'); return; }
    setBusy(true);
    setErr(null);
    try {
      if (mode === 'up') {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (name.trim()) await updateProfile(cred.user, { displayName: name.trim() });
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
      // App is listening on auth state; no navigation needed.
    } catch (e2) {
      // Firebase messages read like error codes; say the likely thing instead.
      const code = (e2 as { code?: string })?.code || '';
      setErr(
        code.includes('email-already-in-use') ? 'That email already has an account — sign in instead.'
        : code.includes('invalid-credential') || code.includes('wrong-password') ? 'That email and password do not match.'
        : code.includes('weak-password') ? 'Please use a password of at least 6 characters.'
        : code.includes('invalid-email') ? 'That does not look like an email address.'
        : 'Could not sign you in. Please try again.',
      );
      setBusy(false);
    }
  };

  return (
    <div className="wrap v-enter" style={{ paddingTop: 56 }}>
      <div className="v-logo-wordmark" style={{ fontSize: 30, marginBottom: 28 }}>Vidya</div>

      <div className="v-eyebrow" style={{ marginBottom: 8 }}>For teachers</div>
      <h1 className="v-h1">{mode === 'in' ? 'Welcome back' : 'Create your account'}</h1>
      <p className="v-body" style={{ marginBottom: 24 }}>
        See what your class is struggling with, before the test tells you.
      </p>

      {!isFirebaseConfigured() && (
        <div className="error">
          Firebase is not configured. Copy <b>.env.example</b> to <b>.env.local</b> and fill it in.
        </div>
      )}
      {err && <div className="error">{err}</div>}

      <form className="v-card" onSubmit={submit} style={{ marginBottom: 16 }}>
        {mode === 'up' && (
          <div className="field">
            <label htmlFor="name">Your name</label>
            <input id="name" value={name} onChange={(e) => setName(e.target.value)}
              autoComplete="name" placeholder="Mrs Sharma" />
          </div>
        )}
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            autoComplete="email" required />
        </div>

        <div className="field" style={{ marginBottom: 22 }}>
          <label htmlFor="password">Password</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'up' ? 'new-password' : 'current-password'} required />
        </div>

        <button type="submit" className="v-btn-primary v-tap" disabled={busy || !isFirebaseConfigured()}>
          {busy ? 'Just a moment…' : mode === 'in' ? 'Sign in' : 'Create account'}
        </button>
      </form>

      <div style={{ textAlign: 'center' }}>
        <button className="v-link" onClick={() => { setErr(null); setMode(mode === 'in' ? 'up' : 'in'); }}>
          {mode === 'in' ? 'New here? Create an account' : 'I already have an account'}
        </button>
      </div>
    </div>
  );
}
