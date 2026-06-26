import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import VIcon from '../../prototype/icons';
import { VSoftBackdrop, VTopBar, VOptionButton } from '../../prototype/shared';
import { DIAG_CHAPTERS, DIAG_QUESTIONS } from '../../content/diagnostic';
import type { ScreenProps } from '../../types';

export default function DiagQ1Screen({ go, state, set }: ScreenProps) {
  const { t } = useTranslation(['onboarding2', 'common']);
  const total = DIAG_QUESTIONS.length;
  const [idx, setIdx] = useState(0);
  const q = DIAG_QUESTIONS[idx];
  const [picked, setPicked] = useState<string | null>(null);
  const [acked, setAcked] = useState(false);
  const isLast = idx === total - 1;
  const chapterIdx = DIAG_CHAPTERS.indexOf(q.chapter);

  const restoreFor = (i: number) => {
    const prev = state[`diag_${i}`] as string | undefined;
    setPicked(prev && prev !== '__skip__' ? prev : null);
    setAcked(false);
  };

  const goNext = () => {
    if (isLast) { go('diag-building'); return; }
    const n = idx + 1; setIdx(n); restoreFor(n);
  };

  const goPrev = () => {
    if (idx === 0) { go('diag-intro'); return; }
    const p = idx - 1; setIdx(p); restoreFor(p);
  };

  const onPick = (id: string) => {
    if (acked) return;
    setPicked(id);
    set({ [`diag_${idx}`]: id });
    setTimeout(() => setAcked(true), 140);
  };

  const onSkip = () => {
    set({ [`diag_${idx}`]: '__skip__' });
    goNext();
  };

  return (
    <VSoftBackdrop variant={idx % 2 ? 'warm' : 'cool'}>
      <VTopBar showBack onBack={goPrev} transparent
        right={
          <button className="v-tap" onClick={onSkip} style={{
            background: 'transparent', border: 'none', padding: '4px 0',
            fontFamily: 'Inter', fontSize: 12, fontWeight: 600, color: 'var(--muted-2)', letterSpacing: '0.04em', cursor: 'default'
          }}>{t('diagQ.skip')}</button>
        } />
      <div style={{ padding: '72px 22px 32px', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 2 }}>
          {DIAG_CHAPTERS.map((ch, i) => {
            const done = i < chapterIdx, cur = i === chapterIdx;
            return (
              <div key={ch} style={{
                display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
                padding: '5px 11px', borderRadius: 9999,
                background: cur ? 'var(--indigo)' : done ? 'var(--indigo-air)' : 'transparent',
                border: cur || done ? 'none' : '1px solid var(--border)'
              }}>
                {done && <VIcon name="check" size={10} color="var(--indigo)" strokeWidth={2.6} />}
                <span style={{ fontFamily: 'Inter', fontSize: 10.5, fontWeight: cur ? 700 : 600, letterSpacing: '0.02em', color: cur ? '#fff' : done ? 'var(--indigo)' : 'var(--muted-2)' }}>{t(`diagQ.chapters.${ch}`, ch)}</span>
              </div>
            );
          })}
        </div>
        <div className="v-progress" style={{ marginBottom: 12 }}>
          <div className="v-progress-fill" style={{ width: `${(idx + 1) / total * 100}%` }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 28, fontFamily: 'Inter', fontSize: 11, color: 'var(--muted-2)', letterSpacing: '0.05em' }}>
          <span>{t('diagQ.questionOf', { value: idx + 1, total })}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--indigo)', fontWeight: 600 }}>
            <VIcon name="sparkles" size={11} color="var(--indigo)" /> {t('diagQ.adapting')}
          </span>
        </div>

        <h1 className="v-h1 v-enter" style={{ fontSize: 28, marginBottom: 24, lineHeight: 1.2 }}>{q.prompt}</h1>

        <div className="v-enter" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {q.options.map((opt) =>
            <VOptionButton key={opt.id} label={opt.label}
              selected={picked === opt.id}
              onClick={() => onPick(opt.id)} />
          )}
        </div>

        {acked && (
          <div className="v-enter-fade" style={{
            marginTop: 18, padding: '14px 18px', borderRadius: 16,
            background: 'rgba(255,255,255,0.7)', border: '1px solid var(--border-soft)',
            display: 'flex', alignItems: 'center', gap: 12
          }}>
            <div style={{ width: 24, height: 24, borderRadius: 9999, background: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <VIcon name="check" size={12} color="#fff" strokeWidth={2.5} />
            </div>
            <div style={{ fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 16, color: 'var(--ink)' }}>
              {isLast ? t('diagQ.gotItLast') : t('diagQ.gotItNext')}
            </div>
          </div>
        )}

        <div style={{ flex: 1, minHeight: 24 }} />
        <button className="v-btn-primary v-tap"
          onClick={goNext}
          disabled={!acked} style={{ opacity: acked ? 1 : 0.4 }}>
          {isLast ? t('diagQ.finish') : t('common:continue')} <VIcon name="arrow-right" size={14} color="#fff" />
        </button>
      </div>
    </VSoftBackdrop>
  );
}
