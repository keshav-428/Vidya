import React, { useState, useEffect } from 'react';
import VIcon from '../../prototype/icons';
import { VTopBar, VSoftBackdrop } from '../../prototype/shared';
import api from '../../api/vidya';

const DIAG_TOPICS = ['Fractions', 'Algebra', 'Mensuration', 'Number sense'];
const LETTERS = ['a', 'b', 'c', 'd'];

const FALLBACK_Qs = [
  { q: 'What is ½ + ⅓?', opts: [{ id: 'a', l: '⅖' }, { id: 'b', l: '⅚' }, { id: 'c', l: '⅔' }, { id: 'd', l: '⅙' }], correct: 'b', topic: 'Fractions' },
  { q: 'Solve: 2x − 5 = 11', opts: [{ id: 'a', l: 'x = 6' }, { id: 'b', l: 'x = 7' }, { id: 'c', l: 'x = 8' }, { id: 'd', l: 'x = 3' }], correct: 'c', topic: 'Algebra' },
  { q: 'Area of a circle, r = 7', opts: [{ id: 'a', l: '154' }, { id: 'b', l: '132' }, { id: 'c', l: '196' }, { id: 'd', l: '49π' }], correct: 'a', topic: 'Mensuration' },
  { q: 'HCF of 24 and 36', opts: [{ id: 'a', l: '4' }, { id: 'b', l: '6' }, { id: 'c', l: '12' }, { id: 'd', l: '24' }], correct: 'c', topic: 'Number sense' },
];

export default function DiagnosticQuizScreen({ go, state, set }) {
  const grade = api.toGrade(state?.classLevel);
  // LLM-generated diagnostic questions; static set is the fallback.
  const [Qs, setQs] = useState(FALLBACK_Qs);

  useEffect(() => {
    let alive = true;
    api.generateQuiz({ topics: DIAG_TOPICS, grade, language: state?.language || 'English', difficulty: 'Medium' })
      .then((items) => {
        const mapped = (items || [])
          .filter((it) => it && it.question && Array.isArray(it.options) && it.options.length >= 2)
          .slice(0, 4)
          .map((it, i) => ({
            q: it.question,
            opts: it.options.slice(0, 4).map((l, j) => ({ id: LETTERS[j], l })),
            correct: LETTERS[it.answer ?? 0],
            topic: DIAG_TOPICS[i] || 'Diagnostic',
          }));
        if (alive && mapped.length) setQs(mapped);
      })
      .catch(() => {});
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grade, state?.language]);

  const idx = state?.qIdx || 0;
  const Q = Qs[idx] || Qs[0];
  const [picked, setPicked] = useState(null);
  const [revealed, setRevealed] = useState(false);

  const onPick = (id) => { if (revealed) return; setPicked(id); setTimeout(() => setRevealed(true), 160); };
  const onNext = () => {
    setPicked(null);
    setRevealed(false);
    if (idx >= Qs.length - 1) { set && set({ qIdx: 0 }); go('diagnostic-results'); }
    else { set && set({ qIdx: idx + 1 }); }
  };

  return (
    <VSoftBackdrop variant="cool">
      <VTopBar showBack onBack={() => go('home-post-diag')} transparent />
      <div style={{ padding: '72px 24px 32px', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        <div className="v-progress" style={{ marginBottom: 14 }}>
          <div className="v-progress-fill" style={{ width: `${((idx + 1) / Qs.length) * 100}%` }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 48 }}>
          <span style={{ fontSize: 11, color: 'var(--muted-2)', letterSpacing: '0.05em' }}>Quick check · {idx + 1} of {Qs.length}</span>
          <div style={{ padding: '4px 12px', background: '#FFFBEB', borderRadius: 9999, fontSize: 11, fontWeight: 700, color: '#8B4513', letterSpacing: '0.04em' }}>{Q.topic}</div>
        </div>

        <h1 className="v-h1 v-enter" key={idx} style={{ fontSize: 30, textAlign: 'center', color: 'var(--ink-2)', marginBottom: 8 }}>{Q.q}</h1>
        <div style={{ textAlign: 'center', fontSize: 14, color: 'var(--muted-2)', marginBottom: 36 }}>Select the correct answer to continue.</div>

        <div className="v-enter" key={`opts-${idx}`} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {Q.opts.map(opt => (
            <div key={opt.id} className="v-tap" onClick={() => onPick(opt.id)} style={{
              padding: '24px 20px', borderRadius: 20,
              border: revealed && opt.id === Q.correct ? '1.5px solid var(--accent-success)'
                : revealed && opt.id === picked && opt.id !== Q.correct ? '1.5px solid var(--accent-warn)'
                  : picked === opt.id && !revealed ? '1.5px solid var(--ink)'
                    : '1px solid var(--border)',
              background: revealed && opt.id === Q.correct ? '#ECFDF5'
                : revealed && opt.id === picked && opt.id !== Q.correct ? '#FFF7ED' : '#fff',
              fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 24, textAlign: 'center', color: 'var(--ink)',
              transition: 'all .2s ease',
              minHeight: 80, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{opt.l}</div>
          ))}
        </div>

        {revealed && (
          <div className="v-enter-fade v-card" style={{ marginTop: 20, background: 'rgba(255,255,255,0.7)' }}>
            <div className="v-eyebrow-sm" style={{ color: picked === Q.correct ? 'var(--accent-success)' : 'var(--accent-warn)', marginBottom: 6 }}>
              {picked === Q.correct ? 'Correct' : 'Not quite'}
            </div>
            <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 15, color: 'var(--ink)', lineHeight: 1.45 }}>
              {picked === Q.correct ? 'Nicely reasoned. Onward.' : "We'll revisit this gently when we cover the topic."}
            </div>
          </div>
        )}

        <div style={{ flex: 1, minHeight: 24 }} />
        <button className="v-btn-primary v-tap" onClick={onNext} disabled={!revealed} style={{ opacity: revealed ? 1 : 0.4 }}>
          {idx >= Qs.length - 1 ? 'See results' : 'Next'} <VIcon name="arrow-right" size={14} color="#fff" />
        </button>
      </div>
    </VSoftBackdrop>
  );
}
