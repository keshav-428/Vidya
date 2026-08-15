// ─────────────────────────────────────────────────────────────
//  Feature switches — things that are built and working, but
//  deliberately not shown yet.
//
//  Nothing behind a switch is dead code: keep it working as the app
//  grows, so flipping the flag is all it takes to ship the feature.
// ─────────────────────────────────────────────────────────────

/**
 * The language picker: the onboarding step and the Profile switcher.
 *
 * Off for now — everyone gets English (see DEFAULT_STATE in App.tsx).
 * Everything underneath stays live: `src/i18n` still loads both bundles,
 * the `hi` translations are still maintained, every screen still reads
 * its copy through `t(...)`, and `state.language` still travels to the
 * backend on every call. Any NEW screen should keep doing all of that.
 *
 * Flip to `true` to bring the picker back. Note that the onboarding step
 * numbers are derived from this, so they renumber themselves (4 steps
 * with the language step, 3 without).
 */
export const LANGUAGE_PICKER_ENABLED = false;

/**
 * "I'll build my own plan" — the second option on the diagnostic result
 * screen, which sends the student to pick their own topics instead of
 * taking the plan Vidya just built.
 *
 * Off for now, so there is one way out of the diagnostic. `BuildPlanScreen`,
 * the `ownPlan` state and the week-plan screen's build-your-own tour are all
 * still wired up — only the button is hidden.
 */
export const OWN_PLAN_ENABLED = false;

/** Onboarding steps, so the "Step N of M" counters stay in sync. */
export const ONB_TOTAL_STEPS = LANGUAGE_PICKER_ENABLED ? 4 : 3;

/** Step number for a screen, given its position when language IS shown. */
export const onbStep = (stepWithLanguage: number): number =>
  LANGUAGE_PICKER_ENABLED ? stepWithLanguage : stepWithLanguage - 1;
