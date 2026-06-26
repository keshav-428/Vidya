// ─────────────────────────────────────────────────────────────
//  Guest access limits. Guests can do a handful of full sessions
//  before they're asked to create an account to keep going.
// ─────────────────────────────────────────────────────────────
import type { AppState } from '../types';

export const FREE_SESSION_LIMIT = 5;

/** A user with no account (uid). */
export const isGuest = (state: AppState | undefined): boolean => !state?.userId;

export const guestSessionsUsed = (state: AppState | undefined): number =>
  Number(state?.guestSessions) || 0;

export const guestSessionsLeft = (state: AppState | undefined): number =>
  Math.max(0, FREE_SESSION_LIMIT - guestSessionsUsed(state));

/** True once a guest has used up their free sessions and must sign up. */
export const guestLimitReached = (state: AppState | undefined): boolean =>
  isGuest(state) && guestSessionsUsed(state) >= FREE_SESSION_LIMIT;
