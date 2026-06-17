// ─────────────────────────────────────────────────────────────
//  Auth context — wraps the app, exposes the current user + actions.
//
//  When Firebase isn't configured yet, runs in "guest" mode so the
//  prototype still works (no crash); signUp/signIn surface a clear error.
// ─────────────────────────────────────────────────────────────
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../firebase';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

// Turn Firebase error codes into friendly messages.
function friendly(err) {
  const code = err?.code || '';
  if (code.includes('email-already-in-use')) return 'That email already has an account. Try logging in.';
  if (code.includes('invalid-email')) return 'That doesn\'t look like a valid email.';
  if (code.includes('weak-password')) return 'Password should be at least 6 characters.';
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found'))
    return 'Email or password is incorrect.';
  if (code.includes('network')) return 'Network error — check your connection.';
  return err?.message || 'Something went wrong. Try again.';
}

export function AuthProvider({ children }) {
  const configured = isFirebaseConfigured();
  const [user, setUser] = useState(null);          // { uid, email } | null
  const [loading, setLoading] = useState(configured);

  useEffect(() => {
    if (!configured) { setLoading(false); return; }
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u ? { uid: u.uid, email: u.email } : null);
      setLoading(false);
    });
    return unsub;
  }, [configured]);

  const signUp = async (email, password) => {
    if (!configured) throw new Error('Auth is not configured yet (fill in .env.local).');
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      return { uid: cred.user.uid, isNew: true };
    } catch (err) { throw new Error(friendly(err)); }
  };

  const logIn = async (email, password) => {
    if (!configured) throw new Error('Auth is not configured yet (fill in .env.local).');
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      return { uid: cred.user.uid, isNew: false };
    } catch (err) { throw new Error(friendly(err)); }
  };

  const logOut = async () => {
    if (configured) await fbSignOut(auth);
    setUser(null);
  };

  const value = { user, loading, configured, signUp, logIn, logOut };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
