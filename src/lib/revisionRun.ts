// ─────────────────────────────────────────────────────────────
//  Revision run — clearing a chapter one subtopic at a time.
//
//  The 5-star quiz is a PRACTICE shape: the goal is "get 5 right" and finishing
//  early is the reward. Revising a chapter is a COVERAGE shape: the goal is
//  "every subtopic checked", and finishing early is failure. Measured on Number
//  Play (12 subtopics), the practice shape left 3 subtopics with no question at
//  all and the student answered 5 of 9 — so this is a different engine, not a
//  bigger quiz.
//
//  Each subtopic is a small gate: get CLEAR_TARGET right to clear it, within
//  MAX_PER_TOPIC tries. A topic that doesn't clear is marked "needs work" rather
//  than blocking the run, so one hard subtopic can't trap a student in it.
//
//  Everything here is plain JSON and pure functions, so a run can be saved
//  mid-way and resumed — a 12-subtopic chapter is more than one sitting.
// ─────────────────────────────────────────────────────────────

export const CLEAR_TARGET = 2;    // right answers needed to clear a subtopic
export const MAX_PER_TOPIC = 4;   // …within this many tries
export const BREATHER_EVERY = 3;  // offer a stopping point this often

export interface RunTopic {
  num: string;
  title: string;
}

export interface TopicResult {
  asked: number;
  right: number;
  /** Question ids already used for this topic, so a top-up doesn't repeat one. */
  used: number[];
  cleared: boolean;
  done: boolean;
}

export interface RunState {
  chapterId: string;
  chapterTitle: string;
  grade: number;
  topics: RunTopic[];
  /** Keyed by subtopic num. */
  results: Record<string, TopicResult>;
  /** Index into `topics` of the subtopic being revised now. */
  index: number;
  /** Topics finished since the last breather, for the stop/continue prompt. */
  sinceBreather: number;
  startedAt: string;
}

export type TopicStatus = 'pending' | 'current' | 'cleared' | 'needswork';

export function newRun(chapterId: string, chapterTitle: string, grade: number, topics: RunTopic[]): RunState {
  return {
    chapterId, chapterTitle, grade,
    topics: topics.map((t) => ({ num: String(t.num), title: t.title })),
    results: {}, index: 0, sinceBreather: 0,
    startedAt: new Date().toISOString(),
  };
}

const blank = (): TopicResult => ({ asked: 0, right: 0, used: [], cleared: false, done: false });

export function resultFor(state: RunState, num: string): TopicResult {
  return state.results[String(num)] || blank();
}

export function currentTopic(state: RunState): RunTopic | null {
  return state.topics[state.index] || null;
}

/** A subtopic is finished when it's cleared or it has used up its tries. */
function settle(r: TopicResult): TopicResult {
  const cleared = r.right >= CLEAR_TARGET;
  return { ...r, cleared, done: cleared || r.asked >= MAX_PER_TOPIC };
}

/** Record one answer against the current subtopic and advance if it's finished. */
export function recordAnswer(state: RunState, questionId: number, right: boolean): RunState {
  const topic = currentTopic(state);
  if (!topic) return state;
  const prev = resultFor(state, topic.num);
  const updated = settle({
    ...prev,
    asked: prev.asked + 1,
    right: prev.right + (right ? 1 : 0),
    used: prev.used.includes(questionId) ? prev.used : [...prev.used, questionId],
  });
  const results = { ...state.results, [topic.num]: updated };
  return {
    ...state,
    results,
    index: updated.done ? state.index + 1 : state.index,
    sinceBreather: updated.done ? state.sinceBreather + 1 : state.sinceBreather,
  };
}

/** How many more questions this subtopic may still ask. */
export function triesLeft(state: RunState, num: string): number {
  const r = resultFor(state, num);
  return Math.max(0, MAX_PER_TOPIC - r.asked);
}

/** Give up on the current subtopic and move on, marking it needs-work.
 *  The escape hatch for when no more questions can be had for it — a student
 *  must never be stuck on a topic because generation is failing. */
export function skipTopic(state: RunState): RunState {
  const topic = currentTopic(state);
  if (!topic) return state;
  const prev = resultFor(state, topic.num);
  return {
    ...state,
    results: { ...state.results, [topic.num]: { ...prev, cleared: false, done: true } },
    index: state.index + 1,
    sinceBreather: state.sinceBreather + 1,
  };
}

export function isRunComplete(state: RunState): boolean {
  return state.index >= state.topics.length;
}

/** Pause the run at a topic boundary and offer to stop — but never right at the
 *  end, where "keep going" is the only sensible answer. */
export function wantsBreather(state: RunState): boolean {
  return !isRunComplete(state)
    && state.sinceBreather >= BREATHER_EVERY
    && state.topics.length - state.index >= 2;
}

export function clearBreather(state: RunState): RunState {
  return { ...state, sinceBreather: 0 };
}

export function statusFor(state: RunState, num: string, i: number): TopicStatus {
  const r = state.results[String(num)];
  if (r?.done) return r.cleared ? 'cleared' : 'needswork';
  return i === state.index ? 'current' : 'pending';
}

export interface RunSummary {
  total: number;
  cleared: number;
  needsWork: RunTopic[];
  /** Subtopics never reached because the student stopped early. */
  notReached: RunTopic[];
  asked: number;
  right: number;
}

export function summarise(state: RunState): RunSummary {
  const needsWork: RunTopic[] = [];
  const notReached: RunTopic[] = [];
  let cleared = 0, asked = 0, right = 0;
  state.topics.forEach((t) => {
    const r = state.results[t.num];
    asked += r?.asked || 0;
    right += r?.right || 0;
    if (!r || !r.done) { if (!r?.asked) notReached.push(t); else needsWork.push(t); return; }
    if (r.cleared) cleared += 1;
    else needsWork.push(t);
  });
  return { total: state.topics.length, cleared, needsWork, notReached, asked, right };
}

/** Which subtopic each remaining question belongs to, so the screen can pick the
 *  next question for the current topic and skip ones already used. */
export function nextQuestionId(
  state: RunState,
  pool: { id: number; section?: string }[],
): number | null {
  const topic = currentTopic(state);
  if (!topic) return null;
  const used = resultFor(state, topic.num).used;
  const mine = pool.filter((q) => String(q.section || '') === topic.num && !used.includes(q.id));
  return mine.length ? mine[0].id : null;
}
