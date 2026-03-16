import React, { useState, useEffect } from 'react';
import { Clock, Trophy, ChevronRight, CheckCircle2, Play, Lock, Sparkles } from 'lucide-react';
import { topicsMap } from '../../utils/constants';
import VidyaBot from '../../components/VidyaBot';

const HomeView = ({ t, name, selectedExam, practiceTime, selectedClass, painPoint, userId, onStartSuggestion }) => {
    const [briefing, setBriefing] = useState("");
    const [suggestion, setSuggestion] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const currentTopics = topicsMap[selectedClass] || topicsMap['Class 6'];

    useEffect(() => {
        const fetchBriefing = async () => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

            try {
                const gradeMatch = selectedClass.match(/\d+/);
                const grade = gradeMatch ? parseInt(gradeMatch[0]) : 6;

                const [briefingRes, suggestionRes] = await Promise.all([
                    fetch('http://localhost:8000/briefing', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ user_id: userId || "test_user_123", name: name, grade: grade }),
                        signal: controller.signal
                    }),
                    fetch(`http://localhost:8000/suggestion/${userId || "test_user_123"}`, {
                        signal: controller.signal
                    })
                ]);

                clearTimeout(timeoutId);

                const briefingData = await briefingRes.json();
                const suggestionData = await suggestionRes.json();

                setBriefing(briefingData.briefing);
                setSuggestion(suggestionData);
            } catch (err) {
                console.error("HomeView fetch error:", err);
                setBriefing(`Hey ${name.split(' ')[0]}! Ready to crush some Math today?`);
            } finally {
                setIsLoading(false);
            }
        };
        fetchBriefing();
    }, [name, selectedClass, userId]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">{t.hello}, {name.split(' ')[0]}! 👋</h2>
                <div className="flex items-center gap-2 mt-1">
                    <Clock size={12} className="text-slate-400" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedExam} • {practiceTime} path</p>
                </div>
            </div>

            <VidyaBot message={briefing || "Waking up your study companion..."} isLoading={isLoading} />

            {suggestion && !isLoading && (
                <div className="bg-white border-2 border-indigo-100 rounded-[32px] p-6 shadow-sm animate-in slide-in-from-right-8 duration-700">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-100">
                            <Sparkles size={18} />
                        </div>
                        <div>
                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block leading-none">Smart Suggestion</span>
                            <span className="text-sm font-black text-slate-800">Your Next Best Move</span>
                        </div>
                    </div>
                    <p className="text-xs font-bold text-slate-600 leading-relaxed mb-6">
                        {suggestion.reason}
                    </p>
                    <button
                        onClick={() => onStartSuggestion(suggestion)}
                        className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-indigo-50 active:scale-95 transition-all"
                    >
                        Start {suggestion.topic} Quiz <ChevronRight size={16} />
                    </button>
                </div>
            )}

            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-indigo-950 rounded-[32px] p-6 shadow-xl shadow-slate-200 group">
                <Trophy size={140} className="absolute -right-8 -bottom-8 text-white/5 rotate-12 group-hover:rotate-6 transition-transform duration-500" />
                <div className="relative z-10">
                    <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black text-white uppercase tracking-widest mb-3">Live Alert</span>
                    <h3 className="text-2xl font-black text-white leading-tight mb-1">{t.mockExam}</h3>
                    <p className="text-indigo-100 font-bold text-sm mb-6 opacity-80">{t.examTime}</p>
                    <button className="flex items-center gap-2 bg-white text-indigo-600 px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-black/10 active:scale-95 transition-all">{t.joinArena} <ChevronRight size={18} /></button>
                </div>
            </div>
            <section className="space-y-6">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-1">{t.learningPath}</h4>
                <div className="space-y-0 relative">
                    <div className="absolute left-6 top-8 bottom-8 w-1 bg-slate-100 rounded-full"></div>
                    <div className="relative flex items-start gap-6 pb-12 group">
                        <div className="relative z-10 size-12 bg-green-100 rounded-full flex items-center justify-center border-4 border-white shadow-sm transition-transform group-hover:scale-110"><CheckCircle2 className="text-green-600" size={24} strokeWidth={2.5} /></div>
                        <div className="pt-2"><h5 className="text-lg font-black text-slate-400 line-through tracking-tight">{t[currentTopics[0].label]}</h5><span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">{t.completed}</span></div>
                    </div>
                    <div className="relative flex items-start gap-6 pb-12 group">
                        <div className="absolute inset-0 bg-yellow-50/50 -mx-4 rounded-3xl -z-0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative z-10 size-12 bg-yellow-400 rounded-full flex items-center justify-center border-4 border-white shadow-lg animate-bounce duration-[2000ms]"><Play className="text-white fill-white ml-1" size={24} /></div>
                        <div className="pt-2 flex-1 relative z-10"><h5 className="text-lg font-black text-slate-900 tracking-tight">{t[painPoint] || t[currentTopics[1].label]}</h5><div className="flex items-center gap-3 mt-2"><div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden"><div className="w-1/3 h-full bg-yellow-400 rounded-full"></div></div><span className="text-[10px] font-black text-yellow-600 uppercase tracking-widest">{t.active}</span></div></div>
                    </div>
                    <div className="relative flex items-start gap-6 group">
                        <div className="relative z-10 size-12 bg-slate-100 rounded-full flex items-center justify-center border-4 border-white shadow-sm opacity-50 grayscale"><Lock className="text-slate-400" size={20} /></div>
                        <div className="pt-2 opacity-40"><h5 className="text-lg font-black text-slate-900 tracking-tight">{t[currentTopics[2].label]}</h5><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.locked}</span></div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default HomeView;
