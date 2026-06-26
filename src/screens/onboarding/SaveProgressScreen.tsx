import React from 'react';
import VIcon from '../../prototype/icons';
import { VSoftBackdrop, VidyaAvatar } from '../../prototype/shared';
import { FREE_SESSION_LIMIT, guestLimitReached } from '../../lib/guest';
import type { ScreenProps, ScreenId } from '../../types';

// Shown either as a soft prompt after onboarding (the "aha" moment) OR as a
// mandatory wall once a guest has used up their free sessions. In required
// mode there's no "Maybe later" — the only ways forward are sign up or log in.
export default function SaveProgressScreen({ go, set, state }: ScreenProps) {
  const name = (state?.name as string) || 'there';
  const dest = (state?.afterAuth as ScreenId) || 'home';
  const required = !!state?.signupRequired || guestLimitReached(state);

  const benefits = [
    { icon: 'flame', text: 'Keep your streak going' },
    { icon: 'chart', text: 'Save your progress & mastery' },
    { icon: 'book', text: 'Pick up on any device' },
  ];

  return (
    <VSoftBackdrop variant="warm">
      <div style={{ padding: '64px 28px 32px', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        <div className="v-enter-scale" style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <VidyaAvatar size={92} animated />
        </div>

        <h1 className="v-h1 v-enter" style={{ fontSize: 30, textAlign: 'center', marginBottom: 10, lineHeight: 1.12 }}>
          {required ? `That's ${FREE_SESSION_LIMIT} free sessions!` : `You're all set, ${name}!`}
        </h1>
        <p className="v-enter" style={{ fontFamily: "'Quicksand','Baloo 2','Nunito',system-ui,sans-serif", fontSize: 16, color: 'var(--muted)', textAlign: 'center', margin: '0 6px 28px', lineHeight: 1.5 }}>
          {required
            ? 'Create a free account to keep learning — your progress is saved and travels with you.'
            : 'Create a free account so none of your progress gets lost.'}
        </p>

        <div className="v-card v-enter" style={{ padding: '8px 6px', marginBottom: 8 }}>
          {benefits.map((b, i) => (
            <div key={b.text} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 16px', borderTop: i ? '1px solid var(--border-soft)' : 'none' }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--indigo-air)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <VIcon name={b.icon} size={16} color="var(--indigo)" />
              </div>
              <div style={{ fontFamily: "'Quicksand','Nunito',system-ui,sans-serif", fontSize: 15, color: 'var(--ink)' }}>{b.text}</div>
            </div>
          ))}
        </div>

        <div style={{ flex: 1, minHeight: 24 }} />

        <button className="v-btn-primary v-tap" onClick={() => { set && set({ authMode: 'signup' }); go('signup'); }}>
          Create free account <VIcon name="arrow-right" size={14} color="#fff" />
        </button>

        {required ? (
          <div className="v-tap" onClick={() => { set && set({ authMode: 'login' }); go('signup'); }} style={{
            textAlign: 'center', marginTop: 18,
            fontFamily: 'Inter', fontSize: 13, color: 'var(--muted)', letterSpacing: '0.02em',
          }}>
            Already have an account? <span style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>Log in</span>
          </div>
        ) : (
          <div className="v-tap" onClick={() => go(dest)} style={{
            textAlign: 'center', marginTop: 18,
            fontFamily: 'Inter', fontSize: 13, color: 'var(--muted)', letterSpacing: '0.02em',
          }}>
            Maybe later
          </div>
        )}
      </div>
    </VSoftBackdrop>
  );
}
