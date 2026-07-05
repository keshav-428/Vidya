import React from 'react';
import { useTranslation } from 'react-i18next';
import VIcon from '../../prototype/icons';
import { VSoftBackdrop, VTopBar } from '../../prototype/shared';
import { scoreFromSet, classAwareWeakChapters, STATIC_FALLBACK, DIAG_RUNGS, type DiagLevelId, type GenQ } from '../../content/diagnostic';
import { buildWeekPlan } from '../../content/weekPlan';
import api from '../../api/vidya';
import type { ScreenProps } from '../../types';

// Fallback copy so every level renders even if a locale key is missing.
const LEVEL_DEFAULT: Record<DiagLevelId, { label: string; sub: string; tone: string }> = {
  needs: { label: 'Building foundations', sub: "We'll start with the basics and build up steadily.", tone: 'var(--accent-rose)' },
  improving: { label: 'Getting there', sub: "You've got the idea — a little practice will lock it in.", tone: 'var(--indigo)' },
  confident: { label: 'Confident', sub: "Strong grasp! We'll sharpen the trickier bits.", tone: 'var(--accent-success)' },
  strong: { label: 'Flying high', sub: "Excellent! We'll keep you challenged with tougher problems.", tone: 'var(--accent-success)' },
};

export default function DiagResultScreen({ go, state, set }: ScreenProps) {
  const { t } = useTranslation('onboarding2');
  const grade = api.toGrade(state?.classLevel);
  const diagSet = (Array.isArray(state.diagSet) ? state.diagSet : STATIC_FALLBACK) as GenQ[];
  const answers = diagSet.map((_, i) => (typeof state[`diag_${i}`] === 'number' ? (state[`diag_${i}`] as number) : null));
  const outcome = scoreFromSet(diagSet, answers);
  const level = outcome.level;
  const name = state.name || 'there';
  const levelIdx = DIAG_RUNGS.indexOf(level);

  const label = t(`diagResult.levels.${level}.label`, LEVEL_DEFAULT[level].label);
  const sub = t(`diagResult.levels.${level}.sub`, LEVEL_DEFAULT[level].sub);
  const tone = LEVEL_DEFAULT[level].tone;
  const chapterName = (ch: string) => t(`diagQ.chapters.${ch}`, ch);

  // Option A — Vidya builds the whole week from the weak areas, lands on Home.
  const buildForMe = () => {
    const ids = classAwareWeakChapters(outcome, grade);
    const plan = buildWeekPlan(ids);
    const todayTopic = plan.find((d) => d.isToday && d.topicId)?.topicId || ids[0] || null;
    set && set({
      diagLevel: level, diagChapters: outcome.weak,
      weekPlan: plan, ...(todayTopic ? { planTopicId: todayTopic } : {}),
      ownPlan: false,
    });
    go('home');
  };
  // Option B — student builds their own; Home's coach guides them through it.
  const buildOwn = () => {
    set && set({ diagLevel: level, diagChapters: outcome.weak, ownPlan: true, coachStep: 0 });
    go('home');
  };

  return (
    <VSoftBackdrop variant="cool">
      <VTopBar transparent />
      <div style={{ padding: '58px 20px 18px', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        <div className="v-eyebrow v-enter" style={{ marginBottom: 5 }}>{t('diagResult.eyebrow')}</div>
        <h1 className="v-h1 v-enter" style={{ fontSize: 23, marginBottom: 3, lineHeight: 1.12 }}>
          {t('diagResult.title', { name })}
        </h1>
        <p className="v-enter" style={{ fontFamily: 'Inter', fontSize: 12.5, color: 'var(--muted)', marginBottom: 12, lineHeight: 1.4 }}>
          {t('diagResult.subtitle')}
        </p>

        {/* Level card */}
        <div className="v-card v-enter" style={{ padding: '15px 16px', marginBottom: 10, background: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: 'var(--bg-warm)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <VIcon name="sparkles" size={18} color={tone} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 21, fontWeight: 500, color: 'var(--ink)', letterSpacing: '-0.01em', lineHeight: 1.1 }}>{label}</div>
              <div style={{ fontSize: 11.5, color: 'var(--muted-2)', letterSpacing: '0.03em', marginTop: 1 }}>
                {t('diagResult.classSubject', { classLevel: state.classLevel || '6' })} · {outcome.correct}/{outcome.total}
              </div>
            </div>
          </div>
          <p style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.4, margin: '0 0 14px' }}>{sub}</p>

          <div style={{ display: 'flex', gap: 6 }}>
            {DIAG_RUNGS.map((id) => {
              const active = id === level;
              const reached = DIAG_RUNGS.indexOf(id) <= levelIdx;
              return (
                <div key={id} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'flex-start' }}>
                  <div style={{ height: 4, width: '100%', borderRadius: 9999, background: reached ? 'var(--ink)' : 'var(--border)' }} />
                  <div style={{ fontSize: 9.5, letterSpacing: '0.02em', fontWeight: active ? 700 : 500, color: active ? 'var(--ink)' : 'var(--muted-2)' }}>
                    {t(`diagResult.levels.${id}.label`, LEVEL_DEFAULT[id].label)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Per-chapter pinpoint (capped so it fits one screen) */}
        {(outcome.strong.length > 0 || outcome.weak.length > 0) && (
          <div className="v-card-soft v-enter" style={{ marginBottom: 10, padding: 15, background: 'rgba(255,255,255,0.6)' }}>
            {outcome.strong.length > 0 && (
              <div style={{ marginBottom: outcome.weak.length ? 12 : 0 }}>
                <div className="v-eyebrow-sm" style={{ marginBottom: 7 }}>{t('diagResult.strongIn')}</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {outcome.strong.slice(0, 4).map((ch) => (
                    <div key={ch} style={{ padding: '5px 10px', borderRadius: 9999, background: '#fff', border: '1px solid var(--accent-success)', fontSize: 11.5, fontWeight: 600, color: 'var(--accent-success)' }}>{chapterName(ch)}</div>
                  ))}
                </div>
              </div>
            )}
            {outcome.weak.length > 0 && (
              <div>
                <div className="v-eyebrow-sm" style={{ marginBottom: 7 }}>{t('diagResult.startWith')}</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {outcome.weak.slice(0, 3).map((ch) => (
                    <div key={ch} style={{ padding: '5px 10px', borderRadius: 9999, background: '#FFF7ED', border: '1px solid var(--accent-warn)', fontSize: 11.5, fontWeight: 600, color: '#B45309' }}>{chapterName(ch)}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ flex: 1, minHeight: 6 }} />
        <button className="v-btn-primary v-tap" onClick={buildForMe} style={{ marginBottom: 8 }}>
          <VIcon name="sparkles" size={14} color="#fff" /> {t('diagResult.buildForMe')}
        </button>
        <button className="v-btn-secondary v-tap" onClick={buildOwn}>
          {t('diagResult.buildOwn')} <VIcon name="arrow-right" size={14} color="var(--ink)" />
        </button>
      </div>
    </VSoftBackdrop>
  );
}
