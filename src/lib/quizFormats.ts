// ─────────────────────────────────────────────────────────────
//  Quiz question formats — the shapes CBSE/NCERT actually asks in,
//  plus the validation and marking for each.
//
//  All of it lives here rather than in the screen for two reasons:
//  the screen should only render and this should be testable. Marking
//  a correct answer wrong is worse for a student than letting a guess
//  through, so `matches()` below is deliberately generous about how an
//  answer is WRITTEN and strict about what it MEANS.
// ─────────────────────────────────────────────────────────────

export type QuizFormat = 'mcq' | 'numeric' | 'blank' | 'match' | 'order' | 'tf' | 'mistake';

export const ALL_FORMATS: QuizFormat[] = ['mcq', 'numeric', 'blank', 'match', 'order', 'tf', 'mistake'];

interface Base {
  id: number;
  format: QuizFormat;
  q: string;
  explanation: string;
  topic?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  hint?: string;
}

/** Four options, one right. */
export interface McqQ extends Base { format: 'mcq'; opts: string[]; correct: number; optionNotes?: string[]; }
/** Type the number. Nothing to guess from. */
export interface NumericQ extends Base { format: 'numeric'; answer: string; accepted?: string[]; unit?: string; }
/** NCERT's commonest exercise type: a sentence with a gap. */
export interface BlankQ extends Base { format: 'blank'; sentence: string; answer: string; accepted?: string[]; }
/** Two columns. `pairs[i]` is the index in `right` that matches `left[i]`. */
export interface MatchQ extends Base { format: 'match'; left: string[]; right: string[]; pairs: number[]; }
/** `steps` are in the CORRECT order; the screen shuffles them for display. */
export interface OrderQ extends Base { format: 'order'; steps: string[]; }
/** True or false, then why — so a coin-flip can't score. */
export interface TfQ extends Base { format: 'tf'; statement: string; isTrue: boolean; reasons: string[]; correctReason: number; }
/** A worked solution with one bad step to find. */
export interface MistakeQ extends Base { format: 'mistake'; steps: string[]; wrongStep: number; fix: string; }

export type Question = McqQ | NumericQ | BlankQ | MatchQ | OrderQ | TfQ | MistakeQ;

/** What the student has entered so far. `null` means "not answered yet". */
export type Answer =
  | { kind: 'index'; value: number }                       // mcq, mistake
  | { kind: 'text'; value: string }                        // numeric, blank
  | { kind: 'pairs'; value: (number | null)[] }            // match — right-index per left row
  | { kind: 'sequence'; value: number[] }                  // order — original step indices, in the student's order
  | { kind: 'tf'; truth: boolean | null; reason: number | null };

// ── Answer comparison ────────────────────────────────────────

const UNICODE_FRACTIONS: Record<string, string> = {
  '½': '1/2', '⅓': '1/3', '⅔': '2/3', '¼': '1/4', '¾': '3/4',
  '⅕': '1/5', '⅖': '2/5', '⅗': '3/5', '⅘': '4/5',
  '⅙': '1/6', '⅚': '5/6', '⅛': '1/8', '⅜': '3/8', '⅝': '5/8', '⅞': '7/8',
};

/** A number, a fraction, or a mixed number — the ways a student writes maths. */
const NUM_PATTERN = /(-?\d+(?:\.\d+)?)\s+(\d+)\s*\/\s*(\d+)|(-?\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)|(-?\d*\.\d+|-?\d+)/;

/** The numeric value of an answer however it's written, or null if there isn't one.
 *
 *  Takes the FIRST number-ish thing in the string, which is what lets "12 marbles",
 *  "₹45" and "3/4 kg" work without maintaining a list of every unit and noun a
 *  question might use.
 */
export function numericValue(raw: string): number | null {
  if (!raw) return null;
  let s = String(raw).trim().toLowerCase();
  for (const [glyph, plain] of Object.entries(UNICODE_FRACTIONS)) {
    if (s.includes(glyph)) s = s.split(glyph).join(` ${plain}`);
  }
  s = s
    .replace(/[₹$€£]/g, ' ')
    .replace(/(\d),(?=\d{2,3}\b)/g, '$1')   // 1,000 and the Indian 1,00,000
    .replace(/(\d),(?=\d{2,3}\b)/g, '$1')
    .trim();

  const m = NUM_PATTERN.exec(s);
  if (!m) return null;
  if (m[1] !== undefined) {                                    // mixed: 1 1/2
    const whole = parseFloat(m[1]);
    const frac = parseInt(m[2], 10) / parseInt(m[3], 10);
    if (!isFinite(frac)) return null;
    return whole < 0 ? whole - frac : whole + frac;
  }
  if (m[4] !== undefined) {                                    // fraction: 3/4
    const den = parseFloat(m[5]);
    if (!den) return null;
    return parseFloat(m[4]) / den;
  }
  return parseFloat(m[6]);
}

/** Case and spacing don't change a maths answer, but punctuation can: a minus
 *  sign, a decimal point and a fraction bar all carry meaning. Stripping those
 *  would make "-12" equal "12" and "1.5" equal "15". */
function textKey(raw: string): string {
  const s = String(raw || '').trim().toLowerCase();
  const sign = s.startsWith('-') ? '-' : '';
  return sign + s.replace(/[^a-z0-9./]+/g, '');
}

/** Does the student's typed answer mean the same as the expected one? */
export function matches(input: string, answer: string, accepted?: string[]): boolean {
  const given = String(input ?? '').trim();
  if (!given) return false;
  const candidates = [answer, ...(accepted || [])].filter(Boolean);

  for (const c of candidates) {
    if (textKey(given) && textKey(given) === textKey(c)) return true;
  }
  const gv = numericValue(given);
  if (gv === null) return false;
  for (const c of candidates) {
    const cv = numericValue(c);
    if (cv === null) continue;
    // Tolerance scales with magnitude so 0.333 vs 1/3 and 1e6 both behave.
    if (Math.abs(gv - cv) <= 1e-6 * Math.max(1, Math.abs(gv), Math.abs(cv))) return true;
  }
  return false;
}

// ── Marking ──────────────────────────────────────────────────

/** Has the student entered enough to submit? */
export function isComplete(q: Question, a: Answer | null): boolean {
  if (!a) return false;
  switch (q.format) {
    case 'mcq':
    case 'mistake':
      return a.kind === 'index' && a.value >= 0;
    case 'numeric':
    case 'blank':
      return a.kind === 'text' && a.value.trim().length > 0;
    case 'match':
      return a.kind === 'pairs' && a.value.length === q.left.length && a.value.every((v) => v !== null);
    case 'order':
      return a.kind === 'sequence' && a.value.length === q.steps.length;
    case 'tf':
      return a.kind === 'tf' && a.truth !== null && a.reason !== null;
  }
}

export function isCorrect(q: Question, a: Answer | null): boolean {
  if (!isComplete(q, a) || !a) return false;
  switch (q.format) {
    case 'mcq':
      return a.kind === 'index' && a.value === q.correct;
    case 'mistake':
      return a.kind === 'index' && a.value === q.wrongStep;
    case 'numeric':
      return a.kind === 'text' && matches(a.value, q.answer, q.accepted);
    case 'blank':
      return a.kind === 'text' && matches(a.value, q.answer, q.accepted);
    case 'match':
      return a.kind === 'pairs' && q.pairs.every((right, i) => a.value[i] === right);
    case 'order':
      // The student's sequence must be the identity: steps arrive in correct order.
      return a.kind === 'sequence' && a.value.every((stepIdx, pos) => stepIdx === pos);
    case 'tf':
      return a.kind === 'tf' && a.truth === q.isTrue && a.reason === q.correctReason;
  }
}

/** What the student answered, in words — for the mistake log and the retry card. */
export function answerText(q: Question, a: Answer | null): string {
  if (!a) return '';
  switch (q.format) {
    case 'mcq':
      return a.kind === 'index' ? q.opts[a.value] ?? '' : '';
    case 'mistake':
      return a.kind === 'index' ? `Step ${a.value + 1}` : '';
    case 'numeric':
    case 'blank':
      return a.kind === 'text' ? a.value.trim() : '';
    case 'match':
      return a.kind === 'pairs'
        ? q.left.map((l, i) => `${l} → ${a.value[i] === null ? '?' : q.right[a.value[i] as number]}`).join('; ')
        : '';
    case 'order':
      return a.kind === 'sequence' ? a.value.map((i) => q.steps[i]).join(' → ') : '';
    case 'tf':
      return a.kind === 'tf'
        ? `${a.truth ? 'True' : 'False'}${a.reason !== null ? ` — ${q.reasons[a.reason]}` : ''}`
        : '';
  }
}

/** The right answer, in words. */
export function correctText(q: Question): string {
  switch (q.format) {
    case 'mcq': return q.opts[q.correct] ?? '';
    case 'mistake': return `Step ${q.wrongStep + 1} — ${q.fix}`;
    case 'numeric': return q.unit ? `${q.answer} ${q.unit}` : q.answer;
    case 'blank': return q.answer;
    case 'match': return q.left.map((l, i) => `${l} → ${q.right[q.pairs[i]] ?? '?'}`).join('; ');
    case 'order': return q.steps.join(' → ');
    case 'tf': return `${q.isTrue ? 'True' : 'False'} — ${q.reasons[q.correctReason] ?? ''}`;
  }
}

// ── Validation ───────────────────────────────────────────────

const isStr = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
const strList = (v: unknown, min: number): string[] | null => {
  if (!Array.isArray(v)) return null;
  const out = v.filter(isStr).map((s) => s.trim());
  return out.length >= min && out.length === v.length ? out : null;
};
const idx = (v: unknown, len: number): number | null => {
  const n = typeof v === 'number' ? v : parseInt(String(v), 10);
  return Number.isInteger(n) && n >= 0 && n < len ? n : null;
};

/** Turn one raw generated question into a validated `Question`, or null.
 *
 *  Anything internally inconsistent — a match with mismatched columns, an
 *  out-of-range index, a mistake question whose bad step doesn't exist — is
 *  dropped here. A thin pool is recoverable; an unanswerable question is not.
 */
export function parseQuestion(raw: Record<string, unknown>, id: number): Question | null {
  if (!raw || typeof raw !== 'object') return null;
  const base = {
    id,
    q: isStr(raw.question) ? String(raw.question).trim() : '',
    explanation: isStr(raw.explanation) ? String(raw.explanation).trim() : '',
    topic: isStr(raw.topic) ? String(raw.topic).trim() : undefined,
    difficulty: (raw.difficulty === 'easy' || raw.difficulty === 'hard' ? raw.difficulty : 'medium') as Base['difficulty'],
    hint: isStr(raw.hint) ? String(raw.hint).trim() : undefined,
  };
  const format = String(raw.format || 'mcq') as QuizFormat;
  if (!base.q && format !== 'tf' && format !== 'blank') return null;

  switch (format) {
    case 'mcq': {
      const opts = strList(raw.options, 2);
      if (!opts) return null;
      const correct = idx(raw.answer, opts.length);
      if (correct === null) return null;
      const notes = strList(raw.option_notes, opts.length);
      return { ...base, format, opts, correct, optionNotes: notes?.length === opts.length ? notes : undefined };
    }
    case 'numeric': {
      if (!isStr(raw.answer)) return null;
      return {
        ...base, format,
        answer: String(raw.answer).trim(),
        accepted: strList(raw.accepted, 0) || undefined,
        unit: isStr(raw.unit) ? String(raw.unit).trim() : undefined,
      };
    }
    case 'blank': {
      const sentence = isStr(raw.sentence) ? String(raw.sentence).trim() : '';
      // The gap is the whole point of the format.
      if (!sentence || !sentence.includes('___') || !isStr(raw.answer)) return null;
      return {
        ...base, format, sentence,
        q: base.q || sentence,
        answer: String(raw.answer).trim(),
        accepted: strList(raw.accepted, 0) || undefined,
      };
    }
    case 'match': {
      const left = strList(raw.left, 3);
      const right = strList(raw.right, 3);
      if (!left || !right || left.length > right.length) return null;
      if (!Array.isArray(raw.pairs) || raw.pairs.length !== left.length) return null;
      const pairs = raw.pairs.map((p) => idx(p, right.length));
      if (pairs.some((p) => p === null)) return null;
      // Two left rows pointing at the same right item makes it unsolvable.
      if (new Set(pairs).size !== pairs.length) return null;
      return { ...base, format, left, right, pairs: pairs as number[] };
    }
    case 'order': {
      const steps = strList(raw.steps, 3);
      if (!steps || steps.length > 6) return null;
      return { ...base, format, steps };
    }
    case 'tf': {
      const statement = isStr(raw.statement) ? String(raw.statement).trim() : '';
      const reasons = strList(raw.reasons, 2);
      if (!statement || !reasons || reasons.length > 4) return null;
      const correctReason = idx(raw.correct_reason, reasons.length);
      if (correctReason === null || typeof raw.is_true !== 'boolean') return null;
      return { ...base, format, q: base.q || statement, statement, isTrue: raw.is_true, reasons, correctReason };
    }
    case 'mistake': {
      const steps = strList(raw.steps, 2);
      if (!steps || steps.length > 6) return null;
      const wrongStep = idx(raw.wrong_step, steps.length);
      if (wrongStep === null || !isStr(raw.fix)) return null;
      return { ...base, format, steps, wrongStep, fix: String(raw.fix).trim() };
    }
    default:
      return null;
  }
}

/** Validate a whole generated pool, keeping the order it came in. */
export function parsePool(raw: unknown): Question[] {
  if (!Array.isArray(raw)) return [];
  const out: Question[] = [];
  raw.forEach((item) => {
    const q = parseQuestion(item as Record<string, unknown>, out.length);
    if (q) out.push(q);
  });
  return out;
}

/** A deterministic shuffle for display order — seeded by the question id so the
 *  steps don't rearrange under the student on every re-render. */
export function shuffledIndices(n: number, seed: number): number[] {
  const arr = Array.from({ length: n }, (_, i) => i);
  let s = seed * 9301 + 49297;
  for (let i = n - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  // An "order the steps" question shown already in order isn't a question.
  if (n > 1 && arr.every((v, i) => v === i)) [arr[0], arr[1]] = [arr[1], arr[0]];
  return arr;
}
