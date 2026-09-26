// ─────────────────────────────────────────────────────────────
//  One class, in the thirty seconds before the period starts.
//
//  This screen answers "what do I teach today" and nothing else. The
//  code, the invitations, the roster and the list of practice each moved
//  to their own screen — they used to sit here, and a teacher had to
//  scroll past joining instructions to find out what the class needs.
//
//  Every number says what it is based on. A class number with no
//  denominator will be wrong in front of a teacher once, and then the
//  whole screen stops being believed.
// ─────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react';
import {
  getSummary, getAssignments, setPractice, splitKey,
  type Assignment, type ClassSummary, type TeacherClass,
} from '../api';

export default function ClassDetail({ klass, onBack, onStudents, onAdd, onAssignments }: {
  klass: TeacherClass;
  onBack: () => void;
  /** Into the student list — where "who needs me" is answered per child. */
  onStudents: () => void;
  /** Into joining: the code, and inviting by Vidya ID. */
  onAdd: () => void;
  /** Into what has been set, and who has done it. */
  onAssignments: () => void;
}) {
  const [summary, setSummary] = useState<ClassSummary | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [setting, setSetting] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    Promise.all([
      getSummary(klass.class_id).catch((e) => { if (live) setErr(e.message); return null; }),
      getAssignments(klass.class_id).catch(() => [] as Assignment[]),
    ]).then(([s, a]) => {
      if (!live) return;
      setSummary(s);
      setAssignments(a);
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

  const joined = summary?.students ?? 0;
  const heard = summary?.students_with_data ?? 0;

  return (
    <>
      <div className="v-topbar">
        <button className="v-link" onClick={onBack}>‹ Classes</button>
        <span className="v-eyebrow">Class {klass.grade}</span>
      </div>

      <div className="wrap v-enter">
        <h1 className="v-h1">{klass.name}</h1>

        {/* The denominator, before anything that rests on it. */}
        <p className="v-body" style={{ marginBottom: 20 }}>
          {summary === null ? 'Reading your class…'
            : heard > 0 ? `Based on ${heard} of ${joined} student${joined === 1 ? '' : 's'} who have been practising.`
            : joined > 0 ? `${joined} student${joined === 1 ? '' : 's'} joined. Nobody has practised enough yet for this to say anything.`
            : 'Nobody has joined yet.'}
        </p>

        {err && <div className="error">{err}</div>}

        {summary && summary.reteach.length > 0 && (
          <div className="v-card" style={{ marginBottom: 12 }}>
            <div className="v-eyebrow-sm" style={{ marginBottom: 14 }}>Teach this today</div>
            {summary.reteach.map((r) => {
              const already = assignments.some((a) => a.title === r.title);
              return (
                <div key={r.key} style={{ marginBottom: 16 }}>
                  <div className="v-h2" style={{ marginBottom: 6 }}>{r.title}</div>
                  <div className="note" style={{ marginBottom: 8 }}>{r.shaky} of {r.of} still shaky</div>
                  <div style={{ height: 6, borderRadius: 9999, background: 'var(--border)', overflow: 'hidden', marginBottom: 10 }}>
                    <div style={{ width: `${Math.round((r.shaky / Math.max(r.of, 1)) * 100)}%`, height: '100%', background: 'var(--saffron)' }} />
                  </div>
                  {/* The loop closes here: what we just reported, set as work. */}
                  <button className="v-btn-secondary v-tap"
                    disabled={setting === r.key || already}
                    onClick={() => assign(r.key, r.title)}>
                    {already ? 'Practice set' : setting === r.key ? 'Setting…' : 'Set as practice'}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {summary && summary.attention.length > 0 && (
          <div className="v-card v-tap" style={{ marginBottom: 12 }} onClick={onStudents}>
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

        {summary && summary.safe.length > 0 && (
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

        {/* The three doors out of here, each its own screen. */}
        <Door title="Students"
          sub={joined ? `${joined} in this class · who needs you` : 'Nobody has joined yet'}
          onClick={onStudents} />
        <Door title="Practice you set"
          sub={assignments.length ? `${assignments.length} set · who has done it` : 'Nothing set yet'}
          onClick={onAssignments} />
        <Door title="Add students" sub="Class code, or invite by Vidya ID" onClick={onAdd} />
      </div>
    </>
  );
}

function Door({ title, sub, onClick }: { title: string; sub: string; onClick: () => void }) {
  return (
    <div className="v-card-soft v-tap row" style={{ marginBottom: 10 }} onClick={onClick}>
      <div className="grow">
        <div style={{ fontFamily: "'Quicksand','Baloo 2',sans-serif", fontWeight: 700, fontSize: 16 }}>{title}</div>
        <div className="note">{sub}</div>
      </div>
      <span aria-hidden style={{ color: 'var(--muted-2)', fontSize: 18 }}>›</span>
    </div>
  );
}
