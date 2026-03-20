import { API_URL } from '../../config';
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { BookOpen, Trophy, Target, Flame, Calendar, TrendingUp, CheckCircle2, AlertCircle, Loader2, GraduationCap } from 'lucide-react';

const ReportView = () => {
    const { userId } = useParams();
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchReport = async () => {
            try {
                const res = await fetch(`${API_URL}/report/${userId}`);
                if (!res.ok) throw new Error('Student not found');
                const data = await res.json();
                setReport(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchReport();
    }, [userId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 size={32} className="text-indigo-600 animate-spin" />
                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Loading report...</p>
                </div>
            </div>
        );
    }

    if (error || !report) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="text-center space-y-2">
                    <GraduationCap size={40} className="text-slate-200 mx-auto" />
                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Report not available</p>
                    <p className="text-xs font-bold text-slate-300">{error}</p>
                </div>
            </div>
        );
    }

    const { student, summary, topics, recent, generated_at } = report;

    return (
        <div className="min-h-screen bg-slate-50 py-10 px-4">
            <div className="max-w-md mx-auto space-y-5">

                {/* Header */}
                <div className="text-center space-y-1 py-4">
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em]">Vidya · Progress Report</p>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">{student.name}</h1>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Class {student.grade} · {student.exam}</p>
                    <p className="text-[10px] font-bold text-slate-300 mt-1">Generated {generated_at}</p>
                </div>

                {/* Summary grid */}
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { icon: BookOpen,  label: 'Total Quizzes',  val: summary.total_quizzes,        color: 'text-indigo-600', bg: 'bg-indigo-50'  },
                        { icon: Calendar,  label: 'This Week',       val: summary.quizzes_this_week,    color: 'text-emerald-600',bg: 'bg-emerald-50' },
                        { icon: Trophy,    label: 'Avg Score',       val: `${summary.overall_avg_pct}%`,color: 'text-amber-600',  bg: 'bg-amber-50'   },
                        { icon: Flame,     label: 'Streak',          val: `${summary.streak} days`,     color: 'text-orange-600', bg: 'bg-orange-50'  },
                    ].map((card) => (
                        <div key={card.label} className="bg-white rounded-[24px] p-5 border border-slate-100 shadow-sm">
                            <div className={`size-10 ${card.bg} rounded-xl flex items-center justify-center mb-3`}>
                                <card.icon size={18} className={card.color} />
                            </div>
                            <div className="text-2xl font-black text-slate-900 tracking-tight">{card.val}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{card.label}</div>
                        </div>
                    ))}
                </div>

                {/* Time spent banner */}
                <div className="bg-slate-900 rounded-[24px] p-5 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Estimated Study Time</p>
                        <p className="text-2xl font-black text-white mt-1">{summary.estimated_time_min} min</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">~10 min per quiz</p>
                    </div>
                    <TrendingUp size={48} className="text-white/10" />
                </div>

                {/* Mastered topics */}
                {summary.strong_topics?.length > 0 && (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-[24px] p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <CheckCircle2 size={16} className="text-emerald-500" />
                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Mastered</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {summary.strong_topics.map(tp => (
                                <span key={tp} className="px-3 py-1.5 bg-white text-emerald-700 rounded-xl text-xs font-black border border-emerald-100">{tp}</span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Needs attention */}
                {summary.weak_topics?.length > 0 && (
                    <div className="bg-red-50 border border-red-100 rounded-[24px] p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <AlertCircle size={16} className="text-red-500" />
                            <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">Needs More Practice</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {summary.weak_topics.map(tp => (
                                <span key={tp} className="px-3 py-1.5 bg-white text-red-600 rounded-xl text-xs font-black border border-red-100">{tp}</span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Topic breakdown */}
                {topics.length > 0 && (
                    <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-5 pt-5 pb-3 border-b border-slate-50">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chapter Breakdown</p>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {topics.map((topic) => (
                                <div key={topic.name} className="px-5 py-4 flex items-center justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-black text-slate-900 leading-tight">{topic.name}</p>
                                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                                            {topic.attempts} quiz{topic.attempts > 1 ? 'zes' : ''} · Best {topic.best_pct}%
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <p className={`text-sm font-black ${topic.avg_pct >= 80 ? 'text-emerald-600' : topic.avg_pct >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
                                            {topic.avg_pct}%
                                        </p>
                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${
                                            topic.status === 'strong'       ? 'bg-emerald-50 text-emerald-600' :
                                            topic.status === 'improving'    ? 'bg-amber-50 text-amber-600'    :
                                                                              'bg-red-50 text-red-500'
                                        }`}>
                                            {topic.status === 'strong' ? 'Strong' : topic.status === 'improving' ? 'Good' : 'Needs Work'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Recent activity */}
                {recent.length > 0 && (
                    <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-5 pt-5 pb-3 border-b border-slate-50">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recent Sessions</p>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {recent.map((item, i) => (
                                <div key={i} className="px-5 py-4 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-black text-slate-800">{item.topic}</p>
                                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">{item.date}</p>
                                    </div>
                                    <div className={`px-3 py-1.5 rounded-xl text-xs font-black ${
                                        item.pct >= 60 ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-600'
                                    }`}>
                                        {item.score}/{item.total} · {item.pct}%
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="text-center py-6 space-y-1">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Powered by Vidya</p>
                    <p className="text-[9px] font-bold text-slate-200">CBSE Class 6–8 Mathematics Tutor</p>
                </div>

            </div>
        </div>
    );
};

export default ReportView;
