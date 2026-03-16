import os
import json
from google import genai
from database import get_db
from dotenv import load_dotenv
import datetime

load_dotenv()

# Initialize Gemini Client (with Vertex AI support)
client = genai.Client(
    vertexai=os.getenv("GOOGLE_GENAI_USE_VERTEXAI", "FALSE").upper() == "TRUE",
    project=os.getenv("GOOGLE_CLOUD_PROJECT"),
    location=os.getenv("GOOGLE_CLOUD_LOCATION")
)
db = get_db()

SYSTEM_PROMPT = """
You are Vidya, a friendly and sharp study companion for Class {grade} students.
You speak like a cool older sibling — warm, direct, never boring.
When the student is struggling, be encouraging but honest.
When they do well, celebrate genuinely but push them to go further.
Never give a lecture. Always be brief. Use examples from everyday life.
Always communicate strictly in {language}.
"""

def get_student_memory(student_id: str):
    """Retrieves the student memory graph from Firestore."""
    doc = db.collection('user_profiles').document(student_id).get()
    if doc.exists:
        return doc.to_dict().get('memory_graph', {})
    return {}

def update_student_memory(student_id: str, update_data: dict):
    """Updates the student memory graph in Firestore."""
    doc_ref = db.collection('user_profiles').document(student_id)
    doc_ref.set({'memory_graph': update_data}, merge=True)

def get_student_profile(student_id: str):
    """Retrieves basic profile info (name, grade, exam, language)."""
    doc = db.collection('user_profiles').document(student_id).get()
    if doc.exists:
        data = doc.to_dict()
        return {
            "name": data.get("name"),
            "grade": data.get("grade"),
            "exam": data.get("exam"),
            "language": data.get("language")
        }
    return None

def update_student_profile(student_id: str, profile_data: dict):
    """Saves/Updates basic student profile in Firestore."""
    doc_ref = db.collection('user_profiles').document(student_id)
    doc_ref.set(profile_data, merge=True)

def generate_daily_briefing(student_id: str, name: str, grade: int, language: str = "English"):
    """Generates a personalized 3-line morning brief for the student."""
    memory = get_student_memory(student_id)
    
    # Enrich prompt with memory
    memory_context = f"""
    STUDENT PROFILE:
    - Name: {name}
    - Grade: {grade}
    - Streak: {memory.get('streak', 0)} days
    - Weak Topics: {', '.join(memory.get('weak_topics', []))}
    - Strong Topics: {', '.join(memory.get('strong_topics', []))}
    - Recent Performance: {memory.get('last_session_notes', 'Just starting out!')}
    """

    prompt = f"""
    {SYSTEM_PROMPT.format(grade=grade, language=language)}
    
    {memory_context}
    
    TASK: Generate a punchy, personalized 3-line greeting for the student opening the app today. 
    Mention their streak and one thing they should focus on based on their performance.
    Keep it under 40 words.
    """

    try:
        response = client.models.generate_content(
            model="publishers/google/models/gemini-2.5-flash",
            contents=prompt
        )
        return response.text.strip()
    except Exception as e:
        print(f"Error generating briefing: {e}")
        return f"Hey {name.split()[0]}! Ready to crush some Math today? Let's keep that {memory.get('streak', 0)} day streak alive!"

def get_post_quiz_debrief(student_id: str, topic: str, score: int, total: int, mistakes: list, language: str = "English"):
    """Analyzes quiz performance and provides a 3-part debrief."""
    memory = get_student_memory(student_id)
    
    prompt = f"""
    {SYSTEM_PROMPT.format(grade=memory.get('grade', 6), language=language)}
    
    TOPIC: {topic}
    SCORE: {score}/{total}
    MISTAKES: {json.dumps(mistakes)}
    
    TASK: Analyze the student's performance on {topic} and provide 3 deeply helpful, concept-focused insights in a JSON object.
    
    1. "win": Highlight exactly what they understood. (e.g. "You have a solid grip on multiplying negative integers").
    2. "pattern": Reveal a hidden pattern in their mistakes. (e.g. "Almost all mistakes happened when zero was involved; you might be treating zero like a positive number").
    3. "next_step": A specific strategy to fix that pattern. (e.g. "Try sketching a number line for the next 3 problems to see zero's position").
    
    Keep it encouraging, technical, and brief. Strictly return ONLY the JSON.
    """

    try:
        response = client.models.generate_content(
            model="publishers/google/models/gemini-2.5-flash",
            contents=prompt,
            config={'response_mime_type': 'application/json'}
        )
        return json.loads(response.text.strip())
    except Exception as e:
        print(f"Error generating debrief: {e}")
        # Rich fallback to maintain UI cards
        return {
            "win": f"You finished the {topic} module!",
            "pattern": "You're consistently attempting all questions, which is the first step to mastery.",
            "next_step": "Review the 'Quick Logic' explanations for the questions you missed."
        }

def get_quiz_recommendation(student_id: str):
    """Identifies the 'Next Best Move' for a student based on memory graph."""
    memory = get_student_memory(student_id)
    profile = get_student_profile(student_id)
    grade = profile.get('grade', 6) if profile else 6
    
    weak_topics = memory.get('weak_topics', [])
    
    if weak_topics:
        # Prioritize one of the weak topics for a redemption quiz
        recommended = weak_topics[0]
        reason = "Redemption Quiz: Let's turn this weak spot into a strength!"
        focus_points = f"The student previously struggled with basics in {recommended}. Focus on fundamental conceptual errors."
    else:
        # Default to a generic next step or broad review
        recommended = "Whole Numbers" if grade == 6 else "Integers"
        reason = "Daily Challenge: Keep your skills sharp!"
        focus_points = None
        
    return {
        "topic": recommended,
        "reason": reason,
        "focus_points": focus_points
    }

def explain_mistake(question: str, user_answer: str, correct_answer: str, grade: int = 6, language: str = "English"):
    """Provides a lightning-fast, concept-focused explanation for a specific mistake."""
    prompt = f"""
    {SYSTEM_PROMPT.format(grade=grade, language=language)}
    
    QUESTION: {question}
    STUDENT SELECTED: {user_answer}
    CORRECT ANSWER: {correct_answer}
    
    TASK: In 2 short lines, explain exactly why the student's choice is wrong and how to think about it correctly.
    Be very encouraging, like a sibling. Never be mean.
    """

    try:
        response = client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=prompt
        )
        return response.text.strip()
    except Exception as e:
        return f"Chhoti si mistake! The correct answer is {correct_answer}. You'll get it next time!"

def save_quiz_attempt(student_id: str, topic: str, score: int, total: int, mistakes: list, questions: list = None):
    """Saves a detailed quiz attempt record and updates aggregate memory."""
    attempt_id = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    attempt_data = {
        "timestamp": datetime.datetime.now().isoformat(),
        "topic": topic,
        "score": score,
        "total": total,
        "mistakes": mistakes,
        "questions": questions # Storing full context for future AI analysis
    }
    
    # Store in history sub-collection
    db.collection('user_profiles').document(student_id).collection('quiz_attempts').document(attempt_id).set(attempt_data)
    
    # Update aggregate memory graph
    memory = get_student_memory(student_id)
    
    # Simple logic for now: track latest session and update topics lists
    memory['last_session_notes'] = f"Completed {topic} quiz scoring {score}/{total}."
    
    if score == total:
        strong = set(memory.get('strong_topics', []))
        strong.add(topic)
        memory['strong_topics'] = list(strong)
        # Remove from weak if it was there
        weak = set(memory.get('weak_topics', []))
        if topic in weak:
            weak.remove(topic)
            memory['weak_topics'] = list(weak)
    elif score < total / 2:
        weak = set(memory.get('weak_topics', []))
        weak.add(topic)
        memory['weak_topics'] = list(weak)

    update_student_memory(student_id, memory)
    return attempt_id

def get_quiz_history(student_id: str, limit: int = 10):
    """Retrieves the last N quiz attempts for a student."""
    attempts = db.collection('user_profiles').document(student_id).collection('quiz_attempts').order_by('timestamp', direction='DESCENDING').limit(limit).stream()
    return [a.to_dict() for a in attempts]
