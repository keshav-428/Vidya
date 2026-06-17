import React, { useState, useEffect, useRef } from 'react';
import VIcon from '../../prototype/icons';
import { VTopBar, VidyaAvatar } from '../../prototype/shared';
import { getChapterSkills } from '../../content/fractionsChapter';
import { renderCard } from '../../content/conceptVisuals';
import api from '../../api/vidya';

// Build the card array for an LLM-generated topic. Video + real-life cards
// fetch their own content by topic (see conceptVisuals).
function buildCards(topicTitle, concept) {
  const cards = [];
  if (concept?.definition) {
    cards.push({ type: 'definition', eyebrow: 'WHAT IS IT', heading: topicTitle, body: concept.definition });
  }
  if (Array.isArray(concept?.mistakes) && concept.mistakes.length) {
    cards.push({ type: 'mistakes', eyebrow: 'COMMON MISTAKES', heading: 'Mistakes to avoid', items: concept.mistakes });
  }
  if (Array.isArray(concept?.examples) && concept.examples.length) {
    cards.push({ type: 'examples', eyebrow: 'SOLVED EXAMPLES', heading: 'Worked examples', examples: concept.examples });
  }
  cards.push({ type: 'realLife', eyebrow: 'WHERE IT APPEARS', heading: `${topicTitle} in real life`, scenes: [] });
  cards.push({ type: 'videos', eyebrow: 'WATCH & LEARN', heading: 'Videos on this topic', videos: [] });
  return cards;
}

function CoachHint({ text, cta, onDismiss }) {
  return (
    <div style={{
      position: 'fixed', bottom: 24, left: 14, right: 14, zIndex: 60,
      background: 'var(--ink)', borderRadius: 20, padding: '13px 14px',
      boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', gap: 11,
      animation: 'vSheetUp 0.4s cubic-bezier(.16,1,.3,1) both',
    }}>
      <VidyaAvatar size={36} />
      <div style={{ flex: 1, minWidth: 0, fontFamily: 'Inter', fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{text}</div>
      <button className="v-tap" onClick={onDismiss} style={{
        background: 'var(--saffron)', border: 'none', borderRadius: 999,
        padding: '7px 13px', fontFamily: 'Inter', fontSize: 11, fontWeight: 700,
        color: '#fff', cursor: 'default', flexShrink: 0,
      }}>{cta}</button>
    </div>
  );
}

export default function ConceptScreen({ go, set, state }) {
  // One-shot free-text concept (or chapter) asked from the Learn tab.
  // Captured once so it survives being cleared from global state below.
  const askedConcept = useRef(state?.askedConcept || null).current;
  const fromLearn = !!askedConcept;   // came from the Learn tab (browse/ask), not a session
  useEffect(() => {
    if (state?.askedConcept && set) set({ askedConcept: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Priority: asked concept → a fractions sub-skill (rich authored) → session chapter.
  const staticSkill = (!askedConcept && state?.skillId)
    ? getChapterSkills().find((s) => s.id === state.skillId)
    : null;
  const topicTitle = askedConcept || (staticSkill ? staticSkill.title : api.topicTitle(state?.planTopicId));
  const grade = api.toGrade(state?.classLevel);

  // cards: null = loading; otherwise the array to render.
  const [cards, setCards] = useState(staticSkill ? staticSkill.cards : null);
  const [idx, setIdx] = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (staticSkill) return;   // already have rich content
    let alive = true;
    api.generateConcept({ topic: topicTitle, grade, language: state?.language || 'English' })
      .then((concept) => { if (alive) setCards(buildCards(topicTitle, concept)); })
      .catch(() => { if (alive) setCards(buildCards(topicTitle, {})); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicTitle, grade]);

  if (!cards) {
    return (
      <div style={{ minHeight: '100%', background: 'var(--bg)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <VTopBar showBack onBack={() => go(fromLearn ? 'learn' : 'home')} title={topicTitle} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, padding: 32 }}>
          <VidyaAvatar size={64} />
          <span className="v-spin" style={{ width: 22, height: 22, border: '2.5px solid var(--border)', borderTopColor: 'var(--indigo)', borderRadius: '50%' }} />
          <div style={{ fontFamily: 'Inter', fontSize: 14, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.5 }}>
            Vidya is preparing your lesson<br />on {topicTitle}…
          </div>
        </div>
      </div>
    );
  }

  const total = cards.length;
  const card = cards[idx];
  const isLast = idx === total - 1;
  const pct = ((idx + 1) / total) * 100;

  const advance = () => {
    // From Learn, finishing the lesson returns to Learn (no session quiz).
    if (isLast) { go(fromLearn ? 'learn' : 'navigable-quiz'); return; }
    setExiting(true);
    setTimeout(() => { setIdx(i => i + 1); setExiting(false); }, 160);
  };

  const back = () => {
    if (idx === 0) { go(fromLearn ? 'learn' : 'home'); return; }
    setExiting(true);
    setTimeout(() => { setIdx(i => i - 1); setExiting(false); }, 160);
  };

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <VTopBar showBack onBack={back} title={`${idx + 1} / ${total}`} />

      {state?.coachStep === 2 && (
        <CoachHint
          text="Read through each card carefully. No rush — there's no timer here."
          cta="Got it →"
          onDismiss={() => set({ coachStep: 3 })}
        />
      )}

      <div style={{ padding: '56px 0 0', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* progress bar */}
        <div style={{ height: 3, background: 'var(--border-soft)', margin: '0 24px 24px' }}>
          <div style={{ height: 3, borderRadius: 9999, background: 'var(--indigo)', width: `${pct}%`, transition: 'width .35s ease' }} />
        </div>

        <div style={{
          flex: 1, padding: '0 24px 24px',
          display: 'flex', flexDirection: 'column',
          animation: exiting ? 'none' : 'vCardSlide 240ms cubic-bezier(.16,1,.3,1) both',
        }}>
          <div style={{ fontFamily: 'Inter', fontSize: 10, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: 10 }}>
            {card.eyebrow}
          </div>
          <h2 style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontWeight: 800, fontSize: 26, lineHeight: 1.2, letterSpacing: '-0.02em', marginBottom: 18 }}>
            {card.heading}
          </h2>

          <div style={{ flex: 1 }}>
            {renderCard(card, topicTitle)}
          </div>

          <div style={{ paddingTop: 24 }}>
            <button className="v-btn-primary v-tap" style={{ width: '100%' }} onClick={advance}>
              {isLast ? (fromLearn ? 'Done' : 'Start quiz') : 'Continue'} <VIcon name="arrow-right" size={14} color="#fff" />
            </button>
            {idx > 0 && (
              <button className="v-tap" onClick={back} style={{ background: 'transparent', border: 'none', width: '100%', padding: '14px 0 0', fontFamily: 'Inter', fontSize: 13, color: 'var(--muted-2)', fontWeight: 500 }}>
                ← Previous card
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
