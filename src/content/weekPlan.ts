// ─────────────────────────────────────────────────────────────
//  Week-plan data — topic catalog + per-topic study stacks.
//  Lives here (not in a screen) so both WeekPlanScreen and
//  HomeScreen can share it without crossing a Fast-Refresh boundary.
// ─────────────────────────────────────────────────────────────

/** Display info for a topic slot. */
export interface TopicInfo {
  title: string;
  sub: string;
  mins: number;
}

export const WEEK_TOPIC_CATALOG: Record<string, TopicInfo> = {
  'integers':       { title: 'Integers',              sub: 'Positive & negative numbers',     mins: 15 },
  'fractions':      { title: 'Fractions & Decimals',  sub: 'Parts of a whole',                mins: 15 },
  'data-handling':  { title: 'Data Handling',         sub: 'Mean, median & mode',             mins: 14 },
  'equations':      { title: 'Simple Equations',      sub: 'Finding the unknown',             mins: 18 },
  'lines-angles':   { title: 'Lines & Angles',        sub: 'Types and properties',            mins: 16 },
  'triangles':      { title: 'Triangles',             sub: 'Properties & congruence',         mins: 18 },
  'congruence':     { title: 'Congruence',            sub: 'Congruent figures & triangles',   mins: 16 },
  'comparing':      { title: 'Comparing Quantities',  sub: 'Ratios, percentages & profit',   mins: 16 },
  'rational':       { title: 'Rational Numbers',      sub: 'Number line & operations',        mins: 18 },
  'prac-geometry':  { title: 'Practical Geometry',    sub: 'Constructions with compass',      mins: 20 },
  'perimeter-area': { title: 'Perimeter & Area',      sub: 'Rectangles, triangles, circles', mins: 20 },
  'algebra-expr':   { title: 'Algebraic Expressions', sub: 'Terms, factors & evaluation',    mins: 18 },
  'exponents':      { title: 'Exponents & Powers',    sub: 'Laws and standard form',          mins: 15 },
  'symmetry':       { title: 'Symmetry',              sub: 'Lines of symmetry & rotation',   mins: 14 },
  'solids':         { title: 'Visualising Solids',    sub: '3D shapes and their nets',        mins: 16 },
  'review':         { title: 'Mixed Review',          sub: 'Consolidate the week',            mins: 20 },
};

export const WEEK_STACKS: Record<string, string[]> = {
  integers:       ['integers', 'rational', 'comparing', 'equations', 'review'],
  fractions:      ['fractions', 'rational', 'data-handling', 'comparing', 'review'],
  'data-handling':['data-handling', 'comparing', 'fractions', 'integers', 'review'],
  equations:      ['equations', 'algebra-expr', 'rational', 'integers', 'review'],
  'lines-angles': ['lines-angles', 'triangles', 'congruence', 'prac-geometry', 'review'],
  triangles:      ['triangles', 'lines-angles', 'congruence', 'symmetry', 'review'],
  congruence:     ['congruence', 'triangles', 'lines-angles', 'prac-geometry', 'review'],
  comparing:      ['comparing', 'fractions', 'rational', 'data-handling', 'review'],
  rational:       ['rational', 'integers', 'fractions', 'algebra-expr', 'review'],
  'prac-geometry':['prac-geometry', 'lines-angles', 'triangles', 'symmetry', 'review'],
  'perimeter-area':['perimeter-area', 'lines-angles', 'triangles', 'prac-geometry', 'review'],
  'algebra-expr': ['algebra-expr', 'equations', 'exponents', 'rational', 'review'],
  exponents:      ['exponents', 'algebra-expr', 'rational', 'integers', 'review'],
  symmetry:       ['symmetry', 'lines-angles', 'solids', 'prac-geometry', 'review'],
  solids:         ['solids', 'symmetry', 'perimeter-area', 'prac-geometry', 'review'],
  // legacy aliases
  decimals:       ['fractions', 'rational', 'data-handling', 'comparing', 'review'],
  algebra:        ['algebra-expr', 'equations', 'exponents', 'rational', 'review'],
  geometry:       ['lines-angles', 'triangles', 'perimeter-area', 'prac-geometry', 'review'],
};

// ─────────────────────────────────────────────────────────────
//  Auto week-plan builder — turns an ordered list of chapter ids
//  (e.g. from the diagnostic's weak areas) into a 7-day plan.
//  Weekdays get topics (cycling through the ids); weekends are free.
//  Shape matches what WeekPlanScreen + HomeScreen read.
// ─────────────────────────────────────────────────────────────
export interface AutoPlanDay {
  day: string; date: number; month: string; fullDate: Date;
  weekday: boolean; isToday: boolean;
  topicId: string | null; mins: number; status: string;
  // Subtopic-wise scoping: which specific skill this day covers.
  // section/subtopicTitle are null for legacy chapter-wide days.
  section?: string | null;
  subtopicTitle?: string | null;
}

/** One unit of study for a day — a subtopic within a chapter.
 *  section/title null ⇒ the whole chapter (coarse fallback). */
export interface PlanSlot {
  chapterId: string;
  section: string | null;
  title: string | null;
}

const _DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const _MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/** Minimal chapter shape needed to build slots (structurally satisfied by
 *  SyllabusChapter — kept loose so this module stays decoupled from syllabus.ts). */
export interface PlanChapter { id: string; subtopics: { num: string; title: string }[] }

/** Turn an ordered list of chapter ids into day slots, ROUND-ROBIN across the
 *  first `focusCount` chapters — one subtopic from each per pass.
 *
 *  Depth-first ordering (all of chapter A, then all of B) meant a 5-day week
 *  never got past chapter A, since most chapters have 6-12 subtopics. Weeks
 *  built from several weak areas now actually cover them.
 *
 *  Chapters beyond `focusCount` are appended (also round-robined) as filler for
 *  weeks that need more days than the focus chapters can supply. */
export function planSlots(orderedIds: string[], chapters: PlanChapter[], focusCount = 3): PlanSlot[] {
  const byId = new Map(chapters.map((c) => [c.id, c]));
  const groupFor = (id: string): PlanSlot[] => {
    const ch = byId.get(id);
    return ch && ch.subtopics.length
      ? ch.subtopics.map((s) => ({ chapterId: id, section: s.num, title: s.title }))
      : [{ chapterId: id, section: null, title: null }];   // coarse fallback
  };
  const groups = orderedIds.map(groupFor);
  const roundRobin = (gs: PlanSlot[][]): PlanSlot[] => {
    const out: PlanSlot[] = [];
    const depth = gs.reduce((m, g) => Math.max(m, g.length), 0);
    for (let i = 0; i < depth; i++) for (const g of gs) if (g[i]) out.push(g[i]);
    return out;
  };
  return [
    ...roundRobin(groups.slice(0, Math.max(1, focusCount))),
    ...roundRobin(groups.slice(Math.max(1, focusCount))),
  ];
}

// Accepts subtopic slots (preferred) or bare chapter ids (coarse fallback).
export function buildWeekPlan(input: PlanSlot[] | string[]): AutoPlanDay[] {
  const slots: PlanSlot[] = (input as unknown[]).map((it) =>
    typeof it === 'string' ? { chapterId: it, section: null, title: null } : (it as PlanSlot),
  );
  const today = new Date();
  let k = 0;
  // A ROLLING week: day 0 is today, not the previous Sunday. Anchoring to the
  // calendar week meant signing up on a Thursday produced a plan whose first
  // four days were already in the past.
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dow = d.getDay();
    const weekday = dow !== 0 && dow !== 6;   // from the real date, not the index
    const isToday = i === 0;
    const base = { day: _DAY[dow], date: d.getDate(), month: _MON[d.getMonth()], fullDate: d, weekday, isToday };
    if (!weekday && !isToday) return { ...base, topicId: null, section: null, subtopicTitle: null, mins: 0, status: 'rest' };
    const slot = slots.length ? slots[k++ % slots.length] : null;
    return {
      ...base,
      topicId: slot?.chapterId ?? null,
      section: slot?.section ?? null,
      subtopicTitle: slot?.title ?? null,
      mins: slot ? 15 : 0,
      status: isToday ? 'today' : 'upcoming',
    };
  });
}

/** A saved plan stores which day was "today" when it was made, so the marker
 *  goes stale the next morning. Recompute it from the stored date + month. */
export function refreshPlanDays<T extends { date?: number; month?: string; isToday?: boolean }>(plan: T[]): T[] {
  const now = new Date();
  const d = now.getDate();
  const m = _MON[now.getMonth()];
  return plan.map((x) => {
    // 7 consecutive days can never repeat a day-of-month, so the date alone
    // identifies the slot; month is checked too when the plan stored it.
    const isToday = x.date === d && (x.month === undefined || x.month === m);
    return isToday === !!x.isToday ? x : { ...x, isToday };
  });
}
