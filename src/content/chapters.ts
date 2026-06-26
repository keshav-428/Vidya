// ─────────────────────────────────────────────────────────────
//  Canonical chapter list — NCERT Class 6 Maths (Ganita Prakash).
//  Titles extracted from the actual ingested PDFs (backend/data/ncert_pdfs).
//  Single source of truth for the session picker, session display, and the
//  topic title sent to the LLM. `id` is what we store in state.planTopicId.
// ─────────────────────────────────────────────────────────────

export interface ChapterInfo {
  id: string;
  title: string;
  sub: string;
}

export const CHAPTERS: ChapterInfo[] = [
  { id: 'patterns',       title: 'Patterns in Mathematics',     sub: 'Number & shape patterns' },
  { id: 'lines-angles',   title: 'Lines and Angles',            sub: 'Points, lines & angles' },
  { id: 'number-play',    title: 'Number Play',                 sub: 'Exploring numbers' },
  { id: 'data-handling',  title: 'Data Handling & Presentation', sub: 'Organising & reading data' },
  { id: 'prime-time',     title: 'Prime Time',                  sub: 'Primes, factors & multiples' },
  { id: 'perimeter-area', title: 'Perimeter and Area',          sub: 'Measuring flat shapes' },
  { id: 'fractions',      title: 'Fractions',                   sub: 'Parts of a whole' },
  { id: 'constructions',  title: 'Playing with Constructions',  sub: 'Drawing with compass & ruler' },
  { id: 'symmetry',       title: 'Symmetry',                    sub: 'Reflection & rotation' },
  { id: 'integers',       title: 'The Other Side of Zero',      sub: 'Integers & negative numbers' },
];

// Default to Fractions (the one chapter with hand-authored Learn content).
const DEFAULT: ChapterInfo = CHAPTERS.find((c) => c.id === 'fractions') || CHAPTERS[0];

export const chapterById = (id?: string | null): ChapterInfo =>
  CHAPTERS.find((c) => c.id === id) || DEFAULT;

export const chapterTitle = (id?: string | null): string => chapterById(id).title;
