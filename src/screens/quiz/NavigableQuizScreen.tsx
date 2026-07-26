import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import VIcon from '../../prototype/icons';
import { VTopBar, VidyaAvatar } from '../../prototype/shared';
import { getSkill, getChapterSkills } from '../../content/fractionsChapter';
import api from '../../api/vidya';
import { appendActivity, sessionStepPatch } from '../../lib/progress';
import { applyResult, deltaFor, levelFor, skillKey, type MasteryLevel } from '../../lib/mastery';
import {
  parsePool, isCorrect as gradeAnswer, isComplete, answerText, correctText,
  type Question, type Answer,
} from '../../lib/quizFormats';
import QuestionBody, { AUTO_SUBMIT } from './formats';
import type { ScreenProps, ActivityEntry, MasteryMap, PracticeSelection } from '../../types';

const TIERS: Question['difficulty'][] = ['easy', 'medium', 'hard'];
const CHIP: React.CSSProperties = {
  fontFamily: 'Inter', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.06em',
  borderRadius: 9999, padding: '3px 9px',
};
const WIN_TARGET = 5;    // the quiz ends when you've got this many right…
const MAX_ATTEMPTS = 9;  // …or after this many tries (no death spirals)
interface FirstTry { right: boolean; hint: boolean; topic?: string; q: string; userAnswer: string; correctAnswer: string; }
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

/** The one progress metaphor in the quiz: fill five stars and you're done.
 *  It replaced a "2 of 5 right" counter that ran alongside a "QUESTION 6"
 *  counter — two scales for the same run, which is what made the quiz
 *  confusing to read. */
function Stars({ wins, target, label }: { wins: number; target: number; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      {/* Bare stars could be points, or lives. The count says which. */}
      <span style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: 700, color: 'var(--muted-2)', whiteSpace: 'nowrap' }}>
        {label}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        {Array.from({ length: target }, (_, i) => (
          <span key={i} style={{
            display: 'inline-flex',
            transform: i < wins ? 'scale(1)' : 'scale(0.86)',
            transition: 'transform 260ms cubic-bezier(.16,1,.3,1)',
          }}>
            <VIcon name={i < wins ? 'star-fill' : 'star'} size={15}
              color={i < wins ? 'var(--saffron)' : 'var(--border)'} strokeWidth={1.8} />
          </span>
        ))}
      </div>
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
  // Today's session quiz — as opposed to practice, or a one-off from the
  // mastery map. Only the session quiz may tick the daily checklist.
  const [isSessionQuiz] = useState(() => !state?.practiceTopics && !state?.quizScope);
  // A student-chosen level (viva prep) overrides the mastery-derived difficulty
  // for this run only.
  const [levelOverride] = useState(() => (state?.quizLevel as string | null) || null);
  // Retry card: the questions the student got wrong, so the new ones target them.
  const [focusPoints] = useState(() => (state?.quizFocusPoints as string[] | null) || null);
  const fromPractice = Array.isArray(practiceTopics) && practiceTopics.length > 0;
  // One-shot subtopic scope from the chapter drill-down ("Quiz" on a subtopic).
  const [quizScope] = useState<QuizScope | null>(() => (state?.quizScope as QuizScope | null) || null);
  useEffect(() => {
    if ((state?.practiceTopics || state?.practiceSel || state?.quizScope || state?.quizLevel || state?.quizFocusPoints) && set)
      set({ practiceTopics: null, practiceSel: null, quizScope: null, quizLevel: null, quizFocusPoints: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resolve topics: subtopic scope → practice picks → fractions sub-skill → session subtopic → session chapter.
  const staticSkill = (!fromPractice && !quizScope && state?.skillId)
    ? getChapterSkills().find((s) => s.id === state.skillId)
    : null;
  // Subtopic-wise session: quiz the exact skill today's concept taught.
  // A session may cover several topics; the quiz then spans them all and each
  // question's result is credited to its own skill (same path as practice).
  const [sessionSel] = useState<PracticeSelection[] | null>(() => {
    const sel = state?.planSessionSel as PracticeSelection[] | undefined;
    return (!fromPractice && !state?.quizScope && !state?.skillId && sel && sel.length > 1) ? sel : null;
  });
  const [sessionSub] = useState<QuizScope | null>(() =>
    (!fromPractice && !quizScope && !state?.skillId && state?.planSection && state?.planSubtopicTitle)
      ? { chapterId: state?.planTopicId ? String(state.planTopicId) : null, section: String(state.planSection), topic: String(state.planSubtopicTitle) }
      : null,
  );
  const quizTopics: string[] = quizScope
    ? [quizScope.topic]
    : fromPractice && practiceTopics
    ? practiceTopics
    : sessionSel
    ? sessionSel.map((x) => x.title)
    : sessionSub
    ? [sessionSub.topic]
    : [staticSkill ? staticSkill.title : api.topicTitle(state?.planTopicId)];
  // Whichever selection drives per-skill mastery attribution on finish.
  const attributionSel: PracticeSelection[] | null = practiceSel?.length ? practiceSel : sessionSel;
  const topicTitle = quizTopics.length > 1 ? t('navigable.chaptersCount', { count: quizTopics.length }) : quizTopics[0];
  const fallbackQuiz: Question[] = ((staticSkill || getSkill(state?.skillId ?? undefined)).quiz as { q: string; opts: string[]; correct: number; explanation: string }[])
    .map((it, i): Question => ({
      id: i, format: 'mcq', q: it.q, opts: it.opts, correct: it.correct,
      explanation: it.explanation, difficulty: 'medium',
    }));
  const grade = api.toGrade(state?.classLevel);

  // Questions are LLM-generated; the authored quiz is the offline fallback.
  const [quiz, setQuiz] = useState<Question[] | null>(null);   // null while loading
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [hintShown, setHintShown] = useState(false);
  // Adaptive loop state: win condition instead of a fixed run of questions.
  const [current, setCurrent] = useState<Question | null>(null);
  const [isRetry, setIsRetry] = useState(false);
  const [wins, setWins] = useState(0);
  const [attempted, setAttempted] = useState(0);
  const [streak, setStreak] = useState(0);
  const tierRef = React.useRef<Question['difficulty']>('medium');
  const tierRightsRef = React.useRef(0);
  // Difficulty is told as a MOMENT, not a running score: a chip on the question
  // that just got harder. A permanent "LEVEL 2" next to the stars was a second
  // number to decode, and a student shouldn't have to work out which of two
  // indicators means what. It also never announces a drop — being demoted for
  // one wrong answer reads as punishment.
  const [harderNow, setHarderNow] = useState(false);
  const usedIdsRef = React.useRef<Set<number>>(new Set());
  const requeueRef = React.useRef<{ item: Question; queuedAt: number }[]>([]);
  // First showing of each question is the honest signal that feeds mastery.
  const firstTryRef = React.useRef<Map<number, FirstTry>>(new Map());

  // Mastery-aware difficulty: struggling skills get Easy, mastered ones get Hard.
  const [difficulty] = useState<string>(() => {
    if (levelOverride) return { easy: 'Easy', normal: 'Medium', hard: 'Hard' }[levelOverride] || 'Medium';
    const map = (state?.mastery as MasteryMap) || {};
    const levels: MasteryLevel[] = [];
    const single = quizScope || sessionSub;
    if (single?.chapterId) levels.push(levelFor(map[skillKey(single.chapterId, single.section)]));
    else if (attributionSel?.length) attributionSel.forEach((s) => levels.push(levelFor(map[skillKey(s.chapterId, s.section)])));
    const known = levels.filter((l) => l !== 'new');
    if (known.some((l) => l === 'needshelp')) return 'Easy';
    if (known.length && known.every((l) => l === 'strong')) return 'Hard';
    return 'Medium';
  });
  // Starting rung of the in-quiz ladder mirrors the overall difficulty.
  useEffect(() => {
    tierRef.current = difficulty === 'Easy' ? 'easy' : difficulty === 'Hard' ? 'hard' : 'medium';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pick the next question: a due retry first, else a fresh one at the
  // current rung (nearest rung as fallback), else any pending retry.
  const pickNext = (pool: Question[], attemptedNow: number): { item: Question; retry: boolean } | null => {
    const due = requeueRef.current.length && (attemptedNow - requeueRef.current[0].queuedAt >= 2);
    if (due) return { item: requeueRef.current.shift()!.item, retry: true };
    const fresh = pool.filter((it) => !usedIdsRef.current.has(it.id));
    if (fresh.length) {
      const tierIdx = TIERS.indexOf(tierRef.current);
      const byDistance = [...fresh].sort((a, b) =>
        Math.abs(TIERS.indexOf(a.difficulty) - tierIdx) - Math.abs(TIERS.indexOf(b.difficulty) - tierIdx));
      return { item: byDistance[0], retry: false };
    }
    if (requeueRef.current.length) return { item: requeueRef.current.shift()!.item, retry: true };
    return null;
  };

  useEffect(() => {
    let alive = true;
    const start = (pool: Question[]) => {
      setQuiz(pool);
      const first = pickNext(pool, 0);
      if (first) { usedIdsRef.current.add(first.item.id); setCurrent(first.item); setIsRetry(first.retry); }
    };
    api.generateQuiz({ topics: quizTopics, grade, language: state?.language || 'English', difficulty, focusPoints, chapterId: quizScope?.chapterId || sessionSub?.chapterId || null, section: quizScope?.section || sessionSub?.section || null })
      .then((items) => {
        // Validation lives in parsePool: anything a student couldn't fairly
        // answer (a match with a duplicate pair, an out-of-range index) is
        // dropped rather than shown.
        const pool = parsePool(items);
        if (alive) start(pool.length ? pool : fallbackQuiz);
      })
      .catch(() => { if (alive) start(fallbackQuiz); });
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
  const q = current;
  if (!q) return null;
  const isCorrect = gradeAnswer(q, answer);
  const canSubmit = isComplete(q, answer);
  const endsNext = submitted
    && ((isCorrect ? wins + 1 : wins) >= WIN_TARGET || attempted + 1 >= MAX_ATTEMPTS);
  // Formats that carry their own prompt (a statement, a sentence with a gap)
  // would otherwise show it twice.
  const heading = q.format === 'blank' && q.q === q.sentence ? t('formats.fillBlank')
    : q.format === 'tf' && q.q === q.statement ? t('formats.trueOrFalse')
    : q.q;

  // Wrap up: only FIRST attempts feed mastery (hints count half); the
  // requeue loop exists to fix mistakes, not to inflate the map.
  const finish = () => {
    const tries = [...firstTryRef.current.values()];
    const ftScore = tries.reduce((a, r) => a + (r.right ? (r.hint ? 0.5 : 1) : 0), 0);
    const ftTotal = tries.length || 1;
    const allMistakes: Mistake[] = tries.filter((r) => !r.right)
      .map((r) => ({ question: r.q, user_answer: r.userAnswer, correct_answer: r.correctAnswer }));
    const finalTopic = quizTopics.length > 1 ? quizTopics.join(', ') : quizTopics[0];
    const scope = quizScope || sessionSub;
    const entry: ActivityEntry = {
      kind: 'quiz', date: new Date().toISOString(), topic: finalTopic,
      chapterId: scope?.chapterId || undefined, section: scope?.section ?? null,
      score: ftScore, total: ftTotal, mistakes: allMistakes,
    };
    const oldMap = (state?.mastery as MasteryMap) || {};
    let newMap = applyResult(oldMap, entry);
    // Multi-topic practice: credit each first-try result to its own skill.
    if (!scope?.chapterId && attributionSel?.length) {
      const norm = (x: string) => x.trim().toLowerCase();
      const groups = new Map<string, { s: PracticeSelection; score: number; total: number }>();
      tries.forEach((r) => {
        if (!r.topic) return;
        const match = attributionSel.find((pp) => norm(pp.title) === norm(r.topic!));
        if (!match) return;
        const k = skillKey(match.chapterId, match.section);
        const g = groups.get(k) || { s: match, score: 0, total: 0 };
        g.total += 1;
        g.score += r.right ? (r.hint ? 0.5 : 1) : 0;
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
      lastQuizScore: Math.round(ftScore),
      lastQuizTotal: ftTotal,
      lastQuizTopic: finalTopic,
      lastQuizMistakes: allMistakes,
      lastQuizWasSession: isSessionQuiz,
      ...(isSessionQuiz ? sessionStepPatch(state, 2) : {}),
      activityLog: appendActivity(state?.activityLog, entry),
      mastery: newMap,
      lastMasteryDelta: delta || undefined,
      // Guests get a limited number of free sessions before signing up.
      ...(state?.userId ? {} : { guestSessions: (Number(state?.guestSessions) || 0) + 1 }),
    });
    go('session-analysis');
  };

  const handleNext = () => {
    if (!current || !submitted) return;
    const wasRight = gradeAnswer(current, answer);
    // Record the first showing only — that's the honest evidence.
    if (!isRetry && !firstTryRef.current.has(current.id)) {
      firstTryRef.current.set(current.id, {
        right: wasRight, hint: hintShown, topic: current.topic,
        q: current.q, userAnswer: answerText(current, answer), correctAnswer: correctText(current),
      });
    }
    const newWins = wins + (wasRight ? 1 : 0);
    const newAttempted = attempted + 1;
    let steppedUp = false;
    // Difficulty ladder + streak run on clean first-try results.
    if (!isRetry) {
      if (wasRight && !hintShown) {
        tierRightsRef.current += 1;
        if (tierRightsRef.current >= 2) {
          const before = tierRef.current;
          tierRef.current = TIERS[Math.min(TIERS.length - 1, TIERS.indexOf(tierRef.current) + 1)];
          tierRightsRef.current = 0;
          steppedUp = tierRef.current !== before;
        }
        setStreak((x) => x + 1);
      } else {
        tierRef.current = TIERS[Math.max(0, TIERS.indexOf(tierRef.current) - 1)];
        tierRightsRef.current = 0;
        setStreak(0);
      }
    } else if (!wasRight) {
      setStreak(0);
    }
    // Misses come back: the quiz ends on success, not on failure.
    if (!wasRight) requeueRef.current.push({ item: current, queuedAt: newAttempted });
    if (newWins >= WIN_TARGET || newAttempted >= MAX_ATTEMPTS) { finish(); return; }
    const next = pickNext(QUIZ, newAttempted);
    if (!next) { finish(); return; }
    usedIdsRef.current.add(next.item.id);
    setWins(newWins);
    setAttempted(newAttempted);
    setCurrent(next.item);
    setIsRetry(next.retry);
    // Only worth saying when the question actually is the harder one.
    setHarderNow(steppedUp && !next.retry);
    setAnswer(null);
    setSubmitted(false);
    setHintShown(false);
  };

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <VTopBar transparent showBack onBack={() => go(fromPractice ? 'practice' : 'home')}
        right={<Stars wins={wins} target={WIN_TARGET}
          label={t('navigable.starsToGo', { count: WIN_TARGET - wins })} />}
      />

      {state?.coachStep === 3 && (
        <CoachHint
          text={t('navigable.coachHint')}
          cta={t('navigable.coachCta')}
          onDismiss={() => set({ coachStep: 99, ownPlan: false })}
        />
      )}

      {/* question area — bottom padding clears the fixed action bar */}
      <div style={{ padding: '72px 24px 132px', flex: 1 }}>
        {/* The rules, once, on the first question: nothing else on screen said
            how the quiz ends, which is what left students counting questions. */}
        {attempted === 0 && !submitted && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: 'var(--indigo-air)', borderRadius: 14, padding: '12px 14px', marginBottom: 18 }}>
            <VIcon name="star-fill" size={14} color="var(--saffron)" />
            <div style={{ flex: 1, fontFamily: 'Inter', fontSize: 12.5, color: 'var(--ink)', lineHeight: 1.55 }}>
              {t('navigable.rules', { target: WIN_TARGET })}
            </div>
          </div>
        )}

        {/* At most ONE chip, so there's never a row of badges to decode:
            this-came-back beats you-earned-harder-ones beats you're-on-a-run. */}
        {(isRetry || harderNow || streak >= 3) && (
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
            {isRetry ? (
              <span style={{ ...CHIP, color: '#B45309', background: '#FFF7ED', border: '1px solid var(--accent-warn)' }}>
                {t('navigable.secondTry')}
              </span>
            ) : harderNow ? (
              <span style={{ ...CHIP, color: 'var(--indigo)', background: 'var(--indigo-air)', border: '1px solid var(--indigo-soft)' }}>
                {t('navigable.harderNow')}
              </span>
            ) : (
              <span style={{ ...CHIP, color: 'var(--saffron)', background: '#FFF3EA', border: '1px solid var(--saffron)' }}>
                {t('navigable.streakChip', { count: streak })}
              </span>
            )}
          </div>
        )}

        <h1 style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 23, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.28, marginBottom: 22 }}>
          {heading}
        </h1>

        {q.hint && !submitted && (
          hintShown ? (
            <div className="v-enter-fade" style={{ display: 'flex', gap: 9, background: 'var(--indigo-air)', borderRadius: 14, padding: '11px 14px', marginBottom: 16 }}>
              <span style={{ fontSize: 14, lineHeight: 1 }}>💡</span>
              <span style={{ flex: 1, fontFamily: 'Inter', fontSize: 13, color: 'var(--ink)', lineHeight: 1.5 }}>{q.hint}</span>
            </div>
          ) : (
            <button className="v-tap" onClick={() => setHintShown(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff', border: '1px solid var(--indigo-soft)', borderRadius: 9999, padding: '7px 14px', marginBottom: 16, fontFamily: 'Inter', fontSize: 12, fontWeight: 700, color: 'var(--indigo)' }}>
              💡 {t('navigable.hintBtn')}
            </button>
          )
        )}

        <QuestionBody
          q={q}
          answer={answer}
          submitted={submitted}
          onChange={(a) => { if (!submitted) setAnswer(a); }}
          onCommit={AUTO_SUBMIT.includes(q.format) ? () => setSubmitted(true) : undefined}
        />
      </div>

      {/* Check — only the formats that need several taps get a submit button */}
      {!submitted && !AUTO_SUBMIT.includes(q.format) && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 45, padding: '14px 22px 26px', background: 'linear-gradient(to top, var(--bg) 62%, transparent)' }}>
          <button className="v-btn-primary v-tap" disabled={!canSubmit}
            onClick={() => setSubmitted(true)}
            style={{ width: '100%', opacity: canSubmit ? 1 : 0.45, cursor: canSubmit ? 'pointer' : 'default' }}>
            {t('navigable.check')}
          </button>
        </div>
      )}

      {/* feedback panel — slides up after answering */}
      {submitted && (
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
              {isCorrect ? t('navigable.correctTitle') : t('navigable.wrongTitle')}
            </div>
          </div>
          <div style={{ fontFamily: 'Inter', fontSize: 13, color: isCorrect ? '#2D7A50' : '#9B3030', lineHeight: 1.55, marginBottom: isCorrect ? 16 : 8, paddingLeft: 38 }}>
            {/* MCQ carries a note per wrong option — say exactly which mix-up this was. */}
            {(!isCorrect && q.format === 'mcq' && answer?.kind === 'index' ? q.optionNotes?.[answer.value] : null) || q.explanation}
          </div>
          {!isCorrect && !endsNext && (
            <div style={{ fontFamily: 'Inter', fontSize: 12, fontWeight: 600, color: '#9B3030', opacity: 0.8, lineHeight: 1.5, marginBottom: 16, paddingLeft: 38 }}>
              {t('navigable.askAgain')}
            </div>
          )}
          <button className="v-btn-primary v-tap" onClick={handleNext} style={{ background: isCorrect ? '#1A7A4A' : '#C84040', border: 'none' }}>
            {endsNext ? t('navigable.seeResults') : t('navigable.nextQuestion')} <VIcon name="arrow-right" size={14} color="#fff" />
          </button>
        </div>
      )}
    </div>
  );
}
