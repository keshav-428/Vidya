import React from 'react';
import { useTranslation } from 'react-i18next';
import VIcon from '../../prototype/icons';
import { VTopBar } from '../../prototype/shared';
import type { ScreenProps, GradeResult, IconName } from '../../types';

interface StatusStyle {
  bg: string;
  border: string;
  color: string;
  labelKey: string;
  icon: IconName;
}

interface DetailQuestion {
  status?: string;
  number?: number;
  marks_awarded?: number;
  marks_possible?: number;
  student_answer?: string;
  feedback?: string;
  model_answer?: string;
  [key: string]: unknown;
}

interface DetailSection {
  name: string;
  questions?: DetailQuestion[];
}

interface FlatQuestion extends DetailQuestion {
  section: string;
}

const STATUS_STYLE: Record<string, StatusStyle> = {
  correct: { bg: '#ECFDF5', border: 'rgba(4,120,87,0.2)', color: 'var(--accent-success)', labelKey: 'detail.status.correct', icon: 'check' },
  partial: { bg: '#FEF3C7', border: 'rgba(217,119,6,0.2)', color: '#92400E', labelKey: 'detail.status.partial', icon: 'lightbulb' },
  incorrect: { bg: '#FFF7ED', border: 'rgba(194,65,12,0.2)', color: 'var(--accent-warn)', labelKey: 'detail.status.incorrect', icon: 'x' },
  blank: { bg: '#F4F3F1', border: 'var(--border)', color: 'var(--muted)', labelKey: 'detail.status.blank', icon: 'x' },
};

export default function ExamDetailScreen({ go, state }: ScreenProps) {
  const { t } = useTranslation('exam');
  const result = state?.examResult as GradeResult | 'error' | null | undefined;
  const sections = ((result && result !== 'error') ? (result.sections || []) : []) as DetailSection[];

  // Flatten all graded questions across sections.
  const questions: FlatQuestion[] = sections.flatMap((s: DetailSection) =>
    (s.questions || []).map((q: DetailQuestion) => ({ ...q, section: s.name }))
  );

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)' }}>
      <VTopBar transparent showBack onBack={() => go('exam-eval-results')} title={t('detail.topBarTitle')} />
      <div style={{ padding: '72px 24px 32px' }}>
        <div className="v-eyebrow" style={{ marginBottom: 8 }}>{t('detail.eyebrow')}</div>
        <h1 className="v-h1" style={{ fontSize: 26, marginBottom: 20, lineHeight: 1.25 }}>{t('detail.title')}</h1>

        {questions.length === 0 && (
          <div style={{ fontFamily: 'Inter', fontSize: 14, color: 'var(--muted)', marginBottom: 20 }}>
            {t('detail.noBreakdown')}
          </div>
        )}

        {questions.map((q: FlatQuestion, i: number) => {
          const st = (q.status ? STATUS_STYLE[q.status] : undefined) || STATUS_STYLE.partial;
          return (
            <div key={i} className="v-card" style={{ marginBottom: 14, padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div className="v-eyebrow-sm" style={{ color: 'var(--muted-2)' }}>
                  {q.section ? t('detail.sectionPrefix', { name: q.section }) : ''}{t('detail.questionLabel', { number: q.number ?? i + 1 })}
                </div>
                <div style={{ flex: 1 }} />
                <div className="v-pill" style={{ background: st.bg, borderColor: st.border, color: st.color, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <VIcon name={st.icon} size={11} color={st.color} strokeWidth={2.5} /> {t(st.labelKey)}
                </div>
                <div className="v-pill" style={{ background: '#fff', border: '1px solid var(--border)', color: 'var(--ink)' }}>
                  {q.marks_awarded ?? 0}/{q.marks_possible ?? 0}
                </div>
              </div>

              {q.student_answer && (
                <div style={{ marginBottom: 10 }}>
                  <div className="v-eyebrow-sm" style={{ marginBottom: 4 }}>{t('detail.yourAnswer')}</div>
                  <div style={{ fontFamily: 'Inter', fontSize: 13, color: 'var(--ink)', lineHeight: 1.5 }}>{q.student_answer}</div>
                </div>
              )}

              {q.feedback && (
                <div style={{ background: st.bg, border: `1px solid ${st.border}`, borderRadius: 12, padding: '10px 12px', marginBottom: q.model_answer ? 10 : 0 }}>
                  <div style={{ fontFamily: 'Inter', fontSize: 13, color: 'var(--ink)', lineHeight: 1.5 }}>{q.feedback}</div>
                </div>
              )}

              {q.model_answer && q.status !== 'correct' && (
                <div>
                  <div className="v-eyebrow-sm" style={{ marginBottom: 4, color: 'var(--accent-success)' }}>{t('detail.correctApproach')}</div>
                  <div style={{ fontFamily: 'Inter', fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>{q.model_answer}</div>
                </div>
              )}
            </div>
          );
        })}

        <button className="v-btn-secondary v-tap" onClick={() => go('exam-eval-results')} style={{ marginTop: 8 }}>{t('detail.backToSummary')}</button>
      </div>
    </div>
  );
}
