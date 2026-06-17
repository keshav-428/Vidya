import React, { useEffect } from 'react';
import { VTopBar, VSoftBackdrop, VidyaAvatar } from '../../prototype/shared';

const STATES = [
  { eyebrow: 'Step 1 of 2', title: 'Drafting your paper', sub: 'Selecting questions across topics' },
  { eyebrow: 'Step 2 of 2', title: 'Aligning to the syllabus', sub: 'Balancing marks and difficulty' },
];

export default function ExamLoadingScreen({ go, frame = 1 }) {
  const cur = STATES[frame - 1];

  useEffect(() => {
    const t = setTimeout(() => {
      if (frame < 2) go('exam-loading-2');
      else go('exam-paper');
    }, 1200);
    return () => clearTimeout(t);
  }, [frame]);

  return (
    <VSoftBackdrop variant="cool">
      <VTopBar transparent />
      <div style={{ padding: '80px 24px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100%' }}>
        <div className="v-enter-scale" style={{ position: 'relative', marginBottom: 48 }}>
          <VidyaAvatar size={108} />
          <div style={{ position: 'absolute', inset: -10, borderRadius: 9999, border: '2px solid var(--accent-blue-soft)', animation: 'vPulseRing 1.4s ease-out infinite' }} />
        </div>
        <div className="v-eyebrow v-enter-fade" key={frame} style={{ marginBottom: 14 }}>{cur.eyebrow}</div>
        <h1 className="v-h1 v-enter" key={'t' + frame} style={{ fontSize: 28, textAlign: 'center', marginBottom: 10, lineHeight: 1.15 }}>{cur.title}</h1>
        <div className="v-enter-fade" key={'s' + frame} style={{ fontFamily: 'Inter', fontSize: 13, color: 'var(--muted-2)' }}>{cur.sub}</div>
      </div>
    </VSoftBackdrop>
  );
}
