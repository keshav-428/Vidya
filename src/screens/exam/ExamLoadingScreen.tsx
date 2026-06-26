import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { VTopBar, VSoftBackdrop, VidyaAvatar } from '../../prototype/shared';
import type { ScreenProps } from '../../types';

export default function ExamLoadingScreen({ go, frame = 1 }: ScreenProps) {
  const { t } = useTranslation(['exam', 'common']);
  const STATES = [
    { eyebrow: t('common:stepOf', { value: 1, total: 2 }), title: t('loading.step1.title'), sub: t('loading.step1.sub') },
    { eyebrow: t('common:stepOf', { value: 2, total: 2 }), title: t('loading.step2.title'), sub: t('loading.step2.sub') },
  ];
  const cur = STATES[frame - 1];

  useEffect(() => {
    const t = setTimeout(() => {
      if (frame < 2) go('exam-loading-2');
      else go('exam-paper');
    }, 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- timer keyed on `frame`; `go` is a stable parent closure
  }, [frame]);

  return (
    <VSoftBackdrop variant="cool">
      <VTopBar transparent />
      <div style={{ padding: '80px 24px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100%' }}>
        <div className="v-enter-scale" style={{ position: 'relative', marginBottom: 48 }}>
          <VidyaAvatar size={108} animated />
          <div style={{ position: 'absolute', inset: -10, borderRadius: 9999, border: '2px solid var(--accent-blue-soft)', animation: 'vPulseRing 1.4s ease-out infinite' }} />
        </div>
        <div className="v-eyebrow v-enter-fade" key={frame} style={{ marginBottom: 14 }}>{cur.eyebrow}</div>
        <h1 className="v-h1 v-enter" key={'t' + frame} style={{ fontSize: 28, textAlign: 'center', marginBottom: 10, lineHeight: 1.15 }}>{cur.title}</h1>
        <div className="v-enter-fade" key={'s' + frame} style={{ fontFamily: 'Inter', fontSize: 13, color: 'var(--muted-2)' }}>{cur.sub}</div>
      </div>
    </VSoftBackdrop>
  );
}
