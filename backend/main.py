from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from database import get_db
import rag_service
import quiz_service
import vidya_service
import exam_service
import concept_service
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI(title="Vidya Backend API", version="1.0.0")

# CORS — set ALLOWED_ORIGINS (comma-separated) in production to your frontend
# domain, e.g. "https://vidya.vercel.app". Defaults to "*" for local dev.
_origins = os.getenv("ALLOWED_ORIGINS", "*")
allow_origins = ["*"] if _origins.strip() == "*" else [o.strip() for o in _origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QuestionRequest(BaseModel):
    question: str
    grade: int = 6
    language: str = "English"
    chapter_id: Optional[str] = None   # scope retrieval to a chapter
    section: Optional[str] = None      # ...and a subtopic (e.g. "7.2")

class QuizRequest(BaseModel):
    topic: Optional[str] = None    # legacy single-topic
    topics: Optional[list] = None  # multi-topic
    grade: int
    language: str = "English"
    focus_points: Optional[str] = None
    difficulty: str = "Medium"
    chapter_id: Optional[str] = None
    section: Optional[str] = None

class GenerateDiagnosticRequest(BaseModel):
    grade: int = 6
    goal: str = "mixed"          # understand | practice | tests | mixed
    language: str = "English"
    num: int = 10

class GenerateDiagnosticDrillRequest(BaseModel):
    chapter_id: str              # e.g. 'g6-fractions'
    language: str = "English"
    num: int = 4                 # subtopic-level questions

class DailyGreetingRequest(BaseModel):
    user_id: str
    name: str
    grade: int = 6
    language: str = "English"

class QuizFeedbackRequest(BaseModel):
    user_id: str
    topic: str
    score: int
    total: int
    mistakes: list
    language: str = "English"

class SyncMemoryRequest(BaseModel):
    user_id: str
    memory_graph: dict

class ExplainMistakeRequest(BaseModel):
    question: str
    user_answer: str
    correct_answer: str
    grade: int = 6
    language: str = "English"

class ProfileUpdate(BaseModel):
    user_id: str
    name: Optional[str] = None
    grade: Optional[int] = None
    exam: Optional[str] = None
    language: Optional[str] = None
    email: Optional[str] = None

class PaperRequest(BaseModel):
    topics: list
    grade: int
    total_marks: int = 40
    language: str = "English"
    difficulty: str = "Medium"
    chapter_id: Optional[str] = None
    section: Optional[str] = None

class GradePaperRequest(BaseModel):
    images: list          # base64-encoded JPEG strings
    paper: dict           # full paper JSON with sections/questions
    grade: int
    total_marks: int = 40
    language: str = "English"

class ActivityRequest(BaseModel):
    user_id: str
    event_type: str
    data: Optional[dict] = {}

class DiagnosticRequest(BaseModel):
    user_id: str
    weak_topics: list
    score: int
    total: int

class RealWorldRequest(BaseModel):
    topic: str
    grade: int = 6

class ConceptRequest(BaseModel):
    topic: str
    grade: int = 6
    language: str = "English"
    chapter_id: Optional[str] = None
    section: Optional[str] = None

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Vidya Backend is running (Root)"}

@app.get("/ping")
def ping():
    return {"status": "ok", "message": "Vidya Backend is running"}

@app.post("/ask")
async def ask_question(request: QuestionRequest):
    try:
        # 1. Retrieve Context
        context = rag_service.retrieve_context(
            query=request.question,
            grade=request.grade,
            chapter_id=request.chapter_id,
            section=request.section
        )
        
        # 2. Generate Answer (returns JSON string with 'answer' and 'suggestions')
        raw_response = rag_service.generate_answer(
            query=request.question,
            context=context,
            language=request.language
        )
        
        import json
        try:
            data = json.loads(raw_response)
            explanation = data.get("explanation", "")
            key_principle = data.get("key_principle", "")
            common_mistake = data.get("common_mistake", "")
            suggestions = data.get("suggestions", [])
        except Exception:
            explanation = raw_response
            key_principle = ""
            common_mistake = ""
            suggestions = []
        
        return {
            "explanation": explanation,
            "key_principle": key_principle,
            "common_mistake": common_mistake,
            "suggestions": suggestions,
            "context_used": [c['metadata']['source'] for c in context]
        }
    except Exception as e:
        print(f"Error in /ask: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/search-videos")
async def search_videos(request: QuestionRequest): # Re-using QuestionRequest for topic and grade
    try:
        import json
        result_json = rag_service.search_videos(request.question, request.grade)
        return json.loads(result_json)
    except Exception as e:
        print(f"Error in /search-videos: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-quiz")
async def generate_quiz_endpoint(request: QuizRequest):
    try:
        topic_list = request.topics or ([request.topic] if request.topic else [])
        if not topic_list:
            raise HTTPException(status_code=400, detail="No topics provided")
        quiz = quiz_service.generate_quiz(topic_list, request.grade, request.language, request.focus_points, request.difficulty, chapter_id=request.chapter_id, section=request.section)
        return {"quiz": quiz}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-diagnostic")
async def generate_diagnostic_endpoint(request: GenerateDiagnosticRequest):
    """Onboarding placement diagnostic, tuned to class + goal (no prior data)."""
    try:
        return quiz_service.generate_diagnostic(request.grade, request.goal, request.language, request.num)
    except Exception as e:
        print(f"Error in /generate-diagnostic: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-diagnostic-drill")
async def generate_diagnostic_drill_endpoint(request: GenerateDiagnosticDrillRequest):
    """Subtopic-level drill into the weakest chapter identified by the coarse diagnostic."""
    try:
        return quiz_service.generate_diagnostic_drill(request.chapter_id, request.language, request.num)
    except Exception as e:
        print(f"Error in /generate-diagnostic-drill: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/suggestion/{user_id}")
async def get_quiz_suggestion(user_id: str):
    try:
        # Get personalized suggestion from vidya_service
        suggestion = vidya_service.get_quiz_recommendation(user_id)
        return suggestion
    except Exception as e:
        print(f"Error in /suggestion: {e}")
        # Return a safe default
        return {
            "topic": "Whole Numbers",
            "reason": "Ready to master some Math today?",
            "focus_points": None
        }

@app.post("/daily-greeting")
async def get_daily_greeting(request: DailyGreetingRequest):
    try:
        greeting = vidya_service.generate_daily_greeting(
            student_id=request.user_id,
            name=request.name,
            grade=request.grade,
            language=request.language
        )
        return {"greeting": greeting}
    except Exception as e:
        print(f"Error in /daily-greeting: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/quiz-feedback")
async def get_quiz_feedback(request: QuizFeedbackRequest):
    try:
        # Get JSON structure from Vidya
        feedback = vidya_service.generate_quiz_feedback(
            request.user_id, request.topic, request.score, request.total, request.mistakes, request.language
        )

        # Save attempt to history for Phase 20
        vidya_service.save_quiz_attempt(
            request.user_id, request.topic, request.score, request.total, request.mistakes
        )

        return {"feedback": feedback}
    except Exception as e:
        print(f"Error in /quiz-feedback: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/history/{user_id}")
async def get_history(user_id: str):
    try:
        history = vidya_service.get_quiz_history(user_id)
        return {"history": history}
    except Exception as e:
        print(f"Error in /history: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/sync-memory")
async def sync_memory(request: SyncMemoryRequest):
    try:
        vidya_service.update_student_memory(request.user_id, request.memory_graph)
        return {"status": "success"}
    except Exception as e:
        print(f"Error in /sync-memory: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/explain-mistake")
async def explain_mistake(request: ExplainMistakeRequest):
    try:
        explanation = vidya_service.explain_mistake(
            question=request.question,
            user_answer=request.user_answer,
            correct_answer=request.correct_answer,
            grade=request.grade,
            language=request.language
        )
        return {"explanation": explanation}
    except Exception as e:
        print(f"Error in /explain-mistake: {e}")
        raise HTTPException(status_code=500, detail=str(e))
@app.get("/profile/{user_id}")
async def get_profile(user_id: str):
    try:
        profile = vidya_service.get_student_profile(user_id)
        return {"profile": profile}
    except Exception as e:
        print(f"Error in GET /profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/profile")
async def update_profile(request: ProfileUpdate):
    try:
        vidya_service.update_student_profile(request.user_id, {
            "name": request.name,
            "grade": request.grade,
            "exam": request.exam,
            "language": request.language,
            "email": request.email
        })
        return {"status": "success"}
    except Exception as e:
        print(f"Error in POST /profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/report/{user_id}")
async def get_report(user_id: str):
    try:
        report = vidya_service.get_report_data(user_id)
        if not report:
            raise HTTPException(status_code=404, detail="Student not found")
        return report
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in /report: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-paper")
async def generate_paper_endpoint(request: PaperRequest):
    try:
        paper = quiz_service.generate_paper(request.topics, request.grade, request.total_marks, request.language, request.difficulty, chapter_id=request.chapter_id, section=request.section)
        return {"paper": paper}
    except Exception as e:
        print(f"Error in /generate-paper: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-concept")
async def generate_concept_endpoint(request: ConceptRequest):
    try:
        data = concept_service.generate_concept(
            request.topic, request.grade, request.language,
            chapter_id=request.chapter_id, section=request.section,
        )
        return data
    except Exception as e:
        print(f"Error in /generate-concept: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/real-world")
async def real_world_uses(request: RealWorldRequest):
    try:
        result = vidya_service.get_real_world_uses(request.topic, request.grade)
        return {"uses": result}
    except Exception as e:
        print(f"Error in /real-world: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/diagnostic")
async def save_diagnostic(request: DiagnosticRequest):
    try:
        db = get_db()
        if db:
            db.collection('students').document(request.user_id).set({
                'diagnostic': {
                    'completed': True,
                    'score': request.score,
                    'total': request.total,
                    'weak_topics': request.weak_topics,
                }
            }, merge=True)
        return {"status": "success"}
    except Exception as e:
        print(f"Error in /diagnostic: {e}")
        return {"status": "ok"}  # never block the user

@app.post("/activity")
async def track_activity(request: ActivityRequest):
    try:
        vidya_service.log_activity(request.user_id, request.event_type, request.data or {})
    except Exception:
        pass  # never fail the client for tracking
    return {"status": "ok"}

@app.post("/grade-paper")
async def grade_paper_endpoint(request: GradePaperRequest):
    try:
        if not request.images:
            raise HTTPException(status_code=400, detail="No images provided")
        result = exam_service.grade_paper_from_images(
            request.images, request.paper, request.grade, request.total_marks, request.language
        )
        return result
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in /grade-paper: {e}")
        raise HTTPException(status_code=500, detail=str(e))
