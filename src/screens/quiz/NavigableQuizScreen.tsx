import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import VIcon from '../../prototype/icons';
import { VTopBar, VidyaAvatar } from '../../prototype/shared';
import { getSkill, getChapterSkills } from '../../content/fractionsChapter';
import api from '../../api/vidya';
import { appendActivity } from '../../lib/progress';
import { applyResult, deltaFor, levelFor, skillKey, type MasteryLevel } from '../../lib/mastery';
import type { ScreenProps, ActivityEntry, MasteryMap, PracticeSelection } from '../../types';

interface QuizItem { q: string; opts: string[]; correct: number; explanation: string; topic?: string; }
interface QuizScope { chapterId?: string | null; section?: string | null; topic: string; }
interface Mistake { question: string; user_answer: string; correct_answer: string; }

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

export default function NavigableQuizScreen({ go, state, set }: ScreenProps) {
  const { t } = useTranslation('quiz');
  // One-shot chapter(s) chosen from the Practice tab. Captured once on mount
  // (lazy useState) so it survives being cleared from global state below.
  const [practiceTopics] = useState<string[] | null>(() => (state?.practiceTopics as string[] | null) || null);
  // Full picked selection (chapterId+section+title per topic) for per-skill mastery credit.
  const [practiceSel] = useState<PracticeSelection[] | null>(() => (state?.practiceSel as PracticeSelection[] | null) || null);
  const fromPractice = Array.isArray(practiceTopics) && practiceTopics.length > 0;
  // One-shot subtopic scope from the chapter drill-down ("Quiz" on a subtopic).
  const [quizScope] = useState<QuizScope | null>(() => (state?.quizScope as QuizScope | null) || null);
  useEffect(() => {
    if ((state?.practiceTopics || state?.practiceSel || state?.quizScope) && set) set({ practiceTopics: null, practiceSel: null, quizScope: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resolve topics: subtopic scope → practice picks → fractions sub-skill → session subtopic → session chapter.
  const staticSkill = (!fromPractice && !quizScope && state?.skillId)
    ? getChapterSkills().find((s) => s.id === state.skillId)
    : null;
  // Subtopic-wise session: quiz the exact skill today's concept taught.
  const [sessionSub] = useState<QuizScope | null>(() =>
    (!fromPractice && !quizScope && !state?.skillId && state?.planSection && state?.planSubtopicTitle)
      ? { chapterId: state?.planTopicId ? String(state.planTopicId) : null, section: String(state.planSection), topic: String(state.planSubtopicTitle) }
      : null,
  );
  const quizTopics: string[] = quizScope
    ? [quizScope.topic]
    : fromPractice && practiceTopics
    ? practiceTopics
    : sessionSub
    ? [sessionSub.topic]
    : [staticSkill ? staticSkill.title : api.topicTitle(state?.planTopicId)];
  const topicTitle = quizTopics.length > 1 ? t('navigable.chaptersCount', { count: quizTopics.length }) : quizTopics[0];
  const fallbackQuiz = (staticSkill || getSkill(state?.skillId ?? undefined)).quiz as QuizItem[];
  const grade = api.toGrade(state?.classLevel);

  // Questions are LLM-generated; the authored quiz is the offline fallback.
  const [quiz, setQuiz] = useState<QuizItem[] | null>(null);   // null while loading
  const [qIdx, setQIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  // Per-question correctness, for per-skill mastery credit on multi-topic quizzes.
  const perQRight = React.useRef<boolean[]>([]);

  // Mastery-aware difficulty: struggling skills get Easy, mastered ones get Hard.
  const [difficulty] = useState<string>(() => {
    const map = (state?.mastery as MasteryMap) || {};
    const levels: MasteryLevel[] = [];
    const single = quizScope || sessionSub;
    if (single?.chapterId) levels.push(levelFor(map[skillKey(single.chapterId, single.section)]));
    else if (practiceSel?.length) practiceSel.forEach((s) => levels.push(levelFor(map[skillKey(s.chapterId, s.section)])));
    const known = levels.filter((l) => l !== 'new');
    if (known.some((l) => l === 'needshelp')) return 'Easy';
    if (known.length && known.every((l) => l === 'strong')) return 'Hard';
    return 'Medium';
  });

  useEffect(() => {
    let alive = true;
    api.generateQuiz({ topics: quizTopics, grade, language: state?.language || 'English', difficulty, chapterId: quizScope?.chapterId || sessionSub?.chapterId || null, section: quizScope?.section || sessionSub?.section || null })
      .then((items) => {
        const mapped = (items || [])
          .filter((it) => it && it.question && Array.isArray(it.options) && it.options.length)
          .map((it): QuizItem => ({ q: it.question, opts: it.options, correct: it.answer ?? 0, explanation: it.explanation || '', topic: it.topic }));
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
          <VidyaAvatar size={64} animated />
          <div style={{ fontFamily: 'Inter', fontSize: 14, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
            {t('navigable.writingQuestions', { topic: topicTitle })}
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

  const handlePick = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    if (i === q.correct) setScore(s => s + 1);
  };

  const handleNext = () => {
    // Record this question's outcome for the post-quiz feedback.
    const wrong = picked !== q.correct;
    perQRight.current[qIdx] = !wrong;
    const thisMistake: Mistake[] = wrong
      ? [{ question: q.q, user_answer: q.opts[picked as number], correct_answer: q.opts[q.correct] }]
      : [];
    if (isLast) {
      const finalScore = score + (picked === q.correct ? 1 : 0);
      const finalTopic = quizTopics.length > 1 ? quizTopics.join(', ') : quizTopics[0];
      const allMistakes = [...mistakes, ...thisMistake];
      // Single-scope quizzes attribute to a stable skill key for mastery.
      const scope = quizScope || sessionSub;
      const entry: ActivityEntry = {
        kind: 'quiz', date: new Date().toISOString(), topic: finalTopic,
        chapterId: scope?.chapterId || undefined, section: scope?.section ?? null,
        score: finalScore, total: QUIZ.length, mistakes: allMistakes,
      };
      const oldMap = (state?.mastery as MasteryMap) || {};
      let newMap = applyResult(oldMap, entry);
      // Multi-topic practice: credit each question's result to its own skill,
      // matched via the LLM's per-question topic tag.
      if (!scope?.chapterId && practiceSel?.length) {
        const norm = (s: string) => s.trim().toLowerCase();
        const groups = new Map<string, { s: PracticeSelection; score: number; total: number }>();
        QUIZ.forEach((item, i) => {
          if (!item.topic) return;
          const match = practiceSel.find((p) => norm(p.title) === norm(item.topic!));
          if (!match) return;
          const k = skillKey(match.chapterId, match.section);
          const g = groups.get(k) || { s: match, score: 0, total: 0 };
          g.total += 1;
          if (perQRight.current[i]) g.score += 1;
          groups.set(k, g);
        });
        groups.forEach((g) => {
          newMap = applyResult(newMap, {
            kind: 'quiz', date: entry.date, topic: g.s.title,
            chapterId: g.s.chapterId, section: g.s.section,
            score: g.score, total: g.total,
          });
        });
      }
      const delta = deltaFor(oldMap, newMap, entry.chapterId, entry.section, finalTopic);
      set({
        lastQuizScore: finalScore,
        lastQuizTotal: QUIZ.length,
        lastQuizTopic: finalTopic,
        lastQuizMistakes: allMistakes,
        activityLog: appendActivity(state?.activityLog, entry),
        mastery: newMap,
        lastMasteryDelta: delta || undefined,
        // Guests get a limited number of free sessions before signing up.
        ...(state?.userId ? {} : { guestSessions: (Number(state?.guestSessions) || 0) + 1 }),
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
          text={t('navigable.coachHint')}
          cta={t('navigable.coachCta')}
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
