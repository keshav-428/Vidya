import os
import json
import base64
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(
    vertexai=os.getenv("GOOGLE_GENAI_USE_VERTEXAI", "FALSE").upper() == "TRUE",
    project=os.getenv("GOOGLE_CLOUD_PROJECT"),
    location=os.getenv("GOOGLE_CLOUD_LOCATION")
)

def grade_paper_from_images(images_b64: list, paper: dict, grade: int, total_marks: int, language: str = "English"):
    """
    Grades a handwritten answer sheet from one or more images.
    Uses Gemini Vision to analyse each question like a CBSE teacher.
    """

    # Build a concise paper summary so the model knows exactly what to look for
    paper_summary_lines = []
    q_number = 1
    for section in paper.get("sections", []):
        for q in section.get("questions", []):
            line = f"Q{q['number']} (Section {section['name']}, {section['marks_per_q']} mark{'s' if section['marks_per_q'] > 1 else ''}): {q['text']}"
            if q.get("type") == "mcq" and q.get("options"):
                opts = ", ".join([f"({chr(97+i)}) {o}" for i, o in enumerate(q["options"])])
                line += f"  Options: {opts}  Correct: ({chr(97 + q['correct_option'])})" if "correct_option" in q else f"  Options: {opts}"
            paper_summary_lines.append(line)
            q_number += 1

    paper_summary = "\n".join(paper_summary_lines)

    prompt = f"""You are an experienced CBSE Mathematics teacher for Class {grade}.
A student has solved this exam paper on paper and uploaded photos of their answer sheet.

EXAM PAPER (Total: {total_marks} marks):
{paper_summary}

YOUR TASK:
Go through the answer sheet images carefully. For each question:
1. Find the student's answer (look for the question number written by the student)
2. Check their method step by step — award partial marks for correct working even if the final answer is wrong
3. For Section A (MCQ / fill / true-false): full marks or zero only
4. For Sections B, C, D: use partial marking generously — reward correct concepts and approach

GRADING RUBRIC:
- "correct": full marks — right answer, right method
- "partial": partial marks — right method/concept, small error (e.g. arithmetic slip, incomplete steps)
- "incorrect": zero — wrong method or completely wrong
- "blank": zero — no attempt found

Return ONLY a valid JSON object with this exact structure:
{{
  "total_awarded": <number>,
  "total_possible": {total_marks},
  "percentage": <number>,
  "sections": [
    {{
      "name": "A",
      "marks_awarded": <number>,
      "marks_possible": <number>,
      "questions": [
        {{
          "number": 1,
          "marks_awarded": <number>,
          "marks_possible": <number>,
          "status": "correct",
          "student_answer": "<brief description of what the student wrote>",
          "feedback": "<one encouraging line — what they got right or where they went wrong>",
          "model_answer": "<the correct answer or key step>"
        }}
      ]
    }}
  ],
  "overall_feedback": "<2-3 sentence teacher-style summary of performance>",
  "strong_areas": ["<topic or skill>"],
  "improvement_areas": ["<topic or skill>"]
}}"""

    # Build multimodal content: text prompt + all images
    parts = [types.Part.from_text(prompt)]
    for img_b64 in images_b64:
        image_bytes = base64.b64decode(img_b64)
        parts.append(types.Part(
            inline_data=types.Blob(mime_type="image/jpeg", data=image_bytes)
        ))

    response = client.models.generate_content(
        model="publishers/google/models/gemini-2.5-flash",
        contents=types.Content(role="user", parts=parts),
        config={"response_mime_type": "application/json"}
    )

    return json.loads(response.text)
