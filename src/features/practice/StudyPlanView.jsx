import React from 'react';
import { RefreshCw, Calendar, CheckCircle2 } from 'lucide-react';
import { topicsMap } from '../../utils/constants';

const StudyPlanView = ({ t, selectedClass, completedTasks, toggleTask }) => {
    const topics = topicsMap[selectedClass] || topicsMap['Class 6'];
    const days = [
        { id: 'mon', day: t.monday, sub: t[topics[0].label], task: t.tasks.practice.replace('{n}', '10') },
        { id: 'tue', day: t.tuesday, sub: t[topics[1].label], task: t.tasks.revise.replace('{topic}', t[topics[1].label]) },
        { id: 'wed', day: t.wednesday, sub: 'English', task: t.tasks.read },
        { id: 'thu', day: t.thursday, sub: 'Reasoning', task: t.tasks.practice.replace('{n}', '15') },
        { id: 'fri', day: t.friday, sub: 'Mock Test', task: t.tasks.test },
    ];
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
            <div className="flex items-center justify-between">
                <div> <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">{t.studyPlan}</h2> <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{t.studySub}</p> </div>
                <button className="p-3 bg-white border border-slate-100 rounded-2xl text-indigo-600 shadow-sm active:rotate-180 transition-transform duration-500"> <RefreshCw size={20} /> </button>
            </div>
            <div className="bg-indigo-600/5 p-4 rounded-3xl border border-indigo-100 flex items-center gap-4">
                <div className="size-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100"><Calendar size={20} strokeWidth={2.5} /></div>
                <div className="flex-1"> <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Current Period</div> <div className="text-sm font-black text-slate-900 uppercase tracking-tight">May 27 - June 2</div> </div>
                <button className="bg-indigo-600 text-white px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all">{t.regenerate.split(' ')[0]}</button>
            </div>
            <div className="space-y-3">
                {days.map((d, i) => {
                    const isDone = completedTasks.includes(d.id);
                    return (<div key={d.id} onClick={() => toggleTask(d.id)} className={`group relative p-5 rounded-[24px] border-2 transition-all cursor-pointer ${isDone ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-100 scale-[0.98]' : 'bg-white border-slate-50 hover:border-indigo-100 shadow-sm'}`} > <div className="flex items-start gap-4"> <div className={`mt-0.5 size-6 rounded-lg border-2 flex items-center justify-center transition-colors ${isDone ? 'bg-white border-white text-indigo-600' : 'bg-slate-50 border-slate-100 text-transparent group-hover:border-indigo-200'}`}> <CheckCircle2 size={16} strokeWidth={3} /> </div> <div className="flex-1"> <div className="flex items-center justify-between mb-1"> <span className={`text-[10px] font-black uppercase tracking-widest ${isDone ? 'text-indigo-100' : 'text-slate-400 group-hover:text-indigo-600'}`}>{d.day}</span> <span className={`text-[11px] font-black ${isDone ? 'text-white' : 'text-indigo-600'}`}>{d.sub}</span> </div> <p className={`text-sm font-bold leading-tight ${isDone ? 'text-white/90 line-through opacity-80' : 'text-slate-700'}`}>{d.task}</p> </div> </div> </div>);
                })}
            </div>
        </div>
    );
};

export default StudyPlanView;
