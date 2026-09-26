# Vidya for Teachers

A separate web app for the classroom teacher. Phone-first, opened from a link —
there is no app to install.

It shares **only the backend** with the student app. Its own dependencies, its
own build, its own deploy: nothing here can break the student app.

See [../docs/teacher-app-plan.md](../docs/teacher-app-plan.md) for what it is
for and what was deliberately left out.

## What works today

Phase 0 and 1 of the plan:

- A teacher creates an account and signs in.
- They create a class and get a join code.
- Students enter that code (in the student app — **not built yet**, see below)
  and appear on the class roster.

The "what to reteach tomorrow" screen is phase 2/3 and is not built.

## Running it locally

```bash
cd teacher
npm install
cp .env.example .env.local     # fill in the Firebase values from the student app
npm run dev                    # http://localhost:5174
```

The backend must be running too — `/api` is proxied to `localhost:8001`:

```bash
cd ../backend && ./venv/bin/python -m uvicorn main:app --port 8001 --host 127.0.0.1
```

The student app keeps Vite's default port 5173, so both can run at once.

## Deploying

A **second Vercel project** pointed at the same repo:

1. Vercel → Add New → Project → import the repo again.
2. **Root Directory**: `teacher`. Framework preset: Vite.
3. Environment variables: `VITE_API_BASE` (the Render URL, no trailing slash)
   and the four `VITE_FIREBASE_*` values — the same Firebase project as the
   student app, so teachers and students live in one user directory.

Two things that are easy to forget and both fail loudly:

- **CORS.** Add the new teacher domain to `ALLOWED_ORIGINS` on Render, next to
  the student app's domain, and redeploy the backend.
- **Firebase authorised domains.** Firebase console → Authentication →
  Settings → Authorised domains → add the teacher domain, or sign-in fails.

## Not done yet

- **Students cannot join a class from the student app.** The backend accepts
  `POST /classes/join`, but there is no screen in the student app for entering
  a code — that is a change to the student app and was left out on purpose.
  Until it exists, rosters stay empty.
- **Parent consent.** Children's data becoming visible to a teacher needs
  answering before this is used with a real class.
- Teacher identity is unverified: anyone can sign up and create a class.
