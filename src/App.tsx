import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Keyboard, 
  CheckCircle2, 
  CheckCircle,
  AlertCircle, 
  ChevronRight, 
  ChevronLeft, 
  Send, 
  User, 
  MessageCircle, 
  Lock,
  LayoutDashboard,
  LogOut,
  Clock,
  Check,
  X,
  Eye,
  Play,
  Inbox,
  Phone,
  FileText,
  ClipboardList,
  ShieldCheck,
  Zap,
  Headphones,
  Hash,
  Info
} from 'lucide-react';
import { TYPING_TASKS } from './data/tasks';
import { Submission, UserInfo, TaskSubmission, SubmissionStatus } from './types';

// --- Components ---

const WhatsAppButton = () => (
  <a 
    href="https://wa.me/your_number" 
    target="_blank" 
    rel="noopener noreferrer"
    className="fixed bottom-6 right-6 bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 transition-colors z-50 flex items-center gap-2"
  >
    <MessageCircle size={24} />
    <span className="hidden md:inline font-medium">WhatsApp Support</span>
  </a>
);

export default function App() {
  const [view, setView] = useState<'landing' | 'uid' | 'form' | 'dashboard' | 'typing' | 'submitted' | 'admin-login' | 'admin-dashboard'>('landing');
  const [showFormFillMessage, setShowFormFillMessage] = useState(false);
  const [uid, setUid] = useState('');
  const [userInfo, setUserInfo] = useState<UserInfo>({ fullName: '', whatsappNumber: '', uid: '' });
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [taskAnswers, setTaskAnswers] = useState<Record<number, string>>({});
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [adminToken, setAdminToken] = useState<string | null>(null);
  
  const [isBlurred, setIsBlurred] = useState(false);
  
  // Timer states
  const [timeLeft, setTimeLeft] = useState(1200); // 20 minutes in seconds
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [hasStartedTask, setHasStartedTask] = useState<Record<number, boolean>>({});

  // Auto-save progress to local storage
  useEffect(() => {
    const handleBlur = () => setIsBlurred(true);
    const handleFocus = () => setIsBlurred(false);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('typing_progress');
    if (saved) {
      const { uid: savedUid, userInfo: savedInfo, answers, view: savedView, index, startedTasks } = JSON.parse(saved);
      setUid(savedUid);
      setUserInfo(savedInfo);
      setTaskAnswers(answers);
      setView(savedView);
      setCurrentTaskIndex(index);
      if (startedTasks) setHasStartedTask(startedTasks);
    }
  }, []);

  useEffect(() => {
    if (view !== 'landing' && view !== 'submitted' && view !== 'admin-login' && view !== 'admin-dashboard') {
      localStorage.setItem('typing_progress', JSON.stringify({
        uid,
        userInfo,
        answers: taskAnswers,
        view,
        index: currentTaskIndex,
        startedTasks: hasStartedTask
      }));
    }
  }, [uid, userInfo, taskAnswers, view, currentTaskIndex, hasStartedTask]);

  // Timer logic
  useEffect(() => {
    // Prevent right click
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    document.addEventListener('contextmenu', handleContextMenu);
    
    // Prevent common screenshot shortcuts (limited)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen' || (e.ctrlKey && e.shiftKey && e.key === 'S') || (e.metaKey && e.shiftKey && e.key === '4')) {
        e.preventDefault();
        alert('Screenshots are not allowed on this platform.');
      }
      // Prevent copy/paste shortcuts
      if (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'x')) {
        e.preventDefault();
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    // Add CSS to prevent selection
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.userSelect = 'auto';
      document.body.style.webkitUserSelect = 'auto';
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('typing_progress');
    window.location.reload();
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsTimerActive(false);
      alert('সময় শেষ! পরবর্তী টাস্কে যান।');
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timeLeft]);

  const startTask = () => {
    setIsTimerActive(true);
    setTimeLeft(1200);
    setHasStartedTask(prev => ({ ...prev, [TYPING_TASKS[currentTaskIndex].id]: true }));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVerifyUid = async () => {
    setError('');
    if (uid.trim().length >= 4) {
      setIsVerifying(true);
      // Simulate a small delay for professional feel
      await new Promise(resolve => setTimeout(resolve, 800));
      setUserInfo(prev => ({ ...prev, uid: uid }));
      setView('form');
      setIsVerifying(false);
    } else {
      setError('সঠিক স্টুডেন্ট আইডি দিন (কমপক্ষে ৪ সংখ্যা)।');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInfo.fullName || !userInfo.whatsappNumber) {
      setError('অনুগ্রহ করে সব তথ্য পূরণ করুন।');
      return;
    }

    setError('');
    setIsSaving(true);
    
    // Simulate a small delay for professional feel
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Proceed directly to dashboard to ensure "login" always works
    setView('dashboard');
    setIsSaving(false);
    
    // Optional: still notify server but don't block
    try {
      fetch('/api/check-limit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whatsappNumber: userInfo.whatsappNumber })
      });
    } catch (err) {
      console.error('Check limit error:', err);
    }
  };

  const handleFinalSubmit = async () => {
    // Check if all tasks are completed
    const completedCount = Object.keys(taskAnswers).length;
    if (completedCount < 10) {
      setError(`Please complete all 10 tasks. You have completed ${completedCount}/10.`);
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      const submission: Submission = {
        id: '',
        userInfo,
        tasks: Object.entries(taskAnswers).map(([id, content]) => ({ taskId: parseInt(id), content: content as string })),
        status: 'Pending',
        submittedAt: new Date().toISOString()
      };

      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submission)
      });

      if (res.ok) {
        localStorage.removeItem('typing_progress');
        setView('submitted');
      } else {
        const data = await res.json();
        setError(data.message || 'Submission failed.');
      }
    } catch (err) {
      setError('Failed to submit. Check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Views ---

  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 selection:bg-indigo-100 relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-100/40 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-100/40 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 max-w-2xl w-full text-center space-y-16">
          <header className="space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-[0.2em] shadow-sm"
            >
              <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
              Professional E-Learning Platform
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-7xl md:text-8xl font-black text-slate-900 tracking-tighter leading-[0.85]"
            >
              Unity <span className="text-indigo-600">Earning</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-slate-500 font-bold text-xl md:text-2xl tracking-tight"
            >
              Premium Typing Work & Skill Development
            </motion.p>
          </header>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.05)] p-12 border border-slate-100 relative overflow-hidden group"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600" />
            
            <div className="bg-slate-50 text-slate-700 px-8 py-6 rounded-3xl text-sm font-black mb-12 border border-slate-100 leading-relaxed text-center shadow-inner">
              টাইপিং টাস্ক সাবমিট করার পর আপনার স্টুডেন্ট একাউন্টে অটোমেটিকলি টাকা যোগ হয়ে যাবে
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <button 
                onClick={() => setView('uid')}
                className="w-full bg-indigo-600 text-white font-black py-6 rounded-2xl hover:bg-indigo-700 transition-all flex flex-col items-center justify-center gap-3 shadow-2xl shadow-indigo-100 group/btn"
              >
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center group-hover/btn:scale-110 transition-transform">
                  <Keyboard size={24} />
                </div>
                <span className="text-lg">Start Typing Work</span>
              </button>
              
              <button 
                onClick={() => setView('admin-login')}
                className="w-full bg-slate-900 text-white font-black py-6 rounded-2xl hover:bg-slate-800 transition-all flex flex-col items-center justify-center gap-3 shadow-2xl shadow-slate-200 group/btn"
              >
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center group-hover/btn:scale-110 transition-transform">
                  <Lock size={24} />
                </div>
                <span className="text-lg">মেন্টর Dashboard</span>
              </button>
            </div>
          </motion.div>
          
          <footer className="pt-12 border-t border-slate-200 flex flex-col items-center gap-6">
            <div className="flex flex-wrap justify-center gap-x-10 gap-y-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-indigo-600" />
                Secure Platform
              </div>
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-emerald-500" />
                Real-time Earnings
              </div>
              <div className="flex items-center gap-2">
                <Headphones size={14} className="text-indigo-600" />
                24/7 Support
              </div>
            </div>
            <p className="text-[9px] text-slate-300 font-black uppercase tracking-[0.4em]">Powered by Unity Earning Platform</p>
          </footer>
        </div>
      </div>
    );
  }

  if (view === 'uid') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-100/30 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-amber-100/30 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-xl w-full space-y-10 relative z-10">
          <div className="text-center space-y-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center mx-auto text-indigo-600 mb-6"
            >
              <ShieldCheck size={40} />
            </motion.div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Identity Verification</h2>
            <p className="text-slate-500 font-bold text-lg">আপনার স্টুডেন্ট আইডি দিয়ে ভেরিফাই করুন</p>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.05)] p-12 border border-slate-100 relative overflow-hidden"
          >
            <button 
              onClick={() => setView('landing')} 
              className="absolute top-8 left-8 text-slate-400 hover:text-indigo-600 flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-colors"
            >
              <ChevronLeft size={16} /> Back
            </button>
            
            <div className="space-y-10 pt-6">
              <div className="bg-amber-50/50 border border-amber-100 p-8 rounded-3xl space-y-4 shadow-inner">
                <h4 className="text-xs font-black text-amber-700 uppercase tracking-[0.2em] flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  কাজের নিয়মাবলী (Rules)
                </h4>
                <ul className="text-sm text-slate-700 space-y-3 font-bold leading-relaxed">
                  <li className="flex gap-3">
                    <CheckCircle2 size={18} className="text-amber-500 shrink-0" />
                    নিজের হাতে টাইপ করে সাবমিট করতে হবে।
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle2 size={18} className="text-amber-500 shrink-0" />
                    কপি-পেস্ট করার কোনো অপশন নেই।
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle2 size={18} className="text-amber-500 shrink-0" />
                    প্রতিটি টাস্কের জন্য ২০ মিনিট সময় পাবেন।
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle2 size={18} className="text-amber-500 shrink-0" />
                    ভুল টাইপ করলে পেমেন্ট রিজেক্ট হতে পারে।
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Student UID</label>
                <div className="relative group">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                    <Hash size={24} />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Enter your 6-digit UID"
                    value={uid}
                    onChange={(e) => setUid(e.target.value)}
                    className="w-full pl-16 pr-8 py-6 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none font-black text-slate-800 transition-all placeholder:text-slate-300 text-xl tracking-widest"
                  />
                </div>
              </div>
              
              {error && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-4 text-red-600 text-sm bg-red-50 p-6 rounded-2xl font-bold border border-red-100"
                >
                  <AlertCircle size={20} className="shrink-0" />
                  {error}
                </motion.div>
              )}
              
              <button 
                onClick={handleVerifyUid}
                disabled={uid.trim().length < 4 || isVerifying}
                className="w-full bg-indigo-600 text-white font-black py-6 rounded-2xl hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl shadow-indigo-100 text-xl flex items-center justify-center gap-3 group"
              >
                {isVerifying ? (
                  <>
                    <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    Verify & Continue
                    <ChevronRight className="group-hover:translate-x-1 transition-transform" size={24} />
                  </>
                )}
              </button>
            </div>
          </motion.div>
          
          <p className="text-center text-slate-400 font-bold text-xs">
            Don't have a UID? Contact your mentor.
          </p>
        </div>
      </div>
    );
  }

  if (view === 'form') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 md:p-12 relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-100/30 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-100/30 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-xl w-full relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.05)] p-12 border border-slate-100 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600" />
            
            <div className="flex flex-col items-center text-center mb-12">
              <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
                <User size={40} />
              </div>
              <h2 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">Complete Profile</h2>
              <p className="text-slate-500 font-bold text-lg leading-relaxed">Please provide your details to access the dashboard and start working.</p>
            </div>
            
            <form onSubmit={handleFormSubmit} className="space-y-10">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Full Name</label>
                <div className="relative group">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                    <User size={24} />
                  </div>
                  <input 
                    type="text" 
                    required
                    placeholder="Enter your full name"
                    value={userInfo.fullName}
                    onChange={(e) => setUserInfo(prev => ({ ...prev, fullName: e.target.value }))}
                    className="w-full pl-16 pr-8 py-6 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none font-black text-slate-800 transition-all placeholder:text-slate-300 text-lg"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">WhatsApp Number</label>
                <div className="relative group">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                    <MessageCircle size={24} />
                  </div>
                  <input 
                    type="tel" 
                    required
                    placeholder="01XXXXXXXXX"
                    value={userInfo.whatsappNumber}
                    onChange={(e) => setUserInfo(prev => ({ ...prev, whatsappNumber: e.target.value }))}
                    className="w-full pl-16 pr-8 py-6 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-8 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none font-black text-slate-800 transition-all placeholder:text-slate-300 text-lg"
                  />
                </div>
              </div>
              
              <div className="pt-4 space-y-4">
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="w-full bg-indigo-600 text-white font-black py-6 rounded-2xl hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-100 text-xl flex items-center justify-center gap-3 group"
                >
                  {isSaving ? (
                    <>
                      <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving Profile...
                    </>
                  ) : (
                    <>
                      Save & Access Dashboard
                      <ChevronRight className="group-hover:translate-x-1 transition-transform" size={24} />
                    </>
                  )}
                </button>
                
                <button 
                  type="button"
                  onClick={handleLogout}
                  className="w-full bg-white text-slate-400 font-black py-4 rounded-2xl hover:bg-red-50 hover:text-red-600 transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <LogOut size={16} />
                  Cancel & Logout
                </button>
              </div>
            </form>
          </motion.div>
          
          <div className="mt-10 flex items-center justify-center gap-3 text-slate-400 font-bold text-xs">
            <ShieldCheck size={16} className="text-indigo-600" />
            Your data is encrypted and secure
          </div>
        </div>
      </div>
    );
  }

  if (view === 'dashboard') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center p-6 md:p-12">
        <header className="max-w-6xl w-full flex flex-col md:flex-row justify-between items-center gap-8 mb-20 relative z-10">
          <div className="flex flex-col items-center md:items-start">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                <LayoutDashboard size={20} />
              </div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">Student Dashboard</h1>
            </div>
            <p className="text-slate-500 font-bold text-lg">Welcome back, <span className="text-indigo-600">{userInfo.fullName}</span></p>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="bg-white px-6 py-4 rounded-3xl border border-slate-100 flex items-center gap-4 shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
                <Hash size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-2">Student ID</p>
                <p className="text-xl font-black text-slate-900 leading-none">{userInfo.uid}</p>
              </div>
            </div>
            
            <button 
              onClick={handleLogout}
              className="bg-white border border-slate-100 p-4 rounded-2xl text-slate-400 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all shadow-[0_10px_30px_rgba(0,0,0,0.03)] group"
              title="Logout"
            >
              <LogOut size={24} className="group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </header>

        <div className="max-w-6xl w-full grid md:grid-cols-2 gap-10 relative z-10">
          {/* Typing Job Card */}
          <motion.div 
            whileHover={{ y: -10, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="bg-white rounded-[3rem] shadow-[0_40px_80px_rgba(0,0,0,0.04)] p-12 border border-slate-100 flex flex-col items-center text-center group cursor-pointer relative overflow-hidden"
            onClick={() => setView('typing')}
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600" />
            <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center mb-10 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-inner">
              <Keyboard size={48} />
            </div>
            <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Typing Tasks</h3>
            <p className="text-slate-500 font-bold text-lg mb-10 leading-relaxed">Complete typing tasks to earn rewards. Accuracy and speed matter.</p>
            
            <div className="w-full bg-slate-50 rounded-3xl p-6 border border-slate-100 flex justify-between items-center group-hover:bg-indigo-50/50 transition-colors">
              <div className="text-left">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Current Progress</p>
                <p className="text-lg font-black text-slate-900">{Object.keys(taskAnswers).length}/10 Tasks Completed</p>
              </div>
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm group-hover:translate-x-1 transition-transform">
                <ChevronRight size={24} />
              </div>
            </div>
          </motion.div>

          {/* Form Fill-up Job Card */}
          <motion.div 
            whileHover={{ y: -10, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="bg-white rounded-[3rem] shadow-[0_40px_80px_rgba(0,0,0,0.04)] p-12 border border-slate-100 flex flex-col items-center text-center group cursor-pointer relative overflow-hidden"
            onClick={() => setShowFormFillMessage(true)}
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500" />
            <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-[2rem] flex items-center justify-center mb-10 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-500 shadow-inner">
              <ClipboardList size={48} />
            </div>
            <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">ফরম ফিলাপ জব</h3>
            <p className="text-slate-500 font-bold text-lg mb-10 leading-relaxed">বিভিন্ন ডাটা এন্ট্রি এবং ফরম পূরণ করে আয় করুন।</p>
            
            <div className="w-full bg-slate-50 rounded-3xl p-6 border border-slate-100 flex justify-between items-center group-hover:bg-emerald-50/50 transition-colors">
              <div className="text-left">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Job Status</p>
                <p className="text-lg font-black text-emerald-600 flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                  Available Now
                </p>
              </div>
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm group-hover:translate-x-1 transition-transform">
                <ChevronRight size={24} />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Modal for Form Fill-up Message */}
        <AnimatePresence>
          {showFormFillMessage && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowFormFillMessage(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative bg-white rounded-[3rem] shadow-2xl p-12 max-w-lg w-full text-center border border-white/20"
              >
                <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center mb-8 mx-auto shadow-inner">
                  <Info size={48} />
                </div>
                <h3 className="text-3xl font-black text-slate-900 mb-6 tracking-tight">গুরুত্বপূর্ণ তথ্য</h3>
                <p className="text-slate-600 font-bold text-xl leading-relaxed mb-10">
                  এই কাজটি করতে হলে আপনাকে কমপক্ষে এক মাসের ভেতর ৩০টি টাইপিং টাস্ক সম্পন্ন করতে হবে।
                </p>
                <button 
                  onClick={() => setShowFormFillMessage(false)}
                  className="w-full bg-indigo-600 text-white font-black py-6 rounded-2xl hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-100 text-xl"
                >
                  ঠিক আছে
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <footer className="mt-auto pt-20 pb-10 text-slate-400 font-bold text-xs tracking-widest uppercase relative z-10 text-center">
          © 2026 Student Work Hub • Professional Earning Platform
        </footer>
      </div>
    );
  }

  if (view === 'typing') {
    const currentTask = TYPING_TASKS[currentTaskIndex];
    const progress = ((currentTaskIndex + 1) / 10) * 100;
    const isStarted = hasStartedTask[currentTask.id];
    
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50 px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
                <Keyboard className="text-white" size={20} />
              </div>
              <div>
                <h1 className="font-black text-slate-900 tracking-tight">Unity Earning</h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Task {currentTaskIndex + 1} of 10</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 md:gap-8">
              {isStarted && (
                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black tabular-nums transition-colors ${timeLeft < 60 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-slate-100 text-slate-700'}`}>
                  <Clock size={18} />
                  {formatTime(timeLeft)}
                </div>
              )}
              <div className="hidden sm:flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                  <User size={16} className="text-indigo-600" />
                </div>
                <span className="text-sm font-bold text-slate-700">{userInfo.fullName}</span>
              </div>
              <button 
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="absolute bottom-0 left-0 h-1 bg-indigo-100 w-full">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-indigo-600"
            />
          </div>
        </header>

        <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-12 space-y-10">
          {/* Task Content */}
          <div className="grid lg:grid-cols-2 gap-10">
            {/* Reference Text */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
                  <div className="w-2 h-8 bg-indigo-600 rounded-full" />
                  Reference Text
                </h2>
                <div className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-full">
                  Source Material
                </div>
              </div>
              
              <div className="bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.03)] p-8 border border-slate-100 h-[500px] overflow-y-auto leading-relaxed text-slate-700 font-medium selection:bg-indigo-100">
                {currentTask.text.split('\n').map((para, i) => (
                  <p key={i} className={para.includes('নির্দেশনা') ? 'text-indigo-600 font-black bg-indigo-50 p-4 rounded-xl mb-4 border-l-4 border-indigo-600' : 'mb-4'}>
                    {para}
                  </p>
                ))}
              </div>
            </div>

            {/* Typing Area */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
                  <div className="w-2 h-8 bg-emerald-500 rounded-full" />
                  Your Input
                </h2>
                <div className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-full">
                  Active Workspace
                </div>
              </div>
              
              <div className="relative h-[500px]">
                {!isStarted ? (
                  <div className="absolute inset-0 z-10 bg-slate-900/5 backdrop-blur-[2px] rounded-3xl flex flex-col items-center justify-center p-10 text-center border-2 border-dashed border-slate-200">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl mb-6 text-indigo-600">
                      <Play size={32} fill="currentColor" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2">Ready to Start?</h3>
                    <p className="text-slate-500 font-medium mb-8 max-w-xs">You have 20 minutes to complete this task. Accuracy is key.</p>
                    <button 
                      onClick={startTask}
                      className="bg-indigo-600 text-white font-black px-12 py-5 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 text-lg"
                    >
                      Start Task Now
                    </button>
                  </div>
                ) : timeLeft === 0 ? (
                  <div className="absolute inset-0 z-10 bg-red-50/90 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center p-10 text-center border-2 border-dashed border-red-200">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl mb-6 text-red-600">
                      <AlertCircle size={32} />
                    </div>
                    <h3 className="text-2xl font-black text-red-600 mb-2">Time's Up!</h3>
                    <p className="text-slate-500 font-medium mb-8 max-w-xs">Unfortunately, the time for this task has expired. Please try again.</p>
                    <button 
                      onClick={() => {
                        setTimeLeft(1200);
                        setHasStartedTask(prev => ({ ...prev, [currentTask.id]: false }));
                        setTaskAnswers(prev => ({ ...prev, [currentTask.id]: '' }));
                      }}
                      className="bg-red-600 text-white font-black px-12 py-5 rounded-2xl hover:bg-red-700 transition-all shadow-xl shadow-red-100 text-lg"
                    >
                      Restart Task
                    </button>
                  </div>
                ) : null}
                
                <textarea 
                  value={taskAnswers[currentTask.id] || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setTaskAnswers(prev => ({ ...prev, [currentTask.id]: val }));
                  }}
                  onPaste={(e) => {
                    e.preventDefault();
                    alert('কপি-পেস্ট করা সম্পূর্ণ নিষিদ্ধ! (Copy-paste is strictly prohibited!)');
                  }}
                  onCopy={(e) => e.preventDefault()}
                  onCut={(e) => e.preventDefault()}
                  disabled={!isStarted || timeLeft === 0}
                  className="w-full h-full p-8 bg-white border-2 border-slate-100 rounded-3xl focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none font-bold text-slate-800 transition-all resize-none shadow-[0_20px_50px_rgba(0,0,0,0.03)] placeholder:text-slate-200 leading-relaxed"
                  placeholder="Start typing the reference text here..."
                />
                
                <div className="absolute bottom-6 right-6 flex items-center gap-4">
                  <div className="bg-slate-900/80 backdrop-blur-md text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Characters: {(taskAnswers[currentTask.id] || '').length} / 1500
                  </div>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-100 p-6 rounded-2xl flex items-center gap-4 text-red-600 font-bold"
            >
              <AlertCircle size={24} />
              {error}
            </motion.div>
          )}

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-white p-8 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-slate-100">
            <div className="text-sm font-bold text-slate-400 flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400">
                <Info size={20} />
              </div>
              Make sure to type every character correctly, including punctuation.
            </div>
            
            <div className="flex gap-4 w-full sm:w-auto">
              <button 
                onClick={() => {
                  setIsTimerActive(false);
                  setCurrentTaskIndex(prev => Math.max(0, prev - 1));
                }}
                disabled={currentTaskIndex === 0}
                className="flex-1 sm:flex-none px-8 py-4 rounded-2xl font-black text-slate-400 hover:bg-slate-50 disabled:opacity-30 transition-all flex items-center justify-center gap-2"
              >
                <ChevronLeft size={20} /> Previous
              </button>

              {currentTaskIndex < 9 ? (
                <button 
                  onClick={() => {
                    if (!taskAnswers[currentTask.id] || taskAnswers[currentTask.id].length < 1500) {
                      setError('অনুগ্রহ করে পুরো আর্টিকেলটি নির্ভুলভাবে টাইপ করুন। (Please type the full article accurately.)');
                      return;
                    }
                    setError('');
                    setIsTimerActive(false);
                    setCurrentTaskIndex(prev => Math.min(9, prev + 1));
                    window.scrollTo(0, 0);
                  }}
                  disabled={!isStarted || timeLeft === 0}
                  className="flex-1 sm:flex-none bg-indigo-600 text-white font-black px-12 py-4 rounded-2xl hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-xl shadow-indigo-100 group"
                >
                  Next Task
                  <ChevronRight className="group-hover:translate-x-1 transition-transform" size={20} />
                </button>
              ) : (
                <button 
                  onClick={handleFinalSubmit}
                  disabled={!taskAnswers[currentTask.id] || taskAnswers[currentTask.id].length < 1500 || !isStarted || timeLeft === 0 || isSubmitting}
                  className="flex-1 sm:flex-none bg-emerald-600 text-white font-black px-12 py-4 rounded-2xl hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-xl shadow-emerald-100 group"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit All Tasks'}
                  <CheckCircle className="group-hover:scale-110 transition-transform" size={20} />
                </button>
              )}
            </div>
          </div>
        </main>
        <WhatsAppButton />
      </div>
    );
  }

  if (view === 'submitted') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-xl w-full bg-white rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.05)] p-12 text-center border border-slate-100 relative overflow-hidden"
        >
          {/* Decorative background element */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-50" />
          
          <div className="relative">
            <div className="w-24 h-24 bg-emerald-500 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-emerald-200 rotate-3">
              <CheckCircle size={48} />
            </div>
            
            <h2 className="text-4xl font-black text-slate-900 mb-6 tracking-tight">Submission Received!</h2>
            
            <p className="text-slate-500 mb-12 font-medium leading-relaxed text-lg">
              আপনার টাইপিং টাস্ক সফলভাবে জমা দেওয়া হয়েছে। আমাদের টিম আপনার কাজ ভেরিফাই করার পর আপনার একাউন্টে ব্যালেন্স যোগ হয়ে যাবে। সাধারণত ২৪ ঘণ্টার মধ্যে ভেরিফিকেশন সম্পন্ন হয়।
            </p>
            
            <div className="grid grid-cols-2 gap-4 mb-12">
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-left">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Student ID</div>
                <div className="text-lg font-black text-slate-900">{userInfo.uid}</div>
              </div>
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-left">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Status</div>
                <div className="flex items-center gap-2 text-emerald-600 font-black">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Pending Review
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => {
                localStorage.removeItem('typing_progress');
                window.location.reload();
              }}
              className="w-full bg-slate-900 text-white font-black py-6 rounded-2xl hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200 text-xl flex items-center justify-center gap-3 group"
            >
              Return to Dashboard
              <ChevronRight className="group-hover:translate-x-1 transition-transform" size={24} />
            </button>
          </div>
        </motion.div>
        
        <p className="mt-12 text-slate-400 font-bold text-sm">
          Need help? Contact our support via WhatsApp.
        </p>
      </div>
    );
  }

  if (view === 'admin-login') {
    return <AdminLogin onLogin={(token) => { setAdminToken(token); setView('admin-dashboard'); }} onBack={() => setView('landing')} />;
  }

  if (view === 'admin-dashboard') {
    return <AdminDashboard token={adminToken!} onLogout={() => { setAdminToken(null); setView('landing'); }} />;
  }

  return null;
}

// --- Admin Components ---

function AdminLogin({ onLogin, onBack }: { onLogin: (token: string) => void, onBack: () => void }) {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const trimmedId = id.trim();
    const trimmedPassword = password.trim();

    if (!trimmedId || !trimmedPassword) {
      setError('আইডি এবং পাসওয়ার্ড উভয়ই প্রয়োজন।');
      return;
    }

    console.log('Attempting login with:', trimmedId);
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: trimmedId, password: trimmedPassword })
      });
      const data = await res.json();
      if (res.ok) {
        console.log('Login successful');
        onLogin(data.token);
      } else {
        console.error('Login failed:', data.message);
        setError(data.message || 'লগইন ব্যর্থ হয়েছে।');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('সার্ভার ত্রুটি। আবার চেষ্টা করুন।');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-slate-600/10 blur-[120px] rounded-full" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-slate-900 rounded-3xl shadow-2xl p-10 border border-slate-800 relative z-10"
      >
        <button onClick={onBack} className="text-slate-500 hover:text-white mb-10 flex items-center gap-2 text-xs font-black transition-colors group uppercase tracking-widest">
          <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </button>
        
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-indigo-600/20">
            <Lock size={32} />
          </div>
          <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Mentor Access</h2>
          <p className="text-slate-400 font-medium">Enter your credentials to manage tasks.</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Mentor ID</label>
            <div className="relative group">
              <input 
                type="text" 
                value={id}
                onChange={(e) => setId(e.target.value)}
                className="w-full px-6 py-4 bg-slate-800 border border-slate-700 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:bg-slate-800/50 focus:border-indigo-500 outline-none transition-all font-bold text-white placeholder:text-slate-600"
                placeholder="Enter ID"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Password</label>
            <div className="relative group">
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-6 py-4 bg-slate-800 border border-slate-700 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:bg-slate-800/50 focus:border-indigo-500 outline-none transition-all font-bold text-white placeholder:text-slate-600"
                placeholder="••••••••"
              />
            </div>
          </div>
          
          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-red-400 text-xs font-bold bg-red-500/10 p-4 rounded-xl flex items-center gap-3 border border-red-500/20"
            >
              <AlertCircle size={18} />
              {error}
            </motion.div>
          )}
          
          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20 text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Verifying...
              </>
            ) : (
              'Login to Dashboard'
            )}
          </button>

          <div 
            className="opacity-0 hover:opacity-10 transition-opacity cursor-pointer text-[8px] text-center mt-4 text-slate-500"
            onClick={() => onLogin('debug-token')}
          >
            Debug Bypass
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function AdminDashboard({ token, onLogout }: { token: string, onLogout: () => void }) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchSubmissions = async () => {
    try {
      const res = await fetch('/api/admin/submissions');
      const data = await res.json();
      setSubmissions(data);
    } catch (err) {
      console.error('Failed to fetch');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const filteredSubmissions = submissions.filter(sub => 
    sub.userInfo.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sub.userInfo.uid.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sub.userInfo.whatsappNumber.includes(searchQuery)
  );

  const handleUpdateStatus = async (id: string, status: SubmissionStatus) => {
    setIsUpdating(true);
    try {
      const res = await fetch('/api/admin/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, reason: status === 'Rejected' ? rejectionReason : undefined })
      });
      if (res.ok) {
        await fetchSubmissions();
        setSelectedSubmission(null);
        setRejectionReason('');
      }
    } catch (err) {
      alert('Update failed');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <div className="py-4 text-center w-full bg-white border-b border-slate-100">
        <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-[0.2em] uppercase opacity-20">UNITY EARNING TYPING JOB</h1>
      </div>
      {/* Admin Nav */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-slate-100 p-6 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-200">
              <LayoutDashboard className="text-white" size={24} />
            </div>
            <div>
              <h1 className="font-black text-slate-900 text-xl tracking-tight leading-none">মেন্টর Dashboard</h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Unity Earning Platform</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-2xl font-black text-sm hover:bg-red-100 transition-all"
          >
            <LogOut size={18} /> LOGOUT
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-96 gap-4">
            <div className="w-16 h-16 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin"></div>
            <p className="text-slate-400 font-black text-xs uppercase tracking-widest">Loading Submissions...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* List */}
            <div className="lg:col-span-4 space-y-6">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recent Submissions</h2>
                <span className="bg-slate-900 text-white text-[10px] font-black px-2 py-1 rounded-md">{filteredSubmissions.length}</span>
              </div>

              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                  <Eye size={16} />
                </div>
                <input 
                  type="text"
                  placeholder="Search by name, UID or WhatsApp..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-800 placeholder:text-slate-300 text-sm shadow-sm"
                />
              </div>
              
              <div className="space-y-4">
                {filteredSubmissions.length === 0 ? (
                  <div className="bg-white rounded-[2rem] p-12 text-center border border-slate-100 shadow-sm">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Inbox className="text-slate-300" size={32} />
                    </div>
                    <p className="text-slate-400 font-bold">No submissions found.</p>
                  </div>
                ) : (
                  filteredSubmissions.map(sub => (
                    <button 
                      key={sub.id}
                      onClick={() => setSelectedSubmission(sub)}
                      className={`w-full text-left p-6 rounded-[2rem] border transition-all group ${
                        selectedSubmission?.id === sub.id 
                          ? 'bg-white border-slate-900 shadow-2xl shadow-slate-200 scale-[1.02]' 
                          : 'bg-white border-slate-100 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-100'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <span className="font-black text-slate-900 text-lg tracking-tight">{sub.userInfo.fullName}</span>
                        <StatusBadge status={sub.status} />
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 font-bold mb-4">
                        <div className="flex items-center gap-1.5">
                          <Clock size={14} />
                          {new Date(sub.submittedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">View Details</span>
                        <ChevronRight size={16} className={`transition-transform ${selectedSubmission?.id === sub.id ? 'translate-x-1 text-slate-900' : 'text-slate-300'}`} />
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Detail View */}
            <div className="lg:col-span-8">
              <AnimatePresence mode="wait">
                {selectedSubmission ? (
                  <motion.div 
                    key={selectedSubmission.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden"
                  >
                    <div className="p-10 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-slate-900 shadow-xl shadow-slate-200/50 font-black text-2xl border border-slate-100">
                          {selectedSubmission.userInfo.fullName.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-1">{selectedSubmission.userInfo.fullName}</h3>
                          <div className="flex items-center gap-4">
                            <p className="text-sm text-slate-500 font-bold flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                <Phone size={12} />
                              </div>
                              {selectedSubmission.userInfo.whatsappNumber}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button 
                          onClick={() => handleUpdateStatus(selectedSubmission.id, 'Approved')}
                          disabled={isUpdating || selectedSubmission.status === 'Approved'}
                          className="flex items-center gap-2 px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-sm hover:bg-emerald-700 disabled:opacity-50 shadow-xl shadow-emerald-100 transition-all active:scale-95"
                        >
                          <Check size={18} /> APPROVE
                        </button>
                        <button 
                          onClick={() => {
                            const reason = prompt('Reason for rejection:');
                            if (reason) {
                              setRejectionReason(reason);
                              handleUpdateStatus(selectedSubmission.id, 'Rejected');
                            }
                          }}
                          disabled={isUpdating || selectedSubmission.status === 'Rejected'}
                          className="flex items-center gap-2 px-8 py-4 bg-red-50 text-red-600 rounded-2xl font-black text-sm hover:bg-red-100 disabled:opacity-50 transition-all active:scale-95"
                        >
                          <X size={18} /> REJECT
                        </button>
                      </div>
                    </div>

                    <div className="p-10 space-y-12 max-h-[70vh] overflow-y-auto custom-scrollbar">
                      {TYPING_TASKS.map(task => {
                        const answer = selectedSubmission.tasks.find(t => t.taskId === task.id);
                        return (
                          <div key={task.id} className="space-y-6">
                            <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                              <div className="flex items-center gap-3">
                                <span className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-xs">
                                  {task.id}
                                </span>
                                <h4 className="font-black text-slate-900 tracking-tight">{task.title}</h4>
                              </div>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full">
                                {answer?.content.length || 0} characters typed
                              </span>
                            </div>
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                              <div className="space-y-3">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reference Text</div>
                                <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 text-sm leading-relaxed text-slate-500 italic">
                                  {task.text}
                                </div>
                              </div>
                              <div className="space-y-3">
                                <div className="flex items-center justify-between ml-1">
                                  <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">User Submission</div>
                                  <button 
                                    onClick={() => {
                                      navigator.clipboard.writeText(answer?.content || '');
                                      alert('Copied to clipboard!');
                                    }}
                                    className="text-[10px] font-black text-slate-400 hover:text-indigo-600 transition-colors flex items-center gap-1"
                                  >
                                    <ClipboardList size={12} /> COPY
                                  </button>
                                </div>
                                <div className="p-8 bg-indigo-50/50 rounded-[2rem] border border-indigo-100 text-sm leading-relaxed text-slate-900 font-medium whitespace-pre-wrap">
                                  {answer?.content || 'No content provided'}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-20 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
                    <div className="w-24 h-24 bg-slate-50 rounded-3xl flex items-center justify-center mb-8 text-slate-200">
                      <LayoutDashboard size={48} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2">Select a submission</h3>
                    <p className="text-slate-400 font-medium max-w-xs">Choose a submission from the sidebar to review the typing tasks and approve or reject them.</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: SubmissionStatus }) {
  const colors = {
    Pending: 'bg-amber-100 text-amber-700',
    Approved: 'bg-emerald-100 text-emerald-700',
    Rejected: 'bg-red-100 text-red-700'
  };
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${colors[status]}`}>
      {status}
    </span>
  );
}
