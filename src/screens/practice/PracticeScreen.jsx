import React, { useState, useEffect, useRef } from 'react';
import VIcon from '../../prototype/icons';
import { VTopBar, VBottomNav, VAskVidyaFAB, VProfileChip, VidyaAvatar } from '../../prototype/shared';
import { CHAPTERS } from '../../content/chapters';

// Search suggestions are the real NCERT chapters.
const CONCEPTS = CHAPTERS.map((c) => ({
  t: c.title, topic: c.sub,
  keys: [c.title.toLowerCase(), ...c.sub.toLowerCase().split(/[ &]+/)],
}));

function AskLiveResults({ q, intent, onPick, onClose, onBrowse }) {
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
            fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 15, lineHeight: 1.25,
            letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {hasQuery
              ? (examLike ? `Make a practice set on "${q.trim()}"` : `Ask Vidya: "${q.trim()}"`)
              : 'Type a question to get started'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted-2)', marginTop: 2 }}>
            {hasQuery
              ? (examLike ? '→ Exam config · pick length & level' : '→ Learning studio · explanation + example')
              : 'e.g. how do I add 1/3 + 1/4?'}
          </div>
        </div>
        {hasQuery && <VIcon name="arrow-right" size={14} color="var(--muted-2)" />}
      </div>

      {matches.length > 0 && (
        <div>
          <div className="v-eyebrow" style={{ padding: '12px 16px 6px', color: 'var(--muted-2)', fontSize: 9 }}>MATCHING CONCEPTS</div>
          {matches.map((m, i) => (
            <div key={m.t} className="v-tap" onClick={() => onPick(m.t)} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
              borderTop: i ? '1px solid var(--border-soft)' : 'none',
            }}>
              <VIcon name="book" size={15} color="var(--muted-2)" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 14, lineHeight: 1.2 }}>{m.t}</div>
                <div style={{ fontSize: 10.5, color: 'var(--muted-2)', marginTop: 1 }}>{m.topic}</div>
              </div>
              <VIcon name="chevron-right" size={14} color="var(--muted-2)" />
            </div>
          ))}
        </div>
      )}

      {hasQuery && matches.length === 0 && (
        <div style={{ padding: '12px 16px', fontSize: 12, color: 'var(--muted-2)', fontFamily: "'Quicksand','Nunito',system-ui,sans-serif" }}>
          No saved concepts match — Vidya will answer fresh.
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderTop: '1px solid var(--border)', background: 'var(--bg)' }}>
        <button onClick={onBrowse} className="v-tap" style={{ background: 'transparent', border: 'none', padding: '4px 6px', fontFamily: 'Inter', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
          <VIcon name="search" size={12} color="var(--muted)" /> Browse all concepts
        </button>
        <button onClick={onClose} className="v-tap" style={{ background: 'transparent', border: 'none', padding: '4px 6px', fontFamily: 'Inter', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', color: 'var(--muted-2)' }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function PracticeScreen({ go, state, set }) {
  const [focused, setFocused] = useState(false);
  const [q, setQ] = useState('');
  const [practiceTab, setPracticeTab] = useState('quiz');
  const [sel, setSel] = useState([]);   // chapter ids selected (for quiz or exam)
  const inputRef = useRef(null);

  useEffect(() => {
    if (state?.askedTopic && set) set({ askedTopic: null });
  }, []);

  const intentOf = (txt) => {
    const t = (txt || '').toLowerCase().trim();
    if (!t) return null;
    if (/^(test|quiz|practice|give me|question|questions)\b/.test(t)) return 'exam';
    if (/(test me|quiz me|practice .* problems|practice questions)/.test(t)) return 'exam';
    return 'learn';
  };

  const submit = (raw) => {
    const text = (raw ?? q).trim();
    if (!text) return;
    set && set({ askedTopic: text });
    const dest = intentOf(text) === 'exam' ? 'exam-config' : 'learning-studio';
    setFocused(false);
    go(dest);
  };

  const suggestions = CHAPTERS.slice(0, 5).map((c) => c.title);

  // Multi-select chapters for both quiz and exam.
  const toggle = (id) => setSel((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  const selectedTitles = () => CHAPTERS.filter((c) => sel.includes(c.id)).map((c) => c.title);

  const startQuiz = () => {
    set && set({ practiceTopics: selectedTitles(), skillId: null });
    go('navigable-quiz');
  };
  const startExam = () => {
    set && set({ examTopics: selectedTitles() });
    go('exam-config');
  };

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)', position: 'relative' }}>
      <VTopBar transparent right={<VProfileChip go={go} name={state?.name} />} />
      <div style={{ padding: '72px 22px 140px' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <VidyaAvatar size={36} status={false} />
          <div className="v-eyebrow" style={{ color: 'var(--muted-2)' }}>
            VIDYA · FOR {((state?.name) || 'YOU').toUpperCase()}
          </div>
        </div>

        <h1 className="v-h1" style={{ fontSize: 26, marginBottom: 14, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
          What do you want to practice?
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
            placeholder="Ask in your own words…"
            style={{
              flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent',
              fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontStyle: q ? 'normal' : 'italic',
              fontSize: 14, color: 'var(--ink)', lineHeight: 1.3, padding: 0,
            }} />
          <button onClick={(e) => { e.stopPropagation(); }} style={{ background: 'transparent', border: 'none', padding: 4, display: 'flex' }}>
            <VIcon name="camera" size={16} color="var(--muted)" />
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
              padding: '6px 12px', fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 12,
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
            {[{ id: 'quiz', label: 'Quiz', sub: 'short & focused' }, { id: 'exam', label: 'Exam', sub: 'full paper' }].map(seg => {
              const isActive = practiceTab === seg.id;
              return (
                <div key={seg.id} className="v-tap" onClick={() => setPracticeTab(seg.id)} style={{
                  flex: 1, textAlign: 'center', padding: '10px 12px', borderRadius: 9999,
                  background: isActive ? 'var(--ink)' : 'transparent',
                  color: isActive ? '#fff' : 'var(--ink)',
                  transition: 'background .15s, color .15s',
                }}>
                  <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.1 }}>{seg.label}</div>
                  <div style={{ fontSize: 10, marginTop: 2, letterSpacing: '0.04em', color: isActive ? 'rgba(255,255,255,0.65)' : 'var(--muted-2)' }}>{seg.sub}</div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', paddingBottom: 10, borderBottom: '1px solid var(--ink)', marginBottom: 14 }}>
            <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 18 }}>
              Pick chapters
            </div>
            <div style={{ fontFamily: 'Inter', fontSize: 9, letterSpacing: '0.14em', color: 'var(--muted-2)' }}>
              {practiceTab === 'quiz' ? '10 QUESTIONS' : 'FULL PAPER'}
            </div>
          </div>

          <div>
            <div className="v-card" style={{ padding: 0, overflow: 'hidden', marginBottom: 16 }}>
              {CHAPTERS.map((c, i) => {
                const selected = sel.includes(c.id);
                return (
                  <div key={c.id} className="v-tap"
                    onClick={() => toggle(c.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderTop: i ? '1px solid var(--border)' : 'none', background: selected ? 'var(--indigo-air)' : '#fff' }}>
                    <div style={{ width: 30, height: 30, borderRadius: 9, background: selected ? 'var(--indigo)' : 'var(--indigo-air)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <VIcon name="target" size={14} color={selected ? '#fff' : 'var(--indigo)'} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 16, lineHeight: 1.2 }}>{c.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted-2)', marginTop: 1 }}>{c.sub}</div>
                    </div>
                    <div style={{ width: 22, height: 22, borderRadius: 7, flexShrink: 0, border: selected ? 'none' : '1.5px solid var(--border)', background: selected ? 'var(--indigo)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {selected && <VIcon name="check" size={12} color="#fff" strokeWidth={2.5} />}
                    </div>
                  </div>
                );
              })}
            </div>

            <button className="v-btn-primary v-tap" onClick={practiceTab === 'quiz' ? startQuiz : startExam}
              disabled={!sel.length} style={{ opacity: sel.length ? 1 : 0.4 }}>
              {practiceTab === 'quiz'
                ? `Start quiz${sel.length ? ` (${sel.length} chapter${sel.length > 1 ? 's' : ''})` : ''}`
                : `Create exam paper${sel.length ? ` (${sel.length} chapter${sel.length > 1 ? 's' : ''})` : ''}`}
              <VIcon name="arrow-right" size={14} color="#fff" />
            </button>
          </div>
        </div>
      </div>
      <VAskVidyaFAB context="practice" />
      <VBottomNav active="practice" go={go} />
    </div>
  );
}
