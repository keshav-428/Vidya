import React from 'react';
import VIcon from '../../prototype/icons';
import { VTopBar } from '../../prototype/shared';

export default function FinalReviewScreen({ go }) {
  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)', position: 'relative' }}>
      <VTopBar transparent showBack onBack={() => go('navigable-quiz')} />
      <div style={{ padding: '72px 24px 32px', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        <div className="v-eyebrow" style={{ marginBottom: 8 }}>Final review</div>
        <h1 className="v-h1" style={{ fontSize: 30, marginBottom: 8 }}>Almost done</h1>
        <p className="v-body" style={{ marginBottom: 24 }}>You have 8 of 10 answered. 2 are unattempted.</p>

        <div className="v-card" style={{ padding: 18, marginBottom: 24 }}>
          <div className="v-eyebrow-sm" style={{ marginBottom: 14 }}>Status</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8, marginBottom: 18 }}>
            {[1, 1, 1, 0, 1, 1, 0, 1, 1, 1].map((s, i) => (
              <div key={i} style={{
                height: 36, borderRadius: 10, fontSize: 12, fontWeight: 600,
                border: '1px solid var(--border)',
                background: s ? '#F0FDF4' : '#FFF7ED',
                color: s ? 'var(--accent-success)' : 'var(--accent-warn)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{i + 1}</div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--muted)' }}>
            <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 9999, background: 'var(--accent-success)', marginRight: 6 }} />Answered (8)</span>
            <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 9999, background: 'var(--accent-warn)', marginRight: 6 }} />Skipped (2)</span>
          </div>
        </div>

        <div style={{ flex: 1 }} />
        <button className="v-btn-primary v-tap" onClick={() => go('quiz-result-summary')}>Submit quiz <VIcon name="arrow-right" size={14} color="#fff" /></button>
        <button className="v-btn-secondary v-tap" onClick={() => go('navigable-quiz')} style={{ marginTop: 10 }}>Go back and finish</button>
      </div>
    </div>
  );
}
