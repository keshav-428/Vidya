// ─────────────────────────────────────────────────────────────
//  Onboarding diagnostic — the SINGLE source of truth for the
//  questions, scoring, and how results seed the first plan.
//  (Previously the questions and the answer key were duplicated
//  across DiagQ1Screen and DiagResultScreen and drifted apart.)
// ─────────────────────────────────────────────────────────────
import type { AppState } from '../types';
import { classChapters } from './syllabus';

export interface DiagOption { id: string; label: string; }
export interface DiagQuestion {
  chapter: string;
  prompt: string;
  options: DiagOption[];
  correctId: string;
}

export const DIAG_CHAPTERS = ['Numbers', 'Fractions', 'Decimals', 'Integers', 'Algebra', 'Geometry'];

export const DIAG_QUESTIONS: DiagQuestion[] = [
  { chapter: 'Numbers', prompt: 'Which is the largest?', options: [{ id: 'a', label: '0.5' }, { id: 'b', label: '1/3' }, { id: 'c', label: '0.45' }, { id: 'd', label: '2/5' }], correctId: 'a' },
  { chapter: 'Numbers', prompt: 'What is the place value of 7 in 4,732?', options: [{ id: 'a', label: '7' }, { id: 'b', label: '70' }, { id: 'c', label: '700' }, { id: 'd', label: '7,000' }], correctId: 'c' },
  { chapter: 'Fractions', prompt: 'What is ½ + ⅓?', options: [{ id: 'a', label: '⅖' }, { id: 'b', label: '⅚' }, { id: 'c', label: '⅔' }, { id: 'd', label: '⅙' }], correctId: 'b' },
  { chapter: 'Fractions', prompt: 'Which fraction equals ¾?', options: [{ id: 'a', label: '6/8' }, { id: 'b', label: '3/5' }, { id: 'c', label: '4/5' }, { id: 'd', label: '2/3' }], correctId: 'a' },
  { chapter: 'Decimals', prompt: 'What is 0.6 + 0.25?', options: [{ id: 'a', label: '0.31' }, { id: 'b', label: '0.85' }, { id: 'c', label: '0.65' }, { id: 'd', label: '0.90' }], correctId: 'b' },
  { chapter: 'Decimals', prompt: 'Which is the smallest?', options: [{ id: 'a', label: '0.7' }, { id: 'b', label: '0.07' }, { id: 'c', label: '0.77' }, { id: 'd', label: '0.17' }], correctId: 'b' },
  { chapter: 'Integers', prompt: 'What is (−3) + 5?', options: [{ id: 'a', label: '−8' }, { id: 'b', label: '2' }, { id: 'c', label: '−2' }, { id: 'd', label: '8' }], correctId: 'b' },
  { chapter: 'Integers', prompt: 'What is (−4) × (−2)?', options: [{ id: 'a', label: '−8' }, { id: 'b', label: '8' }, { id: 'c', label: '−6' }, { id: 'd', label: '6' }], correctId: 'b' },
  { chapter: 'Algebra', prompt: 'If 3x = 18, what is x?', options: [{ id: 'a', label: '3' }, { id: 'b', label: '6' }, { id: 'c', label: '9' }, { id: 'd', label: '18' }], correctId: 'b' },
  { chapter: 'Algebra', prompt: 'Simplify: 2a + 3a', options: [{ id: 'a', label: '5a' }, { id: 'b', label: '6a' }, { id: 'c', label: '23a' }, { id: 'd', label: '5' }], correctId: 'a' },
  { chapter: 'Geometry', prompt: 'Angles in a triangle add up to…', options: [{ id: 'a', label: '90°' }, { id: 'b', label: '120°' }, { id: 'c', label: '180°' }, { id: 'd', label: '360°' }], correctId: 'c' },
  { chapter: 'Geometry', prompt: 'A right angle measures…', options: [{ id: 'a', label: '45°' }, { id: 'b', label: '90°' }, { id: 'c', label: '120°' }, { id: 'd', label: '60°' }], correctId: 'b' },
];

export type DiagLevelId = 'needs' | 'improving' | 'confident' | 'strong';
export const DIAG_RUNGS: DiagLevelId[] = ['needs', 'improving', 'confident', 'strong'];

export interface ChapterScore { chapter: string; correct: number; total: number; ratio: number; }
export interface DiagOutcome {
  correct: number;
  attempted: number;
  total: number;
  ratio: number;
  level: DiagLevelId;
  perChapter: ChapterScore[];
  strong: string[];   // chapters answered well (≥70%)
  weak: string[];     // chapters to start with (<50%), weakest first
}

export function levelFor(ratio: number): DiagLevelId {
  if (ratio >= 0.9) return 'strong';
  if (ratio >= 0.7) return 'confident';
  if (ratio >= 0.4) return 'improving';
  return 'needs';
}

/** Score the answers captured in state (diag_0…diag_N) into a real outcome. */
export function scoreDiagnostic(state: AppState): DiagOutcome {
  let correct = 0, attempted = 0;
  const tally = new Map<string, { correct: number; total: number }>();
  DIAG_QUESTIONS.forEach((q, i) => {
    const c = tally.get(q.chapter) || { correct: 0, total: 0 };
    c.total += 1;
    const a = state[`diag_${i}`];
    if (a && a !== '__skip__') {
      attempted += 1;
      if (a === q.correctId) { correct += 1; c.correct += 1; }
    }
    tally.set(q.chapter, c);
  });
  const perChapter: ChapterScore[] = DIAG_CHAPTERS.map((chapter) => {
    const c = tally.get(chapter) || { correct: 0, total: 0 };
    return { chapter, correct: c.correct, total: c.total, ratio: c.total ? c.correct / c.total : 0 };
  });
  const ratio = attempted ? correct / attempted : 0;
  const strong = perChapter.filter((c) => c.total > 0 && c.ratio >= 0.7).map((c) => c.chapter);
  const weak = perChapter
    .filter((c) => c.total > 0 && c.ratio < 0.5)
    .sort((a, b) => a.ratio - b.ratio)
    .map((c) => c.chapter);
  return { correct, attempted, total: DIAG_QUESTIONS.length, ratio, level: levelFor(ratio), perChapter, strong, weak };
}

// Map a diagnostic area → the NCERT chapter id the plan should start on.
// (Only areas with a Class 6 syllabus home are mapped; others fall through.)
const DIAG_CHAPTER_TOPIC: Record<string, string> = {
  Numbers: 'number-play',
  Fractions: 'fractions',
  Decimals: 'fractions',
  Integers: 'integers',
  Geometry: 'lines-angles',
};

/** The chapter id to seed the first plan with: the weakest mapped area, else null. */
export function firstPlanTopic(outcome: DiagOutcome): string | null {
  for (const ch of outcome.weak) {
    if (DIAG_CHAPTER_TOPIC[ch]) return DIAG_CHAPTER_TOPIC[ch];
  }
  return null;
}

// ─────────────────────────────────────────────────────────────
//  LLM-generated diagnostic (class- + goal-aware). The questions are
//  generated at runtime (see api.generateDiagnostic); these helpers score
//  that set and seed the first plan with a class-correct chapter id.
// ─────────────────────────────────────────────────────────────
export interface GenQ { area: string; prompt: string; options: string[]; correct_index: number; }

/** Static fallback set (normalized to the generated shape) if generation fails. */
export const STATIC_FALLBACK: GenQ[] = DIAG_QUESTIONS.map((q) => ({
  area: q.chapter,
  prompt: q.prompt,
  options: q.options.map((o) => o.label),
  correct_index: Math.max(0, q.options.findIndex((o) => o.id === q.correctId)),
}));

/** Score a generated set against the picked option indices (null = unanswered). */
export function scoreFromSet(questions: GenQ[], answers: (number | null | undefined)[]): DiagOutcome {
  let correct = 0, attempted = 0;
  const tally = new Map<string, { correct: number; total: number }>();
  questions.forEach((q, i) => {
    const c = tally.get(q.area) || { correct: 0, total: 0 };
    c.total += 1;
    const a = answers[i];
    if (a != null) {
      attempted += 1;
      if (a === q.correct_index) { correct += 1; c.correct += 1; }
    }
    tally.set(q.area, c);
  });
  const perChapter: ChapterScore[] = [...tally.entries()].map(([chapter, c]) => ({
    chapter, correct: c.correct, total: c.total, ratio: c.total ? c.correct / c.total : 0,
  }));
  const ratio = attempted ? correct / attempted : 0;
  const strong = perChapter.filter((c) => c.ratio >= 0.7).map((c) => c.chapter);
  const weak = perChapter.filter((c) => c.ratio < 0.5).sort((a, b) => a.ratio - b.ratio).map((c) => c.chapter);
  return { correct, attempted, total: questions.length, ratio, level: levelFor(ratio), perChapter, strong, weak };
}

// Keywords that map a diagnostic "area" to a chapter title in any class.
const AREA_KEYWORDS: Record<string, string[]> = {
  Numbers: ['number', 'large number', 'prime', 'playing with'],
  Fractions: ['fraction'],
  Decimals: ['decimal', 'point'],
  Integers: ['integer', 'zero', 'negative'],
  Algebra: ['algebra', 'expression', 'letter', 'equation', 'unknown'],
  Geometry: ['line', 'angle', 'triangle', 'geometr', 'shape', 'symmetry', 'quadrilateral', 'construction'],
  Mensuration: ['perimeter', 'area', 'mensuration'],
  Data: ['data', 'graph', 'handling'],
};

/** Resolve a diagnostic area (strand) → a class-aware chapter id, or null. */
export function chapterIdForArea(area: string, grade: number): string | null {
  const chs = classChapters(grade);
  const kws = AREA_KEYWORDS[area] || [area.toLowerCase()];
  const m = chs.find((c) => kws.some((k) => c.title.toLowerCase().includes(k)));
  return m ? m.id : null;
}

/** Class-correct chapter id (g{grade}-…) to seed the plan: weakest matched area, else chapter 1. */
export function classAwarePlanTopic(outcome: DiagOutcome, grade: number): string | null {
  const chs = classChapters(grade);
  if (!chs.length) return null;
  for (const area of outcome.weak) {
    const kws = AREA_KEYWORDS[area] || [area.toLowerCase()];
    const match = chs.find((c) => kws.some((k) => c.title.toLowerCase().includes(k)));
    if (match) return match.id;
  }
  return chs[0].id;
}

/** Ordered class-aware chapter ids for the week plan: weak areas first (mapped to
 *  chapters), then the remaining class chapters — always enough to fill a week. */
export function classAwareWeakChapters(outcome: DiagOutcome, grade: number): string[] {
  const chs = classChapters(grade);
  const picked: string[] = [];
  const add = (id?: string) => { if (id && !picked.includes(id)) picked.push(id); };
  for (const area of outcome.weak) {
    const kws = AREA_KEYWORDS[area] || [area.toLowerCase()];
    const m = chs.find((c) => kws.some((k) => c.title.toLowerCase().includes(k)));
    if (m) add(m.id);
  }
  chs.forEach((c) => add(c.id));   // fill remainder in syllabus order
  return picked;
}

/** Score subtopic-level drill questions (each tagged with a subtopic name).
 *  Returns per-subtopic scores and identifies the weakest subtopic. */
export interface SubtopicScore { subtopic: string; correct: number; attempted: number; ratio: number; }
export function scoreDrillSet(questions: (GenQ & { subtopic?: string })[], answers: (number | null | undefined)[]): {
  perSubtopic: SubtopicScore[];
  correct: number;
  attempted: number;
  weakest?: string;  // lowest-scoring subtopic for plan seeding
} {
  const bySubtopic: Record<string, { correct: number; attempted: number }> = {};
  let totalCorrect = 0, totalAttempted = 0;
  questions.forEach((q, i) => {
    const st = q.subtopic || '(unknown)';
    const ans = answers[i];
    if (ans === null || ans === undefined) return;
    totalAttempted++;
    if (!bySubtopic[st]) bySubtopic[st] = { correct: 0, attempted: 0 };
    bySubtopic[st].attempted++;
    if (ans === q.correct_index) { bySubtopic[st].correct++; totalCorrect++; }
  });
  const perSubtopic = Object.entries(bySubtopic).map(([s, scores]) => ({
    subtopic: s,
    correct: scores.correct,
    attempted: scores.attempted,
    ratio: scores.attempted ? scores.correct / scores.attempted : 0,
  })).sort((a, b) => a.ratio - b.ratio);
  return { perSubtopic, correct: totalCorrect, attempted: totalAttempted, weakest: perSubtopic[0]?.subtopic };
}

/** Identify the weakest chapter from the coarse diagnostic (for drill).
 *  Returns the first (weakest) chapter id from classAwareWeakChapters. */
export function weakestChapterForDrill(outcome: DiagOutcome, grade: number): string | null {
  const ids = classAwareWeakChapters(outcome, grade);
  return ids.length ? ids[0] : null;
}
