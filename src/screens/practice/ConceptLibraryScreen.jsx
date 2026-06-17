import React, { useState } from 'react';
import VIcon from '../../prototype/icons';
import { VTopBar } from '../../prototype/shared';

const ALL = [
  { t: 'Fractions: addition', topic: 'Fractions', tag: 'Concept' },
  { t: 'Lowest common multiple', topic: 'Number sense', tag: 'Concept' },
  { t: 'Area of a triangle', topic: 'Mensuration', tag: 'Formula' },
  { t: 'Linear equations in one variable', topic: 'Algebra', tag: 'Concept' },
  { t: 'Properties of integers', topic: 'Integers', tag: 'Concept' },
  { t: 'Pythagoras theorem', topic: 'Geometry', tag: 'Theorem' },
  { t: 'Mean, median, mode', topic: 'Data', tag: 'Concept' },
];

export default function ConceptLibraryScreen({ go }) {
  const [q, setQ] = useState('');
  const filtered = q ? ALL.filter(a => a.t.toLowerCase().includes(q.toLowerCase()) || a.topic.toLowerCase().includes(q.toLowerCase())) : ALL;

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)' }}>
      <VTopBar transparent showBack onBack={() => go('practice')} />
      <div style={{ padding: '72px 24px 32px' }}>
        <div className="v-eyebrow" style={{ marginBottom: 8 }}>CONCEPT LIBRARY</div>
        <h1 className="v-h1" style={{ fontSize: 30, marginBottom: 20 }}>Look something up</h1>

        <div style={{ position: 'relative', marginBottom: 24 }}>
          <input
            autoFocus
            placeholder="Try 'fractions' or 'area of a triangle'"
            value={q}
            onChange={e => setQ(e.target.value)}
            style={{ width: '100%', padding: '16px 16px 16px 46px', background: '#fff', border: '1px solid var(--border)', borderRadius: 16, fontFamily: 'Inter', fontSize: 14, outline: 'none' }} />
          <div style={{ position: 'absolute', left: 16, top: 16 }}><VIcon name="search" size={18} color="var(--muted-2)" /></div>
        </div>

        <div className="v-eyebrow" style={{ marginBottom: 14 }}>{q ? 'Results' : 'Recents'}</div>
        <div className="v-card" style={{ padding: 0, overflow: 'hidden' }}>
          {filtered.map((a, i) => (
            <div key={a.t} className="v-tap" onClick={() => go('learning-studio')} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px',
              borderTop: i ? '1px solid var(--border)' : 'none',
            }}>
              <VIcon name="book" size={18} color="var(--muted)" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 17 }}>{a.t}</div>
                <div style={{ fontSize: 11, color: 'var(--muted-2)', marginTop: 2 }}>{a.topic} · {a.tag}</div>
              </div>
              <VIcon name="chevron-right" size={16} color="var(--muted-2)" />
            </div>
          ))}
          {filtered.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted-2)', fontSize: 13 }}>No matches</div>}
        </div>
      </div>
    </div>
  );
}
