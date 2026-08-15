// ─────────────────────────────────────────────────────────────
//  Vidya backend client.
//
//  All calls go through the Vite proxy: /api/* → http://localhost:8001
//  (see vite.config.ts). The backend holds the GCP credentials and runs
//  the RAG + Gemini (gemini-3.5-flash) calls — never the browser.
//
//  Every function throws on network/HTTP error so screens can show a
//  fallback state. Keep payload shapes in sync with backend/main.py models.
// ─────────────────────────────────────────────────────────────
import { chapterTitle } from '../content/chapters';
import { chapterTitleById } from '../content/syllabus';
import type {
  AskResponse,
  ConceptResponse,
  GradeResult,
  Paper,
  QuizFeedback,
  QuizQuestion,
  RealWorldUse,
  VideoItem,
} from '../types';

// Dev: '/api' goes through the Vite proxy to localhost:8001.
// Prod: set VITE_API_BASE to the deployed backend URL (e.g. https://vidya-api.onrender.com).
const BASE = import.meta.env.VITE_API_BASE || '/api';

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

// Map app classLevel ('6'/'7'/'8') → integer grade. KB has grades 6, 7 and 8 ingested.
export const toGrade = (classLevel?: string | number | null): number => Number(classLevel) || 6;

// Chapter id (planTopicId) → human topic title used in LLM prompts.
// Sourced from the canonical NCERT chapter list.
// Resolve a plan/session topic id → title. New ids are class-aware syllabus ids
// (g6-…); fall back to the legacy catalog for any older saved ids.
export const topicTitle = (id?: string | null): string => chapterTitleById(id) || chapterTitle(id);

type Language = string;

// ── Ask Vidya (RAG) ──────────────────────────────────────────
export const ask = (
  question: string,
  grade: number = 6,
  language: Language = 'English',
  chapterId: string | null = null,
  section: string | null = null,
): Promise<AskResponse> =>
  post<AskResponse>('/ask', { question, grade, language, chapter_id: chapterId, section });

// ── Quiz generation ──────────────────────────────────────────
export interface GenerateQuizArgs {
  topics: string[] | string;
  grade?: number;
  language?: Language;
  focusPoints?: string[] | null;
  difficulty?: string;
  chapterId?: string | null;
  section?: string | null;
}
export const generateQuiz = ({
  topics,
  grade = 6,
  language = 'English',
  focusPoints = null,
  difficulty = 'Medium',
  chapterId = null,
  section = null,
}: GenerateQuizArgs): Promise<QuizQuestion[]> =>
  post<{ quiz?: QuizQuestion[] }>('/generate-quiz', {
    topics,
    grade,
    language,
    focus_points: focusPoints,
    difficulty,
    chapter_id: chapterId,
    section,
  }).then((d) => d.quiz || []);

// ── Revision run: questions for EVERY subtopic of a chapter ──
//  Also used for the top-up when a student misses a topic and needs more
//  questions on it: pass that one subtopic plus what's already been asked.
export const generateRevision = ({
  subtopics,
  grade = 6,
  language = 'English',
  chapterId = null,
  perTopic = 2,
  exclude = null,
}: {
  subtopics: { num: string; title: string }[];
  grade?: number; language?: Language; chapterId?: string | null;
  perTopic?: number; exclude?: string[] | null;
}): Promise<QuizQuestion[]> =>
  post<{ questions?: QuizQuestion[] }>('/generate-revision', {
    subtopics, grade, language, chapter_id: chapterId,
    per_topic: perTopic, exclude,
  }).then((d) => d.questions || []);

// ── Onboarding diagnostic (placement, tuned to class + goal) ──
export interface DiagnosticQ { area: string; prompt: string; options: string[]; correct_index: number; subtopic?: string; }
export interface GenerateDiagnosticArgs {
  grade?: number;
  goal?: string;          // understand | practice | tests | mixed
  language?: Language;
  num?: number;
}
export const generateDiagnostic = ({
  grade = 6,
  goal = 'mixed',
  language = 'English',
  num = 10,
}: GenerateDiagnosticArgs): Promise<DiagnosticQ[]> =>
  post<{ questions?: DiagnosticQ[] }>('/generate-diagnostic', { grade, goal, language, num })
    .then((d) => d.questions || []);


// ── Explain a wrong answer ───────────────────────────────────
export interface ExplainMistakeArgs {
  question: string;
  userAnswer: string;
  correctAnswer: string;
  grade?: number;
  language?: Language;
}
export const explainMistake = ({
  question,
  userAnswer,
  correctAnswer,
  grade = 6,
  language = 'English',
}: ExplainMistakeArgs): Promise<string> =>
  post<{ explanation?: string }>('/explain-mistake', {
    question,
    user_answer: userAnswer,
    correct_answer: correctAnswer,
    grade,
    language,
  }).then((d) => d.explanation || '');

// ── Post-quiz feedback ───────────────────────────────────────
export interface QuizFeedbackArgs {
  userId?: string | null;
  topic: string;
  score: number;
  total: number;
  mistakes?: unknown[];
  language?: Language;
}
export const quizFeedback = ({
  userId,
  topic,
  score,
  total,
  mistakes = [],
  language = 'English',
}: QuizFeedbackArgs): Promise<QuizFeedback> =>
  post<{ feedback: QuizFeedback }>('/quiz-feedback', {
    user_id: userId,
    topic,
    score,
    total,
    mistakes,
    language,
  }).then((d) => d.feedback);

// ── Concept videos (YouTube search, grounded by topic) ───────
// reuses QuestionRequest: question = topic
export const searchVideos = (topic: string, grade: number = 6): Promise<VideoItem[]> =>
  post<VideoItem[]>('/search-videos', { question: topic, grade });

// ── Real-world uses of a topic ───────────────────────────────
export const realWorld = (topic: string, grade: number = 6): Promise<RealWorldUse[]> =>
  post<{ uses: RealWorldUse[] }>('/real-world', { topic, grade }).then((d) => d.uses);

// ── Concept lesson for ANY topic (RAG-grounded) ──────────────
export interface GenerateConceptArgs {
  topic: string;
  grade?: number;
  language?: Language;
  chapterId?: string | null;
  section?: string | null;
}
export const generateConcept = ({
  topic,
  grade = 6,
  language = 'English',
  chapterId = null,
  section = null,
}: GenerateConceptArgs): Promise<ConceptResponse> =>
  post<ConceptResponse>('/generate-concept', {
    topic,
    grade,
    language,
    chapter_id: chapterId,
    section,
  });

// ── Adaptive lesson (teaching beats) for one subtopic ────────
export interface GenerateLessonArgs {
  topic: string;
  grade?: number;
  language?: Language;
  chapterId?: string | null;
  section?: string | null;
  depth?: 'full' | 'quick';
  /** Several subtopics covered by one session (with their titles). */
  sections?: string[] | null;
  sectionTitles?: string[] | null;
  /** Answer this specific question instead of teaching the whole subtopic. */
  focus?: string | null;
}
export const generateLesson = ({
  topic,
  grade = 6,
  language = 'English',
  chapterId = null,
  section = null,
  depth = 'full',
  sections = null,
  sectionTitles = null,
  focus = null,
}: GenerateLessonArgs): Promise<import('../types').AdaptiveLesson> =>
  post<import('../types').AdaptiveLesson>('/generate-lesson', {
    topic,
    grade,
    language,
    chapter_id: chapterId,
    section,
    depth,
    sections,
    section_titles: sectionTitles,
    focus,
  });

// ── Viva: spoken-answer practice ─────────────────────────────
export interface VivaQuestion { question: string; listen_for: string[]; chapter?: string; }
export const generateViva = ({
  topics,
  grade = 6,
  language = 'English',
  num = 3,
  level = 'normal',
}: { topics: string[]; grade?: number; language?: Language; num?: number; level?: string }): Promise<VivaQuestion[]> =>
  post<{ questions?: VivaQuestion[] }>('/generate-viva', { topics, grade, language, num, level })
    .then((d) => d.questions || []);

export interface VivaFeedback { heard: string; good: string[]; missing: string[]; tip: string; stars: number; }
export const evaluateViva = ({
  audio,
  mimeType = 'audio/webm',
  question,
  listenFor = [],
  grade = 6,
  language = 'English',
}: { audio: string; mimeType?: string; question: string; listenFor?: string[]; grade?: number; language?: Language }): Promise<VivaFeedback> =>
  post<VivaFeedback>('/evaluate-viva', {
    audio, mime_type: mimeType, question, listen_for: listenFor, grade, language,
  });

// ── One-screen chapter notes ─────────────────────────────────
export const generateNotes = ({
  topic,
  grade = 6,
  language = 'English',
  chapterId = null,
  subtopics = null,
}: {
  topic: string; grade?: number; language?: Language; chapterId?: string | null;
  // The chapter's real subtopic list — what makes the notes cover the whole chapter.
  subtopics?: { num: string; title: string }[] | null;
}): Promise<import('../types').ChapterNotes> =>
  post<import('../types').ChapterNotes>('/generate-notes', {
    topic, grade, language, chapter_id: chapterId, subtopics,
  });

// ── Homework help: read the page, nudge before solving ───────
export const homeworkHelp = ({
  images,
  mimeTypes = null,
  grade = 6,
  language = 'English',
}: { images: string[]; mimeTypes?: string[] | null; grade?: number; language?: Language }): Promise<import('../types').HomeworkResult> =>
  post<import('../types').HomeworkResult>('/homework-help', { images, mime_types: mimeTypes, grade, language });

// ── A shortcut for one topic, plus why it works ──────────────
export interface TrickResult { title: string; trick: string; why: string; try_q?: string; try_a?: string; }
export const generateTrick = ({
  topic,
  grade = 6,
  language = 'English',
  chapterId = null,
  section = null,
}: { topic: string; grade?: number; language?: Language; chapterId?: string | null; section?: string | null }): Promise<TrickResult> =>
  post<TrickResult>('/generate-trick', { topic, grade, language, chapter_id: chapterId, section });

// ── Identify a concept from photos (class notes / textbook) ──
// images: array of base64 JPEG strings (no data: prefix)
export interface IdentifyConceptResult {
  topic: string;
  summary: string;
  detected: boolean;
  /** The specific thing the page asks about — the lesson answers THIS. */
  focus?: string;
  /** Matched NCERT entry, so retrieval is scoped and mastery gets credited. */
  chapter_id?: string;
  section?: string;
  /** Whether the student has written working of their own — ranks the offers. */
  has_work?: 'none' | 'partial' | 'complete';
  /** How many questions are on the page (0 when it isn't a question page). */
  question_count?: number;
}
/** One chapter as sent to the vision call, so it can pin an exact section. */
export interface SyllabusForMatch {
  chapter_id: string;
  chapter_title: string;
  subtopics: { section: string; title: string }[];
}
export const identifyConcept = ({
  images,
  mimeTypes = null,
  syllabus = null,
  grade = 6,
  language = 'English',
}: { images: string[]; mimeTypes?: string[] | null; syllabus?: SyllabusForMatch[] | null; grade?: number; language?: Language }): Promise<IdentifyConceptResult> =>
  post<IdentifyConceptResult>('/identify-concept', { images, mime_types: mimeTypes, syllabus, grade, language });

// ── Check the student's own working ──────────────────────────
//  Marks what they wrote; falls back to hints when the page is blank.
export const checkWork = ({
  images,
  mimeTypes = null,
  syllabus = null,
  grade = 6,
  language = 'English',
}: {
  images: string[]; mimeTypes?: string[] | null;
  syllabus?: SyllabusForMatch[] | null; grade?: number; language?: Language;
}): Promise<import('../types').CheckWorkResult> =>
  post<import('../types').CheckWorkResult>('/check-work', {
    images, mime_types: mimeTypes, syllabus, grade, language,
  });

// ── Exam paper generation ────────────────────────────────────
export interface GeneratePaperArgs {
  topics: string[] | string;
  grade?: number;
  totalMarks?: number;
  language?: Language;
  difficulty?: string;
  chapterId?: string | null;
  section?: string | null;
}
export const generatePaper = ({
  topics,
  grade = 6,
  totalMarks = 40,
  language = 'English',
  difficulty = 'Medium',
  chapterId = null,
  section = null,
}: GeneratePaperArgs): Promise<Paper> =>
  post<{ paper: Paper }>('/generate-paper', {
    topics,
    grade,
    total_marks: totalMarks,
    language,
    difficulty,
    chapter_id: chapterId,
    section,
  }).then((d) => d.paper);

// ── Exam grading from photos ─────────────────────────────────
// images: array of base64 JPEG strings (no data: prefix)
export interface GradePaperArgs {
  images: string[];
  paper: Paper;
  grade?: number;
  totalMarks?: number;
  language?: Language;
}
export const gradePaper = ({
  images,
  paper,
  grade = 6,
  totalMarks = 40,
  language = 'English',
}: GradePaperArgs): Promise<GradeResult> =>
  post<GradeResult>('/grade-paper', { images, paper, grade, total_marks: totalMarks, language });

// ── Daily greeting ───────────────────────────────────────────
export interface DailyGreetingArgs {
  userId?: string | null;
  name?: string;
  grade?: number;
  language?: Language;
}
export const dailyGreeting = ({
  userId,
  name,
  grade = 6,
  language = 'English',
}: DailyGreetingArgs): Promise<string> =>
  post<{ greeting?: string }>('/daily-greeting', { user_id: userId, name, grade, language }).then(
    (d) => d.greeting || '',
  );

// ── Save/update the student profile in Firestore (user_profiles/{uid}) ──
export interface UpdateProfileArgs {
  userId?: string | null;
  name?: string;
  grade?: number;
  language?: Language;
  email?: string | null;
}
export const updateProfile = ({
  userId,
  name,
  grade = 6,
  language = 'English',
  email,
}: UpdateProfileArgs): Promise<unknown> =>
  post<unknown>('/profile', { user_id: userId, name, grade, language, email });

// ── Mastery sync (cross-device, server-durable) ─────────────
import type { MasteryMap } from '../types';
export const getMastery = (userId: string): Promise<MasteryMap> =>
  fetch(`${BASE}/mastery/${encodeURIComponent(userId)}`)
    .then((r) => (r.ok ? r.json() : { mastery: {} }))
    .then((d) => (d.mastery as MasteryMap) || {})
    .catch(() => ({}));
export const saveMastery = (userId: string, mastery: MasteryMap): Promise<unknown> =>
  post<unknown>('/mastery', { user_id: userId, mastery });

export default {
  ask,
  getMastery,
  saveMastery,
  generateQuiz,
  generateRevision,
  generateDiagnostic,
  explainMistake,
  quizFeedback,
  searchVideos,
  realWorld,
  generateConcept,
  generateLesson,
  generateViva,
  evaluateViva,
  generateTrick,
  homeworkHelp,
  generateNotes,
  identifyConcept,
  checkWork,
  generatePaper,
  gradePaper,
  dailyGreeting,
  updateProfile,
  toGrade,
  topicTitle,
};
