// ─────────────────────────────────────────────────────────────
//  What the teacher has set, and whether it landed.
//
//  Without the second half — who actually did it — setting practice is
//  shouting into a void, and nobody does it twice.
// ─────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react';
import { getAssignments, type Assignment, type TeacherClass } from '../api';

function when(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (!Number.isFinite(days)) return '';
  return days <= 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`;
}

export default function Assignments({ klass, onBack }: {
  klass: TeacherClass;
  onBack: () => void;
}) {
  const [rows, setRows] = useState<Assignment[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    getAssignments(klass.class_id)
      .then((a) => { if (live) setRows(a); })
      .catch((e) => { if (live) { setErr(e.message); setRows([]); } });
    return () => { live = false; };
  }, [klass.class_id]);

  return (
    <>
      <div className="v-topbar">
        <button className="v-link" onClick={onBack}>‹ {klass.name}</button>
        <span className="v-eyebrow">Practice</span>
      </div>

      <div className="wrap v-enter">
        <h1 className="v-h1">Practice you set</h1>
        <p className="v-body" style={{ marginBottom: 22 }}>
          {rows === null ? 'Loading…'
            : rows.length === 0 ? 'Nothing set yet. Set practice from what your class is struggling with.'
            : 'A student has done it once they have practised that topic since you set it.'}
        </p>

        {err && <div className="error">{err}</div>}

        {(rows || []).map((a) => {
          const share = a.of ? Math.round((a.done / a.of) * 100) : 0;
          return (
            <div key={a.assignment_id} className="v-card" style={{ marginBottom: 12 }}>
              <div className="v-h2" style={{ marginBottom: 4 }}>{a.title}</div>
              <div className="note" style={{ marginBottom: 10 }}>
                {a.for_whole_class ? 'Whole class' : 'One student'} · set {when(a.created_at)}
              </div>
              <div style={{ height: 6, borderRadius: 9999, background: 'var(--border)', overflow: 'hidden', marginBottom: 8 }}>
                <div style={{ width: `${share}%`, height: '100%', background: 'var(--accent-success)' }} />
              </div>
              <div className="note">{a.done} of {a.of} done</div>
            </div>
          );
        })}
      </div>
    </>
  );
}
