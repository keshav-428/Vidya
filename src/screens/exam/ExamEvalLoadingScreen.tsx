import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import VIcon from '../../prototype/icons';
import { VTopBar, VSoftBackdrop, VidyaAvatar } from '../../prototype/shared';
import api from '../../api/vidya';
import { appendActivity } from '../../lib/progress';
import { applyResult } from '../../lib/mastery';
import type { ScreenProps, Paper, ActivityEntry, MasteryMap } from '../../types';

const LINE_KEYS = ['evalLoading.lines.reading', 'evalLoading.lines.matching', 'evalLoading.lines.marking', 'evalLoading.lines.writing'];

export default function ExamEvalLoadingScreen({ go, state, set }: ScreenProps) {
  const { t } = useTranslation('exam');
  const [stepIdx, setStepIdx] = useState(0);
  const doneRef = useRef(false);      // grading finished
  const animDoneRef = useRef(false);  // animation reached last line

  // Advance only when BOTH the animation and the grading call have finished.
  const tryAdvance = () => {
    if (doneRef.current && animDoneRef.current) go('exam-eval-results');
  };

  // Kick off real grading once.
  useEffect(() => {
    const images = (state?.examImages as string[] | undefined) || [];
    const examPaper = state?.examPaper as Paper | 'error' | null | undefined;
    const paper: Paper = (examPaper && examPaper !== 'error') ? examPaper : { sections: [] };
    set && set({ examResult: null });
    api.gradePaper({
      images, paper,
      grade: api.toGrade(state?.classLevel),
      totalMarks: (state?.examMarks as number | undefined) || 80,
      language: state?.language || 'English',
    })
      .then((res) => {
        const examTopics = (state?.examTopics as string[] | undefined) || [];
        const topic = examTopics.length ? examTopics.join(', ') : 'Exam';
        const total = res.total_possible ?? ((state?.examMarks as number | undefined) || 80);
        // Attribute mastery only when the exam was scoped to a single subtopic.
        const scope = state?.examScope as { chapterId?: string; section?: string | null } | null | undefined;
        const entry: ActivityEntry = {
          kind: 'exam', date: new Date().toISOString(), topic,
          chapterId: scope?.chapterId || undefined, section: scope?.section ?? null,
          score: res.total_awarded ?? 0, total,
        };
        set && set({
          examResult: res,
          activityLog: appendActivity(state?.activityLog, entry),
          mastery: applyResult((state?.mastery as MasteryMap) || {}, entry),
        });
      })
      .catch(() => { set && set({ examResult: 'error' }); })
      .finally(() => { doneRef.current = true; tryAdvance(); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setStepIdx(s => {
        if (s >= LINE_KEYS.length - 1) {
          clearInterval(t);
          animDoneRef.current = true;
          setTimeout(tryAdvance, 300);
          return s;
        }
        return s + 1;
      });
    }, 900);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <VSoftBackdrop variant="cool">
      <VTopBar transparent />
      <div style={{ padding: '80px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100%' }}>
        <div className="v-enter-scale" style={{ position: 'relative', marginBottom: 48 }}>
          <VidyaAvatar size={120} animated />
          <div style={{ position: 'absolute', inset: -12, borderRadius: 9999, border: '2px solid var(--accent-blue-soft)', animation: 'vPulseRing 1.4s ease-out infinite' }} />
        </div>
        <div className="v-eyebrow" style={{ marginBottom: 16 }}>{t('evalLoading.eyebrow')}</div>
        <h1 className="v-h1" style={{ fontSize: 30, textAlign: 'center', marginBottom: 40, lineHeight: 1.15 }}>{t('evalLoading.title')}</h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'flex-start' }}>
          {LINE_KEYS.map((l, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: i <= stepIdx ? 1 : 0.35, transition: 'opacity .35s' }}>
              <div style={{
                width: 18, height: 18, borderRadius: 9999,
                border: i < stepIdx ? 'none' : '1.5px solid var(--muted-2)',
                background: i < stepIdx ? 'var(--ink)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {i < stepIdx && <VIcon name="check" size={11} color="#fff" strokeWidth={2.5} />}
                {i === stepIdx && <div style={{ width: 6, height: 6, borderRadius: 9999, background: 'var(--ink)', animation: 'vDot 1.2s infinite' }} />}
              </div>
              <span style={{ fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 18, color: i <= stepIdx ? 'var(--ink)' : 'var(--muted-2)' }}>{t(l)}</span>
            </div>
          ))}
        </div>
      </div>
    </VSoftBackdrop>
  );
}
