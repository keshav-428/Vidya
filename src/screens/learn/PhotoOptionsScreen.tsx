import { useTranslation } from 'react-i18next';
import VIcon from '../../prototype/icons';
import { VTopBar } from '../../prototype/shared';
import type { ScreenProps } from '../../types';

// ─────────────────────────────────────────────────────────────
//  What do you want done with this page?
//
//  Shown AFTER the photo, never before: the same picture can fairly
//  become a lesson, a quiz or a marking, so the page can't decide for
//  the student — but it can say which is likeliest and put that first.
//  Asking before the photo would make them classify blind.
// ─────────────────────────────────────────────────────────────

type OptionId = 'teach' | 'quiz' | 'check';

interface OptionCardProps {
  icon: string;
  hue: string;
  title: string;
  sub: string;
  suggested?: boolean;
  suggestedLabel: string;
  onClick: () => void;
}

function OptionCard({ icon, hue, title, sub, suggested, suggestedLabel, onClick }: OptionCardProps) {
  return (
    <div className="v-tap" onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: '16px 16px', marginBottom: 10,
      background: '#fff', borderRadius: 20,
      // The suggested one is ringed rather than recoloured — it stays one of
      // three equal choices, just the one Vidya would pick.
      border: suggested ? '1.5px solid var(--indigo)' : '1px solid var(--border)',
      boxShadow: suggested ? '0 6px 22px rgba(56,72,168,0.10)' : '0 4px 18px rgba(28,25,23,0.05)',
    }}>
      <div style={{ width: 46, height: 46, borderRadius: 14, background: hue, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <VIcon name={icon} size={21} color="#fff" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <div style={{ fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 17, fontWeight: 700, lineHeight: 1.15, color: 'var(--ink)' }}>{title}</div>
          {suggested && (
            <span style={{ fontFamily: 'Inter', fontSize: 9, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--indigo)', background: 'var(--indigo-air)', borderRadius: 9999, padding: '3px 7px' }}>
              {suggestedLabel}
            </span>
          )}
        </div>
        <div style={{ fontFamily: 'Inter', fontSize: 12.5, color: 'var(--muted-2)', lineHeight: 1.35 }}>{sub}</div>
      </div>
      <VIcon name="chevron-right" size={18} color="var(--muted-2)" />
    </div>
  );
}

export default function PhotoOptionsScreen({ go, set, state }: ScreenProps) {
  const { t } = useTranslation(['learn', 'common']);
  const analysis = state?.photoAnalysis;

  const topic = analysis?.topic?.trim() || '';
  const hasWork = analysis?.has_work || 'none';
  const scope = analysis?.chapter_id
    ? { chapterId: analysis.chapter_id, section: analysis.section || null }
    : null;

  // Any working on the page means "how did I do?" is the live question.
  // A blank question page means they're stuck, which is the same option —
  // it answers with hints instead of marks.
  const suggested: OptionId = hasWork === 'none'
    ? ((analysis?.question_count || 0) > 0 ? 'check' : 'teach')
    : 'check';

  const teach = () => {
    set && set({
      askedConcept: topic,
      askedFocus: analysis?.focus?.trim() || null,
      askedChapterId: analysis?.chapter_id || null,
      askedSection: analysis?.section || null,
    });
    go('learn-concept');
  };

  // Mirrors how Practice already turned a photo into questions: a matched
  // section scopes them AND earns the mastery credit; otherwise fall back
  // to the loose topic.
  const quiz = () => {
    if (scope) set && set({ quizScope: { ...scope, topic }, skillId: null });
    else set && set({ practiceTopics: [topic], skillId: null });
    go('navigable-quiz');
  };

  const check = () => go('check-work');

  const options: { id: OptionId; icon: string; hue: string; onClick: () => void }[] = [
    { id: 'check', icon: 'check', hue: 'var(--indigo)', onClick: check },
    { id: 'teach', icon: 'book', hue: 'var(--saffron)', onClick: teach },
    { id: 'quiz', icon: 'target', hue: '#9F5A4A', onClick: quiz },
  ];
  // Suggested first — the student shouldn't have to hunt for the obvious one.
  const ordered = [...options].sort((a, b) => Number(b.id === suggested) - Number(a.id === suggested));

  // The "check" card promises something different depending on whether there
  // is any working to mark, so it must not claim to check an empty page.
  const checkKey = hasWork === 'none' ? 'blank' : 'marked';

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)' }}>
      <VTopBar transparent showBack onBack={() => go('home')} title={t('photoOptions.topbar')} />
      <div style={{ padding: '72px 22px 40px' }}>
        <div className="v-eyebrow" style={{ marginBottom: 6 }}>{t('photoOptions.eyebrow')}</div>
        <h1 className="v-h1" style={{ fontSize: 26, marginBottom: 8, lineHeight: 1.18 }}>
          {topic || t('photoOptions.fallbackTopic')}
        </h1>
        <p className="v-body" style={{ marginBottom: 22 }}>
          {analysis?.summary || t('photoOptions.subtitle')}
        </p>

        {ordered.map((o) => (
          <OptionCard
            key={o.id}
            icon={o.icon}
            hue={o.hue}
            title={o.id === 'check' ? t(`photoOptions.check.${checkKey}.title`) : t(`photoOptions.${o.id}.title`)}
            sub={o.id === 'check' ? t(`photoOptions.check.${checkKey}.sub`) : t(`photoOptions.${o.id}.sub`)}
            suggested={o.id === suggested}
            suggestedLabel={t('photoOptions.suggested')}
            onClick={o.onClick}
          />
        ))}

        <button className="v-btn-secondary v-tap" style={{ width: '100%', marginTop: 8 }}
          onClick={() => { set && set({ photoImages: null, photoMimes: null, photoAnalysis: null }); go('home'); }}>
          <VIcon name="camera" size={14} color="var(--ink)" /> {t('photoOptions.retake')}
        </button>
      </div>
    </div>
  );
}
