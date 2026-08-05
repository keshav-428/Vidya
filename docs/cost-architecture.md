# Vidya — Cost Architecture at 10,000 Users

**Date:** 5 August 2026 · **Currency:** INR at ₹95.20 / USD ([Fed H.10, 3 Aug 2026](https://www.federalreserve.gov/releases/h10/hist/dat00_in.htm))
**Status:** token figures are **measured from the running app**; usage frequencies are **assumptions**, flagged as such.

---

## 1. The number

At **10,000 signups** with **60% monthly active** (6,000 active students):

| Scenario | Per active user / month | Per signup / month | Total / month |
|---|---:|---:|---:|
| **A. Today** — no caching, Gemini 3.5 Flash | **₹238** | ₹143 | **₹14.27 lakh** |
| **B. + cache shared content** (80% hit) | ₹122 | ₹73 | ₹7.33 lakh |
| **C. + Flash-Lite for routine generation** | **₹37** | ₹22 | **₹2.21 lakh** |

These include the **full production stack** in §9 — staging, backups, WAF, error tracking, analytics, CI and log retention — not a minimum viable one. Loading all of that in adds **₹4.91 per active student**: infra is 2.1% of the bill in Scenario A and 13.4% in Scenario C.

**The headline: this is an LLM bill, not an infrastructure bill.** The model is **97.9%** of the total in Scenario A. You can buy every upgrade worth having — a staging environment, a WAF, point-in-time backups, Sentry, PostHog, paid CI — and it moves the per-student number by about **₹5**. Under-provisioning infrastructure is not where this product is won.

The gap between A and C is **₹12 lakh a month**, and none of it requires changing what a student experiences.

---

## 2. How these numbers were produced

I did not estimate token counts. I wrapped `generate_content` in the live backend, ran one real call per feature, and read `usage_metadata` off the response. Prices come from the vendors' current published lists. Assumptions appear only in §5 (how often a student does things), and §9 shows what happens if those assumptions are wrong.

---

## 3. Prices used

**Gemini 3.5 Flash** on Vertex AI, global endpoint ([Google, Aug 2026](https://cloud.google.com/vertex-ai/generative-ai/pricing)):

| | Input | Output | Cached input |
|---|---:|---:|---:|
| **Flash** (in use today) | $1.50/M | **$9.00/M** | $0.15/M |
| **Flash-Lite** | $0.30/M | $2.50/M | $0.03/M |
| Flash, Batch tier | $0.75/M | $4.50/M | — |

Two facts drive this whole document:

1. **Output costs 6× input**, and Vidya generates far more than it reads — 1.9 output tokens per input token. This is a *generation* product, not a retrieval one.
2. **Cached input is 10× cheaper**, and **Flash-Lite output is 3.6× cheaper** than Flash output.

> ⚠️ **Regional pricing.** `GENAI_LOCATION=global` today, so global rates apply. Non-global endpoints moved to $1.65/$9.90 on 1 July 2026 — **+10%**. If you pin to `asia-south1` for latency or data residency, add 10% to every LLM figure here.

**Everything else:** Firestore reads $0.06/100k, storage $0.18/GB-month ([Firebase](https://firebase.google.com/docs/firestore/pricing)) · GCP egress $0.12/GB · Cloud Run $0.000024/vCPU-s, $0.0000025/GiB-s, $0.40/M requests, with 180k vCPU-s / 360k GiB-s / 2M requests free monthly ([Google](https://cloud.google.com/run/pricing)) · Cloudflare Pages free, unlimited bandwidth, commercial use permitted ([Cloudflare](https://developers.cloudflare.com/pages/platform/limits)) · Render Standard $25 / Pro $85, workspace $25 ([Render](https://render.com/pricing)) · Vercel Pro $20/month · Firebase Auth free below 50k MAU.

---

## 4. Measured cost per feature

One invocation, measured live:

| Feature | LLM calls | Input tok | Output tok | Cost |
|---|---:|---:|---:|---:|
| Chapter notes (9 subtopics) | 4 | 14,201 | 12,991 | **₹13.16** |
| Revision run (12 subtopics) | 6 | 14,094 | 20,526 | ₹19.60 |
| Quiz (9-question pool) | 1 | 2,280 | 5,763 | ₹5.26 |
| Adaptive lesson | 1 | 1,879 | 5,480 | ₹4.96 |
| Homework help (photo) | 1 | ~2,600 | ~3,200 | ₹3.11 |
| Ask Vidya (RAG) | 1 | 1,183 | 2,165 | ₹2.02 |
| Onboarding warm-up | 1 | 463 | 3,495 | ₹3.06 |
| Trick card | 1 | 971 | 1,333 | ₹1.28 |

Useful reference points:

- **One study session** (lesson + quiz) = **₹10.23**
- **One full chapter revision** (12 subtopics, 4 needing extra questions) = **₹26.11**
- **One chapter's notes** = **₹13.16** — *and this is identical for every student in that class*

---

## 5. Usage assumptions

⚠️ **This section is assumption, not measurement.** Replace it with analytics as soon as you have them (§10).

One active student per month: 12 sessions (lesson + quiz), 4 extra practice quizzes, 8 Ask Vidya questions, 4 homework photos, 2 chapter notes, 6 trick cards, 1 whole-chapter revision run (with ~4 weak topics), plus the onboarding warm-up amortised over a year.

That comes to **64 LLM calls, 132k input tokens and 250k output tokens per student per month.**

---

## 6. Where the money goes

| Feature | Share of LLM cost | Cost/user/mo | Cacheable? |
|---|---:|---:|:--|
| Session quizzes | 27.1% | ₹63.16 | ✅ identical per chapter |
| Adaptive lessons | 25.6% | ₹59.56 | ✅ identical per subtopic |
| Chapter notes | 11.3% | ₹26.32 | ✅ **fully** static |
| Practice quizzes | 9.0% | ₹21.05 | ✅ |
| Revision runs | 8.4% | ₹19.60 | ✅ |
| Ask Vidya | 7.0% | ₹16.19 | ❌ student's own question |
| Homework help | 5.3% | ₹12.45 | ❌ student's own photo |
| Trick cards | 3.3% | ₹7.68 | ✅ |
| Revision top-ups | 2.8% | ₹6.51 | partly |

**~87% of spend is on content that is byte-for-byte identical for every student studying the same chapter in the same class and language.** Today Vidya regenerates it every single time. That is the entire finding of this document.

---

## 7. The levers, ranked

### Lever 1 — Cache shared content · saves ~₹6.9 lakh/month · **build this first**

Notes, quiz pools, revision questions, tricks and lessons depend only on `(chapter, subtopic, grade, language, difficulty)`. Cache them in Firestore keyed on that tuple.

The syllabus is **39 chapters / 187 subtopics** across classes 6–8. Two languages. The *entire* generatable corpus is a few thousand documents costing roughly **₹40,000 to build once** — versus ₹14 lakh a month regenerating it per student.

Hit rates will be very high: 6,000 students share 39 chapters. Even at 80% (conservative — it should exceed 95% once warm) this halves the bill. Serve variety by generating 3–5 variants per key and rotating, so two students don't see identical questions.

**Second-order win:** a cache hit returns in ~50 ms instead of 25–55 s. The 35-second wait before a revision run disappears.

### Lever 2 — Flash-Lite for routine generation · saves a further ~₹5.1 lakh/month

Output at $2.50/M vs $9.00/M. Not everything should move — but quiz pools, trick cards and fill-in-the-blank questions are formulaic, and every question already passes strict server- and client-side validation before a student sees it (`_valid_item`, `parseQuestion`), so a weaker model fails *safely*. Keep Flash for lessons, notes and Ask Vidya, where explanation quality is the product.

**Do this as an A/B on question quality, not as a blanket switch.**

### Lever 3 — Batch tier for cache warming · saves ~50% on pre-generation

Warming the cache is not latency-sensitive. Batch is $0.75/$4.50 — half price. Pre-generate the corpus on the batch tier overnight.

### Lever 4 — Fix the retrieval read pattern · latency, and a scaling wall

Every retrieval streams the **whole chapter — ~66 documents averaging 24.8 KB each** (each carries a 3072-dim embedding), then ranks in Python. That's ~1.6 MB over the wire to answer one question. Cheap once the backend is co-located (₹0.19/user/month) but it is the reason a full-collection scan now **times out**, and it scales with the syllabus, not with users.

Fix: store vectors in a real vector index (Firestore now supports vector search natively), or split embeddings into a sibling collection so content reads don't drag 25 KB vectors along. Co-locating the backend (§9) removes the egress charge but not the read volume or the latency.

---

## 8. Serving capacity — the defect that gates the hosting choice

`backend/main.py` declares **29 `async def` endpoints, contains zero `await` statements, and never offloads to a threadpool.** A path operation declared `async def` runs *on the event loop*, so every blocking 25–35 second Gemini call **freezes the entire worker** — all other requests queue behind it.

Sizing the evening peak (50% of a day's traffic in 3 hours, 26 active days, 25 s mean call):

- Peak demand: **0.68 req/s → ~17 simultaneous in-flight requests**

| | Workers needed | Infra cost |
|---|---:|---:|
| **Today** (blocking, 1 request per worker) | ~17 | ~₹69,000/mo on Render, ~₹73,000 on Cloud Run |
| **Fixed** (`def` instead of `async def`, or `asyncio.to_thread`) | 1–2 | ₹4,311/mo on Cloud Run |

**The fix is deleting the word `async` from 29 function signatures** — FastAPI then runs them in its 40-thread pool automatically. These calls are I/O-bound, so threads are exactly right. It removes a latency cliff that would otherwise appear as random 60-second waits under load, and it is what makes the Cloud Run sizing in §9 possible at all (see the warning there).

*The cost tables assume this is fixed. Until it is, no hosting choice looks good — see §9.*

---

## 9. Hosting — what to run this on

The frontend is a **868 KB static SPA**: no SSR, no serverless functions, one rewrite rule in `vercel.json`. The backend is a Python FastAPI service whose requests are 25–35 seconds of *waiting on Vertex AI* — almost no CPU, almost no memory, entirely I/O-bound.

Those two facts should decide the hosting, and they point somewhere other than Render + Vercel.

### Frontend: Cloudflare Pages, not Vercel Pro

At ~32 GB/month of CDN egress (cold loads only — the SPA caches after first visit):

| Option | Cost | Notes |
|---|---:|---|
| Vercel Pro (today) | ₹1,904/mo | $20/seat. A static SPA uses none of what that buys |
| Vercel Hobby | ₹0 | **Commercial use is not permitted** — not an option for a paid product |
| **Cloudflare Pages** | **₹0** | Unlimited bandwidth, commercial use allowed, strong India PoPs |
| Firebase Hosting | ~₹48/mo | Consolidates with Auth + Firestore; fine if you prefer one vendor |
| S3 + CloudFront | ~₹571/mo | Cheap, but you own cache rules and invalidation |

**Cloudflare Pages.** Same SPA-rewrite behaviour via `_redirects`, unlimited bandwidth on the free tier with commercial use explicitly allowed, and good Indian points of presence — which matters for students on mid-range phones and patchy connections. Firebase Hosting is the reasonable alternative if you'd rather keep everything with Google.

### Backend: Cloud Run, co-located with Firestore and Vertex

| Option | Cost/mo | Notes |
|---|---:|---|
| Render Pro × 2 (previous assumption) | ₹21,668 | Cross-cloud: pays GCP egress on every chapter read |
| Render Standard × 2 | ₹10,244 | 1 vCPU/2 GB — likely too small for 17 concurrent requests |
| **Cloud Run, asia-south1** | **₹4,311** | Same region as Firestore: egress free, latency down |
| Fly.io (2 × shared-2x) | ₹8,816 | Good India presence, still cross-cloud |
| GCE VMs + load balancer | ₹13,328 | You own patching, scaling and the LB |

Cloud Run wins on three counts, and cost is the least interesting one:

1. **Co-location kills egress.** Every retrieval streams ~66 documents at ~24.8 KB (§7, Lever 4) — about 1.6 MB to answer one question. From Render that crosses the public internet and is billed; from Cloud Run in the same region as Firestore it's intra-region and free. That's **₹5,484/month** plus a latency win on every single request.
2. **The load is spiky and I/O-bound.** Evening peak, quiet school hours. Cloud Run bills only while requests are in flight and scales to zero. Render bills a fixed instance 24/7 whether anyone is studying or not.
3. **Cold starts don't matter here.** Normally the argument against scale-to-zero — but every meaningful request already takes 15–55 seconds. A 2-second cold start is noise against a 30-second lesson generation.

Also worth having: **Workload Identity instead of a service-account key file**. Running inside GCP removes the long-lived `GENAI_CREDENTIALS` JSON from your deploy config — one fewer secret that can leak.

> ⚠️ **Confirm your Firestore region first.** Embeddings currently run in `us-central1` and generation is on the `global` endpoint. Put Cloud Run in **the same region as the Firestore database**, or you'll pay the egress you were trying to remove. If Firestore is in `us-central1`, either keep the backend there or plan a database migration — and note that moving Vertex calls to a regional endpoint adds 10% (§3).

### ⚠️ Cloud Run makes the `async` fix mandatory, not optional

Cloud Run's economics depend on **concurrency** — one container handling many simultaneous requests. That is exactly what §8's blocking `async def` prevents. With the blocking as-is you'd have to set concurrency to 1 and run ~17 containers at peak: **~₹73,000/month, worse than Render.** Fixed, one container covers the peak at ₹4,311.

**Fix the blocking first, then migrate.** In the other order you'd conclude Cloud Run is expensive.

### Two tiers of infrastructure

**Lean** — what it takes to serve 10,000 users and nothing more: **₹7,174/month** (Cloud Run ₹4,284, Cloudflare Pages ₹0, logging ₹952, registry ₹476, domain ₹1,428, Firestore storage ₹34).

**Production** — what you should actually run at this scale. Every line is something you would be uncomfortable operating without:

| Item | USD/mo | INR/mo | Why |
|---|---:|---:|---|
| Cloud Run prod (2 vCPU/4 GiB, min-instance 1 for 14h/day) | $100 | ₹9,520 | No cold start during study hours |
| Cloud Run staging | $5 | ₹476 | Test a prompt change before students see it |
| Cloud Run Job — nightly cache warming | $3 | ₹286 | Keeps Lever 1 warm |
| Cloudflare Pro | $25 | ₹2,380 | WAF + bot protection on a public signup form |
| PostHog (~1.2M events) | $50 | ₹4,760 | The analytics that replace §5's assumptions |
| Sentry Team | $26 | ₹2,475 | A silent generation failure is invisible otherwise |
| Cloud Logging retention (~100 GB) | $25 | ₹2,380 | Debugging LLM output needs the logs |
| Transactional + product email | $20 | ₹1,904 | Password resets, parent digests |
| GitHub Actions (private CI) | $20 | ₹1,904 | |
| Uptime monitoring / alerting | $10 | ₹952 | |
| Artifact Registry | $5 | ₹476 | |
| Firestore backups (PITR + weekly export) | $3 | ₹286 | Mastery data is not regenerable |
| Firestore storage (~5 GB) + writes (~300k/mo) | $1.44 | ₹137 | |
| Secret Manager | $1 | ₹95 | |
| Domain, SSL, misc | $15 | ₹1,428 | |
| Firebase Auth (email/password, 10k MAU) | $0 | ₹0 | Free below 50k MAU |
| **Total** | **$309** | **₹29,459** | |

**₹29,459/month is ₹2.95 per signup, ₹4.91 per active student.** Going from lean to fully-loaded production costs **₹3.71 per active student per month** — about 1.6% of today's bill.

> **No SMS cost today.** Auth is email/password only (`src/auth/AuthContext.tsx`). If you add phone-OTP signup — common for Indian consumer apps — budget SMS per verification plus retries; at 10,000 signups that becomes a real line item, and it is charged on *signups*, including the ones that never become students.

Against the earlier Render + Vercel assumption (₹24,786 + ₹5,484 egress), the lean stack saves **₹23,068/month**; even the full production stack saves **₹800/month** while adding staging, WAF, backups and observability.

## 10. Sensitivity

My usage assumptions are the weakest input, so here is the swing:

| Student behaviour | No caching | With caching |
|---|---:|---:|
| Light (half assumed) | ₹117 | ₹59 |
| **Assumed** | **₹234** | **₹118** |
| Heavy (double) | ₹468 | ₹235 |

Other things that move the number:

- **Active ratio.** 60% assumed. At 40% active, per-signup cost drops to ~₹94 (A) but per-*active*-user is unchanged — watch the metric that matters for pricing.
- **Regional endpoint:** +10%.
- **Free/guest usage.** A guest completing onboarding plus a few lessons costs ~₹25 before signing up. At 10,000 signups with a 3:1 visitor-to-signup ratio that's ~₹5 lakh of unconverted spend — **guest limits are a cost control, not just a growth lever.**
- **Retries.** The trick generator returned malformed JSON during measurement (a JSON parse failure). Failed generations are billed. Worth tracking a retry rate.

---

## 11. What to instrument

This document should be replaced by real data within a month:

1. **Log `usage_metadata` on every LLM call** — feature, input tokens, output tokens, cached tokens, latency, retry count. This is a handful of lines in `llm_config.py` and turns §5's assumptions into fact.
2. **Cache hit rate per content type**, once Lever 1 ships.
3. **Calls per active user per week**, split by feature.
4. **Cost per active user**, tracked weekly against the ₹37–238 range above.

---

## 12. Recommendation

1. **Fix the `async def` blocking** — an afternoon's work, removes a load-related latency cliff, and is a **prerequisite** for the hosting move below.
2. **Ship the shared-content cache** — the single biggest lever (~₹6.9 lakh/month) and it makes the app dramatically faster.
3. **Pre-generate the corpus on the batch tier**, then keep it warm.
4. **Instrument tokens per call**, so pricing decisions rest on data.
5. **Move to Cloud Run + Cloudflare Pages** (§9) — ₹23,068/month, lower latency for Indian users, and no service-account key in your deploy config.
6. **Trial Flash-Lite** on formulaic question types, gated on a quality comparison.

Landing 1–3 alone takes the bill from **₹14.05 lakh to about ₹7.1 lakh a month** — **₹118 per active student**. Adding Flash-Lite where it's safe takes it to **₹33**.

For context on pricing: at ₹33–118 per active student per month, a ₹299–499/month subscription carries a healthy gross margin even before the cache is warm. **Today's uncached ₹234 does not.**
