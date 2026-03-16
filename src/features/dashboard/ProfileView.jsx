import React from 'react';
import { Flame, Medal, Globe, Bell, User, LogOut } from 'lucide-react';
import { avatars } from '../../utils/constants';

const ProfileView = ({ t, name, selectedClass, selectedExam, lang, setLang, setIsLoggedIn, selectedAvatar, userId }) => {
    const UserAvatarIcon = avatars.find(a => a.id === selectedAvatar)?.icon || User;
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
            <div className="flex flex-col items-center">
                <div className={`size - 24 rounded - [32px] ${avatars.find(a => a.id === selectedAvatar)?.color || 'bg-slate-100'} flex items - center justify - center border - 4 border - white shadow - xl mb - 4 animate - [breathe_4s_infinite]`}> <UserAvatarIcon size={48} /> </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{name}</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">{selectedClass} • {selectedExam}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm text-center"> <Flame size={24} className="text-orange-500 mx-auto mb-2" /> <div className="text-xl font-black text-slate-900 tracking-tighter">3</div> <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.daysStreak}</div> </div>
                <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm text-center"> <Medal size={24} className="text-yellow-500 mx-auto mb-2" /> <div className="text-xl font-black text-slate-900 tracking-tighter">1200</div> <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total XP</div> </div>
            </div>
            <section className="space-y-3">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-1">{t.settings}</h4>
                <div className="space-y-2">
                    {[{
                        icon: Globe,
                        label: t.language,
                        val: lang === 'en' ? 'English' : lang === 'hi' ? 'हिन्दी' : 'Hinglish',
                        action: () => {
                            const nextLang = lang === 'en' ? 'hi' : lang === 'hi' ? 'hinglish' : 'en';
                            setLang(nextLang);
                            // Example of using userId in a hypothetical fetch call
                            // fetch('/api/update-language', {
                            //     method: 'POST',
                            //     headers: { 'Content-Type': 'application/json' },
                            //     body: JSON.stringify({
                            //         user_id: userId || "test_user_123", // Using userId here
                            //         language: nextLang
                            //     })
                            // });
                        }
                    }, { icon: Bell, label: t.notifications, val: 'On' }, { icon: User, label: 'Avatar', action: () => { } }, { icon: LogOut, label: t.logout, color: 'text-red-500', action: () => setIsLoggedIn(false) },].map((item, i) => (
                        <button key={i} onClick={item.action} className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-50 hover:bg-slate-50 transition-colors active:scale-95" > <div className="flex items-center gap-4"> <div className={`size - 10 rounded - xl bg - slate - 50 flex items - center justify - center ${item.color || 'text-slate-400'} `}><item.icon size={20} /></div> <span className="text-sm font-black text-slate-800 uppercase tracking-tight">{item.label}</span> </div> {item.val && <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg uppercase tracking-widest">{item.val}</span>} </button>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default ProfileView;
