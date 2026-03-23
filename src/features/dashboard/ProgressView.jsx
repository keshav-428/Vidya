import { API_URL } from '../../config';
import React from 'react';
import { TrendingUp, TrendingDown, Minus, Flame, CheckCircle2, Target, Info } from 'lucide-react';

const ProgressView = ({ t, selectedClass, userId, lang }) => {
    const [history, setHistory] = React.useState([]);
    const [diagnosticWeakTopics, setDiagnosticWeakTopics] = React.useState([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [showMasteryInfo, setShowMasteryInfo] = React.useState(false);
    const [activeKpi, setActiveKpi] = React.useState(null);
    const [chartFilter, setChartFilter] = React.useState('7');
    const [chartTopic, setChartTopic] = React.useState('all');

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const [histRes, profileRes] = await Promise.all([
                    fetch(`${API_URL}/history/${userId || 'test_user_123'}`),
                    fetch(`${API_URL}/profile/${userId || 'test_user_123'}`),
                ]);
                const [histData, profileData] = await Promise.all([histRes.json(), profileRes.json()]);
                setHistory(histData.history || []);
                setDiagnosticWeakTopics(profileData.profile?.diagnostic?.weak_topics || []);
            } catch (err) {
                console.error("Failed to fetch progress data:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [userId]);

    const getMastery = (avg) => {
        if (avg >= 80) return 'strong';
        if (avg >= 65) return 'confident';
        if (avg >= 40) return 'improving';
        return 'needs_help';
    };

    const stats = React.useMemo(() => {
        if (history.length === 0 && diagnosticWeakTopics.length === 0) return null;

        const toScore = h => Math.round((h.score / h.total) * 100);
        const allScores = history.map(toScore);
        const overallAvg = allScores.length ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0;

        const now = new Date();
        const weekAgo = new Date(now - 7 * 864e5);
        const twoWeeksAgo = new Date(now - 14 * 864e5);
        const thisWeek = history.filter(h => new Date(h.timestamp) >= weekAgo).map(toScore);
        const lastWeek = history.filter(h => new Date(h.timestamp) >= twoWeeksAgo && new Date(h.timestamp) < weekAgo).map(toScore);
        const thisWeekAvg = thisWeek.length ? Math.round(thisWeek.reduce((a, b) => a + b, 0) / thisWeek.length) : null;
        const lastWeekAvg = lastWeek.length ? Math.round(lastWeek.reduce((a, b) => a + b, 0) / lastWeek.length) : null;
        const trend = thisWeekAvg !== null && lastWeekAvg !== null ? thisWeekAvg - lastWeekAvg : null;

        const topicMap = {};
        history.forEach(h => {
            if (!topicMap[h.topic]) topicMap[h.topic] = { scores: [], attempts: 0 };
            topicMap[h.topic].scores.push(toScore(h));
            topicMap[h.topic].attempts += 1;
        });

        // Quiz-based topics with recency weighting (last score counts double)
        const quizTopics = Object.entries(topicMap).map(([name, d]) => {
            const lastScore = d.scores[d.scores.length - 1];
            const weightedAvg = Math.round(
                (d.scores.reduce((a, b) => a + b, 0) + lastScore) / (d.scores.length + 1)
            );
            const best = Math.max(...d.scores);
            return { name, avg: weightedAvg, best, attempts: d.attempts, mastery: getMastery(weightedAvg), fromDiagnostic: false };
        });

        // Add diagnostic weak topics that haven't been quizzed yet
        const quizzedTopics = new Set(quizTopics.map(t => t.name));
        const diagOnlyTopics = diagnosticWeakTopics
            .filter(topic => !quizzedTopics.has(topic))
            .map(topic => ({ name: topic, avg: 0, best: 0, attempts: 0, mastery: 'needs_help', fromDiagnostic: true }));

        const topics = [...quizTopics, ...diagOnlyTopics].sort((a, b) => b.avg - a.avg);

        const last7 = Array.from({ length: 7 }, (_, i) => {
            const day = new Date(now - (6 - i) * 864e5);
            const label = day.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-US', { weekday: 'short' });
            const active = history.some(h => new Date(h.timestamp).toDateString() === day.toDateString());
            return { label, active };
        });

        const best = Math.max(...allScores);
        return { overallAvg, trend, thisWeekAvg, topics, last7, best, totalQuizzes: history.length };
    }, [history, diagnosticWeakTopics]);

    if (isLoading) return (
        <div className="space-y-4 animate-pulse">
            <div className="h-8 bg-slate-100 rounded-2xl w-40" />
            <div className="h-40 bg-slate-100 rounded-[32px]" />
            <div className="h-24 bg-slate-100 rounded-[28px]" />
            <div className="h-56 bg-slate-100 rounded-[28px]" />
        </div>
    );

    if (!stats) return (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-3">
            <div className="size-16 bg-slate-100 rounded-[24px] flex items-center justify-center">
                <Target size={28} className="text-slate-300" />
            </div>
            <p className="text-sm font-black text-slate-500">{t.noDataYet || 'No data yet'}</p>
            <p className="text-xs font-bold text-slate-400">{t.noDataSub || 'Complete your first quiz to see your analytics'}</p>
        </div>
    );

    // stats.overallAvg may be 0 if only diagnostic data exists — guard chart renders below

    const TrendIcon = stats.trend > 0 ? TrendingUp : stats.trend < 0 ? TrendingDown : Minus;
    const trendColor = stats.trend > 0 ? 'text-emerald-400' : stats.trend < 0 ? 'text-red-400' : 'text-slate-500';
    const trendBg = stats.trend > 0 ? 'bg-emerald-500/20' : stats.trend < 0 ? 'bg-red-500/20' : 'bg-white/10';

    const masteryBar  = { strong: 'bg-emerald-500', confident: 'bg-indigo-500', improving: 'bg-amber-400', needs_help: 'bg-orange-400' };
    const masteryText = { strong: 'text-emerald-600', confident: 'text-indigo-500', improving: 'text-amber-600', needs_help: 'text-orange-500' };
    const masteryBadgeBg = { strong: 'bg-emerald-50', confident: 'bg-indigo-50', improving: 'bg-amber-50', needs_help: 'bg-orange-50' };
    const masteryLabel = {
        strong:     t.masteryStrong    || 'Strong',
        confident:  t.masteryConfident || 'Confident',
        improving:  t.masteryImproving || 'Improving',
        needs_help: t.masteryNeedsHelp || 'Needs Help',
    };

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">

            <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{t.progressTitle || 'Your Progress'}</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{t.performanceAnalytics || 'Performance analytics'}</p>
            </div>

            {/* Hero stat card */}
            <div className="bg-slate-900 rounded-[32px] p-6 text-white relative">
                <div className="absolute -right-6 -bottom-6 opacity-[0.04] pointer-events-none"><Target size={140} /></div>

                <div className="flex flex-col items-center text-center mb-5">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{t.avgQuizScore || 'Avg. Quiz Score'}</p>
                    <span className="text-6xl font-black tracking-tighter leading-none">{stats.overallAvg}%</span>
                    <div className="flex items-center gap-2 mt-2">
                        <p className="text-[10px] text-slate-500 font-bold">{stats.totalQuizzes} {stats.totalQuizzes !== 1 ? (t.quizPlural || 'quizzes') : (t.quizSingular || 'quiz')} · {t.allTime || 'all time'}</p>
                        {stats.trend !== null && (
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-xl ${trendBg}`}>
                                <TrendIcon size={11} strokeWidth={2.5} className={trendColor} />
                                <span className={`text-[9px] font-black ${trendColor}`}>{stats.trend > 0 ? '+' : ''}{stats.trend}%</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/[0.08]">
                    {[
                        { key: 'quizzes',  value: stats.totalQuizzes, label: t.kpiQuizzes || 'Quizzes',    desc: t.kpiQuizzesDesc || 'Total quizzes completed, all time.' },
                        { key: 'best',     value: `${stats.best}%`,   label: t.kpiBestScore || 'Best Score', desc: t.kpiBestDesc || 'Highest single quiz score ever.' },
                        { key: 'mastered', value: stats.topics.filter(tp => tp.mastery === 'strong').length, label: t.kpiMastered || 'Strong', desc: t.kpiMasteredDesc || 'Topics with avg score ≥80%.' },
                    ].map((s) => (
                        <div
                            key={s.key}
                            className="bg-white/[0.05] rounded-2xl px-3 py-2.5 cursor-default"
                            onMouseEnter={() => setActiveKpi(s.key)}
                            onMouseLeave={() => setActiveKpi(null)}
                        >
                            <div className="flex items-start justify-between">
                                <p className="text-base font-black text-white">{s.value}</p>
                                <Info size={11} strokeWidth={2} className={`mt-0.5 transition-colors ${activeKpi === s.key ? 'text-slate-400' : 'text-slate-600'}`} />
                            </div>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">{s.label}</p>
                            {activeKpi === s.key && (
                                <p className="text-[9px] font-bold text-slate-400 leading-relaxed mt-1.5">{s.desc}</p>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Weekly activity */}
            <div className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{t.weeklyActivity || 'Weekly Activity'}</p>
                    <div className="flex items-center gap-1">
                        <Flame size={11} className="text-orange-500 fill-orange-400" />
                        <span className="text-[10px] font-black text-orange-500">{stats.last7.filter(d => d.active).length} {t.outOf7Days || '/ 7 days'}</span>
                    </div>
                </div>
                <div className="flex justify-between">
                    {stats.last7.map((day, i) => (
                        <div key={i} className="flex flex-col items-center gap-2">
                            <div className={`size-9 rounded-2xl flex items-center justify-center transition-all ${day.active ? 'bg-indigo-600 shadow-md shadow-indigo-200' : 'bg-slate-50'}`}>
                                {day.active
                                    ? <CheckCircle2 size={15} className="text-white" strokeWidth={2.5} />
                                    : <div className="size-1.5 rounded-full bg-slate-200" />
                                }
                            </div>
                            <span className="text-[9px] font-black text-slate-400 uppercase">{day.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Topic mastery */}
            <div className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                        <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{t.topicMastery || 'Topic Mastery'}</p>
                        <button
                            onMouseEnter={() => setShowMasteryInfo(true)}
                            onMouseLeave={() => setShowMasteryInfo(false)}
                            className="text-slate-300 hover:text-slate-500 transition-colors"
                        >
                            <Info size={13} strokeWidth={2} />
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-emerald-500 inline-block" /><span className="text-[9px] font-bold text-slate-400">≥80</span></span>
                        <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-indigo-500 inline-block" /><span className="text-[9px] font-bold text-slate-400">65–79</span></span>
                        <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-amber-400 inline-block" /><span className="text-[9px] font-bold text-slate-400">40–64</span></span>
                        <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-orange-400 inline-block" /><span className="text-[9px] font-bold text-slate-400">&lt;40</span></span>
                    </div>
                </div>
                {showMasteryInfo && (
                    <div className="bg-slate-50 rounded-2xl p-3.5 mb-4 space-y-2">
                        {[
                            { dot: 'bg-emerald-500', label: t.masteryStrong    || 'Strong',    desc: t.masteryStrongDesc    || 'Avg ≥80%. You\'ve got this topic down.' },
                            { dot: 'bg-indigo-500', label: t.masteryConfident  || 'Confident', desc: t.masteryConfidentDesc || 'Avg 65–79%. Almost there, keep going.' },
                            { dot: 'bg-amber-400',  label: t.masteryImproving  || 'Improving', desc: t.masteryImprovingDesc || 'Avg 40–64%. Getting better with practice.' },
                            { dot: 'bg-orange-400', label: t.masteryNeedsHelp  || 'Needs Help',desc: t.masteryNeedsHelpDesc || 'Avg below 40% or not yet practiced.' },
                        ].map(({ dot, label, desc }) => (
                            <div key={label} className="flex items-start gap-2.5">
                                <span className={`size-2 rounded-full mt-1 shrink-0 ${dot}`} />
                                <p className="text-[10px] font-bold text-slate-500 leading-relaxed"><span className="text-slate-700">{label}:</span> {desc}</p>
                            </div>
                        ))}
                    </div>
                )}
                <div className="space-y-5">
                    {stats.topics.map((topic, i) => (
                        <div key={i}>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-xs font-black text-slate-800 truncate">{topic.name}</span>
                                    {topic.fromDiagnostic && (
                                        <span className="text-[8px] font-black bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded-md uppercase tracking-wide shrink-0">
                                            {t.fromDiagnostic || 'Diagnostic'}
                                        </span>
                                    )}
                                </div>
                                <span className={`text-[9px] font-black px-2 py-1 rounded-lg shrink-0 ml-2 ${masteryBadgeBg[topic.mastery]} ${masteryText[topic.mastery]}`}>
                                    {masteryLabel[topic.mastery]}
                                </span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-700 ${masteryBar[topic.mastery]}`}
                                    style={{ width: topic.avg > 0 ? `${topic.avg}%` : '4%' }}
                                />
                            </div>
                            <p className="text-[9px] font-bold text-slate-400 mt-1.5">
                                {topic.attempts > 0
                                    ? `${topic.attempts} ${topic.attempts !== 1 ? (t.attemptPlural || 'attempts') : (t.attemptSingular || 'attempt')} · ${t.best || 'Best'}: ${topic.best}%`
                                    : (t.notPracticedYet || 'Not practiced yet')}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Score trend chart */}
            {history.length > 1 && (() => {
                const allTopics = [...new Set(history.map(h => h.topic))];
                const topicFiltered = chartTopic === 'all' ? history : history.filter(h => h.topic === chartTopic);
                const limitMap = { '3': 3, '7': 7, 'all': topicFiltered.length };
                const chartData = topicFiltered.slice(0, limitMap[chartFilter]).reverse();
                const scores = chartData.map(h => Math.round((h.score / h.total) * 100));
                if (chartData.length === 0) return <div className="bg-slate-900 rounded-[28px] p-5"><p className="text-slate-500 text-xs font-bold text-center py-8">{t.noTopicData || 'No data for this topic yet'}</p></div>;
                const changeFromLast = scores.length > 1 ? scores[scores.length - 1] - scores[scores.length - 2] : 0;
                const bestIdx = scores.indexOf(Math.max(...scores));
                const activeDays = stats.last7.filter(d => d.active).length;

                const W = 280, H = 150, MT = 16, MB = 22, ML = 34, MR = 6;
                const cw = W - ML - MR, ch = H - MT - MB;
                const px = i => ML + (scores.length > 1 ? i * cw / (scores.length - 1) : cw / 2);
                const py = v => MT + ch - (v / 100) * ch;

                const pts = scores.map((d, i) => ({ x: px(i), y: py(d) }));
                const smooth = pts.map((p, i) => {
                    const p0 = pts[Math.max(0, i - 1)];
                    const p2 = pts[Math.min(pts.length - 1, i + 1)];
                    const p3 = pts[Math.min(pts.length - 1, i + 2)];
                    return {
                        cp1x: p.x + (p2.x - p0.x) / 6,
                        cp1y: p.y + (p2.y - p0.y) / 6,
                        cp2x: p2.x - (p3.x - p.x) / 6,
                        cp2y: p2.y - (p3.y - p.y) / 6,
                    };
                });
                const linePath = pts.map((p, i) =>
                    i === 0 ? `M ${p.x} ${p.y}` : `C ${smooth[i-1].cp1x} ${smooth[i-1].cp1y}, ${smooth[i].cp2x} ${smooth[i].cp2y}, ${p.x} ${p.y}`
                ).join(' ');
                const areaPath = `${linePath} L ${pts[pts.length-1].x} ${py(0)} L ${pts[0].x} ${py(0)} Z`;
                const dateLabels = chartData.map(h => new Date(h.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));

                return (
                    <div className="bg-slate-900 rounded-[28px] p-5">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-[10px] font-black text-white uppercase tracking-widest">{t.scoreTrend || 'Score Trend'}</p>
                            <div className="flex items-center gap-0.5 bg-white/10 rounded-xl p-1">
                                {[['3', t.filterLast3 || 'Last 3'], ['7', t.filterLast7 || 'Last 7'], ['all', t.filterAll || 'All']].map(([val, label]) => (
                                    <button key={val} onClick={() => setChartFilter(val)}
                                        className={`px-2.5 py-1 rounded-lg text-[9px] font-black transition-all ${chartFilter === val ? 'bg-indigo-500 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}>
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Topic dropdown */}
                        <select
                            value={chartTopic}
                            onChange={e => setChartTopic(e.target.value)}
                            className="w-full bg-white/10 text-slate-300 text-[10px] font-bold rounded-xl px-3 py-2 mb-3 border border-white/10 focus:outline-none appearance-none cursor-pointer"
                        >
                            <option value="all" className="bg-slate-800">{t.allTopics || 'All Topics'}</option>
                            {allTopics.map(topic => (
                                <option key={topic} value={topic} className="bg-slate-800">{topic}</option>
                            ))}
                        </select>

                        <div className="flex items-center gap-2 mb-3">
                            {scores.length > 1 && (
                                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${changeFromLast >= 0 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-red-400 bg-red-500/10 border-red-500/20'}`}>
                                    {changeFromLast >= 0 ? '+' : ''}{changeFromLast}% {t.fromLast || 'from last'}
                                </span>
                            )}
                            <div className="flex items-center gap-1">
                                <Flame size={11} className="text-orange-500 fill-orange-400" />
                                <span className="text-[10px] font-bold text-slate-400">{activeDays}{t.dayStreak2 || '-day streak'}</span>
                            </div>
                        </div>

                        <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
                            <defs>
                                <linearGradient id="chartAreaGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
                                </linearGradient>
                            </defs>

                            {[0, 25, 50, 75, 100].map(tick => (
                                <g key={tick}>
                                    <line x1={ML} y1={py(tick)} x2={W-MR} y2={py(tick)} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                                    <text x={ML-6} y={py(tick)+3} textAnchor="end" fontSize="8" fill="rgba(255,255,255,0.25)" fontWeight="700">{tick}%</text>
                                </g>
                            ))}

                            <line x1={ML} y1={py(80)} x2={W-MR} y2={py(80)} stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.7" />
                            <path d={areaPath} fill="url(#chartAreaGrad)" />
                            <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                            {pts.map((p, i) => {
                                const isBest = i === bestIdx;
                                return (
                                    <g key={i}>
                                        {isBest && <circle cx={p.x} cy={p.y} r="11" fill="#f59e0b" opacity="0.15" />}
                                        <circle cx={p.x} cy={p.y} r={isBest ? 5.5 : 3.5} fill={isBest ? '#f59e0b' : '#3b82f6'} stroke="white" strokeWidth="1.5" />
                                    </g>
                                );
                            })}

                            {dateLabels.map((label, i) => (
                                <text key={i} x={px(i)} y={H-4} textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.25)" fontWeight="600">{label}</text>
                            ))}
                        </svg>

                        <div className="flex items-center justify-between pt-3 border-t border-white/[0.07] mt-1">
                            <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1.5">
                                    <span className="size-2 rounded-full bg-blue-500 inline-block" />
                                    <span className="text-[9px] font-bold text-slate-400">{t.legendScore || 'Score'}</span>
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <svg width="14" height="6"><line x1="0" y1="3" x2="14" y2="3" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.7" /></svg>
                                    <span className="text-[9px] font-bold text-slate-400">{t.legendGoal || 'Goal 80%'}</span>
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="size-2 rounded-full bg-amber-400 inline-block" />
                                    <span className="text-[9px] font-bold text-slate-400">{t.best || 'Best'}</span>
                                </span>
                            </div>
                            <span className="text-[10px] font-black text-white">{t.best || 'Best'}: {Math.max(...scores)}%</span>
                        </div>
                    </div>
                );
            })()}

        </div>
    );
};

export default ProgressView;
