import json
import base64
from concurrent.futures import ThreadPoolExecutor
from google.genai import types
from llm_config import gen_client, GEN_MODEL, STYLE_GUIDE
import rag_service
from languages import lang_instruction


def generate_concept(topic: str, grade: int = 6, language: str = "English",
                     chapter_id: str = None, section: str = None):
    """Generates a concept lesson (definition + mistakes + examples) for any topic,
    grounded in the NCERT knowledge base when relevant context is found.
    When chapter_id/section are given, retrieval is scoped to that exact subtopic."""
    try:
        context = rag_service.retrieve_context(
            topic, grade=grade, top_k=5, chapter_id=chapter_id, section=section
        )
    except Exception:
        context = []
    context_text = "\n\n".join([c.get("content", "") for c in context]) if context else ""

    prompt = f"""You are a CBSE Class {grade} Mathematics teacher creating a bite-sized lesson
for the topic "{topic}", written for a phone screen.

LANGUAGE: {lang_instruction(language)}

{STYLE_GUIDE}

Use this NCERT textbook context if relevant (ignore if unrelated):
\"\"\"{context_text}\"\"\"

Return ONLY valid JSON with EXACTLY this structure (all text values in the LANGUAGE above):
{{
  "definition": "2 short paragraphs in plain, friendly language explaining {topic}. Separate paragraphs with \\n\\n.",
  "mistakes": [
    {{"title": "short name of the mistake", "wrong": "the WRONG version, very brief/symbolic", "right": "the CORRECT version, very brief/symbolic", "why": "one short sentence explaining the fix"}}
  ],
  "examples": [
    {{"q": "a worked practice question", "steps": [{{"label": "Step name", "detail": "what to do in this step"}}], "answer": "the final answer"}}
  ]
}}

Rules: exactly 2 mistakes and 2 examples. Keep "wrong" and "right" short enough to fit a narrow phone column.
Strictly return ONLY the JSON object."""

    response = gen_client.models.generate_content(
        model=GEN_MODEL,
        contents=prompt,
        config={"response_mime_type": "application/json"},
    )
    return json.loads(response.text)


def generate_lesson(topic: str, grade: int = 6, language: str = "English",
                    chapter_id: str = None, section: str = None, depth: str = "full",
                    sections: list = None, section_titles: list = None, focus: str = None):
    """Generates an ADAPTIVE lesson, structured as teaching beats:
    hook → concept card(s) → hook-resolving check (+ alternate explanation & easier
    check for the branch when the student misses) → per-part worked examples each
    with a 'your turn' micro-question → spot-the-mistake game items.

    Covers ONE subtopic (`section`), or SEVERAL when the student picked multiple
    for one session (`sections` + their `section_titles`) — then retrieval widens
    to the chapter and the examples must cover every named subtopic.

    depth: 'full' (student is new/struggling) → 2 concept cards, 3 examples.
           'quick' (student already decent) → 1 concept card, 2 examples.
    """
    multi = bool(sections) and len(sections) > 1
    try:
        if multi:
            # Several subtopics: retrieve per section so each is represented,
            # falling back to chapter scope if a section returns nothing.
            chunks = []
            for sec in sections[:6]:
                chunks.extend(rag_service.retrieve_context(
                    topic, grade=grade, top_k=3, chapter_id=chapter_id, section=sec))
            context = chunks or rag_service.retrieve_context(
                topic, grade=grade, top_k=6, chapter_id=chapter_id)
        else:
            context = rag_service.retrieve_context(
                topic, grade=grade, top_k=5, chapter_id=chapter_id, section=section)
    except Exception:
        context = []
    context_text = "\n\n".join([c.get("content", "") for c in context]) if context else ""

    n_cards, n_examples = (1, 2) if depth == "quick" else (2, 3)
    # Answering one specific question needs less scaffolding than teaching a
    # whole subtopic — keep a focused lesson tight so it stays on the point.
    if focus:
        n_cards, n_examples = 1, 2
    # One session covering several subtopics needs at least one example each.
    covered = [t for t in (section_titles or []) if t]
    if multi and covered:
        n_examples = max(n_examples, min(len(covered), 5))
    # The student asked about ONE thing (a photo of a sum, a typed doubt). Answer
    # THAT using the NCERT context — don't survey the rest of the subtopic.
    focus_rule = (
        f"\nWHAT THE STUDENT IS ACTUALLY ASKING:\n\"{focus}\"\n"
        "This lesson must answer exactly that. The hook, the concept card(s), the check and the\n"
        "examples must all serve that specific question — if it names particular numbers or a\n"
        "particular wording, use them. Do NOT survey the rest of the chapter or teach adjacent\n"
        "sub-skills the student did not ask about. Stay inside the NCERT context above, and keep\n"
        "it to the smallest complete explanation that genuinely answers the question.\n"
        if focus else ""
    )
    coverage_rule = (
        f"\nThis ONE session covers these {len(covered)} subtopics together: "
        + "; ".join(covered)
        + ". The concept card(s) must tie them into one connected idea, and the examples "
          "must cover EVERY one of them — set each example's \"part\" to the subtopic it covers.\n"
        if (multi and covered) else ""
    )

    prompt = f"""You are Vidya — a warm, playful, brilliant maths teacher talking one-on-one
with a CBSE Class {grade} student (age 11-14) on their phone. You are creating an
interactive lesson on "{topic}".

LANGUAGE for every text value: {lang_instruction(language)}

{STYLE_GUIDE}

Ground the maths in this NCERT textbook context if relevant (ignore if unrelated):
\"\"\"{context_text}\"\"\"

VOICE RULES (very important):
- Talk TO the student like a favourite teacher: "Let's see...", "Now watch what happens...", "Your turn!"
- Words an 11-year-old uses. No textbook formality, no jargon.
- Use relatable Indian contexts: cricket scores, ₹ pocket money, pizza/samosas, mobile data, marks.

Return ONLY valid JSON with EXACTLY this structure:
{{
  "hook": {{
    "scenario": "A short, relatable real-world puzzle (2-3 sentences) that {topic} secretly solves. End with a direct question to the student.",
    "options": ["guess A", "guess B", "guess C"],
    "best_index": 0,
    "reveal": "one teasing line that does NOT give the answer away, e.g. 'Hold that thought — let's learn the trick first!'"
  }},
  "concept_cards": [
    {{"heading": "short friendly heading", "body": "the core idea explained in Vidya's talking voice, 2-4 short sentences per paragraph, separate paragraphs with \\n\\n"}}
  ],
  "alt_explanation": {{"heading": "Another way to see it", "body": "the SAME core idea explained through a COMPLETELY DIFFERENT representation (if the cards used numbers, use a picture-in-words / money / food analogy). Shown only to students who missed the check."}},
  "check": {{
    "prompt": "resolve the hook: re-ask the hook question (or its direct application) now that the idea is taught",
    "options": ["...", "...", "..."],
    "correct_index": 0,
    "right": "one celebratory line that also states WHY it's right",
    "wrong": "one kind line that names the likely mix-up, never says 'wrong'"
  }},
  "easier_check": {{
    "prompt": "a gentler variant of the check with friendlier numbers",
    "options": ["...", "...", "..."],
    "correct_index": 0,
    "right": "short celebration",
    "wrong": "short kind line giving the answer and the one-line trick"
  }},
  "examples": [
    {{
      "part": "the sub-skill this example covers (2-4 words)",
      "q": "the worked question",
      "steps": [{{"label": "Step name", "detail": "what we do and why, in talking voice"}}],
      "answer": "the final answer",
      "your_turn": {{
        "prompt": "a TWIN of this example with new numbers — the student applies the exact same steps",
        "options": ["...", "...", "..."],
        "correct_index": 0,
        "right": "celebration naming what they just did",
        "wrong": "kind line pointing at the exact step to recheck"
      }}
    }}
  ],
  "spot_mistakes": [
    {{
      "story": "A kid's name + the question + their WRONG solution shown briefly (e.g. 'Rohan solved 1/4 + 1/3 like this: 1+1=2, 4+3=7, so 2/7.')",
      "prompt": "Where did he/she go wrong?",
      "options": ["...", "...", "..."],
      "correct_index": 0,
      "explain": "one line naming the misconception + the correct rule"
    }}
  ]
}}

{focus_rule}{coverage_rule}
STRUCTURE RULES:
- exactly {n_cards} concept_cards and exactly {n_examples} examples.
- exactly 2 spot_mistakes, each showing a DIFFERENT common misconception for {topic}.
- The examples together must cover the distinct parts/cases of {topic} (label each via "part").
- Every options array has exactly 3 options; correct_index must be accurate — double-check the maths.
- All questions must be answerable in the head or with tiny mental steps (phone screen, no rough work).
Strictly return ONLY the JSON object."""

    response = gen_client.models.generate_content(
        model=GEN_MODEL,
        contents=prompt,
        config={"response_mime_type": "application/json"},
    )
    return json.loads(response.text)


def identify_concept_from_images(images_b64: list, grade: int = 6, language: str = "English",
                                 mime_types: list = None, syllabus: list = None):
    """Looks at photo(s) of what a student is stuck on (class notes, a textbook
    page, a worksheet, a whiteboard) and works out THREE things:

      topic   — a short concept title, for display
      focus   — the specific thing the page is actually about (the question or
                sub-idea), so the lesson answers THAT instead of surveying the
                whole subtopic
      chapter_id + section — the matching NCERT entry from the student's own
                syllabus (passed in), so retrieval can be scoped to it and the
                result can be credited to that skill's mastery

    Returns: { detected, topic, focus, chapter_id, section, summary }
    """
    catalog = ""
    if syllabus:
        lines = []
        for ch in syllabus:
            subs = "; ".join(f"{s.get('section')} {s.get('title')}" for s in (ch.get("subtopics") or []))
            lines.append(f"- chapter_id \"{ch.get('chapter_id')}\" | {ch.get('chapter_title')} | subtopics: {subs}")
        catalog = ("\nTHE STUDENT'S CLASS SYLLABUS (choose chapter_id and section from THIS list only):\n"
                   + "\n".join(lines) + "\n")

    prompt = f"""You are a CBSE Class {grade} Mathematics teacher.
A student has uploaded photo(s) of something they are studying or stuck on — handwritten
notes, a textbook page, a worksheet, a whiteboard, or a problem they wrote down.

LANGUAGE for the "summary" field: {lang_instruction(language)}
{catalog}
Your job:
1. Work out the SINGLE Mathematics concept shown. Ignore page numbers, names, dates, decorations.
2. Work out what the page is SPECIFICALLY about — the exact question, worked problem, or
   sub-idea in front of the student. Be precise: if it shows "3/4 + 2/5", the focus is adding
   fractions with unlike denominators (and mention that example); if it asks "why do we need a
   common denominator?", the focus is that reasoning. This is what the lesson will answer, so
   it must be narrower than the whole chapter.
3. Match it to the syllabus above: give the exact chapter_id and the section number.

Return ONLY valid JSON with EXACTLY this structure:
{{
  "detected": true if you can clearly identify a maths concept, false if the image has no identifiable maths topic,
  "topic": "a short concept title (3-6 words) in English, e.g. 'Adding Unlike Fractions'. Empty string if detected is false.",
  "focus": "one or two sentences in English naming exactly what the student is asking about, including any specific numbers or wording from the page. Empty string if detected is false.",
  "chapter_id": "the matching chapter_id from the syllabus above, or empty string if none fits",
  "section": "the matching section number (e.g. '7.2'), or empty string if unsure",
  "summary": "one friendly sentence telling the student what you spotted, in the LANGUAGE above. If not detected, briefly say you couldn't find a maths topic."
}}

Strictly return ONLY the JSON object."""

    # Build multimodal content: text prompt + all images
    parts = [types.Part.from_text(text=prompt)]
    for i, img_b64 in enumerate(images_b64):
        image_bytes = base64.b64decode(img_b64)
        # Use the browser-reported type; a mislabelled HEIC/PNG makes Gemini reject the image.
        mt = (mime_types[i] if mime_types and i < len(mime_types) and mime_types[i] else "image/jpeg")
        parts.append(types.Part(inline_data=types.Blob(mime_type=mt, data=image_bytes)))

    response = gen_client.models.generate_content(
        model=GEN_MODEL,
        contents=types.Content(role="user", parts=parts),
        config={"response_mime_type": "application/json"},
    )
    return json.loads(response.text)


def generate_trick(topic: str, grade: int = 6, language: str = "English",
                   chapter_id: str = None, section: str = None):
    """A short shortcut for one topic — plus WHY it works, which is what keeps a
    trick from breaking when the exam rephrases the question. Grounded in the
    NCERT context for that subtopic when we have it.

    Returns: { "title", "trick", "why", "try_q", "try_a" }
    """
    try:
        context = rag_service.retrieve_context(
            topic, grade=grade, top_k=3, chapter_id=chapter_id, section=section)
    except Exception:
        context = []
    context_text = "\n\n".join([c.get("content", "") for c in context]) if context else ""

    prompt = f"""You are Vidya, a warm maths teacher for a CBSE Class {grade} student (age 11-14).
Give ONE genuinely useful shortcut or quick method for "{topic}" — the kind of thing a student
would show a friend.

LANGUAGE for every text value: {lang_instruction(language)}

{STYLE_GUIDE}

NCERT context for this topic (use it if relevant, ignore if not):
\"\"\"{context_text}\"\"\"

RULES:
- The trick must be CORRECT and must actually save time. Never invent a rule that only
  works sometimes. If a shortcut has a condition, say it inside "trick".
- "why" is the important part: explain in one or two plain sentences WHY the shortcut works,
  so the student isn't lost when a question is worded differently. No hand-waving.
- Keep every field short enough to read on a phone in a few seconds.

Return ONLY valid JSON:
{{
  "title": "3-6 word name for the trick",
  "trick": "the shortcut itself, one or two lines, with a worked mini-example inline",
  "why": "one or two plain sentences on why it works",
  "try_q": "one very short question the student can try in their head",
  "try_a": "the answer to try_q, plus 3-8 words of reasoning"
}}
Strictly return ONLY the JSON object."""

    response = gen_client.models.generate_content(
        model=GEN_MODEL, contents=prompt,
        config={"response_mime_type": "application/json"},
    )
    return json.loads(response.text)


def homework_help_from_images(images_b64: list, grade: int = 6, language: str = "English",
                             mime_types: list = None):
    """Reads a homework page and, for EVERY question on it, gives a nudge first —
    then the first step, then the full working. Deliberately layered: the app
    reveals the hint before the solution, so this helps a stuck student get
    moving instead of handing over answers.

    Returns: { detected, summary, questions: [{number, question, hint, next_step,
               steps: [{label, detail}], answer}] }
    """
    prompt = f"""You are Vidya, a warm maths teacher for a CBSE Class {grade} student (age 11-14).
The student has photographed their maths homework and is stuck. Read the page carefully.

LANGUAGE for every text value: {lang_instruction(language)}

{STYLE_GUIDE}

For EVERY question you can read on the page (in the order they appear, at most 8):
- Copy the question as faithfully as you can, keeping its number from the page.
- "hint": a NUDGE that does NOT solve it — point at what to notice, what kind of problem
  it is, or which rule applies. A student reading only this should still have to think.
- "next_step": just the FIRST step, concretely, so a stuck student can get moving.
- "steps": the full working, one short step at a time.
- "answer": the final answer.

RULES:
- Never invent a question that isn't on the page. If handwriting is unreadable for an item,
  still include it with the question text you can make out and say so in the "hint".
- Solve carefully and check your arithmetic — a wrong answer here costs the student marks.
- Ignore headings, names, dates, page numbers and margin doodles.

Return ONLY valid JSON:
{{
  "detected": true if you found at least one maths question, else false,
  "summary": "one friendly sentence — e.g. how many questions you found. If none, say so kindly.",
  "questions": [
    {{
      "number": "the question number as written on the page, e.g. '3' or '(b)'",
      "question": "the question text",
      "hint": "a nudge that does not solve it",
      "next_step": "the concrete first step",
      "steps": [{{"label": "Step name", "detail": "what to do and why"}}],
      "answer": "the final answer"
    }}
  ]
}}
Strictly return ONLY the JSON object."""

    parts = [types.Part.from_text(text=prompt)]
    for i, img_b64 in enumerate(images_b64):
        mt = (mime_types[i] if mime_types and i < len(mime_types) and mime_types[i] else "image/jpeg")
        parts.append(types.Part(inline_data=types.Blob(mime_type=mt, data=base64.b64decode(img_b64))))

    response = gen_client.models.generate_content(
        model=GEN_MODEL,
        contents=types.Content(role="user", parts=parts),
        config={"response_mime_type": "application/json"},
    )
    data = json.loads(response.text)
    qs = [q for q in (data.get("questions") or []) if q.get("question")]
    data["questions"] = qs[:8]
    return data


# ─────────────────────────────────────────────────────────────
#  Chapter notes — the whole chapter, revisable in one sitting.
#
#  Coverage is driven by the SYLLABUS, not by the model's judgement:
#  the client sends the chapter's real subtopic list and we require one
#  block per subtopic, in order. Batching keeps related sections in the
#  same call (so they read as one chapter, not n disconnected summaries)
#  while staying small enough that nothing gets truncated; a repair pass
#  re-asks for any subtopic a batch dropped.
# ─────────────────────────────────────────────────────────────

_NOTES_BATCH = 4          # subtopics per LLM call
_NOTES_WORKERS = 5        # batches + the chapter-level call, in parallel


def _json_call(prompt: str):
    response = gen_client.models.generate_content(
        model=GEN_MODEL, contents=prompt,
        config={"response_mime_type": "application/json"},
    )
    return json.loads(response.text)


def _notes_context(sec_ctx: dict, subs: list):
    """NCERT text for a batch, labelled per section so the model can see which
    content belongs to which subtopic. Sections the KB has nothing for simply
    carry no text — the model still has to write their block from the syllabus
    title, which is better than dropping them."""
    blocks = []
    for s in subs:
        text = (sec_ctx or {}).get(str(s.get('num')), '')
        if text:
            blocks.append(f"--- Section {s.get('num')} {s.get('title')} ---\n{text}")
    return "\n\n".join(blocks)


def _notes_sections(topic: str, grade: int, language: str, subs: list, sec_ctx: dict):
    """One notes block per subtopic in `subs`."""
    listing = "\n".join([f"- num \"{s.get('num')}\": {s.get('title')}" for s in subs])
    context_text = _notes_context(sec_ctx, subs)

    prompt = f"""You are Vidya, a maths teacher for a CBSE Class {grade} student (age 11-14).
You are writing REVISION NOTES for the chapter "{topic}" — the notes a student reads to
revise the whole chapter, the way a good teacher's notebook would read.

Write the notes for EXACTLY these {len(subs)} sections of the chapter, in this order:
{listing}

LANGUAGE for every text value: {lang_instruction(language)}

{STYLE_GUIDE}

NCERT textbook content for these sections (base the notes on it):
\"\"\"{context_text}\"\"\"

RULES:
- Return EXACTLY {len(subs)} blocks — one for each section listed above, in that order.
  Never skip one, never merge two, never repeat one, never add a section that is not listed.
- "num" is the section number ON ITS OWN, exactly as quoted above (like "3.4"). Never put the
  title inside "num".
- These notes must be enough to revise the section WITHOUT reopening the textbook. So be
  complete: state the actual definitions, the actual rules, the actual method — do not write
  vague reminders like "learn the properties" or "practise the sums".
- "points" carry the real content. Each point is one complete, self-contained idea in a
  sentence or two — a definition, a rule with its condition, a method step, or a fact worth
  remembering. Give 3 to 5 points per section (fewer only if the section is genuinely tiny).
- "formulas" only where the section really has formulas or symbolic rules. Write them the way
  a student writes them by hand. Leave the list empty otherwise.
- "example" is one short worked sum that shows the section's main skill in action, with the
  answer. Skip it for a section that is purely a definition.
- Stay inside what this chapter actually teaches at Class {grade} level. Accuracy first.

Return ONLY valid JSON:
{{
  "sections": [
    {{
      "num": "just the section number, e.g. 3.4",
      "title": "the section title exactly as listed above",
      "summary": "one sentence: what this section is about",
      "points": ["a complete idea", "another complete idea"],
      "formulas": ["a formula as a student would write it"],
      "example": {{"q": "a short worked sum", "a": "the answer, with the key step if it helps"}}
    }}
  ]
}}
Strictly return ONLY the JSON object."""

    data = _json_call(prompt)
    return [s for s in (data.get("sections") or []) if s.get("title")]


def _notes_overview(topic: str, grade: int, language: str, chapter_id: str, subs: list):
    """The chapter-level layer that sits under the sections: what the chapter is
    about, everything worth memorising, the shortcuts, and where marks get lost."""
    listing = ", ".join([f"{s.get('num')} {s.get('title')}" for s in subs]) if subs else topic
    try:
        context = rag_service.retrieve_context(topic, grade=grade, top_k=10, chapter_id=chapter_id)
    except Exception:
        context = []
    context_text = "\n\n".join([c.get("content", "") for c in context])

    prompt = f"""You are Vidya, a maths teacher for a CBSE Class {grade} student (age 11-14).
Write the summary layer of the REVISION NOTES for the chapter "{topic}".

The chapter covers: {listing}

LANGUAGE for every text value: {lang_instruction(language)}

{STYLE_GUIDE}

NCERT context for this chapter:
\"\"\"{context_text}\"\"\"

RULES:
- "big_idea" is 2-3 short sentences: what this chapter is really about and why it matters.
  Written so a student who has forgotten the chapter is oriented again in ten seconds.
- "rules" is EVERYTHING in this chapter worth memorising — every formula, definition and
  property, across all its sections. Keep each one short enough to scan, and cover the whole
  chapter, not just its first half.
- "tricks" are real shortcuts, each with a very short reason it works. If a shortcut only
  works in certain cases, say the condition.
- "traps" are the mistakes that actually cost marks in this chapter, each with the fix.
- Only what belongs to THIS chapter, at Class {grade} level.

Return ONLY valid JSON:
{{
  "title": "the chapter name",
  "big_idea": "2-3 short sentences",
  "rules":  [{{"name": "2-5 word label", "rule": "the formula or rule, short"}}],
  "tricks": [{{"trick": "the shortcut, one line", "why": "why it works, one short phrase"}}],
  "traps":  [{{"mistake": "what students get wrong, one line", "fix": "what to do instead, one line"}}]
}}
Give 6-10 rules, 3-4 tricks and 4-5 traps. Strictly return ONLY the JSON object."""

    return _json_call(prompt)


def _norm(s):
    return " ".join(str(s or "").lower().split())


def _align_sections(subs: list, blocks: list):
    """Lay the model's blocks back onto the syllabus.

    The syllabus decides how many sections there are, their order and their
    numbering; the model only supplies each one's content. So a run that repeats a
    block, renumbers one, or invents an extra can't reach the student — it just
    leaves that subtopic's slot empty for the repair pass to fill.

    Returns: (aligned blocks in syllabus order, subtopics still without content)
    """
    used = set()
    aligned, missing = [], []

    for sub in subs:
        num, title = str(sub.get("num") or ""), _norm(sub.get("title"))
        pick = None
        # Number first (unambiguous), then title — a model that mangles "num"
        # usually still gets the title right, and vice versa.
        for want_num in (True, False):
            for i, b in enumerate(blocks):
                if i in used:
                    continue
                bn, bt = _norm(b.get("num")), _norm(b.get("title"))
                hit = (bn == _norm(num) or bn.startswith(f"{_norm(num)} ")) if want_num \
                    else (bt == title or (title and title in bt) or (bt and bt in title))
                if hit and (b.get("points") or b.get("summary")):
                    pick = b
                    used.add(i)
                    break
            if pick:
                break

        if pick:
            # Trust the syllabus for identity, the model only for content.
            pick["num"], pick["title"] = sub.get("num"), sub.get("title")
            aligned.append(pick)
        else:
            missing.append(sub)

    return aligned, missing


def generate_notes(topic: str, grade: int = 6, language: str = "English",
                   chapter_id: str = None, subtopics: list = None):
    """Full revision notes for a chapter: a block for every subtopic in the
    syllabus, plus the chapter-level rules, shortcuts and traps.

    `subtopics` is the chapter's real subtopic list ([{num, title}]) from the
    client's syllabus — it is what guarantees the notes cover the whole chapter.

    Returns: { title, big_idea, sections: [{num, title, summary, points[],
               formulas[], example{q,a}}], rules[], tricks[], traps[] }
    """
    subs = [s for s in (subtopics or []) if (s or {}).get("title")][:14]
    batches = [subs[i:i + _NOTES_BATCH] for i in range(0, len(subs), _NOTES_BATCH)]
    sec_ctx = rag_service.chapter_context_by_section(grade, chapter_id) if chapter_id else {}

    # Batches and the overview are independent — run them together so a 12-section
    # chapter costs about as much wall-clock as a 4-section one.
    with ThreadPoolExecutor(max_workers=_NOTES_WORKERS) as pool:
        overview_f = pool.submit(_notes_overview, topic, grade, language, chapter_id, subs)
        section_fs = [pool.submit(_notes_sections, topic, grade, language, b, sec_ctx) for b in batches]
        blocks = []
        for f in section_fs:
            try:
                blocks.extend(f.result())
            except Exception as e:
                print(f"Warning: notes batch failed for {chapter_id}: {e}")
        try:
            data = overview_f.result()
        except Exception as e:
            print(f"Warning: notes overview failed for {chapter_id}: {e}")
            data = {"title": topic}

    if subs:
        sections, missing = _align_sections(subs, blocks)
        # A subtopic with no notes is a hole in the revision, so re-ask for exactly
        # those — one at a time, since a batch that already failed them may fail again.
        if missing:
            print(f"Notes for {chapter_id}: repairing {len(missing)} section(s)")
            repaired = []
            with ThreadPoolExecutor(max_workers=_NOTES_WORKERS) as pool:
                for f in [pool.submit(_notes_sections, topic, grade, language, [m], sec_ctx) for m in missing]:
                    try:
                        repaired.extend(f.result())
                    except Exception as e:
                        print(f"Warning: notes repair failed for {chapter_id}: {e}")
            sections, _ = _align_sections(subs, blocks + repaired)
    else:
        sections = blocks

    data["sections"] = sections
    return data
