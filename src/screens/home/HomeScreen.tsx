import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import VIcon from '../../prototype/icons';
import { VSoftBackdrop, VTopBar, VBottomNav, VProfileChip, VContextChip, VidyaAvatar } from '../../prototype/shared';
import api from '../../api/vidya';
import { classChapters, chapterInfo, chapterTitleById, type SyllabusChapter } from '../../content/syllabus';
import { levelFor, skillKey, type MasteryLevel } from '../../lib/mastery';
import type { ScreenProps, GoFn, ScreenId, MasteryMap, PracticeSelection } from '../../types';

// Level → dot color on topic rows ('new' stays neutral).
const LEVEL_DOT: Record<MasteryLevel, string> = {
  new: 'var(--border)', needshelp: '#B84030', improving: '#B45309', confident: 'var(--indigo)', strong: '#1A7A4A',
};

import { WEEK_TOPIC_CATALOG, refreshPlanDays } from '../../content/weekPlan';

/** One day cell in the home week strip. */
interface WeekDay {
  day: string;
  date: number;
  isWeekday: boolean;
  isToday: boolean;
}

/** A week-strip slot: a day plus its plan info. */
interface WeekSlot extends Partial<WeekDay> {
  isToday?: boolean;
  month?: string;
  topicId?: string | null;
  section?: string | null;
  subtopicTitle?: string | null;
  status?: string;
  [key: string]: unknown;
}

function getWeekDays(): WeekDay[] {
  const today = new Date();
  const days = [];
  // Rolling week: starts today, so no already-past days sit in the strip.
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dow = d.getDay();
    days.push({
      day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dow],
      date: d.getDate(),
      isWeekday: dow !== 0 && dow !== 6,
      isToday: i === 0,
    });
  }
  return days;
}

// Resolve a week-slot topicId → title via the class-aware syllabus,
// falling back to the legacy week catalog for any older saved plans.
function weekTopicTitle(id: string): string {
  return chapterTitleById(id) || WEEK_TOPIC_CATALOG[id]?.title || '';
}

function buildWeekBannerData(startTopicId: string, savedWeekPlan: unknown, chapters: SyllabusChapter[]): WeekSlot[] {
  const days = getWeekDays();
  if (Array.isArray(savedWeekPlan) && savedWeekPlan.length === 7) {
    // Use the plan's OWN days (it stores its dates) and re-mark today, so the
    // strip stays correct as the week rolls on. Today's slot always reflects the
    // current session chapter, so the strip and the session card never disagree.
    return refreshPlanDays(savedWeekPlan as WeekSlot[]).map((slot) =>
      slot.isToday ? { ...slot, topicId: startTopicId } : slot);
  }
  // Default week: TODAY = the chosen chapter; other days step through the
  // chapter list relative to today (yesterday = prev chapter, tomorrow = next).
  const len = chapters.length;
  const startIdx = Math.max(0, chapters.findIndex((c) => c.id === startTopicId));
  const todayIdx = days.findIndex((d) => d.isToday);
  return days.map((d, i) => {
    if (!d.isWeekday && !d.isToday) return { ...d, topicId: null, status: 'rest' };
    const chapter = chapters[(((startIdx + (i - todayIdx)) % len) + len) % len];
    return { ...d, topicId: chapter.id, status: d.isToday ? 'today' : 'upcoming' };
  });
}

const COACH_STEP_KEYS = ['coach.step1', 'coach.step2'];

interface CoachBubbleProps {
  step?: number;
  name?: string;
  onAction: (step: number) => void;
  onDismiss: () => void;
}

function CoachBubble({ step, onAction, onDismiss }: CoachBubbleProps) {
  const { t } = useTranslation('home');
  if (step === undefined || step >= COACH_STEP_KEYS.length) return null;
  const k = COACH_STEP_KEYS[step];
  const s = { eyebrow: t(`${k}.eyebrow`), title: t(`${k}.title`), body: t(`${k}.body`), cta: t(`${k}.cta`) };
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
                {t('coach.skip')}
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
          {COACH_STEP_KEYS.map((_, i) => (
            <div key={i} style={{ height: 4, borderRadius: 9999, background: i === step ? 'var(--saffron)' : 'rgba(255,255,255,0.18)', width: i === step ? 20 : 6, transition: 'width 0.3s ease' }} />
          ))}
        </div>
      </div>
    </>
  );
}

interface WeekBannerProps {
  weekData: WeekSlot[];
  go: GoFn;
  highlight: boolean;
}

function WeekBanner({ weekData, go, highlight }: WeekBannerProps) {
  const { t } = useTranslation('home');
  return (
    <div className="v-card v-enter" style={{ padding: '10px 12px 12px', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontFamily: 'Inter', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--muted-2)' }}>
          {t('week.thisWeek')}
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
          {t('week.viewPlan')} <VIcon name="chevron-right" size={10} color="var(--indigo)" />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4, alignItems: 'stretch' }}>
        {weekData.map((d, i) => {
          const isToday = d.isToday;
          const isDone = d.status === 'done';
          const isRest = d.status === 'rest';
          const topicLabel = d.subtopicTitle || (d.topicId ? weekTopicTitle(d.topicId) : null);
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
                {isToday ? t('week.today') : d.day?.[0]}
              </div>
              <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: isToday ? 15 : 13, fontWeight: 700, color: isToday ? '#fff' : 'var(--ink)', lineHeight: 1, textDecoration: isRest ? 'line-through' : 'none', textDecorationColor: 'var(--muted-2)' }}>
                {d.date}
              </div>
              {isToday && topicLabel ? (
                <div style={{ fontFamily: 'Inter', fontSize: 9, fontWeight: 700, color: 'var(--saffron)', marginTop: 2, lineHeight: 1, textAlign: 'center', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>
                  {topicLabel}
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


interface NewSessionPickerProps {
  onClose: () => void;
  onStart: (sel: PracticeSelection[]) => void;
  chapters: SyllabusChapter[];
  mastery?: MasteryMap;
}

// Sessions are topic-wise: pick a chapter (the place), then one or more topics
// (the things you'll do). Multiple topics run as ONE session covering them all.
function NewSessionPicker({ onClose, onStart, chapters, mastery }: NewSessionPickerProps) {
  const { t } = useTranslation(['home', 'common']);
  const [openChapter, setOpenChapter] = useState<string | null>(null);
  const [sel, setSel] = useState<PracticeSelection[]>([]);
  const keyOf = (c: string, s: string) => `${c}::${s}`;
  const isSel = (c: string, s: string) => sel.some((x) => keyOf(x.chapterId, x.section) === keyOf(c, s));
  const toggle = (chapterId: string, section: string, title: string) => setSel((prev) => {
    const k = keyOf(chapterId, section);
    return prev.some((x) => keyOf(x.chapterId, x.section) === k)
      ? prev.filter((x) => keyOf(x.chapterId, x.section) !== k)
      : [...prev, { chapterId, section, title }];
  });
  const selCountIn = (ch: SyllabusChapter) => ch.subtopics.filter((sub) => isSel(ch.id, sub.num)).length;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(16,48,97,0.45)', backdropFilter: 'blur(3px)' }} />
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderRadius: '24px 24px 0 0', maxHeight: '85%', display: 'flex', flexDirection: 'column', animation: 'vSlideUp 0.4s cubic-bezier(.16,1,.3,1) both' }}>
        <div style={{ padding: '24px 22px 0' }}>
          <div style={{ width: 36, height: 4, borderRadius: 9999, background: 'var(--border)', margin: '0 auto 20px' }} />
          <div style={{ fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 18, fontWeight: 800, color: 'var(--ink)', marginBottom: 4 }}>{t('newSession.title')}</div>
          <div style={{ fontFamily: 'Inter', fontSize: 12, color: 'var(--muted)', marginBottom: 20 }}>{t('newSession.desc')}</div>
        </div>
        <div style={{ overflowY: 'auto', flex: 1, padding: '0 22px 24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {chapters.map(ch => {
              const isOpen = openChapter === ch.id;
              const chCount = selCountIn(ch);
              return (
                <div key={ch.id} style={{ borderRadius: 14, border: chCount ? '1px solid var(--indigo-soft)' : '1px solid var(--border)', overflow: 'hidden', background: '#fff' }}>
                  <div className="v-tap" onClick={() => setOpenChapter(isOpen ? null : ch.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'Inter', fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{ch.title}</div>
                      <div style={{ fontFamily: 'Inter', fontSize: 11, color: chCount ? 'var(--indigo)' : 'var(--muted-2)', marginTop: 1, fontWeight: chCount ? 700 : 400 }}>
                        {chCount
                          ? t('newSession.selectedCount', { count: chCount, total: ch.subtopics.length })
                          : t('common:topicsCount', { count: ch.subtopics.length })}
                      </div>
                    </div>
                    <VIcon name={isOpen ? 'chevron-down' : 'chevron-right'} size={14} color="var(--muted-2)" />
                  </div>
                  {isOpen && ch.subtopics.map((sub) => {
                    const lvl = levelFor((mastery || {})[skillKey(ch.id, sub.num)]);
                    const on = isSel(ch.id, sub.num);
                    return (
                      <div key={sub.id} className="v-tap" onClick={() => toggle(ch.id, sub.num, sub.title)}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px 11px 16px', borderTop: '1px solid var(--border-soft)', background: on ? '#FAFAFF' : '#fff' }}>
                        <span style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: 600, color: 'var(--muted-2)', minWidth: 28, fontVariantNumeric: 'tabular-nums' }}>{sub.num}</span>
                        <div style={{ flex: 1, minWidth: 0, fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 14, lineHeight: 1.25 }}>{sub.title}</div>
                        <div style={{ width: 7, height: 7, borderRadius: 9999, flexShrink: 0, background: LEVEL_DOT[lvl] }} />
                        <div style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, border: on ? 'none' : '1.5px solid var(--border)', background: on ? 'var(--indigo)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {on && <VIcon name="check" size={11} color="#fff" strokeWidth={2.5} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ padding: '12px 22px 36px', borderTop: '1px solid var(--border-soft)' }}>
          <button className="v-btn-primary v-tap" onClick={() => sel.length && onStart(sel)}
            disabled={sel.length === 0} style={{ opacity: sel.length === 0 ? 0.4 : 1 }}>
            {sel.length > 1
              ? t('newSession.startMulti', { count: sel.length })
              : t('newSession.start')} <VIcon name="arrow-right" size={14} color="#fff" />
          </button>
        </div>
      </div>
    </div>
  );
}

interface VivaPickerProps {
  onClose: () => void;
  onStart: (sel: PracticeSelection[], mode: 'learn' | 'speak' | 'both', level: 'easy' | 'normal' | 'hard') => void;
  chapters: SyllabusChapter[];
  mastery?: MasteryMap;
}

// Two steps: pick the topics the teacher set, then say what you want out of it.
// A viva is a SPEAKING task, so preparing (understanding it) and practising
// (saying it) are separate things a student may want either or both of.
function VivaPicker({ onClose, onStart, chapters, mastery }: VivaPickerProps) {
  const { t } = useTranslation(['home', 'common']);
  const [step, setStep] = useState<'topics' | 'config'>('topics');
  const [openChapter, setOpenChapter] = useState<string | null>(null);
  const [sel, setSel] = useState<PracticeSelection[]>([]);
  const [mode, setMode] = useState<'learn' | 'speak' | 'both'>('both');
  const [level, setLevel] = useState<'easy' | 'normal' | 'hard'>('normal');

  const keyOf = (c: string, x: string) => `${c}::${x}`;
  const isSel = (c: string, x: string) => sel.some((v) => keyOf(v.chapterId, v.section) === keyOf(c, x));
  const toggle = (chapterId: string, section: string, title: string) => setSel((prev) => {
    const k = keyOf(chapterId, section);
    return prev.some((v) => keyOf(v.chapterId, v.section) === k)
      ? prev.filter((v) => keyOf(v.chapterId, v.section) !== k)
      : [...prev, { chapterId, section, title }];
  });
  const selCountIn = (ch: SyllabusChapter) => ch.subtopics.filter((sb) => isSel(ch.id, sb.num)).length;

  const MODES: { id: 'learn' | 'speak' | 'both'; label: string; sub: string }[] = [
    { id: 'learn', label: t('vivaPicker.modeLearn'), sub: t('vivaPicker.modeLearnSub') },
    { id: 'speak', label: t('vivaPicker.modeSpeak'), sub: t('vivaPicker.modeSpeakSub') },
    { id: 'both', label: t('vivaPicker.modeBoth'), sub: t('vivaPicker.modeBothSub') },
  ];
  const LEVELS: { id: 'easy' | 'normal' | 'hard'; label: string }[] = [
    { id: 'easy', label: t('vivaPicker.levelEasy') },
    { id: 'normal', label: t('vivaPicker.levelNormal') },
    { id: 'hard', label: t('vivaPicker.levelHard') },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(16,48,97,0.45)', backdropFilter: 'blur(3px)' }} />
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderRadius: '24px 24px 0 0', maxHeight: '85%', display: 'flex', flexDirection: 'column', animation: 'vSlideUp 0.4s cubic-bezier(.16,1,.3,1) both' }}>
        <div style={{ padding: '24px 22px 0', flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 9999, background: 'var(--border)', margin: '0 auto 20px' }} />
          <div style={{ fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 18, fontWeight: 800, color: 'var(--ink)', marginBottom: 4 }}>
            {step === 'topics' ? t('vivaPicker.title') : t('vivaPicker.configTitle')}
          </div>
          <div style={{ fontFamily: 'Inter', fontSize: 12, color: 'var(--muted)', marginBottom: 20 }}>
            {step === 'topics' ? t('vivaPicker.desc') : t('vivaPicker.configDesc', { count: sel.length })}
          </div>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, padding: '0 22px 20px' }}>
          {step === 'topics' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {chapters.map((ch) => {
                const isOpen = openChapter === ch.id;
                const chCount = selCountIn(ch);
                return (
                  <div key={ch.id} style={{ borderRadius: 14, border: chCount ? '1px solid var(--indigo-soft)' : '1px solid var(--border)', overflow: 'hidden', background: '#fff' }}>
                    <div className="v-tap" onClick={() => setOpenChapter(isOpen ? null : ch.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: 'Inter', fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{ch.title}</div>
                        <div style={{ fontFamily: 'Inter', fontSize: 11, color: chCount ? 'var(--indigo)' : 'var(--muted-2)', marginTop: 1, fontWeight: chCount ? 700 : 400 }}>
                          {chCount
                            ? t('newSession.selectedCount', { count: chCount, total: ch.subtopics.length })
                            : t('common:topicsCount', { count: ch.subtopics.length })}
                        </div>
                      </div>
                      <VIcon name={isOpen ? 'chevron-down' : 'chevron-right'} size={14} color="var(--muted-2)" />
                    </div>
                    {isOpen && ch.subtopics.map((sb) => {
                      const on = isSel(ch.id, sb.num);
                      const lvl = levelFor((mastery || {})[skillKey(ch.id, sb.num)]);
                      return (
                        <div key={sb.id} className="v-tap" onClick={() => toggle(ch.id, sb.num, sb.title)}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px 11px 16px', borderTop: '1px solid var(--border-soft)', background: on ? '#FAFAFF' : '#fff' }}>
                          <span style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: 600, color: 'var(--muted-2)', minWidth: 28, fontVariantNumeric: 'tabular-nums' }}>{sb.num}</span>
                          <div style={{ flex: 1, minWidth: 0, fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 14, lineHeight: 1.25 }}>{sb.title}</div>
                          <div style={{ width: 7, height: 7, borderRadius: 9999, flexShrink: 0, background: LEVEL_DOT[lvl] }} />
                          <div style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, border: on ? 'none' : '1.5px solid var(--border)', background: on ? 'var(--indigo)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {on && <VIcon name="check" size={11} color="#fff" strokeWidth={2.5} />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ) : (
            <>
              <div className="v-eyebrow-sm" style={{ marginBottom: 10 }}>{t('vivaPicker.whatDoYouWant')}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 22 }}>
                {MODES.map((m) => {
                  const on = mode === m.id;
                  return (
                    <div key={m.id} className="v-tap" onClick={() => setMode(m.id)} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', borderRadius: 14,
                      background: on ? 'var(--ink)' : '#fff',
                      border: on ? '1.5px solid var(--ink)' : '1px solid var(--border)',
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: 'Inter', fontSize: 13.5, fontWeight: 700, color: on ? '#fff' : 'var(--ink)' }}>{m.label}</div>
                        <div style={{ fontFamily: 'Inter', fontSize: 11.5, color: on ? 'rgba(255,255,255,0.6)' : 'var(--muted-2)', marginTop: 2 }}>{m.sub}</div>
                      </div>
                      <div style={{ width: 20, height: 20, borderRadius: 9999, flexShrink: 0, border: on ? 'none' : '1.5px solid var(--border)', background: on ? 'var(--saffron)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {on && <VIcon name="check" size={11} color="#fff" strokeWidth={2.5} />}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="v-eyebrow-sm" style={{ marginBottom: 10 }}>{t('vivaPicker.howHard')}</div>
              <div style={{ display: 'flex', gap: 6, padding: 4, background: 'var(--bg-warm)', borderRadius: 9999, border: '1px solid var(--border)' }}>
                {LEVELS.map((l) => {
                  const on = level === l.id;
                  return (
                    <div key={l.id} className="v-tap" onClick={() => setLevel(l.id)} style={{
                      flex: 1, textAlign: 'center', padding: '9px 8px', borderRadius: 9999,
                      background: on ? 'var(--ink)' : 'transparent', color: on ? '#fff' : 'var(--ink)',
                      fontFamily: 'Inter', fontSize: 12.5, fontWeight: on ? 700 : 500,
                      transition: 'background .15s, color .15s',
                    }}>{l.label}</div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div style={{ padding: '12px 22px 36px', borderTop: '1px solid var(--border-soft)', display: 'flex', gap: 10, flexShrink: 0 }}>
          {step === 'config' && (
            <button className="v-btn-secondary v-tap" style={{ flex: 1 }} onClick={() => setStep('topics')}>
              {t('vivaPicker.back')}
            </button>
          )}
          <button className="v-btn-primary v-tap"
            style={{ flex: 2, opacity: sel.length === 0 ? 0.4 : 1 }}
            disabled={sel.length === 0}
            onClick={() => (step === 'topics' ? setStep('config') : onStart(sel, mode, level))}>
            {step === 'topics'
              ? t('vivaPicker.next', { count: sel.length })
              : t('vivaPicker.start', { count: sel.length })}
            <VIcon name={step === 'topics' ? 'arrow-right' : 'mic'} size={14} color="#fff" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HomeScreen({ go, state, set }: ScreenProps) {
  const { t } = useTranslation(['home', 'common']);
  // A user "has a plan" once they've picked a chapter / built a week plan.
  // Until then the home is a clean empty state — no defaulted session.
  const grade = api.toGrade(state?.classLevel);
  const chapters = classChapters(grade);
  const hasPlan = Boolean(state?.planTopicId || state?.weekPlan);
  const topicId = state?.planTopicId || chapters[0]?.id || '';
  const chapterTitleStr = chapterInfo(topicId)?.title || api.topicTitle(topicId);
  // Subtopic-wise session: today targets one skill; the chapter is context.
  const sessionSubtopic = (state?.planSubtopicTitle as string) || null;
  const sessionSel = (state?.planSessionSel as PracticeSelection[] | undefined) || null;
  const topicTitleStr = (sessionSel && sessionSel.length > 1)
    ? t('multiTopicSession', { count: sessionSel.length })
    : (sessionSubtopic || chapterTitleStr);

  const todayStr = new Date().toDateString();
  const sessionStep = state.sessionDate === todayStr ? (state.sessionStep || 0) : 0;

  const weekData = buildWeekBannerData(topicId, state?.weekPlan, chapters);

  // Gated on coachStep alone: BOTH plan paths get the tutorial nudges.
  // (Was gated on ownPlan, so students who took Vidya's plan got none.)
  const coachStep = (state?.coachStep ?? 99) < 2 ? (state?.coachStep as number) : undefined;
  const handleCoachAction = (step: number) => {
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

  const STEPS: { id: string; label: string; sub: string; screen: ScreenId }[] = [
    { id: 'concept', label: t('steps.concept.label'), sub: t('steps.concept.sub'), screen: 'learn-concept' },
    { id: 'quiz', label: t('steps.quiz.label'), sub: t('steps.quiz.sub'), screen: 'navigable-quiz' },
    { id: 'analysis', label: t('steps.analysis.label'), sub: t('steps.analysis.sub'), screen: 'session-analysis' },
  ];
  const allDone = sessionStep >= STEPS.length;

  return (
    <VSoftBackdrop variant="warm">
      <VTopBar transparent left={<VContextChip go={go} classLevel={state?.classLevel || 6} />} right={<VProfileChip go={go} name={state.name} />} />
      <div style={{ padding: '72px 22px 100px', display: 'flex', flexDirection: 'column', gap: 18, minHeight: '100%' }}>

        <div className="v-enter">
          <div style={{ fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 26, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
            {t('greeting', { name: state.name || 'there' })}
          </div>
          <div style={{ fontFamily: 'Inter', fontSize: 13, color: 'var(--muted)', marginTop: 3, lineHeight: 1.5 }}>
            {allDone ? t('sessionComplete') : t('ready')}
          </div>
        </div>

        {!hasPlan && (
          <div className="v-enter" style={{ marginTop: 8, background: '#fff', borderRadius: 20, border: '1px solid var(--border)', padding: '28px 22px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <VidyaAvatar size={56} />
            </div>
            <div style={{ fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 20, fontWeight: 800, color: 'var(--ink)', marginBottom: 6 }}>
              {t('empty.title')}
            </div>
            <div style={{ fontFamily: 'Inter', fontSize: 13, color: 'var(--muted)', lineHeight: 1.55, marginBottom: 20 }}>
              {t('empty.body')}
            </div>
            <button className="v-btn-primary v-tap" onClick={() => setNewSessionOpen(true)} style={{ width: '100%' }}>
              {t('empty.cta')} <VIcon name="arrow-right" size={14} color="#fff" />
            </button>
            <div className="v-tap" onClick={() => go('week-plan')} style={{ marginTop: 14, fontFamily: 'Inter', fontSize: 12.5, color: 'var(--indigo)', fontWeight: 600 }}>
              {t('empty.planWeek')}
            </div>
          </div>
        )}

        {hasPlan && (<>
        <WeekBanner weekData={weekData} go={go} highlight={coachStep === 0} />

        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div className="v-tap" onClick={() => setNewSessionOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'Inter', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted-2)', cursor: 'default' }}>
            {t('today', { topic: topicTitleStr })}
            <VIcon name="chevron-right" size={12} color="var(--indigo)" />
          </div>
          <div className="v-tap" onClick={() => setNewSessionOpen(true)} style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: 600, color: 'var(--indigo)', cursor: 'default' }}>
            {t('change')}
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
                      <span style={{ fontFamily: 'Inter', fontSize: 11, color: '#5BAA7A' }}>{t('complete')}</span>
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
                          {sessionSubtopic ? `${chapterTitleStr} · ${step.label}` : t('upNext', { label: step.label })}
                        </div>
                        <div style={{ fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em', marginBottom: 3 }}>
                          {topicTitleStr}
                        </div>
                        <div style={{ fontFamily: 'Inter', fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{step.sub}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', background: '#fff' }}>
                        <span style={{ fontFamily: 'Inter', fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{t('startStep', { label: step.label })}</span>
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
              <div style={{ fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 15, fontWeight: 700, color: '#1A7A4A', marginBottom: 3 }}>{t('doneCard.title')}</div>
              <div style={{ fontFamily: 'Inter', fontSize: 12, color: '#2D7A50' }}>{t('doneCard.body')}</div>
            </div>
            <button className="v-tap" onClick={() => setNewSessionOpen(true)} style={{ background: 'transparent', border: '1px solid #1A7A4A33', borderRadius: 10, padding: '7px 12px', fontFamily: 'Inter', fontSize: 11, fontWeight: 600, color: '#1A7A4A', cursor: 'default' }}>
              {t('doneCard.new')}
            </button>
          </div>
        )}

        <div className="v-enter">
          <div className="v-tap" onClick={() => setVivaOpen(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: '#fff', borderRadius: 16, border: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontFamily: 'Inter', fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 2 }}>{t('viva.title')}</div>
              <div style={{ fontFamily: 'Inter', fontSize: 11, color: 'var(--muted-2)' }}>{t('viva.sub')}</div>
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
          chapters={chapters}
          mastery={state?.mastery as MasteryMap}
          onClose={() => setNewSessionOpen(false)}
          onStart={(sel) => {
            setNewSessionOpen(false);
            // Sessions are topic-wise. The singular fields mirror sel[0] so
            // everything that reads them (week strip, mastery seed) still works.
            set({
              planSessionSel: sel,
              planTopicId: sel[0].chapterId,
              planSection: sel[0].section,
              planSubtopicTitle: sel[0].title,
              skillId: undefined,
              sessionStep: 0,
              sessionDate: new Date().toDateString(),
            });
          }}
        />
      )}
      {vivaOpen && (
        <VivaPicker
          chapters={chapters}
          mastery={state?.mastery as MasteryMap}
          onClose={() => setVivaOpen(false)}
          onStart={(sel, mode, level) => {
            setVivaOpen(false);
            set({ vivaSel: sel, vivaMode: mode, vivaLevel: level });
            // 'learn' and 'both' revise the topics first; 'both' then speaks.
            if (mode === 'speak') { go('viva'); return; }
            set({ lessonSel: sel, lessonNext: mode === 'both' ? 'viva' : 'home' });
            go('learn-concept');
          }}
        />
      )}
    </VSoftBackdrop>
  );
}
