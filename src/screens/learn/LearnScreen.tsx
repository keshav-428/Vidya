import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import VIcon from '../../prototype/icons';
import { VTopBar, VBottomNav, VAskVidyaFAB, VProfileChip, VContextChip, VSectionHeader } from '../../prototype/shared';
import { classChapters } from '../../content/syllabus';
import api from '../../api/vidya';
import type { ScreenProps } from '../../types';

interface LearnLiveResultsProps {
  q: string;
  onPick: (s: string) => void;
  onClose: () => void;
  onBrowse: () => void;
}

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

function LearnLiveResults({ q, onPick, onClose, onBrowse }: LearnLiveResultsProps) {
  const { t } = useTranslation('learn');
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
            {hasQuery ? t('screen.explain', { q: q.trim() }) : t('screen.typeHint')}
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted-2)', marginTop: 2 }}>
            {hasQuery ? t('screen.conceptPageHint') : t('screen.egHint')}
          </div>
        </div>
        {hasQuery && <VIcon name="arrow-right" size={14} color="var(--muted-2)" />}
      </div>

      {matches.length > 0 && (
        <div>
          <div className="v-eyebrow" style={{ padding: '12px 16px 6px', color: 'var(--muted-2)', fontSize: 9 }}>
            {hasQuery ? t('screen.matching') : t('screen.popular')}
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
          <VIcon name="search" size={12} color="var(--muted)" /> {t('screen.browseAll')}
        </button>
        <button onClick={onClose} className="v-tap" style={{ background: 'transparent', border: 'none', padding: '4px 6px', fontFamily: 'Inter', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', color: 'var(--muted-2)' }}>{t('screen.cancel')}</button>
      </div>
    </div>
  );
}

export default function LearnScreen({ go, set, state }: ScreenProps) {
  const [focused, setFocused] = useState(false);
  const [q, setQ] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  const { t } = useTranslation('learn');
  const cls = api.toGrade(state?.classLevel);
  const chapters = classChapters(cls);

  const openChapter = (id: string) => {
    set && set({ chapterId: id });
    go('chapter-topics');
  };

  useEffect(() => {
    if (state?.askedConcept && set) set({ askedConcept: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- clear-once on mount; `set` is a stable parent closure
  }, []);

  const submitConcept = (raw?: string) => {
    const text = (raw ?? q).trim();
    if (!text) return;
    set && set({ askedConcept: text });
    setFocused(false);
    go('learn-concept');
  };

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)', position: 'relative' }}>
      <VTopBar transparent left={<VContextChip go={go} classLevel={state?.classLevel || 6} />} right={<VProfileChip go={go} name={state.name} />} />
      <div style={{ padding: '72px 24px 140px' }}>
        <div className="v-eyebrow" style={{ marginBottom: 8 }}>{t('screen.eyebrow')}</div>
        <h1 className="v-h1" style={{ fontSize: 36, marginBottom: 8 }}>{t('screen.title')}</h1>
        <p className="v-body" style={{ marginBottom: 18 }}>{t('screen.subtitle')}</p>

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
            placeholder={t('screen.searchPlaceholder')}
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

        <div style={{ opacity: focused ? 0.35 : 1, transition: 'opacity .2s', marginTop: 12 }}>
          <VSectionHeader title={t('screen.chapters')} action="Full syllabus" onAction={() => go('syllabus')} />
          <div className="v-card" style={{ padding: 0, overflow: 'hidden', marginBottom: 24 }}>
            {chapters.map((c, i) => (
              <div key={c.id} className="v-tap"
                onClick={() => openChapter(c.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '18px 20px', borderTop: i ? '1px solid var(--border)' : 'none' }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--indigo-air)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 14, fontWeight: 600, color: 'var(--indigo)' }}>
                  {c.num}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 17, marginBottom: 2, lineHeight: 1.2 }}>{c.title}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--muted-2)' }}>{t('screen.topicsCount', { count: c.subtopics.length })}</div>
                </div>
                <VIcon name="chevron-right" size={16} color="var(--muted-2)" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <VAskVidyaFAB context="learn" />
      <VBottomNav active="learn" go={go} />
    </div>
  );
}
