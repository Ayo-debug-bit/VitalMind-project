import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  ChevronRight, 
  AlertCircle, 
  Sparkles, 
  Check, 
  Clock, 
  ShieldAlert, 
  Eye, 
  ShieldCheck, 
  Lock, 
  Languages,
  Volume2,
  X,
  LayoutDashboard,
  Calendar,
  BookOpen,
  Compass,
  Activity,
  Smartphone
} from 'lucide-react';
import { LANGUAGES, TRANSLATIONS, Locale } from '../lib/multilingual';
import { BASELINE_QUESTIONS } from '../lib/additionalFeatures';

interface OnboardingFlowProps {
  onComplete: (data: {
    name: string;
    age: number;
    dob: string;
    reminderEnabled: boolean;
    reminderTime: string;
    securityQuestion: string;
    securityAnswer: string;
    locale: Locale;
    baselineAnswers: Record<string, number>;
  }) => void;
  initialName: string;
  onCancel?: () => void;
}

const SECURITY_QUESTIONS = [
  "What was the name of your first pet?",
  "In what city or town were you born?",
  "What is your mother's maiden name?",
  "What was the name of your first primary school?"
];

export function OnboardingFlow({ onComplete, initialName, onCancel }: OnboardingFlowProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const locale: Locale = 'en';
  const [name, setName] = useState(initialName || '');
  const [age, setAge] = useState('');
  const [dob, setDob] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState('20:00'); // defaults to 8:00 PM
  const [securityQuestion, setSecurityQuestion] = useState(SECURITY_QUESTIONS[0]);
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [errorStatus, setErrorStatus] = useState('');

  const handleDobChange = (val: string) => {
    setDob(val);
    if (val) {
      const birthDate = new Date(val);
      const today = new Date();
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }
      setAge(calculatedAge.toString());
    } else {
      setAge('');
    }
  };
  
  // Baseline Assessment State
  const [baselineAnswers, setBaselineAnswers] = useState<Record<string, number>>({
    pleasure: 0,
    depressed: 0,
    anxious: 0,
    worrying: 0,
    sleep_quality: 0
  });

  const t = TRANSLATIONS['en'];

  const speakOnboarding = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleNext = () => {
    setErrorStatus('');
    if (step === 1) {
      if (!name.trim()) {
        setErrorStatus('Please enter a preferred name.');
        return;
      }
      if (!dob) {
        setErrorStatus('Please select your Date of Birth.');
        return;
      }
      const parsedAge = parseInt(age);
      if (isNaN(parsedAge) || parsedAge < 15 || parsedAge > 35) {
        setErrorStatus(`Under current requirements, your computed age (${parsedAge || 0}) must be between 15 and 35 years based on your date of birth.`);
        return;
      }
      if (!securityAnswer.trim()) {
        setErrorStatus('Please enter an answer to your security question.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    } else if (step === 4) {
      setStep(5);
    }
  };

  const handleFinish = () => {
    onComplete({
      name: name.trim(),
      age: parseInt(age),
      dob,
      reminderEnabled,
      reminderTime,
      securityQuestion,
      securityAnswer: securityAnswer.trim(),
      locale,
      baselineAnswers
    });
  };

  const handleAnswerSelect = (qid: string, val: number) => {
    setBaselineAnswers(prev => ({
      ...prev,
      [qid]: val
    }));
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-xl flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-[#203038] text-slate-900 dark:text-slate-100 rounded-[32px] border border-slate-100 dark:border-[#2C414C] shadow-2xl p-6 md:p-8 w-full max-w-lg space-y-6 max-h-[95vh] overflow-y-auto"
      >
        {/* Header toolbar */}
        <div className="flex justify-between items-center bg-slate-50 dark:bg-[#18262C] p-3 rounded-2xl border border-slate-100/60 dark:border-[#2C414C]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Sparkles size={16} />
            </div>
            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              {t.baselineAssessment}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-blue-600 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 px-2.5 py-1 rounded-full uppercase tracking-wider">
              Step {step} of 5
            </span>
            {onCancel && (
              <button 
                type="button"
                onClick={onCancel}
                className="p-1 px-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border border-slate-200/50 dark:border-slate-800"
                title="Exit Onboarding"
              >
                <X size={12} /> Exit
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Step Content */}
        <AnimatePresence mode="wait">
          
          {/* STEP 1: Name and Recovery Config */}
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4"
            >
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  Personalize Profile
                </h3>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                  Set up your recovery credentials and preferred name.
                </p>
              </div>

              {errorStatus && (
                <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{errorStatus}</span>
                </div>
              )}

              <div className="space-y-4">
                <div className="grid grid-cols-5 gap-4">
                  <div className="col-span-3 space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-0.5">
                      What should we call you?
                    </label>
                    <input 
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Tolani, Ibrahim, Chidi"
                      className="input-field py-2.5 px-3 text-xs font-bold w-full"
                      required
                    />
                  </div>

                  <div className="col-span-2 space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-0.5 flex justify-between items-center w-full">
                      <span>Date of Birth</span>
                      {age && <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-[9px] shrink-0">({age} yrs)</span>}
                    </label>
                    <input 
                      type="date"
                      value={dob}
                      onChange={(e) => handleDobChange(e.target.value)}
                      className="input-field py-2.5 px-3 text-xs font-bold w-full text-center"
                      required
                    />
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3" />

                {/* Security Setup */}
                <div className="space-y-3">
                  <div>
                    <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                      Local Encryption Recovery
                    </h4>
                    <p className="text-[9px] text-slate-400 font-semibold leading-normal mt-0.5">
                      Set a recovery question to securely reset your passcode.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-0.5">Recovery Question</label>
                    <select 
                      value={securityQuestion}
                      onChange={(e) => setSecurityQuestion(e.target.value)}
                      className="input-field py-2.5 px-3 text-xs font-semibold w-full bg-white dark:bg-[#18262C] border border-slate-200 dark:border-[#2C414C] dark:text-[#E3ECF0]"
                    >
                      {SECURITY_QUESTIONS.map(q => (
                        <option key={q} value={q}>{q}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-0.5">Your Secret Answer</label>
                    <input 
                      type="text"
                      value={securityAnswer}
                      onChange={(e) => setSecurityAnswer(e.target.value)}
                      placeholder="Enter answer uniquely matching question"
                      className="input-field py-2.5 px-3 text-xs font-bold w-full"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                {onCancel && (
                  <button 
                    type="button" 
                    onClick={onCancel}
                    className="w-1/3 py-3.5 rounded-2xl border border-slate-200 dark:border-[#2C414C] hover:bg-slate-50 dark:hover:bg-[#203038]/60 text-slate-500 dark:text-[#a8b8c0] font-black text-[10px] uppercase tracking-widest transition-colors cursor-pointer"
                  >
                    Exit Setup
                  </button>
                )}
                <button 
                  type="button" 
                  onClick={handleNext}
                  className="btn-primary flex-1 py-3.5 text-xs font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2"
                >
                  Proceed to Alert Config <ChevronRight size={14} />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Reminders & Notifications */}
          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Daily Alerts & Consistency</h3>
                <p className="text-xs text-slate-400 font-medium leading-relaxed mt-1">Consistency builds health. Schedule a gentle log reminder trigger.</p>
              </div>

              <div className="p-5 bg-slate-50 dark:bg-[#18262C] border border-slate-100 dark:border-[#2C414C] rounded-3xl space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white">Activate daily alert</h4>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Configure prompt alert routines daily</p>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setReminderEnabled(!reminderEnabled)}
                    className={`w-12 h-6 rounded-full p-0.5 transition-colors relative duration-300 ${reminderEnabled ? 'bg-blue-600' : 'bg-slate-300'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transform duration-300 ${reminderEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>

                {reminderEnabled && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="space-y-3 border-t border-slate-200/50 pt-4"
                  >
                    <div className="flex items-center gap-2 text-blue-600">
                      <Clock size={16} />
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Log Check Alert Time</label>
                    </div>
                    <input 
                      type="time"
                      value={reminderTime}
                      onChange={(e) => setReminderTime(e.target.value)}
                      className="input-field py-3 px-6 text-xl font-extrabold w-full text-center"
                    />
                    <p className="text-[9px] text-slate-400 text-center font-bold">Nigeria Standard Time (WAT / GMT+1)</p>
                  </motion.div>
                )}
              </div>

              <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setStep(1)}
                  className="w-1/3 py-3 rounded-2xl border border-slate-200 dark:border-[#2C414C] hover:bg-slate-50 dark:hover:bg-[#203038]/60 text-slate-500 dark:text-[#a8b8c0] font-black text-[10px] uppercase tracking-widest transition-colors cursor-pointer"
                >
                  Back
                </button>
                <button 
                  type="button" 
                  onClick={handleNext}
                  className="btn-primary flex-1 py-3 text-xs font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2"
                >
                  Baseline Assessment <ChevronRight size={14} />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Initial Mental Health Baseline Check */}
          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4"
            >
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  {t.baselineAssessment}
                </h3>
                <p className="text-xs text-slate-400 font-semibold leading-normal">
                  Choose options reflecting your experiences over the last 14 days. Clearly non-diagnostic, strictly to evaluate starting wellness markers.
                </p>
              </div>

              <div className="space-y-4 max-h-[42vh] overflow-y-auto pr-1">
                {BASELINE_QUESTIONS.map((q, idx) => {
                  const currentVal = baselineAnswers[q.id] || 0;
                  const textLabel = q.text;
                  return (
                    <div key={q.id} className="p-4 bg-slate-50 dark:bg-[#18262C] border border-slate-100 dark:border-[#2C414C] rounded-2xl space-y-2">
                      <p className="text-xs font-black text-slate-800 dark:text-slate-100 leading-snug flex items-center justify-between gap-2">
                        <span>{idx + 1}. {textLabel}</span>
                        <button
                          type="button"
                          onClick={() => speakOnboarding(textLabel)}
                          className="p-1 text-slate-400 hover:text-blue-600 dark:text-slate-500 dark:hover:text-blue-400 cursor-pointer shrink-0"
                          title="Speak Question"
                        >
                          <Volume2 size={13} />
                        </button>
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {q.options.map(opt => {
                          const optionLabel = opt.label;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => handleAnswerSelect(q.id, opt.value)}
                              className={`py-2 px-3 text-[10px] rounded-xl font-bold border text-left transition-all cursor-pointer ${
                                currentVal === opt.value
                                  ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                                  : 'bg-white dark:bg-[#203038] border-slate-200 dark:border-[#2C414C] text-slate-500 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#2a3c46]'
                              }`}
                            >
                              {optionLabel}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setStep(2)}
                  className="w-1/3 py-3 rounded-2xl border border-slate-200 dark:border-[#2C414C] hover:bg-slate-50 dark:hover:bg-[#203038]/60 text-slate-500 dark:text-[#a8b8c0] font-black text-[10px] uppercase tracking-widest transition-colors cursor-pointer"
                >
                  Back
                </button>
                <button 
                  type="button" 
                  onClick={handleNext}
                  className="btn-primary flex-1 py-3 text-xs font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 cursor-pointer"
                >
                  App Navigation Tour <ChevronRight size={14} />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: App Navigation directions & Tour */}
          {step === 4 && (
            <motion.div 
              key="step4"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4"
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-50 dark:bg-[#18262C] text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-xs border border-blue-100/60 dark:border-[#2C414C]">
                  <Compass size={24} />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  How to Navigate the App
                </h3>
                <p className="text-xs text-slate-400 font-medium leading-relaxed mt-1">Quick 1-minute visual guide to getting the most out of our application.</p>
              </div>

              {/* High Fidelity Visual Tour Columns */}
              <div className="space-y-2.5 max-h-[45vh] overflow-y-auto pr-1">
                
                <div className="p-3.5 bg-slate-50 dark:bg-[#18262C] border border-slate-100 dark:border-[#2C414C] rounded-2xl flex gap-3 items-start transition-all hover:bg-blue-50/20 dark:hover:bg-[#203038]/60 group">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl">
                    <LayoutDashboard size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                      1. Home & Intelligence Center
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-[#a8b8c0] font-medium leading-relaxed mt-1 animate-fadeIn">
                      Your homepage features the <span className="text-slate-800 dark:text-slate-200 font-bold">Intelligence Center</span> which automatically computes clinical warnings and suggests preventive steps after you log your status.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-[#18262C] border border-slate-100 dark:border-[#2C414C] rounded-2xl flex gap-3 items-start transition-all hover:bg-blue-50/20 dark:hover:bg-[#203038]/60 group">
                  <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 text-white rounded-xl">
                    <Activity size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                      2. NEW: Symptoms Bottom Tab
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-[#a8b8c0] font-medium leading-relaxed mt-1 animate-fadeIn">
                      We've added a dedicated <span className="text-emerald-600 dark:text-emerald-400 font-bold">Log Symptoms</span> option in the bottom tab bar! Tap it anywhere to immediately report persistent clinical states.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-[#18262C] border border-slate-100 dark:border-[#2C414C] rounded-2xl flex gap-3 items-start transition-all hover:bg-blue-50/20 dark:hover:bg-[#203038]/60 group">
                  <div className="p-2 bg-gradient-to-br from-blue-600 to-cyan-500 text-white rounded-xl">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                      3. Health History & Doctor Reports
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-[#a8b8c0] font-medium leading-relaxed mt-1 animate-fadeIn">
                      Tap the <span className="text-blue-600 dark:text-blue-400 font-bold">History</span> button in the bottom bar to check calendar tracking lists, keep streak records, and export comprehensive clinical PDF status reports.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-[#18262C] border border-slate-100 dark:border-[#2C414C] rounded-2xl flex gap-3 items-start transition-all hover:bg-blue-50/20 dark:hover:bg-[#203038]/60 group">
                  <div className="p-2 bg-gradient-to-br from-red-500 to-orange-500 text-white rounded-xl animate-pulse">
                    <ShieldAlert size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                      4. Crisis Mode & Hotlines
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-[#a8b8c0] font-medium leading-relaxed mt-1 animate-fadeIn">
                      In the sidebar or profile section, you can enter <span className="text-red-500 font-bold">Crisis Mode</span> to silently coordinate check-ins with trusted safety companions or dial immediate support hotlines.
                    </p>
                  </div>
                </div>

              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setStep(3)}
                  className="w-1/3 py-3 rounded-2xl border border-slate-200 dark:border-[#2C414C] hover:bg-slate-50 dark:hover:bg-[#203038]/60 text-slate-500 dark:text-[#a8b8c0] font-black text-[10px] uppercase tracking-widest transition-colors cursor-pointer"
                >
                  Back
                </button>
                <button 
                  type="button" 
                  onClick={handleNext}
                  className="btn-primary flex-1 py-3 text-xs font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 cursor-pointer"
                >
                  Next: Data Privacy <ChevronRight size={14} />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 5: System Disclaimer & Data Privacy Transparency */}
          {step === 5 && (
            <motion.div 
              key="step5"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-5"
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xs border border-emerald-100/60 dark:border-emerald-900/50">
                  <ShieldCheck size={24} />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  {t.privacyScreen}
                </h3>
                <p className="text-xs text-slate-400 font-medium leading-relaxed mt-1">We respect, encrypt, and safeguard your clinical indicators.</p>
              </div>

              {/* Data Privacy Transparency Bulletins */}
              <div className="bg-slate-50 dark:bg-[#18262C] border border-slate-100 dark:border-[#2C414C] rounded-2xl p-4 space-y-3.5 text-slate-600 dark:text-slate-300 text-xs leading-normal">
                <div className="flex gap-2 items-start">
                  <Lock size={16} className="text-blue-600 shrink-0 mt-0.5" />
                  <p className="font-semibold text-[11px]">
                    <span className="text-slate-900 dark:text-white font-black">Secure Encryption:</span> All reported moods, notes, and medical markers are stored on encrypted Cloud Firestore tables or strictly sandbox-contained local storages.
                  </p>
                </div>
                <div className="flex gap-2 items-start">
                  <Eye className="text-indigo-600 shrink-0 mt-0.5" size={16} />
                  <p className="font-semibold text-[11px]">
                    <span className="text-slate-900 dark:text-white font-black">No Commercial Sharing:</span> Your reflections and clinical metrics are strictly confidential. We promise <span className="font-black text-slate-800 dark:text-slate-200">100% advertising separation</span>—your information is NEVER sold.
                  </p>
                </div>
                <div className="flex gap-2 items-start">
                  <ShieldAlert className="text-amber-600 shrink-0 mt-0.5" size={16} />
                  <p className="font-semibold text-[11px] italic text-amber-900 dark:text-amber-400/90">
                    <span className="text-slate-900 dark:text-white font-black not-italic">Health Disclaimer:</span> This application provides self-awareness trends and automated guidelines. It does not replace medical diagnostics or clinical interventions.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-amber-50/50 dark:bg-[#203038] border border-amber-100 dark:border-amber-900/40 rounded-2xl text-[10px] text-amber-800 dark:text-amber-400 text-center italic font-semibold">
                "Consistency is wellness. Ground yourself fully as we enter."
              </div>

              <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setStep(4)}
                  className="w-1/3 py-3 rounded-2xl border border-slate-200 dark:border-[#2C414C] hover:bg-slate-50 dark:hover:bg-[#203038]/60 text-slate-500 dark:text-[#a8b8c0] font-black text-[10px] uppercase tracking-widest transition-colors cursor-pointer"
                >
                  Back
                </button>
                <button 
                  type="button" 
                  onClick={handleFinish}
                  className="btn-primary flex-1 py-3 text-xs font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2"
                >
                  <Check size={14} /> Agree & Enter Dashboard
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        {/* Progress Tracker (Dots) */}
        <div className="flex justify-center gap-1.5 pt-1">
          {[1, 2, 3, 4, 5].map((dot) => (
            <div 
              key={dot}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                step === dot ? 'w-6 bg-blue-600' : 'w-2 bg-slate-200'
              }`}
            />
          ))}
        </div>

      </motion.div>
    </div>
  );
}
