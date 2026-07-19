import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import VIcon from '../../prototype/icons';
import { VTopBar } from '../../prototype/shared';
import { relativeDay } from '../../lib/progress';
import {
  chapterMastery, subjectMastery, levelFor, skillKey,
  type MasteryLevel,
} from '../../lib/mastery';
import { classChapters } from '../../content/syllabus';
import api from '../../api/vidya';
import type { ScreenProps, MasteryMap } from '../../types';

const LEVEL_COLOR: Record<MasteryLevel, string> = {
  new: 'var(--muted-2)', needshelp: '#B84030', improving: '#B45309', confident: 'var(--indigo)', strong: '#1A7A4A',
};

export default function TopicMasteryScreen({ go, state, set }: ScreenProps) {
  const { t } = useTranslation(['progress', 'common']);
  const grade = api.toGrade(state?.classLevel);
  const chapters = classChapters(grade);
  const map = (state?.mastery as MasteryMap) || {};

  const [open, setOpen] = useState<string | null>(null);
  const [needsOnly, setNeedsOnly] = useState(false);

  const subject = subjectMastery(map, chapters);
  const pct = Math.round(subject.avg * 100);
  const coverage = Math.round(subject.coverage * 100);

  // Start focused practice on one subtopic (updates mastery on completion).
  const practiceSub = (chapterId: string, section: string, title: string) => {
    set && set({ quizScope: { chapterId, section, topic: title }, skillId: null });
    go('navigable-quiz');
  };

  const chapterRows = chapters
    .map((ch) => ({ ch, m: chapterMastery(map, ch) }))
    .filter(({ m }) => !needsOnly || m.level === 'needshelp' || m.level === 'improving');

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)' }}>
      <VTopBar transparent showBack onBack={() => go('progress')} />
      <div style={{ padding: '72px 22px 40px' }}>
        <div className="v-eyebrow" style={{ marginBottom: 8 }}>{t('masteryMap.eyebrow')}</div>
        <h1 className="v-h1" style={{ fontSize: 30, marginBottom: 20 }}>{t('mastery.title')}</h1>

        {/* Overall ring */}
        <div className="v-card" style={{ padding: 24, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 22 }}>
          <div style={{ position: 'relative', width: 104, height: 104, flexShrink: 0 }}>
            <svg width="104" height="104" viewBox="0 0 104 104">
              <circle cx="52" cy="52" r="44" fill="none" stroke="var(--border)" strokeWidth="9" />
              <circle cx="52" cy="52" r="44" fill="none" stroke="var(--ink)" strokeWidth="9"
                strokeDasharray={`${(pct / 100) * 276} 276`} strokeLinecap="round" transform="rotate(-90 52 52)" />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 30, fontWeight: 600, lineHeight: 1 }}>{pct}<span style={{ fontSize: 15 }}>%</span></div>
              <div style={{ fontSize: 8.5, letterSpacing: '0.1em', color: 'var(--muted-2)', marginTop: 3 }}>{t('masteryMap.ringLabel')}</div>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 17, marginBottom: 6, lineHeight: 1.25 }}>
              {t('masteryMap.explored', { coverage })}
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
              {t('masteryMap.explainer')}
            </div>
          </div>
        </div>

        {/* Filter */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {[{ id: false, label: t('masteryMap.allTopics') }, { id: true, label: t('masteryMap.needsHelp') }].map((f) => {
            const active = needsOnly === f.id;
            return (
              <div key={String(f.id)} className="v-tap" onClick={() => setNeedsOnly(f.id)} style={{
                padding: '7px 14px', borderRadius: 9999, fontFamily: 'Inter', fontSize: 12, fontWeight: 600,
                background: active ? 'var(--ink)' : '#fff', color: active ? '#fff' : 'var(--muted)',
                border: active ? '1px solid var(--ink)' : '1px solid var(--border)',
              }}>{f.label}</div>
            );
          })}
        </div>

        {/* Chapter → subtopic map */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {chapterRows.map(({ ch, m }) => {
            const isOpen = open === ch.id;
            const color = LEVEL_COLOR[m.level];
            return (
              <div key={ch.id} className="v-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="v-tap" onClick={() => setOpen(isOpen ? null : ch.id)} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '15px 16px' }}>
                  {/* coverage ring */}
                  <div style={{ position: 'relative', width: 38, height: 38, flexShrink: 0 }}>
                    <svg width="38" height="38" viewBox="0 0 38 38">
                      <circle cx="19" cy="19" r="15" fill="none" stroke="var(--border)" strokeWidth="4" />
                      <circle cx="19" cy="19" r="15" fill="none" stroke={color} strokeWidth="4"
                        strokeDasharray={`${m.coverage * 94} 94`} strokeLinecap="round" transform="rotate(-90 19 19)" />
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter', fontSize: 10, fontWeight: 700, color: 'var(--muted-2)' }}>{ch.num}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 15.5, lineHeight: 1.2 }}>{ch.title}</div>
                    <div style={{ fontSize: 11, marginTop: 2 }}>
                      <span style={{ color, fontWeight: 700 }}>{t(`common:levels.${m.level}`)}</span>
                      <span style={{ color: 'var(--muted-2)' }}> · {t('masteryMap.practised', { touched: m.touched, total: m.totalSubtopics })}</span>
                    </div>
                  </div>
                  <VIcon name={isOpen ? 'chevron-down' : 'chevron-right'} size={16} color="var(--muted-2)" />
                </div>
                {isOpen && ch.subtopics.map((sub) => {
                  const sm = map[skillKey(ch.id, sub.num)];
                  const lvl = levelFor(sm);
                  const c = LEVEL_COLOR[lvl];
                  return (
                    <div key={sub.id} className="v-tap" onClick={() => practiceSub(ch.id, sub.num, sub.title)} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 16px 12px 18px', borderTop: '1px solid var(--border-soft)' }}>
                      <div style={{ width: 8, height: 8, borderRadius: 9999, background: c, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 14, lineHeight: 1.25 }}>{sub.title}</div>
                        <div style={{ fontSize: 10.5, color: 'var(--muted-2)', marginTop: 1 }}>
                          {sm ? `${t(`common:levels.${lvl}`)}${sm.lastSeen ? ` · ${relativeDay(sm.lastSeen)}` : ''}` : t('common:notStarted')}
                        </div>
                      </div>
                      <div className="v-link" style={{ fontSize: 12, fontWeight: 600, color: 'var(--indigo)' }}>{t('masteryMap.practise')}</div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
