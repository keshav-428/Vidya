import React from 'react';
import { useTranslation } from 'react-i18next';
import VIcon from '../../prototype/icons';
import { VTopBar, VBottomNav, VAskVidyaFAB, VProfileChip, VSectionHeader } from '../../prototype/shared';
import { classChapters, chapterByIdC } from '../../content/syllabus';
import api from '../../api/vidya';
import type { ScreenProps, AppState } from '../../types';

// Drill-down: the subtopics (NCERT sections like 7.1, 7.2…) of one chapter.
// Reached from the Learn tab when a chapter is tapped. Tapping a subtopic opens
// the concept lesson for that specific section; "the whole chapter" learns the chapter.
export default function ChapterTopicsScreen({ go, set, state }: ScreenProps) {
  const { t } = useTranslation('learn');
  const cls = api.toGrade(state?.classLevel);
  const chapter = chapterByIdC(cls, state?.chapterId as string) || classChapters(cls)[0];

  // Opening a subtopic scopes the concept lesson to this chapter+section.
  const openConcept = (subtopicTitle: string, section: string | null) => {
    set && set({
      askedConcept: section ? `${chapter.title} — ${subtopicTitle}` : subtopicTitle,
      askedChapterId: chapter.id, askedSection: section,
      skillId: null,
    } as unknown as Partial<AppState>);
    go('learn-concept');
  };

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)', position: 'relative' }}>
      <VTopBar showBack onBack={() => go('learn')} title={t('chapterTopics.topbar', { num: chapter.num })}
        right={<VProfileChip go={go} name={state.name} />} />
      <div style={{ padding: '72px 24px 140px' }}>
        <div className="v-eyebrow" style={{ marginBottom: 8 }}>{t('chapterTopics.eyebrow', { num: chapter.num, cls })}</div>
        <h1 className="v-h1" style={{ fontSize: 32, marginBottom: 8, lineHeight: 1.1 }}>{chapter.title}</h1>
        <p className="v-body" style={{ marginBottom: 18 }}>
          {t('chapterTopics.topicCount', { count: chapter.subtopics.length })}
        </p>

        {/* Learn the full chapter */}
        <div className="v-card-soft v-tap" onClick={() => openConcept(chapter.title, null)}
          style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22, background: 'var(--ink)', color: '#fff' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <VIcon name="book" size={16} color="#fff" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 16, lineHeight: 1.2 }}>{t('chapterTopics.wholeChapter')}</div>
            <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>{t('chapterTopics.wholeChapterSub', { title: chapter.title })}</div>
          </div>
          <VIcon name="arrow-right" size={16} color="#fff" />
        </div>

        <VSectionHeader title={t('chapterTopics.topicsHeader')} />
        <div className="v-card" style={{ padding: 0, overflow: 'hidden', marginBottom: 24 }}>
          {chapter.subtopics.map((s, i) => (
            <div key={s.id} className="v-tap" onClick={() => openConcept(s.title, s.num)}
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', borderTop: i ? '1px solid var(--border)' : 'none' }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--indigo-air)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 13, fontWeight: 600, color: 'var(--indigo)' }}>
                {s.num}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 16, lineHeight: 1.25 }}>{s.title}</div>
              </div>
              <VIcon name="chevron-right" size={16} color="var(--muted-2)" />
            </div>
          ))}
        </div>
      </div>
      <VAskVidyaFAB context="learn" grade={cls} language={state?.language || 'English'} chapterId={chapter.id} />
      <VBottomNav active="learn" go={go} />
    </div>
  );
}
