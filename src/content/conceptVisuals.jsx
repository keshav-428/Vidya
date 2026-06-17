// ─────────────────────────────────────────────────────────────
//  CONCEPT RENDERERS — turns card DATA into UI.
//
//  Two registries:
//   • VISUALS  — small inline diagrams, keyed by `kind`
//   • CARD_RENDERERS — one renderer per card `type`
//
//  ConceptScreen just looks a card up here and renders it. To add
//  a new card type or diagram, add it here — the data files and
//  the screen never change.
// ─────────────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react';
import api from '../api/vidya';

// ── Theme palette — data files reference these by name ──────
const THEMES = {
  saffron: { grad: 'linear-gradient(135deg, #FFF8F0 0%, #FFF0E0 100%)', accent: 'var(--saffron)', tagBg: '#FFF0E0', tagColor: 'var(--saffron)' },
  indigo:  { grad: 'linear-gradient(135deg, #F0F4FF 0%, #E8EEFF 100%)', accent: 'var(--indigo)',  tagBg: '#EEF1FF', tagColor: 'var(--indigo)' },
  green:   { grad: 'linear-gradient(135deg, #F0FDF4 0%, #E6FAF0 100%)', accent: '#1A7A4A',         tagBg: '#EDFAF3', tagColor: '#1A7A4A' },
};

const VIDEO_GRADIENTS = {
  purple: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  pink:   'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  blue:   'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  green:  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  indigo: 'linear-gradient(135deg, #5b6cf0 0%, #8a4fd8 100%)',
};

// ── INLINE DIAGRAMS ─────────────────────────────────────────
function PizzaVisual({ slices = 4, filled = 1 }) {
  const r = 48, cx = 56, cy = 56, size = 112;
  const paths = Array.from({ length: slices }, (_, i) => {
    const a0 = (i / slices) * 2 * Math.PI - Math.PI / 2;
    const a1 = ((i + 1) / slices) * 2 * Math.PI - Math.PI / 2;
    const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
    return `M${cx},${cy} L${x0.toFixed(2)},${y0.toFixed(2)} A${r},${r},0,0,1,${x1.toFixed(2)},${y1.toFixed(2)} Z`;
  });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {paths.map((d, i) => (
          <path key={i} d={d} fill={i < filled ? 'var(--saffron)' : '#E8E5E0'} stroke="#fff" strokeWidth="2" />
        ))}
      </svg>
      <div style={{ fontFamily: 'Inter', fontSize: 12, color: 'var(--muted)' }}>
        {filled}/{slices} slices = {filled}/{slices} of the whole
      </div>
    </div>
  );
}

function FractionBars({ numerator = 1, denominator = 4 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
      <div style={{ display: 'flex', gap: 3 }}>
        {Array.from({ length: denominator }, (_, i) => (
          <div key={i} style={{ width: 32, height: 32, borderRadius: 7, border: '2px solid var(--indigo)', background: i < numerator ? 'var(--indigo)' : 'var(--indigo-air)', transition: 'background 300ms' }} />
        ))}
      </div>
      <div style={{ fontFamily: 'Inter', fontSize: 12, color: 'var(--muted)' }}>
        {numerator}/{denominator} of the whole
      </div>
    </div>
  );
}

function OneBar({ numerator, denominator, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <div style={{ display: 'flex', gap: 2 }}>
        {Array.from({ length: denominator }, (_, i) => (
          <div key={i} style={{ width: 22, height: 22, borderRadius: 5, border: `2px solid ${color}`, background: i < numerator ? color : 'transparent' }} />
        ))}
      </div>
      <div style={{ fontFamily: 'Inter', fontSize: 11.5, color: 'var(--muted)' }}>{numerator}/{denominator}</div>
    </div>
  );
}

function CompareBars({ a, b }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <OneBar numerator={a.numerator} denominator={a.denominator} color="var(--indigo)" />
      <OneBar numerator={b.numerator} denominator={b.denominator} color="var(--saffron)" />
    </div>
  );
}

const VISUALS = {
  pizza: (p) => <PizzaVisual {...p} />,
  fractionBars: (p) => <FractionBars {...p} />,
  compareBars: (p) => <CompareBars {...p} />,
};

export function renderVisual(visual) {
  if (!visual || !VISUALS[visual.kind]) return null;
  return VISUALS[visual.kind](visual);
}

// ── CARD: definition ────────────────────────────────────────
function DefinitionCard({ card }) {
  const visual = renderVisual(card.visual);
  return (
    <>
      {visual && (
        <div style={{ background: 'var(--bg-warm)', borderRadius: 16, padding: '20px', marginBottom: 20, display: 'flex', justifyContent: 'center', border: '1px solid var(--border-soft)' }}>
          {visual}
        </div>
      )}
      {card.body && (
        <p style={{ fontFamily: 'Inter', fontSize: 15, lineHeight: 1.75, color: 'var(--ink)', whiteSpace: 'pre-line', flex: 1 }}>
          {card.body}
        </p>
      )}
    </>
  );
}

// ── CARD: mistakes ──────────────────────────────────────────
function MistakesCard({ card }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {card.items.map((m, i) => (
        <div key={i} style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid #F5D0CC' }}>
          <div style={{ background: '#FFF5F4', padding: '10px 14px 0' }}>
            <div style={{ fontFamily: 'Inter', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: '#B84030', marginBottom: 4 }}>
              MISTAKE {i + 1}
            </div>
            <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 14, fontWeight: 800, color: 'var(--ink)', marginBottom: 10 }}>
              {m.title}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 10, lineHeight: 1 }}>✕</span>
                </div>
                <div style={{ fontFamily: 'Inter', fontSize: 13, fontWeight: 600, color: '#B84030', textDecoration: 'line-through', opacity: 0.75 }}>
                  {m.wrong}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#EDFAF3', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 10, lineHeight: 1, color: '#1A7A4A' }}>✓</span>
                </div>
                <div style={{ fontFamily: 'Inter', fontSize: 13, fontWeight: 700, color: '#1A7A4A' }}>
                  {m.right}
                </div>
              </div>
            </div>
          </div>
          <div style={{ background: '#FEF2F0', borderTop: '1px solid #F5D0CC', padding: '8px 14px' }}>
            <div style={{ fontFamily: 'Inter', fontSize: 11.5, color: '#7A3828', lineHeight: 1.5 }}>
              {m.why}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── CARD: realLife ──────────────────────────────────────────
// Pulls fresh real-world uses from the LLM (/real-world), mapped onto the
// authored scene layout. Falls back to card.scenes if the call fails.
const SCENE_THEMES = ['saffron', 'indigo', 'green'];

function RealLifeCard({ card, topic }) {
  const [scenes, setScenes] = useState(card.scenes);

  useEffect(() => {
    let alive = true;
    api.realWorld(topic || card.heading || 'mathematics', 6)
      .then((uses) => {
        const mapped = (Array.isArray(uses) ? uses : [])
          .filter((u) => u && (u.title || u.example))
          .slice(0, 3)
          .map((u, i) => ({
            theme: SCENE_THEMES[i % SCENE_THEMES.length],
            label: (u.context || 'IN REAL LIFE').toUpperCase().slice(0, 18),
            title: u.title || 'Everyday maths',
            body: u.example || u.body || '',
            tag: u.tag || 'real use',
          }));
        if (alive && mapped.length) setScenes(mapped);
      })
      .catch(() => {});
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic, card.heading]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {scenes.map((s, i) => {
        const t = THEMES[s.theme] || THEMES.indigo;
        return (
          <div key={i} style={{ background: t.grad, borderRadius: 16, padding: '14px 16px', border: `1px solid ${t.accent}22` }}>
            <div style={{ fontFamily: 'Inter', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: t.accent, marginBottom: 5, opacity: 0.8 }}>
              {s.label}
            </div>
            <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 16, fontWeight: 800, color: 'var(--ink)', marginBottom: 5, letterSpacing: '-0.01em' }}>
              {s.title}
            </div>
            <div style={{ fontFamily: 'Inter', fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.55, marginBottom: 10 }}>
              {s.body}
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', background: t.tagBg, borderRadius: 999, padding: '4px 10px', fontFamily: 'Inter', fontSize: 11, fontWeight: 700, color: t.tagColor, border: `1px solid ${t.accent}33` }}>
              {s.tag}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── CARD: examples ──────────────────────────────────────────
function ExamplesCard({ card }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {card.examples.map((ex, i) => (
        <div key={i} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px 10px', borderBottom: '1px solid var(--border-soft)' }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--indigo)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
              <span style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: 800, color: '#fff' }}>{i + 1}</span>
            </div>
            <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 14, fontWeight: 800, color: 'var(--ink)', lineHeight: 1.35 }}>
              {ex.q}
            </div>
          </div>
          <div style={{ padding: '10px 14px 10px 46px', display: 'flex', flexDirection: 'column', gap: 0 }}>
            {ex.steps.map((step, j) => (
              <div key={j} style={{ display: 'flex', gap: 10, position: 'relative', paddingBottom: j < ex.steps.length - 1 ? 10 : 6 }}>
                {j < ex.steps.length - 1 && (
                  <div style={{ position: 'absolute', left: 7, top: 14, bottom: 0, width: 1, background: 'var(--border-soft)' }} />
                )}
                <div style={{ width: 15, height: 15, borderRadius: '50%', border: '1.5px solid var(--border)', background: 'var(--bg-warm)', flexShrink: 0, marginTop: 1 }} />
                <div>
                  <span style={{ fontFamily: 'Inter', fontSize: 10, fontWeight: 700, color: 'var(--muted-2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {step.label}
                  </span>
                  <div style={{ fontFamily: 'Inter', fontSize: 12.5, color: 'var(--ink)', lineHeight: 1.45, marginTop: 1 }}>
                    {step.detail}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ background: 'var(--indigo-air)', borderTop: '1px solid var(--border-soft)', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'Inter', fontSize: 10, fontWeight: 700, color: 'var(--indigo)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Answer</span>
            <div style={{ width: 1, height: 12, background: 'var(--indigo)', opacity: 0.3 }} />
            <span style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 14, fontWeight: 800, color: 'var(--indigo)' }}>{ex.answer}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── CARD: videos ────────────────────────────────────────────
// Fetches real YouTube results for the topic via /search-videos.
// Falls back to the authored card.videos if the search is empty/fails.
function VideosCard({ card, topic }) {
  const [videos, setVideos] = useState(null);   // null = loading

  useEffect(() => {
    let alive = true;
    const query = topic || card.heading || 'mathematics';
    api.searchVideos(query, 6)
      .then((items) => {
        const real = (Array.isArray(items) ? items : [])
          .filter((v) => v && v.url && v.title)
          .map((v) => ({ title: v.title, url: v.url, thumbnail: v.thumbnail }));
        if (alive) setVideos(real.length ? real : (card.videos || []));
      })
      .catch(() => { if (alive) setVideos(card.videos || []); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic, card.heading]);

  if (!videos) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 0', fontFamily: 'Inter', fontSize: 13, color: 'var(--muted)' }}>
        <span className="v-spin" style={{ width: 16, height: 16, border: '2px solid var(--border)', borderTopColor: 'var(--indigo)', borderRadius: '50%' }} />
        Finding videos on this topic…
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontFamily: 'Inter', fontSize: 12, color: 'var(--muted)', lineHeight: 1.5, marginBottom: 2 }}>
        Watch these before the quiz — they explain the same idea in a different way.
      </div>
      {videos.map((v, i) => {
        const grad = VIDEO_GRADIENTS[v.theme] || VIDEO_GRADIENTS.purple;
        return (
          <a key={i} href={v.url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', display: 'block' }}>
            <div className="v-tap" style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ position: 'relative', width: '100%', paddingTop: '52%', background: v.thumbnail ? `center/cover no-repeat url(${v.thumbnail})` : grad }}>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="16" height="18" viewBox="0 0 16 18" fill="none">
                      <path d="M1 1.5L15 9L1 16.5V1.5Z" fill="white" />
                    </svg>
                  </div>
                </div>
                {v.duration && (
                  <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.75)', borderRadius: 5, padding: '2px 6px', fontFamily: 'Inter', fontSize: 11, fontWeight: 700, color: '#fff' }}>
                    {v.duration}
                  </div>
                )}
                <div style={{ position: 'absolute', top: 8, left: 8, background: '#FF0000', borderRadius: 5, padding: '2px 7px', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <svg width="12" height="9" viewBox="0 0 16 12" fill="none">
                    <rect width="16" height="12" rx="2" fill="#FF0000"/>
                    <path d="M6.5 3.5L10.5 6L6.5 8.5V3.5Z" fill="white"/>
                  </svg>
                  <span style={{ fontFamily: 'Inter', fontSize: 9, fontWeight: 800, color: '#fff', letterSpacing: '0.02em' }}>YouTube</span>
                </div>
              </div>
              <div style={{ padding: '10px 12px 12px' }}>
                <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 13, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.4, marginBottom: v.channel ? 5 : 0 }}>
                  {v.title}
                </div>
                {(v.channel || v.views) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: grad, flexShrink: 0 }} />
                    {v.channel && <span style={{ fontFamily: 'Inter', fontSize: 11, color: 'var(--muted-2)', fontWeight: 500 }}>{v.channel}</span>}
                    {v.views && <><span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--muted-2)', opacity: 0.4, flexShrink: 0 }} /><span style={{ fontFamily: 'Inter', fontSize: 11, color: 'var(--muted-2)' }}>{v.views}</span></>}
                  </div>
                )}
              </div>
            </div>
          </a>
        );
      })}
    </div>
  );
}

// ── REGISTRY: card type → renderer ──────────────────────────
const CARD_RENDERERS = {
  definition: DefinitionCard,
  mistakes: MistakesCard,
  realLife: RealLifeCard,
  examples: ExamplesCard,
  videos: VideosCard,
};

export function renderCard(card, topic) {
  const Renderer = CARD_RENDERERS[card.type] || DefinitionCard;
  return <Renderer card={card} topic={topic} />;
}
