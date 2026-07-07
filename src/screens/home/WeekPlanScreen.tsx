import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import VIcon from '../../prototype/icons';
import { VTopBar } from '../../prototype/shared';
import { classChapters, chapterTitleById, subtopicCount, type SyllabusChapter } from '../../content/syllabus';
import { WEEK_TOPIC_CATALOG, type TopicInfo } from '../../content/weekPlan';
import api from '../../api/vidya';
import type { ScreenProps, AppState } from '../../types';

const DEFAULT_MINS = 15;

/** One day in the editable week plan. */
interface PlanDay {
  day: string;
  date: number;
  month: string;
  fullDate: Date;
  weekday: boolean;
  isToday: boolean;
  topicId: string | null;
  section?: string | null;
  subtopicTitle?: string | null;
  mins: number;
  status: string;
}

// Resolve a day's topicId → display info via the class-aware syllabus,
// falling back to the legacy week catalog for any old saved plans.
function topicInfo(id: string): TopicInfo {
  const title = chapterTitleById(id);
  if (title) return { title, sub: '', mins: DEFAULT_MINS };
  const w = WEEK_TOPIC_CATALOG[id];
  if (w) return { title: w.title, sub: w.sub, mins: w.mins };
  return { title: '', sub: '', mins: DEFAULT_MINS };
}

type WeekDayBase = Omit<PlanDay, 'topicId' | 'mins' | 'status'>;

function getThisWeekDays(): WeekDayBase[] {
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
function emptyWeekPlan(): PlanDay[] {
  return getThisWeekDays().map((d) => ({
    ...d,
    topicId: null,
    mins: 0,
    status: d.isToday ? 'today' : (d.weekday ? 'open' : 'rest'),
  }));
}

function ensureWeekPlan(state: AppState): PlanDay[] {
  if (state?.weekPlan && Array.isArray(state.weekPlan) && state.weekPlan.length === 7) return state.weekPlan as PlanDay[];
  return emptyWeekPlan();
}

function WeekStrip({ week }: { week: PlanDay[] }) {
  const { t } = useTranslation('extra');
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
        const info = d.topicId ? topicInfo(d.topicId) : null;
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
              {isToday ? `${t('weekPlan.today')} · ${d.day.slice(0, 3).toUpperCase()}` : d.day.slice(0, 1)}
            </div>
            <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: isToday ? 16 : 14, fontWeight: isToday ? 700 : 500, lineHeight: 1, opacity: isRest && !isToday ? 0.45 : 1 }}>
              {d.date}
            </div>
            {isToday && info ? (
              <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 11, fontWeight: 600, lineHeight: 1.1, letterSpacing: '-0.01em', color: 'var(--saffron)', maxWidth: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 }}>
                {info.title}
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

interface TopicPickerSheetProps {
  day: PlanDay;
  dayIdx: number;
  onSelect: (idx: number, id: string) => void;
  onToggleRest: (idx: number) => void;
  onClose: () => void;
  chapters: SyllabusChapter[];
}

function TopicPickerSheet({ day, dayIdx, onSelect, onToggleRest, onClose, chapters }: TopicPickerSheetProps) {
  const { t } = useTranslation(['extra', 'common']);
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
                {t('weekPlan.sheet.dayDate', { day: day.day, date: day.date })}
              </div>
              <div style={{ fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 19, fontWeight: 800, color: 'var(--ink)' }}>
                {isRest ? t('weekPlan.sheet.chooseTopic') : t('weekPlan.sheet.changeTopic')}
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
                {t('weekPlan.sheet.currently')} <strong style={{ color: 'var(--ink)' }}>{topicInfo(usedTopicId).title}</strong>
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
            {isRest ? t('weekPlan.sheet.alreadyFree') : t('weekPlan.sheet.markFree')}
          </button>
        </div>

        {/* scrollable topic list */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '4px 20px 8px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {chapters.map((info) => {
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
                    <div style={{ fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 15, fontWeight: 700, color: isCurrent ? '#fff' : 'var(--ink)', lineHeight: 1.2 }}>{info.title}</div>
                    <div style={{ fontFamily: 'Inter', fontSize: 11, color: isCurrent ? 'rgba(255,255,255,0.55)' : 'var(--muted-2)', marginTop: 2 }}>{t('common:topicsCount', { count: info.subtopics.length })}</div>
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

export default function WeekPlanScreen({ go, state, set }: ScreenProps) {
  const { t } = useTranslation(['extra', 'common']);
  const chapters = classChapters(api.toGrade(state?.classLevel));
  const initialWeek = ensureWeekPlan(state);
  const [week, setWeek] = useState<PlanDay[]>(initialWeek);
  const [sheetIdx, setSheetIdx] = useState<number | null>(null);

  const commitWeek = (next: PlanDay[]) => {
    setWeek(next);
    // Keep the session topic in sync with today's slot, so the Concept/Quiz
    // that runs today matches what the plan says for today.
    const today = next.find((d) => d.isToday && d.topicId);
    const patch: Partial<AppState> = { weekPlan: next };
    if (today?.topicId) {
      patch.planTopicId = today.topicId;
      // Keep today's session scope in sync (subtopic-wise if the slot has one).
      patch.planSection = today.section ?? undefined;
      patch.planSubtopicTitle = today.subtopicTitle ?? undefined;
    }
    set && set(patch);
  };

  const swapTopic = (idx: number, topicId: string) => {
    const next = week.map((d, i) => {
      if (i !== idx) return d;
      // Manually picking a chapter here scopes the day to the whole chapter.
      return { ...d, topicId, section: null, subtopicTitle: null, mins: topicInfo(topicId).mins, status: d.isToday ? 'today' : 'upcoming' };
    });
    commitWeek(next);
    setSheetIdx(null);
  };

  const toggleRest = (idx: number) => {
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
        <div className="v-eyebrow" style={{ marginBottom: 8 }}>{t('weekPlan.eyebrow')}</div>
        <h1 className="v-h1" style={{ fontSize: 32, marginBottom: 6, lineHeight: 1.1 }}>
          {t('weekPlan.headingTopics', { count: workCount })}<br />
          <span style={{ color: 'var(--muted)', fontWeight: 400 }}>{t('weekPlan.headingAcross')}</span>
        </h1>
        <p className="v-body" style={{ marginBottom: 18 }}>
          {t('weekPlan.summary', {
            startDay: week[0]?.day, startDate: week[0]?.date,
            endDay: week[6]?.day, endDate: week[6]?.date,
            month: week[0]?.month, mins: totalMins,
          })}
        </p>

        <WeekStrip week={week} />

        <div className="v-eyebrow" style={{ margin: '18px 0 10px', color: 'var(--muted-2)' }}>{t('weekPlan.byDay')}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {week.map((d, i) => {
            const isToday = d.status === 'today';
            const isRest = d.status === 'rest';
            const filled = !!d.topicId;
            const darkToday = isToday && filled;   // only highlight today once it has a topic
            const info = d.topicId ? topicInfo(d.topicId) : null;
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
                  {isToday && <div className="v-eyebrow-sm" style={{ color: 'var(--saffron)', marginBottom: 3, letterSpacing: '0.1em' }}>{t('weekPlan.today')}</div>}
                  {!isToday && d.status === 'done' && <div className="v-eyebrow-sm" style={{ color: 'var(--accent-success)', marginBottom: 3, letterSpacing: '0.1em' }}>{t('weekPlan.done')}</div>}
                  {!filled ? (
                    <>
                      <div style={{ fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 16, color: 'var(--muted)' }}>{isRest ? t('weekPlan.freeDay') : t('weekPlan.addTopic')}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted-2)', marginTop: 2 }}>{t('weekPlan.tapToChoose')}</div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 16, letterSpacing: '-0.005em', color: darkToday ? '#fff' : 'var(--ink)' }}>{d.subtopicTitle || info?.title}</div>
                      <div style={{ fontSize: 11.5, marginTop: 2, color: darkToday ? 'rgba(255,255,255,0.55)' : 'var(--muted-2)' }}>{d.subtopicTitle ? info?.title : t('common:topicsCount', { count: subtopicCount(d.topicId) })}</div>
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
          chapters={chapters}
        />
      )}
    </div>
  );
}
