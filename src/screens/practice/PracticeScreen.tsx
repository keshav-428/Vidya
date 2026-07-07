import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import VIcon from '../../prototype/icons';
import { VTopBar, VBottomNav, VProfileChip, VContextChip, VidyaAvatar } from '../../prototype/shared';
import { CHAPTERS } from '../../content/chapters';
import { classChapters } from '../../content/syllabus';
import type { Subtopic, SyllabusChapter } from '../../content/syllabus';
import api from '../../api/vidya';
import type { ScreenProps } from '../../types';

interface ConceptSuggestion {
  t: string;
  topic: string;
  keys: string[];
}

// Search suggestions are the real NCERT chapters.
const CONCEPTS: ConceptSuggestion[] = CHAPTERS.map((c) => ({
  t: c.title, topic: c.sub,
  keys: [c.title.toLowerCase(), ...c.sub.toLowerCase().split(/[ &]+/)],
}));

interface AskLiveResultsProps {
  q: string;
  intent: 'exam' | 'learn' | null;
  onPick: (q: string) => void;
  onClose: () => void;
  onBrowse: () => void;
}

function AskLiveResults({ q, intent, onPick, onClose, onBrowse }: AskLiveResultsProps) {
  const { t } = useTranslation(['practice', 'common']);
  const needle = (q || '').toLowerCase().trim();
  const matches = needle
    ? CONCEPTS.filter(c =>
      c.t.toLowerCase().includes(needle) ||
      c.topic.toLowerCase().includes(needle) ||
      c.keys.some(k => needle.includes(k) || k.includes(needle))
    ).slice(0, 4)
    : [];

  const hasQuery = needle.length > 0;
  const examLike = intent === 'exam';

  return (
    <div className="v-enter-fade" style={{
      background: '#fff', border: '1px solid var(--border)', borderRadius: 18,
      marginBottom: 14, marginTop: -2,
      boxShadow: '0 8px 24px rgba(28,25,23,0.06)',
      overflow: 'hidden',
    }}>
      <div className="v-tap" onClick={() => onPick(q)} style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 16px',
        background: hasQuery ? (examLike ? 'var(--bg-warm)' : '#FAFAF7') : '#fff',
        borderBottom: '1px solid var(--border)',
        opacity: hasQuery ? 1 : 0.5,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 9999,
          background: examLike ? 'var(--saffron)' : 'var(--ink)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <VIcon name={examLike ? 'edit' : 'sparkles'} size={14} color="#fff" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 15, lineHeight: 1.25,
            letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {hasQuery
              ? (examLike ? t('practice.askMakeSet', { query: q.trim() }) : t('practice.askVidya', { query: q.trim() }))
              : t('practice.typeToStart')}
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted-2)', marginTop: 2 }}>
            {hasQuery
              ? (examLike ? t('practice.examConfigHint') : t('practice.studioHint'))
              : t('practice.exampleHint')}
          </div>
        </div>
        {hasQuery && <VIcon name="arrow-right" size={14} color="var(--muted-2)" />}
      </div>

      {matches.length > 0 && (
        <div>
          <div className="v-eyebrow" style={{ padding: '12px 16px 6px', color: 'var(--muted-2)', fontSize: 9 }}>{t('practice.matchingConcepts')}</div>
          {matches.map((m, i) => (
            <div key={m.t} className="v-tap" onClick={() => onPick(m.t)} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
              borderTop: i ? '1px solid var(--border-soft)' : 'none',
            }}>
              <VIcon name="book" size={15} color="var(--muted-2)" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 14, lineHeight: 1.2 }}>{m.t}</div>
                <div style={{ fontSize: 10.5, color: 'var(--muted-2)', marginTop: 1 }}>{m.topic}</div>
              </div>
              <VIcon name="chevron-right" size={14} color="var(--muted-2)" />
            </div>
          ))}
        </div>
      )}

      {hasQuery && matches.length === 0 && (
        <div style={{ padding: '12px 16px', fontSize: 12, color: 'var(--muted-2)', fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif" }}>
          {t('practice.noSavedConcepts')}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderTop: '1px solid var(--border)', background: 'var(--bg)' }}>
        <button onClick={onBrowse} className="v-tap" style={{ background: 'transparent', border: 'none', padding: '4px 6px', fontFamily: 'Inter', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
          <VIcon name="search" size={12} color="var(--muted)" /> {t('practice.browseAll')}
        </button>
        <button onClick={onClose} className="v-tap" style={{ background: 'transparent', border: 'none', padding: '4px 6px', fontFamily: 'Inter', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', color: 'var(--muted-2)' }}>
          {t('practice.cancel')}
        </button>
      </div>
    </div>
  );
}

interface SelectedSubtopic {
  chapterId: string;
  section: string;
  title: string;
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

export default function PracticeScreen({ go, state, set }: ScreenProps) {
  const { t } = useTranslation('practice');
  const [focused, setFocused] = useState(false);
  const [q, setQ] = useState('');
  const [practiceTab, setPracticeTab] = useState('quiz');
  const [sel, setSel] = useState<SelectedSubtopic[]>([]);   // selected subtopics: [{ chapterId, section, title }]
  const [expanded, setExpanded] = useState<string[]>([]);   // chapter ids expanded
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);

  const cls = api.toGrade(state?.classLevel);
  const chapters = classChapters(cls);

  useEffect(() => {
    if (state?.askedTopic && set) set({ askedTopic: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- clear-once on mount; `set` is a stable parent closure
  }, []);

  const intentOf = (txt: string): 'exam' | 'learn' | null => {
    const s = (txt || '').toLowerCase().trim();
    if (!s) return null;
    if (/^(test|quiz|practice|give me|question|questions)\b/.test(s)) return 'exam';
    if (/(test me|quiz me|practice .* problems|practice questions)/.test(s)) return 'exam';
    return 'learn';
  };

  const submit = (raw?: string) => {
    const text = (raw ?? q).trim();
    if (!text) return;
    set && set({ askedTopic: text });
    const dest = intentOf(text) === 'exam' ? 'exam-config' : 'learning-studio';
    setFocused(false);
    go(dest);
  };

  // Photo → identify the concept via vision → practice on that topic.
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
      submit(res.topic.trim());
    } catch {
      setUploading(false);
      setUploadErr('Something went wrong reading that photo. Please try again.');
    }
  };

  const suggestions = CHAPTERS.slice(0, 5).map((c) => c.title);

  // Subtopic-level multi-select for both quiz and exam.
  const keyOf = (chId: string, section: string) => `${chId}::${section}`;
  const isSel = (chId: string, section: string) => sel.some((s) => keyOf(s.chapterId, s.section) === keyOf(chId, section));
  const toggleExpand = (id: string) => setExpanded((e) => e.includes(id) ? e.filter((x) => x !== id) : [...e, id]);
  const toggleSub = (ch: SyllabusChapter, sub: Subtopic) => setSel((s) => {
    const k = keyOf(ch.id, sub.num);
    return s.some((x) => keyOf(x.chapterId, x.section) === k)
      ? s.filter((x) => keyOf(x.chapterId, x.section) !== k)
      : [...s, { chapterId: ch.id, section: sub.num, title: sub.title }];
  });
  const chapterSelCount = (ch: SyllabusChapter) => ch.subtopics.filter((sub) => isSel(ch.id, sub.num)).length;
  const toggleChapterAll = (ch: SyllabusChapter) => setSel((s) => {
    const all = ch.subtopics.every((sub) => isSel(ch.id, sub.num));
    const without = s.filter((x) => x.chapterId !== ch.id);
    return all ? without : [...without, ...ch.subtopics.map((sub) => ({ chapterId: ch.id, section: sub.num, title: sub.title }))];
  });

  const selectedTitles = () => sel.map((s) => s.title);
  // A single selected subtopic → hard-scoped retrieval (chapterId + section).
  const singleScope = () => (sel.length === 1 ? { chapterId: sel[0].chapterId, section: sel[0].section } : null);

  const startQuiz = () => {
    const scope = singleScope();
    if (scope) set && set({ quizScope: { ...scope, topic: sel[0].title }, skillId: null });
    else set && set({ practiceTopics: selectedTitles(), skillId: null });
    go('navigable-quiz');
  };
  const startExam = () => {
    set && set({ examTopics: selectedTitles(), examScope: singleScope() });
    go('exam-config');
  };

  if (uploading) {
    return (
      <div style={{ minHeight: '100%', background: 'var(--bg)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <VTopBar transparent />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, padding: 32, minHeight: '70vh' }}>
          <VidyaAvatar size={64} animated />
          <div style={{ fontFamily: 'Inter', fontSize: 14, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.5 }}>
            Reading your notes and finding the topic…
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)', position: 'relative' }}>
      <VTopBar transparent left={<VContextChip go={go} classLevel={state?.classLevel || 6} />} right={<VProfileChip go={go} name={state?.name} />} />
      <input ref={photoRef} type="file" accept="image/*" capture="environment" multiple
        onChange={onPhotos} style={{ display: 'none' }} />
      <div style={{ padding: '72px 22px 140px' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <VidyaAvatar size={36} status={false} />
          <div className="v-eyebrow" style={{ color: 'var(--muted-2)' }}>
            {t('practice.forYou', { name: ((state?.name) || t('practice.you')).toUpperCase() })}
          </div>
        </div>

        <h1 className="v-h1" style={{ fontSize: 26, marginBottom: 14, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
          {t('practice.heading')}
        </h1>

        <div
          className="v-tap"
          onClick={() => { setFocused(true); setTimeout(() => inputRef.current && inputRef.current.focus(), 0); }}
          style={{
            background: '#fff', borderRadius: 18, border: '1.5px solid var(--ink)',
            padding: '12px 14px 12px 16px', marginBottom: 12,
            display: 'flex', alignItems: 'center', gap: 10,
            boxShadow: '0 4px 18px rgba(28,25,23,0.06)',
          }}>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => { setQ(e.target.value); if (!focused) setFocused(true); }}
            onFocus={() => setFocused(true)}
            onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
            placeholder={t('practice.askPlaceholder')}
            style={{
              flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent',
              fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontStyle: q ? 'normal' : 'italic',
              fontSize: 14, color: 'var(--ink)', lineHeight: 1.3, padding: 0,
            }} />
          <button onClick={(e) => { e.stopPropagation(); setUploadErr(null); photoRef.current?.click(); }} style={{ background: 'var(--saffron)', border: 'none', width: 32, height: 32, borderRadius: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(248,128,18,0.35)' }} aria-label="Snap your notes">
            <VIcon name="camera" size={15} color="#fff" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (q.trim()) submit();
              else { setFocused(true); setTimeout(() => inputRef.current && inputRef.current.focus(), 0); }
            }}
            style={{
              background: 'var(--ink)', opacity: !q.trim() ? 0.35 : 1,
              border: 'none', width: 32, height: 32, borderRadius: 9999,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'opacity .15s',
            }}>
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
              Take a photo of your classwork to practice it
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
          <AskLiveResults
            q={q}
            intent={intentOf(q)}
            onPick={(s) => submit(s)}
            onClose={() => { setFocused(false); setQ(''); }}
            onBrowse={() => go('concept-library')} />
        )}

        <div style={{
          display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 22,
          marginLeft: -22, marginRight: -22, padding: '2px 22px 6px',
          opacity: focused ? 0.35 : 1, transition: 'opacity .2s',
        }}>
          {suggestions.map(s => (
            <div key={s} className="v-tap" onClick={() => submit(s)} style={{
              flexShrink: 0, background: '#fff', border: '1px solid var(--border)', borderRadius: 9999,
              padding: '6px 12px', fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 12,
              color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <VIcon name="sparkles" size={10} color="var(--indigo)" /> {s}
            </div>
          ))}
        </div>

        <div style={{ opacity: focused ? 0.35 : 1, transition: 'opacity .2s' }}>
          <div style={{
            display: 'flex', gap: 6, padding: 4, marginBottom: 18,
            background: '#fff', borderRadius: 9999, border: '1px solid var(--border)',
          }}>
            {[{ id: 'quiz', label: t('practice.quizLabel'), sub: t('practice.quizSub') }, { id: 'exam', label: t('practice.examLabel'), sub: t('practice.examSub') }].map(seg => {
              const isActive = practiceTab === seg.id;
              return (
                <div key={seg.id} className="v-tap" onClick={() => setPracticeTab(seg.id)} style={{
                  flex: 1, textAlign: 'center', padding: '10px 12px', borderRadius: 9999,
                  background: isActive ? 'var(--ink)' : 'transparent',
                  color: isActive ? '#fff' : 'var(--ink)',
                  transition: 'background .15s, color .15s',
                }}>
                  <div style={{ fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.1 }}>{seg.label}</div>
                  <div style={{ fontSize: 10, marginTop: 2, letterSpacing: '0.04em', color: isActive ? 'rgba(255,255,255,0.65)' : 'var(--muted-2)' }}>{seg.sub}</div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', paddingBottom: 10, borderBottom: '1px solid var(--ink)', marginBottom: 14 }}>
            <div style={{ fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 18 }}>
              {t('practice.pickTopics')}
            </div>
            <div style={{ fontFamily: 'Inter', fontSize: 9, letterSpacing: '0.14em', color: 'var(--muted-2)' }}>
              {practiceTab === 'quiz' ? t('practice.tenQuestions') : t('practice.fullPaper')}
            </div>
          </div>

          <div>
            <div className="v-card" style={{ padding: 0, overflow: 'hidden', marginBottom: 16 }}>
              {chapters.map((c, i) => {
                const isOpen = expanded.includes(c.id);
                const selCount = chapterSelCount(c);
                const allSel = selCount === c.subtopics.length && selCount > 0;
                return (
                  <div key={c.id} style={{ borderTop: i ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: selCount ? 'var(--indigo-air)' : '#fff' }}>
                      <div className="v-tap" onClick={() => toggleExpand(c.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                        <div style={{ width: 24, height: 24, borderRadius: 7, background: 'var(--indigo-air)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 12, fontWeight: 600, color: 'var(--indigo)' }}>{c.num}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 15, lineHeight: 1.2 }}>{c.title}</div>
                          <div style={{ fontSize: 11, color: 'var(--muted-2)', marginTop: 1 }}>{selCount ? t('practice.subtopicsSelected', { count: selCount, total: c.subtopics.length }) : t('practice.topicsCount', { count: c.subtopics.length })}</div>
                        </div>
                        <VIcon name={isOpen ? 'chevron-down' : 'chevron-right'} size={16} color="var(--muted-2)" />
                      </div>
                      <div className="v-tap" onClick={() => toggleChapterAll(c)} title={t('practice.selectAll')} style={{ width: 22, height: 22, borderRadius: 7, flexShrink: 0, border: allSel ? 'none' : '1.5px solid var(--border)', background: allSel ? 'var(--indigo)' : (selCount ? 'var(--indigo-soft)' : 'transparent'), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {allSel && <VIcon name="check" size={12} color="#fff" strokeWidth={2.5} />}
                      </div>
                    </div>
                    {isOpen && c.subtopics.map((sub) => {
                      const on = isSel(c.id, sub.num);
                      return (
                        <div key={sub.id} className="v-tap" onClick={() => toggleSub(c, sub)}
                          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 18px 11px 30px', borderTop: '1px solid var(--border-soft)', background: on ? '#FAFAFF' : '#fff' }}>
                          <span style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: 600, color: 'var(--muted-2)', minWidth: 28, fontVariantNumeric: 'tabular-nums' }}>{sub.num}</span>
                          <div style={{ flex: 1, minWidth: 0, fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 14, lineHeight: 1.25 }}>{sub.title}</div>
                          <div style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, border: on ? 'none' : '1.5px solid var(--border)', background: on ? 'var(--indigo)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {on && <VIcon name="check" size={11} color="#fff" strokeWidth={2.5} />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            <button className="v-btn-primary v-tap" onClick={practiceTab === 'quiz' ? startQuiz : startExam}
              disabled={!sel.length} style={{ opacity: sel.length ? 1 : 0.4 }}>
              {practiceTab === 'quiz'
                ? (sel.length ? t('practice.startQuizChapters', { count: sel.length }) : t('practice.startQuiz'))
                : (sel.length ? t('practice.createExamChapters', { count: sel.length }) : t('practice.createExam'))}
              <VIcon name="arrow-right" size={14} color="#fff" />
            </button>
          </div>
        </div>
      </div>
      <VBottomNav active="practice" go={go} />
    </div>
  );
}
