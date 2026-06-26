// ─────────────────────────────────────────────────────────────
//  App context — shared state/navigation handle.
//  Kept in its own module (no component) so App.tsx stays a clean
//  Fast-Refresh boundary that only exports the App component.
// ─────────────────────────────────────────────────────────────
import { createContext, useContext } from 'react';
import type { ScreenId } from './routes';
import type { AppState, SetFn, GoFn } from './types';

export interface AppContextValue {
  state: AppState;
  set: SetFn;
  go: GoFn;
  currentScreen: ScreenId;
}

export const AppContext = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue | null {
  return useContext(AppContext);
}
