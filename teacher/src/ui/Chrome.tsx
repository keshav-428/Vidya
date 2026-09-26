// ─────────────────────────────────────────────────────────────
//  The shared chrome: a top bar with the profile chip on the right,
//  and the bottom tabs — the same shape the student app has, so the
//  two read as one product.
//
//  The tabs live INSIDE a class, not above it. Everything this app
//  shows belongs to one class, so a global tab bar would have had a
//  single real destination, and a tab bar with one thing in it is
//  worse than none.
// ─────────────────────────────────────────────────────────────
import VIcon from './icons';

export type Tab = 'today' | 'students' | 'practice' | 'class';

export const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'today',    label: 'Today',    icon: 'home' },
  { id: 'students', label: 'Students', icon: 'user' },
  { id: 'practice', label: 'Practice', icon: 'target' },
  { id: 'class',    label: 'Class',    icon: 'chart' },
];

export function TopBar({ title, onBack, onProfile, teacherName }: {
  title?: string;
  onBack?: () => void;
  onProfile?: () => void;
  teacherName?: string;
}) {
  return (
    <div className="v-topbar">
      <div className="row" style={{ gap: 10 }}>
        {onBack && (
          <button className="v-tap" onClick={onBack}
            style={{ background: 'none', border: 0, padding: 0, display: 'flex', cursor: 'pointer' }}
            aria-label="Back">
            <VIcon name="arrow-left" size={19} color="var(--ink)" />
          </button>
        )}
        {title
          ? <span className="v-eyebrow">{title}</span>
          : <span className="v-logo-wordmark" style={{ fontSize: 20 }}>Vidya</span>}
      </div>

      {onProfile && (
        <button className="v-tap" onClick={onProfile} aria-label="Profile" style={{
          width: 34, height: 34, borderRadius: 9999, border: 'none', padding: 0,
          background: 'linear-gradient(135deg,#FFE4D5,#E0E7FF)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 16,
          color: 'var(--ink)', cursor: 'pointer', flexShrink: 0,
          boxShadow: '0 0 0 1px rgba(208,196,190,0.4)',
        }}>{(teacherName || 'T').slice(0, 1).toUpperCase()}</button>
      )}
    </div>
  );
}

export function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <div className="v-bottomnav">
      {TABS.map((t) => (
        <div key={t.id} className={`v-navitem v-tap${active === t.id ? ' active' : ''}`}
          onClick={() => onChange(t.id)}>
          <VIcon name={t.icon} size={20} color={active === t.id ? 'var(--ink)' : 'var(--muted-2)'} />
          <span>{t.label}</span>
          <span className="v-navdot" />
        </div>
      ))}
    </div>
  );
}
