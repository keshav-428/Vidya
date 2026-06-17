import React from 'react';
import VIcon from '../../prototype/icons';
import { VSoftBackdrop, VTopBar } from '../../prototype/shared';

const DIAG_QUESTIONS = [
  { chapter: 'Numbers', correctId: 'a' },
  { chapter: 'Numbers', correctId: 'c' },
  { chapter: 'Fractions', correctId: 'b' },
  { chapter: 'Fractions', correctId: 'a' },
  { chapter: 'Decimals', correctId: 'b' },
  { chapter: 'Decimals', correctId: 'b' },
  { chapter: 'Integers', correctId: 'b' },
  { chapter: 'Integers', correctId: 'b' },
  { chapter: 'Algebra', correctId: 'b' },
  { chapter: 'Algebra', correctId: 'a' },
  { chapter: 'Geometry', correctId: 'c' },
  { chapter: 'Geometry', correctId: 'b' },
];

function computeLevel(state) {
  let correct = 0, attempted = 0;
  DIAG_QUESTIONS.forEach((q, i) => {
    const a = state[`diag_${i}`];
    if (a && a !== '__skip__') {
      attempted += 1;
      if (a === q.correctId) correct += 1;
    }
  });
  const ratio = attempted ? correct / attempted : 0;
  if (ratio >= 0.7) return { id: 'confident', label: 'Confident', sub: "You have strong basics. We'll stretch you.", tone: 'var(--accent-success)' };
  if (ratio >= 0.4) return { id: 'improving', label: 'Improving', sub: "You're on the right path. A little focus will go a long way.", tone: 'var(--indigo)' };
  return { id: 'needs', label: 'Needs Help', sub: 'No problem. We\'ll start with the basics and build up.', tone: 'var(--accent-rose)' };
}

const RUNGS = ['needs', 'improving', 'confident', 'strong'];
const RUNG_LABELS = { needs: 'Needs Help', improving: 'Improving', confident: 'Confident', strong: 'Strong' };

export default function DiagResultScreen({ go, state }) {
  const level = computeLevel(state);
  const name = state.name || 'there';
  const levelIdx = RUNGS.indexOf(level.id);

  return (
    <VSoftBackdrop variant="cool">
      <VTopBar transparent />
      <div style={{ padding: '72px 24px 32px', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        <div className="v-eyebrow v-enter" style={{ marginBottom: 12 }}>Your starting level</div>
        <h1 className="v-h1 v-enter" style={{ fontSize: 30, marginBottom: 8, lineHeight: 1.15 }}>
          Nice work, {name}.
        </h1>
        <p className="v-enter" style={{ fontFamily: 'Inter', fontSize: 14, color: 'var(--muted)', marginBottom: 28, lineHeight: 1.5 }}>
          Here's where you are right now. This isn't a grade — it's just our starting point.
        </p>

        <div className="v-card v-enter" style={{ padding: '28px 24px', marginBottom: 16, background: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--bg-warm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <VIcon name="sparkles" size={22} color={level.tone} />
            </div>
            <div>
              <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 28, fontWeight: 500, color: 'var(--ink)', letterSpacing: '-0.01em' }}>{level.label}</div>
              <div style={{ fontSize: 12, color: 'var(--muted-2)', letterSpacing: '0.04em' }}>Class {state.classLevel || '7'} · Mathematics</div>
            </div>
          </div>
          <p style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 17, color: 'var(--ink)', lineHeight: 1.5, margin: 0 }}>
            {level.sub}
          </p>

          <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
            {RUNGS.map((id) => {
              const active = id === level.id;
              const reached = RUNGS.indexOf(id) <= levelIdx;
              return (
                <div key={id} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
                  <div style={{ height: 4, width: '100%', borderRadius: 9999, background: reached ? 'var(--ink)' : 'var(--border)' }} />
                  <div style={{ fontSize: 10.5, letterSpacing: '0.04em', fontWeight: active ? 700 : 500, color: active ? 'var(--ink)' : 'var(--muted-2)' }}>{RUNG_LABELS[id]}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="v-card-soft v-enter" style={{ marginBottom: 16, background: 'rgba(255,255,255,0.6)' }}>
          <div className="v-eyebrow-sm" style={{ marginBottom: 8 }}>What happens next</div>
          <p style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 16, color: 'var(--ink)', lineHeight: 1.5, margin: 0 }}>
            We've picked one topic for today. Small, simple, doable.
          </p>
        </div>

        <div style={{ flex: 1, minHeight: 24 }} />
        <button className="v-btn-primary v-tap" onClick={() => go('first-plan')}>
          See my first plan <VIcon name="arrow-right" size={14} color="#fff" />
        </button>
      </div>
    </VSoftBackdrop>
  );
}
