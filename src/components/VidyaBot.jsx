import React from 'react';

const VidyaBot = ({ message, isLoading }) => {
    return (
        <div className="flex flex-col items-center justify-center w-full px-4 mb-4 shrink-0">
            <div className="relative w-32 h-32 mb-6 flex items-center justify-center animate-[float_4s_ease-in-out_infinite]">
                <div className="absolute inset-0 bg-yellow-400 blur-3xl opacity-20 animate-pulse"></div>
                <div className="relative z-10 w-24 h-24 flex flex-col items-center">
                    <div className="w-20 h-20 bg-white border-[4px] border-slate-900 rounded-[24px] overflow-hidden relative shadow-xl z-20 transition-transform animate-[breathe_3s_ease-in-out_infinite]">
                        <div className="absolute top-6 left-0 right-0 flex justify-center gap-4">
                            <div className="w-3 h-3 bg-indigo-600 rounded-full relative overflow-hidden">
                                <div className="absolute inset-x-0 h-full bg-slate-900 origin-top animate-[blink_5s_infinite]"></div>
                            </div>
                            <div className="w-3 h-3 bg-indigo-600 rounded-full relative overflow-hidden">
                                <div className="absolute inset-x-0 h-full bg-slate-900 origin-top animate-[blink_5s_infinite]"></div>
                            </div>
                        </div>
                        <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 w-6 h-1 bg-slate-200 rounded-full border-b border-white ${isLoading ? 'animate-pulse' : ''}`}></div>
                        <div className="absolute -top-1 left-4 w-1 h-3 bg-slate-900 rounded-full"></div>
                        <div className="absolute -top-1 right-4 w-1 h-3 bg-slate-900 rounded-full"></div>
                    </div>
                    <div className="w-4 h-4 bg-slate-900 -mt-2 relative z-10 rounded-b-lg"></div>
                    <div className="w-16 h-12 bg-yellow-400 border-[4px] border-slate-900 rounded-[20px] -mt-2 shadow-lg relative overflow-hidden">
                        <div className="absolute inset-x-0 top-0 h-2 bg-white/20"></div>
                    </div>
                </div>
            </div>
            <div className="relative w-full">
                <div className="bg-white border-2 border-slate-100 rounded-[24px] p-5 shadow-xl relative animate-in slide-in-from-top-4 duration-500">
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-t-2 border-l-2 border-slate-100 rotate-45 transform"></div>
                    <p className="text-base font-black text-slate-900 text-center leading-tight relative">
                        {message}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default VidyaBot;
