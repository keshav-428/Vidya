import { API_URL } from '../../config';
import React, { useState, useEffect } from 'react';
import { ChevronRight, Sparkles, Flame, Trophy, BookOpen, TrendingUp } from 'lucide-react';
import { logActivity } from '../../services/activity';

const HomeView = ({ t, name, selectedExam, practiceTime, selectedClass, painPoint, lang, userId, onStartSuggestion }) => {
    const language = lang === 'hi' ? 'Hindi' : lang === 'hinglish' ? 'Hinglish' : 'English';
    const [briefing, setBriefing] = useState('');
    const [suggestion, setSuggestion] = useState(null);
    const [history, setHistory] = useState([]);
    const [streak, setStreak] = useState(0);
    const [xp, setXp] = useState(0);
    const [isDataLoading, setIsDataLoading] = useState(true);

    const firstName = name?.split(' ')[0] || 'Student';
    const hour = new Date().getHours();
    const greetingKey = hour < 12 ? 'goodMorning' : hour < 17 ? 'goodAfternoon' : 'goodEvening';
    const greeting = t[greetingKey] || (hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening');
    const today = new Date().toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    const defaultBriefing = t.defaultBriefing?.replace('{name}', firstName) || `Ready to learn, ${firstName}? Pick a topic and let's go!`;

    useEffect(() => {
        // Fetch history, suggestion and profile in parallel (non-blocking)
        const fetchData = async () => {
            try {
                const [historyRes, suggestionRes, profileRes] = await Promise.all([
                    fetch(`${API_URL}/history/${userId || 'test_user_123'}`),
                    fetch(`${API_URL}/suggestion/${userId || 'test_user_123'}`),
                    fetch(`${API_URL}/profile/${userId || 'test_user_123'}`)
                ]);
                const [historyData, suggestionData, profileData] = await Promise.all([
                    historyRes.json(),
                    suggestionRes.json(),
                    profileRes.json()
                ]);
                const history = historyData.history || [];
                setHistory(history);
                setSuggestion(suggestionData);
                setStreak(profileData.profile?.memory_graph?.streak || 0);
                setXp(profileData.profile?.xp || 0);
                fetchBriefing(history.length === 0);
            } catch (err) {
                console.error('HomeView data fetch error:', err);
                fetchBriefing(true);
            } finally {
                setIsDataLoading(false);
            }
        };

        // Fetch briefing separately — it's slow, don't block the page
        const fetchBriefing = async (isFirstVisit) => {
            if (isFirstVisit) {
                setBriefing(t.welcomeBriefing?.replace('{name}', firstName) || `Welcome to Vidya, ${firstName}! Start your first quiz to kick off your learning journey.`);
                return;
            }
            try {
                const gradeMatch = selectedClass.match(/\d+/);
                const grade = gradeMatch ? parseInt(gradeMatch[0]) : 6;
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 8000);
                const res = await fetch(`${API_URL}/briefing`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: userId || 'test_user_123', name, grade, language }),
                    signal: controller.signal
                });
                clearTimeout(timeout);
                const data = await res.json();
                setBriefing(data.briefing);
            } catch {
                // keep the default already shown
            }
        };

        fetchData();
        logActivity(userId, 'session_start', { grade: selectedClass });
    }, [userId, name, selectedClass]);

    const recentQuizzes = history.slice(0, 3);
    const avgScore = history.length > 0
        ? Math.round(history.reduce((acc, h) => acc + (h.score / h.total) * 100, 0) / history.length)
        : null;

    return (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">

            {/* Header */}
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{today}</p>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{greeting}, {firstName}!</h2>
                <p className="text-xs font-bold text-slate-400 mt-0.5 mb-3">{selectedExam}</p>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100">
                        <Flame size={12} className="text-orange-500 fill-orange-400" />
                        <span className="text-[10px] font-black text-orange-600">{streak} {t.dayStreak || 'day streak'}</span>
                    </div>
                    {avgScore !== null && (
                        <div className="flex items-center gap-1.5 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100">
                            <TrendingUp size={12} className="text-indigo-500" />
                            <span className="text-[10px] font-black text-indigo-600">{avgScore}% {t.avg || 'avg'}</span>
                        </div>
                    )}
                    {history.length > 0 && (
                        <div className="flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                            <Trophy size={12} className="text-emerald-500" />
                            <span className="text-[10px] font-black text-emerald-600">{history.length} {t.quizzesLabel || 'quizzes'}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Smart Suggestion — most actionable, shown first */}
            {isDataLoading ? (
                <div className="bg-slate-50 rounded-[28px] p-5 animate-pulse h-32" />
            ) : suggestion ? (
                <div className="bg-slate-900 rounded-[32px] p-6 shadow-xl relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                        <Sparkles size={100} className="text-white" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="px-2 py-1 bg-indigo-500/30 rounded-lg text-[9px] font-black text-indigo-300 uppercase tracking-widest">{t.aiPickForYou || 'AI Pick for You'}</span>
                        </div>
                        <h3 className="text-lg font-black text-white leading-tight mb-1">{suggestion.topic}</h3>
                        <p className="text-xs font-bold text-slate-400 leading-relaxed mb-5">{suggestion.reason}</p>
                        <button
                            onClick={() => { logActivity(userId, 'suggestion_clicked', { topic: suggestion.topic, reason: suggestion.reason }); onStartSuggestion(suggestion); }}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-900/40 active:scale-95 transition-all"
                        >
                            {t.startQuiz || 'Start Quiz'} <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            ) : null}

            {/* Vidya Briefing — compact inline card */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-[24px] p-4 flex items-start gap-3">
                <div className="size-8 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles size={14} className="text-white" />
                </div>
                <div>
                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">{t.vidyaSays || 'Vidya says'}</p>
                    <p className="text-xs font-bold text-indigo-900 leading-relaxed">{briefing || defaultBriefing}</p>
                </div>
            </div>

            {/* Recent Activity */}
            <section className="space-y-3">
                <div className="flex items-center justify-between px-1">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t.recentActivity || 'Recent Activity'}</h4>
                    {history.length > 0 && (
                        <span className="text-[10px] font-black text-indigo-400">{history.length} {t.quizzesTotal || 'quizzes total'}</span>
                    )}
                </div>

                {isDataLoading ? (
                    <div className="space-y-3">
                        {[1, 2].map(i => <div key={i} className="h-16 bg-slate-50 rounded-[20px] animate-pulse" />)}
                    </div>
                ) : recentQuizzes.length > 0 ? (
                    <div className="space-y-3">
                        {recentQuizzes.map((h, i) => {
                            const pct = Math.round((h.score / h.total) * 100);
                            const isGood = pct >= 60;
                            return (
                                <div key={i} className="bg-white border border-slate-100 rounded-[24px] p-4 flex items-center justify-between shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className={`size-10 rounded-2xl flex items-center justify-center ${isGood ? 'bg-emerald-50' : 'bg-orange-50'}`}>
                                            <BookOpen size={16} className={isGood ? 'text-emerald-600' : 'text-orange-500'} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-slate-900">{h.topic}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{h.score}/{h.total} {t.correct || 'correct'}</p>
                                        </div>
                                    </div>
                                    <div className={`px-3 py-1.5 rounded-xl text-xs font-black ${isGood ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-500'}`}>
                                        {pct}%
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-white border-2 border-dashed border-slate-100 rounded-[24px] p-6 text-center">
                        <Trophy size={28} className="text-slate-200 mx-auto mb-2" />
                        <p className="text-xs font-black text-slate-400">{t.noQuizzesYet || 'No quizzes yet'}</p>
                        <p className="text-[10px] font-bold text-slate-300 mt-0.5">{t.noQuizzesSub || 'Complete your first quiz to see results here'}</p>
                    </div>
                )}
            </section>

        </div>
    );
};

export default HomeView;
