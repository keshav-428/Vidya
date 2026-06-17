import React, { useEffect } from 'react';
import { VTopBar, VSoftBackdrop, VidyaAvatar } from '../../prototype/shared';

const STATES = [
  { eyebrow: 'Preparing', title: 'Reading your level', sub: 'A moment to tune to you' },
  { eyebrow: 'Aligned', title: 'Mapping the right ideas', sub: 'Picking the questions that matter' },
  { eyebrow: 'Perfected', title: 'Adjusting the difficulty', sub: 'Comfortable but useful' },
  { eyebrow: 'Ready', title: 'Practice selected', sub: "Let's begin together" },
];

export default function QuizLoadingScreen({ go, frame = 1 }) {
  const cur = STATES[frame - 1];

  useEffect(() => {
    if (frame < 4) {
      const t = setTimeout(() => go(`quiz-loading-${frame + 1}`), 1100);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => go('navigable-quiz'), 1100);
      return () => clearTimeout(t);
    }
  }, [frame]);

  return (
    <VSoftBackdrop variant="warm">
      <VTopBar transparent />
      <div style={{ padding: '80px 24px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100%' }}>
        <div className="v-enter-scale" style={{ position: 'relative', marginBottom: 48 }}>
          <VidyaAvatar size={108} />
          <div style={{ position: 'absolute', inset: -10, borderRadius: 9999, border: '2px solid var(--accent-blue-soft)', animation: 'vPulseRing 1.4s ease-out infinite' }} />
        </div>
        <div className="v-eyebrow v-enter-fade" key={frame} style={{ marginBottom: 14 }}>{cur.eyebrow}</div>
        <h1 className="v-h1 v-enter" key={'t' + frame} style={{ fontSize: 30, textAlign: 'center', marginBottom: 12, lineHeight: 1.15 }}>
          {cur.title}
        </h1>
        <div className="v-enter-fade" key={'s' + frame} style={{ fontFamily: 'Inter', fontSize: 14, color: 'var(--muted-2)' }}>{cur.sub}</div>

        <div style={{ display: 'flex', gap: 8, marginTop: 48 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{
              width: i === frame ? 28 : 6, height: 6, borderRadius: 9999,
              background: i <= frame ? 'var(--ink)' : 'rgba(208,196,190,0.5)',
              transition: 'all .35s cubic-bezier(.16,1,.3,1)',
            }} />
          ))}
        </div>
      </div>
    </VSoftBackdrop>
  );
}
