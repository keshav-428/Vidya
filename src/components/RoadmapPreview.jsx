import React from 'react';
import { topicsMap } from '../utils/constants';

const RoadmapPreview = ({ selectedClass, t, painPoint }) => {
    const topics = topicsMap[selectedClass] || topicsMap['Class 6'];
    return (
        <div className="w-full space-y-4 my-2 px-2 animate-in fade-in zoom-in slide-in-from-bottom-4 duration-1000">
            <div className="flex items-center gap-3">
                <div className="h-[1px] flex-1 bg-slate-100"></div>
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">{t.roadmap}</span>
                <div className="h-[1px] flex-1 bg-slate-100"></div>
            </div>
            <div className="space-y-2">
                {topics.slice(0, 3).map((topic, i) => (
                    <div key={topic.id} className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-50 shadow-sm animate-in slide-in-from-left-4" style={{ animationDelay: `${(i + 1) * 200}ms` }}>
                        <div className={`size-8 rounded-xl flex items-center justify-center ${i === 0 ? 'bg-indigo-50 text-indigo-600 ring-2 ring-indigo-100' : 'bg-slate-50 text-slate-400'}`}> <topic.icon size={16} /> </div>
                        <div className="flex-1"> <div className="flex items-center justify-between"> <span className={`text-[11px] font-black uppercase tracking-tight ${i === 0 ? 'text-slate-900' : 'text-slate-400'}`}> {t[topic.label]} </span> {i === 0 && <span className="text-[8px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-full ring-1 ring-indigo-100">{t.week1}</span>} </div> </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RoadmapPreview;
