import React, { useState, useEffect, useRef } from 'react';
import VIcon from '../../prototype/icons';
import { VTopBar, VidyaAvatar } from '../../prototype/shared';
import { getSkill, getChapterSkills } from '../../content/fractionsChapter';
import api from '../../api/vidya';

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

export default function NavigableQuizScreen({ go, state, set }) {
  // One-shot chapter(s) chosen from the Practice tab.
  const practiceTopics = useRef(state?.practiceTopics || null).current;   // string[] | null
  const fromPractice = Array.isArray(practiceTopics) && practiceTopics.length > 0;
  useEffect(() => {
    if (state?.practiceTopics && set) set({ practiceTopics: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resolve topics: practice picks → a fractions sub-skill (authored) → session chapter.
  const staticSkill = (!fromPractice && state?.skillId)
    ? getChapterSkills().find((s) => s.id === state.skillId)
    : null;
  const quizTopics = fromPractice
    ? practiceTopics
    : [staticSkill ? staticSkill.title : api.topicTitle(state?.planTopicId)];
  const topicTitle = quizTopics.length > 1 ? `${quizTopics.length} chapters` : quizTopics[0];
  const fallbackQuiz = (staticSkill || getSkill(state?.skillId)).quiz;
  const grade = api.toGrade(state?.classLevel);

  // Questions are LLM-generated; the authored quiz is the offline fallback.
  const [quiz, setQuiz] = useState(null);   // null while loading
  const [qIdx, setQIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState([]);

  useEffect(() => {
    let alive = true;
    api.generateQuiz({ topics: quizTopics, grade, language: state?.language || 'English', difficulty: 'Medium' })
      .then((items) => {
        const mapped = (items || [])
          .filter((it) => it && it.question && Array.isArray(it.options) && it.options.length)
          .map((it) => ({ q: it.question, opts: it.options, correct: it.answer ?? 0, explanation: it.explanation || '' }));
        if (alive) setQuiz(mapped.length ? mapped : fallbackQuiz);
      })
      .catch(() => { if (alive) setQuiz(fallbackQuiz); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicTitle, grade, state?.language]);

  if (!quiz) {
    return (
      <div style={{ minHeight: '100%', background: 'var(--bg)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <VTopBar transparent showBack onBack={() => go(fromPractice ? 'practice' : 'home')} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, padding: 32 }}>
          <VidyaAvatar size={64} />
          <span className="v-spin" style={{ width: 22, height: 22, border: '2.5px solid var(--border)', borderTopColor: 'var(--indigo)', borderRadius: '50%' }} />
          <div style={{ fontFamily: 'Inter', fontSize: 14, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.5 }}>
            Vidya is writing fresh questions<br />on {topicTitle}…
          </div>
        </div>
      </div>
    );
  }

  const QUIZ = quiz;
  const q = QUIZ[qIdx];
  const isLast = qIdx === QUIZ.length - 1;
  const isCorrect = picked === q.correct;
  const pct = (qIdx / QUIZ.length) * 100;

  const handlePick = (i) => {
    if (picked !== null) return;
    setPicked(i);
    if (i === q.correct) setScore(s => s + 1);
  };

  const handleNext = () => {
    // Record this question's outcome for the post-quiz feedback.
    const wrong = picked !== q.correct;
    const thisMistake = wrong
      ? [{ question: q.q, user_answer: q.opts[picked], correct_answer: q.opts[q.correct] }]
      : [];
    if (isLast) {
      const finalScore = score + (picked === q.correct ? 1 : 0);
      set({
        lastQuizScore: finalScore,
        lastQuizTotal: QUIZ.length,
        lastQuizTopic: quizTopics.length > 1 ? quizTopics.join(', ') : quizTopics[0],
        lastQuizMistakes: [...mistakes, ...thisMistake],
      });
      go('session-analysis');
    } else {
      if (wrong) setMistakes((m) => [...m, ...thisMistake]);
      setQIdx(i => i + 1);
      setPicked(null);
    }
  };

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <VTopBar transparent showBack onBack={() => go(fromPractice ? 'practice' : 'home')}
        right={<span style={{ fontFamily: 'Inter', fontSize: 12, color: 'var(--muted-2)', fontWeight: 600 }}>{qIdx + 1} / {QUIZ.length}</span>}
      />

      {state?.coachStep === 3 && (
        <CoachHint
          text="Pick an answer for each question. You'll get instant feedback and see the explanation."
          cta="Got it →"
          onDismiss={() => set({ coachStep: 99, ownPlan: false })}
        />
      )}

      {/* progress bar */}
      <div style={{ position: 'fixed', top: 56, left: 0, right: 0, height: 3, background: 'var(--border-soft)', zIndex: 30 }}>
        <div style={{ height: 3, background: 'var(--indigo)', width: `${pct}%`, transition: 'width .4s ease' }} />
      </div>

      {/* question area */}
      <div style={{ padding: '76px 24px 24px', flex: 1 }}>
        <div style={{ fontFamily: 'Inter', fontSize: 10, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: 12 }}>
          Question {qIdx + 1}
        </div>
        <h1 style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.25, marginBottom: 28 }}>
          {q.q}
        </h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {q.opts.map((opt, i) => {
            const isPickedOpt = picked === i;
            const isRight = i === q.correct;
            let bg = '#fff', border = '1px solid var(--border)', color = 'var(--ink)';
            if (picked !== null) {
              if (isRight) { bg = '#EDFAF3'; border = '2px solid #1A7A4A'; color = '#1A7A4A'; }
              else if (isPickedOpt) { bg = '#FEF2F2'; border = '2px solid #C84040'; color = '#C84040'; }
              else { bg = '#fff'; color = 'var(--muted-2)'; border = '1px solid var(--border-soft)'; }
            }
            return (
              <button key={i} className="v-tap" onClick={() => handlePick(i)} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 16px', borderRadius: 14, textAlign: 'left',
                background: bg, border, color,
                fontFamily: 'Inter', fontSize: 15, fontWeight: 500,
                transition: 'all 180ms ease', cursor: picked !== null ? 'default' : 'pointer',
                opacity: picked !== null && !isRight && !isPickedOpt ? 0.45 : 1,
              }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: picked !== null && isRight ? '#1A7A4A' : picked !== null && isPickedOpt ? '#C84040' : 'var(--bg-warm)', border: picked !== null && (isRight || isPickedOpt) ? 'none' : '1px solid var(--border)', transition: 'all 180ms' }}>
                  {picked !== null && isRight && <VIcon name="check" size={12} color="#fff" strokeWidth={2.5} />}
                  {picked !== null && isPickedOpt && !isRight && <VIcon name="x" size={12} color="#fff" strokeWidth={2.5} />}
                  {(picked === null || (!isRight && !isPickedOpt)) && <span style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: 700, color: picked !== null ? 'var(--muted-2)' : 'var(--muted)' }}>{['A','B','C','D'][i]}</span>}
                </div>
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      {/* feedback panel — slides up after answering */}
      {picked !== null && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
          background: isCorrect ? '#EDFAF3' : '#FEF2F2',
          borderTop: `2px solid ${isCorrect ? '#1A7A4A' : '#C84040'}`,
          padding: '18px 22px 36px',
          animation: 'vSheetUp 0.3s cubic-bezier(.16,1,.3,1) both',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: isCorrect ? '#1A7A4A' : '#C84040', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <VIcon name={isCorrect ? 'check' : 'x'} size={13} color="#fff" strokeWidth={2.5} />
            </div>
            <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 16, fontWeight: 800, color: isCorrect ? '#1A7A4A' : '#C84040' }}>
              {isCorrect ? 'Correct!' : 'Not quite'}
            </div>
          </div>
          <div style={{ fontFamily: 'Inter', fontSize: 13, color: isCorrect ? '#2D7A50' : '#9B3030', lineHeight: 1.55, marginBottom: 16, paddingLeft: 38 }}>
            {q.explanation}
          </div>
          <button className="v-btn-primary v-tap" onClick={handleNext} style={{ background: isCorrect ? '#1A7A4A' : '#C84040', border: 'none' }}>
            {isLast ? 'See results' : 'Next question'} <VIcon name="arrow-right" size={14} color="#fff" />
          </button>
        </div>
      )}
    </div>
  );
}
