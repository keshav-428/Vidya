import React from 'react';
import VIcon from '../../prototype/icons';
import { VSoftBackdrop, VidyaLockup } from '../../prototype/shared';

export default function SplashScreen({ go, set }) {
  return (
    <VSoftBackdrop variant="warm">
      <div style={{ padding: '56px 28px 32px', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        <div className="v-enter" style={{ display: 'flex', justifyContent: 'center', marginBottom: 48 }}>
          <VidyaLockup height={26} />
        </div>

        <div className="v-eyebrow v-enter" style={{ textAlign: 'center', marginBottom: 14, color: 'var(--muted-2)' }}>
          A new way to learn
        </div>
        <h1 className="v-h1 v-enter" style={{
          fontSize: 42, textAlign: 'center',
          margin: '0 0 16px', lineHeight: 1.02, letterSpacing: '-0.025em'
        }}>
          Learn,<br />your way.
        </h1>
        <p className="v-enter" style={{
          fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 18, color: 'var(--muted)',
          textAlign: 'center', margin: '0 16px 36px', lineHeight: 1.5 }}>
          A patient AI companion. One topic at a time, at your own pace.
        </p>

        <div className="v-enter" style={{
          margin: '0 auto', width: '100%', height: 240, borderRadius: 28, overflow: 'hidden', position: 'relative',
          background: 'linear-gradient(135deg, #FFE4D5 0%, #F0E7FF 50%, #DBE4FF 100%)',
          boxShadow: '0 30px 50px -20px rgba(28,25,23,0.12), 0 0 0 1px rgba(255,255,255,0.5) inset'
        }}>
          <svg viewBox="0 0 360 240" width="100%" height="100%" preserveAspectRatio="xMidYMid slice"
            style={{ display: 'block', position: 'absolute', inset: 0 }}>
            <circle cx="270" cy="80" r="62" fill="rgba(255,255,255,0.65)" />
            <circle cx="270" cy="80" r="36" fill="rgba(167,189,254,0.55)" />
            <rect x="36" y="140" width="110" height="78" rx="14" fill="rgba(255,255,255,0.8)" />
            <line x1="50" y1="162" x2="130" y2="162" stroke="var(--ink)" strokeWidth="1.6" />
            <line x1="50" y1="176" x2="120" y2="176" stroke="var(--muted-2)" strokeWidth="1" />
            <line x1="50" y1="188" x2="125" y2="188" stroke="var(--muted-2)" strokeWidth="1" />
            <line x1="50" y1="200" x2="110" y2="200" stroke="var(--muted-2)" strokeWidth="1" />
            <text x="170" y="100" fontFamily="Quicksand" fontSize="34" fontStyle="italic" fill="var(--ink)">π</text>
            <text x="200" y="100" fontFamily="Quicksand" fontSize="20" fill="var(--ink)">r²</text>
            <text x="64" y="60" fontFamily="Quicksand" fontSize="26" fontStyle="italic" fill="var(--ink-2)">a² + b²</text>
            <text x="180" y="200" fontFamily="Quicksand" fontSize="22" fontStyle="italic" fill="var(--ink)">½ + ⅓</text>
            <g transform="translate(28,28)">
              <circle r="20" cx="20" cy="20" fill="#fff" />
              <text x="20" y="28" fontFamily="Nunito" fontSize="22" fontWeight="800" fill="var(--indigo-ink)" textAnchor="middle">V</text>
            </g>
          </svg>
        </div>

        <div style={{ flex: 1, minHeight: 24 }} />

        <button className="v-btn-primary v-tap" onClick={() => { set && set({ authMode: 'signup' }); go('signup'); }}>
          Get Started <VIcon name="arrow-right" size={14} color="#fff" />
        </button>
        <div className="v-tap" onClick={() => { set && set({ authMode: 'login' }); go('signup'); }} style={{
          textAlign: 'center', marginTop: 18,
          fontFamily: 'Inter', fontSize: 13, color: 'var(--muted)', letterSpacing: '0.02em'
        }}>
          Already have an account? <span style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>Sign in</span>
        </div>
      </div>
    </VSoftBackdrop>
  );
}
