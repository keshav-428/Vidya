// ─────────────────────────────────────────────────────────────
//  Firebase client init (Auth).
//
//  Web config comes from .env.local (VITE_FIREBASE_*). The apiKey is a
//  public client identifier, not a secret — security is enforced by
//  Firebase Auth rules, not by hiding it.
//
//  isFirebaseConfigured() lets the app degrade gracefully (fall back to
//  a local guest session) until the config is filled in.
// ─────────────────────────────────────────────────────────────
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = () =>
  Boolean(firebaseConfig.apiKey && firebaseConfig.appId);

let auth = null;
if (isFirebaseConfigured()) {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
} else {
  // eslint-disable-next-line no-console
  console.warn('[Vidya] Firebase not configured — fill in .env.local. Running in guest mode.');
}

export { auth };
