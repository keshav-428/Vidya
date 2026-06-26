import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import VIcon from '../../prototype/icons';
import { VTopBar, VBottomNav } from '../../prototype/shared';
import api from '../../api/vidya';
import type { ScreenProps } from '../../types';

const FALLBACK_TOPICS = ['Fractions', 'Perimeter and Area', 'Prime Time'];

export default function ExamConfigScreen({ go, state, set }: ScreenProps) {
  const { t } = useTranslation('exam');
  const [duration, setDuration] = useState(180);
  const [marks, setMarks] = useState(80);

  // Chapters chosen in the Practice tab; fall back to a default set.
  const examTopics = state?.examTopics as string[] | undefined;
  const topics = (examTopics && examTopics.length) ? examTopics : FALLBACK_TOPICS;

  const generate = () => {
    const grade = api.toGrade(state?.classLevel);
    // Reset, then kick off LLM paper generation; the loading screen covers latency.
    set({ examPaper: null, examMarks: marks, examDuration: duration });
    const scope = (state?.examScope as { chapterId?: string | null; section?: string | null }) || {};
    api.generatePaper({ topics, grade, totalMarks: marks, difficulty: 'Medium', language: state?.language || 'English', chapterId: scope.chapterId || null, section: scope.section || null })
      .then((paper) => set({ examPaper: paper || 'error' }))
      .catch(() => set({ examPaper: 'error' }));
    go('exam-loading-1');
  };

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)', position: 'relative' }}>
      <VTopBar transparent />
      <div style={{ padding: '72px 24px 120px' }}>
        <div className="v-eyebrow" style={{ marginBottom: 8 }}>{t('config.eyebrow')}</div>
        <h1 className="v-h1" style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 8 }}>{t('config.title')}</h1>
        <p className="v-body" style={{ marginBottom: 24 }}>{t('config.subtitle')}</p>

        <div className="v-card" style={{ marginBottom: 14 }}>
          <div className="v-eyebrow-sm" style={{ marginBottom: 10 }}>{t('config.boardClass')}</div>
          <div style={{ fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 22, marginBottom: 4 }}>{t('config.boardClassValue')}</div>
          <div style={{ fontSize: 12, color: 'var(--muted-2)' }}>{t('config.boardClassSub')}</div>
        </div>

        <div className="v-card" style={{ marginBottom: 14 }}>
          <div className="v-eyebrow-sm" style={{ marginBottom: 14 }}>{t('config.duration')}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[60, 90, 120, 180].map(d => (
              <div key={d} className="v-tap" onClick={() => setDuration(d)} style={{
                flex: 1, padding: '12px 0', textAlign: 'center',
                border: duration === d ? '1.5px solid var(--ink)' : '1px solid var(--border)',
                background: '#fff', borderRadius: 12, fontSize: 13, fontWeight: 500,
                color: duration === d ? 'var(--ink)' : 'var(--muted)',
              }}>{t('config.durationMinutes', { value: d })}</div>
            ))}
          </div>
        </div>

        <div className="v-card" style={{ marginBottom: 14 }}>
          <div className="v-eyebrow-sm" style={{ marginBottom: 14 }}>{t('config.totalMarks')}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[40, 60, 80, 100].map(d => (
              <div key={d} className="v-tap" onClick={() => setMarks(d)} style={{
                flex: 1, padding: '12px 0', textAlign: 'center',
                border: marks === d ? '1.5px solid var(--ink)' : '1px solid var(--border)',
                background: '#fff', borderRadius: 12, fontSize: 13, fontWeight: 500,
                color: marks === d ? 'var(--ink)' : 'var(--muted)',
              }}>{d}</div>
            ))}
          </div>
        </div>

        <div className="v-card" style={{ marginBottom: 14 }}>
          <div className="v-eyebrow-sm" style={{ marginBottom: 14 }}>{t('config.difficultyMix')}</div>
          {[['Easy', 'config.easy'], ['Medium', 'config.medium'], ['Hard', 'config.hard']].map(([l, key], i) => {
            const v = [40, 40, 20][i];
            return (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: i < 2 ? 12 : 0 }}>
                <span style={{ width: 60, fontSize: 13, color: 'var(--muted)' }}>{t(key)}</span>
                <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 9999, overflow: 'hidden' }}>
                  <div style={{ width: `${v}%`, height: '100%', background: 'var(--ink)' }} />
                </div>
                <span style={{ width: 36, textAlign: 'right', fontSize: 13, fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", color: 'var(--ink)' }}>{v}%</span>
              </div>
            );
          })}
        </div>

        <div className="v-card" style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div className="v-eyebrow-sm">{t('config.topicsIncluded')}</div>
            <span className="v-tap" onClick={() => go('practice')} style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: 600, color: 'var(--indigo)' }}>{t('config.edit')}</span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {topics.map(t => (
              <div key={t} className="v-pill" style={{ background: '#F4F3F1', border: '1px solid var(--border)' }}>{t}</div>
            ))}
          </div>
        </div>

        <button className="v-btn-primary v-tap" onClick={generate}>
          {t('config.generatePaper')} <VIcon name="arrow-right" size={14} color="#fff" />
        </button>
      </div>
      <VBottomNav active="practice" go={go} />
    </div>
  );
}
