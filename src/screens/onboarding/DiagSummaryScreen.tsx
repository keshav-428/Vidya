import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import VIcon from '../../prototype/icons';
import { VSoftBackdrop, VTopBar, VidyaAvatar } from '../../prototype/shared';
import { weakestChapterForDrill, type DiagOutcome } from '../../content/diagnostic';
import api from '../../api/vidya';
import type { ScreenProps } from '../../types';

export default function DiagSummaryScreen({ go, state, set }: ScreenProps) {
  const { t } = useTranslation(['onboarding2', 'common']);
  const grade = api.toGrade(state?.classLevel);
  const [drilling, setDrilling] = useState(false);

  const outcome = (state?.diagOutcome as DiagOutcome) || null;
  if (!outcome) {
    go('diag-intro');
    return null;
  }

  const handleDrill = async () => {
    setDrilling(true);
    const weakChapter = weakestChapterForDrill(outcome, grade);
    if (!weakChapter) {
      go('diag-result');
      return;
    }
    try {
      const qs = await api.generateDiagnosticDrill({
        chapterId: weakChapter,
        language: state?.language || 'English',
        num: 4,
      });
      if (!qs || qs.length === 0) {
        go('diag-result');
        return;
      }
      set && set({ diagDrillQuestions: qs, diagDrillChapter: weakChapter });
      go('diag-drill');
    } catch {
      go('diag-result');
    }
  };

  return (
    <VSoftBackdrop variant="cool">
      <VTopBar showBack onBack={() => go('diag-q1')} transparent />
      <div style={{ padding: '72px 22px 32px', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        <div className="v-eyebrow v-enter" style={{ marginBottom: 6 }}>Diagnostic Summary</div>
        <h1 className="v-h1 v-enter" style={{ fontSize: 28, marginBottom: 12, lineHeight: 1.1 }}>
          Here's what we found
        </h1>
        <p className="v-enter" style={{ fontFamily: 'Inter', fontSize: 13, color: 'var(--muted)', marginBottom: 20, lineHeight: 1.5 }}>
          Based on your answers, we identified some areas to focus on:
        </p>

        {/* Weak areas */}
        {outcome.weak.length > 0 && (
          <div className="v-card v-enter" style={{ padding: '18px', marginBottom: 18, background: '#FFF7ED' }}>
            <div className="v-eyebrow-sm" style={{ marginBottom: 12 }}>Areas to strengthen</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {outcome.weak.slice(0, 3).map((area) => (
                <div key={area} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ width: 20, height: 20, borderRadius: 9999, background: 'var(--accent-warn)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                    <VIcon name="alert-circle" size={11} color="#fff" strokeWidth={2} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{area}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted-2)', marginTop: 2 }}>We'll help you build confidence here</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Strong areas */}
        {outcome.strong.length > 0 && (
          <div className="v-card v-enter" style={{ padding: '18px', marginBottom: 18, background: '#ECFDF5' }}>
            <div className="v-eyebrow-sm" style={{ marginBottom: 12 }}>You're strong in</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {outcome.strong.map((area) => (
                <div key={area} style={{ padding: '6px 12px', borderRadius: 9999, background: '#fff', border: '1px solid var(--accent-success)', fontSize: 12, fontWeight: 600, color: 'var(--accent-success)' }}>
                  {area}
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ flex: 1, minHeight: 18 }} />

        {/* Two options */}
        <div className="v-enter" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            className="v-btn-primary v-tap"
            onClick={handleDrill}
            disabled={drilling}
            style={{ opacity: drilling ? 0.6 : 1 }}
          >
            {drilling ? <VIcon name="loader" size={14} color="#fff" /> : <VIcon name="zap" size={14} color="#fff" />}
            {drilling ? 'Preparing questions...' : 'Dig deeper'}
          </button>
          <button
            className="v-btn-secondary v-tap"
            onClick={() => go('diag-result')}
            disabled={drilling}
            style={{ opacity: drilling ? 0.6 : 1 }}
          >
            Continue to your plan <VIcon name="arrow-right" size={14} color="var(--ink)" />
          </button>
        </div>
      </div>
    </VSoftBackdrop>
  );
}
