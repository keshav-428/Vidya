// ─────────────────────────────────────────────────────────────
//  Progress engine — pure helpers over AppState.activityLog.
//
//  Activities (quizzes, exams, sessions) are appended to the log via
//  appendActivity; every Progress/Mastery/Profile number is *derived*
//  from that log here, so the UI is always live and nothing is hardcoded.
// ─────────────────────────────────────────────────────────────
import type { ActivityEntry, ActivityMistake, AppState } from '../types';

const CAP = 300;   // keep localStorage bounded — last N events

const dayKey = (iso: string): string => new Date(iso).toDateString();

/**
 * Append an activity to the log (immutably, capped). With `oncePerDay`, skips
 * if an entry of the same kind+topic already exists for that calendar day —
 * used for session views so re-opening a lesson doesn't double-count.
 */
export function appendActivity(
  log: ActivityEntry[] | undefined,
  entry: ActivityEntry,
  opts?: { oncePerDay?: boolean },
): ActivityEntry[] {
  const arr = log || [];
  if (opts?.oncePerDay) {
    const k = dayKey(entry.date);
    const dup = arr.some((e) => e.kind === entry.kind && e.topic === entry.topic && dayKey(e.date) === k);
    if (dup) return arr;
  }
  return [...arr, entry].slice(-CAP);
}

export const getLog = (state: AppState | undefined): ActivityEntry[] =>
  (state?.activityLog as ActivityEntry[] | undefined) || [];

// ── Scoring ──────────────────────────────────────────────────
const scoredEntries = (log: ActivityEntry[]): ActivityEntry[] =>
  log.filter((e) => (e.kind === 'quiz' || e.kind === 'exam') && e.total > 0);

const ratio = (e: ActivityEntry): number => (e.total > 0 ? e.score / e.total : 0);

export type Bucket = 'strong' | 'confident' | 'improving' | 'needshelp';
export const BUCKET_ORDER: Bucket[] = ['strong', 'confident', 'improving', 'needshelp'];

export function bucketFor(r: number): Bucket {
  if (r >= 0.9) return 'strong';
  if (r >= 0.75) return 'confident';
  if (r >= 0.5) return 'improving';
  return 'needshelp';
}

// ── Streaks ──────────────────────────────────────────────────
function startOfWeek(d: Date): Date {
  const x = new Date(d);
  const mondayIndex = (x.getDay() + 6) % 7;   // Mon=0 … Sun=6
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - mondayIndex);
  return x;
}

export interface WeekStreak {
  count: number;
  days: boolean[];   // Mon … Sun
}

/** Active days in the current (Mon–Sun) week. */
export function weeklyStreak(log: ActivityEntry[]): WeekStreak {
  const start = startOfWeek(new Date());
  const days = Array.from({ length: 7 }, () => false);
  for (const e of log) {
    const diff = Math.floor((new Date(e.date).getTime() - start.getTime()) / 86_400_000);
    if (diff >= 0 && diff < 7) days[diff] = true;
  }
  return { count: days.filter(Boolean).length, days };
}

/** Consecutive-day streak ending today (or yesterday). */
export function currentStreak(log: ActivityEntry[]): number {
  const dayset = new Set(log.map((e) => dayKey(e.date)));
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (!dayset.has(d.toDateString())) {
    d.setDate(d.getDate() - 1);   // allow the streak to still be "live" the day after
    if (!dayset.has(d.toDateString())) return 0;
  }
  let streak = 0;
  while (dayset.has(d.toDateString())) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

// ── Per-topic mastery ────────────────────────────────────────
export interface TopicStat {
  topic: string;
  attempts: number;
  avg: number;       // 0..1
  percent: number;   // 0..100
  bucket: Bucket;
  lastDate: string;
  lastMistakes: ActivityMistake[];
}

export function topicStats(log: ActivityEntry[]): TopicStat[] {
  const byTopic = new Map<string, ActivityEntry[]>();
  for (const e of scoredEntries(log)) {
    const key = e.topic || 'General';
    const list = byTopic.get(key);
    if (list) list.push(e);
    else byTopic.set(key, [e]);
  }
  const stats: TopicStat[] = [];
  byTopic.forEach((entries, topic) => {
    const avg = entries.reduce((a, e) => a + ratio(e), 0) / entries.length;
    const last = [...entries].sort((a, b) => b.date.localeCompare(a.date))[0];
    stats.push({
      topic,
      attempts: entries.length,
      avg,
      percent: Math.round(avg * 100),
      bucket: bucketFor(avg),
      lastDate: last.date,
      lastMistakes: last.mistakes || [],
    });
  });
  return stats.sort((a, b) => b.lastDate.localeCompare(a.lastDate));
}

export interface BucketCount { id: Bucket; count: number; }
export function masteryBuckets(stats: TopicStat[]): BucketCount[] {
  return BUCKET_ORDER.map((id) => ({ id, count: stats.filter((s) => s.bucket === id).length }));
}

/** Topics that need work (improving / needs help), weakest first. */
export const needsHelpTopics = (stats: TopicStat[]): TopicStat[] =>
  stats.filter((s) => s.bucket === 'improving' || s.bucket === 'needshelp').sort((a, b) => a.avg - b.avg);

/** Topics the student is solid on (confident / strong). */
export const strongTopics = (stats: TopicStat[]): TopicStat[] =>
  stats.filter((s) => s.bucket === 'strong' || s.bucket === 'confident').sort((a, b) => b.avg - a.avg);

// ── Recent activity & mistakes ───────────────────────────────
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function relativeDay(iso: string): string {
  const d = new Date(iso);
  const a = new Date(d); a.setHours(0, 0, 0, 0);
  const b = new Date(); b.setHours(0, 0, 0, 0);
  const diff = Math.round((b.getTime() - a.getTime()) / 86_400_000);
  if (diff <= 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return WEEKDAYS[d.getDay()];
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

export interface RecentItem {
  topic: string;
  score: number;
  total: number;
  bucket: Bucket;
  when: string;
}

export function recentPractice(log: ActivityEntry[], limit = 6): RecentItem[] {
  return scoredEntries(log)
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit)
    .map((e) => ({ topic: e.topic, score: e.score, total: e.total, bucket: bucketFor(ratio(e)), when: relativeDay(e.date) }));
}

export interface RetryItem { question: string; topic: string; }

export function mistakesToRetry(log: ActivityEntry[], limit = 5): RetryItem[] {
  const out: RetryItem[] = [];
  const seen = new Set<string>();
  const quizzes = log.filter((e) => e.kind === 'quiz').sort((a, b) => b.date.localeCompare(a.date));
  for (const e of quizzes) {
    for (const m of e.mistakes || []) {
      const q = m.question;
      if (!q || seen.has(q)) continue;
      seen.add(q);
      out.push({ question: q, topic: e.topic });
      if (out.length >= limit) return out;
    }
  }
  return out;
}

// ── Headline stats (Profile, Mastery ring) ───────────────────
export interface OverallStats {
  streak: number;
  masteryPercent: number;
  concepts: number;
  mastered: number;
}

export function overallStats(log: ActivityEntry[]): OverallStats {
  const stats = topicStats(log);
  const scored = scoredEntries(log);
  const masteryPercent = scored.length
    ? Math.round((100 * scored.reduce((a, e) => a + ratio(e), 0)) / scored.length)
    : 0;
  return {
    streak: currentStreak(log),
    masteryPercent,
    concepts: stats.length,
    mastered: stats.filter((s) => s.bucket === 'strong' || s.bucket === 'confident').length,
  };
}
