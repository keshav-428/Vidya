import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './auth/AuthContext';
import './i18n';
import './index.css';

function StatusBar() {
  const fmt = () => {
    const d = new Date();
    return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  };
  const [time, setTime] = useState(fmt);
  useEffect(() => {
    const id = setInterval(() => setTime(fmt()), 15000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, height: 44,
      display: 'flex', alignItems: 'center',
      paddingLeft: 28, paddingRight: 22,
      zIndex: 200, pointerEvents: 'none',
      background: 'var(--bg)',
    }}>
      {/* Time */}
      <span style={{ fontFamily: 'Inter', fontSize: 15, fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.02em', zIndex: 1 }}>
        {time}
      </span>

      {/* Dynamic Island */}
      <div style={{
        position: 'absolute', left: '50%', top: 8,
        transform: 'translateX(-50%)',
        width: 120, height: 34, borderRadius: 20,
        background: '#1C1917',
      }} />

      {/* Right icons */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 7, zIndex: 1 }}>
        {/* Signal bars */}
        <svg width="17" height="12" viewBox="0 0 17 12" fill="none">
          <rect x="0" y="7" width="3" height="5" rx="1" fill="var(--ink)" />
          <rect x="4.5" y="4.5" width="3" height="7.5" rx="1" fill="var(--ink)" />
          <rect x="9" y="2" width="3" height="10" rx="1" fill="var(--ink)" />
          <rect x="13.5" y="0" width="3" height="12" rx="1" fill="var(--ink)" />
        </svg>
        {/* WiFi */}
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
          <circle cx="8" cy="11" r="1.2" fill="var(--ink)" />
          <path d="M5.2 7.8C5.97 7.03 7 6.5 8 6.5C9 6.5 10.03 7.03 10.8 7.8" stroke="var(--ink)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <path d="M2.6 5.2C4.06 3.74 5.95 3 8 3C10.05 3 11.94 3.74 13.4 5.2" stroke="var(--ink)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <path d="M0 2.6C1.95 0.94 4.85 0 8 0C11.15 0 14.05 0.94 16 2.6" stroke="var(--ink)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        </svg>
        {/* Battery */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{
            width: 25, height: 12, borderRadius: 3.5,
            border: '1.5px solid var(--ink)',
            padding: 2, boxSizing: 'border-box',
            display: 'flex', alignItems: 'center',
          }}>
            <div style={{ height: '100%', width: '75%', borderRadius: 1.5, background: 'var(--ink)' }} />
          </div>
          <div style={{ width: 2, height: 5, borderRadius: '0 1px 1px 0', background: 'var(--ink)', opacity: 0.35, marginLeft: 1 }} />
        </div>
      </div>
    </div>
  );
}

// The app itself, wrapped once with auth + routing.
function AppRoot() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthProvider>
  );
}

// Detect a real phone-sized screen so we render full-screen there,
// and the desktop "phone mockup" only on larger screens.
function useIsMobile() {
  const QUERY = '(max-width: 600px)';
  const [mobile, setMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(QUERY).matches
  );
  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const onChange = (e: MediaQueryListEvent) => setMobile(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return mobile;
}

function Root() {
  const isMobile = useIsMobile();

  // ── Real phone: fill the device, no fake bezel/status bar, respect notch ──
  if (isMobile) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'var(--bg)', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute',
          top: 'env(safe-area-inset-top, 0px)',
          bottom: 'env(safe-area-inset-bottom, 0px)',
          left: 0, right: 0,
          overflow: 'hidden',
          transform: 'translateZ(0)',   // containing block for fixed VTopBar/VBottomNav
        }}>
          <AppRoot />
        </div>
      </div>
    );
  }

  // ── Desktop: framed phone mockup with the fake status bar ──
  return (
    <div style={{
      minHeight: '100vh', background: '#1a1a1a',
      display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 32
    }}>
      <div style={{
        width: 390, height: 844, borderRadius: 48,
        overflow: 'hidden',
        border: '8px solid #222',
        boxShadow: '0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
        position: 'relative',
        background: 'var(--bg)',
      }}>
        <StatusBar />
        <div style={{
          position: 'absolute', top: 44, left: 0, right: 0, bottom: 0,
          overflow: 'hidden',
          transform: 'translateZ(0)',
        }}>
          <AppRoot />
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
