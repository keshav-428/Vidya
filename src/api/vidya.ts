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
export const topicTitle = (id?: string | null): string => chapterTitle(id);

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

// ── Onboarding diagnostic (placement, tuned to class + goal) ──
export interface DiagnosticQ { area: string; prompt: string; options: string[]; correct_index: number; }
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

export default {
  ask,
  generateQuiz,
  generateDiagnostic,
  explainMistake,
  quizFeedback,
  searchVideos,
  realWorld,
  generateConcept,
  generatePaper,
  gradePaper,
  dailyGreeting,
  updateProfile,
  toGrade,
  topicTitle,
};
