import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import VIcon from '../../prototype/icons';
import { VTopBar, VBottomNav, VProfileChip, VContextChip, VidyaAvatar } from '../../prototype/shared';
import { classChapters } from '../../content/syllabus';
import type { Subtopic, SyllabusChapter } from '../../content/syllabus';
import api from '../../api/vidya';
import { levelFor, skillKey, type MasteryLevel } from '../../lib/mastery';
import type { ScreenProps, MasteryMap } from '../../types';

// Level → dot color on topic rows ('new' stays neutral).
const LEVEL_DOT: Record<MasteryLevel, string> = {
  new: 'var(--border)', needshelp: '#B84030', improving: '#B45309', confident: 'var(--indigo)', strong: '#1A7A4A',
};

interface SelectedSubtopic {
  chapterId: string;
  section: string;
  title: string;
}

// Reads a File → raw base64 + its real mime type, for the vision endpoint.
// (Sending a mislabelled HEIC/PNG as image/jpeg makes Gemini reject the image.)
function readImageB64(file: File): Promise<{ b64: string; mime: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result);
      const mime = url.slice(5, url.indexOf(';')) || file.type || 'image/jpeg';
      resolve({ b64: url.split(',')[1] || '', mime });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function PracticeScreen({ go, state, set }: ScreenProps) {
  const { t } = useTranslation('practice');
  const [practiceTab, setPracticeTab] = useState('quiz');
  const [sel, setSel] = useState<SelectedSubtopic[]>([]);   // selected subtopics: [{ chapterId, section, title }]
  const [expanded, setExpanded] = useState<string[]>([]);   // chapter ids expanded
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);

  const cls = api.toGrade(state?.classLevel);
  const chapters = classChapters(cls);

  useEffect(() => {
    if (state?.askedTopic && set) set({ askedTopic: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- clear-once on mount; `set` is a stable parent closure
  }, []);

  // Photo → identify the concept via vision → start practice on that topic,
  // respecting the current Quiz/Exam tab.
  const onPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';   // allow re-selecting the same file
    if (files.length === 0) return;
    setUploadErr(null);
    setUploading(true);
    try {
      const read = await Promise.all(files.map(readImageB64));
      const res = await api.identifyConcept({
        images: read.map((r) => r.b64),
        mimeTypes: read.map((r) => r.mime),
        grade: cls, language: state?.language || 'English',
      });
      if (!res.detected || !res.topic.trim()) {
        setUploading(false);
        setUploadErr(res.summary || t('photoCard.errNoTopic'));
        return;
      }
      const topic = res.topic.trim();
      if (practiceTab === 'exam') {
        set && set({ examTopics: [topic], examScope: null });
        go('exam-config');
      } else {
        set && set({ practiceTopics: [topic], skillId: null });
        go('navigable-quiz');
      }
    } catch {
      setUploading(false);
      setUploadErr(t('photoCard.errGeneric'));
    }
  };

  // Subtopic-level multi-select for both quiz and exam.
  const keyOf = (chId: string, section: string) => `${chId}::${section}`;
  const isSel = (chId: string, section: string) => sel.some((s) => keyOf(s.chapterId, s.section) === keyOf(chId, section));
  // Accordion: only one chapter open at a time keeps the list short to scroll.
  const toggleExpand = (id: string) => setExpanded((e) => e.includes(id) ? [] : [id]);
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
    // Multi-topic: pass the full selection too, so each question's result can
    // be credited to its own skill in the mastery map.
    else set && set({ practiceTopics: selectedTitles(), practiceSel: sel, skillId: null });
    go('navigable-quiz');
  };
  const startExam = () => {
    // examSel carries the full selection so grading can credit each topic's skill.
    set && set({ examTopics: selectedTitles(), examScope: singleScope(), examSel: sel });
    go('exam-config');
  };

  if (uploading) {
    return (
      <div style={{ minHeight: '100%', background: 'var(--bg)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <VTopBar transparent />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, padding: 32, minHeight: '70vh' }}>
          <VidyaAvatar size={64} animated />
          <div style={{ fontFamily: 'Inter', fontSize: 14, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.5 }}>
            {t('photoCard.reading')}
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
      <div style={{ padding: `72px 22px ${sel.length ? 210 : 140}px` }}>

        <h1 className="v-h1" style={{ fontSize: 26, marginBottom: 14, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
          {t('practice.heading')}
        </h1>

        {/* Take a photo of classwork → instant practice on that topic */}
        <div
          className="v-tap"
          onClick={() => { setUploadErr(null); photoRef.current?.click(); }}
          style={{ background: '#fff', borderRadius: 20, border: '1px solid var(--border)', padding: '16px 16px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 4px 18px rgba(28,25,23,0.05)' }}>
          <div style={{ width: 46, height: 46, borderRadius: 14, background: 'var(--saffron)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <VIcon name="camera" size={21} color="#fff" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 18, fontWeight: 700, lineHeight: 1.15, color: 'var(--ink)' }}>{t('photoCard.title')}</div>
            <div style={{ fontFamily: 'Inter', fontSize: 12.5, color: 'var(--muted-2)', marginTop: 3, lineHeight: 1.35 }}>{t('photoCard.sub')}</div>
          </div>
          <VIcon name="chevron-right" size={18} color="var(--muted-2)" />
        </div>

        {uploadErr && (
          <div style={{ marginBottom: 14, borderRadius: 14, padding: '12px 14px', background: 'var(--bg-warm)', border: '1px solid var(--saffron)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <VIcon name="camera" size={15} color="var(--saffron)" />
            <div style={{ flex: 1, fontFamily: 'Inter', fontSize: 12.5, color: 'var(--ink)', lineHeight: 1.45 }}>{uploadErr}</div>
            <div className="v-tap" onClick={() => setUploadErr(null)} style={{ flexShrink: 0 }}><VIcon name="x" size={14} color="var(--muted-2)" /></div>
          </div>
        )}

        <div>
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
                      const lvl = levelFor(((state?.mastery as MasteryMap) || {})[skillKey(c.id, sub.num)]);
                      return (
                        <div key={sub.id} className="v-tap" onClick={() => toggleSub(c, sub)}
                          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 18px 11px 30px', borderTop: '1px solid var(--border-soft)', background: on ? '#FAFAFF' : '#fff' }}>
                          <span style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: 600, color: 'var(--muted-2)', minWidth: 28, fontVariantNumeric: 'tabular-nums' }}>{sub.num}</span>
                          <div style={{ flex: 1, minWidth: 0, fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 14, lineHeight: 1.25 }}>{sub.title}</div>
                          <div style={{ width: 7, height: 7, borderRadius: 9999, flexShrink: 0, background: LEVEL_DOT[lvl] || 'var(--border)' }} />
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
          </div>
        </div>
      </div>

      {/* Sticky action bar — start without scrolling to the bottom. */}
      {sel.length > 0 && (
        <div style={{
          position: 'fixed', left: 0, right: 0, bottom: 84, zIndex: 39,
          padding: '12px 22px', background: 'rgba(250,249,246,0.94)',
          backdropFilter: 'blur(24px) saturate(180%)', WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          borderTop: '1px solid var(--border-soft)',
          animation: 'vSheetUp 0.3s cubic-bezier(.16,1,.3,1) both',
        }}>
          <button className="v-btn-primary v-tap" onClick={practiceTab === 'quiz' ? startQuiz : startExam} style={{ width: '100%' }}>
            {practiceTab === 'quiz'
              ? t('practice.startQuizChapters', { count: sel.length })
              : t('practice.createExamChapters', { count: sel.length })}
            <VIcon name="arrow-right" size={14} color="#fff" />
          </button>
        </div>
      )}

      <VBottomNav active="practice" go={go} />
    </div>
  );
}
