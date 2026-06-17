import React, { useState, useEffect, useRef } from 'react';
import VIcon from '../../prototype/icons';
import { VTopBar, VSoftBackdrop, VidyaAvatar } from '../../prototype/shared';
import api from '../../api/vidya';

const LINES = ['Reading your handwriting', 'Matching working steps', 'Marking against the rubric', 'Writing your feedback'];

export default function ExamEvalLoadingScreen({ go, state, set }) {
  const [stepIdx, setStepIdx] = useState(0);
  const doneRef = useRef(false);      // grading finished
  const animDoneRef = useRef(false);  // animation reached last line

  // Advance only when BOTH the animation and the grading call have finished.
  const tryAdvance = () => {
    if (doneRef.current && animDoneRef.current) go('exam-eval-results');
  };

  // Kick off real grading once.
  useEffect(() => {
    const images = state?.examImages || [];
    const paper = (state?.examPaper && state.examPaper !== 'error') ? state.examPaper : { sections: [] };
    set && set({ examResult: null });
    api.gradePaper({
      images, paper,
      grade: api.toGrade(state?.classLevel),
      totalMarks: state?.examMarks || 80,
      language: state?.language || 'English',
    })
      .then((res) => { set && set({ examResult: res }); })
      .catch(() => { set && set({ examResult: 'error' }); })
      .finally(() => { doneRef.current = true; tryAdvance(); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setStepIdx(s => {
        if (s >= LINES.length - 1) {
          clearInterval(t);
          animDoneRef.current = true;
          setTimeout(tryAdvance, 300);
          return s;
        }
        return s + 1;
      });
    }, 900);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <VSoftBackdrop variant="cool">
      <VTopBar transparent />
      <div style={{ padding: '80px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100%' }}>
        <div className="v-enter-scale" style={{ position: 'relative', marginBottom: 48 }}>
          <VidyaAvatar size={120} />
          <div style={{ position: 'absolute', inset: -12, borderRadius: 9999, border: '2px solid var(--accent-blue-soft)', animation: 'vPulseRing 1.4s ease-out infinite' }} />
        </div>
        <div className="v-eyebrow" style={{ marginBottom: 16 }}>Evaluating</div>
        <h1 className="v-h1" style={{ fontSize: 30, textAlign: 'center', marginBottom: 40, lineHeight: 1.15 }}>Reading your work…</h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'flex-start' }}>
          {LINES.map((l, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: i <= stepIdx ? 1 : 0.35, transition: 'opacity .35s' }}>
              <div style={{
                width: 18, height: 18, borderRadius: 9999,
                border: i < stepIdx ? 'none' : '1.5px solid var(--muted-2)',
                background: i < stepIdx ? 'var(--ink)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {i < stepIdx && <VIcon name="check" size={11} color="#fff" strokeWidth={2.5} />}
                {i === stepIdx && <div style={{ width: 6, height: 6, borderRadius: 9999, background: 'var(--ink)', animation: 'vDot 1.2s infinite' }} />}
              </div>
              <span style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 18, color: i <= stepIdx ? 'var(--ink)' : 'var(--muted-2)' }}>{l}</span>
            </div>
          ))}
        </div>
      </div>
    </VSoftBackdrop>
  );
}
