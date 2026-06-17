import React, { useState, useEffect, useRef } from 'react';
import VIcon from './icons';

// ─── TopBar ──────────────────────────────────────────────────
function VTopBar({ title, showBack, onBack, right, transparent = true, dark = false, hideLogo = false }) {
  const fg = dark ? '#fff' : 'var(--ink)';
  return (
    <div className="v-topbar" style={{
      background: transparent ? 'transparent' : dark ? 'rgba(30,27,25,0.85)' : 'rgba(250,249,246,0.85)',
      backdropFilter: transparent ? 'none' : undefined,
      WebkitBackdropFilter: transparent ? 'none' : undefined,
      borderBottom: transparent ? 'none' : '1px solid var(--border-soft)',
      color: fg
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 60, flex: 1 }}>
        {showBack ?
        <>
            <button className="v-tap" onClick={onBack} style={{
            background: 'transparent', border: 'none', padding: 6, marginLeft: -6, color: fg,
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'default'
          }}>
              <VIcon name="arrow-left" size={20} color={fg} />
            </button>
            {title &&
          <span style={{
            fontFamily: 'Inter,sans-serif', fontSize: 13, fontWeight: 600,
            letterSpacing: '0.04em', textTransform: 'uppercase', color: fg, opacity: 0.7
          }}>{title}</span>
          }
          </> :
        !hideLogo && <VidyaLockup height={22} dark={dark} />
        }
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 60, justifyContent: 'flex-end' }}>
        {right}
      </div>
    </div>);
}

// ─── Bottom navigation — 4 student tabs ────────────────────────
function VBottomNav({ active, go }) {
  const items = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'learn', label: 'Learn', icon: 'book' },
  { id: 'practice', label: 'Practice', icon: 'target' },
  { id: 'progress', label: 'Progress', icon: 'chart' }];

  const nav =
  <div className="v-bottomnav" style={{ pointerEvents: 'auto' }}>
      {items.map((it) => {
      const isActive = active === it.id;
      return (
        <div key={it.id} className={`v-navitem v-tap ${isActive ? 'active' : ''}`} onClick={() => go(it.id)}>
            <VIcon name={it.icon} size={20} color={isActive ? 'var(--ink)' : 'var(--muted-2)'} strokeWidth={isActive ? 1.8 : 1.5} />
            <span style={{ marginTop: 2 }}>{it.label}</span>
            <div className="v-navdot" />
          </div>);
    })}
    </div>;

  return nav;
}

// ─── Ask Vidya — floating helper, backed by the NCERT RAG API ──
function VAskVidyaFAB({ context = 'general', grade = 6, language = 'English' }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState(null);   // { explanation, key_principle, common_mistake, suggestions, context_used }
  const [error, setError] = useState(null);

  const tips = {
    home: 'I noticed you were learning Fractions. Want to continue?',
    learn: 'Stuck on a topic? Ask me in your own words.',
    practice: 'Tell me where you got stuck — I\'ll explain in plain language.',
    progress: 'Want a study plan for your weak topics?',
    general: 'Stuck somewhere? Ask in simple words.'
  };

  const ask = async (question) => {
    const q = (question ?? query).trim();
    if (!q || loading) return;
    setLoading(true); setError(null); setAnswer(null); setQuery(q);
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, grade: Number(grade) || 6, language }),
      });
      if (!res.ok) throw new Error(`Server error (${res.status})`);
      const data = await res.json();
      setAnswer(data);
    } catch (e) {
      setError('Could not reach Vidya. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button className="v-tap" onClick={() => setOpen((o) => !o)} style={{
        position: 'fixed', right: 18, bottom: 100, pointerEvents: 'auto',
        width: 60, height: 60, borderRadius: 9999,
        background: 'var(--indigo)', color: '#fff', border: 'none',
        boxShadow: '0 10px 30px rgba(57,73,171,0.35), 0 0 0 6px rgba(57,73,171,0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'default', zIndex: 30
      }} aria-label="Ask Vidya">
        <VidyaVMark size={32} color="#fff" ribbon="var(--saffron)" />
      </button>
      {open &&
    <div className="v-enter" style={{
      position: 'fixed', right: 18, bottom: 172, left: 18, pointerEvents: 'auto',
      background: '#fff', borderRadius: 24,
      border: '1px solid var(--border)',
      boxShadow: '0 24px 48px rgba(0,0,0,0.12)',
      padding: '20px 22px', zIndex: 30,
      maxHeight: '60vh', display: 'flex', flexDirection: 'column'
    }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexShrink: 0 }}>
            <VidyaIcon size={28} />
            <div className="v-eyebrow" style={{ color: 'var(--indigo-ink)' }}>Ask Vidya</div>
            <div style={{ flex: 1 }} />
            <span className="v-tap" onClick={() => setOpen(false)} style={{ color: 'var(--muted-2)', fontSize: 18, lineHeight: 1 }}>×</span>
          </div>

          <div className="vidya-scroll" style={{ overflowY: 'auto', flex: 1, marginBottom: 14 }}>
            {/* Idle tip — shown before the first question */}
            {!answer && !loading && !error &&
              <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 16, lineHeight: 1.5, color: 'var(--ink)' }}>
                {tips[context] || tips.general}
              </div>}

            {loading &&
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'Inter', fontSize: 14, color: 'var(--muted)' }}>
                <span className="v-spin" style={{ width: 16, height: 16, border: '2px solid var(--border)', borderTopColor: 'var(--indigo)', borderRadius: '50%', display: 'inline-block' }} />
                Vidya is reading the textbook…
              </div>}

            {error &&
              <div style={{ fontFamily: 'Inter', fontSize: 13, color: '#B84030', lineHeight: 1.5 }}>{error}</div>}

            {answer &&
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontFamily: 'Inter', fontSize: 14, lineHeight: 1.55, color: 'var(--ink)' }}>
                  {answer.explanation}
                </div>
                {answer.key_principle &&
                  <div style={{ background: 'var(--indigo-air)', borderRadius: 12, padding: '10px 12px' }}>
                    <div style={{ fontFamily: 'Inter', fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--indigo)', marginBottom: 4 }}>Key idea</div>
                    <div style={{ fontFamily: 'Inter', fontSize: 13, lineHeight: 1.5, color: 'var(--ink)' }}>{answer.key_principle}</div>
                  </div>}
                {answer.common_mistake &&
                  <div style={{ background: '#FFF7ED', borderRadius: 12, padding: '10px 12px' }}>
                    <div style={{ fontFamily: 'Inter', fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#B45309', marginBottom: 4 }}>Common mistake</div>
                    <div style={{ fontFamily: 'Inter', fontSize: 13, lineHeight: 1.5, color: 'var(--ink)' }}>{answer.common_mistake}</div>
                  </div>}
                {Array.isArray(answer.suggestions) && answer.suggestions.length > 0 &&
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {answer.suggestions.map((s, i) =>
                      <button key={i} className="v-tap" onClick={() => ask(s)} style={{
                        textAlign: 'left', background: '#fff', border: '1px solid var(--border)', borderRadius: 12,
                        padding: '9px 12px', fontFamily: 'Inter', fontSize: 13, color: 'var(--ink)', lineHeight: 1.4, cursor: 'default'
                      }}>{s}</button>)}
                  </div>}
                {Array.isArray(answer.context_used) && answer.context_used.length > 0 &&
                  <div style={{ fontFamily: 'Inter', fontSize: 10, color: 'var(--muted-2)' }}>
                    From NCERT: {[...new Set(answer.context_used)].join(', ')}
                  </div>}
              </div>}
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'var(--indigo-air)', borderRadius: 14, padding: '12px 14px', flexShrink: 0 }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') ask(); }}
              placeholder="Type your question…"
              style={{
                flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none',
                fontFamily: 'Inter', fontSize: 14, color: 'var(--ink)'
              }} />
            <button className="v-tap" onClick={() => ask()} disabled={loading} style={{
              background: 'var(--indigo)', color: '#fff', border: 'none', opacity: loading ? 0.5 : 1,
              width: 32, height: 32, borderRadius: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <VIcon name="send" size={14} color="#fff" />
            </button>
          </div>
        </div>
    }
    </>);
}

// ─── Profile chip — replaces the bottom-nav profile tab ───────
function VProfileChip({ go, name = 'A' }) {
  return (
    <button className="v-tap" onClick={() => go('profile')} style={{
      width: 34, height: 34, borderRadius: 9999, border: 'none', padding: 0,
      background: 'linear-gradient(135deg,#FFE4D5,#E0E7FF)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 16, color: 'var(--ink)',
      cursor: 'default',
      boxShadow: '0 0 0 1px rgba(208,196,190,0.4)'
    }}>{(name || 'A').slice(0, 1).toUpperCase()}</button>);
}

// ─── Vidya V mark ────────────────────────────────────────────────
function VidyaVMark({ size = 40, color = '#ffffff', ribbon = 'var(--saffron)', style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120"
    style={{ flexShrink: 0, display: 'block', ...style }}>
      <path d="M13 20 L32 20 L63 88 L53 88 Z" fill={color} />
      <path d="M107 20 L88 20 L57 88 L67 88 Z" fill={color} />
      <circle cx="60" cy="88" r="8" fill={ribbon} />
    </svg>);
}

// ─── Full brand lockup — typographic 'vidya' wordmark ──────────
function VidyaLockup({ height = 22, dark = false, style }) {
  const txt = Math.round(height * 1.32);
  const fg = dark ? '#FAF9F6' : 'var(--indigo-ink)';
  return (
    <span className="v-logo" style={{ color: fg, ...style }}>
      <span className="v-logo-wordmark"
      style={{ fontSize: txt, color: fg }}>vidya</span>
    </span>);
}

// ─── Vidya disc — V mark on indigo-air pill ───────────────────
function VidyaIcon({ size = 40, bg = 'var(--indigo-air)', color = 'var(--indigo)', ribbon = 'var(--saffron)', radius = 'circle' }) {
  const r = radius === 'circle' ? size / 2 : Number(radius) || size * 0.22;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: size, height: size, borderRadius: r, background: bg, flexShrink: 0
    }}>
      <VidyaVMark size={Math.round(size * 0.7)} color={color} ribbon={ribbon} />
    </span>);
}

// ─── Vidya disc avatar (small — inline 'Vidya says') ──────────
function VidyaMark({ size = 40 }) {
  return <VidyaIcon size={size} />;
}

// ─── Vidya avatar (large, on welcome / loading) ───────────────
function VidyaAvatar({ size = 96, status = true }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: 9999,
      background: 'linear-gradient(150deg, var(--indigo) 0%, var(--indigo-ink) 100%)',
      boxShadow: '0 12px 28px -10px rgba(16,48,97,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
    }}>
      <VidyaVMark size={Math.round(size * 0.64)} color="#ffffff" ribbon="var(--saffron)" />
    </div>);
}

// ─── Progress dots (onboarding) ───────────────────────────────
function VProgressDots({ total, current }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      {Array.from({ length: total }).map((_, i) =>
      <div key={i} style={{
        width: i === current ? 24 : 6, height: 4,
        borderRadius: 9999,
        background: i <= current ? 'var(--ink)' : 'rgba(208,196,190,0.5)',
        transition: 'all .35s cubic-bezier(.16,1,.3,1)'
      }} />
      )}
    </div>);
}

// ─── Editorial footer (used on onboarding) ────────────────────
function VEditorialFooter({ issue, dotsTotal, dotsCurrent }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
      padding: '24px 32px 32px'
    }}>
      <div>
        <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 18, color: 'var(--ink)', lineHeight: 1.1 }}>The Modern Scholar</div>
        <div style={{ fontFamily: 'Inter', fontSize: 9, letterSpacing: '0.12em', color: 'var(--muted-2)', marginTop: 4 }}>{issue || 'Issue No. 01 / Welcome Journey'}</div>
      </div>
      {dotsTotal && <VProgressDots total={dotsTotal} current={dotsCurrent} />}
    </div>);
}

// ─── Soft gradient background ─────────────────────────────────
function VSoftBackdrop({ children, variant = 'warm' }) {
  const bg = variant === 'cool' ?
  'radial-gradient(ellipse at 0% 0%, rgba(167,189,254,0.18) 0%, rgba(167,189,254,0) 50%), radial-gradient(ellipse at 100% 100%, rgba(159,124,114,0.06) 0%, rgba(159,124,114,0) 50%)' :
  variant === 'rose' ?
  'radial-gradient(ellipse at 50% 0%, rgba(255,228,230,0.4) 0%, rgba(255,228,230,0) 50%), radial-gradient(ellipse at 50% 100%, rgba(224,231,255,0.4) 0%, rgba(224,231,255,0) 50%)' :
  'linear-gradient(180deg, rgba(255,235,230,0.4) 0%, rgba(230,235,255,0.4) 100%)';
  return (
    <div style={{ position: 'relative', minHeight: '100%', background: 'var(--bg)' }}>
      <div style={{ position: 'absolute', inset: 0, background: bg, pointerEvents: 'none' }} />
      <div style={{ position: 'relative', zIndex: 1, minHeight: '100%' }}>{children}</div>
    </div>);
}

// ─── Generic option button (multi-choice) ────────────────────
function VOptionButton({ label, sub, selected, onClick, correct, wrong, multi, children }) {
  let border = '1px solid var(--border)';
  let bg = '#fff';
  if (selected) {border = '1.5px solid var(--ink)';bg = '#fff';}
  if (correct) {border = '1.5px solid var(--accent-success)';bg = '#ECFDF5';}
  if (wrong) {border = '1.5px solid var(--accent-warn)';bg = '#FFF7ED';}
  const indicatorRadius = multi ? 7 : 9999;
  return (
    <div className="v-tap" onClick={onClick} style={{
      background: bg, border, borderRadius: 20, padding: '18px 20px',
      display: 'flex', alignItems: 'center', gap: 14,
      transition: 'all .2s ease',
      boxShadow: selected ? '0 4px 20px rgba(28,25,23,0.08)' : '0 1px 2px rgba(0,0,0,0.02)'
    }}>
      {children ? children :
      <>
          <div style={{
          width: 28, height: 28, borderRadius: indicatorRadius,
          border: selected || correct || wrong ? 'none' : '1.5px solid var(--border)',
          background: correct ? 'var(--accent-success)' : wrong ? 'var(--accent-warn)' : selected ? 'var(--ink)' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, transition: 'all .2s ease'
        }}>
            {(selected || correct || wrong) && <VIcon name={wrong ? 'x' : 'check'} size={14} color="#fff" strokeWidth={2.4} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'Inter', fontSize: 15, fontWeight: 500, color: 'var(--ink)' }}>{label}</div>
            {sub && <div style={{ fontFamily: 'Inter', fontSize: 12, color: 'var(--muted-2)', marginTop: 2 }}>{sub}</div>}
          </div>
        </>
      }
    </div>);
}

// ─── Section header ──────────────────────────────────────────
function VSectionHeader({ eyebrow, title, action, onAction }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
      <div>
        {eyebrow && <div className="v-eyebrow" style={{ marginBottom: 6 }}>{eyebrow}</div>}
        {title && <div style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 14, letterSpacing: '0.1em', color: 'var(--ink)', textTransform: 'uppercase' }}>{title}</div>}
      </div>
      {action && <span className="v-link v-tap" onClick={onAction}>{action}</span>}
    </div>);
}

// ─── Scrollable content area ──────────────────────────────────
function VContent({ children, padTop = 80, padBottom = 32, style }) {
  return (
    <div className="vidya-scroll" style={{
      paddingTop: padTop, paddingBottom: padBottom,
      paddingLeft: 24, paddingRight: 24,
      minHeight: '100%',
      ...style
    }}>
      {children}
    </div>);
}

export {
  VTopBar, VBottomNav, VAskVidyaFAB, VProfileChip,
  VidyaVMark, VidyaLockup, VidyaIcon, VidyaMark, VidyaAvatar, VProgressDots,
  VEditorialFooter, VSoftBackdrop, VOptionButton, VSectionHeader, VContent
};
