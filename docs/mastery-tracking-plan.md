# Mastery Tracking — Engineering Plan

Status: **spec for review** (not yet implemented)
Decision baked in: **local + Firestore from day one** (cross-device, server-durable).

## 1. Goal

Give every student a persistent, trustworthy view of *how well they know each
subtopic → chapter → subject*, updated after each session/quiz/exam, and use it
to (a) show a per-skill level map, (b) give an immediate "you leveled up" signal,
and (c) drive "what to practice next."

## 2. Where we are today

- `activityLog: ActivityEntry[]` in state (persisted, capped) — [src/lib/progress.ts](../src/lib/progress.ts).
- `ActivityEntry = { kind: 'session'|'quiz'|'exam', date, topic: string, score, total, mistakes }`.
- `topicStats()` aggregates by the **free-text `topic` string** → avg %, a 4-level
  bucket (`strong/confident/improving/needshelp`), last mistakes.
- Progress + TopicMastery screens render buckets. Quiz/exam log results;
  concept logs an unscored `session`.

### Core gaps
1. **Aggregation key is a title string**, not a catalog id → fragile (LLM title
   drift), can't roll up, can't tie to `chapterId::section`.
2. **No rollup** subtopic → chapter → subject.
3. **No feedback loop** after a session/quiz.
4. **Naive flat average** — no recency weighting, no "not enough evidence" state,
   no diagnostic seed.

## 3. Data model

### 3.1 Stable keys (the foundation)
Extend `ActivityEntry` with the catalog coordinates we already have at session time:

```ts
interface ActivityEntry {
  kind: 'session' | 'quiz' | 'exam';
  date: string;              // ISO
  topic: string;             // display title (may drift) — display only
  chapterId?: string;        // NEW — stable catalog id
  section?: string | null;   // NEW — subtopic number e.g. "1.2" (null = chapter-wide)
  score: number;
  total: number;
  mistakes?: ActivityMistake[];
}
```

`skillKey = section ? \`${chapterId}::${section}\` : chapterId`  → the aggregation unit.

Write sites already know these:
- Quiz — `NavigableQuizScreen` has `quizScope` / `sessionSub` (chapterId + section).
- Concept session — `ConceptScreen` has `sessionSub`.
- Exam — `ExamEvalLoadingScreen` has `examTopics/examScope`.
- Practice quiz — `practiceTopics` / `quizScope`.

### 3.2 MasteryMap (derived, persisted)

```ts
interface SkillMastery {
  ewma: number;        // 0..1 recency-weighted correctness
  attempts: number;    // total scored questions seen
  level: Bucket;       // strong|confident|improving|needshelp|('new')
  learned: boolean;    // concept session completed at least once
  lastSeen: string;    // ISO
  source: 'diagnostic' | 'practice' | 'mixed';
}
type MasteryMap = Record<string /*skillKey*/, SkillMastery>;
```

Stored in state (`state.mastery`), persisted like `activityLog`, and mirrored to
Firestore (see §6).

## 4. Scoring model

- **EWMA, not flat average.** On each scored event with ratio `r = score/total`:
  `ewma' = α·r + (1-α)·ewma` (α ≈ 0.4). Recent work dominates as kids improve.
- **Evidence gate.** `attempts < MIN_EVIDENCE` (≈5 questions) → level = `new`
  ("Just started"), never a confident label on thin data.
- **Diagnostic as prior.** Seed `ewma`/`attempts` from the onboarding diagnostic +
  drill so day 1 isn't empty (`source: 'diagnostic'`, low attempts weight).
- **Decay (optional, phase 3).** If `now - lastSeen > T`, nudge `ewma` toward a
  neutral 0.5 slightly → surfaces "revise this" (spaced-repetition signal).
- **Buckets** reuse existing `bucketFor()` thresholds; add a `new` state.

Sessions (concept) set `learned = true` (coverage) but do **not** move `ewma`
(no score). Only quiz/exam move mastery.

## 5. Rollup

- **Chapter level** = evidence-weighted mean of its subtopics' `ewma`, plus a
  **coverage** ratio (`learned or attempted subtopics / total subtopics`). Show
  both: a ring (coverage) + a color (level).
- **Subject level** = weighted mean across chapters.
- Pure functions in `lib/mastery.ts` (`skillMastery`, `chapterMastery`,
  `subjectMastery`, `weakestSkills`). No component owns the math.

## 6. Persistence — local + Firestore (day one)

- **Local-first**: `state.mastery` in `PERSIST_KEYS`; instant reads/writes.
- **Firestore**: `user_profiles/{uid}/mastery/{skillKey}` (or a single
  `mastery` doc keyed by skillKey for cheaper reads). Reuse the existing profile
  sync path (`api.updateProfile` / backend `/profile`).
- **Sync strategy**: write-through on each update (debounced), last-write-wins by
  `lastSeen`; on login, merge remote → local (max attempts / newest lastSeen).
- **Backend**: add `POST /mastery` (upsert map for uid) and include mastery in
  the profile GET. Guest users stay local-only until signup, then merge.
- **Migration**: on first load, derive an initial `MasteryMap` from the existing
  `activityLog` via `topicStats()` so no history is lost.

## 7. Update points (where we write)

| Event | Write |
|---|---|
| Concept session complete | `learned = true` for its skillKey |
| Quiz/exam complete | EWMA update per skillKey from score; append `ActivityEntry` with chapterId/section |
| Diagnostic + drill complete | Seed priors for the assessed skills |

All routed through one `applyResult(mastery, entry)` in `lib/mastery.ts` so the
rules live in one place.

## 8. Surfacing (UX)

1. **Post-session/quiz delta card** (the missing feedback loop): "Adding
   fractions · Improving → **Confident** (78%)" with the level bar. Shown on the
   result/analysis screen.
2. **Progress tab → mastery map**: chapters with a coverage ring + level color,
   expand to subtopics (level + last practiced), filter "Needs help." Upgrades the
   existing string-keyed Progress/TopicMastery screens to the catalog-keyed rollup.
3. **Next best action**: week plan + Practice "recommended" pull `weakestSkills()`
   — same engine as the diagnostic, closing the loop.

## 9. Rollout sequence

1. **Foundation** — stable keys on `ActivityEntry`; `lib/mastery.ts` (MasteryMap,
   EWMA, evidence gate, rollup); migrate from `activityLog`; persist local;
   Firestore schema + write-through + login merge; backend `/mastery`.
2. **Feedback loop** — post-session/quiz mastery-delta card.
3. **Map** — upgrade Progress/TopicMastery to the keyed subtopic→chapter rollup.
4. **Refinements** — decay/spaced-repetition, "next best action" wiring, analytics.

## 10. Open decisions

- EWMA α and `MIN_EVIDENCE` thresholds (start α=0.4, MIN=5; tune with data).
- Single `mastery` doc vs per-skill subcollection in Firestore (cost vs
  granularity — lean single doc first).
- Whether exams (multi-topic) distribute score per section or log at chapter level
  (start: chapter level unless a single-section scope).
- Decay policy (defer to phase 4).
