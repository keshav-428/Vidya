import json
from llm_config import gen_client, GEN_MODEL, STYLE_GUIDE
import rag_service


def generate_concept(topic: str, grade: int = 6, language: str = "English"):
    """Generates a concept lesson (definition + mistakes + examples) for any topic,
    grounded in the NCERT knowledge base when relevant context is found."""
    try:
        context = rag_service.retrieve_context(topic, grade=grade, top_k=5)
    except Exception:
        context = []
    context_text = "\n\n".join([c.get("content", "") for c in context]) if context else ""

    prompt = f"""You are a CBSE Class {grade} Mathematics teacher creating a bite-sized lesson
for the topic "{topic}", written in {language} for a phone screen.

{STYLE_GUIDE}

Use this NCERT textbook context if relevant (ignore if unrelated):
\"\"\"{context_text}\"\"\"

Return ONLY valid JSON with EXACTLY this structure:
{{
  "definition": "2 short paragraphs in plain, friendly English explaining {topic}. Separate paragraphs with \\n\\n.",
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
