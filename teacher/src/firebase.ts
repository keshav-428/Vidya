// ─────────────────────────────────────────────────────────────
//  Firebase client init (Auth only).
//
//  Same project as the student app — a teacher signs in against the same
//  user directory — but configured separately so this app can be deployed
//  and rotated without touching the student build.
//
//  Config comes from .env.local (VITE_FIREBASE_*). The apiKey is a public
//  client identifier, not a secret.
// ─────────────────────────────────────────────────────────────
import { initializeApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = () =>
  Boolean(firebaseConfig.apiKey && firebaseConfig.appId);

let auth: Auth | null = null;
if (isFirebaseConfigured()) {
  auth = getAuth(initializeApp(firebaseConfig));
} else {
  // Unlike the student app there is no guest mode here: without a verified
  // sign-in the backend will not hand over anything, because these screens
  // show other people's children.
  console.warn('[Vidya Teacher] Firebase not configured — fill in .env.local.');
}

export { auth };
