import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import VIcon from '../../prototype/icons';
import { VTopBar } from '../../prototype/shared';
import type { ScreenProps, ScreenId } from '../../types';

interface QPTopic { id: string; title: string; subject: string; sub: string; }

const QP_TOPICS: QPTopic[] = [
  { id: 'fractions-add', title: 'Adding fractions', subject: 'Maths', sub: 'Unlike denominators · LCM' },
  { id: 'fractions-eq', title: 'Equivalent fractions', subject: 'Maths', sub: 'Comparing & simplifying' },
  { id: 'decimals', title: 'Decimals', subject: 'Maths', sub: 'Place value, operations' },
  { id: 'algebra', title: 'Linear equations', subject: 'Maths', sub: 'Solving for one variable' },
  { id: 'mensuration', title: 'Area & perimeter', subject: 'Maths', sub: 'Triangles, circles, rectangles' },
  { id: 'geometry', title: 'Lines & angles', subject: 'Maths', sub: 'Properties, complementary, supplementary' },
  { id: 'integers', title: 'Integers', subject: 'Maths', sub: 'Negatives, sign rules' },
  { id: 'data', title: 'Mean, median, mode', subject: 'Maths', sub: 'Central tendency' },
];

interface QuickPrepLoopProps {
  go: (id: ScreenId) => void;
  topic: QPTopic;
  subStage: number;
  advance: (n: number) => void;
}

function QuickPrepLoop({ go, topic, subStage, advance }: QuickPrepLoopProps) {
  const { t } = useTranslation('quiz');
  interface Station {
    id: string;
    label: string;
    title: string;
    meta: string;
    target: ScreenId;
    tone: 'ink' | 'indigo' | 'success';
    onComplete: () => void;
  }
  const stations: Station[] = [
    { id: 'concept', label: t('quickPrep.labelConcept'), title: t('quickPrep.stationConceptTitle', { title: topic.title }), meta: t('quickPrep.stationConceptMeta'), target: 'learn-concept', tone: 'ink', onComplete: () => advance(1) },
    { id: 'practice', label: t('quickPrep.labelPractice'), title: t('quickPrep.stationPracticeTitle'), meta: t('quickPrep.stationPracticeMeta'), target: 'navigable-quiz', tone: 'indigo', onComplete: () => advance(2) },
    { id: 'recap', label: t('quickPrep.labelRecap'), title: t('quickPrep.stationRecapTitle'), meta: t('quickPrep.stationRecapMeta'), target: 'quiz-result-summary', tone: 'success', onComplete: () => advance(3) },
  ];

  return (
    <div style={{ position: 'relative' }}>
      <div aria-hidden="true" style={{
        position: 'absolute', left: 22, top: 24, bottom: 24, width: 2,
        background: 'repeating-linear-gradient(to bottom, var(--border) 0 4px, transparent 4px 8px)',
      }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {stations.map((s, i) => {
          const isDone = subStage > i;
          const isNow = subStage === i;
          const dotBg = isDone ? 'var(--accent-success)' : isNow ? 'var(--ink)' : '#fff';
          const dotColor = isDone || isNow ? '#fff' : 'var(--muted-2)';
          const dotBorder = isDone || isNow ? 'transparent' : 'var(--border)';
          const accent = { ink: 'var(--ink)', indigo: 'var(--indigo)', success: 'var(--accent-success)' }[s.tone] || 'var(--ink)';
          return (
            <div key={s.id} style={{ position: 'relative', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ position: 'relative', zIndex: 2, flexShrink: 0, width: 46, display: 'flex', justifyContent: 'center', paddingTop: 14 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 9999,
                  background: dotBg, color: dotColor,
                  border: `1.5px solid ${dotBorder}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 13, fontWeight: 700,
                  boxShadow: isNow ? '0 0 0 4px rgba(28,25,23,0.06)' : 'none',
                }}>
                  {isDone ? <VIcon name="check" size={13} color="#fff" strokeWidth={3} /> : (i + 1)}
                </div>
              </div>
              <div
                className="v-tap"
                onClick={() => { s.onComplete && s.onComplete(); go(s.target); }}
                style={{
                  flex: 1,
                  background: isDone ? 'var(--bg-warm)' : '#fff',
                  borderRadius: 18,
                  border: `1px solid ${isNow ? 'var(--ink)' : 'var(--border-soft)'}`,
                  padding: '14px 16px',
                  opacity: isDone ? 0.6 : (subStage < i ? 0.78 : 1),
                  boxShadow: isNow ? '0 4px 18px rgba(28,25,23,0.06)' : '0 1px 2px rgba(0,0,0,0.02)',
                  display: 'flex', alignItems: 'center', gap: 14,
                }}>
                <div style={{ width: 3, alignSelf: 'stretch', minHeight: 36, background: accent, borderRadius: 9999, flexShrink: 0, opacity: subStage < i ? 0.45 : 1 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span className="v-eyebrow-sm" style={{ color: accent, letterSpacing: '0.1em' }}>{s.label}</span>
                    {isNow && (<>
                      <span style={{ width: 2, height: 2, borderRadius: 9999, background: 'var(--muted-2)' }} />
                      <span style={{ fontSize: 9, fontFamily: 'Inter', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--ink)', textTransform: 'uppercase' }}>{t('quickPrep.now')}</span>
                    </>)}
                  </div>
                  <div style={{ fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 16, lineHeight: 1.25, color: 'var(--ink)', marginBottom: 3 }}>{s.title}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{s.meta}</div>
                </div>
                <VIcon name="chevron-right" size={16} color="var(--muted-2)" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function QuickPrepScreen({ go, state, set }: ScreenProps) {
  const { t } = useTranslation('quiz');
  const [stage, setStage] = useState((state?.quickPrepStage as number) || 0);
  const [q, setQ] = useState('');
  const [topic, setTopic] = useState<QPTopic | null>((state?.quickPrepTopic as QPTopic) || null);
  const [subStage, setSubStage] = useState(0);

  useEffect(() => {
    if (set) set({ quickPrepTopic: topic, quickPrepStage: stage });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- persists on topic/stage change; `set` is a stable parent closure
  }, [topic, stage]);

  const advance = (n: number) => setSubStage(s => Math.max(s, n));
  const reset = () => { setTopic(null); setStage(0); setSubStage(0); set && set({ quickPrepTopic: null, quickPrepStage: 0 }); };

  if (stage === 0) {
    const needle = (q || '').toLowerCase().trim();
    const filtered = needle
      ? QP_TOPICS.filter(t => t.title.toLowerCase().includes(needle) || t.sub.toLowerCase().includes(needle))
      : QP_TOPICS;
    const pick = (t: QPTopic) => { setTopic(t); setStage(1); setSubStage(0); };

    return (
      <div style={{ minHeight: '100%', background: 'var(--bg)', position: 'relative' }}>
        <VTopBar transparent showBack onBack={() => go('home')} />
        <div style={{ padding: '72px 24px 32px', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 12, background: '#FFFBEB',
              border: '1px solid rgba(217,119,6,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <VIcon name="zap" size={16} color="var(--accent-amber)" strokeWidth={2} />
            </div>
            <div className="v-eyebrow" style={{ color: 'var(--accent-amber)' }}>{t('quickPrep.eyebrow')}</div>
          </div>

          <h1 className="v-h1" style={{ fontSize: 30, marginBottom: 10, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            {t('quickPrep.title')}
          </h1>
          <p className="v-body" style={{ marginBottom: 22 }}>
            {t('quickPrep.subtitle')}
          </p>

          <div style={{ position: 'relative', marginBottom: 24 }}>
            <input
              autoFocus
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder={t('quickPrep.searchPlaceholder')}
              style={{
                width: '100%', padding: '16px 16px 16px 46px',
                background: '#fff', border: '1px solid var(--border)', borderRadius: 16,
                fontFamily: 'Inter', fontSize: 14, outline: 'none',
              }} />
            <div style={{ position: 'absolute', left: 16, top: 16 }}>
              <VIcon name="search" size={18} color="var(--muted-2)" />
            </div>
          </div>

          <div className="v-eyebrow" style={{ marginBottom: 12, color: 'var(--muted-2)' }}>
            {needle ? t('quickPrep.matches') : t('quickPrep.commonTopics')}
          </div>
          <div className="v-card" style={{ padding: 0, overflow: 'hidden', marginBottom: 14 }}>
            {filtered.map((t, i) => (
              <div key={t.id} className="v-tap" onClick={() => pick(t)} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
                borderTop: i ? '1px solid var(--border)' : 'none',
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 9999, background: 'var(--bg-warm)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <VIcon name="book" size={14} color="var(--muted)" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 16, lineHeight: 1.2, color: 'var(--ink)' }}>{t.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted-2)', marginTop: 2 }}>{t.subject} · {t.sub}</div>
                </div>
                <VIcon name="chevron-right" size={16} color="var(--muted-2)" />
              </div>
            ))}
            {filtered.length === 0 && (
              <div style={{ padding: '18px 20px' }}>
                <div style={{ fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 15, color: 'var(--ink)', marginBottom: 4 }}>
                  {t('quickPrep.noMatchTitle')}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14 }}>{t('quickPrep.noMatchSub', { q })}</div>
                <button className="v-btn-primary v-tap" onClick={() => pick({ id: 'custom', title: q, subject: t('quickPrep.customSubject'), sub: t('quickPrep.customSub') })}>
                  {t('quickPrep.startWith', { q })} <VIcon name="arrow-right" size={14} color="#fff" />
                </button>
              </div>
            )}
          </div>

          <div style={{ fontSize: 11, color: 'var(--muted-2)', textAlign: 'center' }}>
            {t('quickPrep.sideSessionNote')}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)', position: 'relative' }}>
      <VTopBar transparent showBack onBack={reset} />
      <div style={{ padding: '72px 24px 32px', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div className="v-eyebrow" style={{ color: 'var(--accent-amber)' }}>{t('quickPrep.eyebrow')}</div>
          <span style={{ width: 3, height: 3, borderRadius: 9999, background: 'var(--muted-2)' }} />
          <button className="v-tap" onClick={reset} style={{
            background: 'transparent', border: 'none', padding: 0,
            fontFamily: 'Inter', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', color: 'var(--muted)',
          }}>{t('quickPrep.changeTopic')}</button>
        </div>
        <h1 className="v-h1" style={{ fontSize: 28, marginBottom: 6, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
          {topic!.title}
        </h1>
        <p className="v-body" style={{ marginBottom: 24 }}>{topic!.sub}</p>

        <QuickPrepLoop go={go} topic={topic!} subStage={subStage} advance={advance} />

        <div style={{ marginTop: 20, paddingLeft: 60 }}>
          {subStage >= 3 ? (
            <div className="v-enter-fade" style={{
              background: 'var(--bg-warm)', border: '1px solid var(--accent-success)',
              borderRadius: 18, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: 9999, background: 'var(--accent-success)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <VIcon name="check" size={14} color="#fff" strokeWidth={3} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 15, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.2, marginBottom: 2 }}>
                  {t('quickPrep.readyFor', { title: topic!.title })}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{t('quickPrep.readySub')}</div>
              </div>
              <button className="v-tap" onClick={() => go('home')} style={{
                background: 'var(--ink)', color: '#fff', border: 'none', borderRadius: 9999, padding: '8px 14px',
                fontFamily: 'Inter', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                flexShrink: 0,
              }}>{t('quickPrep.done')}</button>
            </div>
          ) : (
            <button
              className="v-tap"
              onClick={() => advance(3)}
              disabled={subStage < 2}
              style={{
                width: '100%',
                background: subStage >= 2 ? 'var(--accent-success)' : 'transparent',
                color: subStage >= 2 ? '#fff' : 'var(--muted-2)',
                border: `1.5px solid ${subStage >= 2 ? 'var(--accent-success)' : 'var(--border)'}`,
                borderRadius: 9999, padding: '14px 18px',
                fontFamily: 'Inter', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                opacity: subStage >= 2 ? 1 : 0.55,
                transition: 'all .2s ease',
              }}>
              <VIcon name="check" size={14} color={subStage >= 2 ? '#fff' : 'var(--muted-2)'} strokeWidth={2.4} />
              {subStage >= 2 ? t('quickPrep.imReady') : t('quickPrep.finishSteps')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
