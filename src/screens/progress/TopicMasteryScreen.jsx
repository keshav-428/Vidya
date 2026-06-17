import React from 'react';
import VIcon from '../../prototype/icons';
import { VTopBar, VSectionHeader } from '../../prototype/shared';

const concepts = [
  { n: 'Equivalent fractions', m: 96, t: 'Strong' },
  { n: 'Adding like fractions', m: 88, t: 'Strong' },
  { n: 'Adding unlike fractions', m: 54, t: 'Improving' },
  { n: 'Multiplying fractions', m: 42, t: 'Improving' },
  { n: 'Dividing fractions', m: 18, t: 'Needs work' },
  { n: 'Mixed numbers', m: 34, t: 'Needs work' },
];

export default function TopicMasteryScreen({ go }) {
  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)' }}>
      <VTopBar transparent showBack onBack={() => go('progress')} />
      <div style={{ padding: '72px 24px 32px' }}>
        <div className="v-eyebrow" style={{ marginBottom: 8 }}>FRACTIONS</div>
        <h1 className="v-h1" style={{ fontSize: 30, marginBottom: 24 }}>Concept-by-concept</h1>

        <div className="v-card" style={{ padding: 28, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ position: 'relative', width: 120, height: 120, flexShrink: 0 }}>
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="var(--border)" strokeWidth="10" />
              <circle cx="60" cy="60" r="50" fill="none" stroke="var(--ink)" strokeWidth="10"
                strokeDasharray={`${64 / 100 * 314} 314`} strokeLinecap="round" transform="rotate(-90 60 60)" />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 32, fontWeight: 600, lineHeight: 1 }}>64<span style={{ fontSize: 16 }}>%</span></div>
              <div style={{ fontSize: 9, letterSpacing: '0.1em', color: 'var(--muted-2)', marginTop: 4 }}>MASTERED</div>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 18, marginBottom: 8, lineHeight: 1.3 }}>You're 36% from full mastery.</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>Two practice sessions on dividing fractions could close most of the gap.</div>
          </div>
        </div>

        <VSectionHeader title="CONCEPTS" />
        <div className="v-card" style={{ padding: 0, overflow: 'hidden' }}>
          {concepts.map((c, i) => {
            const tone = c.m >= 80 ? 'var(--accent-success)' : c.m >= 50 ? 'var(--accent-amber)' : 'var(--accent-warn)';
            return (
              <div key={c.n} className="v-tap" onClick={() => go('learning-studio')} style={{ padding: '18px 20px', borderTop: i ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 8, height: 8, borderRadius: 9999, background: tone, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 17, marginBottom: 2 }}>{c.n}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted-2)' }}>{c.t}</div>
                </div>
                <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 18, color: tone }}>{c.m}%</div>
              </div>
            );
          })}
        </div>

        <button className="v-btn-primary v-tap" onClick={() => go('learning-studio')} style={{ marginTop: 24 }}>
          Practice the weak ones <VIcon name="arrow-right" size={14} color="#fff" />
        </button>
      </div>
    </div>
  );
}
