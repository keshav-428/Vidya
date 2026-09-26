// ─────────────────────────────────────────────────────────────
//  Level 3: one student, in full.
//
//  This is the end of the funnel, so it is the one place numbers belong
//  — they are about one child and a decision, not thirty rows to scan.
//  It opens with what to do about them today, because that is what the
//  teacher came here for; the history is underneath.
// ─────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react';
import {
  getStudentReport, setPractice, splitKey,
  type StudentReport, type TeacherClass,
} from '../api';
import { TopBar } from '../ui/Chrome';
import { STATE_STYLE } from './StudentList';

export default function StudentDetail({ klass, studentId, name, onBack, onProfile, teacherName }: {
  klass: TeacherClass;
  studentId: string;
  name: string;
  onBack: () => void;
  onProfile: () => void;
  teacherName: string;
}) {
  const [d, setD] = useState<StudentReport | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [setting, setSetting] = useState<string | null>(null);
  const [justSet, setJustSet] = useState<string[]>([]);

  useEffect(() => {
    let live = true;
    getStudentReport(klass.class_id, studentId)
      .then((res) => { if (live) setD(res); })
      .catch((e) => { if (live) setErr(e.message); });
    return () => { live = false; };
  }, [klass.class_id, studentId]);

  // Practice for THIS child only.
  const assign = async (key: string, title: string) => {
    const { chapterId, section } = splitKey(key);
    setSetting(key);
    setErr(null);
    try {
      await setPractice(klass.class_id, chapterId, section, title, [studentId]);
      setJustSet((s) => [...s, key]);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSetting(null);
    }
  };

  const st = d ? STATE_STYLE[d.state] : null;
  // Already set, either just now or on an earlier visit. Matched on title
  // because that is what an assignment stores — a skill key would never
  // match it, which an earlier version of this line got wrong.
  const alreadySet = (key: string, title: string) =>
    justSet.includes(key) || (d?.assignments || []).some((a) => a.title === title);

  return (
    <>
      <TopBar title="Student" onBack={onBack} onProfile={onProfile} teacherName={teacherName} />

      <div className="wrap v-enter">
        <div className="row" style={{ marginBottom: 20 }}>
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

        {/* What to do about them today — the reason the teacher opened this. */}
        {d && d.teach_today && (
          <div className="v-card" style={{ marginBottom: 12 }}>
            <div className="v-eyebrow-sm" style={{ marginBottom: 6 }}>Teach them this</div>
            <div className="v-h2" style={{ marginBottom: 4 }}>{d.teach_today.title}</div>
            <div className="note" style={{ marginBottom: 12 }}>
              Their weakest topic, at {d.teach_today.percent}%.
            </div>
            <button className="v-btn-primary v-tap"
              disabled={setting === d.teach_today.key || alreadySet(d.teach_today.key, d.teach_today.title)}
              onClick={() => assign(d.teach_today!.key, d.teach_today!.title)}>
              {alreadySet(d.teach_today.key, d.teach_today.title) ? 'Practice set'
                : setting === d.teach_today.key ? 'Setting…'
                : 'Set as practice'}
            </button>
          </div>
        )}

        {/* Three numbers, because this screen is about one child. */}
        {d && (
          <div className="row" style={{ gap: 10, marginBottom: 12 }}>
            <Stat n={d.chapters_practised} label="chapters practised" />
            <Stat n={d.quizzes_completed} label="quizzes done" />
            <Stat n={d.idle_days < 0 ? '—' : d.idle_days === 0 ? 'today' : `${d.idle_days}d`} label="last practised" />
          </div>
        )}

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
                {w.key !== d.teach_today?.key && (
                  <button className="v-btn-secondary v-tap" style={{ marginTop: 10 }}
                    disabled={setting === w.key || alreadySet(w.key, w.title)}
                    onClick={() => assign(w.key, w.title)}>
                    {alreadySet(w.key, w.title) ? 'Practice set'
                      : setting === w.key ? 'Setting…' : 'Set as practice'}
                  </button>
                )}
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

        {d && d.assignments.length > 0 && (
          <div className="v-card" style={{ marginBottom: 12 }}>
            <div className="v-eyebrow-sm" style={{ marginBottom: 12 }}>Practice set for them</div>
            {d.assignments.map((a) => (
              <div key={a.assignment_id} className="row" style={{ marginBottom: 10 }}>
                <span className="grow" style={{ fontSize: 14.5 }}>
                  {a.title}
                  {a.just_them && <span className="note"> · just them</span>}
                </span>
                <span className="note" style={{ color: a.done ? 'var(--accent-success)' : 'var(--muted-2)' }}>
                  {a.done ? 'done' : 'not yet'}
                </span>
              </div>
            ))}
          </div>
        )}

        {d && d.recent_quizzes.length > 0 && (
          <div className="v-card-soft" style={{ marginBottom: 16 }}>
            <div className="v-eyebrow-sm" style={{ marginBottom: 10 }}>Recent quizzes</div>
            {d.recent_quizzes.map((q, i) => (
              <div key={i} className="row" style={{ marginBottom: 8 }}>
                <span className="grow" style={{ fontSize: 14 }}>{q.topic || 'Quiz'}</span>
                <span className="note">{q.score} / {q.total}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function Stat({ n, label }: { n: number | string; label: string }) {
  return (
    <div className="v-card-soft" style={{ flex: 1, textAlign: 'center', padding: '14px 6px' }}>
      <div style={{ fontFamily: "'Quicksand','Baloo 2',sans-serif", fontWeight: 700, fontSize: 22 }}>{n}</div>
      <div className="v-eyebrow-sm" style={{ marginTop: 3 }}>{label}</div>
    </div>
  );
}
