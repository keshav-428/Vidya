# Teacher App — Plan

Status: **direction agreed, nothing built**
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
| 2 | `GET /class-summary/{classId}` — aggregation **on the server** | returns the three blocks with evidence counts |
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
