import React, { useState } from 'react';
import { CheckCircle2, XCircle, Loader2, Sparkles } from 'lucide-react';
import { API_URL } from '../../config';

const QUESTIONS = {
  6: [
    { topic: 'Fractions', question: 'What is ½ + ⅓?', options: ['2/5', '5/6', '3/5', '1/6'], answer: 1 },
    { topic: 'Decimals', question: '0.4 × 5 = ?', options: ['0.20', '20', '2.0', '0.02'], answer: 2 },
    { topic: 'Integers', question: '−3 + 9 = ?', options: ['−12', '6', '12', '−6'], answer: 1 },
    { topic: 'Mensuration', question: 'Area of a rectangle 6 cm × 4 cm?', options: ['10 cm²', '20 cm²', '48 cm²', '24 cm²'], answer: 3 },
    { topic: 'Ratio & Proportion', question: 'Simplest form of 18 : 24?', options: ['9 : 12', '3 : 4', '6 : 8', '2 : 3'], answer: 1 },
    { topic: 'Basic Algebra', question: 'If x + 7 = 15, what is x?', options: ['22', '105', '8', '7'], answer: 2 },
    { topic: 'Geometry', question: 'Angles of a triangle always add up to?', options: ['90°', '270°', '360°', '180°'], answer: 3 },
    { topic: 'Numbers', question: 'LCM of 4 and 6 is?', options: ['24', '12', '2', '4'], answer: 1 },
  ],
  7: [
    { topic: 'Integers', question: '(−8) × (−5) = ?', options: ['−40', '−13', '40', '13'], answer: 2 },
    { topic: 'Fractions', question: '⅔ ÷ 4/9 = ?', options: ['8/27', '3/2', '2/4', '1/2'], answer: 1 },
    { topic: 'Simple Equations', question: '3x − 4 = 11, x = ?', options: ['3', '15', '7/3', '5'], answer: 3 },
    { topic: 'Ratio & Proportion', question: 'If 3 : x = 12 : 20, then x = ?', options: ['4', '8', '5', '3'], answer: 2 },
    { topic: 'Lines & Angles', question: 'Vertically opposite angles are always?', options: ['Supplementary', 'Complementary', 'Adjacent', 'Equal'], answer: 3 },
    { topic: 'Mensuration', question: 'Area of a triangle with base 8 cm, height 5 cm?', options: ['40 cm²', '13 cm²', '20 cm²', '80 cm²'], answer: 2 },
    { topic: 'Exponents', question: '2³ × 2² = ?', options: ['4⁵', '2⁶', '2¹', '2⁵'], answer: 3 },
    { topic: 'Algebraic Expressions', question: 'Simplify: 3x + 2y − x + y', options: ['4x + y', '2x + y', '2x + 3y', '3x + 3y'], answer: 2 },
  ],
  8: [
    { topic: 'Rational Numbers', question: '(−2/3) × (9/4) = ?', options: ['3/2', '2/3', '−2/3', '−3/2'], answer: 3 },
    { topic: 'Squares & Square Roots', question: '√169 = ?', options: ['12', '11', '14', '13'], answer: 3 },
    { topic: 'Linear Equations', question: '2(x + 3) = 10, x = ?', options: ['8', '5', '4', '2'], answer: 3 },
    { topic: 'Algebraic Identities', question: '(a + b)² expands to?', options: ['a² + b²', '2a + 2b', 'a² − 2ab + b²', 'a² + 2ab + b²'], answer: 3 },
    { topic: 'Mensuration', question: 'Volume of a cube with side 3 cm?', options: ['9 cm³', '36 cm³', '27 cm³', '18 cm³'], answer: 2 },
    { topic: 'Exponents', question: '2⁻³ = ?', options: ['−8', '8', '−1/8', '1/8'], answer: 3 },
    { topic: 'Percentage', question: '20% of 250 = ?', options: ['25', '20', '12.5', '50'], answer: 3 },
    { topic: 'Factorisation', question: 'Factorise: x² − 9', options: ['(x − 3)²', '(x − 3)(x − 3)', '(x + 9)(x − 9)', '(x + 3)(x − 3)'], answer: 3 },
  ],
};

export default function DiagnosticView({ selectedClass, userId, lang, t, onComplete }) {
  const classNum = parseInt(selectedClass?.match(/\d+/)?.[0]) || 7;
  const questions = QUESTIONS[classNum] || QUESTIONS[7];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [done, setDone] = useState(false);
  const [weakTopics, setWeakTopics] = useState([]);
  const [strongTopics, setStrongTopics] = useState([]);
  const [saving, setSaving] = useState(false);

  const handleSelect = (optionIndex) => {
    if (selected !== null) return;
    setSelected(optionIndex);

    const q = questions[currentIndex];
    const isCorrect = optionIndex === q.answer;
    const newAnswers = [...answers, { topic: q.topic, correct: isCorrect }];
    setAnswers(newAnswers);

    setTimeout(() => {
      if (currentIndex + 1 >= questions.length) {
        const topicMap = {};
        newAnswers.forEach(({ topic, correct }) => {
          if (!topicMap[topic]) topicMap[topic] = { correct: 0, total: 0 };
          topicMap[topic].total++;
          if (correct) topicMap[topic].correct++;
        });
        const weak = Object.entries(topicMap).filter(([, v]) => v.correct / v.total < 0.6).map(([k]) => k);
        const strong = Object.entries(topicMap).filter(([, v]) => v.correct / v.total >= 0.6).map(([k]) => k);
        setWeakTopics(weak);
        setStrongTopics(strong);
        setDone(true);
        saveDiagnostic(newAnswers, weak);
      } else {
        setCurrentIndex(currentIndex + 1);
        setSelected(null);
      }
    }, 900);
  };

  const saveDiagnostic = async (allAnswers, weak) => {
    setSaving(true);
    try {
      await fetch(`${API_URL}/diagnostic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          weak_topics: weak,
          score: allAnswers.filter(a => a.correct).length,
          total: allAnswers.length,
        }),
      });
    } catch {}
    setSaving(false);
  };

  if (done) {
    const score = answers.filter(a => a.correct).length;
    return (
      <div className="flex-1 flex flex-col items-center animate-in fade-in duration-500 pt-4">
        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-indigo-100">
          <Sparkles size={28} color="white" strokeWidth={2.5} />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-1 text-center">
          {t.diagnosticDone || "Your profile is ready!"}
        </h2>
        <p className="text-sm text-slate-400 font-bold mb-8 text-center">
          {score}/{questions.length} {t.diagnosticCorrect || "correct"}
        </p>

        {weakTopics.length > 0 && (
          <div className="w-full bg-amber-50 border border-amber-100 rounded-3xl p-5 mb-4">
            <p className="text-xs font-black text-amber-700 uppercase tracking-widest mb-3">
              {t.diagnosticNeedsWork || "Areas to strengthen"}
            </p>
            <div className="flex flex-wrap gap-2">
              {weakTopics.map(topic => (
                <span key={topic} className="bg-amber-100 text-amber-800 text-xs font-black px-3 py-1.5 rounded-xl uppercase tracking-wide">
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}

        {strongTopics.length > 0 && (
          <div className="w-full bg-green-50 border border-green-100 rounded-3xl p-5 mb-8">
            <p className="text-xs font-black text-green-700 uppercase tracking-widest mb-3">
              {t.diagnosticStrong || "You're strong in"}
            </p>
            <div className="flex flex-wrap gap-2">
              {strongTopics.map(topic => (
                <span key={topic} className="bg-green-100 text-green-800 text-xs font-black px-3 py-1.5 rounded-xl uppercase tracking-wide">
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={() => onComplete(weakTopics)}
          disabled={saving}
          className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl transition-all active:scale-[0.98] uppercase tracking-widest text-sm flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 className="animate-spin" size={18} /> : (t.startLearning || "Let's Go!")}
        </button>
      </div>
    );
  }

  const q = questions[currentIndex];
  const progress = ((currentIndex) / questions.length) * 100;

  return (
    <div className="flex-1 flex flex-col animate-in fade-in duration-300">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
            {t.diagnosticTitle || "Quick Check"}
          </p>
          <p className="text-xs font-black text-slate-400">
            {currentIndex + 1}/{questions.length}
          </p>
        </div>
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Topic badge */}
      <span className="self-start bg-indigo-50 text-indigo-600 text-[10px] font-black px-3 py-1 rounded-xl uppercase tracking-widest mb-4">
        {q.topic}
      </span>

      {/* Question */}
      <p className="text-xl font-black text-slate-900 leading-snug mb-8">
        {q.question}
      </p>

      {/* Options */}
      <div className="space-y-3">
        {q.options.map((option, i) => {
          let style = 'border-gray-100 bg-white text-slate-700';
          if (selected !== null) {
            if (i === q.answer) style = 'border-green-400 bg-green-50 text-green-800';
            else if (i === selected && i !== q.answer) style = 'border-red-300 bg-red-50 text-red-700';
            else style = 'border-gray-100 bg-white text-slate-300';
          }
          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              className={`w-full px-5 py-4 border-2 rounded-2xl font-bold text-sm text-left flex items-center justify-between transition-all active:scale-[0.98] ${style}`}
            >
              <span>{option}</span>
              {selected !== null && i === q.answer && <CheckCircle2 size={18} className="text-green-500 shrink-0" />}
              {selected !== null && i === selected && i !== q.answer && <XCircle size={18} className="text-red-400 shrink-0" />}
            </button>
          );
        })}
      </div>

      <p className="text-center text-xs text-slate-300 font-bold mt-6 uppercase tracking-widest">
        {t.diagnosticSub || "Tap an answer to continue"}
      </p>
    </div>
  );
}
