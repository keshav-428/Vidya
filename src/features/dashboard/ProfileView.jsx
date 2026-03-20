import { API_URL } from '../../config';
import React, { useState } from 'react';
import { Flame, Globe, LogOut, GraduationCap, BookOpen, CheckCircle2, ChevronDown, Share2 } from 'lucide-react';
import { avatars, classes, exams } from '../../utils/constants';

const InlineSelector = ({ options, current, onSelect, labelMap }) => (
    <div className="mt-2 mx-1 space-y-1.5 animate-in slide-in-from-top-2 duration-200">
        {options.map(opt => (
            <button
                key={opt}
                onClick={() => onSelect(opt)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border-2 transition-all active:scale-[0.98] text-left ${
                    current === opt
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-indigo-200'
                }`}
            >
                <span className="text-sm font-black">{labelMap ? labelMap[opt] : opt}</span>
                {current === opt && <CheckCircle2 size={16} className="text-indigo-500 shrink-0" />}
            </button>
        ))}
    </div>
);

const ProfileView = ({ t, name, selectedClass, selectedExam, lang, setLang, setIsLoggedIn, selectedAvatar, setSelectedAvatar, userId, setSelectedClass, setSelectedExam }) => {
    const [expanded, setExpanded] = useState(null); // 'class' | 'exam' | null
    const [copied, setCopied] = useState(false);

    const handleShareReport = () => {
        const link = `${window.location.origin}/report/${userId || 'test_user_123'}`;
        navigator.clipboard.writeText(link).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        });
    };
    const toggle = (key) => setExpanded(prev => prev === key ? null : key);
    const userAvatar = avatars.find(a => a.id === selectedAvatar) || avatars[0];

    const saveToBackend = async (updates) => {
        try {
            await fetch(`${API_URL}/profile`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId || 'test_user_123', ...updates })
            });
        } catch (e) {
            console.error('Failed to save profile:', e);
        }
    };

    const handleClassChange = (cls) => {
        setSelectedClass(cls);
        setExpanded(null);
        saveToBackend({ grade: cls });
    };

    const handleExamChange = (exam) => {
        setSelectedExam(exam);
        setExpanded(null);
        saveToBackend({ exam });
    };

    const settingsRows = [
        {
            key: 'class',
            icon: GraduationCap,
            label: 'Class',
            val: selectedClass,
            action: () => toggle('class'),
            expandContent: <InlineSelector options={classes} current={selectedClass} onSelect={handleClassChange} />,
        },
        {
            key: 'exam',
            icon: BookOpen,
            label: 'Syllabus',
            val: selectedExam,
            action: () => toggle('exam'),
            expandContent: <InlineSelector options={exams} current={selectedExam} onSelect={handleExamChange} />,
        },
        {
            key: 'lang',
            icon: Globe,
            label: t.language,
            val: lang === 'en' ? 'English' : lang === 'hi' ? 'हिन्दी' : 'Hinglish',
            action: () => toggle('lang'),
            expandContent: <InlineSelector
                options={['en', 'hi', 'hinglish']}
                current={lang}
                onSelect={(l) => { setLang(l); setExpanded(null); saveToBackend({ language: l === 'hi' ? 'Hindi' : l === 'hinglish' ? 'Hinglish' : 'English' }); }}
                labelMap={{ en: 'English', hi: 'हिन्दी', hinglish: 'Hinglish' }}
            />,
        },
        {
            key: 'logout',
            icon: LogOut,
            label: t.logout,
            color: 'text-red-500',
            action: () => setIsLoggedIn(false),
        },
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
            {/* Avatar + name */}
            <div className="flex flex-col items-center gap-4">
                <div className={`size-24 rounded-[32px] ${userAvatar.color} flex items-center justify-center border-4 border-white shadow-xl`}>
                    <span style={{ fontSize: '56px', lineHeight: 1 }}>{userAvatar.emoji}</span>
                </div>
                <div className="grid grid-cols-6 gap-2 w-full">
                    {avatars.map((a) => (
                        <button key={a.id} onClick={() => setSelectedAvatar(a.id)} className={`aspect-square rounded-2xl flex items-center justify-center transition-all active:scale-90 ${selectedAvatar === a.id ? `${a.color} ring-2 ring-indigo-400 scale-110 shadow-md` : 'bg-slate-50 hover:bg-slate-100'}`}>
                            <span style={{ fontSize: '22px', lineHeight: 1 }}>{a.emoji}</span>
                        </button>
                    ))}
                </div>
                <div className="text-center">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">{name}</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">{selectedClass} • {selectedExam}</p>
                </div>
            </div>

            {/* Stats */}
            <div className="flex justify-center">
                <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm text-center w-40">
                    <Flame size={24} className="text-orange-500 mx-auto mb-2" />
                    <div className="text-xl font-black text-slate-900 tracking-tighter">3</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.daysStreak}</div>
                </div>
            </div>

            {/* Share progress report */}
            <div className="space-y-2">
                <button
                    onClick={handleShareReport}
                    className="w-full flex items-center justify-center gap-3 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-indigo-100 active:scale-[0.98] transition-all"
                >
                    <Share2 size={18} />
                    {copied ? 'Link Copied!' : 'Share Progress Report'}
                </button>
                <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {copied ? 'Paste it in WhatsApp or email for parents' : 'Send a read-only link to parents'}
                </p>
            </div>

            {/* Settings */}
            <section className="space-y-3">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-1">{t.settings}</h4>
                <div className="space-y-2">
                    {settingsRows.map((item) => (
                        <div key={item.key}>
                            <button
                                onClick={item.action}
                                className={`w-full flex items-center justify-between p-4 bg-white rounded-2xl border transition-colors active:scale-[0.98] ${expanded === item.key ? 'border-indigo-200 bg-indigo-50/30' : 'border-slate-100 hover:bg-slate-50'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`size-10 rounded-xl bg-slate-50 flex items-center justify-center ${item.color || 'text-slate-400'}`}>
                                        <item.icon size={20} />
                                    </div>
                                    <span className={`text-sm font-black uppercase tracking-tight ${item.color || 'text-slate-800'}`}>{item.label}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {item.val && (
                                        <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg uppercase tracking-widest">
                                            {item.val}
                                        </span>
                                    )}
                                    {item.expandContent && (
                                        <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${expanded === item.key ? 'rotate-180' : ''}`} />
                                    )}
                                </div>
                            </button>
                            {item.expandContent && expanded === item.key && item.expandContent}
                        </div>
                    ))}
                </div>
            </section>

        </div>
    );
};

export default ProfileView;
