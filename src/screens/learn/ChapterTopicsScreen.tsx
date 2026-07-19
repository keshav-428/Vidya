import React from 'react';
import { useTranslation } from 'react-i18next';
import VIcon from '../../prototype/icons';
import { VTopBar, VBottomNav, VProfileChip } from '../../prototype/shared';
import { classChapters, chapterByIdC } from '../../content/syllabus';
import { chapterMastery, levelFor, skillKey, type MasteryLevel } from '../../lib/mastery';
import api from '../../api/vidya';
import type { ScreenProps, AppState, MasteryMap } from '../../types';

// ─────────────────────────────────────────────────────────────
//  Chapter Tour — "a chapter is a place you go, a topic is a
//  thing you do." No chapter-sized lesson: this page orients the
//  student (level per topic, journey order) and routes them into
//  ONE topic's lesson. Deep learning always happens per topic.
// ─────────────────────────────────────────────────────────────

const LEVEL_COLOR: Record<MasteryLevel, string> = {
  new: 'var(--muted-2)', needshelp: '#B84030', improving: '#B45309', confident: 'var(--indigo)', strong: '#1A7A4A',
};

export default function ChapterTopicsScreen({ go, set, state }: ScreenProps) {
  const { t } = useTranslation(['learn', 'common']);
  const cls = api.toGrade(state?.classLevel);
  const chapter = chapterByIdC(cls, state?.chapterId as string) || classChapters(cls)[0];
  const map = (state?.mastery as MasteryMap) || {};
  const cm = chapterMastery(map, chapter);

  // Opening a topic scopes the lesson to this chapter+section.
  const openTopic = (subtopicTitle: string, section: string) => {
    set && set({
      askedConcept: `${chapter.title} — ${subtopicTitle}`,
      askedChapterId: chapter.id, askedSection: section,
      skillId: null,
    } as unknown as Partial<AppState>);
    go('learn-concept');
  };

  // "Start here" = first topic that isn't started yet, else the weakest one.
  const levelOf = (num: string) => levelFor(map[skillKey(chapter.id, num)]);
  const startHere =
    chapter.subtopics.find((s) => levelOf(s.num) === 'new')
    || [...chapter.subtopics].sort((a, b) => {
      const ma = map[skillKey(chapter.id, a.num)], mb = map[skillKey(chapter.id, b.num)];
      return (ma?.ewma ?? 1) - (mb?.ewma ?? 1);
    })[0]
    || chapter.subtopics[0];

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)', position: 'relative' }}>
      <VTopBar showBack onBack={() => go('learn')} title={t('chapterTopics.topbar', { num: chapter.num })}
        right={<VProfileChip go={go} name={state.name} />} />
      <div style={{ padding: '72px 24px 140px' }}>
        <div className="v-eyebrow" style={{ marginBottom: 8 }}>{t('chapterTopics.eyebrow', { num: chapter.num, cls })}</div>
        <h1 className="v-h1" style={{ fontSize: 30, marginBottom: 14, lineHeight: 1.12 }}>{chapter.title}</h1>

        {/* Where you stand in this chapter */}
        <div className="v-card" style={{ padding: '16px 18px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 15 }}>
          <div style={{ position: 'relative', width: 46, height: 46, flexShrink: 0 }}>
            <svg width="46" height="46" viewBox="0 0 46 46">
              <circle cx="23" cy="23" r="18" fill="none" stroke="var(--border)" strokeWidth="5" />
              <circle cx="23" cy="23" r="18" fill="none" stroke={LEVEL_COLOR[cm.level]} strokeWidth="5"
                strokeDasharray={`${cm.coverage * 113} 113`} strokeLinecap="round" transform="rotate(-90 23 23)" />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter', fontSize: 11, fontWeight: 700, color: 'var(--ink)' }}>
              {cm.touched}/{cm.totalSubtopics}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 15, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.2 }}>
              {cm.touched === 0 ? t('tour.fresh') : t('tour.explored', { touched: cm.touched, total: cm.totalSubtopics })}
            </div>
            <div style={{ fontSize: 11.5, color: LEVEL_COLOR[cm.level], fontWeight: 700, marginTop: 3 }}>
              {t(`common:levels.${cm.level}`)}
            </div>
          </div>
        </div>

        {/* Start here CTA */}
        {startHere && (
          <div className="v-card v-tap" onClick={() => openTopic(startHere.title, startHere.num)}
            style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22, background: 'var(--ink)', color: '#fff', padding: '15px 16px' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <VIcon name="zap" size={16} color="#fff" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'Inter', fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 3 }}>
                {cm.touched === 0 ? t('tour.startHere') : t('tour.upNext')}
              </div>
              <div style={{ fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 16, lineHeight: 1.2 }}>{startHere.num} · {startHere.title}</div>
            </div>
            <VIcon name="arrow-right" size={16} color="#fff" />
          </div>
        )}

        {/* The journey: every topic with your level */}
        <div className="v-eyebrow" style={{ marginBottom: 10 }}>{t('chapterTopics.topicsHeader')}</div>
        <div className="v-card" style={{ padding: 0, overflow: 'hidden', marginBottom: 24 }}>
          {chapter.subtopics.map((s, i) => {
            const lvl = levelOf(s.num);
            const color = LEVEL_COLOR[lvl];
            return (
              <div key={s.id} className="v-tap" onClick={() => openTopic(s.title, s.num)}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '15px 18px', borderTop: i ? '1px solid var(--border)' : 'none' }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--indigo-air)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 13, fontWeight: 600, color: 'var(--indigo)' }}>
                  {s.num}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 16, lineHeight: 1.25 }}>{s.title}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                    <div style={{ width: 7, height: 7, borderRadius: 9999, background: color }} />
                    <span style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: 600, color: lvl === 'new' ? 'var(--muted-2)' : color }}>
                      {lvl === 'new' ? t('common:notStarted') : t(`common:levels.${lvl}`)}
                    </span>
                  </div>
                </div>
                <VIcon name="chevron-right" size={16} color="var(--muted-2)" />
              </div>
            );
          })}
        </div>
      </div>
      <VBottomNav active="learn" go={go} />
    </div>
  );
}
