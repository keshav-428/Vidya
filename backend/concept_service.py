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
