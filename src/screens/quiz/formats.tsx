import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import VIcon from '../../prototype/icons';
import { shuffledIndices, type Question, type Answer } from '../../lib/quizFormats';

// ─────────────────────────────────────────────────────────────
//  How each question format is answered on screen.
//
//  Every renderer takes the same four props and owns only the input — the
//  quiz screen keeps the marking, the feedback and the loop. Once `submitted`
//  is true nothing is interactive and the right answer is shown in place, so
//  the student reads their mistake against the correct version.
// ─────────────────────────────────────────────────────────────

export interface FormatProps {
  q: Question;
  answer: Answer | null;
  submitted: boolean;
  onChange: (a: Answer) => void;
  /** Formats where one tap IS the answer submit immediately; the rest wait for Check. */
  onCommit?: () => void;
}

const RIGHT = '#1A7A4A', WRONG = '#C84040';
const CARD: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 12, width: '100%',
  padding: '14px 16px', borderRadius: 14, textAlign: 'left',
  background: '#fff', border: '1px solid var(--border)', color: 'var(--ink)',
  fontFamily: 'Inter', fontSize: 15, fontWeight: 500, transition: 'all 180ms ease',
};

/** Shared "chosen / right / wrong / dimmed" styling for tappable rows. */
function rowStyle(submitted: boolean, chosen: boolean, correct: boolean): React.CSSProperties {
  if (!submitted) {
    return { ...CARD, ...(chosen ? { border: '2px solid var(--indigo)', background: 'var(--indigo-air)' } : {}), cursor: 'pointer' };
  }
  if (correct) return { ...CARD, background: '#EDFAF3', border: `2px solid ${RIGHT}`, color: RIGHT, cursor: 'default' };
  if (chosen) return { ...CARD, background: '#FEF2F2', border: `2px solid ${WRONG}`, color: WRONG, cursor: 'default' };
  return { ...CARD, color: 'var(--muted-2)', border: '1px solid var(--border-soft)', opacity: 0.45, cursor: 'default' };
}

function Bullet({ submitted, chosen, correct, label }: { submitted: boolean; chosen: boolean; correct: boolean; label: string }) {
  const showRight = submitted && correct;
  const showWrong = submitted && chosen && !correct;
  return (
    <div style={{
      width: 26, height: 26, borderRadius: '50%', flexShrink: 0, display: 'flex',
      alignItems: 'center', justifyContent: 'center', transition: 'all 180ms',
      background: showRight ? RIGHT : showWrong ? WRONG : chosen && !submitted ? 'var(--indigo)' : 'var(--bg-warm)',
      border: showRight || showWrong || (chosen && !submitted) ? 'none' : '1px solid var(--border)',
    }}>
      {showRight && <VIcon name="check" size={12} color="#fff" strokeWidth={2.5} />}
      {showWrong && <VIcon name="x" size={12} color="#fff" strokeWidth={2.5} />}
      {!showRight && !showWrong && (
        <span style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: 700, color: chosen && !submitted ? '#fff' : 'var(--muted)' }}>{label}</span>
      )}
    </div>
  );
}

// ── MCQ ──────────────────────────────────────────────────────
function Mcq({ q, answer, submitted, onChange, onCommit }: FormatProps) {
  if (q.format !== 'mcq') return null;
  const picked = answer?.kind === 'index' ? answer.value : null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {q.opts.map((opt, i) => (
        <button key={i} className="v-tap" disabled={submitted}
          onClick={() => { onChange({ kind: 'index', value: i }); onCommit?.(); }}
          style={rowStyle(submitted, picked === i, i === q.correct)}>
          <Bullet submitted={submitted} chosen={picked === i} correct={i === q.correct} label={['A', 'B', 'C', 'D'][i]} />
          {opt}
        </button>
      ))}
    </div>
  );
}

// ── Typed answer: numeric + fill in the blank ────────────────
function Typed({ q, answer, submitted, onChange }: FormatProps) {
  const { t } = useTranslation('quiz');
  if (q.format !== 'numeric' && q.format !== 'blank') return null;
  const value = answer?.kind === 'text' ? answer.value : '';
  const right = q.format === 'numeric' ? (q.unit ? `${q.answer} ${q.unit}` : q.answer) : q.answer;

  return (
    <div>
      {q.format === 'blank' && (
        // The gap is rendered as the actual input, so the sentence reads as one line.
        <div style={{ fontFamily: 'Inter', fontSize: 16, lineHeight: 2, color: 'var(--ink)', marginBottom: 18 }}>
          {q.sentence.split('___').map((part, i, all) => (
            <React.Fragment key={i}>
              {part}
              {i < all.length - 1 && (
                <span style={{
                  display: 'inline-block', minWidth: 74, margin: '0 4px', textAlign: 'center',
                  borderBottom: `2px solid ${submitted ? 'transparent' : 'var(--indigo)'}`,
                  fontWeight: 700, color: submitted ? 'var(--muted-2)' : 'var(--indigo)',
                }}>{value || '?'}</span>
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <input
          autoFocus
          value={value}
          disabled={submitted}
          onChange={(e) => onChange({ kind: 'text', value: e.target.value })}
          inputMode={q.format === 'numeric' ? 'decimal' : 'text'}
          placeholder={t(q.format === 'numeric' ? 'formats.typeNumber' : 'formats.typeAnswer')}
          style={{
            flex: 1, minWidth: 0, padding: '15px 17px', borderRadius: 14,
            border: '1px solid var(--border)', background: '#fff',
            fontFamily: "'Quicksand','Nunito',system-ui,sans-serif",
            fontSize: 20, fontWeight: 700, color: 'var(--ink)', outline: 'none',
          }}
        />
        {q.format === 'numeric' && q.unit && (
          <span style={{ fontFamily: 'Inter', fontSize: 15, fontWeight: 600, color: 'var(--muted)', flexShrink: 0 }}>{q.unit}</span>
        )}
      </div>

      {submitted && (
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <VIcon name="check" size={13} color={RIGHT} strokeWidth={2.5} />
          <span style={{ fontFamily: 'Inter', fontSize: 13.5, fontWeight: 700, color: RIGHT }}>
            {t('formats.theAnswerIs', { answer: right })}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Match the following ──────────────────────────────────────
function Match({ q, answer, submitted, onChange }: FormatProps) {
  const { t } = useTranslation('quiz');
  const [activeRow, setActiveRow] = useState<number | null>(0);
  if (q.format !== 'match') return null;
  const pairs = answer?.kind === 'pairs' ? answer.value : q.left.map(() => null);

  const assign = (rightIdx: number) => {
    if (submitted || activeRow === null) return;
    const next = [...pairs];
    // A right item belongs to one row only — taking it frees whoever had it.
    const previousOwner = next.indexOf(rightIdx);
    if (previousOwner >= 0) next[previousOwner] = null;
    next[activeRow] = rightIdx;
    onChange({ kind: 'pairs', value: next });
    const nextEmpty = next.findIndex((v) => v === null);
    setActiveRow(nextEmpty >= 0 ? nextEmpty : null);
  };

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {q.left.map((l, i) => {
          const chosen = pairs[i];
          const isRight = submitted && chosen === q.pairs[i];
          const isActive = !submitted && activeRow === i;
          return (
            <button key={i} className="v-tap" disabled={submitted} onClick={() => setActiveRow(i)}
              style={{
                ...CARD, gap: 10, alignItems: 'center',
                border: submitted
                  ? `2px solid ${isRight ? RIGHT : WRONG}`
                  : isActive ? '2px solid var(--indigo)' : '1px solid var(--border)',
                background: submitted ? (isRight ? '#EDFAF3' : '#FEF2F2') : isActive ? 'var(--indigo-air)' : '#fff',
                cursor: submitted ? 'default' : 'pointer',
              }}>
              <span style={{ flex: 1, minWidth: 0, fontSize: 14.5 }}>{l}</span>
              <VIcon name="arrow-right" size={14} color="var(--muted-2)" />
              <span style={{
                minWidth: 64, textAlign: 'center', padding: '5px 10px', borderRadius: 9999,
                fontFamily: 'Inter', fontSize: 13, fontWeight: 700,
                background: chosen === null ? 'var(--bg-warm)' : submitted ? 'transparent' : 'var(--indigo)',
                color: chosen === null ? 'var(--muted-2)' : submitted ? (isRight ? RIGHT : WRONG) : '#fff',
                border: chosen === null ? '1px dashed var(--border)' : 'none',
              }}>
                {chosen === null ? '?' : q.right[chosen]}
              </span>
            </button>
          );
        })}
      </div>

      {submitted ? (
        <div style={{ padding: '12px 14px', background: 'var(--bg-warm)', borderRadius: 12 }}>
          <div className="v-eyebrow-sm" style={{ marginBottom: 6 }}>{t('formats.correctPairs')}</div>
          {q.left.map((l, i) => (
            <div key={i} style={{ fontFamily: 'Inter', fontSize: 13, color: 'var(--ink)', lineHeight: 1.7 }}>
              {l} <span style={{ color: 'var(--muted-2)' }}>→</span> <strong>{q.right[q.pairs[i]]}</strong>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="v-eyebrow-sm" style={{ marginBottom: 8 }}>{t('formats.tapToMatch')}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {q.right.map((r, i) => {
              const used = pairs.includes(i);
              return (
                <button key={i} className="v-tap" onClick={() => assign(i)}
                  style={{
                    padding: '10px 15px', borderRadius: 9999, fontFamily: 'Inter', fontSize: 14, fontWeight: 600,
                    background: used ? 'var(--bg-warm)' : '#fff',
                    border: `1px solid ${used ? 'var(--border-soft)' : 'var(--indigo-soft)'}`,
                    color: used ? 'var(--muted-2)' : 'var(--indigo)',
                    opacity: used ? 0.55 : 1, cursor: 'pointer',
                  }}>
                  {r}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ── Put the steps in order ───────────────────────────────────
function Order({ q, answer, submitted, onChange }: FormatProps) {
  const { t } = useTranslation('quiz');
  if (q.format !== 'order') return null;
  // Shuffled once per question, seeded by its id, so steps never rearrange
  // under the student mid-question.
  const display = useMemo(() => shuffledIndices(q.steps.length, q.id + 1), [q.id, q.steps.length]);
  const seq = answer?.kind === 'sequence' ? answer.value : [];

  const tap = (stepIdx: number) => {
    if (submitted) return;
    const at = seq.indexOf(stepIdx);
    // Tapping a chosen step again takes it (and everything after) back off.
    onChange({ kind: 'sequence', value: at >= 0 ? seq.slice(0, at) : [...seq, stepIdx] });
  };

  return (
    <div>
      <div className="v-eyebrow-sm" style={{ marginBottom: 8 }}>{t('formats.tapInOrder')}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {display.map((stepIdx) => {
          const pos = seq.indexOf(stepIdx);
          const chosen = pos >= 0;
          // After submitting, a step is right if the student put it where it belongs.
          const placedRight = submitted && pos === stepIdx;
          return (
            <button key={stepIdx} className="v-tap" disabled={submitted} onClick={() => tap(stepIdx)}
              style={{
                ...CARD, alignItems: 'flex-start', gap: 11, fontSize: 14,
                border: submitted
                  ? `2px solid ${placedRight ? RIGHT : WRONG}`
                  : chosen ? '2px solid var(--indigo)' : '1px solid var(--border)',
                background: submitted ? (placedRight ? '#EDFAF3' : '#FEF2F2') : chosen ? 'var(--indigo-air)' : '#fff',
                cursor: submitted ? 'default' : 'pointer',
              }}>
              <span style={{
                width: 24, height: 24, borderRadius: '50%', flexShrink: 0, display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter', fontSize: 11.5, fontWeight: 700,
                background: chosen ? (submitted ? (placedRight ? RIGHT : WRONG) : 'var(--indigo)') : 'var(--bg-warm)',
                color: chosen ? '#fff' : 'var(--muted-2)',
                border: chosen ? 'none' : '1px solid var(--border)',
              }}>
                {chosen ? pos + 1 : '·'}
              </span>
              <span style={{ flex: 1, minWidth: 0, lineHeight: 1.45, paddingTop: 2 }}>{q.steps[stepIdx]}</span>
            </button>
          );
        })}
      </div>

      {submitted && (
        <div style={{ marginTop: 14, padding: '12px 14px', background: 'var(--bg-warm)', borderRadius: 12 }}>
          <div className="v-eyebrow-sm" style={{ marginBottom: 6 }}>{t('formats.correctOrder')}</div>
          {q.steps.map((s, i) => (
            <div key={i} style={{ fontFamily: 'Inter', fontSize: 13, color: 'var(--ink)', lineHeight: 1.65 }}>
              <strong>{i + 1}.</strong> {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── True or false, and why ───────────────────────────────────
function TrueFalse({ q, answer, submitted, onChange }: FormatProps) {
  const { t } = useTranslation('quiz');
  if (q.format !== 'tf') return null;
  const truth = answer?.kind === 'tf' ? answer.truth : null;
  const reason = answer?.kind === 'tf' ? answer.reason : null;

  return (
    <div>
      <div style={{ padding: '15px 17px', background: '#fff', borderRadius: 14, border: '1px solid var(--border)', marginBottom: 16 }}>
        <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 17, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.4 }}>
          {q.statement}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: reason !== null || truth !== null ? 18 : 0 }}>
        {[true, false].map((v) => {
          const chosen = truth === v;
          const isRight = submitted && v === q.isTrue;
          return (
            <button key={String(v)} className="v-tap" disabled={submitted}
              onClick={() => onChange({ kind: 'tf', truth: v, reason })}
              style={{
                flex: 1, padding: '14px 10px', borderRadius: 14, fontFamily: "'Quicksand','Nunito',system-ui,sans-serif",
                fontSize: 16, fontWeight: 700, transition: 'all 180ms',
                background: submitted ? (isRight ? '#EDFAF3' : chosen ? '#FEF2F2' : '#fff') : chosen ? 'var(--indigo)' : '#fff',
                border: submitted
                  ? `2px solid ${isRight ? RIGHT : chosen ? WRONG : 'var(--border-soft)'}`
                  : chosen ? '2px solid var(--indigo)' : '1px solid var(--border)',
                color: submitted ? (isRight ? RIGHT : chosen ? WRONG : 'var(--muted-2)') : chosen ? '#fff' : 'var(--ink)',
                cursor: submitted ? 'default' : 'pointer',
              }}>
              {t(v ? 'formats.true' : 'formats.false')}
            </button>
          );
        })}
      </div>

      {/* The reason is the real question — it only appears once a side is picked. */}
      {truth !== null && (
        <div className="v-enter-fade">
          <div className="v-eyebrow-sm" style={{ marginBottom: 8 }}>{t('formats.whyBecause')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {q.reasons.map((r, i) => (
              <button key={i} className="v-tap" disabled={submitted}
                onClick={() => onChange({ kind: 'tf', truth, reason: i })}
                style={{ ...rowStyle(submitted, reason === i, i === q.correctReason), fontSize: 14 }}>
                <Bullet submitted={submitted} chosen={reason === i} correct={i === q.correctReason} label={['A', 'B', 'C', 'D'][i]} />
                {r}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Spot the mistake ─────────────────────────────────────────
function FindMistake({ q, answer, submitted, onChange, onCommit }: FormatProps) {
  const { t } = useTranslation('quiz');
  if (q.format !== 'mistake') return null;
  const picked = answer?.kind === 'index' ? answer.value : null;

  return (
    <div>
      <div className="v-eyebrow-sm" style={{ marginBottom: 8 }}>{t('formats.tapWrongStep')}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {q.steps.map((s, i) => {
          const isWrongStep = i === q.wrongStep;
          return (
            <button key={i} className="v-tap" disabled={submitted}
              onClick={() => { onChange({ kind: 'index', value: i }); onCommit?.(); }}
              style={{
                ...CARD, gap: 11,
                fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 17, fontWeight: 700,
                border: submitted
                  ? (isWrongStep ? `2px solid ${WRONG}` : picked === i ? `2px solid ${'#B45309'}` : '1px solid var(--border-soft)')
                  : picked === i ? '2px solid var(--indigo)' : '1px solid var(--border)',
                background: submitted ? (isWrongStep ? '#FEF2F2' : '#fff') : picked === i ? 'var(--indigo-air)' : '#fff',
                color: submitted && isWrongStep ? WRONG : 'var(--ink)',
                opacity: submitted && !isWrongStep && picked !== i ? 0.5 : 1,
                cursor: submitted ? 'default' : 'pointer',
              }}>
              <span style={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0, display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter', fontSize: 10.5, fontWeight: 700,
                background: submitted && isWrongStep ? WRONG : 'var(--bg-warm)',
                color: submitted && isWrongStep ? '#fff' : 'var(--muted-2)',
                border: submitted && isWrongStep ? 'none' : '1px solid var(--border)',
              }}>
                {submitted && isWrongStep ? '✕' : i + 1}
              </span>
              <span style={{ flex: 1, minWidth: 0, lineHeight: 1.35 }}>{s}</span>
            </button>
          );
        })}
      </div>

      {submitted && (
        <div style={{ marginTop: 14, padding: '12px 14px', background: '#EDFAF3', borderRadius: 12, border: `1px solid #A8D5B9` }}>
          <div className="v-eyebrow-sm" style={{ marginBottom: 5 }}>{t('formats.shouldHaveBeen')}</div>
          <div style={{ fontFamily: 'Inter', fontSize: 13, color: '#1A7A4A', lineHeight: 1.55 }}>{q.fix}</div>
        </div>
      )}
    </div>
  );
}

// ── Router ───────────────────────────────────────────────────

/** Formats where a single tap is the whole answer, so waiting for a Check
 *  button would just add a step. */
export const AUTO_SUBMIT: Question['format'][] = ['mcq', 'mistake'];

export default function QuestionBody(props: FormatProps) {
  switch (props.q.format) {
    case 'mcq': return <Mcq {...props} />;
    case 'numeric':
    case 'blank': return <Typed {...props} />;
    case 'match': return <Match {...props} />;
    case 'order': return <Order {...props} />;
    case 'tf': return <TrueFalse {...props} />;
    case 'mistake': return <FindMistake {...props} />;
    default: return null;
  }
}
