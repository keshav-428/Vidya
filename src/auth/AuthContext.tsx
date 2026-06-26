// ─────────────────────────────────────────────────────────────
//  Auth context — wraps the app, exposes the current user + actions.
//
//  When Firebase isn't configured yet, runs in "guest" mode so the
//  prototype still works (no crash); signUp/signIn surface a clear error.
// ─────────────────────────────────────────────────────────────
import React, { useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../firebase';
import { AuthContext, type AuthUser, type AuthResult } from './auth-context';

// Turn Firebase error codes into friendly messages.
function friendly(err: unknown): string {
  const e = err as { code?: string; message?: string } | null;
  const code = e?.code || '';
  if (code.includes('email-already-in-use')) return 'That email already has an account. Try logging in.';
  if (code.includes('invalid-email')) return 'That doesn\'t look like a valid email.';
  if (code.includes('weak-password')) return 'Password should be at least 6 characters.';
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found'))
    return 'Email or password is incorrect.';
  if (code.includes('network')) return 'Network error — check your connection.';
  return e?.message || 'Something went wrong. Try again.';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const configured = isFirebaseConfigured();
  const [user, setUser] = useState<AuthUser | null>(null);
  // Only "loading" while we actually have a configured Firebase auth to wait on.
  const [loading, setLoading] = useState(() => Boolean(configured && auth));

  useEffect(() => {
    if (!configured || !auth) return;
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u ? { uid: u.uid, email: u.email } : null);
      setLoading(false);
    });
    return unsub;
  }, [configured]);

  const signUp = async (email: string, password: string): Promise<AuthResult> => {
    if (!configured || !auth) throw new Error('Auth is not configured yet (fill in .env.local).');
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      return { uid: cred.user.uid, isNew: true };
    } catch (err) { throw new Error(friendly(err), { cause: err }); }
  };

  const logIn = async (email: string, password: string): Promise<AuthResult> => {
    if (!configured || !auth) throw new Error('Auth is not configured yet (fill in .env.local).');
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      return { uid: cred.user.uid, isNew: false };
    } catch (err) { throw new Error(friendly(err), { cause: err }); }
  };

  const logOut = async (): Promise<void> => {
    if (configured && auth) await fbSignOut(auth);
    setUser(null);
  };

  const value = { user, loading, configured, signUp, logIn, logOut };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
