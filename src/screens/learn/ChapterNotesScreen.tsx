import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import VIcon from '../../prototype/icons';
import { VTopBar, VidyaAvatar } from '../../prototype/shared';
import { classChapters, chapterByIdC } from '../../content/syllabus';
import api from '../../api/vidya';
import type { ScreenProps, ChapterNotes } from '../../types';

// ─────────────────────────────────────────────────────────────
//  Chapter notes — one dense screen per chapter: the rules worth
//  remembering, the shortcuts, and where marks get lost.
//  Deliberately compact and high-contrast, because this is meant
//  to be screenshotted the night before a test.
// ─────────────────────────────────────────────────────────────

function Block({ eyebrow, children }: { eyebrow: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div className="v-eyebrow-sm" style={{ marginBottom: 8 }}>{eyebrow}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>{children}</div>
    </div>
  );
}

export default function ChapterNotesScreen({ go, state }: ScreenProps) {
  const { t } = useTranslation(['learn', 'common']);
  const cls = api.toGrade(state?.classLevel);
  const chapter = chapterByIdC(cls, state?.chapterId as string) || classChapters(cls)[0];

  const [notes, setNotes] = useState<ChapterNotes | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    api.generateNotes({
      topic: chapter.title, grade: cls,
      language: state?.language || 'English',
      chapterId: chapter.id,
    })
      .then((d) => { if (alive) setNotes(d); })
      .catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!notes) {
    return (
      <div style={{ minHeight: '100%', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
        <VTopBar transparent showBack onBack={() => go('home')} title={t('notes.topbar')} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, padding: 32, minHeight: '70vh' }}>
          <VidyaAvatar size={64} animated />
          <div style={{ fontFamily: 'Inter', fontSize: 14, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.5 }}>
            {failed ? t('notes.failed') : t('notes.building', { chapter: chapter.title })}
          </div>
          {failed && <button className="v-btn-secondary v-tap" onClick={() => go('home')}>{t('common:back')}</button>}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)' }}>
      <VTopBar transparent showBack onBack={() => go('home')} title={t('notes.topbar')} />
      <div style={{ padding: '68px 20px 40px' }}>
        <div className="v-eyebrow" style={{ marginBottom: 5 }}>{t('notes.eyebrow', { num: chapter.num })}</div>
        <h1 className="v-h1" style={{ fontSize: 26, marginBottom: 4, lineHeight: 1.15 }}>{notes.title || chapter.title}</h1>
        <div style={{ fontFamily: 'Inter', fontSize: 11.5, color: 'var(--muted-2)', marginBottom: 18 }}>
          📸 {t('notes.screenshotHint')}
        </div>

        {/* Everything on one white sheet, so a single screenshot catches it all */}
        <div className="v-card" style={{ padding: '18px 18px 4px', background: '#fff' }}>
          {!!notes.rules?.length && (
            <Block eyebrow={t('notes.rules')}>
              {notes.rules.map((r, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ minWidth: 5, width: 5, height: 5, borderRadius: 9999, background: 'var(--indigo)', marginTop: 7 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'Inter', fontSize: 11.5, fontWeight: 700, color: 'var(--muted-2)', letterSpacing: '0.02em' }}>{r.name}</div>
                    <div style={{ fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 15, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.35 }}>{r.rule}</div>
                  </div>
                </div>
              ))}
            </Block>
          )}

          {!!notes.tricks?.length && (
            <Block eyebrow={`⚡ ${t('notes.tricks')}`}>
              {notes.tricks.map((x, i) => (
                <div key={i} style={{ background: 'var(--indigo-air)', borderRadius: 11, padding: '9px 11px' }}>
                  <div style={{ fontFamily: 'Inter', fontSize: 12.5, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.45 }}>{x.trick}</div>
                  {x.why && (
                    <div style={{ fontFamily: 'Inter', fontSize: 11.5, color: 'var(--indigo)', marginTop: 3, lineHeight: 1.4 }}>{x.why}</div>
                  )}
                </div>
              ))}
            </Block>
          )}

          {!!notes.traps?.length && (
            <Block eyebrow={`⚠️ ${t('notes.traps')}`}>
              {notes.traps.map((x, i) => (
                <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                  <VIcon name="x" size={12} color="#B84030" strokeWidth={2.5} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'Inter', fontSize: 12.5, color: '#B84030', lineHeight: 1.4 }}>{x.mistake}</div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', marginTop: 2 }}>
                      <VIcon name="check" size={12} color="#1A7A4A" strokeWidth={2.5} />
                      <div style={{ flex: 1, fontFamily: 'Inter', fontSize: 12.5, color: '#1A7A4A', lineHeight: 1.4 }}>{x.fix}</div>
                    </div>
                  </div>
                </div>
              ))}
            </Block>
          )}
        </div>
      </div>
    </div>
  );
}
