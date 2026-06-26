import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { VTopBar, VSoftBackdrop, VidyaAvatar } from '../../prototype/shared';
import type { ScreenProps, ScreenId } from '../../types';

export default function QuizLoadingScreen({ go, frame = 1 }: ScreenProps) {
  const { t } = useTranslation('quiz');
  const cur = {
    eyebrow: t(`loading.eyebrow${frame}`),
    title: t(`loading.title${frame}`),
    sub: t(`loading.sub${frame}`),
  };

  useEffect(() => {
    if (frame < 4) {
      const t = setTimeout(() => go(`quiz-loading-${frame + 1}` as ScreenId), 1100);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => go('navigable-quiz'), 1100);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- timer keyed on `frame`; `go` is a stable parent closure
  }, [frame]);

  return (
    <VSoftBackdrop variant="warm">
      <VTopBar transparent />
      <div style={{ padding: '80px 24px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100%' }}>
        <div className="v-enter-scale" style={{ position: 'relative', marginBottom: 48 }}>
          <VidyaAvatar size={108} animated />
          <div style={{ position: 'absolute', inset: -10, borderRadius: 9999, border: '2px solid var(--accent-blue-soft)', animation: 'vPulseRing 1.4s ease-out infinite' }} />
        </div>
        <div className="v-eyebrow v-enter-fade" key={frame} style={{ marginBottom: 14 }}>{cur.eyebrow}</div>
        <h1 className="v-h1 v-enter" key={'t' + frame} style={{ fontSize: 30, textAlign: 'center', marginBottom: 12, lineHeight: 1.15 }}>
          {cur.title}
        </h1>
        <div className="v-enter-fade" key={'s' + frame} style={{ fontFamily: 'Inter', fontSize: 14, color: 'var(--muted-2)' }}>{cur.sub}</div>

        <div style={{ display: 'flex', gap: 8, marginTop: 48 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{
              width: i === frame ? 28 : 6, height: 6, borderRadius: 9999,
              background: i <= frame ? 'var(--ink)' : 'rgba(208,196,190,0.5)',
              transition: 'all .35s cubic-bezier(.16,1,.3,1)',
            }} />
          ))}
        </div>
      </div>
    </VSoftBackdrop>
  );
}
