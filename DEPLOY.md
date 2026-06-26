# Deploying Vidya (Render + Vercel)

Two pieces deploy separately:
- **Backend** (FastAPI) → **Render** (Docker)
- **Frontend** (React/Vite) → **Vercel** (static)

The code is already production-ready: the frontend reads the backend URL from
`VITE_API_BASE`, the backend reads CORS from `ALLOWED_ORIGINS`, and all secrets
are gitignored.

> **Single source of truth:** the backend lives in this repo at `backend/`. Do **not**
> create or edit an external standalone copy — an out-of-repo `~/Vidya/backend` once
> diverged and its changes never deployed. All backend work happens in `backend/` here.
>
> **KB pipeline note:** the section-aware ingestion scripts were lost when that external
> copy was deleted (the 43 source PDFs survive in `backend/data/ncert_pdfs/`, and the
> ingested Firestore data is intact). Rebuild the pipeline syllabus-driven (read chapter
> ids from `src/content/syllabus.ts`) if content ever needs re-ingesting.

---

## 0. Push the project to GitHub
The repo currently isn't under git. From the project root:
```bash
cd ~/"Vidya V2"
git init
git add .
git commit -m "Vidya app"
# create an empty repo on github.com, then:
git remote add origin https://github.com/<you>/vidya.git
git branch -M main
git push -u origin main
```
✅ Secrets (`.env`, `.env.local`, `backend/*.json`, `backend/data/`) are gitignored —
double-check with `git status` that no `*.json` keys or `.env*` files are staged.

---

## 1. Backend → Render
1. render.com → **New → Web Service** → connect your GitHub repo.
2. Settings:
   - **Root Directory**: `backend`
   - **Runtime**: `Docker` (it auto-uses `backend/Dockerfile`)
3. **Secret Files** (Render → your service → Environment → Secret Files) — paste the
   contents of each local file, using these exact filenames:
   - `firebase_key.json`  ← from `backend/firebase_key.json`
   - `vertex_key.json`    ← from `backend/vertex_key.json`
   - `service_account.json` ← from `backend/service_account.json`
   (Render mounts them at `/etc/secrets/<filename>`.)
4. **Environment Variables**:
   ```
   GOOGLE_GENAI_USE_VERTEXAI=TRUE
   GOOGLE_CLOUD_PROJECT=480385031389
   GOOGLE_CLOUD_LOCATION=us-central1
   GENAI_MODEL=gemini-3.5-flash
   GENAI_PROJECT=mozark-ai-gcp
   GENAI_LOCATION=global
   GENAI_CREDENTIALS=/etc/secrets/service_account.json
   GOOGLE_APPLICATION_CREDENTIALS=/etc/secrets/vertex_key.json
   FIREBASE_CREDENTIALS=/etc/secrets/firebase_key.json
   YOUTUBE_API_KEY=<copy from backend/.env>
   ALLOWED_ORIGINS=*          # tighten in step 3
   ```
5. Deploy. When live, note the URL (e.g. `https://vidya-api.onrender.com`) and test:
   `https://vidya-api.onrender.com/ping` → should return `{"status":"ok",...}`.

---

## 2. Frontend → Vercel
1. vercel.com → **Add New → Project** → import the same repo.
2. Framework preset: **Vite** (auto-detected). Leave build/output defaults.
3. **Environment Variables** (copy Firebase values from your local `.env.local`):
   ```
   VITE_API_BASE=https://vidya-api.onrender.com   # your Render URL, no trailing slash
   VITE_FIREBASE_API_KEY=<from .env.local>
   VITE_FIREBASE_AUTH_DOMAIN=vidya-c4e8d.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=vidya-c4e8d
   VITE_FIREBASE_APP_ID=<from .env.local>
   ```
4. Deploy. Note the URL (e.g. `https://vidya.vercel.app`).

---

## 3. Connect the two + Firebase
1. **Lock CORS**: in Render, set `ALLOWED_ORIGINS` to your Vercel URL
   (e.g. `https://vidya.vercel.app`) and redeploy the backend.
2. **Authorize the domain for login**: Firebase console (project `vidya-c4e8d`) →
   Authentication → Settings → **Authorized domains** → Add your Vercel domain.
   (Without this, signup/login fails with "unauthorized domain".)

---

## 4. Test
Open the Vercel URL → create an account → walk a session. If something fails, check:
- Backend `/ping` is up (Render may cold-start ~30–60s after idle on free tier).
- Browser console / Network tab for the failing `/api/...` call.
- `VITE_API_BASE` has no trailing slash and matches the Render URL.

---

## 5. (Optional) Keep the backend awake — no cold starts
A GitHub Actions workflow (`.github/workflows/keep-alive.yml`) pings the backend
every 10 minutes so Render never spins it down. To enable it:
1. GitHub repo → **Settings → Secrets and variables → Actions → Variables** →
   **New repository variable**:
   - Name: `BACKEND_URL`
   - Value: your Render URL, e.g. `https://vidya-api.onrender.com` (no trailing slash)
2. That's it — it runs automatically. Check the **Actions** tab to see it pinging,
   or trigger it manually with "Run workflow".

Notes:
- GitHub may delay scheduled runs by a few minutes under load; 10 min stays safely
  under Render's ~15-min sleep window.
- Uses GitHub Actions minutes (free & unlimited for **public** repos; private repos
  get 2,000 free min/month, which this fits within).
- Scheduled workflows auto-pause after 60 days of no repo commits — just push once to resume.

## Notes
- **Cold starts (free tier)**: Render free web services sleep after ~15 min idle;
  the first request then takes ~30–60s. The keep-alive workflow above prevents this.
  Alternatively, upgrade to a paid instance for guaranteed instant responses.
- **Cost**: every screen makes live Gemini calls — watch token spend if many people use it.
- **Re-ingesting the KB**: the NCERT PDFs (`backend/data/`) aren't deployed; run
  `ingest.py` locally if you add chapters/grades.
