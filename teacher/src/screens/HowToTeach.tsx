// ─────────────────────────────────────────────────────────────
//  How to teach it — the other half of "teach this today".
//
//  Naming the weak topic leaves the teacher to prepare the lesson at
//  6am. This is what to say and what to write: one misconception, an
//  opening line, two things for the board, a question for the room, and
//  the wrong answers to expect — several of them taken from what this
//  class's own students actually answered.
//
//  Shaped for chalk. If it cannot be written on a board it is not here.
// ─────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react';
import { getTeachingGuide, type TeachingGuide, type TeacherClass } from '../api';
import { TopBar } from '../ui/Chrome';

export default function HowToTeach({ klass, topic, chapterId, section, shaky, of, onBack, onProfile, teacherName }: {
  klass: TeacherClass;
  topic: string;
  chapterId?: string | null;
  section?: string | null;
  shaky?: number;
  of?: number;
  onBack: () => void;
  onProfile: () => void;
  teacherName: string;
}) {
  const [g, setG] = useState<TeachingGuide | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    getTeachingGuide({
      topic, grade: klass.grade, chapterId, section,
      classId: klass.class_id, shaky, of,
    })
      .then((res) => { if (live) setG(res); })
      .catch((e) => { if (live) setErr(e.message); });
    return () => { live = false; };
  }, [klass.class_id, klass.grade, topic, chapterId, section, shaky, of]);

  return (
    <>
      <TopBar title="How to teach it" onBack={onBack} onProfile={onProfile} teacherName={teacherName} />

      <div className="wrap v-enter">
        <h1 className="v-h1" style={{ fontSize: 24 }}>{topic}</h1>
        <p className="v-body" style={{ marginBottom: 22 }}>
          {of ? `${shaky} of ${of} are shaky on this. ` : ''}Ten minutes, a board, no printing.
        </p>

        {err && <div className="error">{err}</div>}
        {!g && !err && <div className="empty">Writing your plan… this takes a few seconds.</div>}

        {g && (
          <>
            <div className="v-card" style={{ marginBottom: 12 }}>
              <div className="v-eyebrow-sm" style={{ marginBottom: 8 }}>What they believe that is wrong</div>
              <div style={{ fontSize: 15, lineHeight: 1.55 }}>{g.misconception}</div>
            </div>

            <div className="v-card" style={{ marginBottom: 12 }}>
              <div className="v-eyebrow-sm" style={{ marginBottom: 8 }}>Open with this</div>
              <div style={{ fontSize: 15, lineHeight: 1.6, fontStyle: 'italic' }}>“{g.opening}”</div>
            </div>

            {g.board.map((b, i) => (
              <div key={i} className="v-card" style={{ marginBottom: 12 }}>
                <div className="v-eyebrow-sm" style={{ marginBottom: 8 }}>On the board · {i + 1}</div>
                <div className="v-h2" style={{ marginBottom: 10 }}>{b.title}</div>
                {/* What to write, set apart so it can be copied at a glance. */}
                <div style={{
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  fontSize: 15, lineHeight: 1.5, color: 'var(--indigo-ink)',
                  background: 'var(--indigo-air)', borderRadius: 14, padding: '14px 16px',
                  marginBottom: 12,
                }}>{b.write}</div>
                <div style={{ fontSize: 14.5, lineHeight: 1.6, color: 'var(--muted)' }}>{b.say}</div>
              </div>
            ))}

            <div className="v-card" style={{ marginBottom: 12 }}>
              <div className="v-eyebrow-sm" style={{ marginBottom: 8 }}>Then ask the room</div>
              <div style={{ fontSize: 15, lineHeight: 1.6, marginBottom: 10 }}>{g.check.ask}</div>
              <div className="row" style={{ marginBottom: 8 }}>
                <span className="note grow">Answer</span>
                <span style={{ fontFamily: "'Quicksand','Baloo 2',sans-serif", fontWeight: 700 }}>{g.check.answer}</span>
              </div>
              <div className="note">{g.check.wrong_if}</div>
            </div>

            <div className="v-card-soft" style={{ marginBottom: 16 }}>
              <div className="v-eyebrow-sm" style={{ marginBottom: 10 }}>Watch for</div>
              {g.watch_for.map((w, i) => (
                <div key={i} className="row" style={{ alignItems: 'flex-start', marginBottom: 10 }}>
                  <span style={{ width: 6, height: 6, borderRadius: 9999, background: 'var(--saffron)', flexShrink: 0, marginTop: 7 }} />
                  <span className="grow" style={{ fontSize: 14, lineHeight: 1.55 }}>{w}</span>
                </div>
              ))}
            </div>

            <p className="note" style={{ textAlign: 'center' }}>
              Written for this class, from what your own students answered.
            </p>
          </>
        )}
      </div>
    </>
  );
}
