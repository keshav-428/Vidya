import React, { useState } from 'react';
import VIcon from '../../prototype/icons';
import { VSoftBackdrop, VTopBar, VOptionButton } from '../../prototype/shared';

const DIAG_CHAPTERS = ['Numbers', 'Fractions', 'Decimals', 'Integers', 'Algebra', 'Geometry'];
const DIAG_QUESTIONS = [
  { chapter: 'Numbers', prompt: 'Which is the largest?', options: [{ id: 'a', label: '0.5' }, { id: 'b', label: '1/3' }, { id: 'c', label: '0.45' }, { id: 'd', label: '2/5' }], correctId: 'a' },
  { chapter: 'Numbers', prompt: 'What is the place value of 7 in 4,732?', options: [{ id: 'a', label: '7' }, { id: 'b', label: '70' }, { id: 'c', label: '700' }, { id: 'd', label: '7,000' }], correctId: 'c' },
  { chapter: 'Fractions', prompt: 'What is ½ + ⅓?', options: [{ id: 'a', label: '⅖' }, { id: 'b', label: '⅚' }, { id: 'c', label: '⅔' }, { id: 'd', label: '⅙' }], correctId: 'b' },
  { chapter: 'Fractions', prompt: 'Which fraction equals ¾?', options: [{ id: 'a', label: '6/8' }, { id: 'b', label: '3/5' }, { id: 'c', label: '4/5' }, { id: 'd', label: '2/3' }], correctId: 'a' },
  { chapter: 'Decimals', prompt: 'What is 0.6 + 0.25?', options: [{ id: 'a', label: '0.31' }, { id: 'b', label: '0.85' }, { id: 'c', label: '0.65' }, { id: 'd', label: '0.90' }], correctId: 'b' },
  { chapter: 'Decimals', prompt: 'Which is the smallest?', options: [{ id: 'a', label: '0.7' }, { id: 'b', label: '0.07' }, { id: 'c', label: '0.77' }, { id: 'd', label: '0.17' }], correctId: 'b' },
  { chapter: 'Integers', prompt: 'What is (−3) + 5?', options: [{ id: 'a', label: '−8' }, { id: 'b', label: '2' }, { id: 'c', label: '−2' }, { id: 'd', label: '8' }], correctId: 'b' },
  { chapter: 'Integers', prompt: 'What is (−4) × (−2)?', options: [{ id: 'a', label: '−8' }, { id: 'b', label: '8' }, { id: 'c', label: '−6' }, { id: 'd', label: '6' }], correctId: 'b' },
  { chapter: 'Algebra', prompt: 'If 3x = 18, what is x?', options: [{ id: 'a', label: '3' }, { id: 'b', label: '6' }, { id: 'c', label: '9' }, { id: 'd', label: '18' }], correctId: 'b' },
  { chapter: 'Algebra', prompt: 'Simplify: 2a + 3a', options: [{ id: 'a', label: '5a' }, { id: 'b', label: '6a' }, { id: 'c', label: '23a' }, { id: 'd', label: '5' }], correctId: 'a' },
  { chapter: 'Geometry', prompt: 'Angles in a triangle add up to…', options: [{ id: 'a', label: '90°' }, { id: 'b', label: '120°' }, { id: 'c', label: '180°' }, { id: 'd', label: '360°' }], correctId: 'c' },
  { chapter: 'Geometry', prompt: 'A right angle measures…', options: [{ id: 'a', label: '45°' }, { id: 'b', label: '90°' }, { id: 'c', label: '120°' }, { id: 'd', label: '60°' }], correctId: 'b' },
];

export default function DiagQ1Screen({ go, state, set }) {
  const total = DIAG_QUESTIONS.length;
  const [idx, setIdx] = useState(0);
  const q = DIAG_QUESTIONS[idx];
  const [picked, setPicked] = useState(null);
  const [acked, setAcked] = useState(false);
  const isLast = idx === total - 1;
  const chapterIdx = DIAG_CHAPTERS.indexOf(q.chapter);

  const restoreFor = (i) => {
    const prev = state[`diag_${i}`];
    setPicked(prev && prev !== '__skip__' ? prev : null);
    setAcked(false);
  };

  const goNext = () => {
    if (isLast) { go('diag-building'); return; }
    const n = idx + 1; setIdx(n); restoreFor(n);
  };

  const goPrev = () => {
    if (idx === 0) { go('diag-intro'); return; }
    const p = idx - 1; setIdx(p); restoreFor(p);
  };

  const onPick = (id) => {
    if (acked) return;
    setPicked(id);
    set({ [`diag_${idx}`]: id });
    setTimeout(() => setAcked(true), 140);
  };

  const onSkip = () => {
    set({ [`diag_${idx}`]: '__skip__' });
    goNext();
  };

  return (
    <VSoftBackdrop variant={idx % 2 ? 'warm' : 'cool'}>
      <VTopBar showBack onBack={goPrev} transparent
        right={
          <button className="v-tap" onClick={onSkip} style={{
            background: 'transparent', border: 'none', padding: '4px 0',
            fontFamily: 'Inter', fontSize: 12, fontWeight: 600, color: 'var(--muted-2)', letterSpacing: '0.04em', cursor: 'default'
          }}>Skip</button>
        } />
      <div style={{ padding: '72px 22px 32px', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 2 }}>
          {DIAG_CHAPTERS.map((ch, i) => {
            const done = i < chapterIdx, cur = i === chapterIdx;
            return (
              <div key={ch} style={{
                display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
                padding: '5px 11px', borderRadius: 9999,
                background: cur ? 'var(--indigo)' : done ? 'var(--indigo-air)' : 'transparent',
                border: cur || done ? 'none' : '1px solid var(--border)'
              }}>
                {done && <VIcon name="check" size={10} color="var(--indigo)" strokeWidth={2.6} />}
                <span style={{ fontFamily: 'Inter', fontSize: 10.5, fontWeight: cur ? 700 : 600, letterSpacing: '0.02em', color: cur ? '#fff' : done ? 'var(--indigo)' : 'var(--muted-2)' }}>{ch}</span>
              </div>
            );
          })}
        </div>
        <div className="v-progress" style={{ marginBottom: 12 }}>
          <div className="v-progress-fill" style={{ width: `${(idx + 1) / total * 100}%` }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 28, fontFamily: 'Inter', fontSize: 11, color: 'var(--muted-2)', letterSpacing: '0.05em' }}>
          <span>Question {idx + 1} of {total}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--indigo)', fontWeight: 600 }}>
            <VIcon name="sparkles" size={11} color="var(--indigo)" /> Adapting to you
          </span>
        </div>

        <h1 className="v-h1 v-enter" style={{ fontSize: 28, marginBottom: 24, lineHeight: 1.2 }}>{q.prompt}</h1>

        <div className="v-enter" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {q.options.map((opt) =>
            <VOptionButton key={opt.id} label={opt.label}
              selected={picked === opt.id}
              onClick={() => onPick(opt.id)} />
          )}
        </div>

        {acked && (
          <div className="v-enter-fade" style={{
            marginTop: 18, padding: '14px 18px', borderRadius: 16,
            background: 'rgba(255,255,255,0.7)', border: '1px solid var(--border-soft)',
            display: 'flex', alignItems: 'center', gap: 12
          }}>
            <div style={{ width: 24, height: 24, borderRadius: 9999, background: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <VIcon name="check" size={12} color="#fff" strokeWidth={2.5} />
            </div>
            <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 16, color: 'var(--ink)' }}>
              Got it. {isLast ? 'Last one done.' : 'Next one coming up.'}
            </div>
          </div>
        )}

        <div style={{ flex: 1, minHeight: 24 }} />
        <button className="v-btn-primary v-tap"
          onClick={goNext}
          disabled={!acked} style={{ opacity: acked ? 1 : 0.4 }}>
          {isLast ? 'Finish' : 'Continue'} <VIcon name="arrow-right" size={14} color="#fff" />
        </button>
      </div>
    </VSoftBackdrop>
  );
}
