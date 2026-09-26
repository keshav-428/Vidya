# Teacher App — Plan

Status: **phases 0-7 built**, stage three (§13-18, tracking over time) planned — class, join code, the one screen, per-student
tracking, setting practice, Vidya IDs and invitations. Never yet run with a
real class.
Decided: phone-first web page, **read-only**, aimed at the school classroom teacher.

## 1. What it is for

A teacher with 38 students has one real problem: they do not know who is lost on
what until the unit test, and by then the chapter is over. The student app
already collects the missing signal — per-subtopic mastery, updated daily.

The app answers one question, in one screen, in the thirty seconds before class:

> **What should I reteach tomorrow, and who should I sit with?**

Anything that does not end in an action the teacher can take is out of scope.
Explicitly not in scope: attendance, discipline, fee/admin paperwork, engagement
analytics.

## 2. Two rules that are not negotiable

1. **Every class number carries its evidence.** "19 of 32 students" — never a
   bare percentage. Not every child will use the student app, and a dashboard
   that speaks confidently from 15 of 38 students will be wrong in front of a
   teacher once, and then never trusted again. The per-student evidence gate
   (`MIN_EVIDENCE = 5` in [src/lib/mastery.ts](../src/lib/mastery.ts)) has to
   survive into the aggregate rather than being averaged away.
2. **No worst-to-best ranking of students.** The moment the screen orders
   children by how bad they are, it becomes a shaming tool. Weak students
   surface only as "these four need five minutes", never as a league table.

## 3. Where we are today

- Every student is a standalone Firestore document, `user_profiles/{uid}`. There
  is **no class object and no teacher link** — this is the gap everything else
  waits on.
- Mastery already lives server-side on that document, keyed `chapterId::section`
  (`{ ewma, attempts, learned, lastSeen }`), written via `POST /mastery`.
  That is exactly what a class view aggregates.
- Onboarding already offers "I'm a tutor or teacher"
  ([src/screens/onboarding/RoleScreen.tsx](../src/screens/onboarding/RoleScreen.tsx)),
  and it currently loops back to itself — a dead end a real user can hit today.
- Auth is Firebase, already in place for students.

## 4. Data model (new)

```
classes/{classId}
  teacherId, name ("6B"), grade, joinCode (6 chars, unique), createdAt, archived

user_profiles/{uid}
  classIds: [classId]        # additive; existing students keep working untouched
  role: 'student' | 'teacher'
```

Join code over teacher-created accounts: a teacher writing 40 children's emails
and passwords by hand does not scale and drags minors' credentials through a
third party. The teacher writes the code on the blackboard; students enter it.

## 5. The one screen

```
Class 6B · based on 24 of 38 students this week

RETEACH THIS
  Common denominators        19 of 24 still shaky
  Comparing unlike fractions 14 of 24
SIT WITH THESE
  4 names, max — furthest behind, or stopped opening the app
SAFE TO MOVE ON
  what the class has genuinely got
```

Everything else is one tap deeper. A teacher with six periods a day will not
scroll.

## 6. Build order

| Phase | What | Done when |
|---|---|---|
| 0 | `classes` collection, join code generation, `classIds` on the student profile | a code can be made and redeemed via the API |
| 1 | Teacher sign-up + create class; join-code entry in the student app (Profile → Join a class) | 5 real students join one class |
| 2 | `GET /classes/{classId}/summary` — aggregation **on the server** | returns the three blocks with evidence counts |
| 3 | The one screen, mobile-first web, same repo, deployed alongside | a teacher reads it in 30 seconds |
| 4 | Per-student drill-down (one tap from "sit with these") | — |

Aggregation belongs on the server, not in the browser: the phone should never
download 38 students' full profiles, and children's records should not sit in a
teacher's browser.

Phases 0–3 are worth shipping alone. Assigning work is deliberately deferred —
it collides with the student app's own daily plan, and that question can wait
until a teacher asks for it.

## 7. Open, before this goes live

- **Parent consent.** Children's data becomes visible to a third party. This
  needs answering before launch, not after, and it changes the Data Safety
  answers on the Play Store listing for the student app.
- **Teacher identity.** Anyone who gets a join code can see a class. Does a
  teacher need verifying, and who can create a class?
- **Validate first.** Show the one screen to one real teacher with one real
  class before building phases 2–4. The risk here is not technical.

---

# Stage two — 30 students, tracked without drowning

Agreed 2026-09-26, after phases 0-4 were built. Two halves: getting a real
class in, and making 30 students legible to one teacher in a few seconds.

**This supersedes the read-only decision in §6.** Nothing made students
practise, so the dashboard had no way to fill. A teacher can now set practice.
Marks and due dates stay out — both turn this into school administration, which
is the direction that kills it.

## 8. Getting a class in

Three doors, all **consent-based**. A student is never added to a class without
an act of their own.

| Door | Who starts it | For |
|---|---|---|
| Class code (built) | Student types the code | A whole class at once, code on the board |
| Invite by Vidya ID | Teacher enters an ID, student accepts | Adding 30 students in one sitting |
| Invite link | Teacher shares a link, student opens and accepts | One student, over WhatsApp |

**Why not search by username.** A teacher looking students up means any account
that calls itself a teacher can search a directory of children. That is the most
dangerous thing this product could contain, and no feature is worth it.

So the direction is reversed: every student has a **Vidya ID** shown in their own
profile — short, from the same unambiguous alphabet as class codes. The student
reads it out; the teacher types it; the student gets "Mishra Sir invited you to
6B" and accepts. The teacher's experience is the same as a lookup. Nothing is
searchable, and the child agrees.

```
user_profiles/{uid}.vidya_id       # generated on first view, unique
invites/{id}  { class_id, student_id, status: pending|accepted|declined, created_at }
```

## 9. Thirty students, made legible

The answer to "not overwhelming" is **depth, not density**. Three levels, one
tap apart.

1. **The class** (built) — what to reteach tomorrow, three lines.
2. **The students** — one row each: a *state*, not a number.
   `on track` / `slipping` / `needs you`, sorted so the teacher reads the top
   and stops.
3. **One student** — their weak subtopics, what they last practised, and the
   button that matters: set practice for them.

**Why no scores on the list.** Thirty numbers is precisely the overwhelming
thing. A teacher cannot act on thirty numbers; they can act on "these four need
you". Numbers belong one level down, where they are about one child and a
decision. This is also what keeps §2's rule intact — states and a short
attention list, never a worst-to-best league table.

## 10. Setting practice

The loop this product is: **dashboard says what is weak → teacher taps it →
it lands in those students' app → they do it → dashboard updates.**

So the primary way to set practice is not a syllabus browser. It is a button
directly under the thing the dashboard just reported: "19 of 24 shaky on common
denominators" → **Set as practice**. One tap, no decisions.

A plain chapter picker exists as the second door, because in week one the
dashboard is empty and the teacher's first visit must still be able to do
something. Its chapter list comes from the ingested knowledge base, so there is
no second copy of the syllabus.

```
assignments/{id}  { class_id, chapter_id, section, title,
                    student_ids: [] | null,      # null = the whole class
                    created_by, created_at }
```

**On the student's side it must not hijack their plan.** A card at the top of
Home — "Mishra Sir set this" — starts that session when tapped. Their own daily
plan stays exactly where it was, underneath. A child who ignores it loses
nothing; the teacher simply sees it was not done.

**Completion needs no new tracking.** A student has done it when they have
practised that subtopic since the assignment was set, which mastery's
`lastSeen` already records. The teacher sees "12 of 18 done" — without that,
setting practice feels like shouting into a void and no one does it twice.

## 11. Build order

| Phase | What | Why this order |
|---|---|---|
| 5 | Student list (states) + one-student page | Read-only, touches nothing in the student app, and makes the existing dashboard useful for a real class |
| 6 | Assignments: set from the reteach list, then per student; Home card in the student app | The lever that fills the dashboard. First thing that changes what a student sees, so it goes in on its own |
| 7 | Vidya ID + invites + invite link | Least blocking: with the class code, a class can already be assembled |

## 12. Still open

- Parent consent (§7) is now more pressing, not less: a teacher setting work for
  a named child is a bigger claim on that child's time than a dashboard.
- The teacher app is English only; the student app is fully Hindi.
- Teachers cannot remove a student, rename a class, or close one.

---

# Stage three — performance over time

Agreed 2026-09-26. This is the app's reason to exist: a teacher can see
today's state anywhere, but nobody can tell them whether their class is
*moving*.

## 13. The foundation: nothing stores history

Mastery is an EWMA — one number per student per subtopic, overwritten on every
result. It knows today and has forgotten yesterday. Every question below is
about change, so none of them are answerable until something is kept.

**Weekly snapshots.** One document per class per ISO week:

```
classes/{classId}/snapshots/{YYYY-Www}
  taken_at
  students: { uid: { solid: n, shaky: n, evidence: n, skills: { key: level } } }
```

Written **lazily**: when a class is read and this week has no snapshot, take one.
No cron, no scheduler, self-healing. A class nobody opens for three weeks has
gaps, and gaps are shown rather than interpolated — a straight line through
missing weeks is a lie.

Small: ~30 students × a dozen skills × one doc a week.

## 14. The four questions a teacher actually asks

Not a dashboard. Four questions, each answered in one sentence, in the place
the teacher already is.

| Question | Where | Answer looks like |
|---|---|---|
| Is my class moving? | Today | "Common denominators: 5 of 24 solid a fortnight ago, 14 now." |
| Did what I did work? | Practice you set | "You set this Monday. 9 of 18 have done it, and 6 have moved up a level." |
| Who slipped? | Students | A student who *dropped* sorts above one who has always been weak. |
| What do I tell the parent? | One student | Three sentences, ready to read out. |

## 15. A student's trajectory

A word, then the evidence: **improving · steady · slipping · not practising**.

"Not practising" is its own state on purpose. A child who stops using the app
has an unchanging average, so a naive trend reads them as *steady* — which is
exactly backwards, and is the failure most likely to cost a teacher's trust.

Underneath: the two or three facts behind the word, and the date it changed.
No chart. A line chart at 390px is decoration, and a teacher between periods
reads a sentence; they do not read axes.

## 16. The parent summary

One tap on a student produces three sentences for a parent-teacher meeting:
what the child is good at, what they are struggling with, and one thing to do
at home. Grounded in that child's real subtopics — never generic advice, never
a comparison with classmates, never a rank.

This is the moment a teacher most needs evidence and has the least time to
prepare it, and it is the one thing here a teacher would tell another teacher
about.

Rules: it leaves the building, so it names no other child, carries no score out
of context, and says what it is based on ("from 40 questions over three
weeks"). Parent consent (§7) has to be settled before this ships.

## 17. Rules this stage adds

1. **Inactivity is not stability.** Any trend must distinguish "not moving"
   from "not playing".
2. **Small samples are jumpy.** Weekly is about as fast as this can honestly
   report; a daily trend would cry wolf every Tuesday.
3. **No ranking, still.** Trajectory is per child against their own past, never
   against classmates. "Most improved" is a league table wearing a nicer hat.
4. **Gaps stay visible.** A missing week is shown as missing.

## 18. Build order

| Phase | What | Done when |
|---|---|---|
| 8 | Weekly snapshots, written lazily on class read | two weeks of a class produce two documents |
| 9 | Class movement on Today + "did it work" on Practice | both read from snapshots, with gaps honest |
| 10 | Student trajectory: the word, the evidence, the date | "not practising" never reads as "steady" |
| 11 | Parent summary, shareable as text | a teacher can read it aloud without editing |
