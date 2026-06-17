// ─────────────────────────────────────────────────────────────
//  Vidya backend client.
//
//  All calls go through the Vite proxy: /api/* → http://localhost:8001
//  (see vite.config.js). The backend holds the GCP credentials and runs
//  the RAG + Gemini (gemini-3.5-flash) calls — never the browser.
//
//  Every function throws on network/HTTP error so screens can show a
//  fallback state. Keep payload shapes in sync with backend/main.py models.
// ─────────────────────────────────────────────────────────────
import { chapterTitle } from '../content/chapters';

// Dev: '/api' goes through the Vite proxy to localhost:8001.
// Prod: set VITE_API_BASE to the deployed backend URL (e.g. https://vidya-api.onrender.com).
const BASE = import.meta.env.VITE_API_BASE || '/api';

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path} → ${res.status}`);
  return res.json();
}

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`${path} → ${res.status}`);
  return res.json();
}

// Map app classLevel ('6'/'7'/'8') → integer grade. KB currently only has grade 6.
export const toGrade = (classLevel) => Number(classLevel) || 6;

// Chapter id (planTopicId) → human topic title used in LLM prompts.
// Sourced from the canonical NCERT chapter list.
export const topicTitle = (id) => chapterTitle(id);

// ── Ask Vidya (RAG) ──────────────────────────────────────────
// → { explanation, key_principle, common_mistake, suggestions[], context_used[] }
export const ask = (question, grade = 6, language = 'English') =>
  post('/ask', { question, grade, language });

// ── Quiz generation ──────────────────────────────────────────
// → { quiz: [{ question, options[4], answer:int, explanation }] }
export const generateQuiz = ({ topics, grade = 6, language = 'English', focusPoints = null, difficulty = 'Medium' }) =>
  post('/generate-quiz', { topics, grade, language, focus_points: focusPoints, difficulty })
    .then((d) => d.quiz || []);

// ── Explain a wrong answer ───────────────────────────────────
// → { explanation }
export const explainMistake = ({ question, userAnswer, correctAnswer, grade = 6, language = 'English' }) =>
  post('/explain-mistake', { question, user_answer: userAnswer, correct_answer: correctAnswer, grade, language })
    .then((d) => d.explanation || '');

// ── Post-quiz feedback ───────────────────────────────────────
// → { feedback: <json/string structure from vidya_service> }
export const quizFeedback = ({ userId, topic, score, total, mistakes = [], language = 'English' }) =>
  post('/quiz-feedback', { user_id: userId, topic, score, total, mistakes, language })
    .then((d) => d.feedback);

// ── Concept videos (YouTube search, grounded by topic) ───────
// reuses QuestionRequest: question = topic
export const searchVideos = (topic, grade = 6) =>
  post('/search-videos', { question: topic, grade });

// ── Real-world uses of a topic ───────────────────────────────
// → { uses: [...] }
export const realWorld = (topic, grade = 6) =>
  post('/real-world', { topic, grade }).then((d) => d.uses);

// ── Concept lesson for ANY topic (RAG-grounded) ──────────────
// → { definition, mistakes:[{title,wrong,right,why}], examples:[{q,steps[],answer}] }
export const generateConcept = ({ topic, grade = 6, language = 'English' }) =>
  post('/generate-concept', { topic, grade, language });

// ── Exam paper generation ────────────────────────────────────
// → { paper: { sections: [{ name, marks_per_q, instructions, questions[] }] } }
export const generatePaper = ({ topics, grade = 6, totalMarks = 40, language = 'English', difficulty = 'Medium' }) =>
  post('/generate-paper', { topics, grade, total_marks: totalMarks, language, difficulty })
    .then((d) => d.paper);

// ── Exam grading from photos ─────────────────────────────────
// images: array of base64 JPEG strings (no data: prefix)
// → { total_awarded, total_possible, percentage, sections[...] }
export const gradePaper = ({ images, paper, grade = 6, totalMarks = 40, language = 'English' }) =>
  post('/grade-paper', { images, paper, grade, total_marks: totalMarks, language });

// ── Daily greeting ───────────────────────────────────────────
// → { greeting }
export const dailyGreeting = ({ userId, name, grade = 6, language = 'English' }) =>
  post('/daily-greeting', { user_id: userId, name, grade, language }).then((d) => d.greeting);

// ── Save/update the student profile in Firestore (user_profiles/{uid}) ──
export const updateProfile = ({ userId, name, grade = 6, language = 'English', email }) =>
  post('/profile', { user_id: userId, name, grade, language, email });

export default {
  ask, generateQuiz, explainMistake, quizFeedback, searchVideos,
  realWorld, generateConcept, generatePaper, gradePaper, dailyGreeting,
  updateProfile, toGrade, topicTitle,
};
