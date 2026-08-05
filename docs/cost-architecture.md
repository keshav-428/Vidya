# Vidya — Cost Architecture at 10,000 Users

**Date:** 5 August 2026 · **Currency:** INR at ₹95.20 / USD ([Fed H.10, 3 Aug 2026](https://www.federalreserve.gov/releases/h10/hist/dat00_in.htm))
**Status:** token figures are **measured from the running app**; usage frequencies are **assumptions**, flagged as such.

---

## 1. The number

At **10,000 signups** with **60% monthly active** (6,000 active students):

| Scenario | Per active user / month | Per signup / month | Total / month |
|---|---:|---:|---:|
| **A. Today** — no caching, Gemini 3.5 Flash | **₹238** | ₹143 | **₹14.28 lakh** |
| **B. + cache shared content** (80% hit) | ₹122 | ₹73 | ₹7.31 lakh |
| **C. + Flash-Lite for routine generation** | **₹37** | ₹22 | **₹2.20 lakh** |

**The headline: this is an LLM bill, not an infrastructure bill.** At today's usage the model accounts for **99.5%** of variable cost. Firestore and egress are ₹1.15 per user per month. Servers are ₹24,786/month *in total* — about ₹2.50 per signup.

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

**Everything else:** Firestore reads $0.06/100k, storage $0.18/GB-month ([Firebase](https://firebase.google.com/docs/firestore/pricing)) · GCP egress $0.12/GB · Render Standard $25 / Pro $85 / Pro Plus $175 per month, workspace $25 ([Render](https://render.com/pricing)) · Vercel Pro $20/month · Firebase Auth free below 50k MAU.

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

### Lever 4 — Fix the retrieval read pattern · saves ~₹1.15/user + latency

Every retrieval streams the **whole chapter — ~66 documents averaging 24.8 KB each** (each carries a 3072-dim embedding), then ranks in Python. That's ~1.6 MB over the wire to answer one question. Cheap today (₹1.15/user/month) but it is the reason a full-collection scan now **times out**, and it scales with the syllabus, not with users.

Fix: store vectors in a real vector index (Firestore now supports vector search natively), or split embeddings into a sibling collection so content reads don't drag 25 KB vectors along.

---

## 8. Serving capacity — a defect worth ₹53,000/month

`backend/main.py` declares **29 `async def` endpoints, contains zero `await` statements, and never offloads to a threadpool.** A path operation declared `async def` runs *on the event loop*, so every blocking 25–35 second Gemini call **freezes the entire worker** — all other requests queue behind it.

Sizing the evening peak (50% of a day's traffic in 3 hours, 26 active days, 25 s mean call):

- Peak demand: **0.68 req/s → ~17 simultaneous in-flight requests**

| | Workers needed | Infra cost |
|---|---:|---:|
| **Today** (blocking, 1 request per worker) | ~17 | ~₹69,000/mo |
| **Fixed** (`def` instead of `async def`, or `asyncio.to_thread`) | 1–2 | ₹16,184/mo |

**The fix is deleting the word `async` from 29 function signatures** — FastAPI then runs them in its 40-thread pool automatically. These calls are I/O-bound, so threads are exactly right. Saving: **~₹53,000/month**, plus it removes a latency cliff that would otherwise appear as random 60-second waits under load.

*This is not in the cost table above — the table assumes it's fixed.*

---

## 9. Fixed infrastructure

| Item | USD/mo | INR/mo |
|---|---:|---:|
| Render Pro web service (2 vCPU / 4 GB) × 2 | $170 | ₹16,184 |
| Render workspace (Pro) | $25 | ₹2,380 |
| Vercel Pro | $20 | ₹1,904 |
| Logging / monitoring / error tracking | $30 | ₹2,856 |
| Domain, email, misc | $15 | ₹1,428 |
| Firestore storage (~2 GB) | $0.36 | ₹34 |
| Firebase Auth (10k MAU) | $0 | ₹0 |
| **Total** | **$260** | **₹24,786** |

Fixed infra is **1.7% of the bill** in Scenario A and 11% in Scenario C. It is not where the attention belongs — but note it barely grows to 10k users, so it improves as you scale.

---

## 10. Sensitivity

My usage assumptions are the weakest input, so here is the swing:

| Student behaviour | No caching | With caching |
|---|---:|---:|
| Light (half assumed) | ₹117 | ₹59 |
| **Assumed** | **₹234** | **₹118** |
| Heavy (double) | ₹468 | ₹235 |

Other things that move the number:

- **Active ratio.** 60% assumed. At 40% active, per-signup cost drops to ₹95 (A) but per-*active*-user is unchanged — watch the metric that matters for pricing.
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

1. **Fix the `async def` blocking** — an afternoon's work, ~₹53,000/month, removes a load-related latency cliff.
2. **Ship the shared-content cache** — the single biggest lever (~₹6.9 lakh/month) and it makes the app dramatically faster.
3. **Pre-generate the corpus on the batch tier**, then keep it warm.
4. **Instrument tokens per call**, so pricing decisions rest on data.
5. **Trial Flash-Lite** on formulaic question types, gated on a quality comparison.

Landing 1–3 alone takes the bill from **₹14.28 lakh to about ₹7.3 lakh a month** — **₹122 per active student**. Adding Flash-Lite where it's safe takes it to **₹37**.

For context on pricing: at ₹37–122 per active student per month, a ₹299–499/month subscription carries a healthy gross margin even before the cache is warm. **Today's uncached ₹238 does not.**
