import React from 'react';
import { Sparkles, ClipboardList, Target, Award, Zap, BarChart3 } from 'lucide-react';
import { topicsMap } from '../../utils/constants';

const ProgressView = ({ t, selectedClass, userId }) => {
    const [history, setHistory] = React.useState([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const topics = topicsMap[selectedClass] || topicsMap['Class 6'];

    React.useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await fetch(`http://localhost:8000/history/${userId || 'test_user_123'}`);
                const data = await response.json();
                setHistory(data.history || []);
            } catch (err) {
                console.error("Failed to fetch history:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchHistory();
    }, [userId]);

    // Calculate Real Stats
    const stats = React.useMemo(() => {
        if (history.length === 0) return { avg: 0, strongest: "N/A", improve: topics[0]?.label || "N/A", count: 0 };

        const topicStats = {};
        history.forEach(h => {
            if (!topicStats[h.topic]) topicStats[h.topic] = { total: 0, count: 0 };
            topicStats[h.topic].total += (h.score / h.total);
            topicStats[h.topic].count += 1;
        });

        const averages = Object.entries(topicStats).map(([name, data]) => ({
            name,
            avg: (data.total / data.count) * 100
        }));

        const strongest = averages.reduce((prev, curr) => (curr.avg > prev.avg ? curr : prev), averages[0]);
        const improve = averages.reduce((prev, curr) => (curr.avg < prev.avg ? curr : prev), averages[0]);

        return {
            avg: Math.round(averages.reduce((acc, curr) => acc + curr.avg, 0) / averages.length),
            strongest: strongest.name,
            improve: improve.name,
            count: history.length
        };
    }, [history, topics]);

    const chartData = history.length > 0 ? history.slice(0, 7).reverse().map(h => (h.score / h.total) * 100) : [];

    // SVG Helper: Generates safe points even for 1 point
    const getX = (i) => chartData.length > 1 ? (i * 100) / (chartData.length - 1) : 50;
    const getY = (d) => 100 - (d * 0.8); // Scale to fit 100px height nicely

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">{t.yourProgress} 📉</h2>
                <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{t.progressSub}</p>
            </div>

            <div className="bg-indigo-600 rounded-[32px] p-6 text-white relative overflow-hidden shadow-xl shadow-indigo-100">
                <div className="absolute -top-6 -right-6 opacity-10"><Sparkles size={120} /></div>
                <div className="flex items-center gap-3 mb-3">
                    <div className="px-2 py-1 bg-white/20 rounded-lg text-[8px] font-black uppercase tracking-widest">{t.aiGrowthTip}</div>
                </div>
                <p className="text-sm font-black leading-tight">
                    {history.length > 0
                        ? `You're doing great in ${stats.strongest}! Let's focus more on ${stats.improve === stats.strongest ? "your next chapter" : stats.improve} to keep the momentum.`
                        : "Start your first quiz to see your personalized growth insights here!"}
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {[
                    { label: t.testsTaken, val: stats.count.toString(), sub: "Total attempts", icon: ClipboardList, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: t.avgScore, val: `${stats.avg}%`, sub: "Overall accuracy", icon: Target, color: 'text-green-600', bg: 'bg-green-50' },
                    { label: t.strongSubject, val: stats.strongest, sub: "High performance", icon: Award, color: 'text-yellow-600', bg: 'bg-yellow-50' },
                    { label: t.needsImprovement, val: stats.improve, sub: "Needs more practice", icon: Zap, color: 'text-orange-600', bg: 'bg-orange-50' },
                ].map((m, i) => (
                    <div key={i} className="bg-white p-4 rounded-[24px] border border-slate-50 shadow-sm">
                        <div className={`size-8 rounded-xl ${m.bg} ${m.color} flex items-center justify-center mb-3`}><m.icon size={16} /></div>
                        <div className="text-sm font-black text-slate-900 tracking-tighter mb-0.5 truncate">{m.val}</div>
                        <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none truncate">{m.label}</div>
                    </div>
                ))}
            </div>

            <section className="bg-white p-6 rounded-[32px] border border-slate-50 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{t.scoreOverTime}</h4>
                    <BarChart3 size={16} className="text-slate-300" />
                </div>
                <div className="h-32 w-full relative group">
                    {chartData.length > 0 ? (
                        <svg className="h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.3" />
                                    <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            <path
                                d={`M 0 100 ${chartData.map((d, i) => `L ${getX(i)} ${getY(d)}`).join(' ')} ${chartData.length > 1 ? `L 100 100` : ''}`}
                                fill="url(#scoreGradient)"
                                stroke="none"
                            />
                            <path
                                d={chartData.length === 1
                                    ? `M 0 ${getY(chartData[0])} L 100 ${getY(chartData[0])}`
                                    : `M 0 ${getY(chartData[0])} ${chartData.map((d, i) => `L ${getX(i)} ${getY(d)}`).join(' ')}`}
                                fill="transparent"
                                stroke="#4f46e5"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            {chartData.map((d, i) => (
                                <circle key={i} cx={`${getX(i)}`} cy={`${getY(d)}`} r="2.5" fill="white" stroke="#4f46e5" strokeWidth="1.5" />
                            ))}
                        </svg>
                    ) : (
                        <div className="h-full w-full flex items-center justify-center border-2 border-dashed border-slate-100 rounded-2xl">
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest text-center px-4">Complete more quizzes to see your growth trend</span>
                        </div>
                    )}
                    <div className="flex justify-between mt-6 px-1">
                        {['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7'].map((w, i) => (
                            <span key={i} className={`text-[8px] font-black uppercase tracking-widest ${i < chartData.length ? 'text-indigo-400' : 'text-slate-200'}`}>{w}</span>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default ProgressView;
