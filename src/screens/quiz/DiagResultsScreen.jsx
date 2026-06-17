import React from 'react';
import VIcon from '../../prototype/icons';
import { VTopBar, VSoftBackdrop } from '../../prototype/shared';

export default function DiagResultsScreen({ go }) {
  return (
    <VSoftBackdrop variant="rose">
      <VTopBar transparent />
      <div style={{ padding: '72px 24px 32px', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
        <div className="v-enter" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 36 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18, background: '#FFF9F0',
            boxShadow: '0 8px 30px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.05)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24,
          }}>
            <VIcon name="sparkles" size={28} color="#F59E0B" strokeWidth={1.6} />
          </div>
          <h1 className="v-h1" style={{ fontSize: 30, textAlign: 'center', marginBottom: 8 }}>You're ready to learn</h1>
          <div className="v-eyebrow" style={{ color: 'var(--muted-2)' }}>5 OUT OF 8 CORRECT</div>
        </div>

        <div className="v-eyebrow" style={{ marginBottom: 12 }}>Topics breakdown</div>

        <div className="v-card v-enter" style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 8, height: 8, borderRadius: 9999, background: 'var(--accent-success)' }} />
            <div className="v-eyebrow-sm" style={{ color: 'var(--accent-success)' }}>Strong</div>
          </div>
          <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 20, marginBottom: 10 }}>Integers, Basic algebra</div>
          <div style={{ height: 6, background: 'var(--border)', borderRadius: 9999, overflow: 'hidden', marginBottom: 6 }}>
            <div style={{ width: '85%', height: '100%', background: 'var(--accent-success)', borderRadius: 9999 }} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted-2)' }}>5 of 6 correct</div>
        </div>

        <div className="v-card v-enter" style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 8, height: 8, borderRadius: 9999, background: 'var(--accent-amber)' }} />
            <div className="v-eyebrow-sm" style={{ color: 'var(--accent-amber)' }}>Strengthen</div>
          </div>
          <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 20, marginBottom: 10 }}>Fractions</div>
          <div style={{ height: 6, background: 'var(--border)', borderRadius: 9999, overflow: 'hidden', marginBottom: 6 }}>
            <div style={{ width: '50%', height: '100%', background: 'var(--accent-amber)', borderRadius: 9999 }} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted-2)' }}>1 of 2 correct</div>
        </div>

        <div className="v-card v-enter" style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 8, height: 8, borderRadius: 9999, background: 'var(--accent-warn)' }} />
            <div className="v-eyebrow-sm" style={{ color: 'var(--accent-warn)' }}>Needs work</div>
          </div>
          <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 20, marginBottom: 10 }}>Mensuration</div>
          <div style={{ height: 6, background: 'var(--border)', borderRadius: 9999, overflow: 'hidden', marginBottom: 6 }}>
            <div style={{ width: '25%', height: '100%', background: 'var(--accent-warn)', borderRadius: 9999 }} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted-2)' }}>0 of 2 correct</div>
        </div>

        <button className="v-btn-primary v-tap" onClick={() => go('home-post-diag')}>
          See my plan <VIcon name="arrow-right" size={14} color="#fff" />
        </button>
      </div>
    </VSoftBackdrop>
  );
}
