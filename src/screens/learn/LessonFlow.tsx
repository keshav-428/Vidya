import React, { useState } from 'react';
import VIcon from '../../prototype/icons';
import { VTopBar, VOptionButton } from '../../prototype/shared';
import { renderCard } from '../../content/conceptVisuals';
import type { AdaptiveLesson, LessonMCQ, Card, VideoItem } from '../../types';

// ─────────────────────────────────────────────────────────────
//  LessonFlow — the adaptive "teaching beats" lesson.
//  hook → concept card(s) → check (resolves the hook)
//    └─ missed? → alternate explanation → easier check
//  → per-part worked examples, each followed by a "your turn"
//  → spot-the-mistake game → videos.
//  Branching is plain client state: the LLM authors the beats,
//  the student's answers pick the path through them.
// ─────────────────────────────────────────────────────────────

type StepType = 'hook' | 'concept' | 'alt' | 'check' | 'easier' | 'example' | 'your_turn' | 'spot' | 'videos';
interface Step { type: StepType; idx: number; }

interface LessonFlowProps {
  lesson: AdaptiveLesson;
  videos: VideoItem[];
  topicTitle: string;
  doneLabel: string;
  onDone: () => void;
  onExit: () => void;
}

function buildSteps(lesson: AdaptiveLesson): Step[] {
  const steps: Step[] = [{ type: 'hook', idx: 0 }];
  lesson.concept_cards.forEach((_, i) => steps.push({ type: 'concept', idx: i }));
  steps.push({ type: 'check', idx: 0 });
  lesson.examples.forEach((_, i) => {
    steps.push({ type: 'example', idx: i });
    steps.push({ type: 'your_turn', idx: i });
  });
  (lesson.spot_mistakes || []).forEach((_, i) => steps.push({ type: 'spot', idx: i }));
  steps.push({ type: 'videos', idx: 0 });
  return steps;
}

// The question object for MCQ-style steps.
function mcqFor(lesson: AdaptiveLesson, step: Step): LessonMCQ | null {
  if (step.type === 'check') return lesson.check;
  if (step.type === 'easier') return lesson.easier_check || null;
  if (step.type === 'your_turn') return lesson.examples[step.idx]?.your_turn || null;
  if (step.type === 'spot') {
    const sm = lesson.spot_mistakes[step.idx];
    return sm ? { prompt: sm.prompt || 'Where did it go wrong?', options: sm.options, correct_index: sm.correct_index, right: sm.explain, wrong: sm.explain } : null;
  }
  return null;
}

const EYEBROW: Record<StepType, string> = {
  hook: 'THINK ABOUT IT 🤔',
  concept: 'THE IDEA',
  alt: 'ANOTHER WAY TO SEE IT',
  check: 'QUICK TRY ✏️',
  easier: 'ONE MORE TRY 💪',
  example: 'WATCH ME SOLVE',
  your_turn: 'YOUR TURN 🚀',
  spot: 'SPOT THE MISTAKE 🕵️',
  videos: 'WATCH & LEARN',
};

export default function LessonFlow({ lesson, videos, topicTitle, doneLabel, onDone, onExit }: LessonFlowProps) {
  const [steps, setSteps] = useState<Step[]>(() => buildSteps(lesson));
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [branched, setBranched] = useState(false);   // alt/easier inserted once only
  const [exiting, setExiting] = useState(false);

  const step = steps[idx];
  const isLast = idx === steps.length - 1;
  const pct = ((idx + 1) / steps.length) * 100;
  const mcq = mcqFor(lesson, step);
  const answered = picked !== null;
  const wasCorrect = mcq && picked !== null && picked === mcq.correct_index;

  const goto = (n: number) => {
    setExiting(true);
    setTimeout(() => { setIdx(n); setPicked(null); setExiting(false); }, 160);
  };

  const advance = () => {
    if (isLast) { onDone(); return; }
    // Missed the hook-resolving check → teach it another way, then retry gently.
    if (step.type === 'check' && answered && !wasCorrect && !branched && lesson.alt_explanation && lesson.easier_check) {
      const next = [...steps];
      next.splice(idx + 1, 0, { type: 'alt', idx: 0 }, { type: 'easier', idx: 0 });
      setSteps(next);
      setBranched(true);
    }
    goto(idx + 1);
  };

  const back = () => {
    if (idx === 0) { onExit(); return; }
    goto(idx - 1);
  };

  // ── Per-type content ──
  const renderBody = () => {
    if (step.type === 'hook') {
      const h = lesson.hook;
      return (
        <>
          <h2 style={headingStyle}>{h.scenario}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {h.options.map((opt, oi) => (
              <VOptionButton key={oi} label={opt} selected={picked === oi} onClick={() => !answered && setPicked(oi)} />
            ))}
          </div>
          {answered && (
            <div className="v-enter-fade" style={feedbackBox('var(--indigo-air)')}>
              <span style={{ fontFamily: 'Inter', fontSize: 13, color: 'var(--ink)', lineHeight: 1.5 }}>
                {picked === h.best_index ? 'Great instinct! ' : 'Interesting guess! '}{h.reveal}
              </span>
            </div>
          )}
        </>
      );
    }

    if (step.type === 'concept' || step.type === 'alt') {
      const card = step.type === 'concept' ? lesson.concept_cards[step.idx] : lesson.alt_explanation!;
      return (
        <>
          <h2 style={headingStyle}>{card.heading}</h2>
          {card.body.split('\n\n').map((p, i) => (
            <p key={i} style={{ fontFamily: 'Inter', fontSize: 15, lineHeight: 1.65, color: 'var(--ink)', marginBottom: 14 }}>{p}</p>
          ))}
        </>
      );
    }

    if (step.type === 'example') {
      const ex = lesson.examples[step.idx];
      return (
        <>
          <h2 style={headingStyle}>{ex.q}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
            {ex.steps.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, background: '#fff', border: '1px solid var(--border)', borderRadius: 14, padding: '12px 14px' }}>
                <div style={{ width: 22, height: 22, borderRadius: 9999, background: 'var(--indigo-air)', color: 'var(--indigo)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'Inter', fontSize: 12, fontWeight: 700, color: 'var(--ink)', marginBottom: 2 }}>{s.label}</div>
                  <div style={{ fontFamily: 'Inter', fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>{s.detail}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#EDFAF3', border: '1px solid #A8D5B9', borderRadius: 12, padding: '10px 14px' }}>
            <VIcon name="check" size={13} color="#1A7A4A" strokeWidth={2.5} />
            <span style={{ fontFamily: 'Inter', fontSize: 14, fontWeight: 700, color: '#1A7A4A' }}>{ex.answer}</span>
          </div>
        </>
      );
    }

    if (step.type === 'videos') {
      const card: Card = { type: 'videos', eyebrow: 'WATCH & LEARN', heading: `Videos on ${topicTitle}`, videos };
      return (
        <>
          <h2 style={headingStyle}>See it in the real world</h2>
          {renderCard(card, topicTitle)}
        </>
      );
    }

    // MCQ steps: check / easier / your_turn / spot
    if (mcq) {
      const story = step.type === 'spot' ? lesson.spot_mistakes[step.idx]?.story : null;
      return (
        <>
          {story && (
            <div style={{ background: 'var(--bg-warm)', border: '1px dashed var(--border)', borderRadius: 14, padding: '13px 15px', marginBottom: 14, fontFamily: 'Inter', fontSize: 14, lineHeight: 1.55, color: 'var(--ink)' }}>
              {story}
            </div>
          )}
          <h2 style={headingStyle}>{mcq.prompt}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {mcq.options.map((opt, oi) => (
              <VOptionButton key={oi} label={opt}
                selected={!answered && picked === oi}
                correct={answered && oi === mcq.correct_index}
                wrong={answered && picked === oi && oi !== mcq.correct_index}
                onClick={() => !answered && setPicked(oi)} />
            ))}
          </div>
          {answered && (
            <div className="v-enter-fade" style={feedbackBox(wasCorrect ? '#EDFAF3' : '#FFF7ED')}>
              <span style={{ fontFamily: 'Inter', fontSize: 13, color: wasCorrect ? '#1A7A4A' : '#B45309', lineHeight: 1.5 }}>
                {wasCorrect ? (mcq.right || 'Yes! You got it! 🎉') : (mcq.wrong || mcq.right || "Good try — let's look at it once more.")}
              </span>
            </div>
          )}
        </>
      );
    }
    return null;
  };

  // Continue is gated on answering for question-type steps.
  const needsAnswer = (step.type === 'hook' || !!mcq) && !answered;
  const continueLabel =
    step.type === 'hook' ? "Let's learn the trick" :
    step.type === 'example' ? 'Now you try →' :
    isLast ? doneLabel : 'Continue';

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <VTopBar showBack onBack={back} title={topicTitle} />
      <div style={{ padding: '56px 0 0', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: 3, background: 'var(--border-soft)', margin: '0 24px 20px' }}>
          <div style={{ height: 3, borderRadius: 9999, background: 'var(--indigo)', width: `${pct}%`, transition: 'width .35s ease' }} />
        </div>

        <div style={{ flex: 1, padding: '0 24px 24px', display: 'flex', flexDirection: 'column', animation: exiting ? 'none' : 'vCardSlide 240ms cubic-bezier(.16,1,.3,1) both' }}>
          <div style={{ fontFamily: 'Inter', fontSize: 10, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: step.type === 'your_turn' || step.type === 'spot' ? 'var(--indigo)' : 'var(--muted-2)', marginBottom: 10 }}>
            {step.type === 'example' ? `${EYEBROW.example} · ${lesson.examples[step.idx]?.part || ''}` : EYEBROW[step.type]}
          </div>

          <div style={{ flex: 1 }}>{renderBody()}</div>

          <div style={{ paddingTop: 20 }}>
            <button className="v-btn-primary v-tap" style={{ width: '100%', opacity: needsAnswer ? 0.4 : 1 }} disabled={needsAnswer} onClick={advance}>
              {continueLabel} <VIcon name="arrow-right" size={14} color="#fff" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const headingStyle: React.CSSProperties = {
  fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif",
  fontWeight: 800, fontSize: 23, lineHeight: 1.25, letterSpacing: '-0.02em',
  marginBottom: 18, color: 'var(--ink)',
};

const feedbackBox = (bg: string): React.CSSProperties => ({
  marginTop: 14, borderRadius: 14, padding: '12px 14px', background: bg,
  display: 'flex', alignItems: 'flex-start', gap: 8,
});
