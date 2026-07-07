import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './auth/auth-context';
import api from './api/vidya';
import i18n, { normalizeLang } from './i18n';
import { SCREEN_ROUTES, type ScreenId } from './routes';
import { AppContext, type AppContextValue } from './app-context';
import { storageKeyFor } from './lib/storage';
import { guestLimitReached } from './lib/guest';
import type { AppState, SetFn, GoFn } from './types';

// Screens that begin a "learning session" — gated once a guest is out of free runs.
const SESSION_ENTRY_SCREENS = new Set<ScreenId>(['learn-concept', 'navigable-quiz']);

// ─── Screen imports — Onboarding ─────────────────────────────
import SplashScreen        from './screens/onboarding/SplashScreen';
import RoleScreen          from './screens/onboarding/RoleScreen';
import LanguageScreen      from './screens/onboarding/LanguageScreen';
import ClassScreen         from './screens/onboarding/ClassScreen';
import GoalScreen          from './screens/onboarding/GoalScreen';
import NameScreen          from './screens/onboarding/NameScreen';
import DiagIntroScreen     from './screens/onboarding/DiagIntroScreen';
import BuildPlanScreen     from './screens/onboarding/BuildPlanScreen';
import DiagQ1Screen        from './screens/onboarding/DiagQ1Screen';
import DiagSummaryScreen   from './screens/onboarding/DiagSummaryScreen';
import DiagDrillScreen     from './screens/onboarding/DiagDrillScreen';
import DiagBuildingScreen  from './screens/onboarding/DiagBuildingScreen';
import DiagResultScreen    from './screens/onboarding/DiagResultScreen';
import FirstPlanScreen     from './screens/onboarding/FirstPlanScreen';
import SaveProgressScreen  from './screens/onboarding/SaveProgressScreen';
import SignUpScreen        from './screens/onboarding/SignUpScreen';
import PasswordScreen      from './screens/onboarding/PasswordScreen';

// ─── Screen imports — Home ────────────────────────────────────
import HomeScreen          from './screens/home/HomeScreen';
import HomePostDiagScreen  from './screens/home/HomePostDiagScreen';
import WeekPlanScreen      from './screens/home/WeekPlanScreen';

// ─── Screen imports — Learn ───────────────────────────────────
import LearnScreen         from './screens/learn/LearnScreen';
import SyllabusScreen      from './screens/learn/SyllabusScreen';
import ConceptScreen       from './screens/learn/ConceptScreen';
import ChapterTopicsScreen from './screens/learn/ChapterTopicsScreen';

// ─── Screen imports — Quiz ────────────────────────────────────
import QuizLoadingScreen        from './screens/quiz/QuizLoadingScreen';
import NavigableQuizScreen      from './screens/quiz/NavigableQuizScreen';
import FinalReviewScreen        from './screens/quiz/FinalReviewScreen';
import QuizResultSummaryScreen  from './screens/quiz/QuizResultSummaryScreen';
import QuizReviewQuestionScreen from './screens/quiz/QuizReviewQuestionScreen';
import QuickPrepScreen          from './screens/quiz/QuickPrepScreen';

// ─── Screen imports — Practice ────────────────────────────────
import PracticeScreen        from './screens/practice/PracticeScreen';
import ReviseClassScreen     from './screens/practice/ReviseClassScreen';
import ConceptLibraryScreen  from './screens/practice/ConceptLibraryScreen';
import LearningStudioScreen  from './screens/practice/LearningStudioScreen';

// ─── Screen imports — Exam ────────────────────────────────────
import ExamConfigScreen       from './screens/exam/ExamConfigScreen';
import ExamLoadingScreen      from './screens/exam/ExamLoadingScreen';
import ExamPaperScreen        from './screens/exam/ExamPaperScreen';
import ExamPhotoScreen        from './screens/exam/ExamPhotoScreen';
import ExamSubmitScreen       from './screens/exam/ExamSubmitScreen';
import ExamEvalLoadingScreen  from './screens/exam/ExamEvalLoadingScreen';
import ExamEvalResultsScreen  from './screens/exam/ExamEvalResultsScreen';
import ExamDetailScreen       from './screens/exam/ExamDetailScreen';

// ─── Screen imports — Progress / Profile ─────────────────────
import SessionAnalysisScreen from './screens/progress/SessionAnalysisScreen';
import ProgressScreen        from './screens/progress/ProgressScreen';
import TopicMasteryScreen    from './screens/progress/TopicMasteryScreen';
import ProfileScreen         from './screens/progress/ProfileScreen';

// Reverse lookup: path → screen-id
const PATH_TO_SCREEN: Record<string, ScreenId> = Object.fromEntries(
  Object.entries(SCREEN_ROUTES).map(([k, v]) => [v, k])
) as Record<string, ScreenId>;

const PERSIST_KEYS: (keyof AppState)[] = [
  'sessionStep', 'sessionDate', 'planTopicId', 'planSection', 'planSubtopicTitle', 'weekPlan',
  'sessionDuration', 'planMascotSeen', 'buildPlanCoachSeen', 'ownPlan',
  'name', 'class', 'subject', 'goal', 'language', 'role',
  'diagLevel', 'diagChapters', 'conceptLayout', 'skillId',
  'activityLog', 'guestSessions',
];

const DEFAULT_STATE: AppState = { name: 'Arjun', conceptLayout: 'cards' };

function loadState(key: string): AppState {
  try {
    const saved = JSON.parse(localStorage.getItem(key) || '{}');
    return { ...DEFAULT_STATE, ...saved };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

// ─── Inner app — has access to useNavigate / useLocation ──────
function AppInner() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const uid = user?.uid || null;
  const storageKey = storageKeyFor(uid);

  const [state, setState] = useState<AppState>(() => loadState(storageKeyFor(null)));

  // Keep the UI language in sync with the chosen language ('en'/'hi').
  useEffect(() => {
    i18n.changeLanguage(normalizeLang(state.language));
  }, [state.language]);

  // When the signed-in user changes (login/logout/signup), swap to THAT
  // user's saved state. A brand-new uid has no bucket yet → fresh start.
  const loadedKey = useRef<string | null>(null);
  useEffect(() => {
    if (authLoading) return;
    if (loadedKey.current === storageKey) return;
    loadedKey.current = storageKey;
    setState({ ...loadState(storageKey), userId: uid });
  }, [storageKey, authLoading, uid]);

  // Persist state to the current user's bucket.
  useEffect(() => {
    if (authLoading) return;
    try {
      const toPersist: Partial<AppState> = {};
      PERSIST_KEYS.forEach((k) => { if (state[k] !== undefined) toPersist[k] = state[k]; });
      localStorage.setItem(storageKey, JSON.stringify(toPersist));
    } catch { /* ignore quota / serialization errors */ }
  }, [state, storageKey, authLoading]);

  // Sync the profile to Firestore (user_profiles/{uid}) once a signed-in user
  // has onboarding data. Re-runs only when the synced fields actually change.
  const syncedProfile = useRef<string | null>(null);
  useEffect(() => {
    if (!uid || !state.name) return;
    const grade = api.toGrade(state.classLevel);
    const language = state.language || 'English';
    const sig = `${state.name}|${grade}|${language}|${user?.email || ''}`;
    if (syncedProfile.current === sig) return;
    syncedProfile.current = sig;
    api.updateProfile({ userId: uid, name: state.name, grade, language, email: user?.email })
      .catch(() => {});
  }, [uid, state.name, state.classLevel, state.language, user?.email]);

  const set: SetFn = (patch) => setState((s) => ({ ...s, ...patch }));

  // Derive current screen id from URL
  const currentScreen: ScreenId = PATH_TO_SCREEN[location.pathname] || 'splash';

  const go: GoFn = (screenId) => {
    // Guest gate: once free sessions are used up, starting a new learning
    // session sends the guest to a mandatory signup wall instead.
    if (SESSION_ENTRY_SCREENS.has(screenId) && guestLimitReached(state)) {
      setState((s) => ({ ...s, signupRequired: true, afterAuth: screenId }));
      navigate(SCREEN_ROUTES['save-progress']);
      return;
    }
    // Track session steps when navigating back to home
    if (screenId === 'home') {
      const todayStr = new Date().toDateString();
      const currentStep = state.sessionDate === todayStr ? (state.sessionStep || 0) : 0;
      if (currentScreen === 'learn-concept' && currentStep < 1) {
        setState((s) => ({ ...s, sessionStep: 1, sessionDate: todayStr }));
      }
      if (['navigable-quiz', 'quiz-result-summary', 'final-review'].includes(currentScreen) && currentStep < 2) {
        setState((s) => ({ ...s, sessionStep: 2, sessionDate: todayStr }));
      }
      if (currentScreen === 'session-analysis' && currentStep < 3) {
        setState((s) => ({ ...s, sessionStep: 3, sessionDate: todayStr }));
      }
    }
    const path = SCREEN_ROUTES[screenId];
    if (path) navigate(path);
  };

  const ctx: AppContextValue = { state, set, go, currentScreen };

  return (
    <AppContext.Provider value={ctx}>
      <div style={{ width: '100%', height: '100%', overflow: 'auto', position: 'relative' }}>
        <Routes>
          {/* Onboarding */}
          <Route path="/"                       element={<SplashScreen        go={go} state={state} set={set} />} />
          <Route path="/role"                   element={<RoleScreen          go={go} state={state} set={set} />} />
          <Route path="/onb/language"           element={<LanguageScreen      go={go} state={state} set={set} />} />
          <Route path="/onb/class"              element={<ClassScreen         go={go} state={state} set={set} />} />
          <Route path="/onb/goal"               element={<GoalScreen          go={go} state={state} set={set} />} />
          <Route path="/onb/name"               element={<NameScreen          go={go} state={state} set={set} />} />
          <Route path="/onb/diag-intro"         element={<DiagIntroScreen     go={go} state={state} set={set} />} />
          <Route path="/onb/build-plan"         element={<BuildPlanScreen     go={go} state={state} set={set} />} />
          <Route path="/onb/diag-q1"            element={<DiagQ1Screen        go={go} state={state} set={set} />} />
          <Route path="/onb/diag-summary"       element={<DiagSummaryScreen   go={go} state={state} set={set} />} />
          <Route path="/onb/diag-drill"         element={<DiagDrillScreen     go={go} state={state} set={set} />} />
          <Route path="/onb/diag-building"      element={<DiagBuildingScreen  go={go} state={state} set={set} />} />
          <Route path="/onb/diag-result"        element={<DiagResultScreen    go={go} state={state} set={set} />} />
          <Route path="/onb/first-plan"         element={<FirstPlanScreen     go={go} state={state} set={set} />} />
          <Route path="/save-progress"          element={<SaveProgressScreen  go={go} state={state} set={set} />} />
          <Route path="/signup"                 element={<SignUpScreen        go={go} state={state} set={set} />} />
          <Route path="/password"               element={<PasswordScreen      go={go} state={state} set={set} />} />

          {/* Home */}
          <Route path="/home"                   element={<HomeScreen          go={go} state={state} set={set} />} />
          <Route path="/home/post-diag"         element={<HomePostDiagScreen  go={go} state={state} set={set} />} />
          <Route path="/week-plan"              element={<WeekPlanScreen      go={go} state={state} set={set} />} />

          {/* Learn */}
          <Route path="/learn"                  element={<LearnScreen         go={go} state={state} set={set} />} />
          <Route path="/syllabus"               element={<SyllabusScreen      go={go} state={state} set={set} />} />
          <Route path="/learn/chapter"          element={<ChapterTopicsScreen go={go} state={state} set={set} />} />
          <Route path="/learn/concept"          element={<ConceptScreen       go={go} state={state} set={set} />} />

          {/* Quiz */}
          <Route path="/quiz/loading/1"         element={<QuizLoadingScreen   go={go} state={state} set={set} frame={1} />} />
          <Route path="/quiz/loading/2"         element={<QuizLoadingScreen   go={go} state={state} set={set} frame={2} />} />
          <Route path="/quiz/loading/3"         element={<QuizLoadingScreen   go={go} state={state} set={set} frame={3} />} />
          <Route path="/quiz/loading/4"         element={<QuizLoadingScreen   go={go} state={state} set={set} frame={4} />} />
          <Route path="/quiz/navigable"         element={<NavigableQuizScreen      go={go} state={state} set={set} />} />
          <Route path="/quiz/final-review"      element={<FinalReviewScreen        go={go} state={state} set={set} />} />
          <Route path="/quiz/result-summary"    element={<QuizResultSummaryScreen  go={go} state={state} set={set} />} />
          <Route path="/quiz/review-question"   element={<QuizReviewQuestionScreen go={go} state={state} set={set} />} />
          <Route path="/quick-prep"             element={<QuickPrepScreen          go={go} state={state} set={set} />} />

          {/* Practice */}
          <Route path="/practice"                 element={<PracticeScreen        go={go} state={state} set={set} />} />
          <Route path="/practice/revise-class"    element={<ReviseClassScreen     go={go} state={state} set={set} />} />
          <Route path="/practice/concept-library" element={<ConceptLibraryScreen  go={go} state={state} set={set} />} />
          <Route path="/practice/learning-studio" element={<LearningStudioScreen  go={go} state={state} set={set} />} />

          {/* Exam */}
          <Route path="/exam/config"             element={<ExamConfigScreen      go={go} state={state} set={set} />} />
          <Route path="/exam/loading/1"          element={<ExamLoadingScreen     go={go} state={state} set={set} frame={1} />} />
          <Route path="/exam/loading/2"          element={<ExamLoadingScreen     go={go} state={state} set={set} frame={2} />} />
          <Route path="/exam/paper"              element={<ExamPaperScreen       go={go} state={state} set={set} />} />
          <Route path="/exam/photo"              element={<ExamPhotoScreen       go={go} state={state} set={set} />} />
          <Route path="/exam/submit"             element={<ExamSubmitScreen      go={go} state={state} set={set} />} />
          <Route path="/exam/eval-loading"       element={<ExamEvalLoadingScreen go={go} state={state} set={set} />} />
          <Route path="/exam/eval-results"       element={<ExamEvalResultsScreen go={go} state={state} set={set} />} />
          <Route path="/exam/detail"             element={<ExamDetailScreen      go={go} state={state} set={set} />} />

          {/* Progress + Profile */}
          <Route path="/session-analysis"        element={<SessionAnalysisScreen go={go} state={state} set={set} />} />
          <Route path="/progress"                element={<ProgressScreen        go={go} state={state} set={set} />} />
          <Route path="/progress/topic-mastery"  element={<TopicMasteryScreen    go={go} state={state} set={set} />} />
          <Route path="/profile"                 element={<ProfileScreen         go={go} state={state} set={set} />} />

          {/* Fallback */}
          <Route path="*" element={<SplashScreen go={go} state={state} set={set} />} />
        </Routes>
      </div>
    </AppContext.Provider>
  );
}

export default function App() {
  return <AppInner />;
}
