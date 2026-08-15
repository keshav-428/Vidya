import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import VIcon from '../../prototype/icons';
import { VTopBar } from '../../prototype/shared';
import { useAuth } from '../../auth/auth-context';
import { LANGUAGES, normalizeLang } from '../../i18n';
import { getLog, overallStats } from '../../lib/progress';
import { LANGUAGE_PICKER_ENABLED } from '../../lib/features';
import type { ScreenProps } from '../../types';

interface ProfileMenuItem {
  key: string;
  icon: string;
  onClick?: () => void;
  value?: string;
}

interface SubjectOption {
  id: string;
  glyph: string;
  soon?: boolean;
}

export default function ProfileScreen({ go, state, set }: ScreenProps) {
  const { t } = useTranslation('profile');
  const { logOut } = useAuth();
  const [langSheet, setLangSheet] = useState(false);
  const [classSheet, setClassSheet] = useState(false);
  const current = normalizeLang(state?.language);
  const currentClass = Number(state?.classLevel) || 6;
  const currentSubject = state?.subject || 'maths';
  const stats = overallStats(getLog(state));
  const SUBJECTS: SubjectOption[] = [
    { id: 'maths', glyph: 'π' },
    { id: 'science', glyph: '⚛', soon: true },
    { id: 'english', glyph: 'Aa', soon: true },
    { id: 'social', glyph: '◯', soon: true },
  ];

  // Only wired-up items are shown; inert entries (edit profile, linked tutor,
  // notifications, subscription, help) are hidden until they do something.
  const items: ProfileMenuItem[] = [
    { key: 'classSubject', icon: 'book', onClick: () => setClassSheet(true),
      value: t('common:classBoard', { n: currentClass, board: 'CBSE' }) },
    // The picker and its sheet below stay wired up — only the way in is hidden.
    ...(LANGUAGE_PICKER_ENABLED ? [{
      key: 'language', icon: 'globe', onClick: () => setLangSheet(true),
      value: (LANGUAGES.find((l) => l.code === current) || LANGUAGES[0]).native,
    }] : []),
  ];

  const pickLang = (code: string) => { set && set({ language: code }); setLangSheet(false); };
  const pickClass = (n: number) => { set && set({ classLevel: String(n) }); };
  const pickSubject = (id: string) => { set && set({ subject: id }); };

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)', position: 'relative' }}>
      <VTopBar transparent showBack onBack={() => go('home')} title={t('title')} />
      <div style={{ padding: '72px 24px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          <div style={{ width: 72, height: 72, borderRadius: 9999, background: 'linear-gradient(135deg,#FFE4D5,#E0E7FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 32, color: 'var(--ink)' }}>
            {(state?.name || 'A').charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 24, marginBottom: 2 }}>{state?.name || 'Aarav K.'}</div>
            <div style={{ fontSize: 13, color: 'var(--muted-2)' }}>{t('common:classBoard', { n: currentClass, board: 'CBSE' })}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
          <div className="v-card-soft" style={{ flex: 1, textAlign: 'center', padding: '14px 8px' }}>
            <div style={{ fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 22 }}>{stats.streak}</div>
            <div className="v-eyebrow-sm" style={{ marginTop: 2 }}>{t('stats.streak')}</div>
          </div>
          <div className="v-card-soft" style={{ flex: 1, textAlign: 'center', padding: '14px 8px' }}>
            <div style={{ fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 22 }}>{stats.masteryPercent}%</div>
            <div className="v-eyebrow-sm" style={{ marginTop: 2 }}>{t('stats.mastery')}</div>
          </div>
          <div className="v-card-soft" style={{ flex: 1, textAlign: 'center', padding: '14px 8px' }}>
            <div style={{ fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 22 }}>{stats.concepts}</div>
            <div className="v-eyebrow-sm" style={{ marginTop: 2 }}>{t('stats.concepts')}</div>
          </div>
        </div>

        <div className="v-card" style={{ padding: 0, overflow: 'hidden' }}>
          {items.map((it, i) => (
            <div key={it.key} className="v-tap" onClick={it.onClick}
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', borderTop: i ? '1px solid var(--border)' : 'none' }}>
              <VIcon name={it.icon} size={18} color="var(--muted)" />
              <span style={{ flex: 1, fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 16 }}>{t(`menu.${it.key}`)}</span>
              {it.value && <span style={{ fontSize: 13, color: 'var(--muted-2)', marginRight: 4 }}>{it.value}</span>}
              <VIcon name="chevron-right" size={16} color="var(--muted-2)" />
            </div>
          ))}
        </div>

        <div
          className="v-tap"
          onClick={async () => { try { await logOut(); } catch { /* sign-out best effort */ } go('splash'); }}
          style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', marginTop: 14, background: '#fff', borderRadius: 24, border: '1px solid var(--border)' }}
        >
          <VIcon name="logout" size={18} color="var(--accent-warn)" />
          <span style={{ flex: 1, fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 16, color: 'var(--accent-warn)' }}>{t('signOut')}</span>
        </div>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 11, color: 'var(--muted-2)' }}>Vidya · v0.4.1</div>
      </div>

      {langSheet && (
        <div onClick={() => setLangSheet(false)} style={{ position: 'absolute', inset: 0, zIndex: 80, background: 'rgba(28,25,23,0.42)', backdropFilter: 'blur(2px)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', animation: 'vFade 200ms ease-out both' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--bg)', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: '14px 20px 28px', boxShadow: '0 -8px 32px rgba(0,0,0,0.12)', animation: 'vSheetUp 320ms cubic-bezier(.16,1,.3,1) both' }}>
            <div style={{ width: 36, height: 4, borderRadius: 9999, background: 'var(--border)', margin: '0 auto 14px' }} />
            <h2 style={{ fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontWeight: 500, fontSize: 24, letterSpacing: '-0.02em', margin: '0 0 4px', color: '#000' }}>{t('languageSheet.title')}</h2>
            <p style={{ fontSize: 13, color: 'var(--muted-2)', margin: '0 0 18px', lineHeight: 1.4 }}>{t('languageSheet.subtitle')}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {LANGUAGES.map((l) => {
                const active = l.code === current;
                return (
                  <div key={l.code} className="v-tap" onClick={() => pickLang(l.code)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', background: active ? 'var(--ink)' : '#fff', color: active ? '#fff' : 'var(--ink)', border: active ? '1.5px solid var(--ink)' : '1px solid var(--border)', borderRadius: 18, transition: 'all 160ms ease' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 18, fontWeight: 500 }}>{l.native}</div>
                      <div style={{ fontSize: 12, color: active ? 'rgba(255,255,255,0.65)' : 'var(--muted-2)', marginTop: 2 }}>{l.label}</div>
                    </div>
                    {active && <VIcon name="check" size={16} color="#fff" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {classSheet && (
        <div onClick={() => setClassSheet(false)} style={{ position: 'absolute', inset: 0, zIndex: 80, background: 'rgba(28,25,23,0.42)', backdropFilter: 'blur(2px)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', animation: 'vFade 200ms ease-out both' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--bg)', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: '14px 20px 28px', boxShadow: '0 -8px 32px rgba(0,0,0,0.12)', animation: 'vSheetUp 320ms cubic-bezier(.16,1,.3,1) both' }}>
            <div style={{ width: 36, height: 4, borderRadius: 9999, background: 'var(--border)', margin: '0 auto 14px' }} />
            <h2 style={{ fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontWeight: 500, fontSize: 24, letterSpacing: '-0.02em', margin: '0 0 4px', color: '#000' }}>{t('classSheet.title')}</h2>
            <p style={{ fontSize: 13, color: 'var(--muted-2)', margin: '0 0 16px', lineHeight: 1.4 }}>{t('classSheet.subtitle')}</p>

            <div className="v-eyebrow" style={{ marginBottom: 8 }}>{t('classSheet.classLabel')}</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {[6, 7, 8].map((n) => {
                const active = n === currentClass;
                return (
                  <div key={n} className="v-tap" onClick={() => pickClass(n)} style={{ flex: 1, textAlign: 'center', padding: '14px 0', background: active ? 'var(--ink)' : '#fff', color: active ? '#fff' : 'var(--ink)', border: active ? '1.5px solid var(--ink)' : '1px solid var(--border)', borderRadius: 14, fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 16, fontWeight: 500, transition: 'all 160ms ease' }}>
                    {t('common:classBoard', { n, board: 'CBSE' }).split(' · ')[0]}
                  </div>
                );
              })}
            </div>

            <div className="v-eyebrow" style={{ marginBottom: 8 }}>{t('classSheet.subjectLabel')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {SUBJECTS.map((s) => {
                const active = s.id === currentSubject && !s.soon;
                return (
                  <div key={s.id} className="v-tap" onClick={s.soon ? undefined : () => pickSubject(s.id)} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: active ? 'var(--ink)' : '#fff', color: active ? '#fff' : 'var(--ink)', border: active ? '1.5px solid var(--ink)' : '1px solid var(--border)', borderRadius: 16, opacity: s.soon ? 0.5 : 1, cursor: s.soon ? 'not-allowed' : 'default', transition: 'all 160ms ease' }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9999, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 18, background: active ? 'rgba(255,255,255,0.12)' : 'var(--indigo-air)', color: active ? 'rgba(255,255,255,0.9)' : 'var(--indigo)' }}>{s.glyph}</div>
                    <div style={{ flex: 1, minWidth: 0, fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 16, fontWeight: 500 }}>{t(`onboarding:subject.${s.id}`)}</div>
                    {s.soon && <div style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted-2)', padding: '4px 9px', borderRadius: 9999, background: 'var(--bg-warm)' }}>{t('common:soon')}</div>}
                    {active && <VIcon name="check" size={16} color="#fff" />}
                  </div>
                );
              })}
            </div>

            <button className="v-btn-primary v-tap" onClick={() => setClassSheet(false)} style={{ marginTop: 20 }}>
              {t('common:continue')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
