# Vidya for Teachers

A separate web app for the classroom teacher. Phone-first, opened from a link —
there is no app to install.

It shares **only the backend** with the student app. Its own dependencies, its
own build, its own deploy: nothing here can break the student app.

See [../docs/teacher-app-plan.md](../docs/teacher-app-plan.md) for what it is
for and what was deliberately left out.

## What works today

Phases 0-3 of the plan:

- A teacher creates an account and signs in.
- They create a class and get a join code.
- Students enter that code in the student app (Profile → Join a class) and
  appear on the class roster.
- The class screen shows what to reteach, who to sit with, and what is safe
  to move past — each with the number of students it is based on.

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

- **Per-student detail** (phase 4): tapping a name in "sit with these" does
  nothing yet.
- **It has never run against real data.** The aggregation is covered by tests
  against a fake database; no real class has used it.
- **Parent consent.** Children's data becoming visible to a teacher needs
  answering before this is used with a real class.
- Teacher identity is unverified: anyone can sign up and create a class.

## On a phone

**The intended route is Add to Home Screen**, the same as the student app's free
iPhone path. The teacher opens the deployed URL in Chrome or Safari and adds it
to their home screen: it then runs full screen with the Vidya icon, no browser
chrome, no store, nothing to install or update. Works on both Android and iOS.
The manifest and `apple-touch-icon` for that live in `public/`.

### Also builds native (optional)

Capacitor is set up as well, under a separate app id (`com.vidya.teacher`) so a
teacher and a student can have both installed on one phone. This is not needed
for the Add to Home Screen route — it is there if a store listing is ever
wanted.

```bash
cd teacher
npm run android          # build + sync
npm run android:open     # ...and open Android Studio
```

A phone cannot reach the dev proxy, so native builds read `VITE_API_BASE` from
`.env.production` — the same Render backend the student app uses. If the
backend's `ALLOWED_ORIGINS` is pinned to web domains, the native app's origin
has to be allowed too or every call fails CORS.

iOS needs Xcode installed (`npm run ios:open`), and a paid Apple Developer
account to reach anyone else's iPhone. The web page is the free route there.
