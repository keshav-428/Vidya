// ─────────────────────────────────────────────────────────────
//  Android's hardware/gesture back button.
//
//  Without this the button does nothing inside the app shell, which reads
//  as broken. Wiring it to the web-view history makes it behave the way
//  every other Android app does.
//
//  No-op in a browser, so `npm run dev` is unaffected.
// ─────────────────────────────────────────────────────────────
import { useEffect, useRef } from 'react';
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import type { ScreenId } from '../routes';

// The tabs reachable from the bottom nav, plus the launch screen. Pressing
// back on one of these should put Vidya in the background — NOT unwind into
// whatever onboarding screens happen to still be in history behind it.
const ROOT_SCREENS = new Set<ScreenId>(['splash', 'home', 'learn', 'practice', 'progress']);

export function useAndroidBackButton(currentScreen: ScreenId): void {
  // Held in a ref so the listener is registered once, yet always sees the
  // screen the student is actually on.
  const screenRef = useRef(currentScreen);
  useEffect(() => { screenRef.current = currentScreen; }, [currentScreen]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let handle: { remove: () => void } | undefined;
    let cancelled = false;

    CapApp.addListener('backButton', ({ canGoBack }) => {
      if (!ROOT_SCREENS.has(screenRef.current) && canGoBack) {
        window.history.back();
        return;
      }
      // Minimize rather than exit: the student keeps their place, and coming
      // back is instant instead of a cold start.
      CapApp.minimizeApp();
    }).then((h) => {
      if (cancelled) h.remove();
      else handle = h;
    });

    return () => { cancelled = true; handle?.remove(); };
  }, []);
}
