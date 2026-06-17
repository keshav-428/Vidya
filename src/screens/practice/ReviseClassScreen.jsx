import React, { useState } from 'react';
import VIcon from '../../prototype/icons';
import { VTopBar, VSectionHeader } from '../../prototype/shared';

const recent = [
  'Fractions: parts of a whole',
  'Decimals: place value',
  'Adding unlike fractions',
  'Linear equations',
  'Perimeter of rectangles',
];
const levels = [
  { n: 'Thinker', meta: 'Foundational · easier questions', dot: 'var(--accent-success)' },
  { n: 'Scholar', meta: 'Standard · expected level', dot: 'var(--accent-amber)' },
  { n: 'Genius', meta: 'Challenging · push yourself', dot: 'var(--accent-warn)' },
];

export default function ReviseClassScreen({ go }) {
  const [topic, setTopic] = useState(null);
  const [level, setLevel] = useState(null);

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)' }}>
      <VTopBar transparent showBack onBack={() => go('home')} title="Revise Class Work" />
      <div style={{ padding: '72px 24px 32px' }}>
        <div className="v-eyebrow" style={{ marginBottom: 8 }}>STEP {topic ? (level ? 3 : 2) : 1} OF 3</div>
        <h1 className="v-h1" style={{ fontSize: 30, marginBottom: 8, lineHeight: 1.2 }}>
          {!topic ? 'What did you learn today?' : !level ? 'Pick your level' : "Let's start"}
        </h1>
        <p className="v-body" style={{ marginBottom: 28 }}>
          {!topic ? 'Pick the topic your teacher covered.'
            : !level ? `Practice "${topic}" at the level that fits.`
              : '5 quick questions at your level.'}
        </p>

        {!topic && (
          <>
            <VSectionHeader title="RECENT IN CLASS" />
            <div className="v-card" style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
              {recent.map((t, i) => (
                <div key={t} className="v-tap" onClick={() => setTopic(t)} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px',
                  borderTop: i ? '1px solid var(--border)' : 'none',
                }}>
                  <VIcon name="book" size={18} color="var(--muted)" />
                  <span style={{ flex: 1, fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 16 }}>{t}</span>
                  <VIcon name="chevron-right" size={16} color="var(--muted-2)" />
                </div>
              ))}
            </div>
            <button className="v-btn-secondary v-tap" onClick={() => go('concept-library')}>
              Search for another topic
            </button>
          </>
        )}

        {topic && !level && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {levels.map(l => (
              <div key={l.n} className="v-tap" onClick={() => setLevel(l.n)} style={{
                background: '#fff', borderRadius: 20, border: '1px solid var(--border)',
                padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14,
              }}>
                <div style={{ width: 10, height: 10, borderRadius: 9999, background: l.dot, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 18, marginBottom: 2 }}>{l.n}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted-2)' }}>{l.meta}</div>
                </div>
                <VIcon name="chevron-right" size={16} color="var(--muted-2)" />
              </div>
            ))}
          </div>
        )}

        {topic && level && (
          <div className="v-card" style={{ padding: 24 }}>
            <div className="v-eyebrow-sm" style={{ color: 'var(--indigo)', marginBottom: 10 }}>READY</div>
            <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 22, marginBottom: 6, lineHeight: 1.3 }}>{topic}</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>Level: <strong>{level}</strong> · 5 questions</div>
            <button className="v-btn-primary v-tap" onClick={() => go('navigable-quiz')}>
              Start practice <VIcon name="arrow-right" size={14} color="#fff" />
            </button>
            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button className="v-btn-secondary v-tap" onClick={() => go('learn-concept')} style={{ flex: 1 }}>
                Understand concept first
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
