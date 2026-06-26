// ─────────────────────────────────────────────────────────────
//  Auth context object, types, and the useAuth hook.
//  Kept separate from AuthContext.tsx (which holds the provider
//  component) so each file is a clean Fast-Refresh boundary.
// ─────────────────────────────────────────────────────────────
import { createContext, useContext } from 'react';

/** The minimal user shape the app keeps in memory. */
export interface AuthUser {
  uid: string;
  email: string | null;
}

export interface AuthResult {
  uid: string;
  isNew: boolean;
}

export interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  configured: boolean;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  logIn: (email: string, password: string) => Promise<AuthResult>;
  logOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
