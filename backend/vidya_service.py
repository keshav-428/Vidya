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

def compute_streak(student_id: str) -> int:
    """Computes the current streak from actual quiz attempt dates."""
    attempts = db.collection('user_profiles').document(student_id).collection('quiz_attempts') \
        .order_by('timestamp', direction='DESCENDING').limit(30).stream()
    dates = set()
    for a in attempts:
        ts = a.to_dict().get('timestamp', '')
        if ts:
            try:
                dates.add(datetime.datetime.fromisoformat(ts).date())
            except Exception:
                pass
    if not dates:
        return 0
    streak = 0
    day = datetime.datetime.now().date()
    while day in dates:
        streak += 1
        day -= datetime.timedelta(days=1)
    return streak

def generate_daily_briefing(student_id: str, name: str, grade: int, language: str = "English"):
    """Generates a personalized 3-line morning brief for the student."""
    memory = get_student_memory(student_id)
    streak = compute_streak(student_id)

    memory_context = f"""
    STUDENT PROFILE:
    - Name: {name}
    - Grade: {grade}
    - Weak Topics: {', '.join(memory.get('weak_topics', []))}
    - Strong Topics: {', '.join(memory.get('strong_topics', []))}
    - Recent Performance: {memory.get('last_session_notes', 'Just starting out!')}
    """

    prompt = f"""
    {SYSTEM_PROMPT.format(grade=grade, language=language)}

    {memory_context}

    TASK: Generate a punchy, personalized 2-line greeting for the student opening the app today.
    Focus on one topic they should work on. Do NOT mention streaks or scores.
    Keep it under 30 words.
    """

    try:
        response = client.models.generate_content(
            model="publishers/google/models/gemini-2.5-flash",
            contents=prompt
        )
        return response.text.strip()
    except Exception as e:
        print(f"Error generating briefing: {e}")
        return f"Hey {name.split()[0]}! Ready to practice today? Pick a topic and let's go!"

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
            model="publishers/google/models/gemini-2.5-flash",
            contents=prompt
        )
        return response.text.strip()
    except Exception as e:
        return f"The correct answer is {correct_answer}. Review the concept and try again!"

def get_real_world_uses(topic: str, grade: int = 6):
    """Returns 3 hyper-specific real-world uses of a math concept for a student's grade."""
    age = grade + 6  # Class 6 → ~12 years old

    prompt = f"""
You are explaining to a {age}-year-old Indian student (Class {grade}) where "{topic}" shows up in their actual daily life.

Generate exactly 3 real-world examples. Each must be:
- Hyper-specific and relatable to a {age}-year-old in India (think: cricket, Zomato, UPI, Instagram, phone storage, pocket money, shopping, IPL, reels, gaming)
- NOT generic textbook examples like "used in cooking" or "used in engineering"
- A short punchy title (3-5 words) and a 1-sentence explanation showing the exact connection

Return ONLY a JSON array of 3 objects:
[
  {{"title": "...", "example": "...", "emoji": "..."}},
  {{"title": "...", "example": "...", "emoji": "..."}},
  {{"title": "...", "example": "...", "emoji": "..."}}
]
"""
    try:
        response = client.models.generate_content(
            model="publishers/google/models/gemini-2.5-flash",
            contents=prompt,
            config={'response_mime_type': 'application/json'}
        )
        return json.loads(response.text.strip())
    except Exception as e:
        print(f"Error in get_real_world_uses: {e}")
        return [
            {"title": "Splitting a bill", "example": f"{topic} helps you divide restaurant bills equally among friends.", "emoji": "🍕"},
            {"title": "Phone storage", "example": f"When your phone shows 3.5 GB free out of 8 GB, that's {topic} in action.", "emoji": "📱"},
            {"title": "Cricket scorecard", "example": f"Strike rates and run rates in cricket use {topic} every match.", "emoji": "🏏"},
        ]

def log_activity(student_id: str, event_type: str, data: dict = {}):
    """Logs a single user activity event to Firestore."""
    event_id = datetime.datetime.now().strftime("%Y%m%d_%H%M%S_%f")
    db.collection('user_profiles').document(student_id).collection('activity_log').document(event_id).set({
        "type": event_type,
        "timestamp": datetime.datetime.now().isoformat(),
        "data": data
    })

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

def get_report_data(student_id: str):
    """Aggregates all quiz history into a parent-friendly progress report."""
    profile = get_student_profile(student_id)
    if not profile:
        return None

    memory = get_student_memory(student_id)

    # Fetch all attempts (no limit)
    all_attempts = [
        a.to_dict() for a in
        db.collection('user_profiles').document(student_id)
          .collection('quiz_attempts')
          .order_by('timestamp', direction='DESCENDING')
          .stream()
    ]

    # Quizzes this week
    now = datetime.datetime.now()
    week_start = now - datetime.timedelta(days=7)
    quizzes_this_week = 0
    for attempt in all_attempts:
        try:
            ts = datetime.datetime.fromisoformat(attempt['timestamp'])
            if ts >= week_start:
                quizzes_this_week += 1
        except Exception:
            pass

    # Overall avg
    total_quizzes = len(all_attempts)
    valid = [a for a in all_attempts if a.get('total', 0) > 0]
    overall_avg_pct = round(sum(a['score'] / a['total'] * 100 for a in valid) / len(valid)) if valid else 0

    # Per-topic breakdown
    topic_map = {}
    for attempt in all_attempts:
        topic = attempt.get('topic', 'Unknown')
        pct = round(attempt['score'] / attempt['total'] * 100) if attempt.get('total', 0) > 0 else 0
        if topic not in topic_map:
            topic_map[topic] = {'attempts': 0, 'total_pct': 0, 'best_pct': 0}
        topic_map[topic]['attempts'] += 1
        topic_map[topic]['total_pct'] += pct
        topic_map[topic]['best_pct'] = max(topic_map[topic]['best_pct'], pct)

    topics = []
    for topic, data in topic_map.items():
        avg_pct = round(data['total_pct'] / data['attempts'])
        status = 'strong' if avg_pct >= 80 else ('improving' if avg_pct >= 50 else 'needs_work')
        topics.append({
            'name': topic,
            'attempts': data['attempts'],
            'avg_pct': avg_pct,
            'best_pct': data['best_pct'],
            'status': status
        })
    topics.sort(key=lambda x: x['attempts'], reverse=True)

    # Recent 5
    recent = []
    for attempt in all_attempts[:5]:
        pct = round(attempt['score'] / attempt['total'] * 100) if attempt.get('total', 0) > 0 else 0
        recent.append({
            'topic': attempt.get('topic', ''),
            'score': attempt.get('score', 0),
            'total': attempt.get('total', 0),
            'pct': pct,
            'date': attempt.get('timestamp', '')[:10]
        })

    return {
        'student': {
            'name': profile.get('name', 'Student'),
            'grade': profile.get('grade', ''),
            'exam': profile.get('exam', 'CBSE Mathematics')
        },
        'summary': {
            'total_quizzes': total_quizzes,
            'quizzes_this_week': quizzes_this_week,
            'overall_avg_pct': overall_avg_pct,
            'streak': compute_streak(student_id),
            'estimated_time_min': total_quizzes * 10,
            'strong_topics': memory.get('strong_topics', []),
            'weak_topics': memory.get('weak_topics', [])
        },
        'topics': topics,
        'recent': recent,
        'generated_at': now.strftime('%d %b %Y, %I:%M %p')
    }
