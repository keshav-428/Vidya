import React, { useState } from 'react';
import { Plus, Brain, Sparkles, HelpCircle, CheckCircle2, ArrowLeft, Play, ExternalLink, FileText, Layout, Smartphone, Share2 } from 'lucide-react';
import VidyaBot from '../../components/VidyaBot';

const ConceptsView = ({ t, selectedExam, selectedClass, lang, userId, onStartSuggestion }) => {
    const [conceptStep, setConceptStep] = useState('input'); // 'input', 'loading', 'studio'
    const [conceptQuery, setConceptQuery] = useState('');
    const [lesson, setLesson] = useState({ explanation: '', key_principle: '', common_mistake: '' });
    const [suggestions, setSuggestions] = useState([]);
    const [videos, setVideos] = useState([]);
    const [error, setError] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const handleExplain = async (e, customQuery = null) => {
        if (e) e.preventDefault();
        const query = customQuery || conceptQuery;
        if (!query.trim()) return;
        if (customQuery) setConceptQuery(customQuery);

        setConceptStep('loading');
        setError(null);
        setLesson({ explanation: '', key_principle: '', common_mistake: '' });
        setSuggestions([]);
        setVideos([]);

        try {
            const gradeMatch = selectedClass.match(/\d+/);
            const grade = gradeMatch ? parseInt(gradeMatch[0]) : 6;
            const language = lang === 'hi' ? 'Hindi' : (lang === 'hinglish' ? 'Hinglish' : 'English');

            const [aiRes, youtubeVideos] = await Promise.all([
                fetch('http://localhost:8000/ask', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        question: query,
                        grade: grade,
                        language: language,
                        user_id: userId || "test_user_123"
                    })
                }),
                fetchYouTubeVideos(query, grade)
            ]);

            if (!aiRes.ok) throw new Error('Failed to reach Vidya Knowledge Base');

            const aiData = await aiRes.json();
            setLesson({
                explanation: aiData.explanation,
                key_principle: aiData.key_principle,
                common_mistake: aiData.common_mistake
            });
            setSuggestions(aiData.suggestions || []);
            setVideos(youtubeVideos);
            setConceptStep('studio');
        } catch (err) {
            console.error(err);
            setError(err.message);
            setConceptStep('input');
        }
    };

    const fetchYouTubeVideos = async (concept, grade) => {
        try {
            const res = await fetch('http://localhost:8000/search-videos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: concept,
                    grade: grade
                })
            });
            if (!res.ok) return [];
            return await res.json();
        } catch (e) {
            console.error("YouTube search proxy failed:", e);
            return [];
        }
    };

    const handleSaveFlashcard = () => {
        setIsSaving(true);
        setTimeout(() => setIsSaving(false), 1200);
    };

    const handleStartQuiz = () => {
        if (onStartSuggestion) {
            onStartSuggestion({
                topic: conceptQuery,
                focus_points: lesson.explanation.slice(0, 150)
            });
        }
    };

    if (conceptStep === 'loading') {
        return (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[500px] animate-in fade-in duration-500">
                <VidyaBot message="Gathering NCERT sources and building your visual guide..." isLoading={true} />
                <div className="w-48 h-1.5 bg-slate-100 rounded-full mt-8 overflow-hidden">
                    <div className="h-full bg-indigo-600 animate-[loading_2.5s_linear_infinite]"></div>
                </div>
            </div>
        );
    }

    if (conceptStep === 'studio') {
        return (
            <div className="flex flex-col gap-6 pb-32 animate-in slide-in-from-bottom-8 duration-700">
                {/* Header Section */}
                <div className="flex items-center justify-between">
                    <button onClick={() => setConceptStep('input')} className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors">
                        <ArrowLeft size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Library</span>
                    </button>
                    <div className="bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter">Learning Studio</span>
                    </div>
                </div>

                <div className="bg-white border-2 border-slate-100 rounded-[32px] overflow-hidden shadow-sm">
                    {/* Concept Title Bar */}
                    <div className="bg-slate-900 p-6 flex items-center justify-between">
                        <div className="min-w-0">
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] block mb-1">Studying Now</span>
                            <h2 className="text-xl font-black text-white tracking-tight truncate">{conceptQuery}</h2>
                        </div>
                        <div className="p-3 bg-white/10 rounded-2xl text-white shrink-0">
                            <Brain size={24} />
                        </div>
                    </div>

                    <div className="p-6 space-y-4">
                        {/* Explanation Card */}
                        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                            <p className="text-sm font-bold text-slate-700 leading-relaxed whitespace-pre-wrap">
                                {lesson.explanation}
                            </p>
                        </div>

                        {/* Key Principle Card */}
                        {lesson.key_principle && (
                            <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6 animate-in slide-in-from-left duration-500">
                                <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                                    <div className="size-1.5 bg-emerald-500 rounded-full animate-pulse" /> Key Principle
                                </h4>
                                <p className="text-xs font-black text-emerald-800 leading-relaxed italic">
                                    {lesson.key_principle}
                                </p>
                            </div>
                        )}

                        {/* Common Mistake Card */}
                        {lesson.common_mistake && (
                            <div className="bg-rose-50 border border-rose-100 rounded-3xl p-6 animate-in slide-in-from-right duration-500">
                                <h4 className="text-[10px] font-black text-rose-600 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                                    <div className="size-1.5 bg-rose-500 rounded-full animate-pulse" /> Common Mistake
                                </h4>
                                <p className="text-xs font-bold text-rose-800 leading-relaxed">
                                    {lesson.common_mistake}
                                </p>
                            </div>
                        )}

                        {/* Engagement Bar */}
                        <div className="flex flex-wrap gap-2 pt-6 border-t border-slate-50">
                            <button
                                onClick={handleSaveFlashcard}
                                disabled={isSaving}
                                className="px-4 py-2 bg-slate-50 text-slate-600 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-all active:scale-95 disabled:opacity-50"
                            >
                                <Sparkles size={14} className={isSaving ? "animate-spin" : ""} /> {isSaving ? 'SAVING...' : '+10 XP → SAVE'}
                            </button>
                            <button
                                onClick={handleStartQuiz}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-indigo-100 active:scale-95 transition-all"
                            >
                                <Play size={14} /> QUIZ ME ON THIS
                            </button>
                        </div>
                    </div>
                </div>

                {/* Follow-up Suggestions Chips */}
                {suggestions.length > 0 && (
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                            <Sparkles size={12} className="text-indigo-400" /> Next Questions
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {suggestions.map((s, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleExplain(null, s)}
                                    className="px-4 py-2 bg-white border border-slate-100 rounded-full text-[10px] font-black uppercase tracking-wider text-slate-500 hover:border-indigo-200 hover:bg-slate-50 transition-all active:scale-95 text-left shadow-sm"
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* YouTube Resources Section */}
                {videos.length > 0 && (
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                        <div className="flex items-center justify-between px-2">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Visual Guide</h4>
                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded ring-1 ring-indigo-100">Verified</span>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            {videos.map((video, idx) => (
                                <a
                                    key={idx}
                                    href={video.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group flex items-center gap-4 p-3 bg-white border border-slate-100 rounded-[24px] hover:border-indigo-200 transition-all shadow-sm active:scale-[0.98]"
                                >
                                    <div className="relative shrink-0 w-24 aspect-video rounded-xl bg-slate-50 overflow-hidden">
                                        {video.thumbnail ? (
                                            <img src={video.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                <Play size={20} />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-slate-900/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="size-8 bg-white/90 rounded-full flex items-center justify-center text-indigo-600 shadow-lg">
                                                <Play size={12} fill="currentColor" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-tight line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors">
                                            {video.title}
                                        </h5>
                                        <div className="flex items-center gap-1.5 mt-1 border-t border-slate-50 pt-1 text-slate-400">
                                            <ExternalLink size={10} />
                                            <span className="text-[9px] font-bold uppercase tracking-[0.2em]">YouTube Tutorial</span>
                                        </div>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Library Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Concept Library</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Grounding knowledge from NCERT source</p>
                </div>
                <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100">
                    <Brain size={24} />
                </div>
            </div>

            <form onSubmit={handleExplain} className="relative group">
                <input
                    type="text"
                    value={conceptQuery}
                    onChange={(e) => setConceptQuery(e.target.value)}
                    placeholder="Ask about Integers, Fractions, or Geometry..."
                    className="w-full p-6 bg-white border-2 border-slate-100 rounded-[32px] text-slate-900 placeholder-slate-300 font-bold focus:outline-none focus:border-indigo-500 transition-all shadow-sm group-hover:shadow-md"
                />
                <button
                    disabled={!conceptQuery.trim()}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-slate-900 text-white p-3.5 rounded-2xl shadow-lg hover:bg-indigo-600 disabled:opacity-30 disabled:hover:bg-slate-900 transition-all active:scale-95"
                >
                    <Sparkles size={20} />
                </button>
            </form>

            <div className="grid grid-cols-2 gap-4">
                {[
                    { title: "What is HCF?", icon: HelpCircle, color: "bg-orange-50 text-orange-600" },
                    { title: "Laws of Exponents", icon: Layout, color: "bg-indigo-50 text-indigo-600" },
                    { title: "Visualizing Area", icon: FileText, color: "bg-emerald-50 text-emerald-600" },
                    { title: "Integer Rules", icon: CheckCircle2, color: "bg-slate-50 text-slate-600" }
                ].map((item, idx) => (
                    <button
                        key={idx}
                        onClick={() => handleExplain(null, item.title)}
                        className="p-5 bg-white border-2 border-slate-100 rounded-[28px] flex flex-col gap-3 hover:border-indigo-500 transition-all active:scale-95 group text-left"
                    >
                        <div className={`size-10 rounded-xl flex items-center justify-center ${item.color}`}>
                            <item.icon size={20} />
                        </div>
                        <span className="text-xs font-black text-slate-900 uppercase tracking-tight leading-tight group-hover:text-indigo-600 transition-colors">
                            {item.title}
                        </span>
                    </button>
                ))}
            </div>

            <div className="mt-8 p-8 bg-slate-900 rounded-[32px] shadow-xl relative overflow-hidden group">
                <div className="absolute right-0 top-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                    <Sparkles size={80} className="text-white" />
                </div>
                <div className="relative z-10">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] block mb-2">Personalized Studio</span>
                    <h3 className="text-white text-lg font-black tracking-tight mb-2">Learn with Multimodality</h3>
                    <p className="text-indigo-200/60 text-xs font-bold leading-relaxed mb-6">Ask a doubt and Vidya will ground her response from NCERT textbooks while finding verified video tutorials for you.</p>
                </div>
            </div>
            <style jsx="true">{` .hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; } @keyframes loading { 0% { width: 0; } 100% { width: 100%; } } `}</style>
        </div>
    );
};

export default ConceptsView;
