"""Vidya unit-cost model. Every number here is either MEASURED from the running
app or taken from a published price list — nothing is invented."""

USD_INR = 95.2          # 5 Aug 2026
FLASH_IN  = 1.50 / 1e6  # USD per token, Gemini 3.5 Flash, global endpoint
FLASH_OUT = 9.00 / 1e6
FLASH_CACHED_IN = 0.15 / 1e6
LITE_IN, LITE_OUT = 0.30 / 1e6, 2.50 / 1e6
BATCH_IN, BATCH_OUT = 0.75 / 1e6, 4.50 / 1e6

FS_READ = 0.06 / 100_000       # USD per document read
FS_WRITE = 0.18 / 100_000
FS_STORAGE_GB = 0.18           # USD per GB-month
EGRESS_GB = 0.12               # USD per GB, GCP → internet

# ── MEASURED: tokens per feature invocation (live calls, usage_metadata) ──
# feature: (llm_calls, input_tokens, output_tokens, firestore_reads)
CHUNKS_PER_CHAPTER = 66        # measured mean over 8 sampled chapters
DOC_KB = 24.8                  # measured: content + 3072-dim embedding

F = {
    "ask_rag":        (1,  1183,  2165, CHUNKS_PER_CHAPTER),
    "quiz":           (1,  2280,  5763, CHUNKS_PER_CHAPTER),
    "lesson":         (1,  1879,  5480, CHUNKS_PER_CHAPTER),
    "trick":          (1,   971,  1333, CHUNKS_PER_CHAPTER),
    "diagnostic":     (1,   463,  3495, 0),
    # measured on a 9-subtopic chapter: 3 section batches + 1 overview
    "notes":          (4, 14201, 12991, CHUNKS_PER_CHAPTER * 2),
    # measured for 2 subtopics; a 12-subtopic run is 6 batches
    "revision_run":   (6, 14094, 20526, CHUNKS_PER_CHAPTER),
    # a missed topic buys 2 more questions (1 batch of 1 subtopic)
    "revision_topup": (1,  1200,  1700, CHUNKS_PER_CHAPTER),
    # vision: homework photo → questions + steps (image ≈ 1300 tokens)
    "homework":       (1,  2600,  3200, 0),
}

# ── ASSUMED: what one ACTIVE student does per month ──────────────
# Stated as assumptions because they are behaviour, not measurement.
USAGE = {
    "lesson":          12,   # 3 study sessions a week
    "quiz":            12,   # each session ends in a quiz
    "quiz_practice":    4,   # extra practice quizzes
    "ask_rag":          8,
    "homework":         4,
    "notes":            2,
    "trick":            6,
    "revision_run":     1,   # one whole-chapter revision a month
    "revision_topup":   4,   # ~4 weak topics in that run
    "diagnostic":    1/12,   # onboarding, amortised over a year
}
FEATURE_OF = {"quiz_practice": "quiz"}

ACTIVE_RATIO = 0.60      # of 10,000 signups, how many are active in a month
USERS = 10_000


def totals(usage, cache_hit=0.0, in_rate=FLASH_IN, out_rate=FLASH_OUT, cached_rate=FLASH_CACHED_IN):
    """USD per active user per month. `cache_hit` is the share of SHARED content
    (notes, quiz pools, revision questions) served from a cache instead of the model."""
    # Content that is identical for every student on the same chapter/grade/language.
    SHAREABLE = {"quiz", "quiz_practice", "notes", "revision_run", "revision_topup", "trick", "diagnostic"}
    llm = fs_reads = egress_gb = 0.0
    calls = 0.0
    tok_in = tok_out = 0.0
    for key, n in usage.items():
        f = FEATURE_OF.get(key, key)
        c, ti, to, reads = F[f]
        share = (1 - cache_hit) if f in SHAREABLE else 1.0
        n_eff = n * share
        calls += c * n_eff
        tok_in += ti * n_eff
        tok_out += to * n_eff
        llm += n_eff * (ti * in_rate + to * out_rate)
        fs_reads += reads * n_eff
        egress_gb += reads * n_eff * DOC_KB / 1e6
    return {
        "llm_usd": llm,
        "firestore_usd": fs_reads * FS_READ + egress_gb * EGRESS_GB,
        "fs_reads": fs_reads,
        "egress_gb": egress_gb,
        "calls": calls,
        "tok_in": tok_in,
        "tok_out": tok_out,
    }


def money(usd):
    return f"₹{usd * USD_INR:,.2f}"


print("=" * 72)
print("PER ACTIVE USER PER MONTH — no caching (today's behaviour)")
print("=" * 72)
base = totals(USAGE)
print(f"  LLM calls/user/month : {base['calls']:.0f}")
print(f"  input tokens         : {base['tok_in']:,.0f}")
print(f"  output tokens        : {base['tok_out']:,.0f}  ({base['tok_out']/base['tok_in']:.1f}x input)")
print(f"  LLM cost             : ${base['llm_usd']:.3f}  = {money(base['llm_usd'])}")
print(f"  Firestore + egress   : ${base['firestore_usd']:.3f}  = {money(base['firestore_usd'])}"
      f"   ({base['fs_reads']:,.0f} reads, {base['egress_gb']:.2f} GB)")

print("\n  Cost split by feature (LLM only, no caching):")
rows = []
for key, n in USAGE.items():
    f = FEATURE_OF.get(key, key)
    c, ti, to, _ = F[f]
    usd = n * (ti * FLASH_IN + to * FLASH_OUT)
    rows.append((usd, key, n, c * n))
for usd, key, n, calls in sorted(rows, reverse=True):
    pct = usd / base["llm_usd"] * 100
    print(f"    {key:16} x{n:>5.2f}/mo  {calls:>5.1f} calls  {money(usd):>10}  {pct:5.1f}%")

print("\n" + "=" * 72)
print(f"AT {USERS:,} SIGNUPS ({ACTIVE_RATIO:.0%} active = {int(USERS*ACTIVE_RATIO):,} active users)")
print("=" * 72)

active = USERS * ACTIVE_RATIO

# Fixed infra, independent of the model choice.
INFRA_USD = {
    "Render Pro web service (2 vCPU / 4 GB) x2 for redundancy": 85 * 2,
    "Render workspace (Pro plan)": 25,
    "Vercel Pro (frontend hosting + bandwidth)": 20,
    "Firestore storage (KB 2.6k docs + 10k user states, ~2 GB)": 2 * FS_STORAGE_GB,
    "Firebase Auth (10k MAU, beyond free tier)": 0,     # free below 50k MAU
    "Logging / monitoring / error tracking": 30,
    "Domain, email, misc": 15,
}
infra_total = sum(INFRA_USD.values())

scenarios = [
    ("A. Today — no caching, Flash", totals(USAGE, 0.0)),
    ("B. + cache shared content (80% hit)", totals(USAGE, 0.80)),
    ("C. + Flash-Lite for routine generation", totals(USAGE, 0.80, LITE_IN, LITE_OUT)),
]

for name, s in scenarios:
    var_user = s["llm_usd"] + s["firestore_usd"]
    monthly = var_user * active + infra_total
    print(f"\n{name}")
    print(f"  variable cost / active user : {money(var_user)}")
    print(f"  variable total ({active:,.0f} users)  : {money(var_user * active)}")
    print(f"  fixed infra                 : {money(infra_total)}")
    print(f"  TOTAL / month               : {money(monthly)}")
    print(f"  BLENDED per signup ({USERS:,})   : {money(monthly / USERS)}")
    print(f"  per ACTIVE user             : {money(monthly / active)}")

print("\n" + "=" * 72)
print("FIXED INFRA DETAIL (USD/month)")
print("=" * 72)
for k, v in INFRA_USD.items():
    print(f"  {k:58} ${v:>6.2f}  {money(v):>12}")
print(f"  {'TOTAL':58} ${infra_total:>6.2f}  {money(infra_total):>12}")

print("\n" + "=" * 72)
print("SENSITIVITY — what if students are more active?")
print("=" * 72)
for mult, label in [(0.5, "light (half my assumption)"), (1.0, "assumed"), (2.0, "heavy (double)")]:
    u = {k: v * mult for k, v in USAGE.items()}
    a = totals(u, 0.0); b = totals(u, 0.80)
    print(f"  {label:28}  no cache {money(a['llm_usd']+a['firestore_usd']):>10}"
          f"   |  cached {money(b['llm_usd']+b['firestore_usd']):>9}")
