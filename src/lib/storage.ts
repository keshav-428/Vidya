// ─────────────────────────────────────────────────────────────
//  localStorage bucket helpers + guest→account migration.
//
//  Guests use a shared 'vidya_state' bucket; signed-in users get a
//  per-uid bucket. When a guest signs up, migrateGuestState copies
//  their progress into the new account so "create an account to save
//  your progress" actually keeps it.
// ─────────────────────────────────────────────────────────────
export const GUEST_KEY = 'vidya_state';

export const storageKeyFor = (uid: string | null): string =>
  (uid ? `vidya_state_${uid}` : GUEST_KEY);

/** Copy the guest's saved state into a freshly created account's bucket. */
export function migrateGuestState(uid: string): void {
  try {
    const guest = localStorage.getItem(GUEST_KEY);
    if (!guest) return;
    const key = storageKeyFor(uid);
    const existing = JSON.parse(localStorage.getItem(key) || '{}');
    // Brand-new account → existing is empty, so guest data carries over wholesale.
    // If the account somehow already has data, that wins over the guest copy.
    const merged = { ...JSON.parse(guest), ...existing };
    localStorage.setItem(key, JSON.stringify(merged));
  } catch {
    /* ignore quota / parse errors — worst case the account just starts fresh */
  }
}
