import React, { useState } from 'react';
import VIcon from '../../prototype/icons';
import { VTopBar, VBottomNav } from '../../prototype/shared';
import api from '../../api/vidya';

const FALLBACK_TOPICS = ['Fractions', 'Perimeter and Area', 'Prime Time'];

export default function ExamConfigScreen({ go, state, set }) {
  const [duration, setDuration] = useState(180);
  const [marks, setMarks] = useState(80);

  // Chapters chosen in the Practice tab; fall back to a default set.
  const topics = (state?.examTopics && state.examTopics.length) ? state.examTopics : FALLBACK_TOPICS;

  const generate = () => {
    const grade = api.toGrade(state?.classLevel);
    // Reset, then kick off LLM paper generation; the loading screen covers latency.
    set({ examPaper: null, examMarks: marks, examDuration: duration });
    api.generatePaper({ topics, grade, totalMarks: marks, difficulty: 'Medium', language: state?.language || 'English' })
      .then((paper) => set({ examPaper: paper || 'error' }))
      .catch(() => set({ examPaper: 'error' }));
    go('exam-loading-1');
  };

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)', position: 'relative' }}>
      <VTopBar transparent />
      <div style={{ padding: '72px 24px 120px' }}>
        <div className="v-eyebrow" style={{ marginBottom: 8 }}>EXAM PRACTICE</div>
        <h1 className="v-h1" style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 8 }}>Configure</h1>
        <p className="v-body" style={{ marginBottom: 24 }}>Build a practice paper that fits your study plan.</p>

        <div className="v-card" style={{ marginBottom: 14 }}>
          <div className="v-eyebrow-sm" style={{ marginBottom: 10 }}>Board & Class</div>
          <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 22, marginBottom: 4 }}>CBSE · Class 7</div>
          <div style={{ fontSize: 12, color: 'var(--muted-2)' }}>Mathematics · 2024 syllabus</div>
        </div>

        <div className="v-card" style={{ marginBottom: 14 }}>
          <div className="v-eyebrow-sm" style={{ marginBottom: 14 }}>Duration</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[60, 90, 120, 180].map(d => (
              <div key={d} className="v-tap" onClick={() => setDuration(d)} style={{
                flex: 1, padding: '12px 0', textAlign: 'center',
                border: duration === d ? '1.5px solid var(--ink)' : '1px solid var(--border)',
                background: '#fff', borderRadius: 12, fontSize: 13, fontWeight: 500,
                color: duration === d ? 'var(--ink)' : 'var(--muted)',
              }}>{d}m</div>
            ))}
          </div>
        </div>

        <div className="v-card" style={{ marginBottom: 14 }}>
          <div className="v-eyebrow-sm" style={{ marginBottom: 14 }}>Total marks</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[40, 60, 80, 100].map(d => (
              <div key={d} className="v-tap" onClick={() => setMarks(d)} style={{
                flex: 1, padding: '12px 0', textAlign: 'center',
                border: marks === d ? '1.5px solid var(--ink)' : '1px solid var(--border)',
                background: '#fff', borderRadius: 12, fontSize: 13, fontWeight: 500,
                color: marks === d ? 'var(--ink)' : 'var(--muted)',
              }}>{d}</div>
            ))}
          </div>
        </div>

        <div className="v-card" style={{ marginBottom: 14 }}>
          <div className="v-eyebrow-sm" style={{ marginBottom: 14 }}>Difficulty mix</div>
          {['Easy', 'Medium', 'Hard'].map((l, i) => {
            const v = [40, 40, 20][i];
            return (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: i < 2 ? 12 : 0 }}>
                <span style={{ width: 60, fontSize: 13, color: 'var(--muted)' }}>{l}</span>
                <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 9999, overflow: 'hidden' }}>
                  <div style={{ width: `${v}%`, height: '100%', background: 'var(--ink)' }} />
                </div>
                <span style={{ width: 36, textAlign: 'right', fontSize: 13, fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", color: 'var(--ink)' }}>{v}%</span>
              </div>
            );
          })}
        </div>

        <div className="v-card" style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div className="v-eyebrow-sm">Topics included</div>
            <span className="v-tap" onClick={() => go('practice')} style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: 600, color: 'var(--indigo)' }}>Edit</span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {topics.map(t => (
              <div key={t} className="v-pill" style={{ background: '#F4F3F1', border: '1px solid var(--border)' }}>{t}</div>
            ))}
          </div>
        </div>

        <button className="v-btn-primary v-tap" onClick={generate}>
          Generate paper <VIcon name="arrow-right" size={14} color="#fff" />
        </button>
      </div>
      <VBottomNav active="practice" go={go} />
    </div>
  );
}
