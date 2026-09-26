// ─────────────────────────────────────────────────────────────
//  One class: the join code, big, and who has joined so far.
//
//  The code is the whole screen on purpose — until students are in, there
//  is nothing else this page can usefully say, and the teacher is standing
//  at a blackboard trying to read it off their phone.
// ─────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react';
import { getRoster, type RosterStudent, type TeacherClass } from '../api';

export default function ClassDetail({ klass, onBack }: {
  klass: TeacherClass;
  onBack: () => void;
}) {
  const [students, setStudents] = useState<RosterStudent[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    getRoster(klass.class_id)
      .then((s) => { if (live) setStudents(s); })
      .catch((e) => { if (live) { setErr(e.message); setStudents([]); } });
    return () => { live = false; };
  }, [klass.class_id]);

  const refresh = () => {
    setStudents(null);
    getRoster(klass.class_id).then(setStudents).catch((e) => { setErr(e.message); setStudents([]); });
  };

  return (
    <div className="wrap">
      <div className="top">
        <div className="grow">
          <button className="link" onClick={onBack}>‹ All classes</button>
          <h1>{klass.name}</h1>
          <div className="note">Class {klass.grade}</div>
        </div>
      </div>

      {err && <div className="error">{err}</div>}

      <div className="card">
        <div className="eyebrow">Write this on the board</div>
        <div className="code">{klass.join_code}</div>
        <p className="note">
          Students open the Vidya app, enter this code, and they join {klass.name}.
          The code does not expire.
        </p>
      </div>

      <div className="card">
        <div className="row" style={{ marginBottom: 10 }}>
          <h2 className="grow" style={{ margin: 0 }}>
            {students === null ? 'Students' : `${students.length} student${students.length === 1 ? '' : 's'} joined`}
          </h2>
          <button className="link" onClick={refresh}>Refresh</button>
        </div>

        {students === null && <div className="empty">Loading…</div>}

        {students !== null && students.length === 0 && (
          <div className="empty">
            Nobody has joined yet. Once a student enters the code, they appear here.
          </div>
        )}

        {(students || []).map((s) => (
          <div key={s.student_id} className="student">
            <div className="avatar">{(s.name || '?').slice(0, 1).toUpperCase()}</div>
            <div className="grow">{s.name || 'Unnamed student'}</div>
          </div>
        ))}
      </div>

      {/* What comes next, said plainly rather than faked with empty charts. */}
      <p className="note">
        Once your students have been practising for a few days, this page will
        also show what the class is struggling with and who needs your time.
      </p>
    </div>
  );
}
