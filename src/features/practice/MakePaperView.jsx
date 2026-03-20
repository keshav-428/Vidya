import { API_URL } from '../../config';
import React, { useState } from 'react';
import { topicsMap } from '../../utils/constants';
import { FileText, CheckSquare, Square, ChevronRight, Printer, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';

const MakePaperView = ({ t, selectedClass, lang, userId }) => {
    const [step, setStep] = useState('setup'); // 'setup' | 'generating' | 'paper'
    const [selectedTopics, setSelectedTopics] = useState([]);
    const [totalMarks, setTotalMarks] = useState(40);
    const [difficulty, setDifficulty] = useState('Medium');
    const [paper, setPaper] = useState(null);
    const [error, setError] = useState(null);

    const topics = topicsMap[selectedClass] || topicsMap['Class 6'];
    const gradeMatch = selectedClass.match(/\d+/);
    const grade = gradeMatch ? parseInt(gradeMatch[0]) : 6;
    const language = lang === 'hi' ? 'Hindi' : 'English';

    const toggleTopic = (label) => {
        setSelectedTopics(prev =>
            prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
        );
    };

    const selectAll = () => setSelectedTopics(topics.map(tp => t[tp.label] || tp.label));
    const clearAll = () => setSelectedTopics([]);

    const generatePaper = async () => {
        if (selectedTopics.length === 0) return;
        setStep('generating');
        setError(null);
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
            setStep('paper');
        } catch (err) {
            setError(err.name === 'AbortError' ? 'Timed out. Try fewer chapters.' : err.message);
            setStep('setup');
        }
    };

    const handlePrint = () => window.print();

    // ── Generating ───────────────────────────────────────────────────────────
    if (step === 'generating') {
        return (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[500px] gap-6 animate-in fade-in duration-500">
                <div className="size-16 bg-indigo-600 rounded-[28px] flex items-center justify-center shadow-xl shadow-indigo-100">
                    <Loader2 size={28} className="text-white animate-spin" />
                </div>
                <div className="text-center">
                    <p className="text-sm font-black text-slate-900 uppercase tracking-widest">Building Your Paper</p>
                    <p className="text-xs font-bold text-slate-400 mt-1">Generating {totalMarks}-mark exam across {selectedTopics.length} chapter{selectedTopics.length > 1 ? 's' : ''}...</p>
                </div>
                <div className="w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full animate-[loading_3s_linear_infinite]" />
                </div>
            </div>
        );
    }

    // ── Paper View ───────────────────────────────────────────────────────────
    if (step === 'paper' && paper) {
        const timeAllowed = totalMarks === 80 ? '3 Hours' : '2 Hours';
        return (
            <div className="animate-in fade-in duration-500 pb-20">
                {/* Controls */}
                <div className="flex items-center justify-between mb-6 print:hidden">
                    <button
                        onClick={() => setStep('setup')}
                        className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
                    >
                        <ArrowLeft size={14} /> New Paper
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 active:scale-95 transition-all"
                    >
                        <Printer size={14} /> Print
                    </button>
                </div>

                {/* Paper */}
                <div className="bg-white border-2 border-slate-200 rounded-[24px] overflow-hidden" id="exam-paper">
                    {/* Header */}
                    <div className="border-b-2 border-slate-200 p-6 text-center space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mock Examination</p>
                        <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight">Mathematics</h1>
                        <p className="text-xs font-bold text-slate-600">{selectedClass} &nbsp;|&nbsp; CBSE</p>
                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            <span>Time: {timeAllowed}</span>
                            <span className={difficulty === 'Easy' ? 'text-emerald-600' : difficulty === 'Hard' ? 'text-red-500' : 'text-amber-600'}>
                                {difficulty === 'Easy' ? 'Thinker' : difficulty === 'Hard' ? 'Genius' : 'Scholar'}
                            </span>
                            <span>Max Marks: {totalMarks}</span>
                        </div>
                    </div>

                    {/* Instructions */}
                    <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">General Instructions</p>
                        <ol className="space-y-1">
                            {[
                                'All questions are compulsory.',
                                'The question paper consists of ' + paper.sections.length + ' sections.',
                                'Use of calculator is not permitted.',
                                'Draw neat diagrams wherever required.',
                            ].map((ins, i) => (
                                <li key={i} className="text-[11px] font-bold text-slate-600 flex gap-2">
                                    <span className="shrink-0">{i + 1}.</span><span>{ins}</span>
                                </li>
                            ))}
                        </ol>
                    </div>

                    {/* Sections */}
                    <div className="divide-y divide-slate-100">
                        {paper.sections.map((section) => (
                            <div key={section.name} className="p-6">
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <span className="text-xs font-black text-slate-900 uppercase tracking-widest">Section {section.name}</span>
                                        <span className="ml-2 text-[10px] font-bold text-slate-400">({section.marks_per_q} mark{section.marks_per_q > 1 ? 's' : ''} each)</span>
                                    </div>
                                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                                        {section.questions.length * section.marks_per_q} marks
                                    </span>
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 italic mb-4">{section.instructions}</p>

                                <div className="space-y-4">
                                    {section.questions.map((q) => (
                                        <div key={q.number} className="flex gap-3">
                                            <span className="text-xs font-black text-slate-500 shrink-0 w-6">{q.number}.</span>
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-slate-800 leading-relaxed">{q.text}</p>
                                                {q.type === 'mcq' && q.options && (
                                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                                                        {q.options.map((opt, oi) => (
                                                            <p key={oi} className="text-xs font-bold text-slate-600">
                                                                ({String.fromCharCode(97 + oi)}) {opt}
                                                            </p>
                                                        ))}
                                                    </div>
                                                )}
                                                {(q.type === 'short' || q.type === 'long') && (
                                                    <div className="mt-3 space-y-1">
                                                        {Array.from({ length: section.marks_per_q + 1 }).map((_, li) => (
                                                            <div key={li} className="border-b border-dashed border-slate-200 h-5" />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <span className="text-[10px] font-black text-slate-300 shrink-0">[{section.marks_per_q}]</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-6 text-center border-t border-slate-100">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">— End of Paper —</p>
                    </div>
                </div>
            </div>
        );
    }

    // ── Setup ────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Make a Paper</h2>
                <p className="text-xs font-bold text-slate-400 mt-0.5 uppercase tracking-widest">Generate a CBSE-style exam paper</p>
            </div>

            {error && (
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl">
                    <AlertCircle size={16} className="text-red-500 shrink-0" />
                    <p className="text-xs font-bold text-red-600">{error}</p>
                </div>
            )}

            {/* Marks selector */}
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2">Total Marks</p>
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { val: 40, label: '40 Marks', sub: 'Half-yearly · 2 hrs', sections: 'A(10×1) B(5×2) C(4×3) D(2×4)' },
                        { val: 80, label: '80 Marks', sub: 'Annual · 3 hrs', sections: 'A(20×1) B(10×2) C(8×3) D(4×4)' },
                    ].map(opt => (
                        <button
                            key={opt.val}
                            onClick={() => setTotalMarks(opt.val)}
                            className={`p-4 rounded-[24px] border-2 text-left transition-all active:scale-[0.98] ${totalMarks === opt.val ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 bg-white'}`}
                        >
                            <p className={`text-sm font-black ${totalMarks === opt.val ? 'text-indigo-700' : 'text-slate-900'}`}>{opt.label}</p>
                            <p className="text-[10px] font-bold text-slate-400 mt-0.5">{opt.sub}</p>
                            <p className={`text-[9px] font-black mt-2 uppercase tracking-widest ${totalMarks === opt.val ? 'text-indigo-400' : 'text-slate-300'}`}>{opt.sections}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Difficulty selector */}
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2">Difficulty</p>
                <div className="grid grid-cols-3 gap-2">
                    {[
                        { val: 'Easy',   label: 'Thinker', desc: 'Straightforward',  color: 'border-emerald-500 bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
                        { val: 'Medium', label: 'Scholar', desc: 'Apply concepts',   color: 'border-amber-500 bg-amber-50 text-amber-700',        dot: 'bg-amber-500'   },
                        { val: 'Hard',   label: 'Genius',  desc: 'Real exam level',  color: 'border-red-500 bg-red-50 text-red-700',              dot: 'bg-red-500'     },
                    ].map(d => (
                        <button
                            key={d.val}
                            onClick={() => setDifficulty(d.val)}
                            className={`flex flex-col items-center py-3 rounded-2xl border-2 transition-all active:scale-95 ${difficulty === d.val ? d.color : 'border-slate-100 bg-white text-slate-400'}`}
                        >
                            <div className={`size-2 rounded-full mb-1.5 ${difficulty === d.val ? d.dot : 'bg-slate-200'}`} />
                            <span className="text-[11px] font-black uppercase tracking-widest">{d.label}</span>
                            <span className="text-[9px] font-bold mt-0.5 opacity-70">{d.desc}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Chapter selector */}
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
                            <button
                                key={tp.id}
                                onClick={() => toggleTopic(label)}
                                className={`w-full flex items-center gap-3 p-4 rounded-[20px] border-2 transition-all active:scale-[0.98] text-left ${isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 bg-white hover:border-indigo-200'}`}
                            >
                                {isSelected
                                    ? <CheckSquare size={18} className="text-indigo-600 shrink-0" />
                                    : <Square size={18} className="text-slate-300 shrink-0" />
                                }
                                <span className={`text-sm font-black ${isSelected ? 'text-indigo-700' : 'text-slate-700'}`}>{label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Generate button */}
            <button
                onClick={generatePaper}
                disabled={selectedTopics.length === 0}
                className="w-full py-5 bg-indigo-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black rounded-[28px] text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-indigo-100 active:scale-[0.98] transition-all"
            >
                <FileText size={18} />
                Generate Paper
                {selectedTopics.length > 0 && (
                    <span className="bg-white/20 px-2 py-0.5 rounded-lg text-[10px]">{selectedTopics.length} chapter{selectedTopics.length > 1 ? 's' : ''}</span>
                )}
            </button>
        </div>
    );
};

export default MakePaperView;
