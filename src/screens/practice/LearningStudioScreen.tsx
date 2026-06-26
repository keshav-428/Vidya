import React, { useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import VIcon from '../../prototype/icons';
import { VTopBar } from '../../prototype/shared';
import type { ScreenProps, GoFn } from '../../types';

/* ─── Asked practice (when arriving via "Ask in your own words") ─── */
interface PracticeQuestion {
  q: string;
  opts: string[];
  correct: number;
}

const PRACTICE_QUESTIONS: PracticeQuestion[] = [
  { q: '¼ + ⅓ = ?', opts: ['7⁄12', '5⁄12', '2⁄7', '7⁄7'], correct: 0 },
  { q: '½ + ⅓ = ?', opts: ['2⁄5', '5⁄6', '3⁄5', '1⁄6'], correct: 1 },
  { q: '⅖ + ¼ = ?', opts: ['13⁄20', '9⁄20', '3⁄9', '2⁄9'], correct: 0 },
  { q: '⅓ + ⅙ = ?', opts: ['½', '⅔', '¼', '⅙'], correct: 0 },
  { q: '¾ + ⅙ = ?', opts: ['11⁄12', '9⁄10', '5⁄6', '7⁄9'], correct: 0 },
];

interface AskedPracticeProps {
  go: GoFn;
  topic: string;
}

function AskedPractice({ go, topic }: AskedPracticeProps) {
  const { t } = useTranslation(['practice', 'common']);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const cur = PRACTICE_QUESTIONS[idx];
  const correct = picked !== null && picked === cur.correct;

  const next = () => {
    if (picked === null) return;
    if (correct) setScore(s => s + 1);
    if (idx + 1 >= PRACTICE_QUESTIONS.length) setDone(true);
    else { setIdx(idx + 1); setPicked(null); }
  };

  if (done) {
    return (
      <div style={{ minHeight: '100%', background: 'var(--bg)' }}>
        <VTopBar transparent showBack onBack={() => go('practice')} />
        <div style={{ padding: '80px 24px 32px' }}>
          <div className="v-eyebrow" style={{ marginBottom: 8 }}>{t('learningStudio.asked.completeEyebrow')}</div>
          <h1 className="v-h1" style={{ fontSize: 32, marginBottom: 8, lineHeight: 1.15 }}>
            {score === PRACTICE_QUESTIONS.length ? t('learningStudio.asked.allCorrect') : score >= 3 ? t('learningStudio.asked.niceWork') : t('learningStudio.asked.keepAtIt')}
          </h1>
          <p className="v-body" style={{ marginBottom: 28 }}>
            <Trans i18nKey="learningStudio.asked.scoreLine" t={t} values={{ score, total: PRACTICE_QUESTIONS.length, topic }} components={{ 1: <strong /> }} />
          </p>
          <div className="v-card" style={{ padding: 20, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 9999,
              background: score === PRACTICE_QUESTIONS.length ? 'var(--accent-success)' : 'var(--accent-amber)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 20, color: '#fff' }}>{score}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 17, lineHeight: 1.25 }}>{topic}</div>
              <div style={{ fontSize: 11.5, color: 'var(--muted-2)', marginTop: 2 }}>
                {score === PRACTICE_QUESTIONS.length ? 'Mastery looks solid' : 'Worth another round'}
              </div>
            </div>
          </div>
          <button className="v-btn-primary v-tap" onClick={() => { setIdx(0); setPicked(null); setScore(0); setDone(false); }} style={{ marginBottom: 10 }}>
            Try 5 more <VIcon name="arrow-right" size={14} color="#fff" />
          </button>
          <button className="v-btn-secondary v-tap" onClick={() => go('practice')}>Back to Practice</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)' }}>
      <VTopBar transparent showBack onBack={() => go('practice')} right={<VIcon name="heart" size={20} color="var(--muted)" />} />
      <div style={{ padding: '72px 24px 32px' }}>
        <div className="v-eyebrow" style={{ marginBottom: 8 }}>YOU ASKED · PRACTICE</div>
        <h1 className="v-h1" style={{ fontSize: 26, marginBottom: 8, lineHeight: 1.2, letterSpacing: '-0.02em' }}>{topic}</h1>
        <p className="v-body" style={{ marginBottom: 20 }}>{PRACTICE_QUESTIONS.length} questions · pick the right answer</p>

        <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
          {PRACTICE_QUESTIONS.map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 4, borderRadius: 9999,
              background: i <= idx ? 'var(--ink)' : 'var(--border)',
              opacity: i === idx ? 1 : i < idx ? 0.6 : 1,
              transition: 'background .2s, opacity .2s',
            }} />
          ))}
        </div>

        <div className="v-card" style={{ padding: 24, marginBottom: 14 }}>
          <div className="v-eyebrow-sm" style={{ marginBottom: 10, color: 'var(--muted-2)' }}>Question {idx + 1} of {PRACTICE_QUESTIONS.length}</div>
          <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 30, marginBottom: 22, letterSpacing: '-0.01em' }}>{cur.q}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {cur.opts.map((o, i) => {
              const isPicked = picked === i;
              const isCorrect = picked !== null && i === cur.correct;
              const isWrong = isPicked && i !== cur.correct;
              return (
                <div key={o} className="v-tap" onClick={() => picked === null && setPicked(i)} style={{
                  textAlign: 'center', padding: '18px 0',
                  fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 22,
                  background: isCorrect ? '#F0F7F1' : isWrong ? '#FBEEEC' : '#fff',
                  border: isCorrect ? '1.5px solid var(--accent-success)' : isWrong ? '1.5px solid #C44A36' : '1px solid var(--border)',
                  borderRadius: 14, color: isWrong ? '#7A2A1B' : 'var(--ink)',
                  transition: 'all .15s',
                }}>{o}</div>
              );
            })}
          </div>
        </div>

        {picked !== null && (
          <div className="v-enter-fade" style={{
            background: correct ? '#F0F7F1' : '#FBEEEC',
            border: `1px solid ${correct ? 'rgba(58,124,72,0.25)' : 'rgba(196,74,54,0.25)'}`,
            borderRadius: 14, padding: '12px 14px', marginBottom: 14,
            display: 'flex', alignItems: 'flex-start', gap: 10,
          }}>
            <div style={{ width: 22, height: 22, borderRadius: 9999, flexShrink: 0, background: correct ? 'var(--accent-success)' : '#C44A36', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
              <VIcon name={correct ? 'check' : 'x'} size={12} color="#fff" strokeWidth={2.4} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 15, lineHeight: 1.35, marginBottom: 2 }}>
                {correct ? "That's right." : 'Not quite.'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.4 }}>
                {correct
                  ? 'Same denominator → add the numerators.'
                  : `The answer is ${cur.opts[cur.correct]}. Find the LCM, rename each fraction, then add the tops.`}
              </div>
            </div>
          </div>
        )}

        <button className="v-btn-primary v-tap" onClick={next} style={{ opacity: picked === null ? 0.4 : 1, transition: 'opacity .15s' }}>
          {idx + 1 >= PRACTICE_QUESTIONS.length ? 'Finish' : 'Next question'}
          <VIcon name="arrow-right" size={14} color="#fff" />
        </button>

        <button className="v-tap" onClick={() => go('concept-library')} style={{
          background: 'transparent', border: 'none', marginTop: 14,
          fontFamily: 'Inter', fontSize: 11.5, fontWeight: 600, letterSpacing: '0.04em',
          color: 'var(--muted-2)', display: 'flex', alignItems: 'center', gap: 5,
          width: '100%', justifyContent: 'center', padding: '8px 0',
        }}>
          <VIcon name="book" size={12} color="var(--muted-2)" /> Need the concept first? Look it up
        </button>
      </div>
    </div>
  );
}

/* ─── Main LearningStudio ─── */
export default function LearningStudioScreen({ go, state }: ScreenProps) {
  const [tab, setTab] = useState('learn');
  const asked = state?.askedTopic as string | undefined;
  const topicTitle = asked
    ? asked.charAt(0).toUpperCase() + asked.slice(1)
    : 'Adding fractions with different denominators';

  if (asked) return <AskedPractice go={go} topic={topicTitle} />;

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)' }}>
      <VTopBar transparent showBack onBack={() => go('practice')} right={<VIcon name="heart" size={20} color="var(--muted)" />} />
      <div style={{ padding: '72px 24px 32px' }}>
        <div className="v-eyebrow" style={{ marginBottom: 8 }}>FRACTIONS · LESSON 1 OF 12</div>
        <h1 className="v-h1" style={{ fontSize: 30, marginBottom: 8, lineHeight: 1.2 }}>{topicTitle}</h1>
        <p className="v-body" style={{ marginBottom: 24 }}>4 minute read · then practice</p>

        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
          {['learn', 'example', 'practice'].map(t => (
            <div key={t} className="v-tap" onClick={() => setTab(t)} style={{
              padding: '12px 16px', fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
              color: tab === t ? 'var(--ink)' : 'var(--muted-2)',
              borderBottom: tab === t ? '2px solid var(--ink)' : '2px solid transparent',
              marginBottom: -1,
            }}>{t}</div>
          ))}
        </div>

        {tab === 'learn' && (
          <div className="v-enter-fade">
            <p style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 18, lineHeight: 1.7, color: 'var(--ink)', marginBottom: 20 }}>
              When two fractions have <em>different denominators</em>, we can't add them directly. We first need to give them a <em>common base</em>.
            </p>
            <div style={{ background: '#fff', borderRadius: 20, border: '1px solid var(--border)', padding: 24, marginBottom: 20 }}>
              <div className="v-eyebrow-sm" style={{ color: 'var(--accent-blue)', marginBottom: 12 }}>Walk through</div>
              <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 32, textAlign: 'center', marginBottom: 8 }}>½ + ⅓</div>
              <div style={{ fontFamily: 'Inter', fontSize: 13, color: 'var(--muted)', textAlign: 'center', marginBottom: 16 }}>LCM of 2 and 3 is 6</div>
              <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 28, textAlign: 'center', marginBottom: 8, color: 'var(--accent-blue)' }}>3⁄6 + 2⁄6</div>
              <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 32, textAlign: 'center', color: 'var(--ink)' }}>= 5⁄6</div>
            </div>
            <div className="v-card" style={{ background: '#FFF9F0', borderColor: 'rgba(245,158,11,0.2)', marginBottom: 24 }}>
              <div className="v-eyebrow-sm" style={{ color: '#F59E0B', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <VIcon name="lightbulb" size={14} color="#F59E0B" /> Key insight
              </div>
              <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 17, color: 'var(--ink)', lineHeight: 1.5 }}>
                Finding the common denominator is just renaming each fraction so they speak the same language.
              </div>
            </div>
          </div>
        )}
        {tab === 'example' && (
          <div className="v-enter-fade">
            <p className="v-body" style={{ marginBottom: 16 }}>Try this with us:</p>
            <div className="v-card" style={{ padding: 24, marginBottom: 16 }}>
              <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 24, marginBottom: 14 }}>⅔ + ¼ = ?</div>
              <ol style={{ paddingLeft: 20, margin: 0, fontFamily: 'Inter', fontSize: 14, lineHeight: 1.7, color: 'var(--muted)' }}>
                <li>Find LCM of 3 and 4 → 12</li>
                <li>⅔ becomes 8⁄12, ¼ becomes 3⁄12</li>
                <li>Add the numerators: 8 + 3 = 11</li>
                <li>Answer: 11⁄12</li>
              </ol>
            </div>
          </div>
        )}
        {tab === 'practice' && (
          <div className="v-enter-fade">
            <div className="v-card" style={{ padding: 24 }}>
              <div className="v-eyebrow-sm" style={{ marginBottom: 10 }}>Try one</div>
              <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 24, marginBottom: 18 }}>¼ + ⅓ = ?</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {['7⁄12', '5⁄12', '2⁄7', '7⁄7'].map(o => (
                  <div key={o} className="v-tap v-card-soft" style={{ textAlign: 'center', padding: '18px 0', fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 20 }}>{o}</div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div style={{ marginTop: 24 }}>
          <div className="v-progress" style={{ marginBottom: 8 }}><div className="v-progress-fill" style={{ width: '8%' }} /></div>
          <div style={{ fontSize: 11, color: 'var(--muted-2)' }}>1 of 12 · Fractions track</div>
        </div>

        <button className="v-btn-primary v-tap" onClick={() => go('practice')} style={{ marginTop: 32 }}>
          Mark complete · Next lesson <VIcon name="arrow-right" size={14} color="#fff" />
        </button>
      </div>
    </div>
  );
}
