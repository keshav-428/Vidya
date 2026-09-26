// ─────────────────────────────────────────────────────────────
//  Getting a class in. Two doors, both consent-based.
//
//  Its own screen because it matters enormously for a week and then
//  never again — it should not sit between a teacher and what their
//  class needs today.
// ─────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react';
import {
  getInvites, inviteStudent, getRoster,
  type PendingInvite, type RosterStudent, type TeacherClass,
} from '../api';

export default function AddStudents({ klass, onBack }: {
  klass: TeacherClass;
  onBack: () => void;
}) {
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [students, setStudents] = useState<RosterStudent[] | null>(null);
  const [vidyaId, setVidyaId] = useState('');
  const [inviting, setInviting] = useState(false);
  const [invited, setInvited] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    Promise.all([
      getInvites(klass.class_id).catch(() => [] as PendingInvite[]),
      getRoster(klass.class_id).catch(() => [] as RosterStudent[]),
    ]).then(([i, r]) => {
      if (!live) return;
      setInvites(i);
      setStudents(r);
    });
    return () => { live = false; };
  }, [klass.class_id]);

  // By an ID the student handed over — never a search. A teacher able to
  // look children up is the one thing this product must not contain.
  const invite = async () => {
    const id = vidyaId.trim().toUpperCase();
    if (!id) return;
    setInviting(true);
    setErr(null);
    setInvited(null);
    try {
      const res = await inviteStudent(klass.class_id, id);
      setInvited(res.student_name || 'Invitation sent');
      setVidyaId('');
      setInvites(await getInvites(klass.class_id));
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setInviting(false);
    }
  };

  return (
    <>
      <div className="v-topbar">
        <button className="v-link" onClick={onBack}>‹ {klass.name}</button>
        <span className="v-eyebrow">Add students</span>
      </div>

      <div className="wrap v-enter">
        <h1 className="v-h1">Add students</h1>
        <p className="v-body" style={{ marginBottom: 22 }}>
          Two ways in. Either way the student agrees — you never create an
          account for them.
        </p>

        {err && <div className="error">{err}</div>}

        <div className="v-card" style={{ marginBottom: 12 }}>
          <div className="v-eyebrow-sm" style={{ marginBottom: 2 }}>Write this on the board</div>
          <div className="code">{klass.join_code}</div>
          <p className="note">
            Students open the Vidya app, go to Profile → Join a class, and type
            it. The code does not expire.
          </p>
        </div>

        <div className="v-card" style={{ marginBottom: 12 }}>
          <div className="v-eyebrow-sm" style={{ marginBottom: 10 }}>Or invite by Vidya ID</div>
          <div className="field" style={{ marginBottom: 12 }}>
            <input value={vidyaId} onChange={(e) => setVidyaId(e.target.value)}
              placeholder="ABCD234" autoCapitalize="characters" autoCorrect="off"
              spellCheck={false} aria-label="Vidya ID"
              style={{ textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700 }} />
          </div>
          <button className="v-btn-secondary v-tap" disabled={inviting || !vidyaId.trim()}
            onClick={invite}>
            {inviting ? 'Sending…' : 'Send invitation'}
          </button>
          {invited && (
            <p className="note" style={{ marginTop: 10 }}>
              Invited {invited}. They join once they accept.
            </p>
          )}
          <p className="note" style={{ marginTop: 10 }}>
            Your student finds their ID in the Vidya app, under Profile. You
            cannot search for students — they give you the ID.
          </p>
        </div>

        {invites.length > 0 && (
          <div className="v-card" style={{ marginBottom: 12 }}>
            <div className="v-eyebrow-sm" style={{ marginBottom: 10 }}>Waiting to accept</div>
            {invites.map((i) => (
              <div key={i.invite_id} className="student">
                <div className="avatar">{(i.student_name || '?').slice(0, 1).toUpperCase()}</div>
                <div className="grow" style={{ fontSize: 14.5 }}>{i.student_name || 'A student'}</div>
              </div>
            ))}
          </div>
        )}

        <div className="v-card-soft">
          <div className="v-eyebrow-sm" style={{ marginBottom: 10 }}>
            {students === null ? 'In this class' : `${students.length} in this class`}
          </div>
          {students !== null && students.length === 0 && (
            <div className="empty" style={{ padding: 0 }}>Nobody yet.</div>
          )}
          {(students || []).map((s) => (
            <div key={s.student_id} className="student">
              <div className="avatar">{(s.name || '?').slice(0, 1).toUpperCase()}</div>
              <div className="grow" style={{ fontSize: 14.5 }}>{s.name || 'Unnamed student'}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
