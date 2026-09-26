// ─────────────────────────────────────────────────────────────
//  Level 2: thirty students, one row each.
//
//  A state, not a number. A teacher cannot act on thirty numbers; they
//  can act on "these four need you". Sorted worst-first by the server so
//  the teacher reads the top of the list and stops.
// ─────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react';
import { getStudents, type StudentRow, type StudentState, type TeacherClass } from '../api';

// The dot is the whole signal, so the four states have to be tellable apart
// at a glance — and not by colour alone, since the label carries it too.
export const STATE_STYLE: Record<StudentState, { dot: string; label: string }> = {
  needs_you: { dot: '#C2410C', label: 'Needs you' },
  no_data:   { dot: 'var(--muted-2)', label: 'Not started' },
  slipping:  { dot: '#D97706', label: 'Slipping' },
  on_track:  { dot: '#047857', label: 'On track' },
};

export default function StudentList({ klass, onBack, onOpen }: {
  klass: TeacherClass;
  onBack: () => void;
  onOpen: (s: StudentRow) => void;
}) {
  const [rows, setRows] = useState<StudentRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    getStudents(klass.class_id)
      .then((r) => { if (live) setRows(r); })
      .catch((e) => { if (live) { setErr(e.message); setRows([]); } });
    return () => { live = false; };
  }, [klass.class_id]);

  const needing = (rows || []).filter((r) => r.state === 'needs_you' || r.state === 'no_data').length;

  return (
    <>
      <div className="v-topbar">
        <button className="v-link" onClick={onBack}>‹ {klass.name}</button>
        <span className="v-eyebrow">Students</span>
      </div>

      <div className="wrap v-enter">
        <h1 className="v-h1">Your students</h1>
        <p className="v-body" style={{ marginBottom: 22 }}>
          {rows === null ? 'Reading your class…'
            : rows.length === 0 ? 'Nobody has joined this class yet.'
            : needing > 0 ? `${needing} could use your time. They are at the top.`
            : 'Everyone is keeping up.'}
        </p>

        {err && <div className="error">{err}</div>}

        <div className="v-card" style={{ padding: '8px 20px' }}>
          {(rows || []).map((r) => {
            const st = STATE_STYLE[r.state];
            return (
              <div key={r.student_id} className="student v-tap" onClick={() => onOpen(r)}>
                <div className="avatar">{(r.name || '?').slice(0, 1).toUpperCase()}</div>
                <div className="grow">
                  <div style={{ fontSize: 14.5, fontWeight: 600 }}>{r.name || 'Unnamed student'}</div>
                  <div className="note" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 7, height: 7, borderRadius: 9999, background: st.dot, flexShrink: 0 }} />
                    {st.label} · {r.reason}
                  </div>
                </div>
                <span aria-hidden style={{ color: 'var(--muted-2)', fontSize: 18 }}>›</span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
