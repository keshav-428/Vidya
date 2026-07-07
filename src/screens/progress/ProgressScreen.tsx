import React from 'react';
import { useTranslation } from 'react-i18next';
import VIcon from '../../prototype/icons';
import { VTopBar, VBottomNav, VProfileChip, VContextChip, VSectionHeader } from '../../prototype/shared';
import {
  getLog, weeklyStreak, topicStats, masteryBuckets, needsHelpTopics, strongTopics,
  recentPractice, mistakesToRetry, type Bucket,
} from '../../lib/progress';
import { subjectMastery } from '../../lib/mastery';
import { classChapters } from '../../content/syllabus';
import api from '../../api/vidya';
import type { ScreenProps, MasteryMap } from '../../types';

const BUCKET_COLOR: Record<Bucket, string> = {
  strong: 'var(--accent-success)',
  confident: '#10B981',
  improving: 'var(--accent-amber)',
  needshelp: 'var(--accent-warn)',
};

export default function ProgressScreen({ go, state, set }: ScreenProps) {
  const { t } = useTranslation('progress');
  const dayLabels = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

  const log = getLog(state);
  const week = weeklyStreak(log);
  const stats = topicStats(log);
  const buckets = masteryBuckets(stats);
  const needs = needsHelpTopics(stats);
  const strong = strongTopics(stats);
  const recent = recentPractice(log);
  const retries = mistakesToRetry(log);
  const hasData = stats.length > 0 || recent.length > 0;
  const bucketTotal = buckets.reduce((a, b) => a + b.count, 0);

  // Open a topic as a fresh concept lesson.
  const openTopic = (topic: string) => { set({ askedConcept: topic }); go('learn-concept'); };

  // Catalog-keyed subject mastery (drives the topic-map entry card).
  const chapters = classChapters(api.toGrade(state?.classLevel));
  const subject = subjectMastery((state?.mastery as MasteryMap) || {}, chapters);
  const masteryPct = Math.round(subject.avg * 100);
  const coveragePct = Math.round(subject.coverage * 100);

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)', position: 'relative' }}>
      <VTopBar transparent left={<VContextChip go={go} classLevel={state?.classLevel || 6} />} right={<VProfileChip go={go} name={state?.name} />} />
      <div style={{ padding: '72px 24px 140px' }}>
        <div className="v-eyebrow" style={{ marginBottom: 8 }}>{t('progress.eyebrow')}</div>
        <h1 className="v-h1" style={{ fontSize: 32, marginBottom: 8 }}>{t('progress.title')}</h1>
        <p className="v-body" style={{ marginBottom: 28 }}>{t('progress.subtitle')}</p>

        {/* Topic mastery map — entry to the per-subtopic level view */}
        <div className="v-card v-tap" onClick={() => go('topic-mastery')} style={{ marginBottom: 14, padding: 20, display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ position: 'relative', width: 62, height: 62, flexShrink: 0 }}>
            <svg width="62" height="62" viewBox="0 0 62 62">
              <circle cx="31" cy="31" r="26" fill="none" stroke="var(--border)" strokeWidth="6" />
              <circle cx="31" cy="31" r="26" fill="none" stroke="var(--ink)" strokeWidth="6"
                strokeDasharray={`${(masteryPct / 100) * 163} 163`} strokeLinecap="round" transform="rotate(-90 31 31)" />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 17, fontWeight: 600 }}>{masteryPct}<span style={{ fontSize: 10 }}>%</span></div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 17, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.2 }}>Topic mastery</div>
            <div style={{ fontSize: 12, color: 'var(--muted-2)', marginTop: 3, lineHeight: 1.4 }}>Your level in every chapter &amp; subtopic · {coveragePct}% explored</div>
          </div>
          <VIcon name="chevron-right" size={18} color="var(--muted-2)" />
        </div>

        {/* Weekly streak — always shown (reads real active days this week) */}
        <div className="v-card" style={{ marginBottom: 14, padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
            <div className="v-eyebrow-sm">{t('progress.weeklyStreak')}</div>
            <div style={{ fontSize: 11, color: 'var(--muted-2)' }}>{t('progress.thisWeek')}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 14 }}>
            <div style={{ fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 48, fontWeight: 600, lineHeight: 1 }}>{week.count}</div>
            <div style={{ fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 18, color: 'var(--muted)' }}>{t('progress.daysOf', { total: 7 })}</div>
          </div>
          <div style={{ display: 'flex', gap: 5 }}>
            {dayLabels.map((d, i) => {
              const done = week.days[i];
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: '100%', height: 32, borderRadius: 8, background: done ? 'var(--ink)' : 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {done && <span style={{ color: 'var(--saffron)', fontSize: 14, lineHeight: 1 }}>•</span>}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--muted-2)' }}>{t(`progress.days.${d}`)}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Empty state — no scored activity yet */}
        {!hasData && (
          <div className="v-card" style={{ padding: 24, textAlign: 'center', marginBottom: 14 }}>
            <div style={{ fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 18, marginBottom: 6 }}>No progress yet</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5, marginBottom: 16 }}>
              Finish a lesson or take a quiz and your mastery, streak, and review list build up here.
            </div>
            <button className="v-btn-primary v-tap" onClick={() => go('home')} style={{ width: 'auto', padding: '12px 22px' }}>Start a session</button>
          </div>
        )}

        {hasData && (
          <>
            {/* Mastery distribution */}
            {bucketTotal > 0 && (
              <div className="v-card" style={{ marginBottom: 14, padding: 22 }}>
                <div className="v-eyebrow-sm" style={{ marginBottom: 14 }}>{t('progress.masteryHeader', { count: stats.length })}</div>
                <div style={{ display: 'flex', height: 10, borderRadius: 9999, overflow: 'hidden', marginBottom: 18, background: 'var(--border)' }}>
                  {buckets.map((b) => b.count > 0 && <div key={b.id} style={{ flex: b.count, background: BUCKET_COLOR[b.id] }} />)}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {buckets.map((b) => (
                    <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 9999, background: BUCKET_COLOR[b.id], flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 18, lineHeight: 1 }}>{b.count}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted-2)', marginTop: 2 }}>{t(`progress.buckets.${b.id}`)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Needs help */}
            {needs.length > 0 && (
              <>
                <VSectionHeader title={t('progress.needsHelp')} action={t('progress.seeAll')} onAction={() => go('topic-mastery')} />
                <div className="v-card" style={{ padding: 0, overflow: 'hidden', marginBottom: 14 }}>
                  {needs.slice(0, 4).map((s, i) => (
                    <div key={s.topic} className="v-tap" onClick={() => openTopic(s.topic)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderTop: i ? '1px solid var(--border)' : 'none' }}>
                      <div style={{ width: 8, height: 8, borderRadius: 9999, background: BUCKET_COLOR[s.bucket], flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 17, marginBottom: 2 }}>{s.topic}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted-2)' }}>{s.percent}% · {s.attempts} {s.attempts === 1 ? 'attempt' : 'attempts'}</div>
                      </div>
                      <div className="v-link">{t('progress.practice')}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Strong */}
            {strong.length > 0 && (
              <>
                <VSectionHeader title={t('progress.strong')} />
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
                  {strong.map((s) => (
                    <div key={s.topic} style={{ padding: '8px 14px', background: '#fff', border: '1px solid var(--accent-success)', borderRadius: 9999, fontSize: 12, color: 'var(--accent-success)', fontWeight: 500 }}>{s.topic}</div>
                  ))}
                </div>
              </>
            )}

            {/* Recent practice */}
            {recent.length > 0 && (
              <>
                <VSectionHeader title={t('progress.recentPractice')} />
                <div className="v-card" style={{ padding: 0, overflow: 'hidden', marginBottom: 14 }}>
                  {recent.map((r, i) => (
                    <div key={i} className="v-tap" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderTop: i ? '1px solid var(--border)' : 'none' }}>
                      <div style={{ width: 6, height: 6, borderRadius: 9999, background: BUCKET_COLOR[r.bucket], flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 16, marginBottom: 2, lineHeight: 1.2 }}>{r.topic}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted-2)' }}>{r.score} of {r.total} · {t(`progress.buckets.${r.bucket}`)}</div>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--muted-2)', fontFamily: 'Inter', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{r.when}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Mistakes to retry */}
            {retries.length > 0 && (
              <>
                <VSectionHeader title={t('progress.mistakesToRetry')} />
                <div className="v-card" style={{ padding: 0, overflow: 'hidden', marginBottom: 14 }}>
                  {retries.map((r, i) => (
                    <div key={i} className="v-tap" onClick={() => openTopic(r.topic)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderTop: i ? '1px solid var(--border)' : 'none' }}>
                      <div style={{ width: 32, height: 32, borderRadius: 10, background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 14, color: 'var(--accent-warn)' }}>{r.question.split(' ')[0]}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 16, marginBottom: 2, lineHeight: 1.2 }}>{r.question}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted-2)' }}>{r.topic}</div>
                      </div>
                      <div className="v-link">{t('progress.retry')}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
      <VBottomNav active="progress" go={go} />
    </div>
  );
}
