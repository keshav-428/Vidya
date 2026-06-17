import React, { useState } from 'react';
import VIcon from '../../prototype/icons';
import { VTopBar, VSoftBackdrop, VOptionButton } from '../../prototype/shared';

const SYLLABUS = [
  { id: 'numbers', title: 'Numbers', sub: 'Place value, comparing, rounding' },
  { id: 'fractions', title: 'Fractions', sub: 'Parts of a whole, adding, equivalents' },
  { id: 'decimals', title: 'Decimals', sub: 'Tenths, hundredths and operations' },
  { id: 'integers', title: 'Integers', sub: 'Positives, negatives and zero' },
  { id: 'algebra', title: 'Algebra', sub: 'Expressions and simple equations' },
  { id: 'geometry', title: 'Geometry', sub: 'Lines, angles and shapes' },
  { id: 'mensuration', title: 'Mensuration', sub: 'Perimeter, area and volume' },
  { id: 'data', title: 'Data Handling', sub: 'Reading and making charts' },
];

export default function BuildPlanScreen({ go, state, set }) {
  const [sel, setSel] = useState(state.ownChapters || []);
  const toggle = (id) => setSel((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  const create = () => {
    set({ ownChapters: sel, ownPlan: true, planTopicId: sel[0] || 'fractions' });
    go('first-plan');
  };
  return (
    <VSoftBackdrop variant="warm">
      <VTopBar showBack onBack={() => go('diag-intro')} transparent />
      <div style={{ padding: '72px 22px 28px', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        <div className="v-eyebrow v-enter" style={{ marginBottom: 12 }}>Build your own plan</div>
        <h1 className="v-h1 v-enter" style={{ fontSize: 29, marginBottom: 8, lineHeight: 1.13 }}>
          Pick what you want<br />to work on.
        </h1>
        <p className="v-enter" style={{ fontFamily: 'Inter', fontSize: 14, color: 'var(--muted)', marginBottom: 22, lineHeight: 1.5 }}>
          Choose one or more chapters. Vidya builds a plan around exactly these — you can change it anytime.
        </p>

        <div className="v-enter" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {SYLLABUS.map((ch) =>
            <VOptionButton key={ch.id} label={ch.title} sub={ch.sub} multi
              selected={sel.includes(ch.id)} onClick={() => toggle(ch.id)} />
          )}
        </div>

        <div style={{ flex: 1, minHeight: 20 }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '18px 4px 12px' }}>
          <span style={{ fontFamily: 'Inter', fontSize: 12, color: 'var(--muted-2)', letterSpacing: '0.03em' }}>
            {sel.length === 0 ? 'Select at least one chapter' : `${sel.length} chapter${sel.length > 1 ? 's' : ''} chosen`}
          </span>
          {sel.length > 0 && (
            <span className="v-tap" onClick={() => setSel(SYLLABUS.map((c) => c.id))} style={{ fontFamily: 'Inter', fontSize: 12, fontWeight: 600, color: 'var(--accent-blue)' }}>Select all</span>
          )}
        </div>
        <button className="v-btn-primary v-tap" onClick={create} disabled={sel.length === 0} style={{ opacity: sel.length ? 1 : 0.4 }}>
          Create my plan <VIcon name="arrow-right" size={14} color="#fff" />
        </button>
      </div>
    </VSoftBackdrop>
  );
}
