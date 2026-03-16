import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Flame, Star, User, Home, BookOpen, BarChart3, ClipboardList, Sword, Brain, ArrowLeft, GraduationCap, Sparkles, Phone, CheckCircle2, Award, Timer, Rocket, Loader2 } from 'lucide-react';

import { translations } from './utils/translations';
import { avatars, topicsMap, timeCommitments, classes, exams } from './utils/constants';

import VidyaBot from './components/VidyaBot';
import RoadmapPreview from './components/RoadmapPreview';

import HomeView from './features/dashboard/HomeView';
import PracticeView from './features/practice/PracticeView';
import ArenaView from './features/dashboard/ArenaView';
import StudyPlanView from './features/practice/StudyPlanView';
import ConceptsView from './features/tutor/ConceptsView';
import ProgressView from './features/dashboard/ProgressView';
import ProfileView from './features/dashboard/ProfileView';

const AppContent = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [step, setStep] = useState('language');
  const [lang, setLang] = useState('en');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(avatars[0].id);
  const [selectedClass, setSelectedClass] = useState('Class 7');
  const [selectedExam, setSelectedExam] = useState('CBSE Mathematics');
  const [painPoint, setPainPoint] = useState('');
  const [practiceTime, setPracticeTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [userId, setUserId] = useState(localStorage.getItem('vidya_user_id') || '');
  const [activeSuggestion, setActiveSuggestion] = useState(null);

  // Persist state to localStorage on changes
  React.useEffect(() => {
    if (isLoggedIn) {
      const profile = { name, lang, selectedAvatar, selectedClass, selectedExam, userId };
      localStorage.setItem('vidya_profile', JSON.stringify(profile));
      localStorage.setItem('vidya_user_id', userId);
    }
  }, [isLoggedIn, name, lang, selectedAvatar, selectedClass, selectedExam, userId]);

  // Load profile from localStorage on boot
  React.useEffect(() => {
    const saved = localStorage.getItem('vidya_profile');
    if (saved) {
      const p = JSON.parse(saved);
      setName(p.name);
      setLang(p.lang);
      setSelectedAvatar(p.selectedAvatar);
      setSelectedClass(p.selectedClass);
      setSelectedExam(p.selectedExam || 'CBSE Mathematics');
      setUserId(p.userId);
      setIsLoggedIn(true);
    }
  }, []);

  const t = translations[lang] || translations['en'];
  const navigate = useNavigate();
  const location = useLocation();

  const handleSelectLanguage = (code) => { setLang(code); setStep('phone'); };
  const handleRequestOtp = (e) => { e.preventDefault(); if (phone.length < 10) return; setLoading(true); setTimeout(() => { setStep('otp'); setLoading(false); }, 1200); };
  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (otp.length < 4) return;
    setLoading(true);

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);

    setTimeout(async () => {
      setUserId(cleanPhone);

      try {
        const apiUrl = `https://vidya-backend-mn5g.onrender.com/profile/${cleanPhone}`;

        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`Server returned ${response.status}`);

        const data = await response.json();

        if (data.profile && data.profile.name) {
          setName(data.profile.name);
          const gradeVal = data.profile.grade;
          setSelectedClass(gradeVal?.toString().includes('Class') ? gradeVal : `Class ${gradeVal}`);
          setSelectedExam(data.profile.exam);
          setLang(data.profile.language || lang);
          setIsLoggedIn(true);
          navigate('/home');
        } else {
          setStep('profile');
        }
      } catch (err) {
        console.error("Profile fetch failed:", err);
        setStep('profile');
      } finally {
        setLoading(false);
      }
    }, 1000);
  };
  const handleProfileSubmit = (e) => { e.preventDefault(); if (!name.trim()) return; setStep('preferences'); };
  const handlePreferencesSubmit = (e) => { e.preventDefault(); setStep('interview_pain'); };
  const handlePainPoint = (id) => { setPainPoint(id); setStep('interview_time'); };
  const handleTimeCommitment = (item) => { setPracticeTime(item.val); setStep('interview_curating'); setLoading(true); setTimeout(() => { setLoading(false); }, 2500); };

  const handleStartLearning = async () => {
    setLoading(true);
    try {
      const cleanPhone = phone.trim();
      // Save profile to backend for Phase 21
      await fetch('https://vidya-backend-mn5g.onrender.com/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: cleanPhone,
          name: name,
          grade: parseInt(selectedClass.match(/\d+/)[0]),
          exam: selectedExam,
          language: lang
        })
      });
      setIsLoggedIn(true);
      navigate('/home');
    } catch (err) {
      console.error("Failed to save profile:", err);
      // Fallback: login anyway
      setIsLoggedIn(true);
      navigate('/home');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'otp') setStep('phone');
    else if (step === 'phone') setStep('language');
    else if (step === 'profile') setStep('otp');
    else if (step === 'preferences') setStep('profile');
    else if (step === 'interview_pain') setStep('preferences');
    else if (step === 'interview_time') setStep('interview_pain');
    else if (step === 'interview_curating') setStep('interview_time');
  };

  const toggleTask = (id) => {
    setCompletedTasks(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  };

  if (isLoggedIn) {
    const UserAvatarIcon = avatars.find(a => a.id === selectedAvatar)?.icon || User;

    // Helper to determine active tab for bottom nav based on route
    const getActiveTab = () => {
      const path = location.pathname;
      if (path.includes('practice')) return 'practice';
      if (path.includes('progress')) return 'progress';
      if (path.includes('plan')) return 'plan';
      if (path.includes('arena')) return 'arena';
      if (path.includes('concepts')) return 'concepts';
      if (path.includes('profile')) return 'profile';
      return 'home';
    };

    const activeTab = getActiveTab();

    return (
      <div className="flex-1 flex flex-col h-full bg-slate-50 relative overflow-hidden">
        <header className="pt-14 pb-4 px-6 flex items-center justify-between shrink-0 bg-white shadow-sm z-40">
          <div className="flex gap-2">
            <div className="flex items-center gap-1.5 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100">
              <Flame size={16} className="text-orange-500 fill-orange-500" />
              <span className="text-sm font-black text-orange-600 tracking-tighter">{t.streak}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-yellow-50 px-3 py-1.5 rounded-full border border-yellow-100">
              <Star size={16} className="text-yellow-500 fill-yellow-500" />
              <span className="text-sm font-black text-yellow-600 tracking-tighter">{t.xp}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div onClick={() => navigate('/profile')} className={`size-10 rounded-full flex items-center justify-center border-2 border-white shadow-sm transition-all active:scale-90 cursor-pointer ${avatars.find(a => a.id === selectedAvatar)?.color || 'bg-slate-200'} ${activeTab === 'profile' ? 'ring-4 ring-indigo-100 scale-110 shadow-lg' : ''}`}>
              <UserAvatarIcon size={20} />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-40 pt-6 px-6 relative hide-scrollbar">
          <Routes>
            <Route path="/home" element={<HomeView t={t} name={name} selectedExam={selectedExam} practiceTime={practiceTime} selectedClass={selectedClass} painPoint={painPoint} userId={userId} onStartSuggestion={(s) => { setActiveSuggestion(s); navigate('/practice'); }} />} />
            <Route path="/practice" element={<PracticeView t={t} selectedClass={selectedClass} userId={userId} lang={lang} activeSuggestion={activeSuggestion} onClearSuggestion={() => setActiveSuggestion(null)} />} />
            <Route path="/plan" element={<StudyPlanView t={t} selectedClass={selectedClass} completedTasks={completedTasks} toggleTask={toggleTask} userId={userId} />} />
            <Route path="/progress" element={<ProgressView t={t} selectedClass={selectedClass} userId={userId} />} />
            <Route path="/arena" element={<ArenaView t={t} userId={userId} />} />
            <Route path="/concepts" element={<ConceptsView t={t} selectedExam={selectedExam} selectedClass={selectedClass} lang={lang} userId={userId} onStartSuggestion={(s) => { setActiveSuggestion(s); navigate('/practice'); }} />} />
            <Route path="/profile" element={<ProfileView t={t} name={name} selectedClass={selectedClass} selectedExam={selectedExam} lang={lang} setLang={setLang} setIsLoggedIn={(val) => {
              setIsLoggedIn(val);
              if (!val) {
                localStorage.removeItem('vidya_profile');
                localStorage.removeItem('vidya_user_id');
                navigate('/');
              }
            }} selectedAvatar={selectedAvatar} userId={userId} />} />

            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </main>

        <nav className="absolute bottom-0 inset-x-0 bg-white/95 backdrop-blur-3xl border-t border-slate-100 flex items-center justify-around px-1 pb-10 pt-4 z-50 shadow-[0_-15px_40px_rgba(0,0,0,0.04)]">
          {[
            { id: 'home', path: '/home', icon: Home, label: t.navHome },
            { id: 'practice', path: '/practice', icon: BookOpen, label: t.navPractice },
            { id: 'progress', path: '/progress', icon: BarChart3, label: t.navProgress },
            { id: 'plan', path: '/plan', icon: ClipboardList, label: t.navPlan },
            { id: 'arena', path: '/arena', icon: Sword, label: t.navArena },
            { id: 'concepts', path: '/concepts', icon: Brain, label: t.navConcepts }
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button key={item.id} onClick={() => navigate(item.path)} className={`flex flex-col items-center gap-1 px-1 py-1.5 rounded-xl transition-all duration-300 ${isActive ? 'bg-indigo-50 text-indigo-600 shadow-sm ring-1 ring-indigo-100' : 'text-slate-400 active:scale-95'}`}>
                <div className={`${isActive ? 'scale-110' : 'scale-100'} transition-transform duration-300`}>
                  <Icon size={isActive ? 18 : 16} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`text-[6px] font-black uppercase tracking-tight leading-none ${isActive ? 'opacity-100' : 'opacity-60'}`}>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    );
  }

  // --- Onboarding Flow ---
  return (
    <div className="flex-1 flex flex-col h-full bg-white relative">
      <header className="pt-14 pb-4 px-6 flex items-center justify-center shrink-0 border-b border-gray-50 relative">
        {(step !== 'language' && step !== 'interview_curating') && (
          <button onClick={handleBack} className="absolute left-6 text-slate-400 hover:text-slate-900 transition-colors z-50"><ArrowLeft size={20} strokeWidth={2.5} /></button>
        )}
        <h1 className="text-sm font-black tracking-[0.2em] text-slate-900 uppercase">Vidya AI</h1>
      </header>
      <main className="flex-1 px-8 flex flex-col pt-8 overflow-y-auto hide-scrollbar">
        {step === 'language' ? (
          <div className="flex-1 flex flex-col items-center animate-in fade-in duration-500">
            <div className="mb-10 text-center">
              <div className="w-16 h-16 bg-yellow-400 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-yellow-100 mx-auto"><GraduationCap size={32} strokeWidth={2.5} color="white" /></div>
              <h2 className="text-2xl font-black text-slate-900 mb-1">{t.choose}</h2>
              <p className="text-sm text-slate-400 font-bold italic">{t.subChoose}</p>
            </div>
            <div className="w-full space-y-4">
              {[{ id: 'en', label: 'English', sub: 'Learn in English' }, { id: 'hi', label: 'Hindi (हिन्दी)', sub: 'हिन्दी में सीखें' }, { id: 'hinglish', label: 'Hinglish', sub: 'Mix of Hindi & English' }].map((l) => (
                <button key={l.id} onClick={() => handleSelectLanguage(l.id)} className={`w-full p-5 border-2 rounded-3xl flex items-center justify-between transition-all active:scale-95 ${lang === l.id ? 'border-indigo-600 bg-indigo-50/30 shadow-md' : 'border-gray-100 hover:border-indigo-400'}`}>
                  <div className="text-left"><div className="font-black text-slate-900 uppercase tracking-wider text-sm">{l.label}</div><div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{l.sub}</div></div>
                  <div className={`size-8 rounded-xl flex items-center justify-center transition-colors ${lang === l.id ? 'bg-indigo-600 text-white' : 'bg-gray-50 text-gray-300'}`}><Sparkles size={16} /></div>
                </button>
              ))}
            </div>
          </div>
        ) : step === 'phone' || step === 'otp' ? (
          <div className="flex-1 flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-100"><GraduationCap size={32} strokeWidth={2.5} color="white" /></div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">{step === 'phone' ? t.welcome : t.verifyAccount}</h2>
            <p className="text-sm text-slate-400 font-bold mb-8">{step === 'phone' ? `${t.ready} ${lang === 'en' ? 'English' : 'हिन्दी'}?` : `${t.sentTo} +91 ${phone}`}</p>
            <form onSubmit={step === 'phone' ? handleRequestOtp : handleVerifyOtp} className="w-full space-y-4">
              {step === 'phone' ? (
                <div className="relative self-stretch">
                  <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t.enterPhone} className="w-full pl-6 pr-14 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-slate-900 placeholder-gray-400 font-bold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-sm" />
                  <Phone className="w-5 h-5 text-gray-300 absolute right-4 top-1/2 -translate-y-1/2" />
                </div>
              ) : (
                <div className="flex justify-center gap-3">
                  {[...Array(4)].map((_, i) => (
                    <input key={i} type="text" maxLength="1" value={otp[i] || ''} onChange={(e) => { const newOtp = otp.split(''); newOtp[i] = e.target.value; setOtp(newOtp.join('')); }} className="size-14 bg-gray-50 border-2 border-gray-100 rounded-xl text-center text-xl font-black text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-sm" />
                  ))}
                </div>
              )}
              <button disabled={loading} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-200 text-white font-black rounded-2xl shadow-xl transition-all active:scale-[0.98] uppercase tracking-widest text-sm flex items-center justify-center">
                {loading ? <Loader2 className="animate-spin" /> : (step === 'phone' ? t.requestOtp : t.verifyBtn)}
              </button>
            </form>
          </div>
        ) : step === 'profile' ? (
          <div className="flex-1 flex flex-col items-center animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="mb-8 text-center"><h2 className="text-2xl font-black text-slate-900 mb-1">{t.setupProfile}</h2><p className="text-sm text-slate-400 font-bold">{t.pickAvatar}</p></div>
            <div className="grid grid-cols-3 gap-4 mb-10 w-full px-4">
              {avatars.map((a) => (
                <button key={a.id} onClick={() => setSelectedAvatar(a.id)} className={`aspect-square rounded-3xl flex items-center justify-center transition-all ${selectedAvatar === a.id ? `${a.color} ring-4 ring-indigo-100 scale-105 shadow-xl` : 'bg-slate-50 text-slate-300 hover:bg-slate-100'}`}>
                  <a.icon size={32} />
                </button>
              ))}
            </div>
            <form onSubmit={handleProfileSubmit} className="w-full space-y-6">
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder={t.enterName} className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-slate-900 placeholder-gray-400 font-bold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-sm" />
              <button className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl transition-all active:scale-[0.98] uppercase tracking-widest text-sm">{t.continue}</button>
            </form>
          </div>
        ) : step === 'preferences' ? (
          <div className="flex-1 flex flex-col items-center animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="mb-8 text-center"><h2 className="text-2xl font-black text-slate-900 mb-1">{t.yourPreferences}</h2><p className="text-sm text-slate-400 font-bold">{t.selectClass}</p></div>
            <div className="w-full space-y-3 mb-8">
              {classes.map((c) => (
                <button key={c} onClick={() => setSelectedClass(c)} className={`w-full p-4 border-2 rounded-2xl flex items-center justify-between transition-all ${selectedClass === c ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 shadow-sm' : 'border-gray-100 text-slate-500 hover:border-indigo-200'}`}>
                  <span className="font-black uppercase tracking-tight text-sm">{c}</span>
                  {selectedClass === c && <CheckCircle2 size={18} />}
                </button>
              ))}
            </div>
            <div className="w-full mb-10">
              <p className="text-sm text-slate-400 font-bold mb-4 text-center">{t.selectExam}</p>
              <div className="grid grid-cols-2 gap-3">
                {exams.map((e) => (
                  <button key={e} onClick={() => setSelectedExam(e)} className={`p-4 border-2 rounded-2xl flex flex-col items-center gap-2 transition-all ${selectedExam === e ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 shadow-sm' : 'border-gray-100 text-slate-500 hover:border-indigo-200'}`}>
                    <Award size={20} />
                    <span className="font-black uppercase tracking-tighter text-[10px] text-center leading-none">{e}</span>
                  </button>
                ))}
              </div>
            </div>
            <button onClick={handlePreferencesSubmit} className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl transition-all active:scale-[0.98] uppercase tracking-widest text-sm mt-auto mb-6">{t.continue}</button>
          </div>
        ) : step.startsWith('interview') ? (
          <div className="flex-1 flex flex-col items-center justify-start animate-in fade-in slide-in-from-bottom-8 duration-700 pt-6">
            <VidyaBot isLoading={loading} message={step === 'interview_pain' ? t.painQuestion : step === 'interview_time' ? t.timeQuestion : loading ? t.curating : t.curatedResult.replace('{time}', practiceTime).replace('{topic}', t[painPoint])} />
            <div className="w-full space-y-4 px-4 overflow-y-auto max-h-[420px] hide-scrollbar pb-10 flex flex-col items-center">
              {step === 'interview_pain' ? (
                (topicsMap[selectedClass] || topicsMap['Class 6']).map((p) => (
                  <button key={p.id} onClick={() => handlePainPoint(p.id)} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl flex items-center gap-4 hover:border-indigo-500 hover:bg-indigo-50 transition-all active:scale-95 group">
                    <div className="size-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors"><p.icon size={20} /></div>
                    <span className="text-sm font-black text-slate-800 uppercase tracking-tight">{t[p.label]}</span>
                  </button>
                ))
              ) : step === 'interview_time' ? (
                timeCommitments.map((tc) => (
                  <button key={tc.id} onClick={() => handleTimeCommitment(tc)} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl flex items-center gap-4 hover:border-indigo-500 hover:bg-indigo-50 transition-all active:scale-95 group">
                    <div className="size-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors"><Timer size={20} /></div>
                    <span className="text-sm font-black text-slate-800 uppercase tracking-tight">{tc.label}</span>
                  </button>
                ))
              ) : !loading && (
                <div className="w-full flex flex-col gap-6 animate-in zoom-in duration-500">
                  <RoadmapPreview selectedClass={selectedClass} t={t} painPoint={painPoint} />
                  <button onClick={handleStartLearning} className="w-full py-5 bg-indigo-600 text-white font-black rounded-3xl shadow-xl uppercase tracking-[0.2em] flex items-center justify-center gap-3 active:scale-95 transition-all">{t.startLearning} <Rocket size={20} /></button>
                </div>
              )}
              {loading && step === 'interview_curating' && (
                <div className="flex flex-col items-center gap-6 mt-12">
                  <div className="flex gap-2"><div className="size-4 bg-indigo-600 rounded-full animate-bounce"></div><div className="size-4 bg-indigo-600 rounded-full animate-bounce delay-100"></div><div className="size-4 bg-indigo-600 rounded-full animate-bounce delay-200"></div></div>
                  <div className="w-48 h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-indigo-600 animate-[loading_2.5s_ease-in-out_infinite]"></div></div>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </main>
      <style jsx="true">{` .hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; } @keyframes loading { 0% { width: 0; } 100% { width: 100%; } } `}</style>
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
