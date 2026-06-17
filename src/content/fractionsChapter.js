// ─────────────────────────────────────────────────────────────
//  CHAPTER CONTENT — Fractions (CBSE Class 6/7 Maths)
//
//  This file is PURE DATA. No JSX, no styling. The ConceptScreen
//  renderer reads these objects and draws the UI. To add a new
//  chapter, copy this shape — you never touch the renderer.
//
//  Hierarchy:  Chapter → Skill → Card → (items / steps / scenes)
//  A "skill" is the atom of mastery: one thing a student can be
//  right or wrong about. Mastery, the quiz, and the prereq graph
//  all hang off the skill, never the chapter.
//
//  Card types the renderer understands:
//    definition | mistakes | realLife | examples | videos
//  Not every skill needs all five — pick what teaches best.
// ─────────────────────────────────────────────────────────────

export const FRACTIONS_CHAPTER = {
  id: 'fractions',
  title: 'Fractions',
  subject: 'Mathematics',
  grade: 'Class 7',
  board: 'CBSE',

  skills: [
    // ── 1. What is a fraction ────────────────────────────────
    {
      id: 'what-is-fraction',
      title: 'Parts of a whole',
      subtitle: 'What a fraction actually means',
      estMins: 4,
      prerequisites: [],
      cards: [
        {
          type: 'definition',
          eyebrow: 'WHAT IS IT',
          heading: 'Fractions in plain English',
          body: "A fraction shows how many parts of a whole you have. The bottom number (denominator) says how many equal parts the whole is split into. The top number (numerator) says how many of those parts you're talking about.\n\n½ means 1 out of 2 equal parts. ¾ means 3 out of 4 equal parts.",
          visual: { kind: 'pizza', slices: 4, filled: 3 },
        },
        {
          type: 'mistakes',
          eyebrow: 'COMMON MISTAKES',
          heading: 'Mistakes to avoid',
          items: [
            { title: 'Mixing up top and bottom', wrong: '3 parts of 4 = ⁴⁄₃', right: '3 parts of 4 = ¾', why: 'The numerator (top) is the parts you have; the denominator (bottom) is the total equal parts.' },
            { title: 'Unequal parts still counting', wrong: 'Any 4 pieces = quarters', right: 'Only 4 EQUAL pieces = quarters', why: 'A fraction only works when the whole is split into equal parts.' },
          ],
        },
        {
          type: 'realLife',
          eyebrow: 'WHERE IT APPEARS',
          heading: 'Fractions are everywhere',
          scenes: [
            { theme: 'saffron', label: 'AT HOME', title: '8 rotis, 5 people', body: 'How much does each person get? You need ⁸⁄₅ = 1⅗ rotis per person — and fractions to figure it out.', tag: '⁸⁄₅ each' },
            { theme: 'indigo', label: 'POCKET MONEY', title: 'Save ¾ of ₹80', body: 'You promised to save three-quarters of your allowance. How much can you spend? ¼ of ₹80 = ₹20.', tag: '₹20 to spend' },
            { theme: 'green', label: 'CRICKET', title: '40 overs bowled of 50', body: 'What fraction of the innings is done? ⁴⁰⁄₅₀ = ⅘ — four-fifths of the overs are gone.', tag: '⅘ complete' },
          ],
        },
        {
          type: 'examples',
          eyebrow: 'SOLVED EXAMPLES',
          heading: 'Reading a fraction',
          examples: [
            { q: 'A cake is cut into 8 equal slices. You eat 3. What fraction did you eat?', steps: [{ label: 'Total parts', detail: 'The whole is split into 8 equal parts → denominator = 8' }, { label: 'Parts taken', detail: 'You ate 3 of them → numerator = 3' }], answer: '⅜' },
            { q: 'Out of 5 equal strips of land, 2 are farmed. What fraction is farmed?', steps: [{ label: 'Total parts', detail: '5 equal strips → denominator = 5' }, { label: 'Parts used', detail: '2 farmed → numerator = 2' }], answer: '⅖' },
          ],
        },
        {
          type: 'videos',
          eyebrow: 'WATCH & LEARN',
          heading: 'Videos on this topic',
          videos: [
            { theme: 'purple', title: 'Introduction to Fractions — CBSE Class 7 Maths', channel: 'Khan Academy India', views: '2.4M views', duration: '12:34', url: 'https://www.youtube.com/results?search_query=introduction+to+fractions+class+7+CBSE' },
            { theme: 'blue', title: 'What is a Fraction? Parts of a Whole Explained', channel: 'Vedantu Class 7', views: '1.1M views', duration: '8:51', url: 'https://www.youtube.com/results?search_query=what+is+a+fraction+parts+of+a+whole' },
          ],
        },
      ],
      quiz: [
        { q: 'A pizza is cut into 6 equal slices. You eat 2. What fraction did you eat?', opts: ['⅓', '⅖', '½', '⅙'], correct: 0, explanation: '2 out of 6 = ²⁄₆, which simplifies to ⅓.' },
        { q: 'In the fraction ⁵⁄₈, what does the 8 tell you?', opts: ['How many parts you have', 'How many equal parts the whole is split into', 'The answer', 'Nothing'], correct: 1, explanation: 'The denominator (bottom) is the number of equal parts the whole is divided into.' },
        { q: 'Which fraction means "3 out of 4 equal parts"?', opts: ['¾', '⁴⁄₃', '⅓', '¼'], correct: 0, explanation: '3 parts out of 4 → numerator 3, denominator 4 → ¾.' },
      ],
    },

    // ── 2. Equivalent fractions ──────────────────────────────
    {
      id: 'equivalent-fractions',
      title: 'Equivalent fractions',
      subtitle: 'Same value, different form',
      estMins: 5,
      prerequisites: ['what-is-fraction'],
      cards: [
        {
          type: 'definition',
          eyebrow: 'WHAT IS IT',
          heading: 'Same amount, different numbers',
          body: 'Equivalent fractions look different but represent the exact same amount. ½ and ²⁄₄ and ⁴⁄₈ are all the same slice of pizza — just cut into more pieces.\n\nYou make an equivalent fraction by multiplying (or dividing) the top AND bottom by the same number.',
          visual: { kind: 'compareBars', a: { numerator: 1, denominator: 2 }, b: { numerator: 2, denominator: 4 } },
        },
        {
          type: 'mistakes',
          eyebrow: 'COMMON MISTAKES',
          heading: 'Mistakes to avoid',
          items: [
            { title: 'Multiplying only the top', wrong: '½ = ²⁄₂', right: '½ = ²⁄₄', why: 'Whatever you do to the numerator, you must do to the denominator too.' },
            { title: 'Adding instead of multiplying', wrong: '½ = (1+1)⁄(2+1) = ²⁄₃', right: '½ = (1×2)⁄(2×2) = ²⁄₄', why: 'Equivalent fractions come from multiplying, never adding.' },
          ],
        },
        {
          type: 'examples',
          eyebrow: 'SOLVED EXAMPLES',
          heading: 'Making equivalent fractions',
          examples: [
            { q: 'Write a fraction equal to ⅔ with denominator 9.', steps: [{ label: 'Find the multiplier', detail: '9 ÷ 3 = 3, so multiply by 3' }, { label: 'Multiply both', detail: '(2×3)⁄(3×3) = ⁶⁄₉' }], answer: '⁶⁄₉' },
            { q: 'Is ³⁄₄ equal to ⁶⁄₈?', steps: [{ label: 'Check the multiplier', detail: '6 ÷ 3 = 2 and 8 ÷ 4 = 2 — same multiplier' }, { label: 'Conclusion', detail: 'Both sides scaled by 2, so they are equal' }], answer: 'Yes, equal' },
          ],
        },
        {
          type: 'videos',
          eyebrow: 'WATCH & LEARN',
          heading: 'Videos on this topic',
          videos: [
            { theme: 'pink', title: 'Equivalent Fractions Made Easy', channel: 'Maths by NCERT', views: '760K views', duration: '7:42', url: 'https://www.youtube.com/results?search_query=equivalent+fractions+class+7' },
          ],
        },
      ],
      quiz: [
        { q: 'Which fraction is equivalent to ½?', opts: ['³⁄₆', '²⁄₃', '⅓', '³⁄₄'], correct: 0, explanation: '³⁄₆: multiply 1×3 and 2×3 → both scaled by 3, so ³⁄₆ = ½.' },
        { q: 'Write ⅖ with denominator 10.', opts: ['⁴⁄₁₀', '²⁄₁₀', '⁵⁄₁₀', '⁶⁄₁₀'], correct: 0, explanation: '10 ÷ 5 = 2, so multiply both by 2 → ⁴⁄₁₀.' },
        { q: 'Is ⁴⁄₆ equivalent to ⅔?', opts: ['Yes', 'No', 'Only sometimes', 'Cannot tell'], correct: 0, explanation: 'Divide ⁴⁄₆ by 2 → ⅔. They are equivalent.' },
      ],
    },

    // ── 3. Simplifying fractions ─────────────────────────────
    {
      id: 'simplifying',
      title: 'Simplifying fractions',
      subtitle: 'Reduce to lowest terms',
      estMins: 5,
      prerequisites: ['equivalent-fractions'],
      cards: [
        {
          type: 'definition',
          eyebrow: 'WHAT IS IT',
          heading: 'The simplest form',
          body: 'Simplifying means writing a fraction with the smallest possible numbers, without changing its value. You do this by dividing the top and bottom by their HCF (highest common factor).\n\n⁶⁄₈ → divide both by 2 → ¾. Same amount, cleaner numbers.',
          visual: { kind: 'fractionBars', numerator: 3, denominator: 4 },
        },
        {
          type: 'mistakes',
          eyebrow: 'COMMON MISTAKES',
          heading: 'Mistakes to avoid',
          items: [
            { title: 'Stopping too early', wrong: '⁸⁄₁₂ = ⁴⁄₆', right: '⁸⁄₁₂ = ⅔', why: 'Keep going until the only common factor is 1. ⁴⁄₆ still divides by 2.' },
            { title: 'Subtracting from top and bottom', wrong: '⁶⁄₈ = (6−2)⁄(8−2) = ⁴⁄₆', right: '⁶⁄₈ = (6÷2)⁄(8÷2) = ¾', why: 'You divide to simplify — never subtract.' },
          ],
        },
        {
          type: 'examples',
          eyebrow: 'SOLVED EXAMPLES',
          heading: 'Reducing step by step',
          examples: [
            { q: 'Simplify ⁶⁄₉.', steps: [{ label: 'Find HCF', detail: 'HCF of 6 and 9 is 3' }, { label: 'Divide both', detail: '6 ÷ 3 = 2 and 9 ÷ 3 = 3' }], answer: '⅔' },
            { q: 'Simplify ⁸⁄₁₂.', steps: [{ label: 'Find HCF', detail: 'HCF of 8 and 12 is 4' }, { label: 'Divide both', detail: '8 ÷ 4 = 2 and 12 ÷ 4 = 3' }], answer: '⅔' },
            { q: 'Simplify ¹⁵⁄₂₅.', steps: [{ label: 'Find HCF', detail: 'HCF of 15 and 25 is 5' }, { label: 'Divide both', detail: '15 ÷ 5 = 3 and 25 ÷ 5 = 5' }], answer: '⅗' },
          ],
        },
        {
          type: 'videos',
          eyebrow: 'WATCH & LEARN',
          heading: 'Videos on this topic',
          videos: [
            { theme: 'indigo', title: 'Simplifying Fractions Using HCF', channel: 'Khan Academy India', views: '540K views', duration: '6:20', url: 'https://www.youtube.com/results?search_query=simplifying+fractions+HCF+class+7' },
          ],
        },
      ],
      quiz: [
        { q: 'Simplify ⁶⁄₉.', opts: ['⅔', '½', '¾', '⅓'], correct: 0, explanation: 'HCF(6,9)=3. Divide both: 6÷3=2, 9÷3=3 → ⅔.' },
        { q: 'Simplify ¹⁰⁄₁₅.', opts: ['⅔', '½', '⅗', '¾'], correct: 0, explanation: 'HCF(10,15)=5. 10÷5=2, 15÷5=3 → ⅔.' },
        { q: 'Which fraction is already in simplest form?', opts: ['⅗', '⁴⁄₆', '⁶⁄₈', '²⁄₄'], correct: 0, explanation: '⅗ has no common factor other than 1. The others all reduce.' },
      ],
    },

    // ── 4. Comparing fractions ───────────────────────────────
    {
      id: 'comparing',
      title: 'Comparing fractions',
      subtitle: 'Which one is bigger?',
      estMins: 6,
      prerequisites: ['equivalent-fractions'],
      cards: [
        {
          type: 'definition',
          eyebrow: 'WHAT IS IT',
          heading: 'Bigger or smaller?',
          body: 'To compare fractions you need the pieces to be the same size — that means a common denominator. Once the bottoms match, the one with the bigger top is bigger.\n\nThink of it like comparing slices: ⅗ vs ½ is hard, but ⁶⁄₁₀ vs ⁵⁄₁₀ is obvious.',
          visual: { kind: 'compareBars', a: { numerator: 3, denominator: 5 }, b: { numerator: 1, denominator: 2 } },
        },
        {
          type: 'mistakes',
          eyebrow: 'COMMON MISTAKES',
          heading: 'Mistakes to avoid',
          items: [
            { title: 'Bigger denominator = bigger fraction', wrong: '⅕ > ½ because 5 > 2', right: '½ > ⅕', why: 'More pieces means each piece is smaller. ⅕ is tiny next to ½.' },
            { title: 'Comparing tops without matching bottoms', wrong: '⅗ > ¾ because 3 = 3', right: 'Make denominators equal first', why: 'You can only compare numerators when the denominators are the same.' },
          ],
        },
        {
          type: 'examples',
          eyebrow: 'SOLVED EXAMPLES',
          heading: 'Comparing step by step',
          examples: [
            { q: 'Which is larger: ⅗ or ½?', steps: [{ label: 'Common denominator', detail: 'LCM of 5 and 2 is 10' }, { label: 'Convert both', detail: '⅗ = ⁶⁄₁₀ and ½ = ⁵⁄₁₀' }, { label: 'Compare tops', detail: '6 > 5' }], answer: '⅗ is bigger' },
            { q: 'Which is larger: ⅔ or ¾?', steps: [{ label: 'Common denominator', detail: 'LCM of 3 and 4 is 12' }, { label: 'Convert both', detail: '⅔ = ⁸⁄₁₂ and ¾ = ⁹⁄₁₂' }, { label: 'Compare tops', detail: '9 > 8' }], answer: '¾ is bigger' },
          ],
        },
        {
          type: 'videos',
          eyebrow: 'WATCH & LEARN',
          heading: 'Videos on this topic',
          videos: [
            { theme: 'blue', title: 'Comparing Fractions — Common Denominator Method', channel: 'Vedantu Class 7', views: '680K views', duration: '10:05', url: 'https://www.youtube.com/results?search_query=comparing+fractions+class+7+CBSE' },
          ],
        },
      ],
      quiz: [
        { q: 'Which is larger: ⅗ or ½?', opts: ['⅗', '½', 'Equal', 'Cannot compare'], correct: 0, explanation: 'Common denominator 10: ⅗ = ⁶⁄₁₀, ½ = ⁵⁄₁₀. So ⅗ is larger.' },
        { q: 'Which is larger: ⅕ or ½?', opts: ['½', '⅕', 'Equal', 'Cannot tell'], correct: 0, explanation: 'More pieces = smaller pieces. ½ is much bigger than ⅕.' },
        { q: 'Which is larger: ⅔ or ¾?', opts: ['¾', '⅔', 'Equal', 'Cannot compare'], correct: 0, explanation: 'LCM 12: ⅔ = ⁸⁄₁₂, ¾ = ⁹⁄₁₂. So ¾ is larger.' },
      ],
    },

    // ── 5. Adding & subtracting like fractions ──────────────
    {
      id: 'add-like',
      title: 'Adding like fractions',
      subtitle: 'Same denominator',
      estMins: 5,
      prerequisites: ['what-is-fraction'],
      cards: [
        {
          type: 'definition',
          eyebrow: 'WHAT IS IT',
          heading: 'When the bottoms match',
          body: 'When two fractions have the same denominator, the pieces are already the same size. So you just add (or subtract) the numerators and keep the denominator unchanged.\n\n²⁄₇ + ³⁄₇ = ⁵⁄₇. The bottom never changes — it only tells you the piece size.',
          visual: { kind: 'fractionBars', numerator: 5, denominator: 7 },
        },
        {
          type: 'mistakes',
          eyebrow: 'COMMON MISTAKES',
          heading: 'Mistakes to avoid',
          items: [
            { title: 'Adding the denominators', wrong: '²⁄₇ + ³⁄₇ = ⁵⁄₁₄', right: '²⁄₇ + ³⁄₇ = ⁵⁄₇', why: 'The denominator is the piece size — it stays the same when bottoms match.' },
            { title: 'Forgetting to simplify the answer', wrong: '¹⁄₆ + ³⁄₆ = ⁴⁄₆', right: '⁴⁄₆ = ⅔', why: 'Always reduce the final answer to lowest terms.' },
          ],
        },
        {
          type: 'examples',
          eyebrow: 'SOLVED EXAMPLES',
          heading: 'Working it out',
          examples: [
            { q: 'What is ²⁄₉ + ⁴⁄₉?', steps: [{ label: 'Bottoms match', detail: 'Both are ninths — keep denominator 9' }, { label: 'Add tops', detail: '2 + 4 = 6' }], answer: '⁶⁄₉ = ⅔' },
            { q: 'What is ⁵⁄₈ − ¹⁄₈?', steps: [{ label: 'Bottoms match', detail: 'Both are eighths — keep denominator 8' }, { label: 'Subtract tops', detail: '5 − 1 = 4' }, { label: 'Simplify', detail: '⁴⁄₈ = ½' }], answer: '½' },
          ],
        },
        {
          type: 'videos',
          eyebrow: 'WATCH & LEARN',
          heading: 'Videos on this topic',
          videos: [
            { theme: 'green', title: 'Adding Fractions with the Same Denominator', channel: 'Maths by NCERT', views: '430K views', duration: '5:33', url: 'https://www.youtube.com/results?search_query=adding+like+fractions+same+denominator' },
          ],
        },
      ],
      quiz: [
        { q: 'What is ²⁄₇ + ³⁄₇?', opts: ['⁵⁄₇', '⁵⁄₁₄', '⁶⁄₇', '¹⁄₇'], correct: 0, explanation: 'Bottoms match → add tops: 2+3=5, keep 7 → ⁵⁄₇.' },
        { q: 'What is ⁵⁄₆ − ¹⁄₆?', opts: ['⅔', '⁴⁄₆', '⁴⁄₁₂', '⅙'], correct: 0, explanation: '5−1=4 → ⁴⁄₆, which simplifies to ⅔.' },
        { q: 'What is ¾ + ¼?', opts: ['1', '⁴⁄₈', '½', '⁴⁄₄ unsimplified only'], correct: 0, explanation: '3+1=4 → ⁴⁄₄ = 1 whole.' },
      ],
    },

    // ── 6. Adding & subtracting unlike fractions (FULL) ─────
    {
      id: 'add-unlike',
      title: 'Adding unlike fractions',
      subtitle: 'Different denominators',
      estMins: 7,
      prerequisites: ['add-like', 'equivalent-fractions'],
      cards: [
        {
          type: 'definition',
          eyebrow: 'WHAT IS IT',
          heading: 'When the bottoms are different',
          body: "You can't add fractions until the pieces are the same size. So when denominators differ, you first find a common denominator (the LCM), convert both fractions, then add the numerators.\n\n½ + ¼: make both quarters → ²⁄₄ + ¼ = ¾.",
          visual: { kind: 'pizza', slices: 4, filled: 3 },
        },
        {
          type: 'mistakes',
          eyebrow: 'COMMON MISTAKES',
          heading: 'Mistakes to avoid',
          items: [
            { title: 'Adding without a common denominator', wrong: '½ + ¼ = ²⁄₆', right: '½ + ¼ = ¾', why: 'You can only add when the pieces are the same size. Find the LCM first.' },
            { title: 'Adding the denominators too', wrong: '⅓ + ½ = ²⁄₅', right: '⅓ + ½ = ⁵⁄₆', why: 'Convert to sixths first: ²⁄₆ + ³⁄₆ = ⁵⁄₆. The bottom is the piece size.' },
          ],
        },
        {
          type: 'realLife',
          eyebrow: 'WHERE IT APPEARS',
          heading: 'When you actually add fractions',
          scenes: [
            { theme: 'saffron', label: 'COOKING', title: '½ cup + ⅓ cup flour', body: 'A recipe needs half a cup plus a third of a cup. How much total? ³⁄₆ + ²⁄₆ = ⅚ of a cup.', tag: '⅚ cup' },
            { theme: 'indigo', label: 'STUDY TIME', title: '¼ hour + ⅔ hour', body: 'You study maths for a quarter hour and science for two-thirds of an hour. ³⁄₁₂ + ⁸⁄₁₂ = ¹¹⁄₁₂ hour.', tag: '¹¹⁄₁₂ hr' },
          ],
        },
        {
          type: 'examples',
          eyebrow: 'SOLVED EXAMPLES',
          heading: 'Adding step by step',
          examples: [
            { q: 'What is ½ + ¼?', steps: [{ label: 'Find LCM', detail: 'LCM of 2 and 4 is 4' }, { label: 'Convert', detail: '½ becomes ²⁄₄' }, { label: 'Add tops', detail: '²⁄₄ + ¼ = ¾' }], answer: '¾' },
            { q: 'What is ⅓ + ½?', steps: [{ label: 'Find LCM', detail: 'LCM of 3 and 2 is 6' }, { label: 'Convert both', detail: '⅓ = ²⁄₆ and ½ = ³⁄₆' }, { label: 'Add tops', detail: '2 + 3 = 5' }], answer: '⅚' },
            { q: 'What is ¾ − ⅖?', steps: [{ label: 'Find LCM', detail: 'LCM of 4 and 5 is 20' }, { label: 'Convert both', detail: '¾ = ¹⁵⁄₂₀ and ⅖ = ⁸⁄₂₀' }, { label: 'Subtract tops', detail: '15 − 8 = 7' }], answer: '⁷⁄₂₀' },
          ],
        },
        {
          type: 'videos',
          eyebrow: 'WATCH & LEARN',
          heading: 'Videos on this topic',
          videos: [
            { theme: 'pink', title: 'Adding & Subtracting Unlike Fractions — Step by Step', channel: 'Maths by NCERT', views: '890K views', duration: '9:18', url: 'https://www.youtube.com/results?search_query=adding+unlike+fractions+LCM+class+7' },
            { theme: 'purple', title: 'LCM Method for Fractions Explained', channel: 'Khan Academy India', views: '1.3M views', duration: '11:47', url: 'https://www.youtube.com/results?search_query=LCM+method+adding+fractions' },
          ],
        },
      ],
      quiz: [
        { q: 'What is ½ + ¼?', opts: ['¾', '⅔', '⅜', '²⁄₆'], correct: 0, explanation: 'LCM(2,4)=4. ½ → ²⁄₄, then ²⁄₄ + ¼ = ¾.' },
        { q: 'What is ⅓ + ½?', opts: ['⅚', '²⁄₅', '⅖', '⁴⁄₆'], correct: 0, explanation: 'LCM(3,2)=6. ⅓=²⁄₆, ½=³⁄₆ → ⁵⁄₆.' },
        { q: 'What is ¾ − ⅖?', opts: ['⁷⁄₂₀', '¹⁄₂₀', '½', '⅖'], correct: 0, explanation: 'LCM(4,5)=20. ¾=¹⁵⁄₂₀, ⅖=⁸⁄₂₀ → ⁷⁄₂₀.' },
      ],
    },

    // ── 7. Mixed numbers & improper fractions ────────────────
    {
      id: 'mixed-numbers',
      title: 'Mixed & improper',
      subtitle: 'Numbers bigger than one whole',
      estMins: 6,
      prerequisites: ['what-is-fraction'],
      cards: [
        {
          type: 'definition',
          eyebrow: 'WHAT IS IT',
          heading: 'Two ways to write the same thing',
          body: 'An improper fraction has a top bigger than its bottom, like ⁷⁄₃. A mixed number writes that as a whole number plus a fraction: 2⅓.\n\nThey are the same amount. ⁷⁄₃ means "seven thirds" — three thirds make 1, so seven thirds make 2 wholes and ⅓ left over.',
          visual: { kind: 'fractionBars', numerator: 1, denominator: 3 },
        },
        {
          type: 'mistakes',
          eyebrow: 'COMMON MISTAKES',
          heading: 'Mistakes to avoid',
          items: [
            { title: 'Multiplying the wrong numbers', wrong: '2⅓ = (2×3)⁄3 = ⁶⁄₃', right: '2⅓ = (2×3 + 1)⁄3 = ⁷⁄₃', why: 'Multiply whole × denominator, then ADD the numerator.' },
            { title: 'Adding the whole to the numerator', wrong: '2⅓ = ³⁄₃', right: '2⅓ = ⁷⁄₃', why: 'The whole number 2 is worth ⁶⁄₃, not 2 added to the top.' },
          ],
        },
        {
          type: 'examples',
          eyebrow: 'SOLVED EXAMPLES',
          heading: 'Converting both ways',
          examples: [
            { q: 'Convert 2⅓ to an improper fraction.', steps: [{ label: 'Whole × bottom', detail: '2 × 3 = 6' }, { label: 'Add the top', detail: '6 + 1 = 7' }, { label: 'Keep the bottom', detail: 'Denominator stays 3' }], answer: '⁷⁄₃' },
            { q: 'Convert ⁹⁄₄ to a mixed number.', steps: [{ label: 'Divide', detail: '9 ÷ 4 = 2 remainder 1' }, { label: 'Build it', detail: '2 wholes, remainder 1 over 4' }], answer: '2¼' },
          ],
        },
        {
          type: 'videos',
          eyebrow: 'WATCH & LEARN',
          heading: 'Videos on this topic',
          videos: [
            { theme: 'blue', title: 'Mixed Numbers & Improper Fractions', channel: 'Vedantu Class 7', views: '720K views', duration: '8:09', url: 'https://www.youtube.com/results?search_query=mixed+numbers+improper+fractions+class+7' },
          ],
        },
      ],
      quiz: [
        { q: 'Convert 2⅓ to an improper fraction.', opts: ['⁷⁄₃', '⁶⁄₃', '⁵⁄₃', '³⁄₃'], correct: 0, explanation: '(2×3)+1 = 7, keep denominator 3 → ⁷⁄₃.' },
        { q: 'Convert ⁹⁄₄ to a mixed number.', opts: ['2¼', '2¾', '1¼', '3¼'], correct: 0, explanation: '9 ÷ 4 = 2 remainder 1 → 2¼.' },
        { q: 'Which of these is an improper fraction?', opts: ['⁵⁄₃', '⅔', '¾', '⅖'], correct: 0, explanation: '⁵⁄₃ has a top bigger than its bottom, so it is improper.' },
      ],
    },
  ],
};

// ── Lookup helpers ─────────────────────────────────────────
export function getSkill(skillId) {
  return FRACTIONS_CHAPTER.skills.find(s => s.id === skillId) || FRACTIONS_CHAPTER.skills[0];
}

export function getChapterSkills() {
  return FRACTIONS_CHAPTER.skills;
}
