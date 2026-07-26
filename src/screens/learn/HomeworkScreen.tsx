import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import VIcon from '../../prototype/icons';
import { VTopBar, VidyaAvatar } from '../../prototype/shared';
import api from '../../api/vidya';
import type { ScreenProps, HomeworkResult, HomeworkQuestion } from '../../types';

// ─────────────────────────────────────────────────────────────
//  Homework help — photograph tonight's homework, get NUDGED.
//  Each question reveals in three taps: hint → first step → full
//  working. The hint is always the cheapest thing to reach, so a
//  stuck student gets moving instead of copying an answer.
// ─────────────────────────────────────────────────────────────

// Reads a File → raw base64 + its real mime type, for the vision endpoint.
function readImage(file: File): Promise<{ b64: string; mime: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result);
      const mime = url.slice(5, url.indexOf(';')) || file.type || 'image/jpeg';
      resolve({ b64: url.split(',')[1] || '', mime });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

type Reveal = 0 | 1 | 2;   // 0 = hint, 1 = first step, 2 = full working

function QuestionCard({ q, idx }: { q: HomeworkQuestion; idx: number }) {
  const { t } = useTranslation(['learn', 'common']);
  const [open, setOpen] = useState(false);
  const [reveal, setReveal] = useState<Reveal>(0);

  return (
    <div className="v-card" style={{ padding: 0, overflow: 'hidden' }}>
      <div className="v-tap" onClick={() => setOpen((o) => !o)}
        style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px' }}>
        <div style={{ width: 28, height: 28, borderRadius: 9999, background: 'var(--indigo-air)', color: 'var(--indigo)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'Inter', fontSize: 11.5, fontWeight: 700 }}>
          {q.number || idx + 1}
        </div>
        <div style={{ flex: 1, minWidth: 0, fontFamily: 'Inter', fontSize: 13.5, color: 'var(--ink)', lineHeight: 1.5 }}>
          {q.question}
        </div>
        <VIcon name={open ? 'chevron-down' : 'chevron-right'} size={15} color="var(--muted-2)" />
      </div>

      {open && (
        <div className="v-enter-fade" style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border-soft)' }}>
          {/* Always the nudge first */}
          {q.hint && (
            <div style={{ marginTop: 14, padding: '11px 13px', background: 'var(--indigo-air)', borderRadius: 12 }}>
              <div className="v-eyebrow-sm" style={{ marginBottom: 3 }}>{t('homework.hint')}</div>
              <div style={{ fontFamily: 'Inter', fontSize: 12.5, color: 'var(--ink)', lineHeight: 1.5 }}>{q.hint}</div>
            </div>
          )}

          {reveal >= 1 && q.next_step && (
            <div className="v-enter-fade" style={{ marginTop: 10, padding: '11px 13px', background: 'var(--bg-warm)', borderRadius: 12 }}>
              <div className="v-eyebrow-sm" style={{ marginBottom: 3 }}>{t('homework.firstStep')}</div>
              <div style={{ fontFamily: 'Inter', fontSize: 12.5, color: 'var(--ink)', lineHeight: 1.5 }}>{q.next_step}</div>
            </div>
          )}

          {reveal >= 2 && (
            <div className="v-enter-fade" style={{ marginTop: 10 }}>
              {(q.steps || []).map((st, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 20, height: 20, borderRadius: 9999, background: 'var(--indigo-air)', color: 'var(--indigo)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'Inter', fontSize: 10, fontWeight: 700 }}>{i + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'Inter', fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>{st.label}</div>
                    <div style={{ fontFamily: 'Inter', fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.5 }}>{st.detail}</div>
                  </div>
                </div>
              ))}
              {q.answer && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#EDFAF3', border: '1px solid #A8D5B9', borderRadius: 12, padding: '9px 13px', marginTop: 4 }}>
                  <VIcon name="check" size={13} color="#1A7A4A" strokeWidth={2.5} />
                  <span style={{ fontFamily: 'Inter', fontSize: 13, fontWeight: 700, color: '#1A7A4A' }}>{q.answer}</span>
                </div>
              )}
            </div>
          )}

          {reveal < 2 && (
            <button className="v-tap" onClick={() => setReveal((r) => (r + 1) as Reveal)}
              style={{ marginTop: 12, background: 'transparent', border: '1px solid var(--border)', borderRadius: 9999, padding: '8px 14px', fontFamily: 'Inter', fontSize: 12, fontWeight: 600, color: 'var(--indigo)' }}>
              {reveal === 0 ? t('homework.stillStuck') : t('homework.showMeHow')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function HomeworkScreen({ go, state }: ScreenProps) {
  const { t } = useTranslation(['learn', 'common']);
  const cls = api.toGrade(state?.classLevel);
  const photoRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<HomeworkResult | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const onPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    setErr(null);
    setBusy(true);
    try {
      const read = await Promise.all(files.map(readImage));
      const res = await api.homeworkHelp({
        images: read.map((r) => r.b64),
        mimeTypes: read.map((r) => r.mime),
        grade: cls,
        language: state?.language || 'English',
      });
      setBusy(false);
      if (!res.detected || !res.questions?.length) { setErr(res.summary || t('homework.errNone')); return; }
      setResult(res);
    } catch {
      setBusy(false);
      setErr(t('homework.errGeneric'));
    }
  };

  if (busy) {
    return (
      <div style={{ minHeight: '100%', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
        <VTopBar transparent showBack onBack={() => go('home')} title={t('homework.topbar')} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, padding: 32, minHeight: '70vh' }}>
          <VidyaAvatar size={64} animated />
          <div style={{ fontFamily: 'Inter', fontSize: 14, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.5 }}>
            {t('homework.reading')}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)' }}>
      <VTopBar transparent showBack onBack={() => go('home')} title={t('homework.topbar')} />
      <input ref={photoRef} type="file" accept="image/*" capture="environment" multiple
        onChange={onPhotos} style={{ display: 'none' }} />

      <div style={{ padding: '72px 22px 40px' }}>
        {!result ? (
          <>
            <h1 className="v-h1" style={{ fontSize: 28, marginBottom: 8, lineHeight: 1.15 }}>{t('homework.title')}</h1>
            <p className="v-body" style={{ marginBottom: 22 }}>{t('homework.subtitle')}</p>

            {err && (
              <div style={{ marginBottom: 16, borderRadius: 14, padding: '12px 14px', background: 'var(--bg-warm)', border: '1px solid var(--saffron)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <VIcon name="camera" size={15} color="var(--saffron)" />
                <div style={{ flex: 1, fontFamily: 'Inter', fontSize: 12.5, color: 'var(--ink)', lineHeight: 1.45 }}>{err}</div>
              </div>
            )}

            <div className="v-card v-tap" onClick={() => { setErr(null); photoRef.current?.click(); }}
              style={{ padding: 24, textAlign: 'center', marginBottom: 16 }}>
              <div style={{ width: 68, height: 68, margin: '0 auto 14px', borderRadius: 20, background: 'var(--saffron)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <VIcon name="camera" size={30} color="#fff" />
              </div>
              <div style={{ fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 18, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>
                {t('homework.cta')}
              </div>
              <div style={{ fontFamily: 'Inter', fontSize: 12.5, color: 'var(--muted-2)', lineHeight: 1.45 }}>
                {t('homework.ctaSub')}
              </div>
            </div>

            <div style={{ fontFamily: 'Inter', fontSize: 11.5, color: 'var(--muted-2)', textAlign: 'center', lineHeight: 1.5 }}>
              {t('homework.promise')}
            </div>
          </>
        ) : (
          <>
            <div className="v-eyebrow" style={{ marginBottom: 6 }}>{t('homework.foundHeader')}</div>
            <h1 className="v-h1" style={{ fontSize: 24, marginBottom: 6, lineHeight: 1.2 }}>
              {t('homework.found', { count: result.questions.length })}
            </h1>
            <p className="v-body" style={{ marginBottom: 18 }}>{t('homework.foundSub')}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {result.questions.map((q, i) => <QuestionCard key={i} q={q} idx={i} />)}
            </div>

            <button className="v-btn-secondary v-tap" style={{ width: '100%' }}
              onClick={() => { setResult(null); setErr(null); }}>
              <VIcon name="camera" size={14} color="var(--ink)" /> {t('homework.another')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
