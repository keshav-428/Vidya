// ─────────────────────────────────────────────────────────────
//  One class, read in the thirty seconds before the period starts.
//
//  Three blocks, in the order a teacher needs them: what to reteach,
//  who to sit with, what is safe to move past. The join code and the
//  roster drop below, because they matter on day one and never again.
//
//  Every number says what it is based on. A class number with no
//  denominator will be wrong in front of a teacher once, and then the
//  whole screen stops being believed.
// ─────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react';
import {
  getRoster, getSummary, getAssignments, setPractice, splitKey,
  getInvites, inviteStudent,
  type Assignment, type ClassSummary, type PendingInvite,
  type RosterStudent, type TeacherClass,
} from '../api';

export default function ClassDetail({ klass, onBack, onStudents }: {
  klass: TeacherClass;
  onBack: () => void;
  /** Into the student list — where "who needs me" is answered per child. */
  onStudents: () => void;
}) {
  const [summary, setSummary] = useState<ClassSummary | null>(null);
  const [students, setStudents] = useState<RosterStudent[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [showRoster, setShowRoster] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  // Which reteach row we are setting, so only that button shows it is working.
  const [setting, setSetting] = useState<string | null>(null);
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [vidyaId, setVidyaId] = useState('');
  const [inviting, setInviting] = useState(false);
  const [invited, setInvited] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    setSummary(null);
    Promise.all([
      getSummary(klass.class_id).catch((e) => { if (live) setErr(e.message); return null; }),
      getRoster(klass.class_id).catch(() => [] as RosterStudent[]),
      getAssignments(klass.class_id).catch(() => [] as Assignment[]),
      getInvites(klass.class_id).catch(() => [] as PendingInvite[]),
    ]).then(([s, r, a, i]) => {
      if (!live) return;
      setSummary(s);
      setStudents(r);
      setAssignments(a);
      setInvites(i);
    });
    return () => { live = false; };
  }, [klass.class_id]);

  const assign = async (key: string, title: string) => {
    const { chapterId, section } = splitKey(key);
    setSetting(key);
    setErr(null);
    try {
      await setPractice(klass.class_id, chapterId, section, title);
      setAssignments(await getAssignments(klass.class_id));
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSetting(null);
    }
  };

  // Inviting by an ID the student handed over — never a search. A teacher
  // able to look children up is the one thing this product must not contain.
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

  const joined = summary?.students ?? students?.length ?? 0;
  const heard = summary?.students_with_data ?? 0;
  const hasSignal = !!summary && (summary.reteach.length > 0 || summary.attention.length > 0 || summary.safe.length > 0);

  return (
    <>
      <div className="v-topbar">
        <button className="v-link" onClick={onBack}>‹ All classes</button>
        <span className="v-eyebrow">Class {klass.grade}</span>
      </div>

      <div className="wrap v-enter">
        <h1 className="v-h1">{klass.name}</h1>

        {/* The denominator, before anything that rests on it. */}
        <p className="v-body" style={{ marginBottom: 22 }}>
          {summary === null ? 'Reading your class…'
            : heard > 0 ? `Based on ${heard} of ${joined} student${joined === 1 ? '' : 's'} who have been practising.`
            : joined > 0 ? `${joined} student${joined === 1 ? '' : 's'} joined. Nobody has practised enough yet for this to say anything.`
            : 'Nobody has joined yet.'}
        </p>

        {err && <div className="error">{err}</div>}

        {summary && hasSignal && (
          <>
            {summary.reteach.length > 0 && (
              <div className="v-card" style={{ marginBottom: 12 }}>
                <div className="v-eyebrow-sm" style={{ marginBottom: 12 }}>Reteach this</div>
                {summary.reteach.map((r) => (
                  <div key={r.key} className="row" style={{ alignItems: 'flex-start', marginBottom: 14 }}>
                    <div className="grow">
                      <div className="v-h2" style={{ marginBottom: 2 }}>{r.title}</div>
                      <div className="note">{r.shaky} of {r.of} still shaky</div>
                    </div>
                    {/* The share, drawn — a teacher reads a bar faster than a ratio. */}
                    <div style={{ width: 54, height: 6, borderRadius: 9999, background: 'var(--border)', marginTop: 8, overflow: 'hidden' }}>
                      <div style={{ width: `${Math.round((r.shaky / Math.max(r.of, 1)) * 100)}%`, height: '100%', background: 'var(--saffron)' }} />
                    </div>
                  </div>
                ))}
                {/* Setting practice starts HERE, from the thing we just
                    reported — never from a syllabus the teacher must browse. */}
                {summary.reteach.map((r) => {
                  const already = assignments.some((a) => a.title === r.title);
                  return (
                    <button key={`set-${r.key}`} className="v-btn-secondary v-tap"
                      style={{ marginTop: 8 }}
                      disabled={setting === r.key || already}
                      onClick={() => assign(r.key, r.title)}>
                      {already ? `Already set · ${r.title}`
                        : setting === r.key ? 'Setting…'
                        : `Set practice · ${r.title}`}
                    </button>
                  );
                })}
              </div>
            )}

            {summary.attention.length > 0 && (
              <div className="v-card" style={{ marginBottom: 12 }}>
                <div className="v-eyebrow-sm" style={{ marginBottom: 12 }}>Sit with these</div>
                {summary.attention.map((a) => (
                  <div key={a.student_id} className="student">
                    <div className="avatar">{(a.name || '?').slice(0, 1).toUpperCase()}</div>
                    <div className="grow">
                      <div style={{ fontSize: 14.5, fontWeight: 600 }}>{a.name || 'Unnamed student'}</div>
                      <div className="note">{a.reason}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {summary.safe.length > 0 && (
              <div className="v-card" style={{ marginBottom: 16 }}>
                <div className="v-eyebrow-sm" style={{ marginBottom: 10 }}>Safe to move on</div>
                {summary.safe.map((sf) => (
                  <div key={sf.key} className="row" style={{ marginBottom: 8 }}>
                    <span className="grow" style={{ fontSize: 14.5 }}>{sf.title}</span>
                    <span className="note">{sf.of} checked</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {assignments.length > 0 && (
          <div className="v-card" style={{ marginBottom: 12 }}>
            <div className="v-eyebrow-sm" style={{ marginBottom: 12 }}>Practice you set</div>
            {assignments.map((a) => (
              <div key={a.assignment_id} className="row" style={{ marginBottom: 10 }}>
                <span className="grow" style={{ fontSize: 14.5 }}>{a.title}</span>
                {/* Without this a teacher is shouting into a void, and does
                    not set practice a second time. */}
                <span className="note">{a.done} of {a.of} done</span>
              </div>
            ))}
          </div>
        )}

        {/* Day one: the code is the only thing this screen can usefully say. */}
        <div className="v-card" style={{ marginBottom: 12 }}>
          <div className="v-eyebrow-sm" style={{ marginBottom: 2 }}>Joining code</div>
          <div className="code">{klass.join_code}</div>
          <p className="note">
            Students open the Vidya app, go to Profile → Join a class, and enter
            this code. It does not expire.
          </p>
        </div>

        {/* The second door in: the student reads their ID out, the teacher
            types it, and the student accepts. Nothing is searchable. */}
        <div className="v-card" style={{ marginBottom: 12 }}>
          <div className="v-eyebrow-sm" style={{ marginBottom: 10 }}>Add a student by Vidya ID</div>
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
          {invited && <p className="note" style={{ marginTop: 10 }}>Invited {invited}. They join once they accept.</p>}
          <p className="note" style={{ marginTop: 10 }}>
            Your student finds their ID in the Vidya app under Profile.
          </p>
          {invites.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div className="v-eyebrow-sm" style={{ marginBottom: 8 }}>Waiting to accept</div>
              {invites.map((i) => (
                <div key={i.invite_id} className="note" style={{ marginBottom: 4 }}>
                  {i.student_name || 'A student'}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="v-card-soft v-tap row" style={{ marginBottom: 12 }} onClick={onStudents}>
          <div className="grow">
            <div style={{ fontFamily: "'Quicksand','Baloo 2',sans-serif", fontWeight: 700, fontSize: 16 }}>
              Every student
            </div>
            <div className="note">Who is keeping up, and who needs you</div>
          </div>
          <span aria-hidden style={{ color: 'var(--muted-2)', fontSize: 18 }}>›</span>
        </div>

        <div className="v-card-soft">
          <div className="row v-tap" onClick={() => setShowRoster((o) => !o)}>
            <span className="grow" style={{ fontFamily: "'Quicksand','Baloo 2',sans-serif", fontWeight: 700, fontSize: 16 }}>
              {students === null ? 'Students' : `${students.length} student${students.length === 1 ? '' : 's'} joined`}
            </span>
            <span aria-hidden style={{ color: 'var(--muted-2)', fontSize: 18 }}>{showRoster ? '⌃' : '⌄'}</span>
          </div>

          {showRoster && (
            <div className="v-enter-fade" style={{ marginTop: 10 }}>
              {students !== null && students.length === 0 && (
                <div className="empty">Nobody has joined yet. Once a student enters the code, they appear here.</div>
              )}
              {(students || []).map((s) => (
                <div key={s.student_id} className="student">
                  <div className="avatar">{(s.name || '?').slice(0, 1).toUpperCase()}</div>
                  <div className="grow" style={{ fontSize: 14.5 }}>{s.name || 'Unnamed student'}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {summary && !hasSignal && joined > 0 && (
          <p className="note" style={{ textAlign: 'center', marginTop: 16 }}>
            Once your students have answered a few questions each, this page will
            show what to reteach and who needs your time.
          </p>
        )}
      </div>
    </>
  );
}
