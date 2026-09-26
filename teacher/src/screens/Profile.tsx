// ─────────────────────────────────────────────────────────────
//  Behind the chip in the top right, exactly where the student app
//  keeps the same thing. Sign out used to sit in the top bar, which is
//  where the student app puts a profile — the two now match.
// ─────────────────────────────────────────────────────────────
import { TopBar } from '../ui/Chrome';

export default function Profile({ name, email, classCount, onBack, onSignOut }: {
  name: string;
  email: string;
  classCount: number;
  onBack: () => void;
  onSignOut: () => void;
}) {
  return (
    <>
      <TopBar title="Profile" onBack={onBack} />

      <div className="wrap v-enter">
        <div className="row" style={{ marginBottom: 26 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 9999,
            background: 'linear-gradient(135deg,#FFE4D5,#E0E7FF)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Quicksand','Baloo 2',sans-serif", fontSize: 26, color: 'var(--ink)',
          }}>{(name || 'T').slice(0, 1).toUpperCase()}</div>
          <div className="grow">
            <div style={{ fontFamily: "'Quicksand','Baloo 2',sans-serif", fontSize: 22, marginBottom: 2 }}>
              {name || 'Teacher'}
            </div>
            <div className="note">{email}</div>
          </div>
        </div>

        <div className="v-card-soft" style={{ marginBottom: 12 }}>
          <div className="row">
            <span className="grow note">Classes</span>
            <span style={{ fontFamily: "'Quicksand','Baloo 2',sans-serif", fontWeight: 700 }}>{classCount}</span>
          </div>
        </div>

        <button className="v-btn-secondary v-tap" onClick={onSignOut}>Sign out</button>
      </div>
    </>
  );
}
