// ─────────────────────────────────────────────────────────────
//  Level 3: one student.
//
//  This is where numbers are allowed, because they are about one child
//  and a decision — not thirty rows a teacher has to scan.
// ─────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react';
import { getStudent, type StudentDetail as Detail, type TeacherClass } from '../api';
import { STATE_STYLE } from './StudentList';

export default function StudentDetail({ klass, studentId, name, onBack }: {
  klass: TeacherClass;
  studentId: string;
  name: string;
  onBack: () => void;
}) {
  const [d, setD] = useState<Detail | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    getStudent(klass.class_id, studentId)
      .then((res) => { if (live) setD(res); })
      .catch((e) => { if (live) setErr(e.message); });
    return () => { live = false; };
  }, [klass.class_id, studentId]);

  const st = d ? STATE_STYLE[d.state] : null;

  return (
    <>
      <div className="v-topbar">
        <button className="v-link" onClick={onBack}>‹ Students</button>
        <span className="v-eyebrow">{klass.name}</span>
      </div>

      <div className="wrap v-enter">
        <div className="row" style={{ marginBottom: 18 }}>
          <div className="avatar" style={{ width: 52, height: 52, fontSize: 20 }}>
            {(name || '?').slice(0, 1).toUpperCase()}
          </div>
          <div className="grow">
            <h1 className="v-h1" style={{ fontSize: 22, marginBottom: 4 }}>{name || 'Unnamed student'}</h1>
            {st && (
              <div className="note" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 7, height: 7, borderRadius: 9999, background: st.dot }} />
                {st.label} · {d!.reason}
              </div>
            )}
          </div>
        </div>

        {err && <div className="error">{err}</div>}
        {!d && !err && <div className="empty">Loading…</div>}

        {d && d.weak.length > 0 && (
          <div className="v-card" style={{ marginBottom: 12 }}>
            <div className="v-eyebrow-sm" style={{ marginBottom: 12 }}>Struggling with</div>
            {d.weak.map((w) => (
              <div key={w.key} style={{ marginBottom: 14 }}>
                <div className="row" style={{ marginBottom: 6 }}>
                  <span className="grow" style={{ fontSize: 14.5 }}>{w.title}</span>
                  <span className="note">{w.percent}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 9999, background: 'var(--border)', overflow: 'hidden' }}>
                  <div style={{ width: `${w.percent}%`, height: '100%', background: 'var(--saffron)' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {d && d.weak.length === 0 && (
          <div className="v-card" style={{ marginBottom: 12 }}>
            <div className="v-eyebrow-sm" style={{ marginBottom: 8 }}>Struggling with</div>
            <div className="empty" style={{ padding: 0 }}>
              {d.skills_with_evidence === 0
                ? 'Nothing yet — they have not practised enough for this to mean anything.'
                : 'Nothing right now. They are on top of what they have practised.'}
            </div>
          </div>
        )}

        {d && (
          <div className="v-card-soft" style={{ marginBottom: 16 }}>
            <div className="row">
              <span className="grow note">Topics practised enough to judge</span>
              <span style={{ fontFamily: "'Quicksand','Baloo 2',sans-serif", fontWeight: 700 }}>
                {d.skills_with_evidence}
              </span>
            </div>
            <div className="row" style={{ marginTop: 8 }}>
              <span className="grow note">Last practised</span>
              <span style={{ fontFamily: "'Quicksand','Baloo 2',sans-serif", fontWeight: 700 }}>
                {d.idle_days < 0 ? 'never' : d.idle_days === 0 ? 'today' : `${d.idle_days}d ago`}
              </span>
            </div>
          </div>
        )}

        {/* Phase 6 hangs here: "set practice for this student". */}
        <p className="note" style={{ textAlign: 'center' }}>
          Setting practice for one student is coming next.
        </p>
      </div>
    </>
  );
}
