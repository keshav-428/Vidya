import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import VIcon from '../../prototype/icons';
import { VTopBar, VBottomNav, VProfileChip, VContextChip, VSectionHeader } from '../../prototype/shared';
import { classChapters } from '../../content/syllabus';
import api from '../../api/vidya';
import { levelFor, skillKey } from '../../lib/mastery';
import type { ScreenProps, MasteryMap } from '../../types';

interface LearnLiveResultsProps {
  q: string;
  concepts: ConceptSuggestion[];
  onPick: (s: string) => void;
  onClose: () => void;
}

/** A searchable suggestion: a real topic from the student's class syllabus. */
interface ConceptSuggestion { t: string; topic: string; keys: string[]; }

function LearnLiveResults({ q, concepts, onPick, onClose }: LearnLiveResultsProps) {
  const { t } = useTranslation('learn');
  const needle = (q || '').toLowerCase().trim();
  const matches = needle
    ? concepts.filter(c => c.t.toLowerCase().includes(needle) || c.topic.toLowerCase().includes(needle) || c.keys.some(k => needle.includes(k) || k.includes(needle))).slice(0, 4)
    : concepts.slice(0, 4);
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

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '10px 14px', borderTop: '1px solid var(--border)', background: 'var(--bg)' }}>
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

  // Suggestions come from THIS class's syllabus, weakest topics first —
  // not a hardcoded list. Left unmemoized on purpose: the manual useMemo here
  // listed `chapters`, which is rebuilt every render, so its stated deps never
  // matched its real ones and the React Compiler gave up optimising the whole
  // screen rather than just this value. The compiler memoizes it correctly.
  const masteryMap = (state?.mastery as MasteryMap) || {};
  const all = chapters.flatMap((c) => c.subtopics.map((sub) => ({
    t: sub.title,
    topic: c.title,
    keys: `${sub.title} ${c.title}`.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2),
    weak: levelFor(masteryMap[skillKey(c.id, sub.num)]) === 'needshelp',
  })));
  const suggestions: ConceptSuggestion[] = [...all.filter((x) => x.weak), ...all.filter((x) => !x.weak)];

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
    // A typed doubt is its own focus — answer the question, don't lecture.
    set && set({ askedConcept: text, askedFocus: text, askedChapterId: null, askedSection: null });
    setFocused(false);
    go('learn-concept');
  };

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)', position: 'relative' }}>
      <VTopBar transparent left={<VContextChip go={go} classLevel={state?.classLevel || 6} />} right={<VProfileChip go={go} name={state.name} />} />
      <div style={{ padding: '72px 24px 140px' }}>
        <h1 className="v-h1" style={{ fontSize: 36, marginBottom: 18 }}>{t('screen.title')}</h1>

        {/* Ask a question — always-visible search/chat field */}
        <div style={{ background: '#fff', borderRadius: 18, border: `1.5px solid ${focused ? 'var(--indigo)' : 'var(--border)'}`, padding: '14px 14px 14px 16px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10, boxShadow: focused ? '0 4px 18px rgba(56,72,168,0.10)' : '0 4px 18px rgba(28,25,23,0.05)', transition: 'border-color .15s, box-shadow .15s' }}>
          <VIcon name="search" size={18} color={focused ? 'var(--indigo)' : 'var(--muted-2)'} />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => setFocused(true)}
            onKeyDown={(e) => { if (e.key === 'Enter') submitConcept(); }}
            placeholder={t('screen.searchPlaceholder')}
            style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 15, color: 'var(--ink)', lineHeight: 1.3, padding: 0 }} />
          <button
            onClick={() => { if (q.trim()) submitConcept(); else inputRef.current?.focus(); }}
            style={{ background: 'var(--indigo)', opacity: q.trim() ? 1 : 0.35, border: 'none', width: 36, height: 36, borderRadius: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'opacity .15s', flexShrink: 0 }}
            aria-label="Send">
            <VIcon name="send" size={14} color="#fff" />
          </button>
        </div>

        {focused && (
          <LearnLiveResults
            q={q}
            concepts={suggestions}
            onPick={(s) => submitConcept(s)}
            onClose={() => { setFocused(false); setQ(''); }} />
        )}

        {/* The photo card used to live here too. There is now one camera, on
            Home, which asks what to do with the page after reading it. */}

        <div style={{ opacity: focused ? 0.35 : 1, transition: 'opacity .2s', marginTop: 12 }}>
          <VSectionHeader title={t('screen.chapters')} />
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
      <VBottomNav active="learn" go={go} />
    </div>
  );
}
