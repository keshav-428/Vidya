import React from 'react';
import VIcon from '../../prototype/icons';
import { VSoftBackdrop, VTopBar, VBottomNav } from '../../prototype/shared';

export default function HomePostDiagScreen({ go, state, set }) {
  return (
    <VSoftBackdrop variant="warm">
      <VTopBar title="Home" transparent />
      <div style={{ padding: '72px 22px 100px', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>

        <div className="v-enter" style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 32, fontWeight: 800, color: 'var(--ink)', margin: '0 0 4px' }}>
            Hi {state.name || 'there'}
          </h1>
          <div style={{ fontFamily: 'Inter', fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>
            Ready to plan your week? Let's set up your study schedule.
          </div>
        </div>

        <div
          data-coach-target="build-week-card"
          className="v-card v-enter v-tap"
          onClick={() => set({ showBuildSheet: true })}
          style={{ padding: 0, overflow: 'hidden', marginBottom: 16 }}
        >
          <div style={{ padding: '20px 20px 0', background: 'var(--ink)', borderRadius: '18px 18px 0 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <VIcon name="calendar" size={18} color="#fff" />
              </div>
              <div>
                <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 17, fontWeight: 700, color: '#fff' }}>Build your week plan</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>Pick days, assign topics, set your pace</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 5, paddingBottom: 16 }}>
              {['M', 'T', 'W', 'T', 'F'].map((d, i) => (
                <div key={i} style={{ flex: 1, padding: '8px 0', background: 'rgba(255,255,255,0.1)', borderRadius: 10, textAlign: 'center', fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>{d}</div>
              ))}
              {['S', 'S'].map((d, i) => (
                <div key={i} style={{ flex: 1, padding: '8px 0', background: 'transparent', borderRadius: 10, textAlign: 'center', fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.25)' }}>{d}</div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: '#fff' }}>
            <span style={{ fontFamily: 'Inter', fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Start planning</span>
            <VIcon name="arrow-right" size={16} color="var(--ink)" />
          </div>
        </div>

        <div className="v-enter" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <div className="v-pill" style={{ background: 'var(--indigo-air)', color: 'var(--indigo)', fontWeight: 600 }}>Class 7 · CBSE Maths</div>
          <div className="v-pill" style={{ background: 'var(--bg-warm)', color: 'var(--muted)' }}>No plan yet</div>
        </div>

      </div>
      <VBottomNav active="home" go={go} />
    </VSoftBackdrop>
  );
}
