import React from 'react';
import VIcon from '../../prototype/icons';
import { VTopBar } from '../../prototype/shared';
import { useAuth } from '../../auth/AuthContext';

const items = [
  { label: 'Edit profile', icon: 'user' },
  { label: 'Class & subject', icon: 'book' },
  { label: 'Language', icon: 'globe' },
  { label: 'Linked tutor', icon: 'users' },
  { label: 'Notifications', icon: 'bell' },
  { label: 'Subscription', icon: 'sparkles' },
  { label: 'Help & support', icon: 'lightbulb' },
];

export default function ProfileScreen({ go }) {
  const { logOut } = useAuth();
  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)', position: 'relative' }}>
      <VTopBar transparent showBack onBack={() => go('home')} title="Profile" />
      <div style={{ padding: '72px 24px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          <div style={{ width: 72, height: 72, borderRadius: 9999, background: 'linear-gradient(135deg,#FFE4D5,#E0E7FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 32, color: 'var(--ink)' }}>A</div>
          <div>
            <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 24, marginBottom: 2 }}>Aarav K.</div>
            <div style={{ fontSize: 13, color: 'var(--muted-2)' }}>Class 7 · CBSE</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
          <div className="v-card-soft" style={{ flex: 1, textAlign: 'center', padding: '14px 8px' }}>
            <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 22 }}>14</div>
            <div className="v-eyebrow-sm" style={{ marginTop: 2 }}>day streak</div>
          </div>
          <div className="v-card-soft" style={{ flex: 1, textAlign: 'center', padding: '14px 8px' }}>
            <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 22 }}>62%</div>
            <div className="v-eyebrow-sm" style={{ marginTop: 2 }}>mastery</div>
          </div>
          <div className="v-card-soft" style={{ flex: 1, textAlign: 'center', padding: '14px 8px' }}>
            <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 22 }}>23</div>
            <div className="v-eyebrow-sm" style={{ marginTop: 2 }}>concepts</div>
          </div>
        </div>

        <div className="v-card" style={{ padding: 0, overflow: 'hidden' }}>
          {items.map((it, i) => (
            <div key={it.label} className="v-tap" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', borderTop: i ? '1px solid var(--border)' : 'none' }}>
              <VIcon name={it.icon} size={18} color="var(--muted)" />
              <span style={{ flex: 1, fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 16 }}>{it.label}</span>
              <VIcon name="chevron-right" size={16} color="var(--muted-2)" />
            </div>
          ))}
        </div>

        <div
          className="v-tap"
          onClick={async () => { try { await logOut(); } catch (e) {} go('splash'); }}
          style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', marginTop: 14, background: '#fff', borderRadius: 24, border: '1px solid var(--border)' }}
        >
          <VIcon name="logout" size={18} color="var(--accent-warn)" />
          <span style={{ flex: 1, fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 16, color: 'var(--accent-warn)' }}>Sign out</span>
        </div>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 11, color: 'var(--muted-2)' }}>Vidya · v0.4.1</div>
      </div>
    </div>
  );
}
