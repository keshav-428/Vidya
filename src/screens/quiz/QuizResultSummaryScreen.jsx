import React from 'react';
import VIcon from '../../prototype/icons';
import { VTopBar, VSoftBackdrop } from '../../prototype/shared';

export default function QuizResultSummaryScreen({ go, set }) {
  return (
    <VSoftBackdrop variant="rose">
      <VTopBar transparent />
      <div style={{ padding: '72px 24px 32px', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
        <div className="v-eyebrow" style={{ marginBottom: 8 }}>QUIZ COMPLETE</div>
        <h1 className="v-h1" style={{ fontSize: 34, marginBottom: 24 }}>Nicely done</h1>

        <div className="v-card v-enter" style={{ padding: 32, marginBottom: 24, textAlign: 'center' }}>
          <div className="v-eyebrow-sm" style={{ marginBottom: 16 }}>You scored</div>
          <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontWeight: 700, fontSize: 80, lineHeight: 1, color: 'var(--ink)' }}>8/10</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 12 }}>+3 from your last attempt</div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <div className="v-card-soft" style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 28, color: 'var(--ink)' }}>4:32</div>
            <div className="v-eyebrow-sm" style={{ marginTop: 6 }}>Time</div>
          </div>
          <div className="v-card-soft" style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 28, color: 'var(--ink)' }}>27s</div>
            <div className="v-eyebrow-sm" style={{ marginTop: 6 }}>Avg / Q</div>
          </div>
        </div>

        <div className="v-eyebrow" style={{ marginBottom: 12 }}>Question review</div>
        <div className="v-card" style={{ padding: 0, marginBottom: 32, overflow: 'hidden' }}>
          {[
            { q: '½ + ⅓', ok: true },
            { q: '2x − 5 = 11', ok: true },
            { q: 'Area, r=7', ok: false },
            { q: 'HCF 24, 36', ok: true },
          ].map((r, i) => (
            <div key={i} className="v-tap" onClick={() => { set && set({ reviewIdx: i, reviewFrom: 'quiz-result-summary' }); go('quiz-review-question'); }} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderTop: i ? '1px solid var(--border)' : 'none' }}>
              <div style={{ width: 24, height: 24, borderRadius: 9999, background: r.ok ? 'var(--accent-success)' : 'var(--accent-warn)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <VIcon name={r.ok ? 'check' : 'x'} size={12} color="#fff" strokeWidth={3} />
              </div>
              <span style={{ flex: 1, fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 18 }}>{r.q}</span>
              <span className="v-link">Review</span>
            </div>
          ))}
        </div>

        <button className="v-btn-primary v-tap" onClick={() => go('home')}>Back to home <VIcon name="arrow-right" size={14} color="#fff" /></button>
        <div style={{ textAlign: 'center', marginTop: 14 }}><span className="v-link v-tap" onClick={() => go('final-review')}>Final review (all questions) →</span></div>
      </div>
    </VSoftBackdrop>
  );
}
