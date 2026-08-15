import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import VIcon from '../../prototype/icons';
import { VTopBar } from '../../prototype/shared';
import { capturePhotos, type CapturedImage } from '../../lib/camera';
import type { ScreenProps } from '../../types';

type ExamPage = CapturedImage;

export default function ExamPhotoScreen({ go, state, set }: ScreenProps) {
  const { t } = useTranslation(['exam', 'common']);
  // pages: [{ b64, mime, url }]
  const [pages, setPages] = useState<ExamPage[]>((state?.examPages as ExamPage[] | undefined) || []);

  const addPages = async () => {
    const shots = await capturePhotos({ multiple: true });
    if (!shots.length) return;   // backed out of the camera
    const next = [...pages, ...shots];
    setPages(next);
    set && set({ examPages: next, examImages: next.map((p) => p.b64) });
  };

  const removeAt = (i: number) => {
    const next = pages.filter((_, j) => j !== i);
    setPages(next);
    set && set({ examPages: next, examImages: next.map((p) => p.b64) });
  };

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)' }}>
      <VTopBar transparent showBack onBack={() => go('exam-paper')} />
      <div style={{ padding: '72px 24px 32px' }}>
        <div className="v-eyebrow" style={{ marginBottom: 8 }}>{t('common:stepOf', { value: 1, total: 2 })}</div>
        <h1 className="v-h1" style={{ fontSize: 30, marginBottom: 8 }}>{t('photo.title')}</h1>
        <p className="v-body" style={{ marginBottom: 24 }}>{t('photo.subtitle')}</p>

        <div className="v-card" style={{ padding: 24, marginBottom: 14, textAlign: 'center' }}>
          <div style={{
            width: 80, height: 80, margin: '0 auto 14px', borderRadius: 24,
            background: 'linear-gradient(135deg,#FFE4D5,#E0E7FF)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <VIcon name="camera" size={36} color="var(--ink)" />
          </div>
          <div style={{ fontFamily: "'Baloo 2','Quicksand','Nunito',system-ui,sans-serif", fontSize: 18, marginBottom: 14 }}>{t('photo.capturePage')}</div>
          <button className="v-btn-secondary v-tap" onClick={addPages}>
            <VIcon name="camera" size={14} /> {t('photo.openCamera')}
          </button>
        </div>

        <div className="v-eyebrow" style={{ marginBottom: 12 }}>{t('photo.captured', { count: pages.length })}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          {pages.map((p, i) => (
            <div key={i} className="v-card-soft" style={{ padding: 0, overflow: 'hidden', aspectRatio: '3/4', position: 'relative' }}>
              <img src={p.url} alt={t('photo.pageAlt', { number: i + 1 })} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <div style={{ position: 'absolute', top: 6, left: 8, fontSize: 9, color: '#fff', background: 'rgba(0,0,0,0.5)', borderRadius: 6, padding: '2px 6px', letterSpacing: '0.05em' }}>P{i + 1}</div>
              <div className="v-tap" onClick={() => removeAt(i)} style={{ position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <VIcon name="x" size={11} color="#fff" strokeWidth={2.5} />
              </div>
            </div>
          ))}
          <div className="v-tap" onClick={addPages} style={{
            aspectRatio: '3/4', borderRadius: 18, border: '1.5px dashed var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted-2)',
          }}>
            <VIcon name="plus" size={28} />
          </div>
        </div>

        <button className="v-btn-primary v-tap" onClick={() => go('exam-submit')}
          disabled={pages.length === 0} style={{ opacity: pages.length === 0 ? 0.4 : 1 }}>
          {t('common:continue')} <VIcon name="arrow-right" size={14} color="#fff" />
        </button>
        {pages.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: 12, fontFamily: 'Inter', fontSize: 12, color: 'var(--muted-2)' }}>
            {t('photo.addAtLeastOne')}
          </div>
        )}
      </div>
    </div>
  );
}
