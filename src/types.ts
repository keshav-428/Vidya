// ─────────────────────────────────────────────────────────────
//  Shared domain types for the Vidya app.
//
//  Three groups live here:
//   1. App shell — AppState, ScreenProps (the uniform { go, state, set }
//      every screen receives), and the icon name union.
//   2. Backend API shapes — mirror backend/main.py response models.
//      Keep these in sync with src/api/vidya.ts.
//   3. Concept content — the card/skill data the ConceptScreen renders.
// ─────────────────────────────────────────────────────────────
import type { ScreenId } from './routes';

export type { ScreenId } from './routes';

// ═══ 1. App shell ════════════════════════════════════════════

/** UI language code stored in state. Legacy 'English'/'Hindi' also appear. */
export type LanguageCode = 'en' | 'hi';

/**
 * The app's global state — persisted to localStorage per user (see App.tsx).
 *
 * Known fields are typed; the index signature is the deliberate seam for the
 * remaining localStorage grab-bag. Prefer adding a field here over relying on
 * the fallback, so new state gets real type-checking.
 */
export interface AppState {
  // identity / onboarding
  name?: string;
  role?: string;
  class?: string;
  classLevel?: string;
  subject?: string;
  goal?: string;
  language?: string;
  userId?: string | null;
  email?: string;

  // session + plan
  sessionStep?: number;
  sessionDate?: string;
  sessionDuration?: number | string;
  planTopicId?: string;
  planSection?: string;         // today's subtopic section (e.g. "1.2"); absent ⇒ chapter-wise
  planSubtopicTitle?: string;   // today's subtopic title
  planIntro?: 'auto' | 'own';    // first visit to the week plan, straight from the warm-up
  /** Topics this session covers. Length 1 = classic single-topic session;
   *  the singular planSection/planSubtopicTitle mirror entry [0]. */
  planSessionSel?: PracticeSelection[];
  weekPlan?: unknown;
  ownPlan?: unknown;
  planMascotSeen?: boolean;
  buildPlanCoachSeen?: boolean;
  coachStep?: number;

  // learn / diagnostic
  skillId?: string | null;
  conceptLayout?: string;
  diagLevel?: unknown;
  diagChapters?: unknown;

  // progress — accumulating record of quizzes, exams, and sessions
  activityLog?: ActivityEntry[];
  mastery?: MasteryMap;
  masteryMigrated?: boolean;      // one-time seed from legacy activityLog done
  masteryLearnedFixed?: boolean;  // one-time strip of load-time 'learned' flags done
  lastMasteryDelta?: MasteryDelta;
  /** Was the last quiz today's session quiz (vs practice / mastery-map)? */
  lastQuizWasSession?: boolean;
  askedConcept?: string | null;
  askedChapterId?: string | null;
  askedSection?: string | null;
  /** The specific question a photo/typed ask is about; narrows the lesson. */
  askedFocus?: string | null;
  /** Ad-hoc "teach me these topics" input (viva prep). Distinct from
   *  planSessionSel so it never disturbs today's session. */
  lessonSel?: PracticeSelection[] | null;
  /** Where to go when that ad-hoc lesson finishes. */
  lessonNext?: ScreenId | null;

  // viva
  vivaSel?: PracticeSelection[];
  vivaMode?: 'learn' | 'practice' | 'both';
  vivaLevel?: 'easy' | 'normal' | 'hard';
  /** One-shot difficulty override for the next quiz (student-chosen), instead
   *  of the usual mastery-derived difficulty. */
  quizLevel?: 'easy' | 'normal' | 'hard' | null;
  /** Past mistakes to aim the next quiz at (the retry card). */
  quizFocusPoints?: string[] | null;

  // auth flow
  afterAuth?: ScreenId;
  /** Completed learning sessions used while a guest (gates free access). */
  guestSessions?: number;
  /** When true, the save-progress screen becomes a mandatory signup wall. */
  signupRequired?: boolean;

  // migration seam — see doc comment above
  [key: string]: unknown;
}

/** Navigate to another screen by id. */
export type GoFn = (screenId: ScreenId) => void;

/** Shallow-merge a patch into the global app state. */
export type SetFn = (patch: Partial<AppState>) => void;

/** Props every routed screen receives from App.tsx. */
export interface ScreenProps {
  go: GoFn;
  state: AppState;
  set: SetFn;
  /** Only the multi-frame loading screens use this. */
  frame?: number;
}

/** Every icon name VIcon knows how to render (see prototype/icons.tsx). */
export type IconName =
  | 'arrow-right' | 'arrow-left' | 'check' | 'x'
  | 'chevron-right' | 'chevron-down' | 'chevron-up'
  | 'sparkles' | 'flame' | 'book' | 'home' | 'compass' | 'chart'
  | 'user' | 'menu' | 'search' | 'bell' | 'camera' | 'upload'
  | 'clock' | 'edit' | 'play' | 'lock' | 'eye' | 'lightbulb'
  | 'target' | 'zap' | 'star' | 'plus' | 'pencil' | 'feather'
  | 'send' | 'heart' | 'heart-fill' | 'more' | 'thumbs-up'
  | 'thumbs-down' | 'skip' | 'help' | 'logout' | 'shield'
  | 'globe' | 'calendar' | 'mic' | 'trending-up';

// ═══ 1b. Progress / activity tracking ════════════════════════

export type ActivityKind = 'quiz' | 'exam' | 'session';

export interface ActivityMistake {
  question: string;
  user_answer?: unknown;
  correct_answer?: unknown;
}

/** One recorded learning event, accumulated in AppState.activityLog. */
export interface ActivityEntry {
  kind: ActivityKind;
  /** ISO timestamp (new Date().toISOString()). */
  date: string;
  topic: string;
  /** Stable catalog coordinates — the aggregation unit for mastery.
   *  Absent on legacy entries and multi-topic events. */
  chapterId?: string;
  section?: string | null;   // subtopic number e.g. "1.2"; null ⇒ chapter-wide
  /** Points earned (0 for a plain session with no score). */
  score: number;
  /** Max points (0 ⇒ unscored, e.g. a session). */
  total: number;
  mistakes?: ActivityMistake[];
}

/** Recency-weighted mastery for one skill (subtopic or chapter). */
export interface SkillMastery {
  ewma: number;        // 0..1 recency-weighted correctness
  attempts: number;    // total scored questions seen
  learned: boolean;    // concept session completed at least once
  lastSeen: string;    // ISO
  source: 'diagnostic' | 'practice' | 'mixed';
}

/** skillKey (chapterId or chapterId::section) → mastery. */
export type MasteryMap = Record<string, SkillMastery>;

// ── Adaptive lesson (teaching beats) ─────────────────────────
/** A micro-check question inside a lesson beat. */
export interface LessonMCQ {
  prompt: string;
  options: string[];
  correct_index: number;
  right?: string;    // feedback when correct
  wrong?: string;    // kind feedback when missed
}
export interface LessonHook {
  scenario: string;
  options: string[];
  best_index?: number;
  reveal: string;    // teasing line shown after the guess (no spoiler)
}
export interface LessonConceptCard { heading: string; body: string; }
export interface LessonExample {
  part: string;      // the sub-skill this example covers
  q: string;
  steps: { label: string; detail: string }[];
  answer: string;
  your_turn: LessonMCQ;
}
export interface SpotMistake {
  story: string;     // the wrong solution, shown as a mini story
  prompt?: string;
  options: string[];
  correct_index: number;
  explain: string;
}
/** Full adaptive lesson: hook → concept (+alt branch) → examples → mistakes game. */
export interface AdaptiveLesson {
  hook: LessonHook;
  concept_cards: LessonConceptCard[];
  alt_explanation?: LessonConceptCard;
  check: LessonMCQ;
  easier_check?: LessonMCQ;
  examples: LessonExample[];
  spot_mistakes: SpotMistake[];
}

// ── Chapter cheat sheet (screenshot before the test) ─────────
export interface CheatSheet {
  title?: string;
  rules?: { name: string; rule: string }[];
  tricks?: { trick: string; why?: string }[];
  traps?: { mistake: string; fix: string }[];
}

// ── Homework help (photograph the page, get nudged) ──────────
export interface HomeworkQuestion {
  number?: string;
  question: string;
  hint?: string;
  next_step?: string;
  steps?: { label: string; detail: string }[];
  answer?: string;
}
export interface HomeworkResult {
  detected: boolean;
  summary?: string;
  questions: HomeworkQuestion[];
}

/** Before→after mastery change for one skill, shown after a quiz/exam. */
export interface MasteryDelta {
  key: string;
  title: string;
  fromLevel: string;   // MasteryLevel
  toLevel: string;     // MasteryLevel
  percent: number;     // round(ewma*100)
  leveledUp: boolean;
}

// ═══ 2. Backend API shapes ═══════════════════════════════════

/** Response from POST /ask (RAG answer). */
export interface AskResponse {
  explanation: string;
  key_principle?: string;
  common_mistake?: string;
  suggestions?: string[];
  context_used?: string[];
}

/** One multiple-choice question. `answer` is the index into `options`. */
export interface QuizQuestion {
  question: string;
  options: string[];
  answer: number;
  explanation?: string;
  /** Which of the requested topics this question tests (verbatim topic string). */
  topic?: string;
  /** Difficulty tier in the adaptive pool. */
  difficulty?: 'easy' | 'medium' | 'hard';
  /** One strategy nudge (never the answer). */
  hint?: string;
  /** Per-option note: why-right for the correct one, the specific mix-up for wrong ones. */
  option_notes?: string[];
}

/** One picked practice unit (subtopic) — carried into the quiz for
 *  per-skill mastery attribution. */
export interface PracticeSelection {
  chapterId: string;
  section: string;
  title: string;
}

/** Structured post-quiz feedback (POST /quiz-feedback). Shape is LLM-driven. */
export interface QuizFeedback {
  win?: string;
  pattern?: string;
  next_step?: string;
  [key: string]: unknown;
}

/** One YouTube result from POST /search-videos. */
export interface VideoItem {
  title: string;
  url?: string;
  thumbnail?: string;
  theme?: string;
  duration?: string;
  channel?: string;
  views?: string;
}

/** One real-world use from POST /real-world. */
export interface RealWorldUse {
  title?: string;
  context?: string;
  example?: string;
  body?: string;
  tag?: string;
}

/** Response from POST /generate-concept (RAG-grounded lesson). */
export interface ConceptResponse {
  definition?: string;
  mistakes?: MistakeItem[];
  examples?: ExampleItem[];
}

/** One section of a generated exam paper. */
export interface PaperSection {
  name: string;
  marks_per_q: number;
  instructions?: string;
  questions: unknown[];
}

/** Response from POST /generate-paper. */
export interface Paper {
  sections: PaperSection[];
}

/** Response from POST /grade-paper. */
export interface GradeResult {
  total_awarded: number;
  total_possible: number;
  percentage: number;
  sections: unknown[];
}

// ═══ 3. Concept content (cards the ConceptScreen renders) ════

export type CardType = 'definition' | 'mistakes' | 'realLife' | 'examples' | 'videos';

/** A small inline diagram embedded in a card. */
export interface Visual {
  kind: 'pizza' | 'fractionBars' | 'compareBars' | string;
  slices?: number;
  filled?: number;
  numerator?: number;
  denominator?: number;
  a?: { numerator: number; denominator: number };
  b?: { numerator: number; denominator: number };
}

export interface MistakeItem {
  title: string;
  wrong: string;
  right: string;
  why: string;
}

export interface ExampleStep {
  label: string;
  detail: string;
}

export interface ExampleItem {
  q: string;
  steps: ExampleStep[];
  answer: string;
}

export interface Scene {
  theme?: string;
  label: string;
  title: string;
  body: string;
  tag: string;
}

/**
 * A concept card. Fields are per-`type` (the renderer in conceptVisuals.tsx
 * reads only the ones relevant to each type), so they're all optional here.
 */
export interface Card {
  type: CardType;
  eyebrow?: string;
  heading?: string;
  body?: string;
  visual?: Visual;
  items?: MistakeItem[];
  examples?: ExampleItem[];
  scenes?: Scene[];
  videos?: VideoItem[];
  [key: string]: unknown;
}

/** A unit of mastery within a chapter (see content/fractionsChapter.ts). */
export interface Skill {
  id: string;
  title: string;
  subtitle?: string;
  cards: Card[];
  [key: string]: unknown;
}
