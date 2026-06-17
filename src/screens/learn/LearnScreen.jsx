import React, { useState, useEffect, useRef } from 'react';
import VIcon from '../../prototype/icons';
import { VTopBar, VBottomNav, VAskVidyaFAB, VProfileChip, VSectionHeader } from '../../prototype/shared';
import { CHAPTERS } from '../../content/chapters';

const CONCEPTS = [
  { t: 'Adding unlike fractions', topic: 'Fractions', keys: ['fraction', 'add', 'unlike', 'denominator', 'lcm'] },
  { t: 'Why does LCM work?', topic: 'Number sense', keys: ['lcm', 'multiple', 'common', 'denominator'] },
  { t: 'Area of a triangle', topic: 'Mensuration', keys: ['area', 'triangle', 'half base height'] },
  { t: 'Linear equations (1 var)', topic: 'Algebra', keys: ['linear', 'equation', 'solve', 'x', 'variable'] },
  { t: 'Pythagoras theorem', topic: 'Geometry', keys: ['pythagoras', 'right', 'triangle', 'hypotenuse'] },
  { t: 'Mean, median, mode', topic: 'Data', keys: ['mean', 'median', 'mode', 'average', 'data'] },
  { t: 'Equivalent fractions', topic: 'Fractions', keys: ['equivalent', 'fraction', 'simplify'] },
  { t: 'Properties of integers', topic: 'Integers', keys: ['integer', 'negative', 'sign', 'property'] },
];

function LearnLiveResults({ q, onPick, onClose, onBrowse }) {
  const needle = (q || '').toLowerCase().trim();
  const matches = needle
    ? CONCEPTS.filter(c => c.t.toLowerCase().includes(needle) || c.topic.toLowerCase().includes(needle) || c.keys.some(k => needle.includes(k) || k.includes(needle))).slice(0, 4)
    : CONCEPTS.slice(0, 4);
  const hasQuery = needle.length > 0;

  return (
    <div className="v-enter-fade" style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 18, marginBottom: 8, boxShadow: '0 8px 24px rgba(28,25,23,0.06)', overflow: 'hidden' }}>
      <div className="v-tap" onClick={() => hasQuery && onPick(q)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: hasQuery ? '#FAFAF7' : '#fff', borderBottom: '1px solid var(--border)', opacity: hasQuery ? 1 : 0.5 }}>
        <div style={{ width: 32, height: 32, borderRadius: 9999, background: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <VIcon name="book" size={14} color="#fff" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 15, lineHeight: 1.25, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {hasQuery ? `Explain: "${q.trim()}"` : 'Type a concept to learn'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted-2)', marginTop: 2 }}>
            {hasQuery ? '→ Concept page · 6-step walk-through' : 'e.g. why does LCM work?'}
          </div>
        </div>
        {hasQuery && <VIcon name="arrow-right" size={14} color="var(--muted-2)" />}
      </div>

      {matches.length > 0 && (
        <div>
          <div className="v-eyebrow" style={{ padding: '12px 16px 6px', color: 'var(--muted-2)', fontSize: 9 }}>
            {hasQuery ? 'MATCHING CONCEPTS' : 'POPULAR CONCEPTS'}
          </div>
          {matches.map((m, i) =>
            <div key={m.t} className="v-tap" onClick={() => onPick(m.t)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderTop: i ? '1px solid var(--border-soft)' : 'none' }}>
              <VIcon name="book" size={15} color="var(--muted-2)" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 14, lineHeight: 1.2 }}>{m.t}</div>
                <div style={{ fontSize: 10.5, color: 'var(--muted-2)', marginTop: 1 }}>{m.topic}</div>
              </div>
              <VIcon name="chevron-right" size={14} color="var(--muted-2)" />
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderTop: '1px solid var(--border)', background: 'var(--bg)' }}>
        <button onClick={onBrowse} className="v-tap" style={{ background: 'transparent', border: 'none', padding: '4px 6px', fontFamily: 'Inter', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
          <VIcon name="search" size={12} color="var(--muted)" /> Browse all concepts
        </button>
        <button onClick={onClose} className="v-tap" style={{ background: 'transparent', border: 'none', padding: '4px 6px', fontFamily: 'Inter', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', color: 'var(--muted-2)' }}>Cancel</button>
      </div>
    </div>
  );
}

export default function LearnScreen({ go, set, state }) {
  const [focused, setFocused] = useState(false);
  const [q, setQ] = useState('');
  const [subjectSheet, setSubjectSheet] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (state?.askedConcept && set) set({ askedConcept: null });
  }, []);

  const submitConcept = (raw) => {
    const text = (raw ?? q).trim();
    if (!text) return;
    set && set({ askedConcept: text });
    setFocused(false);
    go('learn-concept');
  };

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)', position: 'relative' }}>
      <VTopBar transparent right={<VProfileChip go={go} name={state.name} />} />
      <div style={{ padding: '72px 24px 140px' }}>
        <div className="v-eyebrow" style={{ marginBottom: 8 }}>LEARN</div>
        <h1 className="v-h1" style={{ fontSize: 36, marginBottom: 8 }}>Understand a concept</h1>
        <p className="v-body" style={{ marginBottom: 18 }}>Ask, search, or pick a chapter below.</p>

        <div
          className="v-tap"
          onClick={() => { setFocused(true); setTimeout(() => inputRef.current && inputRef.current.focus(), 0); }}
          style={{ background: '#fff', borderRadius: 18, border: '1.5px solid var(--ink)', padding: '12px 14px 12px 16px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 4px 18px rgba(28,25,23,0.06)' }}>
          <VIcon name="search" size={16} color="var(--muted-2)" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => { setQ(e.target.value); if (!focused) setFocused(true); }}
            onFocus={() => setFocused(true)}
            onKeyDown={(e) => { if (e.key === 'Enter') submitConcept(); }}
            placeholder="Ask a concept · e.g. why does LCM work?"
            style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontStyle: q ? 'normal' : 'italic', fontSize: 14, color: 'var(--ink)', lineHeight: 1.3, padding: 0 }} />
          <button
            onClick={(e) => { e.stopPropagation(); if (q.trim()) submitConcept(); else { setFocused(true); setTimeout(() => inputRef.current && inputRef.current.focus(), 0); } }}
            style={{ background: 'var(--ink)', opacity: q.trim() ? 1 : 0.35, border: 'none', width: 32, height: 32, borderRadius: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'opacity .15s' }}
            aria-label="Send">
            <VIcon name="send" size={13} color="#fff" />
          </button>
        </div>

        {focused && (
          <LearnLiveResults
            q={q}
            onPick={(s) => submitConcept(s)}
            onClose={() => { setFocused(false); setQ(''); }}
            onBrowse={() => go('concept-library')} />
        )}

        <div className="v-card-soft v-tap" onClick={() => setSubjectSheet(true)} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, marginTop: 12, background: '#fff', opacity: focused ? 0.35 : 1, transition: 'opacity .2s' }}>
          <div style={{ width: 36, height: 36, borderRadius: 9999, background: 'var(--indigo-air)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <VIcon name="book" size={16} color="var(--indigo)" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="v-eyebrow-sm" style={{ marginBottom: 2 }}>SUBJECT</div>
            <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 16, lineHeight: 1.2 }}>Mathematics · Class 7 · CBSE</div>
          </div>
          <VIcon name="chevron-down" size={16} color="var(--muted-2)" />
        </div>

        <div style={{ opacity: focused ? 0.35 : 1, transition: 'opacity .2s' }}>
          <VSectionHeader title="CHAPTERS" />
          <div className="v-card" style={{ padding: 0, overflow: 'hidden', marginBottom: 24 }}>
            {CHAPTERS.map((c, i) => (
              <div key={c.id} className="v-tap"
                onClick={() => { set && set({ askedConcept: c.title, skillId: null }); go('learn-concept'); }}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '18px 20px', borderTop: i ? '1px solid var(--border)' : 'none' }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--indigo-air)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <VIcon name="book" size={15} color="var(--indigo)" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 17, marginBottom: 2, lineHeight: 1.2 }}>{c.title}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--muted-2)' }}>{c.sub}</div>
                </div>
                <VIcon name="chevron-right" size={16} color="var(--muted-2)" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <VAskVidyaFAB context="learn" />
      <VBottomNav active="learn" go={go} />

      {subjectSheet && (
        <div onClick={() => setSubjectSheet(false)} style={{ position: 'absolute', inset: 0, zIndex: 80, background: 'rgba(28,25,23,0.42)', backdropFilter: 'blur(2px)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', animation: 'vFade 200ms ease-out both' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--bg)', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: '14px 20px 28px', boxShadow: '0 -8px 32px rgba(0,0,0,0.12)', animation: 'vSheetUp 320ms cubic-bezier(.16,1,.3,1) both' }}>
            <div style={{ width: 36, height: 4, borderRadius: 9999, background: 'var(--border)', margin: '0 auto 14px' }} />
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
              <div className="v-eyebrow">SUBJECT</div>
              <div className="v-tap" onClick={() => setSubjectSheet(false)} style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', color: 'var(--muted-2)', textTransform: 'uppercase' }}>Close</div>
            </div>
            <h2 style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontWeight: 500, fontSize: 26, letterSpacing: '-0.02em', margin: '0 0 18px', color: '#000' }}>
              What are we<br />learning today?
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { id: 'maths', label: 'Mathematics', sub: 'Class 7 · CBSE', glyph: 'π', active: true },
                { id: 'science', label: 'Science', sub: 'Coming soon', glyph: '⚛', disabled: true },
                { id: 'english', label: 'English', sub: 'Coming soon', glyph: 'Aa', disabled: true },
                { id: 'social', label: 'Social Studies', sub: 'Coming soon', glyph: '◯', disabled: true },
              ].map((s) => (
                <div key={s.id} className="v-tap" onClick={s.disabled ? undefined : () => setSubjectSheet(false)} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', background: s.active ? 'var(--ink)' : '#fff', color: s.active ? '#fff' : 'var(--ink)', border: s.active ? '1.5px solid var(--ink)' : '1px solid var(--border)', borderRadius: 18, opacity: s.disabled ? 0.5 : 1, cursor: s.disabled ? 'not-allowed' : 'default', transition: 'all 160ms ease' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 9999, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 20, background: s.active ? 'rgba(255,255,255,0.12)' : 'var(--indigo-air)', color: s.active ? 'rgba(255,255,255,0.9)' : 'var(--indigo)' }}>{s.glyph}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 18, fontWeight: 500, letterSpacing: '-0.01em', lineHeight: 1.2 }}>{s.label}</div>
                    <div style={{ fontSize: 12, color: s.active ? 'rgba(255,255,255,0.65)' : 'var(--muted-2)', marginTop: 2, lineHeight: 1.3 }}>{s.sub}</div>
                  </div>
                  {s.disabled && <div style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted-2)', padding: '4px 9px', borderRadius: 9999, background: 'var(--bg-warm)' }}>Soon</div>}
                  {s.active && <VIcon name="check" size={16} color="#fff" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
