import React from 'react';
import { useTranslation } from 'react-i18next';
import VIcon from '../../prototype/icons';
import { VTopBar, VSectionHeader } from '../../prototype/shared';
import { getLog, topicStats, overallStats, type Bucket } from '../../lib/progress';
import type { ScreenProps } from '../../types';

const BUCKET_LABEL: Record<Bucket, string> = {
  strong: 'Strong', confident: 'Confident', improving: 'Improving', needshelp: 'Needs work',
};

export default function TopicMasteryScreen({ go, state, set }: ScreenProps) {
  const { t } = useTranslation('progress');
  const log = getLog(state);
  const stats = topicStats(log).slice().sort((a, b) => b.percent - a.percent);
  const overall = overallStats(log);
  const pct = overall.masteryPercent;
  const gap = 100 - pct;

  const openTopic = (topic: string) => { set({ askedConcept: topic }); go('learn-concept'); };
  const weakest = [...stats].sort((a, b) => a.avg - b.avg)[0];

  if (stats.length === 0) {
    return (
      <div style={{ minHeight: '100%', background: 'var(--bg)' }}>
        <VTopBar transparent showBack onBack={() => go('progress')} />
        <div style={{ padding: '72px 24px 32px', textAlign: 'center' }}>
          <h1 className="v-h1" style={{ fontSize: 30, marginBottom: 12 }}>{t('mastery.title')}</h1>
          <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.5, marginBottom: 20 }}>
            Take a quiz or finish a lesson to start building your topic mastery.
          </div>
          <button className="v-btn-primary v-tap" onClick={() => go('home')}>Start a session <VIcon name="arrow-right" size={14} color="#fff" /></button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)' }}>
      <VTopBar transparent showBack onBack={() => go('progress')} />
      <div style={{ padding: '72px 24px 32px' }}>
        <div className="v-eyebrow" style={{ marginBottom: 8 }}>YOUR TOPICS</div>
        <h1 className="v-h1" style={{ fontSize: 30, marginBottom: 24 }}>{t('mastery.title')}</h1>

        <div className="v-card" style={{ padding: 28, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ position: 'relative', width: 120, height: 120, flexShrink: 0 }}>
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="var(--border)" strokeWidth="10" />
              <circle cx="60" cy="60" r="50" fill="none" stroke="var(--ink)" strokeWidth="10"
                strokeDasharray={`${pct / 100 * 314} 314`} strokeLinecap="round" transform="rotate(-90 60 60)" />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 32, fontWeight: 600, lineHeight: 1 }}>{pct}<span style={{ fontSize: 16 }}>%</span></div>
              <div style={{ fontSize: 9, letterSpacing: '0.1em', color: 'var(--muted-2)', marginTop: 4 }}>{t('mastery.mastered')}</div>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 18, marginBottom: 8, lineHeight: 1.3 }}>{t('mastery.gap', { percent: gap })}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>{t('mastery.gapSub')}</div>
          </div>
        </div>

        <VSectionHeader title={t('mastery.concepts')} />
        <div className="v-card" style={{ padding: 0, overflow: 'hidden' }}>
          {stats.map((c, i) => {
            const tone = c.percent >= 80 ? 'var(--accent-success)' : c.percent >= 50 ? 'var(--accent-amber)' : 'var(--accent-warn)';
            return (
              <div key={c.topic} className="v-tap" onClick={() => openTopic(c.topic)} style={{ padding: '18px 20px', borderTop: i ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 8, height: 8, borderRadius: 9999, background: tone, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 17, marginBottom: 2 }}>{c.topic}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted-2)' }}>{BUCKET_LABEL[c.bucket]} · {c.attempts} {c.attempts === 1 ? 'attempt' : 'attempts'}</div>
                </div>
                <div style={{ fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 18, color: tone }}>{c.percent}%</div>
              </div>
            );
          })}
        </div>

        {weakest && (
          <button className="v-btn-primary v-tap" onClick={() => openTopic(weakest.topic)} style={{ marginTop: 24 }}>
            {t('mastery.practiceWeak')} <VIcon name="arrow-right" size={14} color="#fff" />
          </button>
        )}
      </div>
    </div>
  );
}
