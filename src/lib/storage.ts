// ─────────────────────────────────────────────────────────────
//  localStorage bucket helpers.
//
//  Signed-in users get a per-uid bucket. The shared bucket below only
//  holds the little state that exists before auth resolves (splash and
//  the signup screens) — an account is now required before any
//  onboarding or learning happens, so there is no progress to carry.
// ─────────────────────────────────────────────────────────────
const PRE_AUTH_KEY = 'vidya_state';

export const storageKeyFor = (uid: string | null): string =>
  (uid ? `vidya_state_${uid}` : PRE_AUTH_KEY);
