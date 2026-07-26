// ─────────────────────────────────────────────────────────────
//  Route map — single source of truth for screen-id → URL path.
//  `ScreenId` is derived from these keys, so every go(...) call and
//  every <Route> is checked against the same list (no drift).
// ─────────────────────────────────────────────────────────────
export const SCREEN_ROUTES = {
  'splash': '/',
  'role': '/role',
  'onb-language': '/onb/language',
  'onb-class': '/onb/class',
  'onb-goal': '/onb/goal',
  'onb-name': '/onb/name',
  'diag-intro': '/onb/diag-intro',
  'build-plan': '/onb/build-plan',
  'diag-q1': '/onb/diag-q1',
  'diag-summary': '/onb/diag-summary',
  'diag-building': '/onb/diag-building',
  'diag-result': '/onb/diag-result',
  'first-plan': '/onb/first-plan',
  'save-progress': '/save-progress',
  'signup': '/signup',
  'password': '/password',
  'home': '/home',
  'home-post-diag': '/home/post-diag',
  'week-plan': '/week-plan',
  'learn': '/learn',
  'chapter-topics': '/learn/chapter',
  'learn-concept': '/learn/concept',
  'homework': '/homework',
  'cheat-sheet': '/learn/sheet',
  'quiz-loading-1': '/quiz/loading/1',
  'quiz-loading-2': '/quiz/loading/2',
  'quiz-loading-3': '/quiz/loading/3',
  'quiz-loading-4': '/quiz/loading/4',
  'navigable-quiz': '/quiz/navigable',
  'final-review': '/quiz/final-review',
  'quiz-result-summary': '/quiz/result-summary',
  'quiz-review-question': '/quiz/review-question',
  'practice': '/practice',
  'viva': '/practice/viva',
  'exam-config': '/exam/config',
  'exam-loading-1': '/exam/loading/1',
  'exam-loading-2': '/exam/loading/2',
  'exam-paper': '/exam/paper',
  'exam-photo': '/exam/photo',
  'exam-submit': '/exam/submit',
  'exam-eval-loading': '/exam/eval-loading',
  'exam-eval-results': '/exam/eval-results',
  'exam-detail': '/exam/detail',
  'session-analysis': '/session-analysis',
  'progress': '/progress',
  'topic-mastery': '/progress/topic-mastery',
  'profile': '/profile',
} as const;

/** A valid screen identifier — the keys of {@link SCREEN_ROUTES}. */
export type ScreenId = keyof typeof SCREEN_ROUTES;

/** A URL path served by the app. */
export type ScreenPath = (typeof SCREEN_ROUTES)[ScreenId];
