import React, { useState } from 'react';
import { topicsMap } from '../../utils/constants';
import { Loader2, CheckCircle2, XCircle, Trophy, ArrowRight, Sparkles, Brain, GraduationCap, TrendingUp, Target, ChevronRight, Lock, Flame, Star } from 'lucide-react';
import VidyaBot from '../../components/VidyaBot';

const PracticeView = ({ t, selectedClass, lang, userId, activeSuggestion, onClearSuggestion }) => {
    const [view, setView] = useState('list'); // 'list', 'loading', 'quiz', 'result'
    const [currentTopic, setCurrentTopic] = useState(null);
    const [quiz, setQuiz] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [score, setScore] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);
    const [showExplanation, setShowExplanation] = useState(false);
    const [error, setError] = useState(null);

    const [isDebriefing, setIsDebriefing] = useState(false);
    const [debrief, setDebrief] = useState(null);
    const [userAnswers, setUserAnswers] = useState([]);
    const [aiExplanation, setAiExplanation] = useState("");
    const [isExplaining, setIsExplaining] = useState(false);
    const [timeLeft, setTimeLeft] = useState(300);
    const [activeReviewIdx, setActiveReviewIdx] = useState(null);
    const [showReview, setShowReview] = useState(false);
    const [timerActive, setTimerActive] = useState(false);

    // New State for Premium UI
    const [suggestion, setSuggestion] = useState(null);
    const [memory, setMemory] = useState({});
    const [profile, setProfile] = useState({});
    const [isDataLoading, setIsDataLoading] = useState(true);

    const topics = topicsMap[selectedClass] || topicsMap['Class 6'];

    // Fetch initial data
    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const [suggestionRes, profileRes] = await Promise.all([
                    fetch(`http://localhost:8000/suggestion/${userId || "test_user_123"}`),
                    fetch(`http://localhost:8000/profile/${userId || "test_user_123"}`)
                ]);

                const suggestionData = await suggestionRes.json();
                const profileData = await profileRes.json();

                setSuggestion(suggestionData);
                setProfile(profileData.profile || {});
                setMemory(profileData.profile?.memory_graph || {});
            } catch (err) {
                console.error("Failed to fetch Practice data:", err);
            } finally {
                setIsDataLoading(false);
            }
        };
        fetchData();
    }, [userId]);

    const syncMemory = async (topicLabel, finalScore) => {
        try {
            await fetch('http://localhost:8000/sync-memory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId || "test_user_123",
                    memory_graph: {
                        last_session_notes: `${topicLabel} quiz — scored ${finalScore}/5`,
                        streak: 14 // Mocked
                    }
                })
            });
        } catch (e) { console.error("Memory sync failed"); }
    };

    React.useEffect(() => {
        let interval = null;
        if (timerActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && timerActive) {
            finishQuiz();
        }
        return () => clearInterval(interval);
    }, [timerActive, timeLeft]);

    const fetchAiExplanation = async (q, selectedIdx) => {
        setIsExplaining(true);
        setAiExplanation("");
        try {
            const gradeMatch = selectedClass.match(/\d+/);
            const grade = gradeMatch ? parseInt(gradeMatch[0]) : 6;

            const response = await fetch('http://localhost:8000/explain-mistake', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: q.question,
                    user_answer: q.options[selectedIdx],
                    correct_answer: q.options[q.answer],
                    grade: grade
                })
            });
            const data = await response.json();
            setAiExplanation(data.explanation);
        } catch (e) {
            setAiExplanation("Chhoti si mistake! The correct answer is " + q.options[q.answer]);
        } finally {
            setIsExplaining(false);
        }
    };

    React.useEffect(() => {
        if (activeSuggestion && view === 'list') {
            const topic = topics.find(t_item => t[t_item.label] === activeSuggestion.topic) || topics[0];
            startQuiz(topic, activeSuggestion.focus_points);
            if (onClearSuggestion) onClearSuggestion();
        }
    }, [activeSuggestion, view]);

    const startQuiz = async (topic, focusPoints = null) => {
        setCurrentTopic(topic);
        setView('loading');
        setError(null);
        setDebrief(null);
        setUserAnswers([]);
        setAiExplanation("");

        try {
            const gradeMatch = selectedClass.match(/\d+/);
            const grade = gradeMatch ? parseInt(gradeMatch[0]) : 6;
            const language = lang === 'hi' ? 'Hindi' : 'English';

            const response = await fetch('http://localhost:8000/generate-quiz', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic: t[topic.label],
                    grade: grade,
                    language: language,
                    focus_points: focusPoints
                })
            });

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
        } catch (err) {
            setError(err.message);
            resetToHome();
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

        quiz.forEach((q, i) => {
            if (finalAnswers[i] === q.answer) finalScore++;
        });
        setScore(finalScore);

        syncMemory(t[currentTopic.label], finalScore);

        try {
            const mistakes = quiz.filter((q, idx) => q.answer !== finalAnswers[idx]);
            const response = await fetch('http://localhost:8000/debrief', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId || "test_user_123",
                    topic: t[currentTopic.label],
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
                win: "Great job finishing the quiz!",
                pattern: "You're building solid foundations.",
                next_step: "Review your answers and keep going!"
            });
        } finally {
            setIsDebriefing(false);
        }
    };

    if (view === 'loading') {
        return (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[500px] animate-in fade-in duration-500">
                <VidyaBot message={t.quizCurating} isLoading={true} />
                <div className="w-48 h-1.5 bg-slate-100 rounded-full mt-8 overflow-hidden">
                    <div className="h-full bg-indigo-600 animate-[loading_2.5s_linear_infinite]"></div>
                </div>
            </div>
        );
    }

    if (view === 'quiz' && quiz.length > 0) {
        const q = quiz[currentQuestion];
        return (
            <div className="space-y-6 animate-in fade-in zoom-in duration-500 pb-20">
                <div className="flex items-center justify-between px-2">
                    <div className="flex-1">
                        <div className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-1">
                            {t[currentTopic.label]}
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
                    <p className="text-lg font-black text-slate-900 leading-tight mb-8">
                        {q.question}
                    </p>

                    <div className="space-y-3">
                        {q.options.map((opt, i) => {
                            const isCorrect = i === q.answer;
                            const isSelected = i === selectedOption;
                            let style = "border-slate-100 bg-slate-50 text-slate-900";
                            if (selectedOption !== null) {
                                if (isCorrect) style = "border-green-500 bg-green-50 text-green-700 ring-2 ring-green-100";
                                else if (isSelected) style = "border-red-500 bg-red-50 text-red-700 ring-2 ring-red-100";
                                else style = "border-slate-50 opacity-40";
                            }

                            return (
                                <button
                                    key={i}
                                    onClick={() => handleAnswer(i)}
                                    disabled={selectedOption !== null}
                                    className={`w-full p-5 border-2 rounded-2xl text-left font-bold transition-all flex items-center justify-between group ${style}`}
                                >
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
                            <p className="text-xs font-bold text-slate-600 leading-relaxed">
                                {q.explanation}
                            </p>

                            <button
                                onClick={() => nextQuestion()}
                                className="w-full mt-6 py-4 bg-indigo-600 text-white font-black rounded-2xl text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-indigo-100 active:scale-[0.98] transition-all"
                            >
                                {currentQuestion < quiz.length - 1 ? 'Next Question' : 'Finish Quiz'} <ArrowRight size={18} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (view === 'result') {
        const percentage = Math.round((score / quiz.length) * 100);

        if (showReview) {
            return (
                <div className="flex-1 flex flex-col items-center min-h-[500px] animate-in slide-in-from-right-8 duration-500 text-left px-4 pb-20 overflow-y-auto">
                    <div className="w-full max-w-sm mx-auto space-y-8">
                        <div className="flex items-center justify-between mb-2">
                            <button
                                onClick={() => setShowReview(false)}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
                            >
                                <ArrowRight className="rotate-180" size={14} /> Back to Results
                            </button>
                            <button
                                onClick={resetToHome}
                                className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-red-500 transition-colors"
                            >
                                Exit
                            </button>
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
                                                    onClick={() => {
                                                        setActiveReviewIdx(isExpanded ? null : idx);
                                                        if (!isExpanded) fetchAiExplanation(q, userAnswers[idx]);
                                                    }}
                                                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 active:scale-95 transition-all"
                                                >
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
                                                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Deep Learning Mode</span>
                                                        </div>
                                                        <p className="text-xs font-bold text-slate-800 italic leading-relaxed">
                                                            {isExplaining ? "Analyzing your mistake pattern..." : (aiExplanation || "Wait, let me look into why that happened...")}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <button
                            onClick={() => setShowReview(false)}
                            className="w-full py-5 bg-slate-900 text-white font-black rounded-[32px] uppercase tracking-[0.2em] shadow-xl shadow-slate-200 active:scale-95 transition-all mt-8"
                        >
                            Return To Results
                        </button>
                    </div>
                </div>
            );
        } else {
            return (
                <div className="flex-1 flex flex-col items-center min-h-[500px] animate-in zoom-in duration-500 text-center px-4 pb-12 overflow-y-auto">
                    <div className="w-full max-w-sm mx-auto">
                        <VidyaBot
                            message={isDebriefing ? t.quizAnalyzing : (percentage >= 80 ? "Amazing job! You're really getting this." : "Good effort! Let's look at how to improve.")}
                            isLoading={isDebriefing}
                        />

                        {/* Score Summary */}
                        <div className="mt-4 flex items-center justify-between px-6 py-3 bg-white rounded-2xl border border-slate-100 shadow-sm mb-6">
                            <div className="flex items-center gap-2">
                                <Trophy size={18} className="text-amber-500" />
                                <span className="text-sm font-black text-slate-700">{score}/{quiz.length} Correct</span>
                            </div>
                            <div className="text-sm font-black text-indigo-600">
                                {percentage}%
                            </div>
                        </div>

                        {/* AI Insights Section */}
                        {isDebriefing ? (
                            <div className="w-full space-y-4 py-8 animate-pulse">
                                <div className="h-24 bg-slate-50 rounded-3xl"></div>
                                <div className="h-24 bg-slate-50 rounded-3xl"></div>
                            </div>
                        ) : (
                            debrief && (
                                <div className="space-y-4 text-left w-full mt-2">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 mb-4">Vidya's Analysis</h3>

                                    {/* Great Work Card */}
                                    <div className="p-6 bg-emerald-50/60 backdrop-blur-md rounded-[32px] border border-emerald-100 shadow-sm animate-in slide-in-from-bottom-8 duration-700">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="p-2.5 bg-emerald-500 rounded-xl text-white shadow-emerald-100 shadow-lg">
                                                <Trophy size={18} />
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block leading-none">High Five!</span>
                                                <span className="text-sm font-black text-slate-800">Where you did great</span>
                                            </div>
                                        </div>
                                        <p className="text-xs font-bold text-slate-600 leading-relaxed pl-1">
                                            {debrief.win}
                                        </p>
                                    </div>

                                    {/* Improvement Card */}
                                    <div className="p-6 bg-indigo-50/60 backdrop-blur-md rounded-[32px] border border-indigo-100 shadow-sm animate-in slide-in-from-bottom-8 delay-150 duration-700">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="p-2.5 bg-indigo-500 rounded-xl text-white shadow-indigo-100 shadow-lg">
                                                <Target size={18} />
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block leading-none">Focus Area</span>
                                                <span className="text-sm font-black text-slate-800">How to improve</span>
                                            </div>
                                        </div>
                                        <p className="text-xs font-bold text-slate-600 leading-relaxed pl-1">
                                            {debrief.pattern}
                                        </p>
                                    </div>

                                    {/* Next Step Card */}
                                    <div className="p-8 bg-slate-900 rounded-[32px] shadow-2xl shadow-indigo-100 animate-in slide-in-from-bottom-8 delay-300 duration-700 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                                            <ArrowRight size={80} />
                                        </div>
                                        <div className="relative z-10">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="p-2 bg-white/10 rounded-xl text-white">
                                                    <TrendingUp size={18} />
                                                </div>
                                                <span className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em]">Your Next Step</span>
                                            </div>
                                            <p className="text-sm font-bold text-white leading-relaxed mb-1">
                                                {debrief.next_step}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )
                        )}

                        {!isDebriefing && (
                            <div className="w-full space-y-3 mt-12 pb-12">
                                <button
                                    onClick={() => setShowReview(true)}
                                    className="w-full py-5 bg-white text-slate-900 border-2 border-slate-100 font-black rounded-3xl text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-50 transition-all shadow-sm"
                                >
                                    Review Questions <Brain size={18} />
                                </button>
                                <button
                                    onClick={resetToHome}
                                    className="w-full py-4 bg-transparent text-slate-400 font-black rounded-3xl text-sm uppercase tracking-widest hover:text-slate-600 transition-colors"
                                >
                                    Done for now
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            );
        }
    }

    // LIST VIEW (Academic Coach Redesign)
    return (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
            {/* Header with Streak/XP chips */}
            <div className="flex items-center justify-between">
                <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()} · {selectedClass.toUpperCase()}
                    </span>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                        Good morning, {profile.name?.split(' ')[0] || "Student"}
                    </h2>
                </div>
                <div className="flex gap-2">
                    <div className="flex items-center gap-1.5 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100">
                        <Flame size={14} className="text-orange-500 fill-orange-500" />
                        <span className="text-[10px] font-black text-orange-600">{memory.streak || 0}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-yellow-50 px-3 py-1.5 rounded-full border border-yellow-100">
                        <Star size={14} className="text-yellow-500 fill-yellow-500" />
                        <span className="text-[10px] font-black text-yellow-600">840</span>
                    </div>
                </div>
            </div>

            {/* Smart Insight Card (Dark Theme) */}
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
                            {suggestion ? suggestion.reason : "Loading your academic path..."}
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
                        <p className="text-xs font-bold text-slate-400 mb-6">Chapter 2 • 12 questions • Adaptive difficulty</p>

                        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">What's inside this quiz?</span>
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

            {/* Other Chapters List */}
            <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Other Chapters</h4>
                <div className="space-y-3">
                    {topics.map((topic, i) => {
                        const isSuggested = suggestion?.topic === t[topic.label];
                        if (isSuggested) return null; // Don't duplicate suggested topic

                        const isStrong = memory.strong_topics?.includes(t[topic.label]);
                        const isWeak = memory.weak_topics?.includes(topic.label); // Backend uses label sometimes, ensure consistency
                        const isLocked = i > 4; // Mock logic for locked chapters

                        return (
                            <div key={topic.id} className={`bg-white border-2 rounded-[28px] p-4 flex items-center justify-between transition-all ${isLocked ? 'grayscale opacity-60 bg-slate-50' : 'hover:border-indigo-100 shadow-sm'}`}>
                                <div className="flex items-center gap-4">
                                    <div className={`size-12 rounded-2xl flex items-center justify-center ${isLocked ? 'bg-slate-200 text-slate-400' : 'bg-slate-50 text-indigo-600'}`}>
                                        {isLocked ? <Lock size={20} /> : <topic.icon size={24} />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h5 className="text-sm font-black text-slate-900 uppercase tracking-tight">{t[topic.label]}</h5>
                                            {isStrong && (
                                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[8px] font-black uppercase tracking-widest">Strong</span>
                                            )}
                                            {isWeak && (
                                                <span className="px-2 py-0.5 bg-orange-50 text-orange-600 rounded text-[8px] font-black uppercase tracking-widest">Needs work</span>
                                            )}
                                        </div>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                            {isLocked ? "Unlock by reaching 75% accuracy" : `${topic.progress}% accuracy • 10 Qs`}
                                        </p>
                                    </div>
                                </div>
                                {!isLocked && (
                                    <button
                                        onClick={() => startQuiz(topic)}
                                        className="px-4 py-2 bg-slate-50 text-slate-900 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all active:scale-95"
                                    >
                                        Practice
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default PracticeView;
