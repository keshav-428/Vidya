import React from 'react';
import VIcon from '../../prototype/icons';
import { VTopBar, VBottomNav, VAskVidyaFAB, VProfileChip, VSectionHeader } from '../../prototype/shared';

const buckets = [
  { id: 'strong', label: 'Strong', count: 8, color: 'var(--accent-success)' },
  { id: 'confident', label: 'Confident', count: 6, color: '#10B981' },
  { id: 'improving', label: 'Improving', count: 5, color: 'var(--accent-amber)' },
  { id: 'needshelp', label: 'Needs help', count: 4, color: 'var(--accent-warn)' },
];

export default function ProgressScreen({ go, state }) {
  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)', position: 'relative' }}>
      <VTopBar transparent right={<VProfileChip go={go} name={state?.name} />} />
      <div style={{ padding: '72px 24px 140px' }}>
        <div className="v-eyebrow" style={{ marginBottom: 8 }}>YOUR PROGRESS</div>
        <h1 className="v-h1" style={{ fontSize: 32, marginBottom: 8 }}>How am I doing?</h1>
        <p className="v-body" style={{ marginBottom: 28 }}>Here's what to do next.</p>

        <div className="v-card" style={{ marginBottom: 14, padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
            <div className="v-eyebrow-sm">Weekly streak</div>
            <div style={{ fontSize: 11, color: 'var(--muted-2)' }}>This week</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 14 }}>
            <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 48, fontWeight: 600, lineHeight: 1 }}>5</div>
            <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 18, color: 'var(--muted)' }}>of 7 days</div>
          </div>
          <div style={{ display: 'flex', gap: 5 }}>
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => {
              const done = i < 5;
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: '100%', height: 32, borderRadius: 8, background: done ? 'var(--ink)' : 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {done && <span style={{ color: 'var(--saffron)', fontSize: 14, lineHeight: 1 }}>•</span>}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--muted-2)' }}>{d}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="v-card" style={{ marginBottom: 14, padding: 22 }}>
          <div className="v-eyebrow-sm" style={{ marginBottom: 14 }}>Mastery · 23 topics</div>
          <div style={{ display: 'flex', height: 10, borderRadius: 9999, overflow: 'hidden', marginBottom: 18, background: 'var(--border)' }}>
            {buckets.map((b) => <div key={b.id} style={{ flex: b.count, background: b.color }} />)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {buckets.map((b) => (
              <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: 9999, background: b.color, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 18, lineHeight: 1 }}>{b.count}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted-2)', marginTop: 2 }}>{b.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <VSectionHeader title="NEEDS HELP" action="See all" onAction={() => go('topic-mastery')} />
        <div className="v-card" style={{ padding: 0, overflow: 'hidden', marginBottom: 14 }}>
          {[
            { n: 'Dividing fractions', meta: '2 mistakes last time' },
            { n: 'Multiplying fractions', meta: '1 attempt' },
            { n: 'Comparing fractions', meta: 'Improving · keep going' },
          ].map((t, i) => (
            <div key={t.n} className="v-tap" onClick={() => go('learn-concept')} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderTop: i ? '1px solid var(--border)' : 'none' }}>
              <div style={{ width: 8, height: 8, borderRadius: 9999, background: 'var(--accent-warn)', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 17, marginBottom: 2 }}>{t.n}</div>
                <div style={{ fontSize: 11, color: 'var(--muted-2)' }}>{t.meta}</div>
              </div>
              <div className="v-link">Practice →</div>
            </div>
          ))}
        </div>

        <VSectionHeader title="STRONG" />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
          {['Integers', 'Place value', 'Equivalent fractions', 'Adding like fractions', 'Properties of numbers', 'Lines & angles', 'Mean', 'Time'].map((t) => (
            <div key={t} style={{ padding: '8px 14px', background: '#fff', border: '1px solid var(--accent-success)', borderRadius: 9999, fontSize: 12, color: 'var(--accent-success)', fontWeight: 500 }}>{t}</div>
          ))}
        </div>

        <VSectionHeader title="RECENT PRACTICE" />
        <div className="v-card" style={{ padding: 0, overflow: 'hidden', marginBottom: 14 }}>
          {[
            { t: 'Adding unlike fractions', s: '4 of 5 · Confident', when: 'Today', dot: 'var(--accent-success)' },
            { t: 'Quick Practice · Mixed', s: '3 of 5 · Improving', when: 'Yesterday', dot: 'var(--accent-amber)' },
            { t: 'Decimals · place value', s: '5 of 5 · Strong', when: 'Sat', dot: 'var(--accent-success)' },
            { t: 'Revise: perimeters', s: '2 of 5 · Needs help', when: 'Thu', dot: 'var(--accent-warn)' },
          ].map((r, i) => (
            <div key={i} className="v-tap" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderTop: i ? '1px solid var(--border)' : 'none' }}>
              <div style={{ width: 6, height: 6, borderRadius: 9999, background: r.dot, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 16, marginBottom: 2, lineHeight: 1.2 }}>{r.t}</div>
                <div style={{ fontSize: 11, color: 'var(--muted-2)' }}>{r.s}</div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted-2)', fontFamily: 'Inter', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{r.when}</div>
            </div>
          ))}
        </div>

        <VSectionHeader title="MISTAKES TO RETRY" />
        <div className="v-card" style={{ padding: 0, overflow: 'hidden', marginBottom: 14 }}>
          {[
            { q: '½ + ⅓ = ?', t: 'Adding unlike fractions' },
            { q: '7 ÷ ½ = ?', t: 'Dividing fractions' },
            { q: 'Area of ▱ 6×4', t: 'Mensuration · parallelograms' },
          ].map((r, i) => (
            <div key={i} className="v-tap" onClick={() => go('learn-concept')} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderTop: i ? '1px solid var(--border)' : 'none' }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 14, color: 'var(--accent-warn)' }}>{r.q.split(' ')[0]}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 16, marginBottom: 2, lineHeight: 1.2 }}>{r.q}</div>
                <div style={{ fontSize: 11, color: 'var(--muted-2)' }}>{r.t}</div>
              </div>
              <div className="v-link">Retry →</div>
            </div>
          ))}
        </div>
      </div>
      <VAskVidyaFAB context="progress" />
      <VBottomNav active="progress" go={go} />
    </div>
  );
}
