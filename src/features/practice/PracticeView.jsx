import { API_URL } from '../../config';
import React, { useState } from 'react';
import { topicsMap } from '../../utils/constants';
import { logActivity } from '../../services/activity';
import { Loader2, CheckCircle2, XCircle, Trophy, ArrowRight, ArrowLeft, Sparkles, Brain, TrendingUp, Target, FileText, CheckSquare, Square, Printer, AlertCircle, Check } from 'lucide-react';
import VidyaBot from '../../components/VidyaBot';
import ExamView from './ExamView';

const PracticeView = ({ t, selectedClass, lang, userId, activeSuggestion, onClearSuggestion }) => {
    // ── Mode toggle ───────────────────────────────────────────────────────────
    const [mode, setMode] = useState('quiz'); // 'quiz' | 'paper'

    // ── Shared ────────────────────────────────────────────────────────────────
    const [difficulty, setDifficulty] = useState('Medium');
    const [view, setView] = useState('list'); // 'list'|'loading'|'quiz'|'result'|'error'|'paper-loading'|'paper-result'

    // ── Quiz states ───────────────────────────────────────────────────────────
    const [currentTopic, setCurrentTopic] = useState(null);
    const [currentTopicLabel, setCurrentTopicLabel] = useState('');
    const [selectedQuizTopics, setSelectedQuizTopics] = useState([]);
    const [quiz, setQuiz] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [score, setScore] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);
    const [showExplanation, setShowExplanation] = useState(false);
    const [error, setError] = useState(null);
    const [isDebriefing, setIsDebriefing] = useState(false);
    const [debrief, setDebrief] = useState(null);
    const [userAnswers, setUserAnswers] = useState([]);
    const [aiExplanation, setAiExplanation] = useState('');
    const [isExplaining, setIsExplaining] = useState(false);
    const [timeLeft, setTimeLeft] = useState(300);
    const [activeReviewIdx, setActiveReviewIdx] = useState(null);
    const [showReview, setShowReview] = useState(false);
    const [timerActive, setTimerActive] = useState(false);
    const [loadingStep, setLoadingStep] = useState(0);

    // ── Exam / paper states ───────────────────────────────────────────────────
    const [selectedTopics, setSelectedTopics] = useState([]);
    const [totalMarks, setTotalMarks] = useState(40);
    const [paper, setPaper] = useState(null);
    const [paperReady, setPaperReady] = useState(false);
    const [paperError, setPaperError] = useState(null);

    // ── Profile / suggestion states ───────────────────────────────────────────
    const [suggestion, setSuggestion] = useState(null);
    const [memory, setMemory] = useState({});
    const [profile, setProfile] = useState({});
    const [isDataLoading, setIsDataLoading] = useState(true);

    const topics = topicsMap[selectedClass] || topicsMap['Class 6'];
    const gradeMatch = selectedClass.match(/\d+/);
    const grade = gradeMatch ? parseInt(gradeMatch[0]) : 6;
    const language = lang === 'hi' ? 'Hindi' : lang === 'hinglish' ? 'Hinglish' : 'English';

    // ── Fetch initial data ────────────────────────────────────────────────────
    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const [suggestionRes, profileRes] = await Promise.all([
                    fetch(`${API_URL}/suggestion/${userId || 'test_user_123'}`),
                    fetch(`${API_URL}/profile/${userId || 'test_user_123'}`)
                ]);
                const suggestionData = await suggestionRes.json();
                const profileData = await profileRes.json();
                setSuggestion(suggestionData);
                setProfile(profileData.profile || {});
                setMemory(profileData.profile?.memory_graph || {});
            } catch (err) {
                console.error('Failed to fetch Practice data:', err);
            } finally {
                setIsDataLoading(false);
            }
        };
        fetchData();
    }, [userId]);

    // ── Quiz loading steps ────────────────────────────────────────────────────
    const LOADING_STEPS = [
        { label: 'Reading NCERT syllabus...', detail: 'Scanning chapters and learning objectives' },
        { label: 'Selecting questions...', detail: 'Picking the right mix for your level' },
        { label: 'Calibrating difficulty...', detail: 'Adjusting based on your past performance' },
        { label: 'Finalizing your quiz...', detail: 'Almost ready!' },
    ];

    React.useEffect(() => {
        if (view !== 'loading') { setLoadingStep(0); return; }
        setLoadingStep(0);
        const timers = [
            setTimeout(() => setLoadingStep(1), 2000),
            setTimeout(() => setLoadingStep(2), 6000),
            setTimeout(() => setLoadingStep(3), 12000),
        ];
        return () => timers.forEach(clearTimeout);
    }, [view]);

    // ── Timer ─────────────────────────────────────────────────────────────────
    React.useEffect(() => {
        let interval = null;
        if (timerActive && timeLeft > 0) {
            interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft === 0 && timerActive) {
            finishQuiz();
        }
        return () => clearInterval(interval);
    }, [timerActive, timeLeft]);

    // ── Auto-start from home suggestion ──────────────────────────────────────
    React.useEffect(() => {
        if (activeSuggestion && view === 'list') {
            const topic = topics.find(t_item => t[t_item.label] === activeSuggestion.topic) || topics[0];
            startQuiz(topic, activeSuggestion.focus_points);
            if (onClearSuggestion) onClearSuggestion();
        }
    }, [activeSuggestion, view]);

    // ── Helpers ───────────────────────────────────────────────────────────────
    const syncMemory = async (topicLabel, finalScore) => {
        try {
            await fetch(`${API_URL}/sync-memory`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId || 'test_user_123',
                    memory_graph: {
                        last_session_notes: `${topicLabel} quiz — scored ${finalScore}/5`,
                    }
                })
            });
        } catch (e) { console.error('Memory sync failed'); }
    };

    const fetchAiExplanation = async (q, selectedIdx) => {
        setIsExplaining(true);
        setAiExplanation('');
        try {
            const response = await fetch(`${API_URL}/explain-mistake`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: q.question,
                    user_answer: q.options[selectedIdx],
                    correct_answer: q.options[q.answer],
                    grade
                })
            });
            const data = await response.json();
            setAiExplanation(data.explanation);
        } catch (e) {
            setAiExplanation('The correct answer is ' + q.options[q.answer]);
        } finally {
            setIsExplaining(false);
        }
    };

    // ── Quiz topic helpers ────────────────────────────────────────────────────
    const toggleQuizTopic = (label) =>
        setSelectedQuizTopics(prev => prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]);
    const selectAllQuiz = () => setSelectedQuizTopics(topics.map(tp => t[tp.label] || tp.label));
    const clearQuiz = () => setSelectedQuizTopics([]);

    // ── Paper helpers ─────────────────────────────────────────────────────────
    const toggleTopic = (label) =>
        setSelectedTopics(prev => prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]);
    const selectAll = () => setSelectedTopics(topics.map(tp => t[tp.label] || tp.label));
    const clearAll = () => setSelectedTopics([]);

    // ── Quiz actions ──────────────────────────────────────────────────────────
    // topicOrLabels: single topic object (from suggestion card) OR array of label strings (multi-select)
    const startQuiz = async (topicOrLabels, focusPoints = null) => {
        const isMulti = Array.isArray(topicOrLabels);
        const topicLabels = isMulti
            ? topicOrLabels
            : [t[topicOrLabels.label] || topicOrLabels.label];
        const displayLabel = topicLabels.join(', ');

        setCurrentTopic(isMulti ? null : topicOrLabels);
        setCurrentTopicLabel(displayLabel);
        setView('loading');
        setError(null);
        setDebrief(null);
        setUserAnswers([]);
        setAiExplanation('');
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 60000);
            const response = await fetch(`${API_URL}/generate-quiz`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topics: topicLabels,
                    grade,
                    language,
                    focus_points: focusPoints || null,
                    difficulty
                }),
                signal: controller.signal
            });
            clearTimeout(timeout);
            if (!response.ok) throw new Error('Failed to generate quiz');
            const data = await response.json();
            setQuiz(data.quiz);
            setScore(0);
            setCurrentQuestion(0);
            setSelectedOption(null);
            setShowExplanation(false);
            setTimeLeft(300);
            setTimerActive(true);
            setView('quiz');
            logActivity(userId, 'quiz_started', { topic: displayLabel, difficulty, grade });
        } catch (err) {
            setError(err.name === 'AbortError' ? 'Request timed out. The server may be waking up — try again.' : err.message);
            setView('error');
        }
    };

    const resetToHome = () => {
        setView('list');
        setSelectedOption(null);
        setShowExplanation(false);
        setCurrentTopic(null);
        setUserAnswers([]);
        setTimerActive(false);
        setActiveReviewIdx(null);
        setShowReview(false);
        setPaper(null);
        setPaperReady(false);
        setPaperError(null);
        setSelectedQuizTopics([]);
    };

    const handleAnswer = (index) => {
        if (selectedOption !== null) return;
        setSelectedOption(index);
        setShowExplanation(true);
        setUserAnswers(prev => {
            const newAnswers = [...prev];
            newAnswers[currentQuestion] = index;
            return newAnswers;
        });
    };

    const nextQuestion = (idx) => {
        const finalAns = idx !== undefined ? idx : selectedOption;
        if (currentQuestion < quiz.length - 1) {
            setCurrentQuestion(c => c + 1);
            setSelectedOption(null);
            setShowExplanation(false);
        } else {
            finishQuiz(finalAns);
        }
    };

    const finishQuiz = async (lastAnsIdx) => {
        setTimerActive(false);
        setView('result');
        setIsDebriefing(true);
        let finalScore = 0;
        const finalAnswers = [...userAnswers];
        if (lastAnsIdx !== undefined) finalAnswers[currentQuestion] = lastAnsIdx;
        quiz.forEach((q, i) => { if (finalAnswers[i] === q.answer) finalScore++; });
        setScore(finalScore);
        syncMemory(currentTopicLabel, finalScore);
        logActivity(userId, 'quiz_completed', { topic: currentTopicLabel, score: finalScore, total: quiz.length, time_taken_sec: 300 - timeLeft });
        try {
            const mistakes = quiz.filter((q, idx) => q.answer !== finalAnswers[idx]);
            const response = await fetch(`${API_URL}/debrief`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId || 'test_user_123',
                    topic: currentTopicLabel,
                    score: finalScore,
                    total: quiz.length,
                    mistakes: mistakes.map(m => ({
                        question: m.question,
                        correct_answer: m.options[m.answer],
                        explanation: m.explanation
                    }))
                })
            });
            const data = await response.json();
            setDebrief(data.debrief);
        } catch (err) {
            setDebrief({
                win: 'Great job finishing the quiz!',
                pattern: "You're building solid foundations.",
                next_step: 'Review your answers and keep going!'
            });
        } finally {
            setIsDebriefing(false);
        }
    };

    // ── Prepare exam (fetch paper in background, show confirm screen) ─────────
    const prepareExam = async () => {
        if (selectedTopics.length === 0) return;
        setPaperReady(false);
        setPaperError(null);
        setView('exam-confirm');
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 90000);
            const res = await fetch(`${API_URL}/generate-paper`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topics: selectedTopics, grade, total_marks: totalMarks, language, difficulty }),
                signal: controller.signal
            });
            clearTimeout(timeout);
            if (!res.ok) throw new Error('Failed to generate paper');
            const data = await res.json();
            setPaper(data.paper);
            setPaperReady(true);
            logActivity(userId, 'exam_generated', { topics: selectedTopics, total_marks: totalMarks, difficulty });
        } catch (err) {
            setPaperError(err.name === 'AbortError' ? 'Timed out. Try fewer chapters.' : err.message);
            setView('list');
        }
    };

    // ══════════════════════════════════════════════════════════════════════════
    // VIEWS
    // ══════════════════════════════════════════════════════════════════════════

    // ── Error ─────────────────────────────────────────────────────────────────
    if (view === 'error') {
        return (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[500px] gap-6 px-4 animate-in fade-in duration-500">
                <div className="p-6 bg-red-50 border-2 border-red-100 rounded-[32px] text-center w-full max-w-sm">
                    <p className="text-sm font-black text-red-700 mb-1">Couldn't load quiz</p>
                    <p className="text-xs font-bold text-red-400">{error}</p>
                </div>
                <button onClick={resetToHome} className="px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl text-sm uppercase tracking-widest shadow-lg shadow-indigo-100 active:scale-95 transition-all">
                    Try Again
                </button>
            </div>
        );
    }

    // ── Quiz loading ──────────────────────────────────────────────────────────
    if (view === 'loading') {
        const stepProgress = [20, 45, 70, 90];
        const progressPct = stepProgress[loadingStep] ?? 90;
        return (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[500px] animate-in fade-in duration-500 px-2">
                <VidyaBot message={LOADING_STEPS[loadingStep].label} isLoading={true} />

                {/* Progress bar */}
                <div className="w-full mt-10 mb-6">
                    <div className="flex justify-between mb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Preparing quiz</span>
                        <span className="text-[10px] font-black text-indigo-600">{progressPct}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-indigo-600 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${progressPct}%` }}
                        />
                    </div>
                </div>

                {/* Steps list */}
                <div className="w-full space-y-2">
                    {LOADING_STEPS.map((s, i) => {
                        const done = i < loadingStep;
                        const active = i === loadingStep;
                        return (
                            <div key={i} className={`flex items-center gap-3 p-3 rounded-2xl transition-all duration-500 ${active ? 'bg-indigo-50 border border-indigo-100' : 'opacity-40'}`}>
                                <div className={`size-6 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 ${done ? 'bg-emerald-500' : active ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                                    {done
                                        ? <CheckCircle2 size={14} className="text-white" strokeWidth={3} />
                                        : active
                                            ? <div className="size-2 bg-white rounded-full animate-pulse" />
                                            : <div className="size-2 bg-slate-400 rounded-full" />
                                    }
                                </div>
                                <div>
                                    <p className={`text-xs font-black uppercase tracking-tight ${active ? 'text-indigo-700' : done ? 'text-emerald-600' : 'text-slate-400'}`}>{s.label}</p>
                                    {active && <p className="text-[10px] font-bold text-slate-400 mt-0.5">{s.detail}</p>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    // ── Exam mode ─────────────────────────────────────────────────────────────
    if (view === 'exam-mode') {
        return (
            <ExamView
                paper={paper}
                totalMarks={totalMarks}
                grade={grade}
                language={language}
                selectedClass={selectedClass}
                onDone={resetToHome}
            />
        );
    }

    // ── Exam confirm ──────────────────────────────────────────────────────────
    if (view === 'exam-confirm') {
        const examDuration = totalMarks === 80 ? '3 hours' : '2 hours';
        return (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[500px] gap-6 px-4 animate-in fade-in duration-500">
                {!paperReady ? (
                    <>
                        <div className="size-16 bg-indigo-600 rounded-[28px] flex items-center justify-center shadow-xl shadow-indigo-100">
                            <Loader2 size={28} className="text-white animate-spin" />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-black text-slate-900 uppercase tracking-widest">Preparing Your Exam</p>
                            <p className="text-xs font-bold text-slate-400 mt-1">
                                {selectedTopics.length} chapter{selectedTopics.length > 1 ? 's' : ''} · {totalMarks} marks · {difficulty}
                            </p>
                        </div>
                        <div className="w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-600 rounded-full animate-[loading_3s_linear_infinite]" />
                        </div>
                        <button onClick={resetToHome} className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Cancel
                        </button>
                    </>
                ) : (
                    <>
                        <div className="size-16 bg-emerald-500 rounded-[28px] flex items-center justify-center shadow-xl shadow-emerald-100">
                            <CheckCircle2 size={28} className="text-white" />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-black text-slate-900 uppercase tracking-widest">Your Paper is Ready</p>
                            <p className="text-xs font-bold text-slate-400 mt-1">Read the details below before you begin</p>
                        </div>

                        <div className="w-full bg-white border-2 border-slate-100 rounded-[24px] p-5 space-y-3 shadow-sm">
                            {[
                                { label: 'Chapters', val: selectedTopics.join(', ') },
                                { label: 'Total Marks', val: `${totalMarks} marks` },
                                { label: 'Time Allowed', val: examDuration },
                                { label: 'Difficulty', val: difficulty },
                            ].map(row => (
                                <div key={row.label} className="flex items-start justify-between gap-4">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">{row.label}</span>
                                    <span className="text-xs font-black text-slate-800 text-right">{row.val}</span>
                                </div>
                            ))}
                        </div>

                        <div className="w-full p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                            <p className="text-xs font-bold text-amber-700 text-center">
                                Once you begin, the timer starts and cannot be paused.
                                Solve on paper — you'll upload your answer sheet at the end.
                            </p>
                        </div>

                        <div className="w-full space-y-3">
                            <button
                                onClick={() => setView('exam-mode')}
                                className="w-full py-5 bg-indigo-600 text-white font-black rounded-[28px] text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-indigo-100 active:scale-[0.98] transition-all"
                            >
                                Begin Exam
                            </button>
                            <button onClick={resetToHome} className="w-full text-center text-[10px] font-black text-slate-400 uppercase tracking-widest py-2">
                                Cancel
                            </button>
                        </div>
                    </>
                )}
            </div>
        );
    }

    // ── Quiz view ─────────────────────────────────────────────────────────────
    if (view === 'quiz' && quiz.length > 0) {
        const q = quiz[currentQuestion];
        return (
            <div className="space-y-6 animate-in fade-in zoom-in duration-500 pb-20">
                <div className="flex items-center justify-between px-2">
                    <div className="flex-1">
                        <div className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-1 truncate max-w-[180px]">
                            {currentTopicLabel}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-slate-900 tracking-tight">Question {currentQuestion + 1}</span>
                            <span className="text-[10px] font-bold text-slate-300">/ {quiz.length}</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t.timeRemaining}</div>
                        <div className={`px-3 py-1.5 rounded-xl border-2 font-black text-sm ${timeLeft < 30 ? 'bg-red-50 border-red-100 text-red-600 animate-pulse' : 'bg-white border-slate-100 text-indigo-600'}`}>
                            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                        </div>
                    </div>
                </div>

                <div className="bg-white border-2 border-slate-100 rounded-[32px] p-8 shadow-sm">
                    <p className="text-lg font-black text-slate-900 leading-tight mb-8">{q.question}</p>
                    <div className="space-y-3">
                        {q.options.map((opt, i) => {
                            const isCorrect = i === q.answer;
                            const isSelected = i === selectedOption;
                            let style = 'border-slate-100 bg-slate-50 text-slate-900';
                            if (selectedOption !== null) {
                                if (isCorrect) style = 'border-green-500 bg-green-50 text-green-700 ring-2 ring-green-100';
                                else if (isSelected) style = 'border-red-500 bg-red-50 text-red-700 ring-2 ring-red-100';
                                else style = 'border-slate-50 opacity-40';
                            }
                            return (
                                <button key={i} onClick={() => handleAnswer(i)} disabled={selectedOption !== null}
                                    className={`w-full p-5 border-2 rounded-2xl text-left font-bold transition-all flex items-center justify-between group ${style}`}>
                                    <span>{opt}</span>
                                    {selectedOption !== null && isCorrect && <CheckCircle2 size={18} />}
                                    {selectedOption !== null && isSelected && !isCorrect && <XCircle size={18} />}
                                </button>
                            );
                        })}
                    </div>
                    {showExplanation && (
                        <div className="mt-8 p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100 animate-in slide-in-from-top-4">
                            <h5 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Sparkles size={14} /> Quick Logic
                            </h5>
                            <p className="text-xs font-bold text-slate-600 leading-relaxed">{q.explanation}</p>
                            <button onClick={() => nextQuestion()}
                                className="w-full mt-6 py-4 bg-indigo-600 text-white font-black rounded-2xl text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-indigo-100 active:scale-[0.98] transition-all">
                                {currentQuestion < quiz.length - 1 ? 'Next Question' : 'Finish Quiz'} <ArrowRight size={18} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ── Result view ───────────────────────────────────────────────────────────
    if (view === 'result') {
        const percentage = Math.round((score / quiz.length) * 100);

        if (showReview) {
            return (
                <div className="flex-1 flex flex-col items-center min-h-[500px] animate-in slide-in-from-right-8 duration-500 text-left px-4 pb-20 overflow-y-auto">
                    <div className="w-full max-w-sm mx-auto space-y-8">
                        <div className="flex items-center justify-between mb-2">
                            <button onClick={() => setShowReview(false)}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95">
                                <ArrowRight className="rotate-180" size={14} /> Back to Results
                            </button>
                            <button onClick={resetToHome} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-red-500 transition-colors">Exit</button>
                        </div>
                        <div className="pt-4">
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Question Review</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Deep dive into your performance</p>
                        </div>
                        <div className="space-y-6">
                            {quiz.map((q, idx) => {
                                const isCorrect = userAnswers[idx] === q.answer;
                                const isExpanded = activeReviewIdx === idx;
                                return (
                                    <div key={idx} className={`bg-white border-2 rounded-[32px] p-6 transition-all ${isCorrect ? 'border-emerald-50' : 'border-indigo-50 shadow-sm shadow-indigo-50'}`}>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`size-8 rounded-xl flex items-center justify-center ${isCorrect ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                                    {isCorrect ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                                                </div>
                                                <span className="text-xs font-black text-slate-900 uppercase tracking-widest">Question {idx + 1}</span>
                                            </div>
                                            {!isCorrect && (
                                                <button
                                                    onClick={() => { setActiveReviewIdx(isExpanded ? null : idx); if (!isExpanded) fetchAiExplanation(q, userAnswers[idx]); }}
                                                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 active:scale-95 transition-all">
                                                    {isExpanded ? 'Hide Help' : 'Help Me'}
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-sm font-bold text-slate-800 leading-tight mb-4">{q.question}</p>
                                        {isExpanded && (
                                            <div className="mt-6 pt-6 border-t border-slate-100 animate-in slide-in-from-top-4">
                                                <div className="space-y-4 mb-6">
                                                    <div>
                                                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Your Choice</div>
                                                        <div className="px-4 py-3 bg-red-50 text-red-700 text-xs font-bold rounded-2xl border border-red-100">{q.options[userAnswers[idx]]}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1.5 ml-1">Correct Choice</div>
                                                        <div className="px-4 py-3 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-2xl border border-emerald-100">{q.options[q.answer]}</div>
                                                    </div>
                                                </div>
                                                <div className="p-6 bg-slate-50 rounded-[24px] border border-slate-100">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <Sparkles size={14} className="text-indigo-600" />
                                                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Vidya's Quick Logic</span>
                                                    </div>
                                                    <p className="text-xs font-bold text-slate-600 leading-relaxed mb-6">{q.explanation}</p>
                                                    <div className="pt-6 border-t border-slate-200">
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <Brain size={16} className="text-indigo-400" />
                                                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Vidya's Explanation</span>
                                                        </div>
                                                        <p className="text-xs font-bold text-slate-800 italic leading-relaxed">
                                                            {isExplaining ? 'Analyzing your mistake pattern...' : (aiExplanation || 'Wait, let me look into why that happened...')}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <button onClick={() => setShowReview(false)}
                            className="w-full py-5 bg-slate-900 text-white font-black rounded-[32px] uppercase tracking-[0.2em] shadow-xl shadow-slate-200 active:scale-95 transition-all mt-8">
                            Return To Results
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <div className="flex-1 flex flex-col items-center min-h-[500px] animate-in zoom-in duration-500 text-center px-4 pb-12 overflow-y-auto">
                <div className="w-full max-w-sm mx-auto">
                    <VidyaBot
                        message={isDebriefing ? t.quizAnalyzing : (percentage >= 80 ? "Amazing job! You're really getting this." : "Good effort! Let's look at how to improve.")}
                        isLoading={isDebriefing}
                    />
                    <div className="mt-4 flex items-center justify-between px-6 py-3 bg-white rounded-2xl border border-slate-100 shadow-sm mb-6">
                        <div className="flex items-center gap-2">
                            <Trophy size={18} className="text-amber-500" />
                            <span className="text-sm font-black text-slate-700">{score}/{quiz.length} Correct</span>
                        </div>
                        <div className="text-sm font-black text-indigo-600">{percentage}%</div>
                    </div>
                    {isDebriefing ? (
                        <div className="w-full space-y-4 py-8 animate-pulse">
                            <div className="h-24 bg-slate-50 rounded-3xl"></div>
                            <div className="h-24 bg-slate-50 rounded-3xl"></div>
                        </div>
                    ) : (
                        debrief && (
                            <div className="space-y-4 text-left w-full mt-2">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 mb-4">Vidya's Analysis</h3>
                                <div className="p-6 bg-emerald-50/60 backdrop-blur-md rounded-[32px] border border-emerald-100 shadow-sm animate-in slide-in-from-bottom-8 duration-700">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2.5 bg-emerald-500 rounded-xl text-white shadow-emerald-100 shadow-lg"><Trophy size={18} /></div>
                                        <div>
                                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block leading-none">High Five!</span>
                                            <span className="text-sm font-black text-slate-800">Where you did great</span>
                                        </div>
                                    </div>
                                    <p className="text-xs font-bold text-slate-600 leading-relaxed pl-1">{debrief.win}</p>
                                </div>
                                <div className="p-6 bg-indigo-50/60 backdrop-blur-md rounded-[32px] border border-indigo-100 shadow-sm animate-in slide-in-from-bottom-8 delay-150 duration-700">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2.5 bg-indigo-500 rounded-xl text-white shadow-indigo-100 shadow-lg"><Target size={18} /></div>
                                        <div>
                                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block leading-none">Focus Area</span>
                                            <span className="text-sm font-black text-slate-800">How to improve</span>
                                        </div>
                                    </div>
                                    <p className="text-xs font-bold text-slate-600 leading-relaxed pl-1">{debrief.pattern}</p>
                                </div>
                                <div className="p-8 bg-slate-900 rounded-[32px] shadow-2xl shadow-indigo-100 animate-in slide-in-from-bottom-8 delay-300 duration-700 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform"><ArrowRight size={80} /></div>
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2 bg-white/10 rounded-xl text-white"><TrendingUp size={18} /></div>
                                            <span className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em]">Your Next Step</span>
                                        </div>
                                        <p className="text-sm font-bold text-white leading-relaxed mb-1">{debrief.next_step}</p>
                                    </div>
                                </div>
                            </div>
                        )
                    )}
                    {!isDebriefing && (
                        <div className="w-full space-y-3 mt-12 pb-12">
                            <button onClick={() => setShowReview(true)}
                                className="w-full py-5 bg-white text-slate-900 border-2 border-slate-100 font-black rounded-3xl text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-50 transition-all shadow-sm">
                                Review Questions <Brain size={18} />
                            </button>
                            <button onClick={resetToHome}
                                className="w-full py-4 bg-transparent text-slate-400 font-black rounded-3xl text-sm uppercase tracking-widest hover:text-slate-600 transition-colors">
                                Done for now
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ══════════════════════════════════════════════════════════════════════════
    // LIST VIEW
    // ══════════════════════════════════════════════════════════════════════════

    // Difficulty selector — shared between both modes
    const DifficultySelector = () => (
        <div className="space-y-2">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Difficulty</h4>
            <div className="grid grid-cols-3 gap-2">
                {[
                    { val: 'Easy',   label: 'Thinker', desc: 'Straightforward', color: 'border-emerald-500 bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
                    { val: 'Medium', label: 'Scholar', desc: 'Apply concepts',  color: 'border-amber-500 bg-amber-50 text-amber-700',   dot: 'bg-amber-500'   },
                    { val: 'Hard',   label: 'Genius',  desc: 'Real exam level', color: 'border-red-500 bg-red-50 text-red-700',          dot: 'bg-red-500'     },
                ].map(d => (
                    <button key={d.val} onClick={() => setDifficulty(d.val)}
                        className={`flex flex-col items-center py-3 rounded-2xl border-2 transition-all active:scale-95 ${difficulty === d.val ? d.color : 'border-slate-100 bg-white text-slate-400'}`}>
                        <div className={`size-2 rounded-full mb-1.5 ${difficulty === d.val ? d.dot : 'bg-slate-200'}`} />
                        <span className="text-[11px] font-black uppercase tracking-widest">{d.label}</span>
                        <span className="text-[9px] font-bold mt-0.5 opacity-70">{d.desc}</span>
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-500 pb-20">

            {/* ── Mode Toggle ─────────────────────────────────────────────────── */}
            <div className="bg-slate-100 p-1 rounded-2xl flex gap-1">
                <button
                    onClick={() => setMode('quiz')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${mode === 'quiz' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                >
                    <Brain size={13} /> Quick Quiz
                </button>
                <button
                    onClick={() => setMode('paper')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${mode === 'paper' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                >
                    <FileText size={13} /> Give Exam
                </button>
            </div>

            {/* ══════════════════════════════════════════════════════════════════ */}
            {mode === 'quiz' ? (
                <>
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">
                                {new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()} · {selectedClass.toUpperCase()}
                            </span>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                                Good morning, {profile.name?.split(' ')[0] || 'Student'}
                            </h2>
                        </div>
                    </div>

                    {/* Smart Insight Card */}
                    <div className="bg-slate-900 rounded-[32px] p-6 shadow-xl relative overflow-hidden group">
                        <div className="absolute right-0 top-0 p-8 opacity-10 rotate-12 group-hover:rotate-6 transition-transform">
                            <Brain size={100} className="text-white" />
                        </div>
                        <div className="relative z-10 flex items-start gap-4">
                            <div className="p-3 bg-white/10 rounded-2xl text-white">
                                <Sparkles size={24} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-indigo-100/90 leading-relaxed pr-8">
                                    {suggestion ? suggestion.reason : 'Loading your academic path...'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Suggested Quiz Hero Card */}
                    {suggestion && (
                        <div className="bg-white border-2 border-indigo-100 rounded-[32px] overflow-hidden shadow-sm">
                            <div className="bg-slate-800 px-6 py-2 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Target size={14} className="text-indigo-400" />
                                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Suggested for you</span>
                                </div>
                                <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">15 MIN</span>
                            </div>
                            <div className="p-6">
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-1">
                                    {suggestion.topic} — <span className="text-indigo-600">Adaptive Fix</span>
                                </h3>
                                <p className="text-xs font-bold text-slate-400 mb-6">Adaptive difficulty</p>
                                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ready to go?</span>
                                    <button
                                        onClick={() => {
                                            const topic = topics.find(t_item => t[t_item.label] === suggestion.topic) || topics[0];
                                            startQuiz(topic, suggestion.focus_points);
                                        }}
                                        className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100 active:scale-95 transition-all"
                                    >
                                        Start Assessment
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Difficulty */}
                    <DifficultySelector />

                    {/* Chapter list */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Chapters</h4>
                            <div className="flex gap-3">
                                <button onClick={selectAllQuiz} className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">All</button>
                                <button onClick={clearQuiz} className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Clear</button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            {topics.map((topic, i) => {
                                const label = t[topic.label] || topic.label;
                                const isSelected = selectedQuizTopics.includes(label);
                                const isStrong = memory.strong_topics?.includes(label);
                                const isWeak = memory.weak_topics?.includes(topic.label);
                                return (
                                    <button
                                        key={topic.id}
                                        onClick={() => toggleQuizTopic(label)}
                                        className={`w-full flex items-center gap-3 p-4 rounded-[20px] border-2 text-left transition-all active:scale-[0.98] ${
                                            isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 bg-white hover:border-indigo-200'
                                        }`}
                                    >
                                        <div className={`size-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                                            isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-slate-300 bg-white'
                                        }`}>
                                            {isSelected && <Check size={12} className="text-white" />}
                                        </div>
                                        <div className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-50 text-slate-400'}`}>
                                            <topic.icon size={18} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className={`text-sm font-black truncate ${isSelected ? 'text-indigo-700' : 'text-slate-800'}`}>{label}</span>
                                                {isStrong && <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[8px] font-black uppercase tracking-widest shrink-0">Strong</span>}
                                                {isWeak   && <span className="px-1.5 py-0.5 bg-orange-50 text-orange-600 rounded text-[8px] font-black uppercase tracking-widest shrink-0">Needs work</span>}
                                            </div>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                                5 questions · {difficulty === 'Easy' ? 'Thinker' : difficulty === 'Hard' ? 'Genius' : 'Scholar'}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Start Quiz CTA */}
                    <button
                        onClick={() => startQuiz(selectedQuizTopics)}
                        disabled={selectedQuizTopics.length === 0}
                        className="w-full py-5 bg-indigo-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black rounded-[28px] text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-indigo-100 active:scale-[0.98] transition-all"
                    >
                        <Brain size={18} />
                        Start Quiz
                        {selectedQuizTopics.length > 0 && (
                            <span className="bg-white/20 px-2 py-0.5 rounded-lg text-[10px]">
                                {selectedQuizTopics.length} chapter{selectedQuizTopics.length > 1 ? 's' : ''}
                            </span>
                        )}
                    </button>
                </>
            ) : (
                /* ══════════════════════════════════════════════════════════════ */
                /* PAPER MODE */
                /* ══════════════════════════════════════════════════════════════ */
                <>
                    {/* Paper error */}
                    {paperError && (
                        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl">
                            <AlertCircle size={16} className="text-red-500 shrink-0" />
                            <p className="text-xs font-bold text-red-600">{paperError}</p>
                        </div>
                    )}

                    {/* Marks selector */}
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2">Total Marks</p>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { val: 40, label: '40 Marks', sub: 'Half-yearly · 2 hrs', sections: 'A(10×1) B(5×2) C(4×3) D(2×4)' },
                                { val: 80, label: '80 Marks', sub: 'Annual · 3 hrs',      sections: 'A(20×1) B(10×2) C(8×3) D(4×4)' },
                            ].map(opt => (
                                <button key={opt.val} onClick={() => setTotalMarks(opt.val)}
                                    className={`p-4 rounded-[24px] border-2 text-left transition-all active:scale-[0.98] ${totalMarks === opt.val ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 bg-white'}`}>
                                    <p className={`text-sm font-black ${totalMarks === opt.val ? 'text-indigo-700' : 'text-slate-900'}`}>{opt.label}</p>
                                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">{opt.sub}</p>
                                    <p className={`text-[9px] font-black mt-2 uppercase tracking-widest ${totalMarks === opt.val ? 'text-indigo-400' : 'text-slate-300'}`}>{opt.sections}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Difficulty */}
                    <DifficultySelector />

                    {/* Chapter checkboxes */}
                    <div>
                        <div className="flex items-center justify-between px-1 mb-2">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Chapters</p>
                            <div className="flex gap-3">
                                <button onClick={selectAll} className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">All</button>
                                <button onClick={clearAll} className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Clear</button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            {topics.map((tp) => {
                                const label = t[tp.label] || tp.label;
                                const isSelected = selectedTopics.includes(label);
                                return (
                                    <button key={tp.id} onClick={() => toggleTopic(label)}
                                        className={`w-full flex items-center gap-3 p-4 rounded-[20px] border-2 transition-all active:scale-[0.98] text-left ${isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 bg-white hover:border-indigo-200'}`}>
                                        {isSelected
                                            ? <CheckSquare size={18} className="text-indigo-600 shrink-0" />
                                            : <Square size={18} className="text-slate-300 shrink-0" />}
                                        <span className={`text-sm font-black ${isSelected ? 'text-indigo-700' : 'text-slate-700'}`}>{label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Generate button */}
                    <button onClick={prepareExam} disabled={selectedTopics.length === 0}
                        className="w-full py-5 bg-indigo-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black rounded-[28px] text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-indigo-100 active:scale-[0.98] transition-all">
                        <FileText size={18} />
                        Start Exam
                        {selectedTopics.length > 0 && (
                            <span className="bg-white/20 px-2 py-0.5 rounded-lg text-[10px]">{selectedTopics.length} chapter{selectedTopics.length > 1 ? 's' : ''}</span>
                        )}
                    </button>
                </>
            )}
        </div>
    );
};

export default PracticeView;
