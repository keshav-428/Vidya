import React, { useState, useEffect } from 'react';
import VIcon from '../../prototype/icons';
import { VSoftBackdrop, VTopBar, VBottomNav, VProfileChip, VidyaAvatar } from '../../prototype/shared';
import api from '../../api/vidya';
import { CHAPTERS, chapterById } from '../../content/chapters';

import { WEEK_TOPIC_CATALOG } from './WeekPlanScreen';

function getWeekDays() {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - dayOfWeek + i);
    days.push({
      day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i],
      date: d.getDate(),
      isWeekday: i > 0 && i < 6,
      isToday: i === dayOfWeek,
    });
  }
  return days;
}

// Resolve a week-slot topicId → title. Prefers the canonical NCERT chapters,
// falls back to the legacy week catalog for any custom-saved plans.
function weekTopicTitle(id) {
  const c = CHAPTERS.find((x) => x.id === id);
  if (c) return c.title;
  return WEEK_TOPIC_CATALOG[id]?.title || '';
}

function buildWeekBannerData(startTopicId, savedWeekPlan) {
  const days = getWeekDays();
  if (savedWeekPlan && savedWeekPlan.length === 7) {
    // Today's slot always reflects the current session chapter, so the strip
    // and the session card never disagree. Other days keep the saved plan.
    return days.map((d, i) => {
      const slot = { ...d, ...savedWeekPlan[i] };
      if (d.isToday) slot.topicId = startTopicId;
      return slot;
    });
  }
  // Default week: TODAY = the chosen chapter; other days step through the
  // chapter list relative to today (yesterday = prev chapter, tomorrow = next).
  const len = CHAPTERS.length;
  const startIdx = Math.max(0, CHAPTERS.findIndex((c) => c.id === startTopicId));
  const todayIdx = days.findIndex((d) => d.isToday);
  return days.map((d, i) => {
    if (!d.isWeekday && !d.isToday) return { ...d, topicId: null, status: 'rest' };
    const chapter = CHAPTERS[(((startIdx + (i - todayIdx)) % len) + len) % len];
    return { ...d, topicId: chapter.id, status: d.isToday ? 'today' : 'upcoming' };
  });
}

const COACH_STEPS = [
  {
    eyebrow: 'Step 1 of 3',
    title: 'Set up your week plan',
    body: "Pick topics for each day — you're in full control. I'll wait here while you do it.",
    cta: 'Set up my week →',
  },
  {
    eyebrow: 'Step 2 of 3',
    title: "Plan's ready — let's study!",
    body: "Each session has 3 parts: Concept, Quiz, then Analysis. Let's start the first one.",
    cta: 'Start first session →',
  },
];

function CoachBubble({ step, name, onAction, onDismiss }) {
  if (step === undefined || step >= COACH_STEPS.length) return null;
  const s = COACH_STEPS[step];
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 49, pointerEvents: 'none', background: 'rgba(28,25,23,0.18)' }} />
      <div style={{
        position: 'fixed', bottom: 90, left: 14, right: 14, zIndex: 60,
        background: 'var(--ink)', borderRadius: 24, padding: '18px 18px 16px',
        boxShadow: '0 24px 56px rgba(0,0,0,0.45)',
        animation: 'vSheetUp 0.4s cubic-bezier(.16,1,.3,1) both',
      }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <VidyaAvatar size={44} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'Inter', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--saffron)', marginBottom: 4 }}>
              {s.eyebrow}
            </div>
            <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 17, fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: 6 }}>
              {s.title}
            </div>
            <div style={{ fontFamily: 'Inter', fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.55, marginBottom: 16 }}>
              {s.body}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button className="v-tap" onClick={onDismiss} style={{ background: 'transparent', border: 'none', fontFamily: 'Inter', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.28)', cursor: 'default', padding: 0 }}>
                Skip tutorial
              </button>
              <button className="v-tap" onClick={() => onAction(step)} style={{
                background: 'var(--saffron)', border: 'none', borderRadius: 999,
                padding: '9px 18px', fontFamily: 'Inter', fontSize: 12, fontWeight: 700,
                color: '#fff', cursor: 'default',
              }}>
                {s.cta}
              </button>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 5, justifyContent: 'center', marginTop: 14 }}>
          {COACH_STEPS.map((_, i) => (
            <div key={i} style={{ height: 4, borderRadius: 9999, background: i === step ? 'var(--saffron)' : 'rgba(255,255,255,0.18)', width: i === step ? 20 : 6, transition: 'width 0.3s ease' }} />
          ))}
        </div>
      </div>
    </>
  );
}

function WeekBanner({ weekData, go, highlight }) {
  return (
    <div className="v-card v-enter" style={{ padding: '10px 12px 12px', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontFamily: 'Inter', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--muted-2)' }}>
          This week
        </div>
        <div className="v-tap" onClick={() => go('week-plan')} style={{
          display: 'flex', alignItems: 'center', gap: 2,
          fontFamily: 'Inter', fontSize: 10.5, color: 'var(--indigo)', fontWeight: 600,
          background: highlight ? 'rgba(56,72,168,0.10)' : 'transparent',
          borderRadius: 999, padding: highlight ? '4px 10px 4px 8px' : '0',
          border: highlight ? '1px solid rgba(56,72,168,0.25)' : 'none',
          animation: highlight ? 'vPulseRing 1.8s ease infinite' : 'none',
          transition: 'all 0.2s ease',
        }}>
          View plan <VIcon name="chevron-right" size={10} color="var(--indigo)" />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4, alignItems: 'stretch' }}>
        {weekData.map((d, i) => {
          const isToday = d.isToday;
          const isDone = d.status === 'done';
          const isRest = d.status === 'rest';
          const t = d.topicId ? weekTopicTitle(d.topicId) : null;
          return (
            <div key={i} style={{
              flex: isToday ? 2.2 : 1,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: isToday ? '7px 6px 8px' : '6px 4px',
              borderRadius: 10,
              background: isToday ? 'var(--ink)' : isRest ? 'transparent' : 'transparent',
              transition: 'flex 0.25s cubic-bezier(.2,.7,.3,1)',
              gap: 2,
              minWidth: 0,
              opacity: isRest ? 0.35 : 1,
            }}>
              <div style={{ fontFamily: 'Inter', fontSize: 8.5, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: isToday ? 'rgba(255,255,255,0.45)' : 'var(--muted-2)', lineHeight: 1 }}>
                {isToday ? 'TODAY' : d.day[0]}
              </div>
              <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: isToday ? 15 : 13, fontWeight: 700, color: isToday ? '#fff' : 'var(--ink)', lineHeight: 1, textDecoration: isRest ? 'line-through' : 'none', textDecorationColor: 'var(--muted-2)' }}>
                {d.date}
              </div>
              {isToday && t ? (
                <div style={{ fontFamily: 'Inter', fontSize: 9, fontWeight: 700, color: 'var(--saffron)', marginTop: 2, lineHeight: 1, textAlign: 'center', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>
                  {t}
                </div>
              ) : (
                <div style={{ width: 4, height: 4, borderRadius: '50%', marginTop: 2, background: isDone ? '#1A7A4A' : isRest ? 'transparent' : 'var(--border)', flexShrink: 0 }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


function NewSessionPicker({ onClose, onStart }) {
  const [selected, setSelected] = useState(null);
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 200 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(16,48,97,0.45)', backdropFilter: 'blur(3px)' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: '#fff', borderRadius: '24px 24px 0 0', maxHeight: '85%', display: 'flex', flexDirection: 'column', animation: 'vSlideUp 0.4s cubic-bezier(.16,1,.3,1) both' }}>
        <div style={{ padding: '24px 22px 0' }}>
          <div style={{ width: 36, height: 4, borderRadius: 9999, background: 'var(--border)', margin: '0 auto 20px' }} />
          <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 18, fontWeight: 800, color: 'var(--ink)', marginBottom: 4 }}>New session</div>
          <div style={{ fontFamily: 'Inter', fontSize: 12, color: 'var(--muted)', marginBottom: 20 }}>Choose a chapter to study. You will go through Concept, Quiz and Analysis.</div>
        </div>
        <div style={{ overflowY: 'auto', flex: 1, padding: '0 22px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 16 }}>
            {CHAPTERS.map(ch => {
              const on = selected === ch.id;
              return (
                <div key={ch.id} className="v-tap" onClick={() => setSelected(ch.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14, background: on ? 'var(--ink)' : '#fff', border: on ? '1.5px solid var(--ink)' : '1px solid var(--border)', transition: 'all 150ms ease' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'Inter', fontSize: 13, fontWeight: 600, color: on ? '#fff' : 'var(--ink)' }}>{ch.title}</div>
                    <div style={{ fontFamily: 'Inter', fontSize: 11, color: on ? 'rgba(255,255,255,0.55)' : 'var(--muted-2)', marginTop: 1 }}>{ch.sub}</div>
                  </div>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: on ? 'rgba(255,255,255,0.2)' : 'var(--bg-warm)', border: on ? 'none' : '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {on && <VIcon name="check" size={11} color="#fff" strokeWidth={2.5} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ padding: '12px 22px 36px', borderTop: '1px solid var(--border-soft)' }}>
          <button className="v-btn-primary v-tap" onClick={() => selected && onStart(selected)} disabled={!selected} style={{ opacity: selected ? 1 : 0.4 }}>
            Start session <VIcon name="arrow-right" size={14} color="#fff" />
          </button>
        </div>
      </div>
    </div>
  );
}

function VivaPicker({ onClose, onStart }) {
  const [selected, setSelected] = useState(['fractions']);
  const toggle = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 200 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(16,48,97,0.45)', backdropFilter: 'blur(3px)' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: '#fff', borderRadius: '24px 24px 0 0', maxHeight: '85%', display: 'flex', flexDirection: 'column', animation: 'vSlideUp 0.4s cubic-bezier(.16,1,.3,1) both' }}>
        <div style={{ padding: '24px 22px 0' }}>
          <div style={{ width: 36, height: 4, borderRadius: 9999, background: 'var(--border)', margin: '0 auto 20px' }} />
          <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 18, fontWeight: 800, color: 'var(--ink)', marginBottom: 4 }}>Start a Viva</div>
          <div style={{ fontFamily: 'Inter', fontSize: 12, color: 'var(--muted)', marginBottom: 20 }}>Pick the chapters you want to practise. I will ask you questions — explain your answers out loud.</div>
        </div>
        <div style={{ overflowY: 'auto', flex: 1, padding: '0 22px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 16 }}>
            {CHAPTERS.map(ch => {
              const on = selected.includes(ch.id);
              return (
                <div key={ch.id} className="v-tap" onClick={() => toggle(ch.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14, background: on ? 'var(--ink)' : '#fff', border: on ? '1.5px solid var(--ink)' : '1px solid var(--border)', transition: 'all 150ms ease' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'Inter', fontSize: 13, fontWeight: 600, color: on ? '#fff' : 'var(--ink)' }}>{ch.title}</div>
                    <div style={{ fontFamily: 'Inter', fontSize: 11, color: on ? 'rgba(255,255,255,0.55)' : 'var(--muted-2)', marginTop: 1 }}>{ch.sub}</div>
                  </div>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: on ? 'rgba(255,255,255,0.2)' : 'var(--bg-warm)', border: on ? 'none' : '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {on && <VIcon name="check" size={11} color="#fff" strokeWidth={2.5} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ padding: '12px 22px 36px', borderTop: '1px solid var(--border-soft)' }}>
          <button className="v-btn-primary v-tap" onClick={() => onStart(selected)} disabled={selected.length === 0} style={{ opacity: selected.length === 0 ? 0.4 : 1 }}>
            Start viva · {selected.length} chapter{selected.length !== 1 ? 's' : ''} <VIcon name="mic" size={14} color="#fff" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HomeScreen({ go, state, set }) {
  // A user "has a plan" once they've picked a chapter / built a week plan.
  // Until then the home is a clean empty state — no defaulted session.
  const hasPlan = Boolean(state?.planTopicId || state?.weekPlan);
  const topicId = state?.planTopicId || 'fractions';
  const topic = chapterById(topicId);

  const todayStr = new Date().toDateString();
  const sessionStep = state.sessionDate === todayStr ? (state.sessionStep || 0) : 0;

  const weekData = buildWeekBannerData(topicId, state?.weekPlan);

  const coachStep = state?.ownPlan && (state?.coachStep ?? 0) < 2 ? (state?.coachStep ?? 0) : undefined;
  const handleCoachAction = (step) => {
    if (step === 0) {
      set({ coachStep: 1 });
      go('week-plan');
    } else if (step === 1) {
      set({ coachStep: 2 });
      go('learn-concept');
    } else {
      set({ coachStep: 99, ownPlan: false });
    }
  };
  const handleCoachDismiss = () => set({ coachStep: 99, ownPlan: false });

  const [newSessionOpen, setNewSessionOpen] = useState(false);
  const [vivaOpen, setVivaOpen] = useState(false);

  // Personalised daily greeting from the LLM (falls back to static line).
  const [greeting, setGreeting] = useState(null);
  useEffect(() => {
    let alive = true;
    api.dailyGreeting({
      userId: state?.userId || 'local-student',
      name: state?.name || 'there',
      grade: api.toGrade(state?.classLevel),
      language: state?.language || 'English',
    })
      .then((b) => { if (alive && b) setGreeting(typeof b === 'string' ? b : (b.text || '')); })
      .catch(() => {});
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const STEPS = [
    { id: 'concept', label: 'Concept', sub: 'Understand the idea', screen: 'learn-concept' },
    { id: 'quiz', label: 'Quiz', sub: 'Test your knowledge', screen: 'navigable-quiz' },
    { id: 'analysis', label: 'Analysis', sub: 'Review your performance', screen: 'session-analysis' },
  ];
  const allDone = sessionStep >= STEPS.length;

  return (
    <VSoftBackdrop variant="warm">
      <VTopBar hideLogo transparent right={<VProfileChip go={go} name={state.name} />} />
      <div style={{ padding: '72px 22px 100px', display: 'flex', flexDirection: 'column', gap: 18, minHeight: '100%' }}>

        <div className="v-enter">
          <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 26, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
            Hi {state.name || 'there'}
          </div>
          <div style={{ fontFamily: 'Inter', fontSize: 13, color: 'var(--muted)', marginTop: 3, lineHeight: 1.5 }}>
            {allDone ? 'Session complete — great work today!' : (greeting || "Ready for today's session?")}
          </div>
        </div>

        {!hasPlan && (
          <div className="v-enter" style={{ marginTop: 8, background: '#fff', borderRadius: 20, border: '1px solid var(--border)', padding: '28px 22px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <VidyaAvatar size={56} />
            </div>
            <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 20, fontWeight: 800, color: 'var(--ink)', marginBottom: 6 }}>
              Let's set up your learning
            </div>
            <div style={{ fontFamily: 'Inter', fontSize: 13, color: 'var(--muted)', lineHeight: 1.55, marginBottom: 20 }}>
              Pick a chapter to start your first session. You decide what to learn and when — Vidya guides you through it.
            </div>
            <button className="v-btn-primary v-tap" onClick={() => setNewSessionOpen(true)} style={{ width: '100%' }}>
              Choose a chapter <VIcon name="arrow-right" size={14} color="#fff" />
            </button>
            <div className="v-tap" onClick={() => go('week-plan')} style={{ marginTop: 14, fontFamily: 'Inter', fontSize: 12.5, color: 'var(--indigo)', fontWeight: 600 }}>
              Or plan your whole week →
            </div>
          </div>
        )}

        {hasPlan && (<>
        <WeekBanner weekData={weekData} go={go} highlight={coachStep === 0} />

        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div className="v-tap" onClick={() => setNewSessionOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'Inter', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted-2)', cursor: 'default' }}>
            Today · {topic.title}
            <VIcon name="chevron-right" size={12} color="var(--indigo)" />
          </div>
          <div className="v-tap" onClick={() => setNewSessionOpen(true)} style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: 600, color: 'var(--indigo)', cursor: 'default' }}>
            Change
          </div>
        </div>

        <div className="v-enter" style={{ display: 'flex', flexDirection: 'column' }}>
          {STEPS.map((step, i) => {
            const isDone = i < sessionStep;
            const isActive = i === sessionStep && !allDone;
            const isLocked = i > sessionStep;
            const isLast = i === STEPS.length - 1;
            return (
              <div key={step.id} style={{ display: 'flex', gap: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: 28 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isDone ? '#1A7A4A' : isActive ? 'var(--ink)' : 'transparent',
                    border: isLocked ? '1.5px solid var(--border)' : 'none',
                    transition: 'all 0.3s ease',
                  }}>
                    {isDone
                      ? <VIcon name="check" size={12} color="#fff" strokeWidth={2.5} />
                      : <span style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: 700, color: isActive ? '#fff' : 'var(--muted-2)' }}>{i + 1}</span>
                    }
                  </div>
                  {!isLast && (
                    <div style={{
                      width: 1.5, flex: 1, minHeight: 14,
                      background: isDone ? '#1A7A4A' : 'var(--border)',
                      margin: '3px 0',
                      transition: 'background 0.4s ease',
                    }} />
                  )}
                </div>

                <div style={{ flex: 1, paddingBottom: isLast ? 0 : 10 }}>
                  {isDone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 5 }}>
                      <span style={{ fontFamily: 'Inter', fontSize: 13, fontWeight: 600, color: '#1A7A4A' }}>{step.label}</span>
                      <span style={{ fontFamily: 'Inter', fontSize: 11, color: '#5BAA7A' }}>Complete</span>
                    </div>
                  )}
                  {isActive && (
                    <div
                      data-coach-target={i === 0 ? 'session-cta' : undefined}
                      className="v-card v-tap"
                      onClick={() => { set({ skillId: undefined }); go(step.screen); }}
                      style={{ padding: 0, overflow: 'hidden' }}
                    >
                      <div style={{ padding: '16px 18px 13px', background: 'var(--ink)' }}>
                        <div style={{ fontFamily: 'Inter', fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>
                          {step.label} · Up next
                        </div>
                        <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em', marginBottom: 3 }}>
                          {topic.title}
                        </div>
                        <div style={{ fontFamily: 'Inter', fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{step.sub}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', background: '#fff' }}>
                        <span style={{ fontFamily: 'Inter', fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Start {step.label.toLowerCase()}</span>
                        <VIcon name="arrow-right" size={15} color="var(--ink)" />
                      </div>
                    </div>
                  )}
                  {isLocked && (
                    <div style={{ paddingTop: 5, opacity: 0.35 }}>
                      <span style={{ fontFamily: 'Inter', fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{step.label}</span>
                      <span style={{ fontFamily: 'Inter', fontSize: 11, color: 'var(--muted-2)', marginLeft: 8 }}>{step.sub}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {allDone && (
          <div className="v-card v-enter" style={{ padding: '18px 20px', background: '#EDFAF3', border: '1px solid #A8D5B9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 15, fontWeight: 700, color: '#1A7A4A', marginBottom: 3 }}>Session complete</div>
              <div style={{ fontFamily: 'Inter', fontSize: 12, color: '#2D7A50' }}>Great work today.</div>
            </div>
            <button className="v-tap" onClick={() => setNewSessionOpen(true)} style={{ background: 'transparent', border: '1px solid #1A7A4A33', borderRadius: 10, padding: '7px 12px', fontFamily: 'Inter', fontSize: 11, fontWeight: 600, color: '#1A7A4A', cursor: 'default' }}>
              New session
            </button>
          </div>
        )}

        <div className="v-enter">
          <div className="v-tap" onClick={() => setVivaOpen(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: '#fff', borderRadius: 16, border: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontFamily: 'Inter', fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 2 }}>Viva practice</div>
              <div style={{ fontFamily: 'Inter', fontSize: 11, color: 'var(--muted-2)' }}>Explain a concept out loud — select chapters</div>
            </div>
            <VIcon name="arrow-right" size={15} color="var(--muted-2)" />
          </div>
        </div>
        </>)}
      </div>

      <CoachBubble step={coachStep} name={state.name} onAction={handleCoachAction} onDismiss={handleCoachDismiss} />
      <VBottomNav active="home" go={go} />

      {newSessionOpen && (
        <NewSessionPicker
          onClose={() => setNewSessionOpen(false)}
          onStart={(topicId) => {
            setNewSessionOpen(false);
            // Clear any Learn-tab skillId so the session uses the chosen chapter.
            set({ planTopicId: topicId, skillId: undefined, sessionStep: 0, sessionDate: new Date().toDateString() });
          }}
        />
      )}
      {vivaOpen && (
        <VivaPicker
          onClose={() => setVivaOpen(false)}
          onStart={(chapters) => {
            setVivaOpen(false);
            set({ vivaChapters: chapters });
          }}
        />
      )}
    </VSoftBackdrop>
  );
}
