import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import VIcon from '../../prototype/icons';
import { VTopBar, VidyaAvatar } from '../../prototype/shared';
import { getChapterSkills } from '../../content/fractionsChapter';
import { renderCard, mapScenes, mapVideos } from '../../content/conceptVisuals';
import api from '../../api/vidya';
import { appendActivity } from '../../lib/progress';
import type { ScreenProps, Card, ConceptResponse, Scene, VideoItem, RealWorldUse } from '../../types';

// Build the card array for an LLM-generated topic. Real-life scenes and videos
// are preloaded by the caller and passed in, so every card is render-ready and
// the deck shows complete (no per-card loading flicker).
function buildCards(
  topicTitle: string,
  concept: ConceptResponse | null | undefined,
  scenes: Scene[],
  videos: VideoItem[],
): Card[] {
  const cards: Card[] = [];
  if (concept?.definition) {
    cards.push({ type: 'definition', eyebrow: 'WHAT IS IT', heading: topicTitle, body: concept.definition });
  }
  if (Array.isArray(concept?.mistakes) && concept.mistakes.length) {
    cards.push({ type: 'mistakes', eyebrow: 'COMMON MISTAKES', heading: 'Mistakes to avoid', items: concept.mistakes });
  }
  if (Array.isArray(concept?.examples) && concept.examples.length) {
    cards.push({ type: 'examples', eyebrow: 'SOLVED EXAMPLES', heading: 'Worked examples', examples: concept.examples });
  }
  cards.push({ type: 'realLife', eyebrow: 'WHERE IT APPEARS', heading: `${topicTitle} in real life`, scenes });
  cards.push({ type: 'videos', eyebrow: 'WATCH & LEARN', heading: 'Videos on this topic', videos });
  return cards;
}

interface CoachHintProps {
  text: string;
  cta: string;
  onDismiss: () => void;
}

function CoachHint({ text, cta, onDismiss }: CoachHintProps) {
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

export default function ConceptScreen({ go, set, state }: ScreenProps) {
  const { t } = useTranslation(['extra', 'common']);
  // One-shot free-text concept (or chapter) asked from the Learn tab.
  // Captured once so it survives being cleared from global state below.
  const [askedConcept] = useState(() => state?.askedConcept || null);
  // Optional NCERT scope set by the chapter drill-down, so retrieval can hard-filter
  // to one subtopic. Null for free-text asks (then retrieval stays grade-wide).
  const [askedChapterId] = useState(() => state?.askedChapterId || null);
  const [askedSection] = useState(() => state?.askedSection || null);
  const fromLearn = !!askedConcept;   // came from the Learn tab (browse/ask), not a session
  useEffect(() => {
    if ((state?.askedConcept || state?.askedChapterId || state?.askedSection) && set)
      set({ askedConcept: null, askedChapterId: null, askedSection: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Priority: asked concept → a fractions sub-skill (rich authored) → session chapter.
  const staticSkill = (!askedConcept && state?.skillId)
    ? getChapterSkills().find((s) => s.id === state.skillId)
    : null;
  const topicTitle = askedConcept || (staticSkill ? staticSkill.title : api.topicTitle(state?.planTopicId));
  const grade = api.toGrade(state?.classLevel);

  // cards: null = loading; otherwise the array to render.
  const [cards, setCards] = useState<Card[] | null>(staticSkill ? staticSkill.cards : null);
  const [idx, setIdx] = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (staticSkill) return;   // already have rich content
    let alive = true;
    // Load the lesson, real-world uses, and videos together — so the deck
    // only appears once every card is ready (no blank-then-fill flicker).
    const lang = state?.language || 'English';
    Promise.all([
      api.generateConcept({ topic: topicTitle, grade, language: lang, chapterId: askedChapterId, section: askedSection })
        .catch(() => ({} as ConceptResponse)),
      api.realWorld(topicTitle, grade).catch(() => [] as RealWorldUse[]),
      api.searchVideos(topicTitle, grade).catch(() => [] as VideoItem[]),
    ]).then(([concept, uses, vids]) => {
      if (alive) setCards(buildCards(topicTitle, concept, mapScenes(uses), mapVideos(vids)));
    });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicTitle, grade]);

  // Mark the day active for the streak once the lesson is ready (once per day/topic).
  useEffect(() => {
    if (!cards || !set) return;
    set({ activityLog: appendActivity(state?.activityLog, {
      kind: 'session', date: new Date().toISOString(), topic: topicTitle, score: 0, total: 0,
    }, { oncePerDay: true }) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards]);

  if (!cards) {
    return (
      <div style={{ minHeight: '100%', background: 'var(--bg)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <VTopBar showBack onBack={() => go(fromLearn ? 'learn' : 'home')} title={topicTitle} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, padding: 32 }}>
          <VidyaAvatar size={64} animated />
          <div style={{ fontFamily: 'Inter', fontSize: 14, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
            {t('concept.loading', { topic: topicTitle })}
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
    // Learn is the concept flow — finishing returns to Learn (quizzes live in Practice).
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
      <VTopBar showBack onBack={back} title={t('concept.progress', { current: idx + 1, total })} />

      {state?.coachStep === 2 && (
        <CoachHint
          text={t('concept.coachHint')}
          cta={t('concept.coachCta')}
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
          <h2 style={{ fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontWeight: 800, fontSize: 26, lineHeight: 1.2, letterSpacing: '-0.02em', marginBottom: 18 }}>
            {card.heading}
          </h2>

          <div style={{ flex: 1 }}>
            {renderCard(card, topicTitle)}
          </div>

          <div style={{ paddingTop: 24 }}>
            <button className="v-btn-primary v-tap" style={{ width: '100%' }} onClick={advance}>
              {isLast ? (fromLearn ? t('concept.done') : t('concept.startQuiz')) : t('common:continue')} <VIcon name="arrow-right" size={14} color="#fff" />
            </button>
            {idx > 0 && (
              <button className="v-tap" onClick={back} style={{ background: 'transparent', border: 'none', width: '100%', padding: '14px 0 0', fontFamily: 'Inter', fontSize: 13, color: 'var(--muted-2)', fontWeight: 500 }}>
                {t('concept.previousCard')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
