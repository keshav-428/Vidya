from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Union, List
from database import get_db
import rag_service
import quiz_service
import vidya_service
import exam_service
import concept_service
import viva_service
import class_service
from auth_guard import require_uid
from fastapi import Depends
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
    focus_points: Optional[Union[str, List[str]]] = None
    difficulty: str = "Medium"
    chapter_id: Optional[str] = None
    section: Optional[str] = None

class GenerateDiagnosticRequest(BaseModel):
    grade: int = 6
    goal: str = "mixed"          # understand | practice | tests | mixed
    language: str = "English"
    num: int = 10

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

class MasteryUpdate(BaseModel):
    user_id: str
    mastery: dict          # skillKey -> SkillMastery

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

class HomeworkRequest(BaseModel):
    images: list          # base64-encoded image bytes
    grade: int = 6
    language: str = "English"
    mime_types: Optional[list] = None

class NotesRequest(BaseModel):
    topic: str
    grade: int = 6
    language: str = "English"
    chapter_id: Optional[str] = None
    subtopics: Optional[list] = None   # [{num, title}] — drives full-chapter coverage

class TrickRequest(BaseModel):
    topic: str
    grade: int = 6
    language: str = "English"
    chapter_id: Optional[str] = None
    section: Optional[str] = None

class IdentifyConceptRequest(BaseModel):
    images: list          # base64-encoded image bytes
    grade: int = 6
    language: str = "English"
    mime_types: Optional[list] = None   # per-image, as reported by the browser
    syllabus: Optional[list] = None     # the student's class catalog, to pin chapter_id/section

class CheckWorkRequest(BaseModel):
    images: list          # base64-encoded image bytes
    grade: int = 6
    language: str = "English"
    mime_types: Optional[list] = None
    syllabus: Optional[list] = None     # so weak_sections come back as real NCERT ids

class LessonRequest(BaseModel):
    topic: str
    grade: int = 6
    language: str = "English"
    chapter_id: Optional[str] = None
    section: Optional[str] = None
    depth: str = "full"   # 'full' | 'quick' (student already knows the basics)
    sections: Optional[list] = None        # several subtopics in one session
    section_titles: Optional[list] = None  # their titles, for coverage in examples
    focus: Optional[str] = None            # answer THIS specific question, not the whole subtopic

class VivaQuestionsRequest(BaseModel):
    topics: list          # topic (or chapter) titles
    grade: int = 6
    language: str = "English"
    num: int = 3
    level: str = "normal"  # easy | normal | hard, chosen by the student

class VivaEvalRequest(BaseModel):
    audio: str            # base64-encoded audio (no data: prefix)
    mime_type: str = "audio/webm"
    question: str
    listen_for: Optional[list] = []
    grade: int = 6
    language: str = "English"

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
        focus = request.focus_points
        if isinstance(focus, list):
            focus = "\n".join(f"- {f}" for f in focus if f)
        quiz = quiz_service.generate_quiz(topic_list, request.grade, request.language, focus, request.difficulty, chapter_id=request.chapter_id, section=request.section)
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

@app.get("/mastery/{user_id}")
async def get_mastery(user_id: str):
    try:
        return {"mastery": vidya_service.get_student_mastery(user_id)}
    except Exception as e:
        print(f"Error in GET /mastery: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/mastery")
async def save_mastery(request: MasteryUpdate):
    try:
        vidya_service.save_student_mastery(request.user_id, request.mastery)
        return {"status": "success"}
    except Exception as e:
        print(f"Error in POST /mastery: {e}")
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

@app.post("/generate-lesson")
async def generate_lesson_endpoint(request: LessonRequest):
    try:
        data = concept_service.generate_lesson(
            request.topic, request.grade, request.language,
            chapter_id=request.chapter_id, section=request.section, depth=request.depth,
            sections=request.sections, section_titles=request.section_titles,
            focus=request.focus,
        )
        return data
    except Exception as e:
        print(f"Error in /generate-lesson: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-viva")
async def generate_viva_endpoint(request: VivaQuestionsRequest):
    try:
        data = viva_service.generate_viva_questions(
            request.topics, request.grade, request.language, request.num,
            level=request.level,
        )
        return data
    except Exception as e:
        print(f"Error in /generate-viva: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/evaluate-viva")
async def evaluate_viva_endpoint(request: VivaEvalRequest):
    try:
        if not request.audio:
            raise HTTPException(status_code=400, detail="No audio provided")
        data = viva_service.evaluate_viva_answer(
            request.audio, request.mime_type, request.question,
            request.listen_for or [], request.grade, request.language,
        )
        return data
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in /evaluate-viva: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/homework-help")
async def homework_help_endpoint(request: HomeworkRequest):
    try:
        if not request.images:
            raise HTTPException(status_code=400, detail="No images provided")
        return concept_service.homework_help_from_images(
            request.images, request.grade, request.language, mime_types=request.mime_types,
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in /homework-help: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class RevisionRequest(BaseModel):
    subtopics: list                  # [{num, title}] — drives whole-chapter coverage
    grade: int = 6
    language: str = "English"
    chapter_id: Optional[str] = None
    per_topic: int = 2
    exclude: Optional[list] = None   # questions already asked (for the top-up call)

@app.post("/generate-revision")
async def generate_revision_endpoint(request: RevisionRequest):
    try:
        return quiz_service.generate_revision(
            request.subtopics, request.grade, request.language,
            chapter_id=request.chapter_id, per_topic=request.per_topic,
            exclude=request.exclude,
        )
    except Exception as e:
        print(f"Error in /generate-revision: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-notes")
async def generate_notes_endpoint(request: NotesRequest):
    try:
        return concept_service.generate_notes(
            request.topic, request.grade, request.language,
            chapter_id=request.chapter_id, subtopics=request.subtopics,
        )
    except Exception as e:
        print(f"Error in /generate-notes: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-trick")
async def generate_trick_endpoint(request: TrickRequest):
    try:
        return concept_service.generate_trick(
            request.topic, request.grade, request.language,
            chapter_id=request.chapter_id, section=request.section,
        )
    except Exception as e:
        print(f"Error in /generate-trick: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/identify-concept")
async def identify_concept_endpoint(request: IdentifyConceptRequest):
    try:
        if not request.images:
            raise HTTPException(status_code=400, detail="No images provided")
        data = concept_service.identify_concept_from_images(
            request.images, request.grade, request.language,
            mime_types=request.mime_types, syllabus=request.syllabus,
        )
        return data
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in /identify-concept: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/check-work")
async def check_work_endpoint(request: CheckWorkRequest):
    """Marks the student's own working — or nudges them through the questions
    when the page is still blank. One call handles both; only the photo can say
    which case it is."""
    try:
        if not request.images:
            raise HTTPException(status_code=400, detail="No images provided")
        data = concept_service.check_work_from_images(
            request.images, request.grade, request.language,
            mime_types=request.mime_types, syllabus=request.syllabus,
        )
        return data
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in /check-work: {e}")
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


# ── Classes: the teacher ↔ student link (see docs/teacher-app-plan.md) ──
#  Separate from every student route above in one important way: these read
#  OTHER people's children, so the caller is verified from their Firebase token
#  instead of naming themselves in the body.

class CreateClassRequest(BaseModel):
    name: str                 # what the teacher calls it, e.g. "6B"
    grade: int = 6

class JoinClassRequest(BaseModel):
    code: str

class CreateAssignmentRequest(BaseModel):
    chapter_id: str
    section: Optional[str] = None
    title: Optional[str] = ""
    student_ids: Optional[List[str]] = None   # absent ⇒ the whole class

class InviteStudentRequest(BaseModel):
    vidya_id: str

class InviteResponseRequest(BaseModel):
    accept: bool

@app.post("/classes")
async def create_class_endpoint(request: CreateClassRequest, uid: str = Depends(require_uid)):
    try:
        name = (request.name or "").strip()
        if not name:
            raise HTTPException(status_code=400, detail="A class needs a name")
        teacher_name = ""
        try:
            from firebase_admin import auth as _fb_auth
            teacher_name = _fb_auth.get_user(uid).display_name or ""
        except Exception:
            pass   # a missing display name is not worth failing a class over
        return class_service.create_class(uid, name, request.grade, teacher_name)
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in POST /classes: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/classes")
async def list_classes_endpoint(uid: str = Depends(require_uid)):
    try:
        return {"classes": class_service.list_classes(uid)}
    except Exception as e:
        print(f"Error in GET /classes: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/classes/{class_id}")
async def get_class_endpoint(class_id: str, uid: str = Depends(require_uid)):
    try:
        return class_service.get_class(class_id, uid)
    except LookupError:
        raise HTTPException(status_code=404, detail="No such class")
    except PermissionError:
        raise HTTPException(status_code=403, detail="Not your class")
    except Exception as e:
        print(f"Error in GET /classes/{class_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/classes/{class_id}/roster")
async def class_roster_endpoint(class_id: str, uid: str = Depends(require_uid)):
    try:
        return {"students": class_service.roster(class_id, uid)}
    except LookupError:
        raise HTTPException(status_code=404, detail="No such class")
    except PermissionError:
        raise HTTPException(status_code=403, detail="Not your class")
    except Exception as e:
        print(f"Error in GET /classes/{class_id}/roster: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ── Setting practice (phase 6) ───────────────────────────────

@app.post("/classes/{class_id}/assignments")
async def create_assignment_endpoint(class_id: str, request: CreateAssignmentRequest,
                                     uid: str = Depends(require_uid)):
    try:
        return class_service.create_assignment(
            class_id, uid, request.chapter_id, request.section,
            request.title or "", request.student_ids)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except LookupError:
        raise HTTPException(status_code=404, detail="No such class")
    except PermissionError:
        raise HTTPException(status_code=403, detail="Not your class")
    except Exception as e:
        print(f"Error in POST /classes/{class_id}/assignments: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/classes/{class_id}/assignments")
async def class_assignments_endpoint(class_id: str, uid: str = Depends(require_uid)):
    try:
        return {"assignments": class_service.class_assignments(class_id, uid)}
    except LookupError:
        raise HTTPException(status_code=404, detail="No such class")
    except PermissionError:
        raise HTTPException(status_code=403, detail="Not your class")
    except Exception as e:
        print(f"Error in GET /classes/{class_id}/assignments: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/my-assignments")
async def my_assignments_endpoint(uid: str = Depends(require_uid)):
    try:
        return {"assignments": class_service.my_assignments(uid)}
    except Exception as e:
        print(f"Error in GET /my-assignments: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ── Vidya IDs and invitations (phase 7) ──────────────────────

@app.get("/my-vidya-id")
async def my_vidya_id_endpoint(uid: str = Depends(require_uid)):
    try:
        return class_service.get_or_make_vidya_id(uid)
    except Exception as e:
        print(f"Error in GET /my-vidya-id: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/classes/{class_id}/invites")
async def invite_student_endpoint(class_id: str, request: InviteStudentRequest,
                                  uid: str = Depends(require_uid)):
    try:
        return class_service.invite_student(class_id, uid, request.vidya_id)
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))
    except LookupError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except PermissionError:
        raise HTTPException(status_code=403, detail="Not your class")
    except Exception as e:
        print(f"Error in POST /classes/{class_id}/invites: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/classes/{class_id}/invites")
async def class_invites_endpoint(class_id: str, uid: str = Depends(require_uid)):
    try:
        return {"invites": class_service.class_invites(class_id, uid)}
    except LookupError:
        raise HTTPException(status_code=404, detail="No such class")
    except PermissionError:
        raise HTTPException(status_code=403, detail="Not your class")
    except Exception as e:
        print(f"Error in GET /classes/{class_id}/invites: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/my-invites")
async def my_invites_endpoint(uid: str = Depends(require_uid)):
    try:
        return {"invites": class_service.my_invites(uid)}
    except Exception as e:
        print(f"Error in GET /my-invites: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/invites/{invite_id}/respond")
async def respond_invite_endpoint(invite_id: str, request: InviteResponseRequest,
                                  uid: str = Depends(require_uid)):
    try:
        return class_service.respond_to_invite(invite_id, uid, request.accept)
    except LookupError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except PermissionError:
        raise HTTPException(status_code=403, detail="Not your invitation")
    except Exception as e:
        print(f"Error in POST /invites/{invite_id}/respond: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/my-classes")
async def my_classes_endpoint(uid: str = Depends(require_uid)):
    try:
        return {"classes": class_service.my_classes(uid)}
    except Exception as e:
        print(f"Error in GET /my-classes: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/classes/join")
async def join_class_endpoint(request: JoinClassRequest, uid: str = Depends(require_uid)):
    try:
        return class_service.join_class(request.code, uid)
    except LookupError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        print(f"Error in POST /classes/join: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/classes/{class_id}/students")
async def class_students_endpoint(class_id: str, uid: str = Depends(require_uid)):
    try:
        return {"students": class_service.class_students(class_id, uid)}
    except LookupError:
        raise HTTPException(status_code=404, detail="No such class")
    except PermissionError:
        raise HTTPException(status_code=403, detail="Not your class")
    except Exception as e:
        print(f"Error in GET /classes/{class_id}/students: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/classes/{class_id}/students/{student_id}")
async def student_detail_endpoint(class_id: str, student_id: str, uid: str = Depends(require_uid)):
    try:
        return class_service.student_detail(class_id, student_id, uid)
    except LookupError:
        raise HTTPException(status_code=404, detail="Not found")
    except PermissionError:
        raise HTTPException(status_code=403, detail="Not your student")
    except Exception as e:
        print(f"Error in GET /classes/{class_id}/students/{student_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/classes-overview")
async def classes_overview_endpoint(uid: str = Depends(require_uid)):
    try:
        return {"classes": class_service.classes_overview(uid)}
    except Exception as e:
        print(f"Error in GET /classes-overview: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/classes/{class_id}/students/{student_id}/report")
async def student_report_endpoint(class_id: str, student_id: str, uid: str = Depends(require_uid)):
    try:
        return class_service.student_report(class_id, student_id, uid)
    except LookupError:
        raise HTTPException(status_code=404, detail="Not found")
    except PermissionError:
        raise HTTPException(status_code=403, detail="Not your student")
    except Exception as e:
        print(f"Error in GET student report: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/classes/{class_id}/summary")
async def class_summary_endpoint(class_id: str, uid: str = Depends(require_uid)):
    try:
        return class_service.class_summary(class_id, uid)
    except LookupError:
        raise HTTPException(status_code=404, detail="No such class")
    except PermissionError:
        raise HTTPException(status_code=403, detail="Not your class")
    except Exception as e:
        print(f"Error in GET /classes/{class_id}/summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/classes/{class_id}/leave")
async def leave_class_endpoint(class_id: str, uid: str = Depends(require_uid)):
    try:
        return class_service.leave_class(class_id, uid)
    except Exception as e:
        print(f"Error in POST /classes/{class_id}/leave: {e}")
        raise HTTPException(status_code=500, detail=str(e))
