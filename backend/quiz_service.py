import os
import random
import json
from google import genai
from database import get_db
from dotenv import load_dotenv

load_dotenv()

# Generation model — configurable via .env (GENAI_MODEL)
from llm_config import gen_client, GEN_MODEL, STYLE_GUIDE
from languages import lang_instruction, lang_name

# Initialize Gemini Client (with Vertex AI support)
client = genai.Client(
    vertexai=os.getenv("GOOGLE_GENAI_USE_VERTEXAI", "FALSE").upper() == "TRUE",
    project=os.getenv("GOOGLE_CLOUD_PROJECT"),
    location=os.getenv("GOOGLE_CLOUD_LOCATION")
)
db = get_db()

DIFFICULTY_INSTRUCTIONS = {
    "Easy": (
        "DIFFICULTY: Easy. "
        "Generate single-step questions testing direct recall of definitions and formulas. "
        "Distractors must be obviously different from the correct answer. "
        "A student who has read the chapter once should be able to answer all questions."
    ),
    "Medium": (
        "DIFFICULTY: Medium. "
        "Generate 2-3 step questions requiring concept application in straightforward scenarios. "
        "Include common mistakes as distractors (e.g. wrong formula, unit errors, sign errors). "
        "Matches standard NCERT textbook exercise difficulty."
    ),
    "Hard": (
        "DIFFICULTY: Hard. "
        "Generate challenging multi-step questions (4+ steps) with mixed concept application and HOTS "
        "(Higher Order Thinking Skills). Distractors must be plausible and require actual solving to eliminate. "
        "Include tricky word problems where the concept to apply is not immediately obvious."
    ),
}

# Onboarding diagnostic — placement quiz tuned to the student's goal. There is NO
# performance history at onboarding, so it adapts only to class + goal.
GOAL_FLAVOR = {
    "understand": "The student wants to UNDERSTAND CONCEPTS. Favor conceptual questions "
                  "('which statement is true?', 'why does this work?', spotting misconceptions) "
                  "over heavy computation.",
    "practice":   "The student wants more PRACTICE. Favor direct computation and application "
                  "questions they can solve step by step.",
    "tests":      "The student is PREPARING FOR TESTS. Use exam-style questions, slightly harder, "
                  "with plausible distractors and broader coverage.",
    "mixed":      "Keep a balanced mix of conceptual and computational questions for a fair placement.",
}

def generate_diagnostic(grade: int, goal: str = "mixed", language: str = "English", num: int = 10):
    """
    One-shot onboarding placement diagnostic: ~`num` MCQs spanning the key strands of
    CBSE Class {grade} maths, flavored by the student's goal. Each question is tagged
    with both an `area` (strand) and a `subtopic` (specific skill) so the result can
    map weak areas → chapters and weak subtopics → drills. Returns
    {"questions": [{area, subtopic, prompt, options[4], correct_index}]}.
    """
    flavor = GOAL_FLAVOR.get((goal or "mixed").lower(), GOAL_FLAVOR["mixed"])
    prompt = f"""You are an expert CBSE Mathematics teacher building a SHORT placement
diagnostic for a Class {grade} student (start of the year, no prior data).

{flavor}

{STYLE_GUIDE}

Write EXACTLY {num} multiple-choice questions that SAMPLE the main strands of the CBSE
Class {grade} Maths syllabus (e.g. Numbers, Fractions, Decimals, Integers, Algebra,
Geometry, Mensuration, Data Handling — choose the ones appropriate for Class {grade}).
Spread them across DIFFERENT strands (about 1-2 per strand); do not over-test one strand.
Each question must have exactly 4 options with exactly one correct answer.

IMPORTANT: For EACH question, also identify the specific SUBTOPIC it tests. For example:
- Area = "Integers", Subtopic = "Addition of Negative Numbers"
- Area = "Fractions", Subtopic = "Simplifying Fractions"
- Area = "Geometry", Subtopic = "Types of Angles"

Language: write all question text and options {lang_name(language)}. {lang_instruction(language)}

Return ONLY a valid JSON object:
{{
  "questions": [
    {{ "area": "one of the strand names above", "subtopic": "specific skill tested",
       "prompt": "the question", "options": ["A","B","C","D"], "correct_index": 0 }}
  ]
}}"""
    try:
        response = gen_client.models.generate_content(
            model=GEN_MODEL, contents=prompt,
            config={"response_mime_type": "application/json"},
        )
        data = json.loads(response.text)
        qs = data.get("questions", data if isinstance(data, list) else [])
        # keep only well-formed questions
        clean = [q for q in qs if q.get("prompt") and isinstance(q.get("options"), list)
                 and len(q["options"]) == 4 and isinstance(q.get("correct_index"), int)]
        return {"questions": clean[:num]}
    except Exception as e:
        print(f"Error in generate_diagnostic: {e}")
        return {"questions": []}

# ─────────────────────────────────────────────────────────────
#  Question formats. All-MCQ quizzes let a student guess their way to a pass,
#  and none of them ask for the WORKING. These are the objective types CBSE and
#  NCERT actually use for classes 6-8, chosen because each can be marked without
#  another model call: no latency, no grading disagreements.
# ─────────────────────────────────────────────────────────────

# The mix for one 9-question pool. MCQ still leads (it suits any content), and
# every other format appears once so a run feels varied whichever questions the
# adaptive ladder happens to serve.
POOL_MIX = [
    ("mcq", 2), ("numeric", 2), ("blank", 1),
    ("match", 1), ("order", 1), ("tf", 1), ("mistake", 1),
]

FORMAT_SPECS = """
FORMAT "mcq" — one right answer out of four.
  {"format":"mcq","question":"...","options":["a","b","c","d"],"answer":0,
   "option_notes":["why right","the mix-up behind b","...","..."]}

FORMAT "numeric" — the student TYPES the number, so nothing can be guessed.
  Only for questions with a single unambiguous numeric answer.
  {"format":"numeric","question":"...","answer":"45","unit":"cm",
   "accepted":["45.0","45 cm"]}
  "answer" is the plain number as a string, no unit inside it. "unit" is optional
  and shown next to the input. "accepted" lists other correct WRITINGS of the same
  value (a fraction as a decimal, and so on) — never a different value.

FORMAT "blank" — fill in the blank, the commonest NCERT exercise type.
  {"format":"blank","sentence":"A right angle measures ___ degrees.","answer":"90",
   "accepted":["ninety"]}
  "sentence" MUST contain exactly one gap written as ___ (three underscores).
  The answer must be one word or one number — never a phrase, because the student
  types it.

FORMAT "match" — match the two columns.
  {"format":"match","question":"Match each shape to its number of sides",
   "left":["Triangle","Square","Pentagon"],"right":["4","3","5"],"pairs":[1,0,2]}
  3 or 4 rows. "pairs[i]" is the index in "right" that matches "left[i]". Every
  left item matches a DIFFERENT right item. Keep both columns short — they sit on
  a phone screen. Put "right" in a different order from "left" so it isn't trivial.

FORMAT "order" — put the steps of a solution in the right order.
  {"format":"order","question":"Put these steps in order to solve 2x + 3 = 11",
   "steps":["Subtract 3 from both sides","Write 2x = 8","Divide both sides by 2","Write x = 4"]}
  "steps" MUST be listed in the CORRECT order — the app shuffles them for the
  student. 3 or 4 steps, each one short. Use this for a method worth remembering.

FORMAT "tf" — true or false, and then WHY, so a coin-flip cannot score.
  {"format":"tf","statement":"Every square is a rectangle.","is_true":true,
   "reasons":["All its angles are right angles","Its sides are all equal"],
   "correct_reason":0}
  2 or 3 reasons. Exactly one is the real reason for the verdict; the others must
  be tempting but wrong — a true fact that doesn't explain the verdict is ideal.

FORMAT "mistake" — a solved sum with ONE wrong step, for the student to find.
  {"format":"mistake","question":"Find the step where this goes wrong",
   "steps":["1/2 + 1/3","= (1+1)/(2+3)","= 2/5"],"wrong_step":1,
   "fix":"Take the LCM: 3/6 + 2/6 = 5/6"}
  "wrong_step" is the index of the FIRST wrong step. "fix" says what should have
  happened. Base it on a mistake students really make in this chapter.
"""


def _valid_item(it) -> bool:
    """Reject anything a student could not fairly answer.

    The client validates too (src/lib/quizFormats.ts) — this pass exists so a
    thin pool can be topped up here, while the model's mistake is still cheap to
    fix, instead of the student meeting a short quiz.
    """
    if not isinstance(it, dict):
        return False
    fmt = it.get("format", "mcq")
    txt = lambda v: isinstance(v, str) and v.strip()
    lst = lambda v, lo, hi: isinstance(v, list) and lo <= len(v) <= hi and all(txt(x) for x in v)
    inrange = lambda v, n: isinstance(v, int) and not isinstance(v, bool) and 0 <= v < n

    if fmt == "mcq":
        return lst(it.get("options"), 2, 4) and inrange(it.get("answer"), len(it["options"])) and txt(it.get("question"))
    if fmt == "numeric":
        return txt(it.get("question")) and txt(str(it.get("answer", "")))
    if fmt == "blank":
        return txt(it.get("sentence")) and "___" in it["sentence"] and txt(str(it.get("answer", "")))
    if fmt == "match":
        left, right, pairs = it.get("left"), it.get("right"), it.get("pairs")
        if not (lst(left, 3, 4) and lst(right, 3, 4) and isinstance(pairs, list)):
            return False
        if len(pairs) != len(left) or len(set(pairs)) != len(pairs):
            return False
        return all(inrange(p, len(right)) for p in pairs)
    if fmt == "order":
        return lst(it.get("steps"), 3, 5) and txt(it.get("question"))
    if fmt == "tf":
        reasons = it.get("reasons")
        return (txt(it.get("statement")) and lst(reasons, 2, 4)
                and isinstance(it.get("is_true"), bool) and inrange(it.get("correct_reason"), len(reasons)))
    if fmt == "mistake":
        steps = it.get("steps")
        return lst(steps, 2, 5) and inrange(it.get("wrong_step"), len(steps)) and txt(it.get("fix"))
    return False


def generate_quiz(topics: list, grade: int, language: str = "English", focus_points: str = None, difficulty: str = "Medium", chapter_id: str = None, section: str = None):
    """
    Retrieves context for one or more topics and generates a mixed-format question
    POOL for the adaptive quiz — MCQ plus the other CBSE/NCERT objective types
    (see POOL_MIX). When chapter_id/section are given, retrieval is scoped to that
    exact subtopic.
    """
    topics_str = ", ".join(topics)

    try:
        from rag_service import retrieve_context

        all_context = []
        if chapter_id:
            # Subtopic/chapter-scoped: one filtered retrieval
            results = retrieve_context(topics_str, grade=grade, top_k=6, chapter_id=chapter_id, section=section)
            all_context.extend([c['content'] for c in results])
        else:
            # Retrieve context for each topic separately and merge (cap at 4 topics)
            for t in topics[:4]:
                results = retrieve_context(t, grade=grade, top_k=3)
                all_context.extend([c['content'] for c in results])

        context_text = "\n\n".join(all_context)
        if not context_text:
            context_text = f"The student is studying {topics_str} for Class {grade}."

        lang_directive = f"in {lang_name(language)}. {lang_instruction(language)}"

        focus_instruction = ""
        if focus_points:
            focus_instruction = f"\nPERSONALIZED FOCUS: {focus_points}\nEnsure roughly 40-50% of questions target these struggle areas."

        difficulty_instruction = DIFFICULTY_INSTRUCTIONS.get(difficulty, DIFFICULTY_INSTRUCTIONS["Medium"])

        # Distribute questions across chapters when multiple topics
        distribution_note = (
            f"Distribute the questions proportionally across all {len(topics)} chapters: {topics_str}."
            if len(topics) > 1 else ""
        )

        mix_note = ", ".join([f'{n} of format "{f}"' for f, n in POOL_MIX])
        total = sum(n for _, n in POOL_MIX)

        prompt = f"""
        You are an expert Math teacher for NCERT Class {grade}.
        Generate a {total}-question POOL {lang_directive} STRICTLY about the topic(s): {topics_str}.
        The pool feeds an adaptive quiz: exactly 3 questions with "difficulty": "easy",
        3 with "difficulty": "medium", and 3 with "difficulty": "hard".

        {STYLE_GUIDE}

        {focus_instruction}
        {difficulty_instruction}
        (The instruction above sets the overall tone; still produce the 3/3/3 easy/medium/hard split relative to it.)
        {distribution_note}

        REFERENCE MATERIAL (use ONLY if it is actually about {topics_str}; if it is about a
        different chapter, IGNORE it completely and use the standard NCERT Class {grade}
        syllabus for {topics_str} instead):
        {context_text}

        QUESTION FORMATS — the pool must contain exactly: {mix_note}.
        Spread the formats across the three difficulties; do NOT put every MCQ at "easy".
        If a format genuinely cannot be written for this topic, use "mcq" for that slot
        instead of forcing something artificial — but try each format first.
        {FORMAT_SPECS}

        QUIZ RULES:
        1. Every single question MUST be about {topics_str}. Never produce a question about an unrelated chapter, even if the reference material above is about something else.
        2. Every question needs "format", "topic", "difficulty", "explanation" and "hint", plus the fields its format requires.
        3. The 'question' field must contain ONLY the direct question text. No encouraging phrases.
        4. The 'topic' field must be EXACTLY one of these strings (verbatim, pick the one the question tests): {json.dumps(topics)}
        5. 'hint' is ONE short strategy nudge (what to think about / first step) — it must NEVER reveal or contain the answer.
        6. 'explanation' explains the right answer in one or two short sentences, for AFTER the student answers.
        7. For "mcq" only: 'option_notes' has one short string per option — for the correct one a line confirming why it's right; for each wrong one, the SPECIFIC mix-up a student who picks it made (e.g. "You added the denominators too — they tell the slice size, they don't add.").
        8. A question the student must TYPE (numeric, blank) must have exactly one correct writing of the answer, plus any other spellings/forms in "accepted". Never make a typed answer a whole sentence.

        Return ONLY a JSON array of question objects, each shaped as its format above,
        with "topic", "difficulty", "explanation" and "hint" added.
        """

        response = gen_client.models.generate_content(
            model=GEN_MODEL,
            contents=prompt,
            config={'response_mime_type': 'application/json'}
        )

        items = json.loads(response.text)
        if not isinstance(items, list):
            items = items.get("questions") if isinstance(items, dict) else None
            items = items if isinstance(items, list) else []

        good = [it for it in items if _valid_item(it)]
        dropped = len(items) - len(good)
        if dropped:
            print(f"Quiz pool: dropped {dropped} malformed question(s) of {len(items)}")

        # A pool this thin would end the quiz before the student can win it, so
        # top up with the format that always works rather than ship it short.
        if len(good) < 6:
            print(f"Quiz pool: only {len(good)} valid, topping up with MCQs")
            try:
                top_up = gen_client.models.generate_content(
                    model=GEN_MODEL,
                    contents=f"""You are an expert Math teacher for NCERT Class {grade}.
                    Generate 6 multiple-choice questions {lang_directive} STRICTLY about: {topics_str}.
                    Two each of "difficulty": "easy", "medium", "hard".
                    {STYLE_GUIDE}
                    Reference material (ignore if it is about a different chapter):
                    {context_text}
                    Each question: exactly 4 options, exactly one correct.
                    'topic' must be verbatim one of {json.dumps(topics)}.
                    'hint' is a strategy nudge that never reveals the answer.
                    Return ONLY a JSON array of:
                    {{"format":"mcq","topic":"...","difficulty":"easy","question":"...",
                      "options":["a","b","c","d"],"answer":0,"explanation":"...","hint":"...",
                      "option_notes":["why right","mix-up","mix-up","mix-up"]}}""",
                    config={'response_mime_type': 'application/json'},
                )
                extra = json.loads(top_up.text)
                if isinstance(extra, list):
                    good.extend([it for it in extra if _valid_item(it)])
            except Exception as e:
                print(f"Quiz pool top-up failed: {e}")

        for i, it in enumerate(good):
            it["id"] = i + 1
            it.setdefault("format", "mcq")
        return good
    except Exception as e:
        print(f"Error generating quiz: {e}")
        return [
            {
                "id": i + 1,
                "question": f"Practice Question {i + 1}: What is a fundamental concept in {topics_str}?",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "answer": 0,
                "explanation": "Standard placeholder explanation while Vidya is catching her breath!"
            }
            for i in range(5)
        ]

def generate_paper(topics: list, grade: int, total_marks: int = 40, language: str = "English", difficulty: str = "Medium", chapter_id: str = None, section: str = None):
    """
    Generates a CBSE-style exam paper with sections A, B, C, D.
    40 marks: A(10×1), B(5×2), C(4×3), D(2×4)
    80 marks: A(20×1), B(10×2), C(8×3), D(4×4)
    When chapter_id/section are given, the paper is scoped to that exact subtopic.
    """
    topics_str = ", ".join(topics)

    scope_block = ""
    if chapter_id:
        try:
            from rag_service import retrieve_context
            ctx = retrieve_context(topics_str, grade=grade, top_k=6, chapter_id=chapter_id, section=section)
            ctx_text = "\n\n".join([c["content"] for c in ctx])
        except Exception:
            ctx_text = ""
        focus = f"ONLY about the subtopic \"{topics_str}\"" if section else f"ONLY about the chapter \"{topics_str}\""
        scope_block = (f"\nSCOPE: Every question must be {focus}. Do not include other topics.\n"
                       + (f"\nREFERENCE MATERIAL (from NCERT, use it):\n\"\"\"{ctx_text}\"\"\"\n" if ctx_text else ""))

    if total_marks == 80:
        sections_spec = [
            {"name": "A", "marks_per_q": 1, "count": 20, "type": "Very Short Answer (MCQ / Fill in the blank / True-False)"},
            {"name": "B", "marks_per_q": 2, "count": 10, "type": "Short Answer (direct computation, 1-2 steps)"},
            {"name": "C", "marks_per_q": 3, "count": 8,  "type": "Short Answer (show working, 2-3 steps)"},
            {"name": "D", "marks_per_q": 4, "count": 4,  "type": "Long Answer (word problems or proof-based)"},
        ]
    else:  # 40 marks
        sections_spec = [
            {"name": "A", "marks_per_q": 1, "count": 10, "type": "Very Short Answer (MCQ / Fill in the blank / True-False)"},
            {"name": "B", "marks_per_q": 2, "count": 5,  "type": "Short Answer (direct computation, 1-2 steps)"},
            {"name": "C", "marks_per_q": 3, "count": 4,  "type": "Short Answer (show working, 2-3 steps)"},
            {"name": "D", "marks_per_q": 4, "count": 2,  "type": "Long Answer (word problems)"},
        ]

    sections_desc = "\n".join([
        f"Section {s['name']}: {s['count']} questions × {s['marks_per_q']} mark(s) = {s['count']*s['marks_per_q']} marks | Type: {s['type']}"
        for s in sections_spec
    ])

    difficulty_instruction = DIFFICULTY_INSTRUCTIONS.get(difficulty, DIFFICULTY_INSTRUCTIONS["Medium"])

    prompt = f"""
You are an expert CBSE Mathematics teacher for Class {grade}.
Generate a complete school exam paper based on these chapters: {topics_str}.
{scope_block}
{STYLE_GUIDE}

PAPER STRUCTURE (Total: {total_marks} marks):
{sections_desc}

{difficulty_instruction}

RULES:
1. Questions must be based ONLY on NCERT Class {grade} Maths syllabus for the given topics.
2. Section A: Mix of MCQ (give 4 options with correct_option index 0-3), Fill in the blank, and True/False questions.
3. Sections B, C, D: Written questions requiring working. No options needed.
4. Distribute questions across the selected chapters: {topics_str}
5. Language: write all question text {lang_name(language)}. {lang_instruction(language)}
6. Questions should match typical school exam difficulty — not too easy, not JEE level.
7. EVERY question object must include a "topic" field whose value is EXACTLY one of these strings (verbatim, the topic that question tests): {json.dumps(topics)}

Return ONLY a valid JSON object with this exact structure:
{{
  "sections": [
    {{
      "name": "A",
      "marks_per_q": 1,
      "instructions": "Choose the correct answer / Fill in the blank / State True or False.",
      "questions": [
        {{
          "number": 1,
          "topic": "one of the given topic strings, verbatim",
          "text": "Question text here",
          "type": "mcq",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correct_option": 0
        }},
        {{
          "number": 2,
          "text": "The value of ___ + 5 = 12",
          "type": "fill"
        }},
        {{
          "number": 3,
          "text": "Every whole number is a natural number. (True/False)",
          "type": "truefalse"
        }}
      ]
    }},
    {{
      "name": "B",
      "marks_per_q": 2,
      "instructions": "Answer the following questions. Show your work.",
      "questions": [
        {{
          "number": 11,
          "text": "Question text here",
          "type": "short"
        }}
      ]
    }}
  ]
}}
"""

    response = gen_client.models.generate_content(
        model=GEN_MODEL,
        contents=prompt,
        config={"response_mime_type": "application/json"}
    )

    return json.loads(response.text)
