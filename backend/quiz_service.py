import os
import random
import json
from google import genai
from database import get_db
from dotenv import load_dotenv

load_dotenv()

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

def generate_quiz(topics: list, grade: int, language: str = "English", focus_points: str = None, difficulty: str = "Medium"):
    """
    Retrieves context for one or more topics and generates a 5-question MCQ quiz.
    """
    topics_str = ", ".join(topics)

    try:
        from rag_service import retrieve_context

        # Retrieve context for each topic separately and merge (cap at 4 topics)
        all_context = []
        for t in topics[:4]:
            results = retrieve_context(t, grade=grade, top_k=3)
            all_context.extend([c['content'] for c in results])

        context_text = "\n\n".join(all_context)
        if not context_text:
            context_text = f"The student is studying {topics_str} for Class {grade}."

        lang_instruction = f"in {language}"
        if language.lower() == "hinglish":
            lang_instruction = "in Hinglish (a mix of Hindi and English, written in Latin script)"

        focus_instruction = ""
        if focus_points:
            focus_instruction = f"\nPERSONALIZED FOCUS: {focus_points}\nEnsure roughly 40-50% of questions target these struggle areas."

        difficulty_instruction = DIFFICULTY_INSTRUCTIONS.get(difficulty, DIFFICULTY_INSTRUCTIONS["Medium"])

        # Distribute questions across chapters when multiple topics
        distribution_note = (
            f"Distribute the 5 questions proportionally across all {len(topics)} chapters: {topics_str}."
            if len(topics) > 1 else ""
        )

        prompt = f"""
        You are an expert Math tutor for NCERT Class {grade}.
        Based on the following curriculum content, generate a 5-question multiple choice quiz {lang_instruction}.
        {focus_instruction}
        {difficulty_instruction}
        {distribution_note}

        CONTENT:
        {context_text}

        QUIZ RULES:
        1. Each question must have exactly 4 options.
        2. Only one option must be correct.
        3. STRICT GROUNDING: Every question MUST be based directly on the provided CONTENT above.
        4. Focus on concepts covered in the NCERT syllabus for: {topics_str}.
        5. The 'question' field must contain ONLY the direct question text. No encouraging phrases.

        OUTPUT FORMAT:
        You MUST return ONLY a JSON array of objects with this structure:
        [
          {{
            "id": 1,
            "question": "What is...?",
            "options": ["A", "B", "C", "D"],
            "answer": 0,
            "explanation": "Brief explanation why..."
          }}
        ]
        """

        response = client.models.generate_content(
            model="publishers/google/models/gemini-2.5-flash",
            contents=prompt,
            config={'response_mime_type': 'application/json'}
        )

        return json.loads(response.text)
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

def generate_paper(topics: list, grade: int, total_marks: int = 40, language: str = "English", difficulty: str = "Medium"):
    """
    Generates a CBSE-style exam paper with sections A, B, C, D.
    40 marks: A(10×1), B(5×2), C(4×3), D(2×4)
    80 marks: A(20×1), B(10×2), C(8×3), D(4×4)
    """
    topics_str = ", ".join(topics)

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

PAPER STRUCTURE (Total: {total_marks} marks):
{sections_desc}

{difficulty_instruction}

RULES:
1. Questions must be based ONLY on NCERT Class {grade} Maths syllabus for the given topics.
2. Section A: Mix of MCQ (give 4 options with correct_option index 0-3), Fill in the blank, and True/False questions.
3. Sections B, C, D: Written questions requiring working. No options needed.
4. Distribute questions across the selected chapters: {topics_str}
5. Language: {language}
6. Questions should match typical school exam difficulty — not too easy, not JEE level.

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

    response = client.models.generate_content(
        model="publishers/google/models/gemini-2.5-flash",
        contents=prompt,
        config={"response_mime_type": "application/json"}
    )

    return json.loads(response.text)
