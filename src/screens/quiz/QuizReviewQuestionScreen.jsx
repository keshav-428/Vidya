import React, { useState } from 'react';
import VIcon from '../../prototype/icons';
import { VTopBar } from '../../prototype/shared';

const QUIZ_REVIEW_BANK = [
  {
    q: '½ + ⅓', topic: 'Fractions', marks: 1, your: '⅚', correct: '⅚', ok: true,
    explain: 'Common denominator is 6. ½ = 3/6 and ⅓ = 2/6, so the sum is 5/6.',
    steps: ['Find LCM of 2 and 3 → 6.', 'Rewrite: 3/6 + 2/6.', 'Add numerators → 5/6.'],
  },
  {
    q: '2x − 5 = 11', topic: 'Algebra', marks: 2, your: 'x = 8', correct: 'x = 8', ok: true,
    explain: 'Add 5 to both sides, then divide by 2.',
    steps: ['2x − 5 + 5 = 11 + 5', '2x = 16', 'x = 8'],
  },
  {
    q: 'Area of a circle, r = 7', topic: 'Mensuration', marks: 2, your: '132', correct: '154', ok: false,
    explain: 'Area = πr². With r = 7 and π ≈ 22/7, the result is 154 cm².',
    steps: ['Use A = πr².', 'r² = 49.', 'A = (22/7) × 49 = 22 × 7 = 154.'],
    misread: 'You used 2πr (circumference) instead of πr².',
  },
  {
    q: 'HCF of 24 and 36', topic: 'Number sense', marks: 1, your: '12', correct: '12', ok: true,
    explain: 'Both 24 and 36 share factors 2×2×3 = 12.',
    steps: ['24 = 2³ × 3', '36 = 2² × 3²', 'HCF = 2² × 3 = 12'],
  },
];

export default function QuizReviewQuestionScreen({ go, state, set }) {
  const total = QUIZ_REVIEW_BANK.length;
  const startIdx = Math.min(Math.max(0, state?.reviewIdx || 0), total - 1);
  const [idx, setIdx] = useState(startIdx);
  const Q = QUIZ_REVIEW_BANK[idx];
  const back = state?.reviewFrom || 'quiz-result-summary';

  const goPrev = () => setIdx(i => Math.max(0, i - 1));
  const goNext = () => setIdx(i => Math.min(total - 1, i + 1));

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)', position: 'relative' }}>
      <VTopBar transparent showBack onBack={() => { set && set({ reviewIdx: 0 }); go(back); }}
        right={<span style={{ fontSize: 12, color: 'var(--muted)', letterSpacing: '0.04em' }}>{idx + 1} / {total}</span>} />
      <div style={{ padding: '72px 24px 32px', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <span className="v-eyebrow">Review</span>
          <span style={{ width: 3, height: 3, borderRadius: 9999, background: 'var(--muted-2)' }} />
          <span style={{ fontSize: 11, letterSpacing: '0.05em', color: 'var(--muted-2)', textTransform: 'uppercase' }}>{Q.topic} · {Q.marks} mark{Q.marks > 1 ? 's' : ''}</span>
        </div>

        <div className="v-enter-fade" key={'pill-' + idx} style={{
          alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 12px', borderRadius: 9999, marginBottom: 14,
          background: Q.ok ? '#ECFDF5' : '#FFF1EB',
          color: Q.ok ? 'var(--accent-success)' : 'var(--accent-warn)',
          fontSize: 12, fontWeight: 600, letterSpacing: '0.02em',
        }}>
          <span style={{ width: 14, height: 14, borderRadius: 9999, background: 'currentColor', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <VIcon name={Q.ok ? 'check' : 'x'} size={9} color="#fff" strokeWidth={3} />
          </span>
          {Q.ok ? 'You got this right' : "Not quite — let's look again"}
        </div>

        <h1 className="v-h1 v-enter" key={'q-' + idx} style={{ fontSize: 26, marginBottom: 22, lineHeight: 1.25 }}>{Q.q}</h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
          <div className="v-card-soft" style={{
            padding: 14,
            background: Q.ok ? '#F4FBF7' : '#FFF7F1',
            border: `1px solid ${Q.ok ? 'rgba(16,185,129,0.18)' : 'rgba(234,88,12,0.18)'}`,
          }}>
            <div className="v-eyebrow-sm" style={{ marginBottom: 6, color: 'var(--muted-2)' }}>Your answer</div>
            <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 22, color: Q.ok ? 'var(--accent-success)' : 'var(--accent-warn)' }}>{Q.your}</div>
          </div>
          <div className="v-card-soft" style={{ padding: 14 }}>
            <div className="v-eyebrow-sm" style={{ marginBottom: 6, color: 'var(--muted-2)' }}>Correct answer</div>
            <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 22, color: 'var(--ink)' }}>{Q.correct}</div>
          </div>
        </div>

        {!Q.ok && Q.misread && (
          <div className="v-card" style={{ padding: '14px 16px', marginBottom: 14, background: '#FFFBEB', borderColor: 'rgba(245,158,11,0.25)' }}>
            <div className="v-eyebrow-sm" style={{ color: '#8B4513', marginBottom: 4 }}>Where it went sideways</div>
            <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 15, color: 'var(--ink-2)', lineHeight: 1.45 }}>{Q.misread}</div>
          </div>
        )}

        <div className="v-card" style={{ padding: 18, marginBottom: 14 }}>
          <div className="v-eyebrow-sm" style={{ marginBottom: 8 }}>Why</div>
          <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 15, color: 'var(--ink-2)', lineHeight: 1.55, marginBottom: 14 }}>{Q.explain}</div>
          <div className="v-eyebrow-sm" style={{ marginBottom: 10 }}>Working</div>
          <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Q.steps.map((s, i) => (
              <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ flexShrink: 0, width: 20, height: 20, borderRadius: 9999, background: 'var(--accent-blue-soft)', color: 'var(--accent-blue)', fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
                <span style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 15, color: 'var(--ink-2)', lineHeight: 1.45 }}>{s}</span>
              </li>
            ))}
          </ol>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 22 }}>
          <button className="v-btn-secondary v-tap" onClick={() => go('learn-concept')} style={{ flex: 1 }}>Open concept</button>
          <button className="v-btn-secondary v-tap" onClick={() => go('practice')} style={{ flex: 1 }}>Practice similar</button>
        </div>

        <div className="v-card-soft" style={{ padding: 10, marginBottom: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${total},1fr)`, gap: 6 }}>
            {QUIZ_REVIEW_BANK.map((r, i) => {
              const isCur = i === idx;
              return (
                <div key={i} className="v-tap" onClick={() => setIdx(i)} style={{
                  height: 28, borderRadius: 8, fontSize: 11, fontWeight: 600,
                  border: isCur ? '1.5px solid var(--ink)' : '1px solid var(--border)',
                  background: isCur ? 'var(--ink)' : (r.ok ? '#F0FDF4' : '#FFF7ED'),
                  color: isCur ? '#fff' : (r.ok ? 'var(--accent-success)' : 'var(--accent-warn)'),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{i + 1}</div>
              );
            })}
          </div>
        </div>

        <div style={{ flex: 1, minHeight: 8 }} />

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="v-btn-secondary v-tap" onClick={goPrev} disabled={idx === 0} style={{ flex: 1, opacity: idx === 0 ? 0.45 : 1 }}>
            <VIcon name="arrow-left" size={14} /> Prev
          </button>
          {idx < total - 1 ? (
            <button className="v-btn-primary v-tap" onClick={goNext} style={{ flex: 1 }}>
              Next <VIcon name="arrow-right" size={14} color="#fff" />
            </button>
          ) : (
            <button className="v-btn-primary v-tap" onClick={() => { set && set({ reviewIdx: 0 }); go(back); }} style={{ flex: 1 }}>
              Done <VIcon name="check" size={14} color="#fff" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
