import React from 'react';
import VIcon from '../../prototype/icons';
import { VTopBar } from '../../prototype/shared';
import { classChapters } from '../../content/syllabus';
import { getLog } from '../../lib/progress';
import api from '../../api/vidya';
import type { ScreenProps } from '../../types';

// Persistent "full syllabus" view — the living proof that the app covers
// everything in NCERT. Chapters tick off as the student works through them
// (best-effort match of recorded activity topics to chapter titles).
export default function SyllabusScreen({ go, state, set }: ScreenProps) {
  const cls = api.toGrade(state?.classLevel);
  const chapters = classChapters(cls);
  const topicCount = chapters.reduce((n, c) => n + c.subtopics.length, 0);

  const log = getLog(state);
  const touched = (title: string) =>
    log.some((e) => typeof e.topic === 'string' && e.topic.toLowerCase().includes(title.toLowerCase()));
  const startedCount = chapters.filter((c) => touched(c.title)).length;

  const openChapter = (id: string) => { set && set({ chapterId: id }); go('chapter-topics'); };

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)' }}>
      <VTopBar transparent showBack onBack={() => go('learn')} title="Syllabus" />
      <div style={{ padding: '72px 24px 120px' }}>
        <div className="v-eyebrow" style={{ marginBottom: 8 }}>NCERT · CLASS {cls}</div>
        <h1 className="v-h1" style={{ fontSize: 30, marginBottom: 8 }}>Your full Maths syllabus</h1>
        <p className="v-body" style={{ marginBottom: 22 }}>
          {chapters.length} chapters · {topicCount} topics · {startedCount} started
        </p>

        <div className="v-card" style={{ padding: 0, overflow: 'hidden' }}>
          {chapters.map((c, i) => {
            const started = touched(c.title);
            return (
              <div key={c.id} className="v-tap" onClick={() => openChapter(c.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '18px 20px', borderTop: i ? '1px solid var(--border)' : 'none' }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                  background: started ? 'var(--accent-success)' : 'var(--indigo-air)',
                  color: started ? '#fff' : 'var(--indigo)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 14, fontWeight: 600,
                }}>
                  {started ? <VIcon name="check" size={16} color="#fff" /> : c.num}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 17, marginBottom: 2, lineHeight: 1.2 }}>{c.title}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--muted-2)' }}>{c.subtopics.length} topics{started ? ' · started' : ''}</div>
                </div>
                <VIcon name="chevron-right" size={16} color="var(--muted-2)" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
