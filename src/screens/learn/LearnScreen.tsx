import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import VIcon from '../../prototype/icons';
import { VTopBar, VBottomNav, VProfileChip, VContextChip, VSectionHeader, VidyaAvatar } from '../../prototype/shared';
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

// Reads a File → raw base64 (no data: prefix), for the vision endpoint.
function readImageB64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function LearnScreen({ go, set, state }: ScreenProps) {
  const [focused, setFocused] = useState(false);
  const [q, setQ] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const photoRef = useRef<HTMLInputElement | null>(null);

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

  // Photo → identify the concept via vision → open a full lesson on it.
  const onPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';   // allow re-selecting the same file
    if (files.length === 0) return;
    setUploadErr(null);
    setUploading(true);
    try {
      const images = await Promise.all(files.map(readImageB64));
      const res = await api.identifyConcept({ images, grade: cls, language: state?.language || 'English' });
      if (!res.detected || !res.topic.trim()) {
        setUploading(false);
        setUploadErr(res.summary || "Couldn't spot a maths topic in that photo. Try a clearer shot of your notes.");
        return;
      }
      set && set({ askedConcept: res.topic.trim() });
      go('learn-concept');
    } catch {
      setUploading(false);
      setUploadErr('Something went wrong reading that photo. Please try again.');
    }
  };

  if (uploading) {
    return (
      <div style={{ minHeight: '100%', background: 'var(--bg)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <VTopBar transparent />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, padding: 32, minHeight: '70vh' }}>
          <VidyaAvatar size={64} animated />
          <div style={{ fontFamily: 'Inter', fontSize: 14, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.5 }}>
            Reading your notes and finding the concept…
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)', position: 'relative' }}>
      <VTopBar transparent left={<VContextChip go={go} classLevel={state?.classLevel || 6} />} right={<VProfileChip go={go} name={state.name} />} />
      <input ref={photoRef} type="file" accept="image/*" capture="environment" multiple
        onChange={onPhotos} style={{ display: 'none' }} />
      <div style={{ padding: '72px 24px 140px' }}>
        <h1 className="v-h1" style={{ fontSize: 36, marginBottom: 18 }}>{t('screen.title')}</h1>

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
            onClick={(e) => { e.stopPropagation(); setUploadErr(null); photoRef.current?.click(); }}
            style={{ background: 'var(--saffron)', border: 'none', width: 32, height: 32, borderRadius: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(248,128,18,0.35)' }}
            aria-label="Snap your notes">
            <VIcon name="camera" size={15} color="#fff" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); if (q.trim()) submitConcept(); else { setFocused(true); setTimeout(() => inputRef.current && inputRef.current.focus(), 0); } }}
            style={{ background: 'var(--ink)', opacity: q.trim() ? 1 : 0.35, border: 'none', width: 32, height: 32, borderRadius: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'opacity .15s' }}
            aria-label="Send">
            <VIcon name="send" size={13} color="#fff" />
          </button>
        </div>

        {/* Photo-upload highlight — compact, tappable, hard to miss. */}
        {!focused && (
          <div
            className="v-tap"
            onClick={() => { setUploadErr(null); photoRef.current?.click(); }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginBottom: 14, padding: '6px 12px 6px 8px', borderRadius: 9999, background: '#FFF3EA', border: '1px solid var(--saffron)' }}>
            <div style={{ width: 20, height: 20, borderRadius: 9999, background: 'var(--saffron)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <VIcon name="camera" size={11} color="#fff" />
            </div>
            <span style={{ fontFamily: 'Inter', fontSize: 12, fontWeight: 700, color: '#C2410C', letterSpacing: '0.01em' }}>
              Take a photo of your classwork to learn it
            </span>
          </div>
        )}

        {uploadErr && !focused && (
          <div style={{ marginBottom: 12, borderRadius: 14, padding: '11px 14px', background: '#FFF7ED', border: '1px solid var(--accent-warn)', display: 'flex', alignItems: 'flex-start', gap: 9 }}>
            <VIcon name="camera" size={14} color="#B45309" />
            <div style={{ flex: 1, fontFamily: 'Inter', fontSize: 12, color: '#B45309', lineHeight: 1.45 }}>{uploadErr}</div>
            <div className="v-tap" onClick={() => setUploadErr(null)} style={{ color: '#B45309', flexShrink: 0 }}><VIcon name="x" size={13} color="#B45309" /></div>
          </div>
        )}

        {focused && (
          <LearnLiveResults
            q={q}
            onPick={(s) => submitConcept(s)}
            onClose={() => { setFocused(false); setQ(''); }}
            onBrowse={() => go('concept-library')} />
        )}

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
