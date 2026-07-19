import json
import base64
from google.genai import types
from llm_config import gen_client, GEN_MODEL, STYLE_GUIDE
import rag_service
from languages import lang_instruction


def generate_viva_questions(topics: list, grade: int = 6, language: str = "English", num: int = 3):
    """Generates open-ended 'explain it out loud' viva questions for the given
    chapter topics, each with the key points a good answer should contain."""
    query = ", ".join(topics) if topics else "mathematics"
    try:
        context = rag_service.retrieve_context(query, grade=grade, top_k=5)
    except Exception:
        context = []
    context_text = "\n\n".join([c.get("content", "") for c in context]) if context else ""

    prompt = f"""You are Vidya, a warm maths teacher running a friendly viva (oral exam)
with a CBSE Class {grade} student (age 11-14). Chapters to cover: {query}.

LANGUAGE for every text value: {lang_instruction(language)}

{STYLE_GUIDE}

Ground the maths in this NCERT context if relevant (ignore if unrelated):
\"\"\"{context_text}\"\"\"

Create exactly {num} SPOKEN-answer questions. Rules:
- Each must be answerable OUT LOUD in 30-60 seconds by talking — no written working,
  no long calculations. Think "explain to a friend", "what would you tell...", "why does ___ work".
- Simple, warm wording an 11-year-old instantly understands.
- Spread across the given chapters; each question tests understanding, not memory of definitions.

Return ONLY valid JSON:
{{
  "questions": [
    {{
      "question": "the spoken question, addressed directly to the student",
      "chapter": "EXACTLY one of these chapter names, verbatim: {json.dumps(topics)}",
      "listen_for": ["key point 1 a good answer mentions", "key point 2", "key point 3"]
    }}
  ]
}}
Strictly return ONLY the JSON object."""

    response = gen_client.models.generate_content(
        model=GEN_MODEL,
        contents=prompt,
        config={"response_mime_type": "application/json"},
    )
    return json.loads(response.text)


def evaluate_viva_answer(audio_b64: str, mime_type: str, question: str,
                         listen_for: list, grade: int = 6, language: str = "English"):
    """Listens to the student's spoken answer and evaluates it kindly:
    what they explained well, what they missed, one tip, and 1-3 stars."""
    points = "\n".join(f"- {p}" for p in (listen_for or []))
    prompt = f"""You are Vidya, a warm maths teacher listening to a CBSE Class {grade}
student (age 11-14) answer a viva question OUT LOUD. Be kind, specific and encouraging —
never harsh. The student may mix Hindi and English while speaking; that is completely fine.

LANGUAGE for every text value in your response: {lang_instruction(language)}

THE QUESTION ASKED: "{question}"

A good answer usually mentions:
{points if points else "- (use your judgement)"}

Listen to the attached recording of the student's answer, then return ONLY valid JSON:
{{
  "heard": "one short line summarising what the student said, in friendly words ('You said that...')",
  "good": ["specific thing they explained well (max 2 items; empty list if truly nothing)"],
  "missing": ["specific point they missed or got mixed up (max 2 items; empty if none)"],
  "tip": "ONE friendly, concrete tip to make their explanation stronger next time",
  "stars": 1, 2 or 3  (3 = clear and mostly complete, 2 = on the right track, 1 = needs another look — be generous with effort)
}}
If the recording is silent or unrelated to maths, say so kindly in "heard", give stars: 1,
and make the tip an invitation to try answering again.
Strictly return ONLY the JSON object."""

    audio_bytes = base64.b64decode(audio_b64)
    parts = [
        types.Part.from_text(prompt),
        types.Part(inline_data=types.Blob(mime_type=mime_type or "audio/webm", data=audio_bytes)),
    ]
    response = gen_client.models.generate_content(
        model=GEN_MODEL,
        contents=types.Content(role="user", parts=parts),
        config={"response_mime_type": "application/json"},
    )
    return json.loads(response.text)
