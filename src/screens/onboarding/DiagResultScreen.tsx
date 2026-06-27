import React from 'react';
import { useTranslation } from 'react-i18next';
import VIcon from '../../prototype/icons';
import { VSoftBackdrop, VTopBar } from '../../prototype/shared';
import { scoreFromSet, classAwarePlanTopic, STATIC_FALLBACK, DIAG_RUNGS, type DiagLevelId, type GenQ } from '../../content/diagnostic';
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

  const onContinue = () => {
    const topic = classAwarePlanTopic(outcome, grade);
    set && set({ diagLevel: level, diagChapters: outcome.weak, ...(topic ? { planTopicId: topic } : {}) });
    go('first-plan');
  };

  return (
    <VSoftBackdrop variant="cool">
      <VTopBar transparent />
      <div style={{ padding: '72px 24px 32px', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        <div className="v-eyebrow v-enter" style={{ marginBottom: 12 }}>{t('diagResult.eyebrow')}</div>
        <h1 className="v-h1 v-enter" style={{ fontSize: 30, marginBottom: 8, lineHeight: 1.15 }}>
          {t('diagResult.title', { name })}
        </h1>
        <p className="v-enter" style={{ fontFamily: 'Inter', fontSize: 14, color: 'var(--muted)', marginBottom: 28, lineHeight: 1.5 }}>
          {t('diagResult.subtitle')}
        </p>

        {/* Level card */}
        <div className="v-card v-enter" style={{ padding: '28px 24px', marginBottom: 16, background: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--bg-warm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <VIcon name="sparkles" size={22} color={tone} />
            </div>
            <div>
              <div style={{ fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 28, fontWeight: 500, color: 'var(--ink)', letterSpacing: '-0.01em' }}>{label}</div>
              <div style={{ fontSize: 12, color: 'var(--muted-2)', letterSpacing: '0.04em' }}>
                {t('diagResult.classSubject', { classLevel: state.classLevel || '6' })} · {outcome.correct}/{outcome.total}
              </div>
            </div>
          </div>
          <p style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 17, color: 'var(--ink)', lineHeight: 1.5, margin: 0 }}>{sub}</p>

          <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
            {DIAG_RUNGS.map((id) => {
              const active = id === level;
              const reached = DIAG_RUNGS.indexOf(id) <= levelIdx;
              return (
                <div key={id} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
                  <div style={{ height: 4, width: '100%', borderRadius: 9999, background: reached ? 'var(--ink)' : 'var(--border)' }} />
                  <div style={{ fontSize: 10.5, letterSpacing: '0.04em', fontWeight: active ? 700 : 500, color: active ? 'var(--ink)' : 'var(--muted-2)' }}>
                    {t(`diagResult.levels.${id}.label`, LEVEL_DEFAULT[id].label)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Per-chapter pinpoint */}
        {(outcome.strong.length > 0 || outcome.weak.length > 0) && (
          <div className="v-card-soft v-enter" style={{ marginBottom: 16, background: 'rgba(255,255,255,0.6)' }}>
            {outcome.strong.length > 0 && (
              <div style={{ marginBottom: outcome.weak.length ? 16 : 0 }}>
                <div className="v-eyebrow-sm" style={{ marginBottom: 8 }}>STRONG IN</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {outcome.strong.map((ch) => (
                    <div key={ch} style={{ padding: '6px 12px', borderRadius: 9999, background: '#fff', border: '1px solid var(--accent-success)', fontSize: 12, fontWeight: 600, color: 'var(--accent-success)' }}>{chapterName(ch)}</div>
                  ))}
                </div>
              </div>
            )}
            {outcome.weak.length > 0 && (
              <div>
                <div className="v-eyebrow-sm" style={{ marginBottom: 8 }}>LET'S START WITH</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {outcome.weak.map((ch) => (
                    <div key={ch} style={{ padding: '6px 12px', borderRadius: 9999, background: '#FFF7ED', border: '1px solid var(--accent-warn)', fontSize: 12, fontWeight: 600, color: '#B45309' }}>{chapterName(ch)}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ flex: 1, minHeight: 24 }} />
        <button className="v-btn-primary v-tap" onClick={onContinue}>
          {t('diagResult.seeFirstPlan')} <VIcon name="arrow-right" size={14} color="#fff" />
        </button>
      </div>
    </VSoftBackdrop>
  );
}
