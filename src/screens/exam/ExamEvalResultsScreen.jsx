import React from 'react';
import VIcon from '../../prototype/icons';
import { VTopBar, VSectionHeader } from '../../prototype/shared';

export default function ExamEvalResultsScreen({ go, state }) {
  const result = state?.examResult;

  if (result === 'error' || !result) {
    return (
      <div style={{ minHeight: '100%', background: 'var(--bg)' }}>
        <VTopBar transparent showBack onBack={() => go('home')} />
        <div style={{ padding: '72px 24px 32px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'Inter', fontSize: 14, color: 'var(--muted)', marginBottom: 20 }}>
            {result === 'error' ? "Couldn't evaluate your sheets. Please try again with clearer photos." : 'No evaluation found.'}
          </div>
          <button className="v-btn-primary v-tap" onClick={() => go('exam-photo')}>Re-upload sheets</button>
          <button className="v-btn-secondary v-tap" onClick={() => go('home')} style={{ marginTop: 10 }}>Back to home</button>
        </div>
      </div>
    );
  }

  const awarded = result.total_awarded ?? 0;
  const possible = result.total_possible ?? state?.examMarks ?? 80;
  const pct = result.percentage ?? Math.round((awarded / possible) * 100);
  const sections = result.sections || [];

  // Count correct questions across sections (status === 'correct')
  const correctCount = sections.reduce(
    (acc, s) => acc + (s.questions || []).filter((q) => q.status === 'correct').length, 0
  );

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)' }}>
      <VTopBar transparent showBack onBack={() => go('home')} />
      <div style={{ padding: '72px 24px 32px' }}>
        <div className="v-enter" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18, background: '#FFF9F0',
            boxShadow: '0 8px 30px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.05)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
          }}>
            <VIcon name="sparkles" size={28} color="#F59E0B" />
          </div>
          <div className="v-eyebrow" style={{ marginBottom: 8 }}>EVALUATION COMPLETE</div>
          <h1 className="v-h1" style={{ fontSize: 30, textAlign: 'center' }}>Your Vidya score</h1>
        </div>

        <div className="v-card v-enter" style={{ padding: 32, marginBottom: 14, textAlign: 'center' }}>
          <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontWeight: 700, fontSize: 84, lineHeight: 1, color: 'var(--ink)' }}>{awarded}<span style={{ fontSize: 36, color: 'var(--muted-2)' }}>/{possible}</span></div>
          <div style={{ fontSize: 14, color: 'var(--muted)', marginTop: 14 }}>Approx. {pct}% · A teacher review will refine this</div>
        </div>

        {result.overall_feedback && (
          <div className="v-card-soft v-enter" style={{ padding: '16px 18px', marginBottom: 24 }}>
            <div style={{ fontFamily: 'Inter', fontSize: 13, color: 'var(--ink)', lineHeight: 1.55 }}>{result.overall_feedback}</div>
          </div>
        )}

        {correctCount > 0 && (
          <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
            <div className="v-card-soft" style={{ flex: 1, textAlign: 'center', padding: '18px 12px' }}>
              <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 24 }}>{pct}%</div>
              <div className="v-eyebrow-sm" style={{ marginTop: 4 }}>overall</div>
            </div>
            <div className="v-card-soft" style={{ flex: 1, textAlign: 'center', padding: '18px 12px' }}>
              <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 24 }}>{correctCount}</div>
              <div className="v-eyebrow-sm" style={{ marginTop: 4 }}>questions correct</div>
            </div>
          </div>
        )}

        {sections.length > 0 && (
          <>
            <VSectionHeader title="BY SECTION" />
            <div className="v-card" style={{ padding: 0, marginBottom: 24, overflow: 'hidden' }}>
              {sections.map((s, i) => {
                const sa = s.marks_awarded ?? 0;
                const sp = s.marks_possible ?? 1;
                return (
                  <div key={i} style={{ padding: '16px 20px', borderTop: i ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 18 }}>Section {s.name}</span>
                      <span style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 18 }}>{sa}/{sp}</span>
                    </div>
                    <div style={{ height: 4, background: 'var(--border)', borderRadius: 9999, overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(100, (sa / sp) * 100)}%`, height: '100%', background: 'var(--ink)' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {Array.isArray(result.improvement_areas) && result.improvement_areas.length > 0 && (
          <>
            <VSectionHeader title="FOCUS NEXT" />
            <div className="v-card" style={{ padding: '14px 18px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {result.improvement_areas.map((a, i) => (
                <div key={i} className="v-pill" style={{ background: '#FFF7ED', border: '1px solid #B4530922', color: '#B45309' }}>{a}</div>
              ))}
            </div>
          </>
        )}

        <button className="v-btn-primary v-tap" onClick={() => go('exam-detail')}>See detailed feedback <VIcon name="arrow-right" size={14} color="#fff" /></button>
        <button className="v-btn-secondary v-tap" onClick={() => go('home')} style={{ marginTop: 10 }}>Back to home</button>
      </div>
    </div>
  );
}
