import json
import base64
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
                    sections: list = None, section_titles: list = None):
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
    # One session covering several subtopics needs at least one example each.
    covered = [t for t in (section_titles or []) if t]
    if multi and covered:
        n_examples = max(n_examples, min(len(covered), 5))
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

{coverage_rule}
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


def identify_concept_from_images(images_b64: list, grade: int = 6, language: str = "English"):
    """Looks at one or more photos (e.g. a page of class notes, a textbook page,
    a whiteboard snap) and identifies the single core Maths concept the student
    just learned. Returns a clean topic title that can be fed straight into
    generate_concept() to build a full lesson.

    Returns: { "topic": str, "summary": str, "detected": bool }
    """
    prompt = f"""You are a CBSE Class {grade} Mathematics teacher.
A student has uploaded photo(s) of something they just studied in class — this could be
handwritten notes, a textbook page, a worksheet, a whiteboard, or a problem they wrote down.

LANGUAGE for the "summary" field: {lang_instruction(language)}

Your job: identify the SINGLE most important Mathematics concept/topic shown, so we can
build a focused lesson on it. Ignore page numbers, names, dates, and decorations.

Return ONLY valid JSON with EXACTLY this structure:
{{
  "detected": true if you can clearly identify a maths concept, false if the image has no identifiable maths topic,
  "topic": "a short, specific concept title (3-6 words) in English, e.g. 'Multiplying Fractions' or 'Linear Equations in One Variable'. Empty string if detected is false.",
  "summary": "one friendly sentence telling the student what you spotted, in the LANGUAGE above. If not detected, briefly say you couldn't find a maths topic."
}}

Prefer the most specific NCERT-style topic name. Strictly return ONLY the JSON object."""

    # Build multimodal content: text prompt + all images
    parts = [types.Part.from_text(prompt)]
    for img_b64 in images_b64:
        image_bytes = base64.b64decode(img_b64)
        parts.append(types.Part(
            inline_data=types.Blob(mime_type="image/jpeg", data=image_bytes)
        ))

    response = gen_client.models.generate_content(
        model=GEN_MODEL,
        contents=types.Content(role="user", parts=parts),
        config={"response_mime_type": "application/json"},
    )
    return json.loads(response.text)
