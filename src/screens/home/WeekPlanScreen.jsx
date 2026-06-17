import React, { useState } from 'react';
import VIcon from '../../prototype/icons';
import { VTopBar, VidyaIcon } from '../../prototype/shared';
import { CHAPTERS } from '../../content/chapters';

const DEFAULT_MINS = 15;

// Resolve a day's topicId → display info. Canonical NCERT chapters first,
// legacy week catalog as a fallback for any old saved plans.
function topicInfo(id) {
  const c = CHAPTERS.find((x) => x.id === id);
  if (c) return { title: c.title, sub: c.sub, mins: DEFAULT_MINS };
  const w = WEEK_TOPIC_CATALOG[id];
  if (w) return { title: w.title, sub: w.sub, mins: w.mins };
  return { title: '', sub: '', mins: DEFAULT_MINS };
}

export const WEEK_TOPIC_CATALOG = {
  'integers':       { title: 'Integers',              sub: 'Positive & negative numbers',     mins: 15 },
  'fractions':      { title: 'Fractions & Decimals',  sub: 'Parts of a whole',                mins: 15 },
  'data-handling':  { title: 'Data Handling',         sub: 'Mean, median & mode',             mins: 14 },
  'equations':      { title: 'Simple Equations',      sub: 'Finding the unknown',             mins: 18 },
  'lines-angles':   { title: 'Lines & Angles',        sub: 'Types and properties',            mins: 16 },
  'triangles':      { title: 'Triangles',             sub: 'Properties & congruence',         mins: 18 },
  'congruence':     { title: 'Congruence',            sub: 'Congruent figures & triangles',   mins: 16 },
  'comparing':      { title: 'Comparing Quantities',  sub: 'Ratios, percentages & profit',   mins: 16 },
  'rational':       { title: 'Rational Numbers',      sub: 'Number line & operations',        mins: 18 },
  'prac-geometry':  { title: 'Practical Geometry',    sub: 'Constructions with compass',      mins: 20 },
  'perimeter-area': { title: 'Perimeter & Area',      sub: 'Rectangles, triangles, circles', mins: 20 },
  'algebra-expr':   { title: 'Algebraic Expressions', sub: 'Terms, factors & evaluation',    mins: 18 },
  'exponents':      { title: 'Exponents & Powers',    sub: 'Laws and standard form',          mins: 15 },
  'symmetry':       { title: 'Symmetry',              sub: 'Lines of symmetry & rotation',   mins: 14 },
  'solids':         { title: 'Visualising Solids',    sub: '3D shapes and their nets',        mins: 16 },
  'review':         { title: 'Mixed Review',          sub: 'Consolidate the week',            mins: 20 },
};

export const WEEK_STACKS = {
  integers:       ['integers', 'rational', 'comparing', 'equations', 'review'],
  fractions:      ['fractions', 'rational', 'data-handling', 'comparing', 'review'],
  'data-handling':['data-handling', 'comparing', 'fractions', 'integers', 'review'],
  equations:      ['equations', 'algebra-expr', 'rational', 'integers', 'review'],
  'lines-angles': ['lines-angles', 'triangles', 'congruence', 'prac-geometry', 'review'],
  triangles:      ['triangles', 'lines-angles', 'congruence', 'symmetry', 'review'],
  congruence:     ['congruence', 'triangles', 'lines-angles', 'prac-geometry', 'review'],
  comparing:      ['comparing', 'fractions', 'rational', 'data-handling', 'review'],
  rational:       ['rational', 'integers', 'fractions', 'algebra-expr', 'review'],
  'prac-geometry':['prac-geometry', 'lines-angles', 'triangles', 'symmetry', 'review'],
  'perimeter-area':['perimeter-area', 'lines-angles', 'triangles', 'prac-geometry', 'review'],
  'algebra-expr': ['algebra-expr', 'equations', 'exponents', 'rational', 'review'],
  exponents:      ['exponents', 'algebra-expr', 'rational', 'integers', 'review'],
  symmetry:       ['symmetry', 'lines-angles', 'solids', 'prac-geometry', 'review'],
  solids:         ['solids', 'symmetry', 'perimeter-area', 'prac-geometry', 'review'],
  // legacy aliases
  decimals:       ['fractions', 'rational', 'data-handling', 'comparing', 'review'],
  algebra:        ['algebra-expr', 'equations', 'exponents', 'rational', 'review'],
  geometry:       ['lines-angles', 'triangles', 'perimeter-area', 'prac-geometry', 'review'],
};

function getThisWeekDays() {
  const today = new Date();
  const dow = today.getDay();
  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - dow + i);
    return {
      day: DAY_NAMES[i],
      date: d.getDate(),
      month: MONTHS[d.getMonth()],
      fullDate: d,
      weekday: i > 0 && i < 6,
      isToday: i === dow,
    };
  });
}

// A blank week — no topics until the user adds them. Weekdays + today are
// "open" slots ("Tap to add a topic"); weekends default to free days.
function emptyWeekPlan() {
  return getThisWeekDays().map((d) => ({
    ...d,
    topicId: null,
    mins: 0,
    status: d.isToday ? 'today' : (d.weekday ? 'open' : 'rest'),
  }));
}

function ensureWeekPlan(state) {
  if (state?.weekPlan && Array.isArray(state.weekPlan) && state.weekPlan.length === 7) return state.weekPlan;
  return emptyWeekPlan();
}

function WeekStrip({ week }) {
  return (
    <div style={{
      display: 'flex', gap: 6, marginBottom: 18,
      background: '#fff', border: '1px solid var(--border)', borderRadius: 18,
      padding: '10px 12px', alignItems: 'stretch',
      boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
    }}>
      {week.map((d, i) => {
        const isToday = d.status === 'today';
        const isDone = d.status === 'done';
        const isRest = d.status === 'rest';
        const t = d.topicId ? topicInfo(d.topicId) : null;
        return (
          <div key={i} style={{
            flex: isToday ? 2.6 : 1,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: isToday ? 3 : 5,
            padding: isToday ? '7px 6px' : '4px 0', borderRadius: 12,
            background: isToday ? 'var(--ink)' : 'transparent',
            color: isToday ? '#fff' : 'var(--ink)',
            transition: 'flex .25s cubic-bezier(.2,.7,.3,1)',
            minWidth: 0,
          }}>
            <div style={{ fontFamily: 'Inter', fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: isToday ? 0.65 : (isRest ? 0.4 : 0.55) }}>
              {isToday ? `TODAY · ${d.day.slice(0, 3).toUpperCase()}` : d.day.slice(0, 1)}
            </div>
            <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: isToday ? 16 : 14, fontWeight: isToday ? 700 : 500, lineHeight: 1, opacity: isRest && !isToday ? 0.45 : 1 }}>
              {d.date}
            </div>
            {isToday && t ? (
              <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 11, fontWeight: 600, lineHeight: 1.1, letterSpacing: '-0.01em', color: 'var(--saffron)', maxWidth: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 }}>
                {t.title}
              </div>
            ) : (
              <div style={{ width: 5, height: 5, borderRadius: 9999, background: isDone ? 'var(--accent-success)' : isRest ? 'transparent' : 'var(--border)', border: isRest ? '1px solid var(--border)' : 'none', boxSizing: 'border-box' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function TopicPickerSheet({ day, dayIdx, onSelect, onToggleRest, onClose }) {
  const isRest = day.status === 'rest';
  const usedTopicId = day.topicId;

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 200 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(16,20,40,0.4)', backdropFilter: 'blur(2px)' }} />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: '#fff', borderRadius: '24px 24px 0 0',
        maxHeight: '78%', display: 'flex', flexDirection: 'column',
        animation: 'vSlideUp 0.35s cubic-bezier(.16,1,.3,1) both',
      }}>
        {/* handle */}
        <div style={{ width: 36, height: 4, borderRadius: 9999, background: 'var(--border)', margin: '14px auto 0', flexShrink: 0 }} />

        {/* header */}
        <div style={{ padding: '16px 20px 10px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontFamily: 'Inter', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: 3 }}>
                {day.day} {day.date}
              </div>
              <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 19, fontWeight: 800, color: 'var(--ink)' }}>
                {isRest ? 'Choose a topic' : 'Change topic'}
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'var(--bg-warm)', border: '1px solid var(--border-soft)', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'default' }}>
              <VIcon name="x" size={14} color="var(--muted)" />
            </button>
          </div>
          {!isRest && usedTopicId && (
            <div style={{ marginTop: 10, padding: '8px 12px', background: 'var(--bg-warm)', borderRadius: 10, border: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <VIcon name="check-circle" size={13} color="var(--accent-success)" />
              <span style={{ fontFamily: 'Inter', fontSize: 12, color: 'var(--muted)' }}>
                Currently: <strong style={{ color: 'var(--ink)' }}>{topicInfo(usedTopicId).title}</strong>
              </span>
            </div>
          )}
          <button className="v-tap" onClick={() => onToggleRest(dayIdx)} style={{
            width: '100%', background: 'var(--bg-warm)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '11px 16px', marginTop: 10,
            fontFamily: 'Inter', fontSize: 13, fontWeight: 600,
            color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, cursor: 'default',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
          }}>
            <VIcon name="moon" size={14} color="var(--muted)" />
            {isRest ? 'Already a free day' : 'Mark as free day'}
          </button>
        </div>

        {/* scrollable topic list */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '4px 20px 8px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {CHAPTERS.map((info) => {
              const id = info.id;
              const isCurrent = id === usedTopicId;
              return (
                <div key={id} className="v-tap" onClick={() => !isCurrent && onSelect(dayIdx, id)} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                  borderRadius: 14,
                  background: isCurrent ? 'var(--ink)' : '#fff',
                  border: isCurrent ? '1.5px solid var(--ink)' : '1px solid var(--border)',
                  opacity: isCurrent ? 1 : 1,
                  transition: 'all 120ms ease',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 15, fontWeight: 700, color: isCurrent ? '#fff' : 'var(--ink)', lineHeight: 1.2 }}>{info.title}</div>
                    <div style={{ fontFamily: 'Inter', fontSize: 11, color: isCurrent ? 'rgba(255,255,255,0.55)' : 'var(--muted-2)', marginTop: 2 }}>{info.sub} · {DEFAULT_MINS} min</div>
                  </div>
                  {isCurrent
                    ? <VIcon name="check" size={14} color="#fff" strokeWidth={2.5} />
                    : <VIcon name="chevron-right" size={13} color="var(--muted-2)" />
                  }
                </div>
              );
            })}
          </div>
        </div>

        {/* bottom safe area */}
        <div style={{ height: 32, flexShrink: 0 }} />
      </div>
    </div>
  );
}

export default function WeekPlanScreen({ go, state, set }) {
  const initialWeek = ensureWeekPlan(state);
  const [week, setWeek] = useState(initialWeek);
  const [sheetIdx, setSheetIdx] = useState(null);

  const commitWeek = (next) => {
    setWeek(next);
    // Keep the session topic in sync with today's slot, so the Concept/Quiz
    // that runs today matches what the plan says for today.
    const today = next.find((d) => d.isToday && d.topicId);
    const patch = { weekPlan: next };
    if (today?.topicId) patch.planTopicId = today.topicId;
    set && set(patch);
  };

  const swapTopic = (idx, topicId) => {
    const next = week.map((d, i) => {
      if (i !== idx) return d;
      return { ...d, topicId, mins: topicInfo(topicId).mins, status: d.isToday ? 'today' : 'upcoming' };
    });
    commitWeek(next);
    setSheetIdx(null);
  };

  const toggleRest = (idx) => {
    const next = week.map((d, i) => {
      if (i !== idx) return d;
      if (d.status === 'rest') {
        // Un-mark a free day → open slot (user then picks a topic).
        return { ...d, status: d.isToday ? 'today' : 'open', topicId: null, mins: 0 };
      }
      return { ...d, status: 'rest', topicId: null, mins: 0 };
    });
    commitWeek(next);
    setSheetIdx(null);
  };

  const workCount = week.filter(d => d.topicId).length;
  const totalMins = week.reduce((s, d) => s + (d.mins || 0), 0);

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)', position: 'relative' }}>
      <VTopBar transparent showBack onBack={() => go('home')} title="" />
      <div style={{ padding: '72px 22px 110px' }}>
        <div className="v-eyebrow" style={{ marginBottom: 8 }}>THIS WEEK</div>
        <h1 className="v-h1" style={{ fontSize: 32, marginBottom: 6, lineHeight: 1.1 }}>
          {workCount} topics<br />
          <span style={{ color: 'var(--muted)', fontWeight: 400 }}>across the week.</span>
        </h1>
        <p className="v-body" style={{ marginBottom: 18 }}>
          {week[0]?.day} {week[0]?.date} – {week[6]?.day} {week[6]?.date} · {week[0]?.month} · about {totalMins} min total
        </p>

        <WeekStrip week={week} />

        <div className="v-eyebrow" style={{ margin: '18px 0 10px', color: 'var(--muted-2)' }}>BY DAY</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {week.map((d, i) => {
            const isToday = d.status === 'today';
            const isRest = d.status === 'rest';
            const filled = !!d.topicId;
            const darkToday = isToday && filled;   // only highlight today once it has a topic
            const t = filled ? topicInfo(d.topicId) : null;
            return (
              <div key={i} className="v-tap" onClick={() => setSheetIdx(i)} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                background: darkToday ? 'var(--ink)' : '#fff',
                borderRadius: 18,
                border: darkToday ? '1px solid var(--ink)' : (!filled ? '1px dashed var(--border)' : '1px solid var(--border)'),
                boxShadow: darkToday ? '0 12px 32px rgba(28,25,23,0.18)' : '0 1px 2px rgba(0,0,0,0.02)',
              }}>
                <div style={{
                  width: 44, minWidth: 44, height: 48, borderRadius: 12, flexShrink: 0,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  background: darkToday ? 'rgba(255,255,255,0.10)' : 'var(--bg-warm)',
                  border: darkToday ? '1px solid rgba(255,255,255,0.18)' : '1px solid var(--border-soft)',
                }}>
                  <div style={{ fontFamily: 'Inter', fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: darkToday ? 'rgba(255,255,255,0.65)' : 'var(--muted-2)', lineHeight: 1 }}>{d.day}</div>
                  <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 20, lineHeight: 1, marginTop: 4, color: darkToday ? '#fff' : 'var(--ink)' }}>{d.date}</div>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  {isToday && <div className="v-eyebrow-sm" style={{ color: 'var(--saffron)', marginBottom: 3, letterSpacing: '0.1em' }}>TODAY</div>}
                  {!isToday && d.status === 'done' && <div className="v-eyebrow-sm" style={{ color: 'var(--accent-success)', marginBottom: 3, letterSpacing: '0.1em' }}>DONE</div>}
                  {!filled ? (
                    <>
                      <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 16, color: 'var(--muted)' }}>{isRest ? 'Free day' : 'Add a topic'}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted-2)', marginTop: 2 }}>Tap to choose a chapter</div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 16, letterSpacing: '-0.005em', color: darkToday ? '#fff' : 'var(--ink)' }}>{t.title}</div>
                      <div style={{ fontSize: 11.5, marginTop: 2, color: darkToday ? 'rgba(255,255,255,0.55)' : 'var(--muted-2)' }}>{t.sub} · {d.mins} min</div>
                    </>
                  )}
                </div>

                <VIcon name="edit" size={14} color={darkToday ? 'rgba(255,255,255,0.45)' : 'var(--muted-2)'} />
              </div>
            );
          })}
        </div>

      </div>

      {/* sticky save button */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
        padding: '12px 22px 28px',
        background: 'linear-gradient(to top, var(--bg) 70%, transparent)',
      }}>
        <button className="v-btn-primary v-tap" onClick={() => { commitWeek(week); go('home'); }}>
          Save plan
        </button>
      </div>

      {sheetIdx !== null && (
        <TopicPickerSheet
          day={week[sheetIdx]}
          dayIdx={sheetIdx}
          onSelect={swapTopic}
          onToggleRest={toggleRest}
          onClose={() => setSheetIdx(null)}
        />
      )}
    </div>
  );
}
