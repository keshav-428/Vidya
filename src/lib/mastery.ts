// ─────────────────────────────────────────────────────────────
//  Mastery engine — recency-weighted (EWMA) skill mastery keyed by
//  the stable syllabus catalog (chapterId::section), with an evidence
//  gate, subtopic → chapter → subject rollup, and a migration from the
//  legacy activityLog. Pure functions only; screens read/derive, App
//  persists + syncs. See docs/mastery-tracking-plan.md.
// ─────────────────────────────────────────────────────────────
import { bucketFor, type Bucket } from './progress';
import type { ActivityEntry, MasteryMap, MasteryDelta, SkillMastery } from '../types';
import type { SyllabusChapter } from '../content/syllabus';

// Tunables (see plan §10).
export const ALPHA = 0.4;         // EWMA weight on the newest result
export const MIN_EVIDENCE = 5;    // scored questions before a real level shows

/** A mastery level, plus a "just started" state below the evidence gate. */
export type MasteryLevel = Bucket | 'new';

export const LEVEL_RANK: Record<MasteryLevel, number> = { new: 0, needshelp: 1, improving: 2, confident: 3, strong: 4 };
export const LEVEL_LABEL: Record<MasteryLevel, string> = {
  new: 'Just started', needshelp: 'Needs help', improving: 'Improving', confident: 'Confident', strong: 'Strong',
};

/** Stable aggregation key for a skill. */
export const skillKey = (chapterId: string, section?: string | null): string =>
  section ? `${chapterId}::${section}` : chapterId;

/** Split a skillKey back into its parts. */
export const parseSkillKey = (key: string): { chapterId: string; section: string | null } => {
  const i = key.indexOf('::');
  return i === -1 ? { chapterId: key, section: null } : { chapterId: key.slice(0, i), section: key.slice(i + 2) };
};

/** Level for a skill, gated on enough evidence. */
export function levelFor(m: SkillMastery | undefined): MasteryLevel {
  if (!m || m.attempts < MIN_EVIDENCE) return 'new';
  return bucketFor(m.ewma);
}

const isScored = (e: ActivityEntry): boolean =>
  (e.kind === 'quiz' || e.kind === 'exam') && e.total > 0;

/** Apply one activity event to the map, returning a new map (immutable). */
export function applyResult(map: MasteryMap, entry: ActivityEntry): MasteryMap {
  if (!entry.chapterId) return map;   // no stable key → can't attribute
  const key = skillKey(entry.chapterId, entry.section);
  const prev = map[key];

  // Concept session = coverage only (marks "learned", no score movement).
  if (entry.kind === 'session') {
    const base: SkillMastery = prev || { ewma: 0.5, attempts: 0, learned: false, lastSeen: entry.date, source: 'practice' };
    return { ...map, [key]: { ...base, learned: true, lastSeen: maxIso(base.lastSeen, entry.date) } };
  }

  if (!isScored(entry)) return map;
  const r = Math.max(0, Math.min(1, entry.score / entry.total));
  const prevEwma = prev ? prev.ewma : r;                 // first result seeds the ewma
  const ewma = prev ? ALPHA * r + (1 - ALPHA) * prevEwma : r;
  const source: SkillMastery['source'] =
    !prev ? 'practice' : prev.source === 'diagnostic' ? 'mixed' : prev.source;
  return {
    ...map,
    [key]: {
      ewma,
      attempts: (prev?.attempts || 0) + entry.total,
      learned: prev?.learned || false,
      lastSeen: maxIso(prev?.lastSeen, entry.date),
      source,
    },
  };
}

/** Before→after change for a skill, to show a "you leveled up" card. Null if
 *  there's no stable key or no post-result mastery. */
export function deltaFor(
  oldMap: MasteryMap, newMap: MasteryMap,
  chapterId: string | undefined, section: string | null | undefined, title: string,
): MasteryDelta | null {
  if (!chapterId) return null;
  const key = skillKey(chapterId, section);
  const after = newMap[key];
  if (!after) return null;
  const fromLevel = levelFor(oldMap[key]);
  const toLevel = levelFor(after);
  return {
    key, title, fromLevel, toLevel,
    percent: Math.round(after.ewma * 100),
    leveledUp: LEVEL_RANK[toLevel] > LEVEL_RANK[fromLevel],
  };
}

/** Seed a skill's prior from the onboarding diagnostic (low-weight evidence). */
export function seedDiagnostic(map: MasteryMap, chapterId: string, section: string | null, ratio: number, date: string): MasteryMap {
  const key = skillKey(chapterId, section);
  if (map[key]) return map;   // don't override real practice data
  return {
    ...map,
    [key]: { ewma: Math.max(0, Math.min(1, ratio)), attempts: MIN_EVIDENCE, learned: false, lastSeen: date, source: 'diagnostic' },
  };
}

/** Rebuild the whole map from an activity log (migration / recompute). */
export function migrateFromActivityLog(log: ActivityEntry[] | undefined): MasteryMap {
  let map: MasteryMap = {};
  for (const e of [...(log || [])].sort((a, b) => a.date.localeCompare(b.date))) {
    map = applyResult(map, e);
  }
  return map;
}

// ── Rollup ───────────────────────────────────────────────────
export interface SkillLevel { key: string; chapterId: string; section: string | null; mastery: SkillMastery; level: MasteryLevel; }

/** Per-chapter rollup: coverage (learned/attempted of total) + overall level. */
export interface ChapterMastery {
  chapterId: string;
  level: MasteryLevel;
  avg: number;              // 0..1 evidence-weighted mean ewma (0 if none)
  coverage: number;         // 0..1 subtopics touched / total
  touched: number;
  totalSubtopics: number;
}

export function chapterMastery(map: MasteryMap, chapter: SyllabusChapter): ChapterMastery {
  const subs = chapter.subtopics;
  let wSum = 0, wTot = 0, touched = 0;
  for (const sub of subs) {
    const m = map[skillKey(chapter.id, sub.num)];
    if (!m) continue;
    if (m.learned || m.attempts > 0) touched += 1;
    if (m.attempts > 0) { wSum += m.ewma * m.attempts; wTot += m.attempts; }
  }
  // Also fold any chapter-wide entry (section null).
  const whole = map[chapter.id];
  if (whole && whole.attempts > 0) { wSum += whole.ewma * whole.attempts; wTot += whole.attempts; }
  const avg = wTot ? wSum / wTot : 0;
  const totalSubtopics = subs.length || 1;
  return {
    chapterId: chapter.id,
    level: wTot >= MIN_EVIDENCE ? bucketFor(avg) : 'new',
    avg,
    coverage: Math.min(1, touched / totalSubtopics),
    touched,
    totalSubtopics,
  };
}

/** Subject rollup across chapters (evidence-weighted). */
export function subjectMastery(map: MasteryMap, chapters: SyllabusChapter[]): { avg: number; level: MasteryLevel; coverage: number } {
  let wSum = 0, wTot = 0, cov = 0;
  for (const ch of chapters) {
    const cm = chapterMastery(map, ch);
    cov += cm.coverage;
    if (cm.avg > 0) { wSum += cm.avg; wTot += 1; }
  }
  const avg = wTot ? wSum / wTot : 0;
  return { avg, level: wTot ? bucketFor(avg) : 'new', coverage: chapters.length ? cov / chapters.length : 0 };
}

/** Weakest skills with enough evidence — drives "practice next". */
export function weakestSkills(map: MasteryMap, limit = 5): SkillLevel[] {
  return Object.entries(map)
    .map(([key, mastery]) => ({ key, ...parseSkillKey(key), mastery, level: levelFor(mastery) }))
    .filter((s) => s.mastery.attempts >= MIN_EVIDENCE)
    .sort((a, b) => a.mastery.ewma - b.mastery.ewma)
    .slice(0, limit);
}

// ── Merge (local ↔ remote sync) ──────────────────────────────
/** Last-write-wins per skill by lastSeen, keeping the higher attempt count. */
export function mergeMastery(a: MasteryMap | undefined, b: MasteryMap | undefined): MasteryMap {
  const out: MasteryMap = { ...(a || {}) };
  for (const [key, m] of Object.entries(b || {})) {
    const cur = out[key];
    if (!cur) { out[key] = m; continue; }
    const newer = m.lastSeen >= cur.lastSeen ? m : cur;
    out[key] = { ...newer, attempts: Math.max(cur.attempts, m.attempts), learned: cur.learned || m.learned };
  }
  return out;
}

function maxIso(a: string | undefined, b: string): string {
  return a && a > b ? a : b;
}
