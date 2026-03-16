import React from 'react';
import { Sword, Star } from 'lucide-react';

const ArenaView = ({ t }) => {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
            <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">{t.navArena} ⚔️</h2>
                <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">{t.competitive}</p>
            </div>
            <div className="bg-slate-900 rounded-[32px] p-6 shadow-2xl relative overflow-hidden text-white text-center">
                <div className="absolute top-0 right-0 p-4 opacity-10"><Sword size={120} /></div>
                <div className="relative z-10">
                    <span className="inline-block px-3 py-1 bg-indigo-500 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">{t.mockExam}</span>
                    <div className="flex justify-center items-end gap-3 mb-6"> <div className="text-4xl font-black tracking-tighter">02:45:12</div> <span className="text-[10px] font-bold text-slate-400 mb-1">REMAINING</span> </div>
                    <button className="w-full py-4 bg-white text-slate-900 font-black rounded-2xl text-sm uppercase tracking-[0.2em] active:scale-95 transition-all">{t.joinArena}</button>
                </div>
            </div>
            <section className="space-y-4">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-1">{t.leaderboard}</h4>
                <div className="bg-white rounded-[24px] border border-slate-100 overflow-hidden">
                    {[{ id: 1, name: 'Arjun S.', xp: 2450, color: 'bg-purple-100' }, { id: 2, name: 'Priya K.', xp: 2320, color: 'bg-orange-100' }, { id: 3, name: 'Kishan (You)', xp: 2120, color: 'bg-indigo-100' },].map((user, i) => (
                        <div key={user.id} className={`flex items-center gap-4 p-4 ${i !== 2 ? 'border-b border-slate-50' : 'bg-indigo-50/30'}`}> <span className="text-sm font-black text-slate-400 w-4">{i + 1}</span> <div className={`size-10 rounded-xl ${user.color} flex items-center justify-center`}><div className="w-5 h-5 bg-black/10 rounded-full"></div></div> <div className="flex-1 font-black text-slate-900 text-sm">{user.name}</div> <div className="flex items-center gap-1.5"> <Star size={14} className="text-yellow-500 fill-yellow-500" /> <span className="text-sm font-black text-slate-900 tracking-tight">{user.xp}</span> </div> </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default ArenaView;
