import React, { useState, useEffect } from 'react';
import VIcon from '../../prototype/icons';
import { VSoftBackdrop, VTopBar, VidyaAvatar, VidyaIcon } from '../../prototype/shared';

const ALL_TOPICS = [
  { id: 'fractions', title: 'Fractions', sub: 'Understanding parts of a whole', reason: 'Suggested from your diagnostic' },
  { id: 'decimals', title: 'Decimals', sub: 'Place value and tenths', reason: 'Builds on what you know' },
  { id: 'integers', title: 'Integers', sub: 'Positives, negatives, and zero', reason: 'You answered most of these right' },
  { id: 'algebra', title: 'Linear equations', sub: 'Finding the unknown', reason: 'A bit of a stretch — challenge mode' },
  { id: 'geometry', title: 'Lines and angles', sub: 'Reading shapes around you', reason: 'Visual & hands-on' },
];

export default function FirstPlanScreen({ go, state, set }) {
  const name = state.name || 'there';
  const [topicId, setTopicId] = useState(state?.planTopicId || 'fractions');
  const [editing, setEditing] = useState(false);
  const [showMascot, setShowMascot] = useState(false);
  const topic = ALL_TOPICS.find((t) => t.id === topicId) || ALL_TOPICS[0];

  useEffect(() => {
    const t = setTimeout(() => setShowMascot(true), 1400);
    return () => clearTimeout(t);
  }, []);

  const chooseTopic = (id) => {
    setTopicId(id);
    set && set({ planTopicId: id });
    setEditing(false);
  };

  return (
    <VSoftBackdrop variant="warm">
      <VTopBar transparent />
      <div style={{ padding: '72px 24px 32px', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        <div className="v-eyebrow v-enter" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <VidyaIcon size={14} />
          <span>Vidya suggests · change anything</span>
        </div>
        <h1 className="v-h1 v-enter" style={{ fontSize: 32, marginBottom: 8, lineHeight: 1.1 }}>
          Today, start with<br /><span style={{ fontStyle: 'normal' }}>{topic.title}.</span>
        </h1>
        <p className="v-enter" style={{ fontFamily: 'Inter', fontSize: 14, color: 'var(--muted)', marginBottom: 24, lineHeight: 1.5 }}>
          One topic. About 15 minutes. We'll go step by step.
        </p>

        <div className="v-card v-enter" style={{ padding: 0, overflow: 'hidden', marginBottom: 14 }}>
          <div style={{
            padding: '22px 22px 18px',
            background: 'linear-gradient(135deg, #FFE4D5 0%, #DBE4FF 60%, #E0E7FF 100%)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, gap: 8 }}>
              <div className="v-eyebrow-sm" style={{ color: 'var(--ink)', opacity: 0.7 }}>Today's topic</div>
              <div className="v-pill" style={{ background: 'rgba(255,255,255,0.8)', fontWeight: 600, fontSize: 11 }}>
                <VIcon name="clock" size={10} color="var(--ink)" /> 15 min
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 28, fontWeight: 500, color: 'var(--ink)', letterSpacing: '-0.01em', lineHeight: 1.15, marginBottom: 6 }}>
                  {topic.title}
                </div>
                <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 15, color: 'var(--ink-2)', opacity: 0.75, lineHeight: 1.4 }}>
                  {topic.sub}
                </div>
              </div>
              <button className="v-tap" onClick={() => setEditing((e) => !e)} style={{
                background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(28,25,23,0.12)',
                borderRadius: 9999, padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 5,
                fontFamily: 'Inter', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', color: 'var(--ink)',
                cursor: 'default', flexShrink: 0
              }}>
                <VIcon name={editing ? 'x' : 'edit'} size={11} color="var(--ink)" />
                {editing ? 'Done' : 'Change'}
              </button>
            </div>
            <div style={{ marginTop: 12, fontSize: 11, color: 'var(--ink)', opacity: 0.55, fontFamily: 'Inter', letterSpacing: '0.01em' }}>
              {topic.reason}
            </div>
          </div>

          {editing && (
            <div className="v-enter-fade" style={{
              padding: '14px 18px', background: 'var(--bg-warm)',
              borderTop: '1px solid var(--border)'
            }}>
              <div className="v-eyebrow" style={{ marginBottom: 10, color: 'var(--muted-2)', fontSize: 9 }}>OTHER STARTING POINTS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {ALL_TOPICS.filter((t) => t.id !== topicId).map((t) =>
                  <div key={t.id} className="v-tap" onClick={() => chooseTopic(t.id)} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px', background: '#fff', borderRadius: 12,
                    border: '1px solid var(--border-soft)'
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 15, lineHeight: 1.2, color: 'var(--ink)' }}>{t.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted-2)', marginTop: 1 }}>{t.reason}</div>
                    </div>
                    <VIcon name="chevron-right" size={14} color="var(--muted-2)" />
                  </div>
                )}
              </div>
              <button className="v-tap" onClick={() => setEditing(false)} style={{
                width: '100%', marginTop: 10, background: 'transparent', border: 'none',
                fontFamily: 'Inter', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em',
                color: 'var(--muted-2)', padding: '6px 0'
              }}>
                Keep "{topic.title}"
              </button>
            </div>
          )}

          <div style={{ padding: '18px 22px 4px' }}>
            {[
              { n: '1', title: 'What does it mean?', sub: 'A simple explanation' },
              { n: '2', title: 'A real-life example', sub: 'Where it shows up around you' },
              { n: '3', title: 'One solved example', sub: "Watch how it's done" },
              { n: '4', title: 'Try 3 questions', sub: 'Your turn, gently' },
            ].map((row, i, arr) =>
              <div key={row.n} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0',
                borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none'
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 9999,
                  border: '1px solid var(--border)', background: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 14, fontWeight: 600, color: 'var(--ink)'
                }}>{row.n}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'Inter', fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 2 }}>{row.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted-2)', lineHeight: 1.4 }}>{row.sub}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        <p className="v-enter" style={{ fontSize: 12, color: 'var(--muted-2)', lineHeight: 1.55, margin: '4px 4px 0', textAlign: 'center' }}>
          You can pause anytime. Vidya will remember where you left off.
        </p>

        <div style={{ flex: 1, minHeight: 24 }} />
        <button className="v-btn-primary v-tap" onClick={() => go('home-post-diag')}>
          Start Learning <VIcon name="arrow-right" size={14} color="#fff" />
        </button>
      </div>

      {showMascot && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div onClick={() => setShowMascot(false)} style={{
            position: 'absolute', inset: 0,
            background: 'rgba(16,48,97,0.45)',
            backdropFilter: 'blur(3px)',
            WebkitBackdropFilter: 'blur(3px)'
          }} />
          <div style={{
            position: 'relative',
            background: '#fff',
            borderRadius: '28px 28px 0 0',
            padding: '0 24px 36px',
            animation: 'vSlideUp 0.55s cubic-bezier(.16,1,.3,1) both'
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: -48, marginBottom: 4 }}>
              <div style={{ padding: 5, background: '#fff', borderRadius: 9999, boxShadow: '0 8px 28px -8px rgba(16,48,97,0.35)' }}>
                <VidyaAvatar size={82} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 2 }}>
              <svg width="22" height="10" viewBox="0 0 22 10">
                <path d="M11 10 L2 0 L20 0 Z" fill="#fff" />
              </svg>
            </div>
            <div style={{ textAlign: 'center', padding: '6px 4px 22px' }}>
              <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 23, fontWeight: 700, color: 'var(--indigo-ink)', marginBottom: 10, lineHeight: 1.2, letterSpacing: '-0.01em' }}>
                Your week plan is ready!
              </div>
              <div style={{ fontFamily: 'Inter', fontSize: 14, color: 'var(--muted)', lineHeight: 1.55, maxWidth: 280, margin: '0 auto' }}>
                I've mapped out your first week based on your diagnostic. It takes 15 minutes a day.
              </div>
            </div>
            <button className="v-btn-primary v-tap" onClick={() => { setShowMascot(false); go('week-plan'); }} style={{ marginBottom: 10 }}>
              See my week plan <VIcon name="arrow-right" size={14} color="#fff" />
            </button>
            <button className="v-tap" onClick={() => setShowMascot(false)} style={{
              width: '100%', background: 'transparent', border: 'none',
              padding: '12px 0 0',
              fontFamily: 'Inter', fontSize: 13, fontWeight: 500,
              color: 'var(--muted)', cursor: 'default', textAlign: 'center'
            }}>
              Start today first
            </button>
          </div>
        </div>
      )}
    </VSoftBackdrop>
  );
}
