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

def generate_quiz(topic: str, grade: int, language: str = "English", focus_points: str = None):
    """
    Retrieves context for a topic from Firestore and generates a 5-question MCQ quiz.
    """
    
    try:
        # 1. Retrieve Context from Firestore using Vector Search
        from rag_service import retrieve_context
        
        # We retrieve the most relevant NCERT context for the topic
        context_results = retrieve_context(topic, grade=grade, top_k=5)
        relevant_context = [c['content'] for c in context_results]
        
        context_text = "\n\n".join(relevant_context)
        
        if not context_text:
            # Emergency backup if RAG search is absolutely empty
            context_text = f"The student is studying {topic} for Class {grade}."

        # Define Language instructions
        lang_instruction = f"in {language}"
        if language.lower() == "hinglish":
            lang_instruction = "in Hinglish (a mix of Hindi and English, written in Latin script, e.g., 'What is the sum of integers?')"

        # Focus Points Instruction
        focus_instruction = ""
        if focus_points:
            focus_instruction = f"\nPERSONALIZED FOCUS: {focus_points}\nPlease ensure roughly 40-50% of the questions focus on these specific struggle areas while keeping the overall quiz balanced."

        # 2. Construct Prompt for MCQ Generation
        prompt = f"""
        You are an expert Math tutor for NCERT Class {grade}. 
        Based on the following curriculum content, generate a 5-question multiple choice quiz {lang_instruction}.
        {focus_instruction}
        
        CONTENT:
        {context_text}
        
        QUIZ RULES:
        1. Each question must have exactly 4 options.
        2. Only one option must be correct.
        3. STRICT GROUNDING: Every question MUST be based directly on the provided CONTENT above. Do NOT use your own general training data if it contradicts or isn't mentioned in the text.
        4. Focus on concepts covered in the NCERT syllabus for {topic}.
        5. The 'question' field must contain ONLY the direct question text. Do NOT include any introductory or encouraging phrases like "You've got this!" or "Here is a question for you".
        
        OUTPUT FORMAT:
        You MUST return ONLY a JSON array of objects with this structure:
        [
          {{
            "id": 1,
            "question": "What is...?",
            "options": ["A", "B", "C", "D"],
            "answer": 0, // index of correct option
            "explanation": "Brief explanation why..."
          }}
        ]
        """
        
        response = client.models.generate_content(
            model="publishers/google/models/gemini-2.5-flash",
            contents=prompt,
            config={
                'response_mime_type': 'application/json'
            }
        )
        
        quiz_data = json.loads(response.text)
        return quiz_data
    except Exception as e:
        print(f"Error generating quiz: {e}")
        # Fallback to a generic quiz if generation fails
        # Returning 5 questions instead of 1 so the UI flow doesn't break
        return [
            {
                "id": i + 1,
                "question": f"Practice Question {i + 1}: What is a fundamental concept in {topic}?",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "answer": 0,
                "explanation": "Standard placeholder explanation while Vidya is catching her breath!"
            }
            for i in range(5)
        ]
