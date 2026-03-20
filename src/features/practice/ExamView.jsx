import { API_URL } from '../../config';
import React, { useState, useEffect, useRef } from 'react';
import { Clock, Camera, X, CheckCircle2, AlertCircle, Loader2, ArrowLeft, ChevronDown, Trophy, Target, TrendingUp, Upload } from 'lucide-react';

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const compressImage = (file) =>
    new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const maxSize = 1024;
            let { width, height } = img;
            if (width > height && width > maxSize) { height = (height * maxSize) / width; width = maxSize; }
            else if (height > maxSize) { width = (width * maxSize) / height; height = maxSize; }
            const canvas = document.createElement('canvas');
            canvas.width = width; canvas.height = height;
            canvas.getContext('2d').drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.85).split(',')[1]);
        };
        img.src = URL.createObjectURL(file);
    });

// ── Component ─────────────────────────────────────────────────────────────────

const ExamView = ({ paper, totalMarks, grade, language, selectedClass, onDone }) => {
    const [phase, setPhase] = useState('exam'); // 'exam' | 'upload' | 'grading' | 'result'
    const [examTimeLeft, setExamTimeLeft] = useState(totalMarks === 80 ? 10800 : 7200);
    const [uploadTimeLeft, setUploadTimeLeft] = useState(900);
    const [uploadedImages, setUploadedImages] = useState([]); // [{preview, base64}]
    const [gradingResult, setGradingResult] = useState(null);
    const [gradingError, setGradingError] = useState(null);
    const [expandedQ, setExpandedQ] = useState(null);
    const fileInputRef = useRef(null);

    // Exam countdown
    useEffect(() => {
        if (phase !== 'exam') return;
        if (examTimeLeft === 0) { setPhase('upload'); return; }
        const id = setInterval(() => setExamTimeLeft(p => p - 1), 1000);
        return () => clearInterval(id);
    }, [phase, examTimeLeft]);

    // Upload countdown (informational only — doesn't force submit)
    useEffect(() => {
        if (phase !== 'upload' || uploadTimeLeft === 0) return;
        const id = setInterval(() => setUploadTimeLeft(p => p - 1), 1000);
        return () => clearInterval(id);
    }, [phase, uploadTimeLeft]);

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        const remaining = 4 - uploadedImages.length;
        const toProcess = files.slice(0, remaining);
        for (const file of toProcess) {
            const base64 = await compressImage(file);
            const preview = URL.createObjectURL(file);
            setUploadedImages(prev => [...prev, { preview, base64 }]);
        }
        e.target.value = '';
    };

    const removeImage = (idx) =>
        setUploadedImages(prev => prev.filter((_, i) => i !== idx));

    const submitForGrading = async () => {
        if (uploadedImages.length === 0) return;
        setGradingError(null);
        setPhase('grading');
        try {
            const res = await fetch(`${API_URL}/grade-paper`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    images: uploadedImages.map(img => img.base64),
                    paper,
                    grade,
                    total_marks: totalMarks,
                    language
                })
            });
            if (!res.ok) throw new Error('Grading failed');
            const data = await res.json();
            setGradingResult(data);
            setPhase('result');
        } catch (err) {
            setGradingError(err.message);
            setPhase('upload');
        }
    };

    // ── Exam phase ────────────────────────────────────────────────────────────
    if (phase === 'exam') {
        const isUrgent = examTimeLeft < 600; // last 10 min
        const timeAllowed = totalMarks === 80 ? '3 Hours' : '2 Hours';
        return (
            <div className="flex flex-col animate-in fade-in duration-500 pb-20">
                {/* Sticky timer bar */}
                <div className={`sticky top-0 z-10 flex items-center justify-between px-4 py-3 rounded-2xl mb-4 transition-colors ${isUrgent ? 'bg-red-600' : 'bg-slate-900'}`}>
                    <div className="flex items-center gap-2">
                        <Clock size={16} className="text-white" />
                        <span className="text-[10px] font-black text-white/70 uppercase tracking-widest">Time Left</span>
                    </div>
                    <span className={`text-lg font-black text-white tracking-tight font-mono ${isUrgent ? 'animate-pulse' : ''}`}>
                        {formatTime(examTimeLeft)}
                    </span>
                    <button
                        onClick={() => setPhase('upload')}
                        className="px-3 py-1.5 bg-white/20 text-white text-[10px] font-black uppercase tracking-widest rounded-xl active:scale-95 transition-all"
                    >
                        Done Early
                    </button>
                </div>

                {/* Paper content */}
                <div className="bg-white border-2 border-slate-200 rounded-[24px] overflow-hidden mb-6">
                    <div className="border-b-2 border-slate-200 p-6 text-center space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Examination</p>
                        <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight">Mathematics</h1>
                        <p className="text-xs font-bold text-slate-600">{selectedClass} &nbsp;|&nbsp; CBSE</p>
                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            <span>Time: {timeAllowed}</span>
                            <span>Max Marks: {totalMarks}</span>
                        </div>
                    </div>
                    <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
                        <ol className="space-y-1">
                            {['All questions are compulsory.', 'Write your answers on a separate answer sheet.', 'Show all working for Sections B, C, and D.'].map((ins, i) => (
                                <li key={i} className="text-[11px] font-bold text-slate-600 flex gap-2">
                                    <span className="shrink-0">{i + 1}.</span><span>{ins}</span>
                                </li>
                            ))}
                        </ol>
                    </div>
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
                                                            <p key={oi} className="text-xs font-bold text-slate-600">({String.fromCharCode(97 + oi)}) {opt}</p>
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

    // ── Upload phase ──────────────────────────────────────────────────────────
    if (phase === 'upload') {
        const isOvertime = uploadTimeLeft === 0;
        return (
            <div className="flex flex-col gap-5 animate-in fade-in duration-500 pb-20">
                {/* Header */}
                <div className="bg-slate-900 rounded-[28px] p-6 text-center">
                    <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">Time's Up!</p>
                    <p className="text-xl font-black text-white">Upload Your Answer Sheet</p>
                    <p className="text-xs font-bold text-slate-400 mt-1">Photograph each page clearly</p>
                    {!isOvertime ? (
                        <div className={`inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl ${uploadTimeLeft < 120 ? 'bg-red-500/20' : 'bg-white/10'}`}>
                            <Clock size={14} className="text-white" />
                            <span className={`font-black text-sm font-mono ${uploadTimeLeft < 120 ? 'text-red-300 animate-pulse' : 'text-white'}`}>
                                {formatTime(uploadTimeLeft)} remaining to upload
                            </span>
                        </div>
                    ) : (
                        <p className="text-xs font-bold text-amber-400 mt-3">Upload window expired — you can still submit</p>
                    )}
                </div>

                {/* Error */}
                {gradingError && (
                    <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl">
                        <AlertCircle size={16} className="text-red-500 shrink-0" />
                        <p className="text-xs font-bold text-red-600">Grading failed — please try again. ({gradingError})</p>
                    </div>
                )}

                {/* Image slots */}
                <div>
                    <div className="flex items-center justify-between px-1 mb-3">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Answer Sheet Pages</p>
                        <p className="text-[10px] font-bold text-slate-400">{uploadedImages.length}/4 pages</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {uploadedImages.map((img, i) => (
                            <div key={i} className="relative aspect-[3/4] rounded-2xl overflow-hidden border-2 border-indigo-200 shadow-sm">
                                <img src={img.preview} alt={`Page ${i + 1}`} className="w-full h-full object-cover" />
                                <div className="absolute top-2 left-2 bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded-lg">
                                    P{i + 1}
                                </div>
                                <button
                                    onClick={() => removeImage(i)}
                                    className="absolute top-2 right-2 size-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow active:scale-90"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ))}

                        {/* Add page slot */}
                        {uploadedImages.length < 4 && (
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="aspect-[3/4] rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center gap-2 active:scale-[0.98] transition-all hover:border-indigo-300 hover:bg-indigo-50"
                            >
                                <div className="size-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                                    <Camera size={20} className="text-slate-400" />
                                </div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    {uploadedImages.length === 0 ? 'Add Page' : 'Add More'}
                                </span>
                            </button>
                        )}
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleImageUpload}
                    />
                </div>

                <p className="text-center text-[10px] font-bold text-slate-400 px-4">
                    Tip: Good lighting + flat surface = better grading accuracy
                </p>

                {/* Submit */}
                <button
                    onClick={submitForGrading}
                    disabled={uploadedImages.length === 0}
                    className="w-full py-5 bg-indigo-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black rounded-[28px] text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-indigo-100 active:scale-[0.98] transition-all"
                >
                    <Upload size={18} />
                    Submit for Grading
                    {uploadedImages.length > 0 && (
                        <span className="bg-white/20 px-2 py-0.5 rounded-lg text-[10px]">{uploadedImages.length} page{uploadedImages.length > 1 ? 's' : ''}</span>
                    )}
                </button>

                <button onClick={onDone} className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest py-2">
                    Cancel
                </button>
            </div>
        );
    }

    // ── Grading phase ─────────────────────────────────────────────────────────
    if (phase === 'grading') {
        return (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[500px] gap-6 animate-in fade-in duration-500">
                <div className="size-20 bg-indigo-600 rounded-[32px] flex items-center justify-center shadow-xl shadow-indigo-100">
                    <Loader2 size={32} className="text-white animate-spin" />
                </div>
                <div className="text-center space-y-1">
                    <p className="text-sm font-black text-slate-900 uppercase tracking-widest">Vidya is Checking Your Paper</p>
                    <p className="text-xs font-bold text-slate-400">Analysing step by step — this takes ~20–30 seconds</p>
                </div>
                <div className="w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full animate-[loading_3s_linear_infinite]" />
                </div>
            </div>
        );
    }

    // ── Result phase ──────────────────────────────────────────────────────────
    if (phase === 'result' && gradingResult) {
        const { total_awarded, total_possible, percentage, sections, overall_feedback, strong_areas, improvement_areas } = gradingResult;
        const passed = percentage >= 33;

        return (
            <div className="flex flex-col gap-5 animate-in fade-in duration-500 pb-20">
                {/* Score hero */}
                <div className={`rounded-[32px] p-8 text-center ${passed ? 'bg-slate-900' : 'bg-red-900'}`}>
                    <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-2">Your Result</p>
                    <div className="text-5xl font-black text-white tracking-tight">
                        {total_awarded}<span className="text-2xl text-white/40">/{total_possible}</span>
                    </div>
                    <div className={`inline-block mt-3 px-4 py-1.5 rounded-xl text-sm font-black uppercase tracking-widest ${
                        percentage >= 75 ? 'bg-emerald-500 text-white' :
                        percentage >= 50 ? 'bg-amber-500 text-white' :
                        percentage >= 33 ? 'bg-orange-500 text-white' :
                                           'bg-red-500 text-white'
                    }`}>
                        {percentage}% · {percentage >= 75 ? 'Distinction' : percentage >= 50 ? 'First Division' : percentage >= 33 ? 'Pass' : 'Needs Improvement'}
                    </div>
                </div>

                {/* Teacher feedback */}
                <div className="bg-indigo-50 border border-indigo-100 rounded-[24px] p-5">
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2">Vidya's Assessment</p>
                    <p className="text-sm font-bold text-slate-700 leading-relaxed">{overall_feedback}</p>
                </div>

                {/* Strong / Improvement areas */}
                <div className="grid grid-cols-2 gap-3">
                    {strong_areas?.length > 0 && (
                        <div className="bg-emerald-50 border border-emerald-100 rounded-[20px] p-4">
                            <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-2">Strong</p>
                            <div className="space-y-1">
                                {strong_areas.map(a => (
                                    <p key={a} className="text-xs font-black text-emerald-700">{a}</p>
                                ))}
                            </div>
                        </div>
                    )}
                    {improvement_areas?.length > 0 && (
                        <div className="bg-orange-50 border border-orange-100 rounded-[20px] p-4">
                            <p className="text-[9px] font-black text-orange-600 uppercase tracking-widest mb-2">Focus On</p>
                            <div className="space-y-1">
                                {improvement_areas.map(a => (
                                    <p key={a} className="text-xs font-black text-orange-700">{a}</p>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Section breakdown */}
                {sections?.map((section) => (
                    <div key={section.name} className="bg-white border border-slate-100 rounded-[24px] overflow-hidden shadow-sm">
                        <div className="px-5 py-4 flex items-center justify-between border-b border-slate-50">
                            <span className="text-xs font-black text-slate-900 uppercase tracking-widest">Section {section.name}</span>
                            <span className={`text-sm font-black ${
                                section.marks_awarded / section.marks_possible >= 0.75 ? 'text-emerald-600' :
                                section.marks_awarded / section.marks_possible >= 0.5  ? 'text-amber-600'   : 'text-red-500'
                            }`}>
                                {section.marks_awarded}/{section.marks_possible}
                            </span>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {section.questions?.map((q) => {
                                const isExpanded = expandedQ === `${section.name}-${q.number}`;
                                const statusColor =
                                    q.status === 'correct'   ? 'text-emerald-600 bg-emerald-50 border-emerald-100' :
                                    q.status === 'partial'   ? 'text-amber-600 bg-amber-50 border-amber-100'       :
                                    q.status === 'blank'     ? 'text-slate-400 bg-slate-50 border-slate-100'       :
                                                               'text-red-500 bg-red-50 border-red-100';
                                return (
                                    <div key={q.number}>
                                        <button
                                            onClick={() => setExpandedQ(isExpanded ? null : `${section.name}-${q.number}`)}
                                            className="w-full px-5 py-3.5 flex items-center justify-between text-left"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs font-black text-slate-500 w-5">Q{q.number}</span>
                                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${statusColor}`}>
                                                    {q.marks_awarded}/{q.marks_possible}
                                                </span>
                                            </div>
                                            <ChevronDown size={14} className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                        </button>
                                        {isExpanded && (
                                            <div className="px-5 pb-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
                                                {q.student_answer && (
                                                    <div>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Your Answer</p>
                                                        <p className="text-xs font-bold text-slate-700 bg-slate-50 rounded-xl px-3 py-2">{q.student_answer}</p>
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1">Feedback</p>
                                                    <p className="text-xs font-bold text-slate-700">{q.feedback}</p>
                                                </div>
                                                {q.model_answer && q.status !== 'correct' && (
                                                    <div>
                                                        <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Model Answer</p>
                                                        <p className="text-xs font-bold text-emerald-700 bg-emerald-50 rounded-xl px-3 py-2">{q.model_answer}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}

                <button
                    onClick={onDone}
                    className="w-full py-5 bg-slate-900 text-white font-black rounded-[28px] text-sm uppercase tracking-widest shadow-xl active:scale-[0.98] transition-all"
                >
                    Back to Practice
                </button>
            </div>
        );
    }

    return null;
};

export default ExamView;
