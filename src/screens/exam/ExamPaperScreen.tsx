import React from 'react';
import { useTranslation } from 'react-i18next';
import VIcon from '../../prototype/icons';
import { VTopBar, VidyaAvatar } from '../../prototype/shared';
import type { ScreenProps, Paper } from '../../types';

interface PaperQuestion {
  number?: number;
  text?: string;
  options?: string[];
}

interface PaperSectionView {
  name: string;
  marks_per_q: number;
  instructions?: string;
  questions?: PaperQuestion[];
}

export default function ExamPaperScreen({ go, state }: ScreenProps) {
  const { t } = useTranslation('exam');
  const paper = state?.examPaper as Paper | 'error' | null | undefined;
  const marks = (state?.examMarks as number | undefined) || 80;
  const hours = (((state?.examDuration as number | undefined) || 180) / 60).toFixed(0);

  // Still generating (LLM hasn't returned yet)
  if (!paper) {
    return (
      <div style={{ minHeight: '100%', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, padding: 32 }}>
        <VidyaAvatar size={72} animated />
        <div style={{ fontFamily: 'Inter', fontSize: 14, color: 'var(--muted)', textAlign: 'center' }}>{t('paper.finalising')}</div>
      </div>
    );
  }

  // Generation failed
  if (paper === 'error') {
    return (
      <div style={{ minHeight: '100%', background: 'var(--bg)' }}>
        <VTopBar transparent showBack onBack={() => go('exam-config')} />
        <div style={{ padding: '72px 24px 32px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'Inter', fontSize: 14, color: 'var(--muted)', marginBottom: 20 }}>{t('paper.errorGenerate')}</div>
          <button className="v-btn-primary v-tap" onClick={() => go('exam-config')}>{t('paper.backToSetup')}</button>
        </div>
      </div>
    );
  }

  const sections = (paper.sections || []) as PaperSectionView[];

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)' }}>
      <VTopBar transparent showBack onBack={() => go('exam-config')}
        right={<div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", color: 'var(--ink)' }}><VIcon name="clock" size={14} /> {hours}:00:00</div>} />
      <div style={{ padding: '72px 24px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <h1 className="v-h1" style={{ fontSize: 32, marginBottom: 6 }}>{t('paper.paperTitle')}</h1>
          <div className="v-eyebrow" style={{ color: 'rgba(77,69,64,0.7)' }}>{t('paper.marksHours', { marks, hours })}</div>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 14, marginBottom: 32 }}>
            <div style={{ width: 48, height: 1, background: 'var(--border-soft)' }} />
          </div>
        </div>

        {sections.map((sec: PaperSectionView, si: number) => (
          <div key={si}>
            {si > 0 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, opacity: 0.4, margin: '24px 0' }}>
                <div style={{ width: 48, height: 1, background: 'var(--muted)' }} />
                <span style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 14, color: 'var(--muted)' }}>§</span>
                <div style={{ width: 48, height: 1, background: 'var(--muted)' }} />
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6, marginTop: si > 0 ? 20 : 0 }}>
              <div style={{ fontFamily: "'Baloo 2','Quicksand','Nunito',system-ui,sans-serif", fontSize: 22, color: 'var(--ink)' }}>{t('paper.sectionName', { name: sec.name })}</div>
              <div className="v-eyebrow-sm" style={{ color: 'var(--accent-blue)' }}>{t('paper.marksEach', { count: sec.marks_per_q })}</div>
            </div>
            {sec.instructions && (
              <div style={{ fontFamily: 'Inter', fontSize: 12, color: 'var(--muted-2)', marginBottom: 20, fontStyle: 'italic' }}>{sec.instructions}</div>
            )}
            {(sec.questions || []).map((q: PaperQuestion, i: number) => (
              <div key={i} style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 18, color: 'var(--muted-2)', minWidth: 24 }}>{q.number ?? i + 1}.</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 17, lineHeight: 1.5, color: 'var(--ink)' }}>{q.text}</div>
                    {Array.isArray(q.options) && q.options.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
                        {q.options.map((opt, oi) => (
                          <div key={oi} style={{ display: 'flex', gap: 8, fontFamily: 'Inter', fontSize: 14, color: 'var(--muted)' }}>
                            <span style={{ fontWeight: 600 }}>{['a', 'b', 'c', 'd'][oi]})</span> {opt}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}

        <button className="v-btn-primary v-tap" onClick={() => go('exam-photo')} style={{ marginTop: 24 }}>
          {t('paper.submitAnswers')} <VIcon name="arrow-right" size={14} color="#fff" />
        </button>
        <div style={{ textAlign: 'center', marginTop: 14 }}>
          <span className="v-link v-tap" onClick={() => go('home')}>{t('paper.saveExit')}</span>
        </div>
      </div>
    </div>
  );
}
