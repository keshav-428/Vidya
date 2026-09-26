// ─────────────────────────────────────────────────────────────
//  The teacher's classes, and making a new one.
//
//  Phase 0/1 only: a class exists, it has a code, students can join it.
//  The "what to reteach tomorrow" screen comes next and hangs off here.
// ─────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react';
import { listClasses, createClass, type TeacherClass } from '../api';

// Class 6 is where the student app's content starts; keeping the choice
// small avoids a dropdown of grades we have no syllabus for.
const GRADES = [6, 7, 8];

export default function Classes({ onOpen, teacherName, onSignOut }: {
  onOpen: (c: TeacherClass) => void;
  teacherName: string;
  onSignOut: () => void;
}) {
  const [classes, setClasses] = useState<TeacherClass[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [grade, setGrade] = useState(GRADES[0]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    listClasses()
      .then((cs) => { if (live) setClasses(cs); })
      .catch((e) => { if (live) { setErr(e.message); setClasses([]); } });
    return () => { live = false; };
  }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      const made = await createClass(name.trim(), grade);
      setClasses((cs) => [made, ...(cs || [])]);
      setName('');
      setAdding(false);
      onOpen(made);   // straight to the code — that is what they need next
    } catch (e2) {
      setErr((e2 as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="wrap">
      <div className="top">
        <div className="grow">
          <div className="eyebrow">Vidya for teachers</div>
          <h1>{teacherName ? `Hello, ${teacherName}` : 'Your classes'}</h1>
        </div>
        <button className="link" onClick={onSignOut}>Sign out</button>
      </div>

      {err && <div className="error">{err}</div>}

      {classes === null && <div className="empty">Loading your classes…</div>}

      {classes !== null && classes.length === 0 && !adding && (
        <div className="card">
          <h2>Start with one class</h2>
          <p className="note">
            Make a class, then write its code on the board. Students enter the
            code in the Vidya app and they are in — you do not have to create
            accounts for them.
          </p>
        </div>
      )}

      {(classes || []).map((c) => (
        <div key={c.class_id} className="card row" onClick={() => onOpen(c)} style={{ cursor: 'pointer' }}>
          <div className="avatar">{(c.name || '?').slice(0, 2).toUpperCase()}</div>
          <div className="grow">
            <div style={{ fontWeight: 700 }}>{c.name}</div>
            <div className="note">Class {c.grade} · code {c.join_code}</div>
          </div>
          <span aria-hidden style={{ color: 'var(--muted-2)' }}>›</span>
        </div>
      ))}

      {adding ? (
        <form className="card" onSubmit={add}>
          <h2>New class</h2>
          <label htmlFor="cname">What do you call it?</label>
          <input id="cname" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="6B" required autoFocus />

          <label htmlFor="grade">Which class are they in?</label>
          <select id="grade" value={grade} onChange={(e) => setGrade(Number(e.target.value))}>
            {GRADES.map((g) => <option key={g} value={g}>Class {g}</option>)}
          </select>

          <button type="submit" disabled={busy}>{busy ? 'Creating…' : 'Create class'}</button>
          <button type="button" className="link" onClick={() => setAdding(false)}>Cancel</button>
        </form>
      ) : (
        classes !== null && <button onClick={() => setAdding(true)}>Create a class</button>
      )}
    </div>
  );
}
