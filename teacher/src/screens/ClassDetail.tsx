// ─────────────────────────────────────────────────────────────
//  One class — ONE answer, then ways out.
//
//  This screen used to carry six blocks: what to reteach, who to sit
//  with, what is safe, the code, the roster, what had been set. Splitting
//  the app into screens was not enough while every screen still held
//  everything — a teacher in the thirty seconds before a period should
//  see one thing to do, not a report.
//
//  So: the single most urgent topic, and three doors. Who needs you is a
//  count on the Students door rather than a second list of the same
//  names; the other topics live behind the card.
// ─────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react';
import {
  getSummary, getAssignments, setPractice, splitKey,
  type Assignment, type ClassSummary, type TeacherClass,
} from '../api';
import { TopBar } from '../ui/Chrome';

export default function ClassDetail({ klass, onBack, onProfile, teacherName, onStudents, onTopics, onTeach }: {
  klass: TeacherClass;
  onBack: () => void;
  onProfile: () => void;
  teacherName: string;
  onStudents: () => void;
  onTopics: () => void;
  /** Into the lesson plan for a topic — what to say, what to write. */
  onTeach: (t: { title: string; key: string; shaky: number; of: number }) => void;
}) {
  const [summary, setSummary] = useState<ClassSummary | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [setting, setSetting] = useState(false);

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

  const top = summary?.reteach?.[0] || null;
  const alreadySet = !!top && assignments.some((a) => a.title === top.title);

  const assign = async () => {
    if (!top) return;
    const { chapterId, section } = splitKey(top.key);
    setSetting(true);
    setErr(null);
    try {
      await setPractice(klass.class_id, chapterId, section, top.title);
      setAssignments(await getAssignments(klass.class_id));
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSetting(false);
    }
  };

  const joined = summary?.students ?? 0;
  const heard = summary?.students_with_data ?? 0;
  const needing = summary?.attention?.length ?? 0;
  const more = Math.max((summary?.reteach?.length ?? 0) - 1, 0);

  return (
    <>
      <TopBar title={`Class ${klass.grade}`} onBack={onBack} onProfile={onProfile} teacherName={teacherName} />

      <div className="wrap with-tabs v-enter">
        <h1 className="v-h1">{klass.name}</h1>

        {/* The denominator, before anything that rests on it. */}
        <p className="v-body" style={{ marginBottom: 22 }}>
          {summary === null ? 'Reading your class…'
            : heard > 0 ? `Based on ${heard} of ${joined} student${joined === 1 ? '' : 's'} who have been practising.`
            : joined > 0 ? `${joined} student${joined === 1 ? '' : 's'} joined. Nobody has practised enough yet for this to say anything.`
            : 'Nobody has joined yet.'}
        </p>

        {err && <div className="error">{err}</div>}

        {/* The one answer this screen exists to give. */}
        {top && (
          <div className="v-card" style={{ marginBottom: 14 }}>
            <div className="v-eyebrow-sm" style={{ marginBottom: 8 }}>Teach this today</div>
            <div style={{ fontFamily: "'Quicksand','Baloo 2',sans-serif", fontWeight: 700, fontSize: 21, lineHeight: 1.2, marginBottom: 6 }}>
              {top.title}
            </div>
            <div className="note" style={{ marginBottom: 12 }}>{top.shaky} of {top.of} still shaky</div>
            {/* Naming the topic is only half the job; this is the other half. */}
            <button className="v-btn-primary v-tap" style={{ marginBottom: 8 }}
              onClick={() => onTeach({ title: top.title, key: top.key, shaky: top.shaky, of: top.of })}>
              How to teach it
            </button>
            <button className="v-btn-secondary v-tap" disabled={setting || alreadySet} onClick={assign}>
              {alreadySet ? 'Practice set' : setting ? 'Setting…' : 'Set as practice'}
            </button>
          </div>
        )}

        {summary && !top && joined > 0 && (
          <div className="v-card" style={{ marginBottom: 14 }}>
            <div className="v-eyebrow-sm" style={{ marginBottom: 8 }}>Teach this today</div>
            <div className="empty" style={{ padding: 0 }}>
              {heard > 0
                ? 'Nothing is standing out. The class is keeping up with what they have practised.'
                : 'Once your students have answered a few questions each, this will name what to reteach.'}
            </div>
          </div>
        )}

        {/* One line, not a second copy of the student list: the names are
            a tab away, and printing them twice is what made this screen a
            report in the first place. */}
        {needing > 0 && (
          <div className="v-card-soft v-tap row" style={{ marginBottom: 10 }} onClick={onStudents}>
            <div className="grow">
              <div style={{ fontFamily: "'Quicksand','Baloo 2',sans-serif", fontWeight: 700, fontSize: 15 }}>
                {needing} student{needing === 1 ? '' : 's'} could use your time
              </div>
            </div>
            <span aria-hidden style={{ color: 'var(--muted-2)', fontSize: 18 }}>›</span>
          </div>
        )}

        {more > 0 && (
          <div style={{ textAlign: 'center' }}>
            <button className="v-link" onClick={onTopics}>
              {more} more topic{more === 1 ? '' : 's'} ›
            </button>
          </div>
        )}
      </div>
    </>
  );
}

