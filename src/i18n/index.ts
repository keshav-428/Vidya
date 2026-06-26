// ─────────────────────────────────────────────────────────────
//  i18n setup (react-i18next). Strings live in locales/<lng>/<ns>.json.
//  English is the source of truth; Hindi mirrors it and falls back to
//  English for any missing key (so nothing ever renders blank).
//
//  Language is driven by app state (state.language = 'en' | 'hi'); App.jsx
//  calls i18n.changeLanguage(normalizeLang(...)) whenever it changes.
// ─────────────────────────────────────────────────────────────
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enCommon from './locales/en/common.json';
import enOnboarding from './locales/en/onboarding.json';
import enProfile from './locales/en/profile.json';
import enLearn from './locales/en/learn.json';
import enHome from './locales/en/home.json';
import enQuiz from './locales/en/quiz.json';
import enExam from './locales/en/exam.json';
import enProgress from './locales/en/progress.json';
import enPractice from './locales/en/practice.json';
import enOnboarding2 from './locales/en/onboarding2.json';
import enExtra from './locales/en/extra.json';
import hiCommon from './locales/hi/common.json';
import hiOnboarding from './locales/hi/onboarding.json';
import hiProfile from './locales/hi/profile.json';
import hiLearn from './locales/hi/learn.json';
import hiHome from './locales/hi/home.json';
import hiQuiz from './locales/hi/quiz.json';
import hiExam from './locales/hi/exam.json';
import hiProgress from './locales/hi/progress.json';
import hiPractice from './locales/hi/practice.json';
import hiOnboarding2 from './locales/hi/onboarding2.json';
import hiExtra from './locales/hi/extra.json';

export const SUPPORTED_LANGS = ['en', 'hi'];

// Single source of truth for the language picker. Native name shows in its own
// script; `en`/`hi` codes are what we store in state.language. Add a row here
// (plus a locales/<code>/ folder) to support a new language.
export const LANGUAGES = [
  { code: 'en', native: 'English', label: 'English' },
  { code: 'hi', native: 'हिन्दी', label: 'Hindi' },
];

// App state historically stored 'en'/'hi' but also legacy 'English'/'Hindi'.
export const normalizeLang = (v?: string | null): 'en' | 'hi' =>
  (v === 'hi' || v === 'Hindi' || v === 'हिन्दी') ? 'hi' : 'en';

i18n.use(initReactI18next).init({
  resources: {
    en: { common: enCommon, onboarding: enOnboarding, profile: enProfile, learn: enLearn, home: enHome,
          quiz: enQuiz, exam: enExam, progress: enProgress, practice: enPractice, onboarding2: enOnboarding2, extra: enExtra },
    hi: { common: hiCommon, onboarding: hiOnboarding, profile: hiProfile, learn: hiLearn, home: hiHome,
          quiz: hiQuiz, exam: hiExam, progress: hiProgress, practice: hiPractice, onboarding2: hiOnboarding2, extra: hiExtra },
  },
  lng: 'en',
  fallbackLng: 'en',
  ns: ['common', 'onboarding', 'profile', 'learn', 'home', 'quiz', 'exam', 'progress', 'practice', 'onboarding2', 'extra'],
  defaultNS: 'common',
  interpolation: { escapeValue: false }, // React already escapes
  returnNull: false,
});

export default i18n;
