import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import VIcon from '../../prototype/icons';
import { VTopBar, VidyaAvatar } from '../../prototype/shared';
import { classChapters, chapterByIdC } from '../../content/syllabus';
import api from '../../api/vidya';
import { appendActivity } from '../../lib/progress';
import { applyResult } from '../../lib/mastery';
import { parsePool, isCorrect as gradeAnswer, isComplete, answerText, correctText, type Question, type Answer } from '../../lib/quizFormats';
import {
  newRun, recordAnswer, currentTopic, resultFor, isRunComplete, statusFor,
  wantsBreather, clearBreather, nextQuestionId, summarise, skipTopic,
  CLEAR_TARGET, type RunState, type RunTopic, type TopicStatus,
} from '../../lib/revisionRun';
import QuestionBody, { AUTO_SUBMIT } from './formats';
import type { ScreenProps, ActivityEntry, MasteryMap, PracticeSelection } from '../../types';

// ─────────────────────────────────────────────────────────────
//  Revision run — "clear the whole chapter, topic by topic".
//
//  A 9-question quiz cannot revise an 11-topic chapter, so this is a different
//  shape: progress is measured in TOPICS COVERED, not stars. Each subtopic is a
//  gate (2 right to clear, up to 4 tries) and every question says which subtopic
//  it belongs to, so the student always knows what is being tested.
//
//  Mastery credit is banked the moment a topic finishes, so stopping half way
//  still counts — and 2-4 real questions per subtopic is finally enough
//  evidence for a level to move (MIN_EVIDENCE is 5, accumulated across runs).
// ─────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<TopicStatus, { bg: string; fg: string }> = {
  cleared:   { bg: '#1A7A4A', fg: '#fff' },
  needswork: { bg: '#E8A33D', fg: '#fff' },
  current:   { bg: 'var(--indigo)', fg: '#fff' },
  pending:   { bg: 'var(--border)', fg: 'var(--muted-2)' },
};

/** The chapter map: one segment per subtopic, so the whole run is visible at a
 *  glance and the student can see the chapter filling in. */
function ChapterMap({ run }: { run: RunState }) {
  return (
    <div style={{ display: 'flex', gap: 3, marginBottom: 14 }}>
      {run.topics.map((t, i) => {
        const status = statusFor(run, t.num, i);
        const c = STATUS_COLOR[status];
        return (
          <div key={t.num} title={t.title} style={{
            flex: 1, height: 6, borderRadius: 3, background: c.bg,
            transition: 'background 300ms ease',
            outline: status === 'current' ? '2px solid var(--indigo-soft)' : 'none',
            outlineOffset: 1,
          }} />
        );
      })}
    </div>
  );
}

/** Progress inside the current subtopic: how many right it still needs. Two
 *  stars, because the whole-run progress is the map above — different scopes,
 *  and each one is labelled. */
function TopicStars({ right }: { right: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2, verticalAlign: 'middle' }}>
      {Array.from({ length: CLEAR_TARGET }, (_, i) => (
        <VIcon key={i} name={i < right ? 'star-fill' : 'star'} size={12}
          color={i < right ? 'var(--saffron)' : 'var(--border)'} strokeWidth={1.8} />
      ))}
    </span>
  );
}

export default function RevisionRunScreen({ go, state, set }: ScreenProps) {
  const { t } = useTranslation(['quiz', 'common']);
  const cls = api.toGrade(state?.classLevel);
  const chapter = chapterByIdC(cls, state?.chapterId as string) || classChapters(cls)[0];

  // A picked subset of subtopics (from the session or practice picker); absent
  // means the whole chapter.
  const [picked] = useState<PracticeSelection[] | null>(() => {
    const sel = state?.revisionSel as PracticeSelection[] | undefined | null;
    return sel?.length ? sel : null;
  });
  useEffect(() => {
    if (state?.revisionSel && set) set({ revisionSel: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resume the saved run when it's for this chapter, else start a fresh one.
  const [run, setRun] = useState<RunState>(() => {
    const saved = state?.revisionRun as RunState | undefined | null;
    if (!picked && saved && saved.chapterId === chapter.id && !isRunComplete(saved)) return saved;
    const topics: RunTopic[] = picked
      ? picked.filter((p) => p.section).map((p) => ({ num: String(p.section), title: p.title }))
      : chapter.subtopics.map((s) => ({ num: s.num, title: s.title }));
    return newRun(chapter.id, chapter.title, cls, topics.length ? topics
      : chapter.subtopics.map((s) => ({ num: s.num, title: s.title })));
  });
  const [pool, setPool] = useState<Question[] | null>(null);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [hintShown, setHintShown] = useState(false);
  const [breather, setBreather] = useState(false);
  const [finished, setFinished] = useState(false);
  const [toppingUp, setToppingUp] = useState(false);
  const [failed, setFailed] = useState(false);
  // Topics already banked into mastery, so a resumed run can't double-count.
  const bankedRef = useRef<Set<string>>(new Set());
  // Wrong answers per subtopic, so "Fix your tricky ones" on Home has something
  // to work with after a revision run.
  const missesRef = useRef<Map<string, { question: string; user_answer: string; correct_answer: string }[]>>(new Map());
  // Failed top-ups per subtopic. Past the cap the run moves on rather than
  // leaving the student on a topic that can never produce another question.
  const topUpTriesRef = useRef<Map<string, number>>(new Map());

  const topic = currentTopic(run);
  const done = resultFor(run, topic?.num || '');

  const load = (todo: RunTopic[]) => {
    setPool(null);
    setFailed(false);
    api.generateRevision({
      subtopics: todo, grade: cls, language: state?.language || 'English',
      chapterId: chapter.id, perTopic: CLEAR_TARGET,
    })
      .then((items) => setPool(parsePool(items)))
      .catch(() => { setFailed(true); setPool([]); });
  };

  // Only the topics still to do need questions — a resumed run doesn't pay to
  // regenerate what's already cleared.
  useEffect(() => {
    const todo = run.topics.slice(run.index);
    if (!todo.length) { setPool([]); setFinished(true); return; }
    load(todo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist after every change: the back button is a legitimate "stop for now".
  useEffect(() => { set && set({ revisionRun: run }); /* eslint-disable-next-line */ }, [run]);

  const qId = pool ? nextQuestionId(run, pool) : null;
  const q = pool?.find((x) => x.id === qId) || null;

  // The pool holds CLEAR_TARGET questions per topic. A student who needs more
  // than that has missed one, so fetch more for THIS topic only — fired while
  // they're still reading the feedback, which hides most of the wait.
  useEffect(() => {
    if (!pool || !topic || finished || breather) return;
    if (q || done.done || toppingUp) return;
    let alive = true;
    setToppingUp(true);
    const num = topic.num;
    const giveUp = () => {
      const tries = (topUpTriesRef.current.get(num) || 0) + 1;
      topUpTriesRef.current.set(num, tries);
      if (tries >= 2) {
        const next = skipTopic(run);
        bankTopic(topic, done.right, done.asked);
        setRun(next);
        if (isRunComplete(next)) setFinished(true);
      }
    };
    api.generateRevision({
      subtopics: [topic], grade: cls, language: state?.language || 'English',
      chapterId: chapter.id, perTopic: 2,
      exclude: pool.filter((x) => done.used.includes(x.id)).map((x) => x.q),
    })
      .then((items) => {
        if (!alive) return;
        const nextId = Math.max(0, ...pool.map((x) => x.id)) + 1;
        // We asked for exactly this subtopic, so tag the answers with it. A
        // question labelled with the wrong section could never be served, and
        // the run would top up forever waiting for one that matched.
        const extra = parsePool(items).map((x, i) => ({ ...x, id: nextId + i, section: num }));
        setToppingUp(false);
        if (!extra.length) { giveUp(); return; }
        setPool([...pool, ...extra]);
      })
      .catch(() => { if (alive) { setToppingUp(false); giveUp(); } });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool, topic?.num, done.asked, done.done, finished, breather]);

  /** Bank one finished topic into mastery and the activity log. */
  const bankTopic = (tp: RunTopic, right: number, asked: number) => {
    if (!set || bankedRef.current.has(tp.num) || !asked) return;
    bankedRef.current.add(tp.num);
    const entry: ActivityEntry = {
      kind: 'quiz', date: new Date().toISOString(), topic: tp.title,
      chapterId: chapter.id, section: tp.num, score: right, total: asked,
      mistakes: missesRef.current.get(tp.num) || [],
    };
    const oldMap = (state?.mastery as MasteryMap) || {};
    set({
      mastery: applyResult(oldMap, entry),
      activityLog: appendActivity(state?.activityLog, entry),
    });
  };

  const onNext = () => {
    if (!q || !topic) return;
    const right = gradeAnswer(q, answer);
    if (!right) {
      const list = missesRef.current.get(topic.num) || [];
      list.push({ question: q.q, user_answer: answerText(q, answer), correct_answer: correctText(q) });
      missesRef.current.set(topic.num, list);
    }
    const before = resultFor(run, topic.num);
    const next = recordAnswer(run, q.id, right);
    const after = resultFor(next, topic.num);
    // The topic just finished — bank it now, so stopping early still counts.
    if (after.done && !before.done) bankTopic(topic, after.right, after.asked);

    setAnswer(null);
    setSubmitted(false);
    setHintShown(false);

    if (isRunComplete(next)) { setRun(next); setFinished(true); return; }
    if (wantsBreather(next)) { setRun(clearBreather(next)); setBreather(true); return; }
    setRun(next);
  };

  // ── Loading / failure ──────────────────────────────────────
  if (!pool) {
    return (
      <div style={{ minHeight: '100%', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
        <VTopBar transparent showBack onBack={() => go('home')} title={t('revise.topbar')} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32, minHeight: '70vh' }}>
          <VidyaAvatar size={64} animated />
          <div style={{ fontFamily: 'Inter', fontSize: 14, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.5 }}>
            {t('revise.building', { chapter: chapter.title })}
          </div>
          <div style={{ fontFamily: 'Inter', fontSize: 12.5, color: 'var(--muted-2)', textAlign: 'center' }}>
            {t('revise.buildingSub', { count: run.topics.length - run.index })}
          </div>
        </div>
      </div>
    );
  }

  // ── Results ────────────────────────────────────────────────
  if (finished || failed) {
    const sum = summarise(run);
    return (
      <div style={{ minHeight: '100%', background: 'var(--bg)' }}>
        <VTopBar transparent showBack onBack={() => go('home')} title={t('revise.topbar')} />
        <div style={{ padding: '72px 22px 40px' }}>
          {failed && !sum.asked ? (
            <>
              <h1 className="v-h1" style={{ fontSize: 24, marginBottom: 8 }}>{t('revise.failed')}</h1>
              <button className="v-btn-secondary v-tap" style={{ width: '100%' }} onClick={() => go('home')}>
                {t('common:back')}
              </button>
            </>
          ) : (
            <>
              <div className="v-eyebrow" style={{ marginBottom: 6 }}>{t('revise.doneEyebrow')}</div>
              <h1 className="v-h1" style={{ fontSize: 26, marginBottom: 6, lineHeight: 1.2 }}>
                {t('revise.clearedCount', { cleared: sum.cleared, total: sum.total })}
              </h1>
              <p className="v-body" style={{ marginBottom: 20 }}>
                {t('revise.doneSub', { asked: sum.asked, right: sum.right })}
              </p>

              <ChapterMap run={run} />

              {/* Every subtopic, and where it stands. */}
              <div className="v-card" style={{ padding: '6px 16px', background: '#fff', marginBottom: 16 }}>
                {run.topics.map((tp, i) => {
                  const st = statusFor(run, tp.num, i);
                  const r = resultFor(run, tp.num);
                  return (
                    <div key={tp.num} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: i < run.topics.length - 1 ? '1px solid var(--border-soft)' : 'none' }}>
                      <div style={{ width: 20, height: 20, borderRadius: 9999, flexShrink: 0, background: STATUS_COLOR[st].bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {st === 'cleared' && <VIcon name="check" size={11} color="#fff" strokeWidth={3} />}
                        {st === 'needswork' && <VIcon name="target" size={11} color="#fff" strokeWidth={2.5} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: 'Inter', fontSize: 13, color: 'var(--ink)', lineHeight: 1.35 }}>{tp.title}</div>
                        {!!r.asked && (
                          <div style={{ fontFamily: 'Inter', fontSize: 11, color: 'var(--muted-2)' }}>
                            {t('revise.rightOf', { right: r.right, asked: r.asked })}
                          </div>
                        )}
                      </div>
                      <span style={{ fontFamily: 'Inter', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.04em', color: st === 'cleared' ? '#1A7A4A' : st === 'needswork' ? '#B45309' : 'var(--muted-2)' }}>
                        {t(st === 'cleared' ? 'revise.tagCleared' : st === 'needswork' ? 'revise.tagNeedsWork' : 'revise.tagNotDone')}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Revising the weak ones is the obvious next move, so make it one tap. */}
              {sum.needsWork.length > 0 && (
                <button className="v-btn-primary v-tap" style={{ width: '100%', marginBottom: 10 }}
                  onClick={() => {
                    // A fresh run over just the weak subtopics — new questions, and
                    // mastery bankable again since these are new attempts.
                    const again = newRun(chapter.id, chapter.title, cls, sum.needsWork);
                    bankedRef.current = new Set();
                    missesRef.current = new Map();
                    setRun(again);
                    setFinished(false);
                    set && set({ revisionRun: again });
                    load(sum.needsWork);
                  }}>
                  {t('revise.redoWeak', { count: sum.needsWork.length })}
                </button>
              )}
              <button className="v-btn-secondary v-tap" style={{ width: '100%' }}
                onClick={() => { set && set({ revisionRun: null }); go('home'); }}>
                {t('revise.finishUp')}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Breather ───────────────────────────────────────────────
  if (breather) {
    const sum = summarise(run);
    return (
      <div style={{ minHeight: '100%', background: 'var(--bg)' }}>
        <VTopBar transparent showBack onBack={() => go('home')} title={t('revise.topbar')} />
        <div style={{ padding: '72px 22px 40px' }}>
          <div className="v-eyebrow" style={{ marginBottom: 6 }}>{t('revise.breatherEyebrow')}</div>
          <h1 className="v-h1" style={{ fontSize: 25, marginBottom: 8, lineHeight: 1.2 }}>
            {t('revise.breatherTitle', { cleared: sum.cleared })}
          </h1>
          <p className="v-body" style={{ marginBottom: 18 }}>
            {t('revise.breatherSub', { count: run.topics.length - run.index })}
          </p>
          <ChapterMap run={run} />
          <div className="v-card" style={{ padding: '14px 16px', background: '#fff', marginBottom: 18 }}>
            <div style={{ fontFamily: 'Inter', fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.55 }}>
              {t('revise.nextUp')} <strong style={{ color: 'var(--ink)' }}>{currentTopic(run)?.title}</strong>
            </div>
          </div>
          <button className="v-btn-primary v-tap" style={{ width: '100%', marginBottom: 10 }}
            onClick={() => setBreather(false)}>
            {t('revise.keepGoing')} <VIcon name="arrow-right" size={14} color="#fff" />
          </button>
          <button className="v-btn-secondary v-tap" style={{ width: '100%' }} onClick={() => go('home')}>
            {t('revise.stopForNow')}
          </button>
        </div>
      </div>
    );
  }

  // ── Waiting on more questions for this topic ────────────────
  if (!q) {
    return (
      <div style={{ minHeight: '100%', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
        <VTopBar transparent showBack onBack={() => go('home')} title={t('revise.topbar')} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 32, minHeight: '60vh' }}>
          <VidyaAvatar size={56} animated />
          <div style={{ fontFamily: 'Inter', fontSize: 13.5, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.5 }}>
            {t('revise.moreQuestions', { topic: topic?.title || '' })}
          </div>
        </div>
      </div>
    );
  }

  // ── A question ─────────────────────────────────────────────
  const right = gradeAnswer(q, answer);
  const canSubmit = isComplete(q, answer);
  const heading = q.format === 'blank' && q.q === q.sentence ? t('formats.fillBlank')
    : q.format === 'tf' && q.q === q.statement ? t('formats.trueOrFalse')
    : q.q;

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <VTopBar transparent showBack onBack={() => go('home')}
        right={<span style={{ fontFamily: 'Inter', fontSize: 11.5, fontWeight: 700, color: 'var(--muted-2)' }}>
          {t('revise.topicOf', { n: run.index + 1, total: run.topics.length })}
        </span>}
      />

      <div style={{ padding: '68px 22px 132px', flex: 1 }}>
        <ChapterMap run={run} />

        {/* Which subtopic this question belongs to, and how it's going. */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            <span style={{ fontFamily: 'Inter', fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', color: 'var(--indigo)' }}>
              {topic?.num}
            </span>
            <TopicStars right={done.right} />
            <span style={{ fontFamily: 'Inter', fontSize: 10.5, color: 'var(--muted-2)' }}>
              {t('revise.toClear', { count: CLEAR_TARGET })}
            </span>
          </div>
          <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 15.5, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.3 }}>
            {topic?.title}
          </div>
        </div>

        <h1 style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.3, marginBottom: 20 }}>
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

      {!submitted && !AUTO_SUBMIT.includes(q.format) && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 45, padding: '14px 22px 26px', background: 'linear-gradient(to top, var(--bg) 62%, transparent)' }}>
          <button className="v-btn-primary v-tap" disabled={!canSubmit} onClick={() => setSubmitted(true)}
            style={{ width: '100%', opacity: canSubmit ? 1 : 0.45, cursor: canSubmit ? 'pointer' : 'default' }}>
            {t('navigable.check')}
          </button>
        </div>
      )}

      {submitted && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
          background: right ? '#EDFAF3' : '#FEF2F2',
          borderTop: `2px solid ${right ? '#1A7A4A' : '#C84040'}`,
          padding: '18px 22px 36px',
          animation: 'vSheetUp 0.3s cubic-bezier(.16,1,.3,1) both',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: right ? '#1A7A4A' : '#C84040', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <VIcon name={right ? 'check' : 'x'} size={13} color="#fff" strokeWidth={2.5} />
            </div>
            <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 16, fontWeight: 800, color: right ? '#1A7A4A' : '#C84040' }}>
              {right ? t('navigable.correctTitle') : t('navigable.wrongTitle')}
            </div>
          </div>
          <div style={{ fontFamily: 'Inter', fontSize: 13, color: right ? '#2D7A50' : '#9B3030', lineHeight: 1.55, marginBottom: 14, paddingLeft: 38 }}>
            {(!right && q.format === 'mcq' && answer?.kind === 'index' ? q.optionNotes?.[answer.value] : null) || q.explanation}
          </div>
          <button className="v-btn-primary v-tap" onClick={onNext}
            style={{ background: right ? '#1A7A4A' : '#C84040', border: 'none' }}>
            {t('revise.next')} <VIcon name="arrow-right" size={14} color="#fff" />
          </button>
        </div>
      )}
    </div>
  );
}
