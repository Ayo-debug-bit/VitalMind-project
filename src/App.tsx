import { useState, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  Activity, 
  Calendar, 
  BookOpen, 
  Plus, 
  ChevronRight, 
  LogOut, 
  AlertCircle,
  CheckCircle2,
  Zap,
  Info,
  Phone,
  LayoutDashboard,
  User
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { 
  evaluateWellness, 
  MoodType, 
  SymptomType, 
  EvaluationResult, 
  HELPLINES, 
  RESOURCES,
  SYMPTOMS
} from './lib/ruleEngine';
import { db, auth } from './firebase';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  onSnapshot,
  Timestamp,
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error Details: ', JSON.stringify(errInfo));
  if (errInfo.error.includes('insufficient permissions')) {
    alert("Permission Error: Our security rules blocked this action. Please check if your data is valid.");
  }
}

type View = 'dashboard' | 'mood' | 'symptoms' | 'history' | 'resources' | 'profile';

function AppContent() {
  const { user, login, logout, loading } = useAuth();
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [moodLogs, setMoodLogs] = useState<any[]>([]);
  const [symptomLogs, setSymptomLogs] = useState<any[]>([]);
  const [wellnessResult, setWellnessResult] = useState<EvaluationResult | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [age, setAge] = useState('');
  const [profile, setProfile] = useState<any>(null);
  const [modalInfo, setModalInfo] = useState<{ title: string, content: string } | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Sync data from Firebase
  useEffect(() => {
    if (!user) return;

    const userDocRef = doc(db, 'users', user.uid);
    
    // Check for profile data
    getDoc(userDocRef).then(snap => {
      if (!snap.exists() || !snap.data().age) {
        setShowOnboarding(true);
      } else {
        setProfile(snap.data());
      }
    }).catch(err => handleFirestoreError(err, OperationType.GET, userDocRef.path));

    const moodQuery = query(
      collection(db, `users/${user.uid}/mood_logs`),
      orderBy('timestamp', 'desc'),
      limit(20)
    );

    const symptomQuery = query(
      collection(db, `users/${user.uid}/symptom_logs`),
      orderBy('timestamp', 'desc'),
      limit(20)
    );

    const unsubMood = onSnapshot(moodQuery, (snapshot) => {
      setMoodLogs(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => handleFirestoreError(err, OperationType.GET, `users/${user.uid}/mood_logs`));

    const unsubSymptom = onSnapshot(symptomQuery, (snapshot) => {
      setSymptomLogs(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => handleFirestoreError(err, OperationType.GET, `users/${user.uid}/symptom_logs`));

    const unsubProfile = onSnapshot(userDocRef, (snap) => {
      if (snap.exists()) setProfile(snap.data());
    }, (err) => handleFirestoreError(err, OperationType.GET, userDocRef.path));

    return () => {
      unsubMood();
      unsubSymptom();
      unsubProfile();
    };
  }, [user]);

  // Recalculate wellness state
  useEffect(() => {
    if (moodLogs.length > 0) {
      const currentMood = moodLogs[0].mood as MoodType;
      const recentMoods = moodLogs.slice(1).map(m => m.mood as MoodType);
      const recentSymptomsHistory = symptomLogs.map(s => s.symptoms as SymptomType[]);
      const currentSymptoms = recentSymptomsHistory.length > 0 ? recentSymptomsHistory[0] : [];
      const pastSymptoms = recentSymptomsHistory.slice(1);
      
      const result = evaluateWellness(currentMood, recentMoods, currentSymptoms, pastSymptoms);
      setWellnessResult(result);

      if (user && profile && profile.lastState !== result.state) {
        const path = `users/${user.uid}`;
        setDoc(doc(db, path), {
          lastState: result.state,
          updatedAt: serverTimestamp()
        }, { merge: true }).catch(e => handleFirestoreError(e, OperationType.WRITE, path));
      }
    }
  }, [moodLogs, symptomLogs, user, profile]);

  const handleOnboarding = async () => {
    if (!user || !age) return;
    const parsedAge = parseInt(age);
    if (isNaN(parsedAge) || parsedAge < 15 || parsedAge > 35) {
      alert("Age must be between 15 and 35.");
      return;
    }
    const path = `users/${user.uid}`;
    try {
      const userDoc = await getDoc(doc(db, path));
      const data: any = {
        uid: user.uid,
        name: user.displayName || 'Friend',
        email: user.email,
        age: parsedAge,
        updatedAt: serverTimestamp()
      };
      
      // Only set createdAt if it doesn't already exist
      if (!userDoc.exists()) {
        data.createdAt = serverTimestamp();
      }

      await setDoc(doc(db, path), data, { merge: true });
      setShowOnboarding(false);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center p-6 bg-slate-50">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-sm"
        >
          <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl">
            <Heart className="w-10 h-10 text-white fill-white/20" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tighter uppercase">Vital Mind</h1>
          <p className="text-slate-500 mb-10 leading-relaxed text-sm font-medium">
            Next-gen preventive care for young people in Nigeria. Secure, personal, and intelligent.
          </p>
          <button onClick={login} className="btn-primary w-full shadow-lg shadow-blue-200 uppercase tracking-widest py-4">
            Connect with Google
          </button>
        </motion.div>
      </div>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <DashboardView moodLogs={moodLogs} result={wellnessResult} setView={setCurrentView} profile={profile} setModalInfo={setModalInfo} />;
      case 'mood': return <MoodLoggerView onComplete={() => setCurrentView('dashboard')} userId={user.uid} />;
      case 'symptoms': return <SymptomLoggerView onComplete={() => setCurrentView('dashboard')} userId={user.uid} />;
      case 'history': return <HistoryView moodLogs={moodLogs} symptomLogs={symptomLogs} onBack={() => setCurrentView('dashboard')} />;
      case 'resources': return <ResourcesView setModalInfo={setModalInfo} onBack={() => setCurrentView('dashboard')} />;
      case 'profile': return <ProfileEditView profile={profile} userId={user.uid} onBack={() => setCurrentView('dashboard')} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar - High Density Design */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col hidden lg:flex">
        <div className="p-8 border-b border-slate-50">
          <div className="flex items-center gap-3 text-blue-600">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl">V</div>
            <h1 className="font-black text-xl tracking-tighter uppercase text-slate-900">Vital Mind</h1>
          </div>
        </div>
        
        <nav className="flex-1 p-6 space-y-2">
          <SidebarItem 
            active={currentView === 'dashboard'} 
            onClick={() => setCurrentView('dashboard')} 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
          />
          <SidebarItem 
            active={currentView === 'mood'} 
            onClick={() => setCurrentView('mood')} 
            icon={<Activity size={20} />} 
            label="Mood Tracker" 
          />
          <SidebarItem 
            active={currentView === 'history'} 
            onClick={() => setCurrentView('history')} 
            icon={<Calendar size={20} />} 
            label="Wellness History" 
          />
          <SidebarItem 
            active={currentView === 'resources'} 
            onClick={() => setCurrentView('resources')} 
            icon={<BookOpen size={20} />} 
            label="Help Library" 
          />
        </nav>

        <div className="p-6 border-t border-slate-50">
          <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden group">
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70 mb-1">Crisis Support</p>
              <p className="font-bold text-lg mb-4">0806 210 6493</p>
              <button 
                onClick={() => window.open('tel:08062106493')}
                className="w-full py-2 bg-white text-blue-600 text-[10px] font-black rounded-lg uppercase transition-transform hover:scale-[1.02]"
              >
                Call Hotline
              </button>
            </div>
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-20 bg-white border-b border-slate-200 px-6 md:px-10 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Good day, {user.displayName?.split(' ')[0]} 👋</h2>
            <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">
              User ID: {user.uid.slice(0, 8)} • Age: {profile?.age || '--'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">Wellness State</p>
              <div className={`px-3 py-1 rounded text-[10px] font-black uppercase ${
                !wellnessResult ? 'bg-slate-50 text-slate-400' :
                wellnessResult.state === 'Mild' ? 'bg-emerald-50 text-emerald-600' :
                wellnessResult.state === 'Moderate' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
              }`}>
                {wellnessResult?.state || 'Scanning...'}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentView('profile')} 
                title="Edit Profile"
                className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-600 transition-colors"
              >
                <User size={18} />
              </button>
              <button 
                onClick={() => setShowLogoutConfirm(true)} 
                title="Log out"
                className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="max-w-6xl mx-auto"
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </div>

        <footer className="h-auto md:h-10 border-t border-slate-200 px-6 md:px-10 py-4 md:py-0 flex flex-col md:flex-row justify-between items-center bg-white text-[10px] font-black text-slate-400 uppercase tracking-wider shrink-0 gap-2">
          <div>Vital Mind System • v1.1.0</div>
          <div className="flex gap-6">
            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500" /> Rule-Engine Active</span>
            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Secure Encryption</span>
          </div>
        </footer>
      </main>

      {/* Mobile Nav (Bottom) */}
      <nav className="fixed bottom-0 left-0 right-0 lg:hidden bg-white/80 backdrop-blur-xl border-t border-slate-200 flex justify-around p-4 safe-area-bottom">
        <NavButton active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} icon={<LayoutDashboard size={22} />} label="Home" />
        <NavButton active={currentView === 'history'} onClick={() => setCurrentView('history')} icon={<Calendar size={22} />} label="History" />
        <NavButton active={currentView === 'resources'} onClick={() => setCurrentView('resources')} icon={<BookOpen size={22} />} label="Help" />
      </nav>

      {/* Onboarding Dialog */}
      <AnimatePresence>
        {showOnboarding && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="wellness-card w-full max-w-sm space-y-8"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center text-white mx-auto mb-6 shadow-xl">
                  <Heart size={32} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Welcome to Vital Mind</h3>
                <p className="text-slate-500 text-xs mt-2 font-medium">Please enter your age to activate the expert rule system.</p>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Age Verification (15-35)</label>
                <input 
                  type="number" 
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g. 21"
                  className="input-field py-4 px-6 text-lg font-bold"
                  min="15"
                  max="35"
                />
              </div>
              <button 
                disabled={!age || parseInt(age) < 15 || parseInt(age) > 35}
                onClick={handleOnboarding}
                className="btn-primary w-full py-4 text-[12px] uppercase tracking-widest shadow-xl shadow-blue-100"
              >
                Enter Dashboard
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Info Modal */}
      <AnimatePresence>
        {modalInfo && (
          <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl space-y-6"
            >
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                  <Info size={24} />
                </div>
                <button 
                  onClick={() => setModalInfo(null)}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                >
                  <Plus className="rotate-45" size={20} />
                </button>
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase mb-2">{modalInfo.title}</h3>
                <p className="text-slate-600 leading-relaxed font-medium">{modalInfo.content}</p>
              </div>
              <button 
                onClick={() => setModalInfo(null)}
                className="btn-primary w-full py-3 text-[10px] uppercase tracking-widest"
              >
                Close Information
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[70] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl space-y-6 text-center"
            >
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <LogOut size={28} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase mb-2">Are you sure?</h3>
                <p className="text-slate-500 font-medium">You will be logged out of your wellness dashboard.</p>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => logout()}
                  className="flex-1 py-4 bg-red-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-red-700 shadow-lg shadow-red-100 transition-all"
                >
                  Log Out
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SidebarItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`wellness-sidebar-item w-full ${active ? 'wellness-sidebar-item-active shadow-sm' : 'wellness-sidebar-item-inactive'}`}
    >
      <span className={active ? 'text-blue-600' : 'text-slate-400'}>{icon}</span>
      <span className="tracking-tight">{label}</span>
    </button>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: ReactNode, label: string }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1.5 transition-colors ${active ? 'text-blue-600' : 'text-slate-400'}`}>
      {icon}
      <span className="text-[10px] font-black uppercase tracking-wider">{label}</span>
    </button>
  );
}

function DashboardView({ moodLogs, result, setView, profile, setModalInfo }: any) {
  return (
    <div className="grid grid-cols-12 gap-4 md:gap-8">
      {/* Main Column */}
      <div className="col-span-12 lg:col-span-8 flex flex-col gap-4 md:gap-8">
        
        {result?.warning && (
          <motion.div 
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-amber-900 text-white p-6 rounded-2xl flex gap-4 shadow-xl relative overflow-hidden"
          >
            <div className="relative z-10 flex gap-4">
              <AlertCircle className="text-amber-400 shrink-0 mt-1" size={24} />
              <div>
                <h4 className="font-black uppercase text-[10px] tracking-widest text-amber-400 mb-1">System Alert</h4>
                <p className="text-sm font-medium leading-relaxed">{result.warning}</p>
              </div>
            </div>
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/5 rounded-full blur-xl" />
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 text-white">
          <button 
            onClick={() => setView('mood')} 
            className="bg-blue-600 p-8 rounded-3xl text-left shadow-xl shadow-blue-100 relative overflow-hidden group hover:scale-[1.02] transition-all"
          >
            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                <Plus size={24} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Track New</p>
              <h3 className="text-2xl font-black uppercase tracking-tighter">Mood Log</h3>
            </div>
            <div className="absolute right-0 bottom-0 p-4 opacity-10 scale-150 rotate-12 group-hover:scale-[1.7] transition-transform">
              <Heart size={100} />
            </div>
          </button>

          <button 
            onClick={() => setView('symptoms')} 
            className="bg-emerald-600 p-8 rounded-3xl text-left shadow-xl shadow-emerald-100 relative overflow-hidden group hover:scale-[1.02] transition-all"
          >
            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                <Activity size={24} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Report New</p>
              <h3 className="text-2xl font-black uppercase tracking-tighter">Symptoms</h3>
            </div>
            <div className="absolute right-0 bottom-0 p-4 opacity-10 scale-150 -rotate-12 group-hover:rotate-0 transition-transform">
              <Activity size={100} />
            </div>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
          <section className="wellness-card">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3">
                <Zap size={18} className="text-amber-500 fill-amber-500" />
                Intelligence Center
              </h3>
              <button 
                onClick={() => setModalInfo({ 
                  title: "Vital Mind Intelligence", 
                  content: "Our rule-based system analyzes your emotional and physical logs over 14-day windows to detect trends and suggest medically-informed preventive actions."
                })}
                className="text-slate-300 hover:text-blue-500 transition-colors"
              >
                <Info size={14} />
              </button>
            </div>
            
            <div className="space-y-4">
              {result?.recommendations.map((rec: string, i: number) => (
                <div key={i} className="flex gap-4 items-start p-5 bg-slate-50 border border-slate-100 rounded-2xl">
                  <CheckCircle2 size={20} className="text-blue-500 shrink-0" />
                  <p className="text-sm font-semibold text-slate-700 leading-relaxed">{rec}</p>
                </div>
              ))}
              {(!result || result.recommendations.length === 0) && (
                <p className="text-slate-400 text-sm italic px-2">No active mental health recommendations. Keep tracking!</p>
              )}
            </div>
          </section>

          <section className="wellness-card border-blue-100 bg-blue-50/20">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-[12px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-3">
                <Heart size={18} className="text-blue-500" />
                Preventive Health
              </h3>
              <button 
                onClick={() => setModalInfo({ 
                  title: "Preventive Care", 
                  content: "By monitoring physical markers like fatigue and sleep alongside mood, we help you identify early signs of burnout or health issues before they escalate."
                })}
                className="text-blue-300 hover:text-blue-600 transition-colors"
              >
                <Info size={14} />
              </button>
            </div>
            
            <div className="space-y-4">
              {result?.preventiveTips.map((tip: string, i: number) => (
                <div key={i} className="flex gap-4 items-start p-5 bg-white border border-blue-50 rounded-2xl shadow-sm">
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 size={12} className="text-white" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700 leading-relaxed">{tip}</p>
                </div>
              ))}
              {(!result || result.preventiveTips.length === 0) && (
                <p className="text-slate-400 text-sm italic px-2">System analyzing preventive health data...</p>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Right Column */}
      <div className="col-span-12 lg:col-span-4 flex flex-col gap-8">
        <section className="wellness-card bg-slate-900 text-white relative border-none">
          <div className="flex items-center gap-3 mb-6">
            <Info size={20} className="text-blue-400" />
            <h3 className="font-black text-xs uppercase tracking-widest">Self-Care Protocol</h3>
          </div>
          <p className="text-sm font-medium leading-relaxed italic text-slate-300">
            "{RESOURCES[Math.floor(Math.random() * RESOURCES.length)].content}"
          </p>
          <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center">
            <button 
              onClick={() => setModalInfo({ 
                title: "Wellness Protocol", 
                content: "Daily self-reflection and symptom tracking are scientifically linked to better emotional regulation and early detection of medical issues in young adults." 
              })}
              className="text-[10px] font-black uppercase tracking-widest opacity-50 hover:opacity-100 transition-opacity flex items-center gap-2"
            >
              Why this? <Info size={12} />
            </button>
            <button onClick={() => setView('resources')} className="text-blue-400 hover:text-blue-300">
              <BookOpen size={14} />
            </button>
          </div>
        </section>

        <section className="wellness-card">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 px-1">Recent Activity</h3>
          <div className="space-y-6">
            {moodLogs.slice(0, 3).map((log: any) => (
              <div key={log.id} className="flex items-start gap-4">
                <div className="text-2xl pt-1">{getEmoji(log.mood)}</div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{log.mood}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                    {new Date(log.timestamp?.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            <button onClick={() => setView('history')} className="w-full py-4 text-[10px] font-black text-blue-600 uppercase tracking-widest border-t border-slate-50 mt-2 hover:translate-x-1 transition-transform flex items-center justify-center gap-2">
              Full History <ChevronRight size={14} />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

const getEmoji = (mood: string) => {
  switch (mood) {
    case 'Happy': return '😊';
    case 'Neutral': return '😐';
    case 'Sad': return '😢';
    case 'Anxious': return '😰';
    case 'Stressed': return '😫';
    case 'Angry': return '😡';
    default: return '❓';
  }
};

function MoodLoggerView({ onComplete, userId }: { onComplete: () => void, userId: string }) {
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const moods: { type: MoodType, emoji: string, color: string }[] = [
    { type: 'Happy', emoji: '😊', color: 'bg-blue-50 text-blue-700' },
    { type: 'Neutral', emoji: '😐', color: 'bg-slate-100 text-slate-700' },
    { type: 'Sad', emoji: '😢', color: 'bg-blue-100 text-blue-800' },
    { type: 'Anxious', emoji: '😰', color: 'bg-indigo-100 text-indigo-700' },
    { type: 'Stressed', emoji: '😫', color: 'bg-slate-200 text-slate-800' },
    { type: 'Angry', emoji: '😡', color: 'bg-red-50 text-red-700' },
  ];

  const handleSave = async () => {
    if (!selectedMood) return;
    setSaving(true);
    const path = `users/${userId}/mood_logs`;
    try {
      await addDoc(collection(db, path), {
        userId,
        mood: selectedMood,
        note,
        timestamp: serverTimestamp()
      });
      onComplete();
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-10">
      <section>
        <button onClick={onComplete} className="text-slate-400 mb-6 hover:text-slate-600 flex items-center gap-2 text-xs font-black uppercase tracking-widest">
          <ChevronRight className="rotate-180" size={16} /> Back to Dashboard
        </button>
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-2">Mood Log</h1>
        <p className="text-slate-500 font-medium italic">What's the energy like today?</p>
      </section>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {moods.map((m) => (
          <button
            key={m.type}
            onClick={() => setSelectedMood(m.type)}
            className={`flex flex-col items-center justify-center p-8 rounded-3xl transition-all border ${
              selectedMood === m.type 
                ? `${m.color} border-current ring-4 ring-current/10 scale-105` 
                : 'bg-white text-slate-400 border-slate-100 shadow-sm hover:scale-[1.03]'
            }`}
          >
            <span className="text-5xl mb-4">{m.emoji}</span>
            <span className="text-[10px] font-black uppercase tracking-widest">{m.type}</span>
          </button>
        ))}
      </div>

      <section className="space-y-4">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Personal Note</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Briefly describe what's on your mind..."
          className="input-field min-h-[160px] p-6 text-base"
        />
      </section>

      <button
        disabled={!selectedMood || saving}
        onClick={handleSave}
        className="btn-primary w-full py-5 text-[12px] uppercase tracking-widest shadow-xl shadow-blue-100"
      >
        {saving ? 'Transmitting Data...' : 'Confirm Mood Entry'}
      </button>
    </div>
  );
}

function SymptomLoggerView({ onComplete, userId }: { onComplete: () => void, userId: string }) {
  const [selected, setSelected] = useState<SymptomType[]>([]);
  const [saving, setSaving] = useState(false);

  const toggle = (s: SymptomType) => {
    if (selected.includes(s)) setSelected(selected.filter(i => i !== s));
    else setSelected([...selected, s]);
  };

  const handleSave = async () => {
    setSaving(true);
    const path = `users/${userId}/symptom_logs`;
    try {
      await addDoc(collection(db, path), {
        userId,
        symptoms: selected,
        timestamp: serverTimestamp()
      });
      onComplete();
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <section>
        <button onClick={onComplete} className="text-slate-400 mb-6 hover:text-slate-600 flex items-center gap-2 text-xs font-black uppercase tracking-widest">
          <ChevronRight className="rotate-180" size={16} /> Back to Dashboard
        </button>
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-2">Symptom Log</h1>
        <p className="text-slate-500 font-medium italic">Select any markers present in your current state.</p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SYMPTOMS.map(s => (
          <button
            key={s}
            onClick={() => toggle(s)}
            className={`w-full p-6 bg-white border rounded-2xl flex justify-between items-center transition-all ${
              selected.includes(s) ? 'bg-blue-50 border-blue-600 shadow-sm' : 'border-slate-100 hover:bg-slate-50'
            }`}
          >
            <span className={`font-bold transition-all text-sm ${selected.includes(s) ? 'text-blue-700' : 'text-slate-600'}`}>{s}</span>
            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ${
              selected.includes(s) ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200'
            }`}>
              {selected.includes(s) && <CheckCircle2 size={14} />}
            </div>
          </button>
        ))}
      </div>

      <button
        disabled={saving}
        onClick={handleSave}
        className="btn-primary w-full py-5 text-[12px] uppercase tracking-widest shadow-xl shadow-blue-100"
      >
        {saving ? 'Transmitting Data...' : 'Confirm Symptoms'}
      </button>
    </div>
  );
}

function HistoryView({ moodLogs, symptomLogs, onBack }: { moodLogs: any[], symptomLogs: any[], onBack: () => void }) {
  const [activeTab, setActiveTab ] = useState<'mood' | 'symptoms'>('mood');

  const formatDate = (ts: any) => {
    if (!ts) return '';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleDateString('en-NG', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).toUpperCase();
  };

  return (
    <div className="space-y-10">
      <button onClick={onBack} className="text-slate-400 hover:text-slate-600 flex items-center gap-2 text-xs font-black uppercase tracking-widest">
        <ChevronRight className="rotate-180" size={16} /> Back to Dashboard
      </button>

      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-2">History</h1>
          <p className="text-slate-500 font-medium italic">Tracking your wellness markers over time.</p>
        </div>
        <div className="flex bg-slate-200/50 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('mood')}
            className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'mood' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
          >
            Moods
          </button>
          <button 
            onClick={() => setActiveTab('symptoms')}
            className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'symptoms' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}
          >
            Symptoms
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {activeTab === 'mood' ? (
          moodLogs.length === 0 ? (
            <div className="col-span-2 text-center py-20 text-slate-400 font-bold uppercase tracking-widest italic border-2 border-dashed border-slate-100 rounded-3xl">No data found.</div>
          ) : (
            moodLogs.map(log => (
              <div key={log.id} className="wellness-card flex items-start gap-6 hover:translate-y-[-2px] transition-transform">
                <div className="text-4xl shrink-0">{getEmoji(log.mood)}</div>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-baseline">
                    <h4 className="font-black text-slate-900 uppercase tracking-tighter">{log.mood}</h4>
                    <span className="text-[10px] text-slate-300 font-black uppercase">{formatDate(log.timestamp)}</span>
                  </div>
                  {log.note && <p className="text-xs text-slate-500 leading-relaxed font-medium pt-2 italic">"{log.note}"</p>}
                </div>
              </div>
            ))
          )
        ) : (
          symptomLogs.length === 0 ? (
            <div className="col-span-2 text-center py-20 text-slate-400 font-bold uppercase tracking-widest italic border-2 border-dashed border-slate-100 rounded-3xl">No data found.</div>
          ) : (
            symptomLogs.map(log => (
              <div key={log.id} className="wellness-card space-y-4">
                <div className="flex justify-between items-baseline mb-2">
                  <h4 className="font-black text-slate-900 uppercase tracking-tighter">Markers Recorded</h4>
                  <span className="text-[10px] text-slate-300 font-black uppercase">{formatDate(log.timestamp)}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {log.symptoms.length === 0 ? (
                    <span className="text-xs text-slate-400 italic">No markers detected.</span>
                  ) : (
                    log.symptoms.map((s: string) => (
                      <span key={s} className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-4 py-1.5 rounded-lg border border-emerald-100 uppercase tracking-wider">
                        {s}
                      </span>
                    ))
                  )}
                </div>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
}

function ResourcesView({ setModalInfo, onBack }: { setModalInfo: (info: { title: string, content: string } | null) => void, onBack: () => void }) {
  return (
    <div className="space-y-12">
      <button onClick={onBack} className="text-slate-400 hover:text-slate-600 flex items-center gap-2 text-xs font-black uppercase tracking-widest">
        <ChevronRight className="rotate-180" size={16} /> Back to Dashboard
      </button>

      <section>
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-2">Help Library</h1>
        <p className="text-slate-500 font-medium italic">Verified mental health and preventive healthcare resources for Nigerians.</p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <section className="space-y-6">
          <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] px-1">Crisis Helplines</h3>
          <div className="space-y-4">
            {HELPLINES.map(h => (
              <a key={h.name} href={`tel:${h.number.replace(/\s/g, '')}`} className="wellness-card flex items-center justify-between hover:bg-blue-50 group border-slate-100">
                <div className="space-y-1">
                  <h4 className="font-black text-slate-900 uppercase tracking-tighter">{h.name}</h4>
                  <p className="text-sm text-blue-600 font-bold tracking-tighter">{h.number}</p>
                </div>
                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <Phone size={20} />
                </div>
              </a>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <h3 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em] px-1">Healthcare Toolkits</h3>
          <div className="grid grid-cols-1 gap-4">
            {RESOURCES.map(r => (
              <div key={r.title} className="wellness-card bg-emerald-50/20 border-emerald-100/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg text-emerald-600 shadow-sm">
                      <Activity size={18} />
                    </div>
                    <h4 className="font-black text-slate-900 uppercase tracking-tighter">{r.title}</h4>
                  </div>
                  <button 
                    onClick={() => setModalInfo({ title: r.title, content: `${r.content} This information is based on public health guidelines for young adults in Nigeria.` })}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                  >
                    <Info size={18} />
                  </button>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">{r.content}</p>
                {r.fullGuide && (
                  <button 
                    onClick={() => window.open(r.fullGuide, '_blank')}
                    className="mt-6 text-[10px] font-black text-emerald-600 hover:translate-x-1 transition-transform flex items-center gap-2 uppercase tracking-widest"
                  >
                    View full guide <ChevronRight size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function ProfileEditView({ profile, userId, onBack }: { profile: any, userId: string, onBack: () => void }) {
  const [name, setName] = useState(profile?.name || '');
  const [age, setAge] = useState(profile?.age?.toString() || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const parsedAge = parseInt(age);
    if (!name || isNaN(parsedAge) || parsedAge < 15 || parsedAge > 35) {
      alert("Please provide a valid name and age (15-35).");
      return;
    }

    setSaving(true);
    const path = `users/${userId}`;
    try {
      await setDoc(doc(db, path), {
        name,
        age: parsedAge,
        updatedAt: serverTimestamp()
      }, { merge: true });
      onBack();
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-10">
      <section>
        <button onClick={onBack} className="text-slate-400 mb-6 hover:text-slate-600 flex items-center gap-2 text-xs font-black uppercase tracking-widest">
          <ChevronRight className="rotate-180" size={16} /> Back to Dashboard
        </button>
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-2">Edit Profile</h1>
        <p className="text-slate-500 font-medium italic">Update your information for personalized tracking.</p>
      </section>

      <div className="space-y-6">
        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Display Name</label>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field py-4 px-6 text-lg font-bold"
          />
        </div>
        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Age (15-35)</label>
          <input 
            type="number" 
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="input-field py-4 px-6 text-lg font-bold"
            min="15"
            max="35"
          />
        </div>
      </div>

      <button
        disabled={saving}
        onClick={handleSave}
        className="btn-primary w-full py-5 text-[12px] uppercase tracking-widest shadow-xl shadow-blue-100"
      >
        {saving ? 'Updating Profile...' : 'Save Changes'}
      </button>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
