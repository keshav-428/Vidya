// ─────────────────────────────────────────────────────────────
//  Every topic the class is shaky on, and what they have got.
//
//  Only the single most urgent one shows on the class screen. The rest
//  is reference: real, worth having, and not what a teacher needs in the
//  thirty seconds before a period starts.
// ─────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react';
import {
  getSummary, getAssignments, setPractice, splitKey,
  type Assignment, type ClassSummary, type TeacherClass,
} from '../api';

export default function Topics({ klass, onBack }: {
  klass: TeacherClass;
  onBack: () => void;
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

  return (
    <>
      <div className="v-topbar">
        <button className="v-link" onClick={onBack}>‹ {klass.name}</button>
        <span className="v-eyebrow">Topics</span>
      </div>

      <div className="wrap v-enter">
        <h1 className="v-h1">Topics</h1>
        <p className="v-body" style={{ marginBottom: 22 }}>
          {summary === null ? 'Loading…' : 'Where the class stands, topic by topic.'}
        </p>

        {err && <div className="error">{err}</div>}

        {summary && summary.reteach.length > 0 && (
          <div className="v-card" style={{ marginBottom: 12 }}>
            <div className="v-eyebrow-sm" style={{ marginBottom: 14 }}>Still shaky</div>
            {summary.reteach.map((r) => {
              const already = assignments.some((a) => a.title === r.title);
              return (
                <div key={r.key} style={{ marginBottom: 18 }}>
                  <div className="v-h2" style={{ marginBottom: 6 }}>{r.title}</div>
                  <div className="note" style={{ marginBottom: 8 }}>{r.shaky} of {r.of} still shaky</div>
                  <div style={{ height: 6, borderRadius: 9999, background: 'var(--border)', overflow: 'hidden', marginBottom: 10 }}>
                    <div style={{ width: `${Math.round((r.shaky / Math.max(r.of, 1)) * 100)}%`, height: '100%', background: 'var(--saffron)' }} />
                  </div>
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

        {summary && summary.safe.length > 0 && (
          <div className="v-card-soft">
            <div className="v-eyebrow-sm" style={{ marginBottom: 10 }}>Safe to move on</div>
            {summary.safe.map((sf) => (
              <div key={sf.key} className="row" style={{ marginBottom: 8 }}>
                <span className="grow" style={{ fontSize: 14.5 }}>{sf.title}</span>
                <span className="note">{sf.of} checked</span>
              </div>
            ))}
          </div>
        )}

        {summary && summary.reteach.length === 0 && summary.safe.length === 0 && (
          <div className="empty">
            Nothing to show yet. Once your students have answered a few
            questions each, their topics appear here.
          </div>
        )}
      </div>
    </>
  );
}
