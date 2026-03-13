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
  ClipboardList
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

  const handleVerifyUid = () => {
    setError('');
    if (uid.length === 7) {
      setUserInfo(prev => ({ ...prev, uid: uid }));
      setView('form');
    } else {
      setError('সঠিক ৭ সংখ্যার স্টুডেন্ট আইডি দিন।');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInfo.fullName || !userInfo.whatsappNumber) {
      setError('Please fill all fields.');
      return;
    }

    setError('');
    try {
      const res = await fetch('/api/check-limit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whatsappNumber: userInfo.whatsappNumber })
      });
      const data = await res.json();
      if (data.allowed) {
        setView('dashboard');
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Connection error. Please try again.');
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
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-100 via-slate-50 to-white">
        <div className="absolute top-8 text-center w-full">
          <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-[0.2em] uppercase opacity-20">UNITY EARNING TYPING JOB</h1>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-10 text-center border border-white/20 relative overflow-hidden backdrop-blur-sm"
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-600 to-violet-600" />
          
          <div className="bg-indigo-50 text-indigo-700 px-6 py-3 rounded-2xl text-sm font-bold mb-8 inline-block border border-indigo-100 shadow-sm leading-relaxed">
            টাইপিং টাস্ক সাবমিট করার পর আপনার স্টুডেন্ট একাউন্টে অটোমেটিকলি টাকা যোগ হয়ে যাবে
          </div>

          <div className="w-24 h-24 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-indigo-200 rotate-3">
            <Keyboard className="text-white" size={48} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">Unity Earning</h1>
          <p className="text-slate-500 mb-10 font-medium">E-Learning Platform Typing Work</p>
          
          <div className="space-y-4">
            <button 
              onClick={() => setView('uid')}
              className="w-full bg-indigo-600 text-white font-bold py-5 rounded-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 group shadow-lg shadow-indigo-200 text-lg"
            >
              Start Typing Work
              <ChevronRight size={22} className="group-hover:translate-x-1 transition-transform" />
            </button>
            
            <button 
              onClick={() => setView('admin-login')}
              className="w-full bg-slate-50 text-slate-500 font-bold py-4 rounded-2xl hover:bg-slate-100 transition-all border border-slate-200/50"
            >
              মেন্টর Dashboard
            </button>
          </div>
          
          <div className="mt-10 pt-8 border-t border-slate-100 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            Powered by Unity Earning Platform
          </div>
        </motion.div>
      </div>
    );
  }

  if (view === 'uid') {
    return (
      <div className={`min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-indigo-50 via-slate-50 to-white transition-all duration-300 ${isBlurred ? 'blur-3xl' : ''}`}>
        <div className="absolute top-8 text-center w-full flex flex-col items-center">
          <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-[0.2em] uppercase opacity-20 mb-4">UNITY EARNING TYPING JOB</h1>
          <button 
            onClick={handleLogout}
            className="bg-white/80 backdrop-blur-sm border border-slate-200 px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-black text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all shadow-sm"
          >
            <LogOut size={14} />
            LOGOUT
          </button>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-10 border border-white/20"
        >
          <button onClick={() => setView('landing')} className="text-slate-400 hover:text-indigo-600 mb-8 flex items-center gap-2 text-sm font-bold transition-colors">
            <ChevronLeft size={18} /> Back to Home
          </button>
          
          <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Student ID Verification</h2>
          <p className="text-slate-500 mb-8 font-medium">Enter your 7-digit Student ID to continue.</p>
          
          <div className="space-y-8">
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 p-6 rounded-3xl space-y-3 shadow-sm">
              <h4 className="text-sm font-black text-amber-700 uppercase tracking-wider flex items-center gap-2">
                <AlertCircle size={18} /> কাজের নিয়মাবলী (Rules)
              </h4>
              <ul className="text-sm text-amber-800 space-y-2 font-semibold">
                <li className="flex gap-2"><span>•</span> নিজের হাতে টাইপ করে সাবমিট করতে হবে।</li>
                <li className="flex gap-2"><span>•</span> কপি-পেস্ট করার কোনো অপশন নেই।</li>
                <li className="flex gap-2"><span>•</span> প্রতিটি টাস্কের জন্য ২০ মিনিট সময় পাবেন।</li>
                <li className="flex gap-2"><span>•</span> ভুল টাইপ করলে পেমেন্ট রিজেক্ট হতে পারে।</li>
                <li className="flex gap-2"><span>•</span> AI বা অটোমেশন টুল ব্যবহার করা সম্পূর্ণ নিষিদ্ধ।</li>
              </ul>
            </div>

            <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-3xl shadow-sm">
              <h4 className="text-sm font-black text-indigo-700 uppercase tracking-wider flex items-center gap-2 mb-2">
                <AlertCircle size={18} /> বিশেষ নির্দেশনা (Special Note)
              </h4>
              <p className="text-sm text-indigo-800 font-bold leading-relaxed">
                পূর্বের কোর্স না করে টাইপিং এ কাজ করা প্রায় অসম্ভব তাই ওই কোর্সগুলো ভালো করে করুন মানে ভালো করে করে তারপর এটা শুরু করবেন।
              </p>
            </div>

            <div className="relative">
              <input 
                type="text" 
                maxLength={7}
                placeholder="0000000"
                value={uid}
                onChange={(e) => setUid(e.target.value.replace(/\D/g, ''))}
                className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-3xl tracking-[0.5em] text-center font-black text-slate-800 transition-all"
              />
            </div>
            
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 text-red-600 text-sm bg-red-50 p-4 rounded-2xl font-bold border border-red-100"
              >
                <AlertCircle size={20} />
                {error}
              </motion.div>
            )}
            
            <button 
              onClick={handleVerifyUid}
              disabled={uid.length !== 7}
              className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-indigo-200 text-lg"
            >
              Verify & Start Working
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (view === 'form') {
    return (
      <div className={`min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-50 via-slate-50 to-white transition-all duration-300 ${isBlurred ? 'blur-3xl' : ''}`}>
        <div className="absolute top-8 text-center w-full flex flex-col items-center">
          <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-[0.2em] uppercase opacity-20 mb-4">UNITY EARNING TYPING JOB</h1>
          <button 
            onClick={handleLogout}
            className="bg-white/80 backdrop-blur-sm border border-slate-200 px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-black text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all shadow-sm"
          >
            <LogOut size={14} />
            LOGOUT
          </button>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-10 border border-white/20"
        >
          <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Student Info</h2>
          <p className="text-slate-500 mb-8 font-medium">Complete your profile to access tasks.</p>
          
          <form onSubmit={handleFormSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text" 
                  required
                  placeholder="Enter your full name"
                  value={userInfo.fullName}
                  onChange={(e) => setUserInfo(prev => ({ ...prev, fullName: e.target.value }))}
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-bold text-slate-800 transition-all"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp Number</label>
              <div className="relative">
                <MessageCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="tel" 
                  required
                  placeholder="01XXXXXXXXX"
                  value={userInfo.whatsappNumber}
                  onChange={(e) => setUserInfo(prev => ({ ...prev, whatsappNumber: e.target.value }))}
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-bold text-slate-800 transition-all"
                />
              </div>
            </div>
            
            <button 
              type="submit"
              className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 text-lg mt-4"
            >
              Enter Dashboard
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  if (view === 'dashboard') {
    return (
      <div className={`min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-50 via-slate-50 to-white transition-all duration-300 ${isBlurred ? 'blur-3xl' : ''}`}>
        <div className="absolute top-8 text-center w-full flex flex-col items-center">
          <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-[0.2em] uppercase opacity-20 mb-4">UNITY EARNING</h1>
          <button 
            onClick={handleLogout}
            className="bg-white/80 backdrop-blur-sm border border-slate-200 px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-black text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all shadow-sm"
          >
            <LogOut size={14} />
            LOGOUT
          </button>
        </div>

        <div className="max-w-4xl w-full grid md:grid-cols-2 gap-8">
          {/* Typing Job Card */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white rounded-[2.5rem] shadow-xl p-8 border border-slate-100 flex flex-col items-center text-center group cursor-pointer"
            onClick={() => setView('typing')}
          >
            <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 transition-colors">
              <Keyboard className="text-indigo-600 group-hover:text-white transition-colors" size={40} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-3">Typing Job</h3>
            <p className="text-slate-500 font-medium mb-2">Earn by typing high-quality articles and documents.</p>
            <p className="text-indigo-600 font-bold text-sm mb-6">টাইপিং টাস্ক পূরণ করলে আপনাদের স্টুডেন্ট একাউন্টে অটোমেটিকলি টাকা এড হয়ে যাবে।</p>
            <div className="mt-auto w-full py-4 bg-slate-50 rounded-2xl font-black text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
              Start Typing
            </div>
          </motion.div>

          {/* Form Fill-up Job Card */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white rounded-[2.5rem] shadow-xl p-8 border border-slate-100 flex flex-col items-center text-center group cursor-pointer"
            onClick={() => setShowFormFillMessage(true)}
          >
            <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mb-6 group-hover:bg-emerald-600 transition-colors">
              <ClipboardList className="text-emerald-600 group-hover:text-white transition-colors" size={40} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-3">ফরম ফিলাপ জব</h3>
            <p className="text-slate-500 font-medium mb-6">বিভিন্ন ডাটা এন্ট্রি এবং ফরম পূরণ করে আয় করুন।</p>
            <div className="mt-auto w-full py-4 bg-slate-50 rounded-2xl font-black text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
              ফরম ফিলাপ শুরু করুন
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
                className="relative bg-white rounded-[3rem] shadow-2xl p-10 max-w-lg w-full text-center border border-white/20"
              >
                <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="text-amber-500" size={40} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-4">গুরুত্বপূর্ণ নির্দেশনা</h3>
                <p className="text-xl font-bold text-slate-700 leading-relaxed mb-8">
                  এই কাজটি করতে হলে আপনাকে কমপক্ষে এক মাসের ভেতর ত্রিশটি কনভার্ট দিতে হবে
                </p>
                <button 
                  onClick={() => setShowFormFillMessage(false)}
                  className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 text-lg"
                >
                  ঠিক আছে
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (view === 'typing') {
    const currentTask = TYPING_TASKS[currentTaskIndex];
    const progress = ((currentTaskIndex + 1) / 10) * 100;
    const isStarted = hasStartedTask[currentTask.id];
    
    return (
      <div className={`min-h-screen bg-slate-50 flex flex-col bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-50 via-slate-50 to-white transition-all duration-300 ${isBlurred ? 'blur-3xl' : ''}`}>
        <div className="py-8 text-center w-full flex flex-col items-center">
          <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-[0.2em] uppercase opacity-20 mb-4">UNITY EARNING TYPING JOB</h1>
          <button 
            onClick={handleLogout}
            className="bg-white border border-slate-200 px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-black text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all shadow-sm"
          >
            <LogOut size={14} />
            LOGOUT
          </button>
        </div>
        
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10 px-6 py-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
                <Keyboard className="text-white" size={20} />
              </div>
              <div>
                <h1 className="font-black text-slate-900 tracking-tight">Unity Earning</h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Task {currentTaskIndex + 1} of 10</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              {isStarted && (
                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black tabular-nums transition-colors ${timeLeft < 60 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-slate-100 text-slate-700'}`}>
                  <Clock size={18} />
                  {formatTime(timeLeft)}
                </div>
              )}
              <div className="hidden sm:flex items-center gap-3 bg-slate-100 px-4 py-2 rounded-xl">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                  <User size={16} className="text-indigo-600" />
                </div>
                <span className="text-sm font-bold text-slate-700">{userInfo.fullName}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-5xl w-full mx-auto p-6 space-y-8">
          {/* Progress Bar */}
          <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-gradient-to-r from-indigo-600 to-violet-600"
              />
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Task Text */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">{currentTask.title}</h3>
                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-black uppercase tracking-wider">Original Text</span>
              </div>
              <div 
                className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 text-slate-700 leading-relaxed font-medium text-lg h-[600px] overflow-y-auto custom-scrollbar select-none"
                onContextMenu={(e) => e.preventDefault()}
              >
                {currentTask.text.split('\n').map((para, i) => (
                  <p key={i} className={para.includes('নির্দেশনা') ? 'text-indigo-600 font-black bg-indigo-50 p-4 rounded-xl mb-4 border-l-4 border-indigo-600' : 'mb-4'}>
                    {para}
                  </p>
                ))}
              </div>
            </div>

            {/* Typing Area */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Your Typing Area</h3>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-black uppercase tracking-wider">Input</span>
              </div>
              
              <div className="relative h-[600px]">
                {!isStarted ? (
                  <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 backdrop-blur-sm rounded-[2rem] border-2 border-dashed border-indigo-200">
                    <button 
                      onClick={startTask}
                      className="bg-indigo-600 text-white font-black px-10 py-5 rounded-2xl hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-200 flex items-center gap-3 group"
                    >
                      <Play size={24} fill="currentColor" />
                      Start Timer & Type
                    </button>
                  </div>
                ) : null}

                <textarea
                  disabled={!isStarted || timeLeft === 0}
                  value={taskAnswers[currentTask.id] || ''}
                  onChange={(e) => setTaskAnswers(prev => ({ ...prev, [currentTask.id]: e.target.value }))}
                  onPaste={(e) => {
                    e.preventDefault();
                    alert('কপি-পেস্ট করা সম্পূর্ণ নিষিদ্ধ! (Copy-paste is strictly prohibited!)');
                  }}
                  onCopy={(e) => e.preventDefault()}
                  onCut={(e) => e.preventDefault()}
                  placeholder={isStarted ? "Start typing exactly as shown in the left box..." : "Click 'Start' to begin typing..."}
                  className="w-full h-full p-8 bg-white rounded-[2rem] shadow-xl border-2 border-slate-100 focus:border-indigo-500 outline-none resize-none font-medium text-lg leading-relaxed transition-all disabled:bg-slate-50 disabled:text-slate-400"
                />
                
                {timeLeft === 0 && isStarted && (
                  <div className="absolute inset-0 z-30 flex items-center justify-center bg-red-50/90 backdrop-blur-sm rounded-[2rem] border-2 border-red-200">
                    <div className="text-center p-8">
                      <Clock size={48} className="text-red-600 mx-auto mb-4" />
                      <h4 className="text-2xl font-black text-red-600 mb-2">Time's Up!</h4>
                      <p className="text-red-800 font-bold">You couldn't finish in time. Please try again.</p>
                      <button 
                        onClick={() => {
                          setTimeLeft(1200);
                          setHasStartedTask(prev => ({ ...prev, [currentTask.id]: false }));
                          setTaskAnswers(prev => ({ ...prev, [currentTask.id]: '' }));
                        }}
                        className="mt-6 bg-red-600 text-white font-black px-8 py-3 rounded-xl hover:bg-red-700 transition-all"
                      >
                        Restart Task
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 text-sm font-bold border border-red-100"
            >
              <AlertCircle size={20} />
              {error}
            </motion.div>
          )}

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-white p-8 rounded-[2rem] shadow-lg border border-slate-100">
            <div className="text-sm font-bold text-slate-500 flex items-center gap-2">
              <AlertCircle size={18} className="text-indigo-500" />
              Make sure to type every character correctly, including punctuation.
            </div>
            
            <div className="flex gap-4 w-full sm:w-auto">
              <button 
                onClick={() => {
                  setIsTimerActive(false);
                  setCurrentTaskIndex(prev => Math.max(0, prev - 1));
                }}
                disabled={currentTaskIndex === 0}
                className="flex-1 sm:flex-none px-6 py-4 rounded-2xl font-black text-slate-400 hover:bg-slate-100 disabled:opacity-30 transition-all flex items-center justify-center gap-2"
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
                  className="flex-1 sm:flex-none bg-indigo-600 text-white font-black px-10 py-4 rounded-2xl hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xl shadow-indigo-100"
                >
                  Next Task
                  <ChevronRight size={20} />
                </button>
              ) : (
                <button 
                  onClick={handleFinalSubmit}
                  disabled={!taskAnswers[currentTask.id] || taskAnswers[currentTask.id].length < 1500 || !isStarted || timeLeft === 0 || isSubmitting}
                  className="flex-1 sm:flex-none bg-emerald-600 text-white font-black px-10 py-4 rounded-2xl hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xl shadow-emerald-100"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit All Tasks'}
                  <CheckCircle size={20} />
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
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-emerald-50 via-slate-50 to-white">
        <div className="absolute top-8 text-center w-full">
          <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-[0.2em] uppercase opacity-20">UNITY EARNING TYPING JOB</h1>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-12 text-center border border-white/20"
        >
          <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-50">
            <CheckCircle2 size={56} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Successfully Submitted!</h2>
          <p className="text-slate-500 mb-10 font-medium leading-relaxed">
            আপনার টাইপিং টাস্ক সফলভাবে জমা দেওয়া হয়েছে। এডমিন ভেরিফাই করার পর আপনার একাউন্টে টাকা যোগ হয়ে যাবে।
          </p>
          <div className="bg-slate-50 p-6 rounded-2xl mb-10 text-left border border-slate-100">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Submission Details</div>
            <div className="flex justify-between items-center text-sm mb-3">
              <span className="text-slate-500 font-bold">UID:</span>
              <span className="font-black text-slate-900 bg-white px-3 py-1 rounded-lg shadow-sm">{userInfo.uid}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-bold">Status:</span>
              <span className="font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">Pending Review</span>
            </div>
          </div>
          <button 
            onClick={() => {
              localStorage.removeItem('typing_progress');
              window.location.reload();
            }}
            className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 text-lg"
          >
            Back to Home
          </button>
        </motion.div>
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, password })
      });
      const data = await res.json();
      if (res.ok) {
        onLogin(data.token);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Login failed. Server error.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black">
      <div className="absolute top-8 text-center w-full">
        <h1 className="text-2xl md:text-4xl font-black text-white tracking-[0.2em] uppercase opacity-20">UNITY EARNING TYPING JOB</h1>
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-10 border border-white/10"
      >
        <button onClick={onBack} className="text-slate-400 hover:text-slate-900 mb-8 flex items-center gap-2 text-sm font-black transition-colors group">
          <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-slate-100 transition-colors">
            <ChevronLeft size={18} />
          </div>
          BACK TO HOME
        </button>
        
        <div className="w-20 h-20 bg-slate-900 text-white rounded-3xl flex items-center justify-center mb-8 shadow-2xl shadow-slate-200">
          <Lock size={36} />
        </div>
        
        <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">মেন্টর Access</h2>
        <p className="text-slate-500 mb-10 font-medium">Enter credentials to manage submissions.</p>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">মেন্টর ID</label>
            <div className="relative">
              <input 
                type="text" 
                value={id}
                onChange={(e) => setId(e.target.value)}
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-slate-900/5 focus:bg-white focus:border-slate-900 outline-none transition-all font-bold text-slate-900"
                placeholder="মেন্টর ID"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
            <div className="relative">
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-slate-900/5 focus:bg-white focus:border-slate-900 outline-none transition-all font-bold text-slate-900"
                placeholder="••••••"
              />
            </div>
          </div>
          
          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-red-500 text-xs font-bold bg-red-50 p-4 rounded-xl flex items-center gap-3 border border-red-100"
            >
              <AlertCircle size={18} />
              {error}
            </motion.div>
          )}
          
          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 text-lg disabled:opacity-50"
          >
            {isLoading ? 'AUTHENTICATING...' : 'LOGIN TO DASHBOARD'}
          </button>
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
                <span className="bg-slate-900 text-white text-[10px] font-black px-2 py-1 rounded-md">{submissions.length}</span>
              </div>
              
              <div className="space-y-4">
                {submissions.length === 0 ? (
                  <div className="bg-white rounded-[2rem] p-12 text-center border border-slate-100 shadow-sm">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Inbox className="text-slate-300" size={32} />
                    </div>
                    <p className="text-slate-400 font-bold">No submissions yet.</p>
                  </div>
                ) : (
                  submissions.map(sub => (
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
                                <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">User Submission</div>
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
