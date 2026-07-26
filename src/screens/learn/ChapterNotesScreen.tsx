import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import VIcon from '../../prototype/icons';
import { VTopBar, VidyaAvatar } from '../../prototype/shared';
import { classChapters, chapterByIdC } from '../../content/syllabus';
import api from '../../api/vidya';
import type { ScreenProps, ChapterNotes, NotesSection } from '../../types';

// ─────────────────────────────────────────────────────────────
//  Chapter notes — enough to revise the WHOLE chapter without
//  reopening the textbook. Sections come from the syllabus, so
//  every topic in the chapter gets its own block, numbered the
//  way the student's own textbook numbers it. The chapter-level
//  rules / shortcuts / traps sit at the end as the last-minute
//  layer, and that block is the one worth screenshotting.
// ─────────────────────────────────────────────────────────────

function Block({ eyebrow, children }: { eyebrow: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div className="v-eyebrow-sm" style={{ marginBottom: 8 }}>{eyebrow}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>{children}</div>
    </div>
  );
}

// One subtopic. Points carry the actual content; formulas and the worked sum
// appear only when that section genuinely has them.
function Section({ s, idx, refFor }: { s: NotesSection; idx: number; refFor: (el: HTMLDivElement | null) => void }) {
  const { t } = useTranslation(['learn']);
  return (
    <div ref={refFor} className="v-card" style={{ padding: '16px 17px', background: '#fff', scrollMarginTop: 76 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: s.summary ? 4 : 10 }}>
        <span style={{ fontFamily: 'Inter', fontSize: 11.5, fontWeight: 800, color: 'var(--indigo)', letterSpacing: '0.02em' }}>
          {s.num || idx + 1}
        </span>
        <h2 style={{ flex: 1, minWidth: 0, margin: 0, fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 17, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.25 }}>
          {s.title}
        </h2>
      </div>

      {s.summary && (
        <div style={{ fontFamily: 'Inter', fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.5, marginBottom: 11 }}>
          {s.summary}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {(s.points || []).map((p, i) => (
          <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
            <div style={{ minWidth: 5, width: 5, height: 5, borderRadius: 9999, background: 'var(--indigo)', marginTop: 7 }} />
            <div style={{ flex: 1, minWidth: 0, fontFamily: 'Inter', fontSize: 13.5, color: 'var(--ink)', lineHeight: 1.55 }}>{p}</div>
          </div>
        ))}
      </div>

      {!!s.formulas?.length && (
        <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--indigo-air)', borderRadius: 12 }}>
          <div className="v-eyebrow-sm" style={{ marginBottom: 6 }}>{t('notes.formulas')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {s.formulas.map((f, i) => (
              <div key={i} style={{ fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 14.5, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.35 }}>{f}</div>
            ))}
          </div>
        </div>
      )}

      {s.example?.q && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed var(--border-soft)' }}>
          <div className="v-eyebrow-sm" style={{ marginBottom: 5 }}>{t('notes.example')}</div>
          <div style={{ fontFamily: 'Inter', fontSize: 13, color: 'var(--ink)', lineHeight: 1.5 }}>{s.example.q}</div>
          {s.example.a && (
            <div style={{ display: 'flex', gap: 7, alignItems: 'flex-start', marginTop: 6 }}>
              <VIcon name="check" size={12} color="#1A7A4A" strokeWidth={2.5} />
              <div style={{ flex: 1, fontFamily: 'Inter', fontSize: 13, fontWeight: 600, color: '#1A7A4A', lineHeight: 1.5 }}>{s.example.a}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ChapterNotesScreen({ go, set, state }: ScreenProps) {
  const { t } = useTranslation(['learn', 'common']);
  const cls = api.toGrade(state?.classLevel);
  const chapter = chapterByIdC(cls, state?.chapterId as string) || classChapters(cls)[0];

  const [notes, setNotes] = useState<ChapterNotes | null>(null);
  const [failed, setFailed] = useState(false);
  const secRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    let alive = true;
    api.generateNotes({
      topic: chapter.title, grade: cls,
      language: state?.language || 'English',
      chapterId: chapter.id,
      // The syllabus list is what makes the notes cover the whole chapter
      // instead of whichever bits the model felt like summarising.
      subtopics: chapter.subtopics.map((s) => ({ num: s.num, title: s.title })),
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
          {/* Whole-chapter notes take a while to write — say why, so the wait reads
              as work being done rather than the app being stuck. */}
          {!failed && (
            <div style={{ fontFamily: 'Inter', fontSize: 12.5, color: 'var(--muted-2)', textAlign: 'center', marginTop: -8 }}>
              {t('notes.buildingSub', { count: chapter.subtopics.length })}
            </div>
          )}
          {failed && <button className="v-btn-secondary v-tap" onClick={() => go('home')}>{t('common:back')}</button>}
        </div>
      </div>
    );
  }

  const sections = notes.sections || [];
  const hasSummaryLayer = !!(notes.rules?.length || notes.tricks?.length || notes.traps?.length);

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)' }}>
      <VTopBar transparent showBack onBack={() => go('home')} title={t('notes.topbar')} />
      <div style={{ padding: '68px 20px 40px' }}>
        <div className="v-eyebrow" style={{ marginBottom: 5 }}>{t('notes.eyebrow', { num: chapter.num })}</div>
        <h1 className="v-h1" style={{ fontSize: 26, marginBottom: 4, lineHeight: 1.15 }}>{notes.title || chapter.title}</h1>
        {!!sections.length && (
          <div style={{ fontFamily: 'Inter', fontSize: 12, color: 'var(--muted-2)', marginBottom: 18 }}>
            {t('notes.covers', { count: sections.length })}
          </div>
        )}

        {notes.big_idea && (
          <div className="v-card" style={{ padding: '15px 17px', marginBottom: 12, background: 'var(--bg-warm)' }}>
            <div className="v-eyebrow-sm" style={{ marginBottom: 6 }}>{t('notes.bigIdea')}</div>
            <div style={{ fontFamily: 'Inter', fontSize: 13.5, color: 'var(--ink)', lineHeight: 1.55 }}>{notes.big_idea}</div>
          </div>
        )}

        {/* A long set of notes needs a way in — tap a topic to jump to it. */}
        {sections.length > 3 && (
          <div className="v-card" style={{ padding: '14px 16px', marginBottom: 12, background: '#fff' }}>
            <div className="v-eyebrow-sm" style={{ marginBottom: 9 }}>{t('notes.contents')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {sections.map((s, i) => (
                <div key={i} className="v-tap"
                  onClick={() => secRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 0' }}>
                  <span style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: 800, color: 'var(--indigo)', minWidth: 26 }}>{s.num || i + 1}</span>
                  <span style={{ flex: 1, minWidth: 0, fontFamily: 'Inter', fontSize: 13, color: 'var(--ink)', lineHeight: 1.4 }}>{s.title}</span>
                  <VIcon name="chevron-right" size={13} color="var(--muted-2)" />
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {sections.map((s, i) => (
            <Section key={i} s={s} idx={i} refFor={(el) => { secRefs.current[i] = el; }} />
          ))}
        </div>

        {/* Last-minute layer: everything memorisable in one place. This is the
            block that's actually worth a screenshot. */}
        {hasSummaryLayer && (
          <div className="v-card" style={{ padding: '18px 18px 4px', background: '#fff', marginTop: 12 }}>
            <div style={{ fontFamily: 'Inter', fontSize: 11.5, color: 'var(--muted-2)', marginBottom: 14 }}>
              📸 {t('notes.screenshotHint')}
            </div>

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
        )}

        {/* Revision only sticks if you check it — and this earns mastery credit. */}
        <button className="v-btn-primary v-tap" style={{ width: '100%', marginTop: 18 }}
          onClick={() => {
            set && set({
              quizScope: { chapterId: chapter.id, section: null, topic: chapter.title },
              practiceTopics: null, practiceSel: null, skillId: null,
            });
            go('navigable-quiz');
          }}>
          {t('notes.testCta')}
        </button>
      </div>
    </div>
  );
}
