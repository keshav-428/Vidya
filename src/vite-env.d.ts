/// <reference types="vite/client" />

// Typed access to the VITE_* variables this app reads (import.meta.env.*).
// Keep in sync with .env.local and the deployment environment.
interface ImportMetaEnv {
  readonly VITE_API_BASE?: string;
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
