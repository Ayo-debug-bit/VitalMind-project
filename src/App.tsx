import { useState, useEffect, ReactNode, useRef } from 'react';
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
  User, 
  Download, 
  Trash2, 
  Clock, 
  Lock, 
  Eye, 
  ShieldCheck, 
  ShieldAlert, 
  Sparkles, 
  Volume2,
  Compass,
  Copy
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthScreens } from './components/AuthScreens';
import { jsPDF } from 'jspdf';
import { OnboardingFlow } from './components/OnboardingFlow';
import { InteractiveTour } from './components/InteractiveTour';
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
import { LANGUAGES, TRANSLATIONS, Locale } from './lib/multilingual';
import { 
  DoctorAppointment, 
  MedicationReminder, 
  SafetyContact, 
  getContextualTip, 
  calculateStreak, 
  generateWellnessReport 
} from './lib/additionalFeatures';
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
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

const resolveDate = (ts: any): Date => {
  if (!ts) return new Date();
  if (typeof ts.toDate === 'function') return ts.toDate();
  if (ts.seconds !== undefined) return new Date(ts.seconds * 1000);
  if (typeof ts === 'string' || typeof ts === 'number') return new Date(ts);
  try {
    const d = new Date(ts);
    if (!isNaN(d.getTime())) return d;
  } catch (e) {
    // Graceful fallback
  }
  return new Date();
};

export function calculateAge(dobString: string): number {
  if (!dobString) return 0;
  const birthDate = new Date(dobString);
  const today = new Date();
  let computedAge = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    computedAge--;
  }
  return computedAge;
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

type View = 'dashboard' | 'mood' | 'symptoms' | 'history' | 'resources' | 'profile' | 'crisis';

function AppContent() {
  const { user, login, logout, loading } = useAuth();
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('vitalmind_theme') as 'light' | 'dark') || 'light';
  });
  const [moodLogs, setMoodLogs] = useState<any[]>([]);
  const [symptomLogs, setSymptomLogs] = useState<any[]>([]);
  const [wellnessResult, setWellnessResult] = useState<EvaluationResult | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showInteractiveTour, setShowInteractiveTour] = useState(false);
  const [age, setAge] = useState('');
  const [profile, setProfile] = useState<any>(null);
  const [modalInfo, setModalInfo] = useState<{ title: string, content: string } | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showCrisisView, setShowCrisisView] = useState(false);
  const [activeNotification, setActiveNotification] = useState<{ title: string; body: string } | null>(null);
  const [easyMode, setEasyMode] = useState<boolean>(() => {
    return localStorage.getItem('vitalmind_easy_mode') === 'true';
  });

  const speakText = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  // New States for 13 Requested Wellness Features
  const [locale, setLocale] = useState<Locale>(() => {
    return (localStorage.getItem('vitalmind_locale') as Locale) || 'en';
  });
  const [safetyContacts, setSafetyContacts] = useState<SafetyContact[]>([]);
  const [doctorAppointments, setDoctorAppointments] = useState<DoctorAppointment[]>([]);
  const [medReminders, setMedReminders] = useState<MedicationReminder[]>([]);
  const [communityVote, setCommunityVote] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState<boolean>(typeof window !== 'undefined' ? !window.navigator.onLine : false);
  const [activeSupportTip, setActiveSupportTip] = useState<string | null>(null);

  const t = TRANSLATIONS[locale] || TRANSLATIONS['en'];

  // Sync state from profile when loaded
  useEffect(() => {
    if (profile?.theme) {
      setTheme(profile.theme);
    }
    if (profile?.locale) {
      setLocale(profile.locale);
    }
  }, [profile]);

  // Synchronize document.documentElement dark class with theme state
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [theme]);

  // Offline handler effect
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const goOnline = () => setIsOffline(false);
    const goOffline = () => setIsOffline(true);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // Sync additional data features
  useEffect(() => {
    if (!user) return;

    if (user.uid === 'guest-user') {
      const loadGuestFeatures = () => {
        const localConts = localStorage.getItem('vitalmind_safety_contacts_guest');
        setSafetyContacts(localConts ? JSON.parse(localConts) : []);

        const localApps = localStorage.getItem('vitalmind_doctor_appointments_guest');
        setDoctorAppointments(localApps ? JSON.parse(localApps) : []);

        const localMeds = localStorage.getItem('vitalmind_medication_reminders_guest');
        setMedReminders(localMeds ? JSON.parse(localMeds) : []);

        const localVote = localStorage.getItem('vitalmind_community_vote_guest');
        setCommunityVote(localVote || null);
      };
      loadGuestFeatures();
      window.addEventListener('vitalmind_guest_data_changed', loadGuestFeatures);
      return () => {
        window.removeEventListener('vitalmind_guest_data_changed', loadGuestFeatures);
      };
    } else {
      const unsubSafety = onSnapshot(query(collection(db, `users/${user.uid}/safety_contacts`)), snap => {
        setSafetyContacts(snap.docs.map(d => ({ id: d.id, ...d.data() } as SafetyContact)));
      }, err => handleFirestoreError(err, OperationType.GET, `users/${user.uid}/safety_contacts`));

      const unsubApps = onSnapshot(query(collection(db, `users/${user.uid}/doctor_appointments`), orderBy('createdAt', 'desc')), snap => {
        setDoctorAppointments(snap.docs.map(d => ({ id: d.id, ...d.data() } as DoctorAppointment)));
      }, err => handleFirestoreError(err, OperationType.GET, `users/${user.uid}/doctor_appointments`));

      const unsubMeds = onSnapshot(query(collection(db, `users/${user.uid}/medication_reminders`)), snap => {
        setMedReminders(snap.docs.map(d => ({ id: d.id, ...d.data() } as MedicationReminder)));
      }, err => handleFirestoreError(err, OperationType.GET, `users/${user.uid}/medication_reminders`));

      const cachedVote = localStorage.getItem(`vitalmind_community_vote_${user.uid}`);
      setCommunityVote(cachedVote || null);

      return () => {
        unsubSafety();
        unsubApps();
        unsubMeds();
      };
    }
  }, [user]);

  // Medication in-app triggers
  useEffect(() => {
    if (medReminders.length === 0) return;
    const checkMeds = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const currentHourMin = `${hours}:${minutes}`;
      
      medReminders.forEach((med: any) => {
        if (!med.enabled || med.timeOfDay !== currentHourMin) return;
        
        const todayStr = now.toDateString();
        const triggerKey = `vitalmind_med_last_trigger_${med.id}_${todayStr}`;
        if (localStorage.getItem(triggerKey) === 'true') return;

        const bodyText = `Take medicine: ${med.medicationName}. Dosage: ${med.dosage || '1 dose'}.`;
        setActiveNotification({ title: "Medication Reminder", body: bodyText });
        localStorage.setItem(triggerKey, 'true');

        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification("VitalMind Medication Alert", {
              body: bodyText,
              icon: '/favicon.ico'
            });
          } catch (e) {
            console.error("Popup error:", e);
          }
        }
      });
    };

    // Run check immediately
    checkMeds();

    // Check more frequently (every 15 seconds) so it's snappy and reliable
    const medInterval = setInterval(checkMeds, 15000); 

    return () => clearInterval(medInterval);
  }, [medReminders]);

  // Additional features mutation helpers
  const addSafetyContact = async (name: string, relationship: string, phone: string, email: string = '') => {
    if (!user) return;
    const newContact = { name, relationship, phone, email, createdAt: new Date().toISOString() };
    if (user.uid === 'guest-user') {
      const updated = [{ id: Math.random().toString(36).substring(2), ...newContact }, ...safetyContacts];
      localStorage.setItem('vitalmind_safety_contacts_guest', JSON.stringify(updated));
      window.dispatchEvent(new Event('vitalmind_guest_data_changed'));
    } else {
      await addDoc(collection(db, `users/${user.uid}/safety_contacts`), newContact);
    }
  };

  const deleteSafetyContact = async (id: string) => {
    if (!user) return;
    if (user.uid === 'guest-user') {
      const updated = safetyContacts.filter((s: any) => s.id !== id);
      localStorage.setItem('vitalmind_safety_contacts_guest', JSON.stringify(updated));
      window.dispatchEvent(new Event('vitalmind_guest_data_changed'));
    } else {
      await deleteDoc(doc(db, `users/${user.uid}/safety_contacts`, id));
    }
  };

  const addDoctorAppointment = async (doctorName: string, dateTime: string, discussedNotes: string, clinicalAdvice: string) => {
    if (!user) return;
    const newApp = {
      doctorName,
      dateTime,
      discussedNotes,
      clinicalAdvice,
      completed: false,
      createdAt: new Date().toISOString()
    };
    if (user.uid === 'guest-user') {
      const updated = [{ id: Math.random().toString(36).substring(2), ...newApp }, ...doctorAppointments];
      localStorage.setItem('vitalmind_doctor_appointments_guest', JSON.stringify(updated));
      window.dispatchEvent(new Event('vitalmind_guest_data_changed'));
    } else {
      await addDoc(collection(db, `users/${user.uid}/doctor_appointments`), newApp);
    }
  };

  const deleteDoctorAppointment = async (id: string) => {
    if (!user) return;
    if (user.uid === 'guest-user') {
      const updated = doctorAppointments.filter((d: any) => d.id !== id);
      localStorage.setItem('vitalmind_doctor_appointments_guest', JSON.stringify(updated));
      window.dispatchEvent(new Event('vitalmind_guest_data_changed'));
    } else {
      await deleteDoc(doc(db, `users/${user.uid}/doctor_appointments`, id));
    }
  };

  const addMedicationReminder = async (medicationName: string, dosage: string, timeOfDay: string) => {
    if (!user) return;
    const newMed = { medicationName, dosage, timeOfDay, enabled: true };
    if (user.uid === 'guest-user') {
      const updated = [{ id: Math.random().toString(36).substring(2), ...newMed }, ...medReminders];
      localStorage.setItem('vitalmind_medication_reminders_guest', JSON.stringify(updated));
      window.dispatchEvent(new Event('vitalmind_guest_data_changed'));
    } else {
      await addDoc(collection(db, `users/${user.uid}/medication_reminders`), newMed);
    }
  };

  const toggleMedicationReminder = async (id: string, enabled: boolean) => {
    if (!user) return;
    if (user.uid === 'guest-user') {
      const updated = medReminders.map((m: any) => m.id === id ? { ...m, enabled } : m);
      localStorage.setItem('vitalmind_medication_reminders_guest', JSON.stringify(updated));
      window.dispatchEvent(new Event('vitalmind_guest_data_changed'));
    } else {
      await setDoc(doc(db, `users/${user.uid}/medication_reminders`, id), { enabled }, { merge: true });
    }
  };

  const deleteMedicationReminder = async (id: string) => {
    if (!user) return;
    if (user.uid === 'guest-user') {
      const updated = medReminders.filter((m: any) => m.id !== id);
      localStorage.setItem('vitalmind_medication_reminders_guest', JSON.stringify(updated));
      window.dispatchEvent(new Event('vitalmind_guest_data_changed'));
    } else {
      await deleteDoc(doc(db, `users/${user.uid}/medication_reminders`, id));
    }
  };

  const submitCommunityVote = (vote: string) => {
    if (!user) return;
    setCommunityVote(vote);
    const storageKey = user.uid === 'guest-user' ? 'vitalmind_community_vote_guest' : `vitalmind_community_vote_${user.uid}`;
    localStorage.setItem(storageKey, vote);
  };

  // Listen for active personalized support tips
  useEffect(() => {
    const handleTipEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.tip) {
        setActiveSupportTip(customEvent.detail.tip);
      }
    };
    window.addEventListener('vitalmind_show_tip', handleTipEvent);
    return () => {
      window.removeEventListener('vitalmind_show_tip', handleTipEvent);
    };
  }, []);

  // Core Smart Reminder System Listener and Scheduler daemon
  useEffect(() => {
    const handleTestNotificationEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setActiveNotification(customEvent.detail);
      }
    };
    window.addEventListener('vitalmind_test_notification', handleTestNotificationEvent);

    if (!profile || profile.reminderEnabled === false) {
      return () => {
        window.removeEventListener('vitalmind_test_notification', handleTestNotificationEvent);
      };
    }

    const interval = setInterval(() => {
      const now = new Date();
      const rTime = profile.reminderTime || '09:00';
      const [rHour, rMin] = rTime.split(':').map(Number);

      if (now.getHours() === rHour && now.getMinutes() === rMin) {
        const todayStr = now.toDateString();
        const lastTriggered = localStorage.getItem('vitalmind_last_reminder_trigger_day');
        if (lastTriggered === todayStr) return; 

        let daysSinceLastLog = 0;
        if (moodLogs && moodLogs.length > 0) {
          const lastLog = moodLogs[0];
          const lastLogDate = resolveDate(lastLog.timestamp);
          const diffMs = Math.abs(now.getTime() - lastLogDate.getTime());
          daysSinceLastLog = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        } else {
          daysSinceLastLog = 0;
        }

        if (daysSinceLastLog >= 7) {
          const reminderShutdownTriggered = localStorage.getItem('vitalmind_reminder_system_disabled_by_inactivity');
          if (reminderShutdownTriggered === 'true') {
            return; 
          }
          
          const alertBody = `It's been a while. We're here whenever you're ready.`;
          triggerDeviceNotification(alertBody);
          localStorage.setItem('vitalmind_reminder_system_disabled_by_inactivity', 'true');
          localStorage.setItem('vitalmind_last_reminder_trigger_day', todayStr);
          return;
        }

        localStorage.removeItem('vitalmind_reminder_system_disabled_by_inactivity');

        let alertBody = `How are you feeling today, ${profile.name || 'friend'}? Tap to log your mood.`;
        if (daysSinceLastLog >= 3) {
          alertBody = `We've missed you, ${profile.name || 'friend'}. Your wellness matters — even a quick check-in helps.`;
        }

        triggerDeviceNotification(alertBody);
        localStorage.setItem('vitalmind_last_reminder_trigger_day', todayStr);
      }
    }, 30000); 

    const triggerDeviceNotification = (bodyText: string) => {
      const titleText = "VitalMind Check-in";
      setActiveNotification({ title: titleText, body: bodyText });

      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          const notif = new Notification(titleText, {
            body: bodyText,
            icon: '/favicon.ico'
          });
          notif.onclick = () => {
            setCurrentView('mood');
            window.focus();
          };
        } catch (e) {
          console.error("Popup error:", e);
        }
      }
    };

    return () => {
      clearInterval(interval);
      window.removeEventListener('vitalmind_test_notification', handleTestNotificationEvent);
    };
  }, [profile, moodLogs]);

  useEffect(() => {
    if (moodLogs && moodLogs.length > 0) {
      localStorage.removeItem('vitalmind_reminder_system_disabled_by_inactivity');
    }
  }, [moodLogs]);

  // Sync data from Firebase
  useEffect(() => {
    if (!user) return;

    if (user.uid === 'guest-user') {
      const loadGuestData = () => {
        const localMoodsRaw = localStorage.getItem('vitalmind_mood_logs_guest');
        const localMoods = localMoodsRaw ? JSON.parse(localMoodsRaw) : [];
        setMoodLogs(localMoods);

        const localSymptomsRaw = localStorage.getItem('vitalmind_symptom_logs_guest');
        const localSymptoms = localSymptomsRaw ? JSON.parse(localSymptomsRaw) : [];
        setSymptomLogs(localSymptoms);

        const localProfileRaw = localStorage.getItem('vitalmind_profile_guest');
        if (localProfileRaw) {
          setProfile(JSON.parse(localProfileRaw));
        } else {
          setShowOnboarding(true);
        }
      };

      loadGuestData();

      window.addEventListener('vitalmind_guest_data_changed', loadGuestData);
      return () => {
        window.removeEventListener('vitalmind_guest_data_changed', loadGuestData);
      };
    }

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
    if (moodLogs.length > 0 || symptomLogs.length > 0) {
      const currentMood = moodLogs.length > 0 ? (moodLogs[0].mood as MoodType) : "Neutral" as MoodType;
      const recentMoods = moodLogs.length > 0 ? moodLogs.slice(1).map(m => m.mood as MoodType) : [];
      const recentSymptomsHistory = symptomLogs.map(s => s.symptoms as SymptomType[]);
      const currentSymptoms = recentSymptomsHistory.length > 0 ? recentSymptomsHistory[0] : [];
      const pastSymptoms = recentSymptomsHistory.slice(1);
      
      const result = evaluateWellness(currentMood, recentMoods, currentSymptoms, pastSymptoms);
      setWellnessResult(result);

      if (user && profile && profile.lastState !== result.state) {
        if (user.uid === 'guest-user') {
          const localProfileRaw = localStorage.getItem('vitalmind_profile_guest');
          const localProfile = localProfileRaw ? JSON.parse(localProfileRaw) : {};
          const updated = {
            ...localProfile,
            lastState: result.state,
            updatedAt: new Date().toISOString()
          };
          localStorage.setItem('vitalmind_profile_guest', JSON.stringify(updated));
          setProfile(updated);
          return;
          }

        const path = `users/${user.uid}`;
        setDoc(doc(db, path), {
          lastState: result.state,
          updatedAt: serverTimestamp()
        }, { merge: true }).catch(e => handleFirestoreError(e, OperationType.WRITE, path));
      }
    }
  }, [moodLogs, symptomLogs, user, profile]);

  const handleOnboardingComplete = async (data: {
    name: string;
    age: number;
    dob: string;
    reminderEnabled: boolean;
    reminderTime: string;
    securityQuestion: string;
    securityAnswer: string;
    locale: Locale;
    baselineAnswers: Record<string, number>;
  }) => {
    if (!user) return;

    const baseScore = Object.values(data.baselineAnswers).reduce((acc, curr) => acc + curr, 0);

    if (user.uid === 'guest-user') {
      try {
        const { hashAnswer } = await import('./context/AuthContext');
        const hashed = await hashAnswer(data.securityAnswer);
        const profileData = {
          uid: user.uid,
          name: data.name,
          email: user.email,
          age: data.age,
          dob: data.dob,
          username: 'guest',
          securityQuestion: data.securityQuestion,
          securityAnswer: hashed,
          reminderEnabled: data.reminderEnabled,
          reminderTime: data.reminderTime,
          locale: data.locale,
          baselineAnswers: data.baselineAnswers,
          baselineScore: baseScore,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem('vitalmind_profile_guest', JSON.stringify(profileData));
        window.dispatchEvent(new Event('vitalmind_guest_data_changed'));
        setLocale(data.locale);
        setShowOnboarding(false);
        setShowInteractiveTour(true);
      } catch (e) {
        console.error("Guest onboarding error:", e);
      }
      return;
    }

    const path = `users/${user.uid}`;
    try {
      const userDoc = await getDoc(doc(db, path));
      
      const { hashAnswer } = await import('./context/AuthContext');
      const hashed = await hashAnswer(data.securityAnswer);

      const profileData: any = {
        uid: user.uid,
        name: data.name,
        email: user.email,
        age: data.age,
        dob: data.dob,
        username: userDoc.exists() ? userDoc.data().username : (user.displayName || user.uid),
        securityQuestion: data.securityQuestion,
        securityAnswer: hashed,
        reminderEnabled: data.reminderEnabled,
        reminderTime: data.reminderTime,
        locale: data.locale,
        baselineAnswers: data.baselineAnswers,
        baselineScore: baseScore,
        updatedAt: serverTimestamp()
      };
      
      if (!userDoc.exists()) {
        profileData.createdAt = serverTimestamp();
      }

      await setDoc(doc(db, path), profileData, { merge: true });

      const lookupUname = profileData.username || (userDoc.exists() ? userDoc.data()?.username : null);
      if (lookupUname) {
        await setDoc(doc(db, 'usernames', lookupUname.toLowerCase().trim()), {
          uid: user.uid,
          email: user.email?.toLowerCase().trim() || '',
          securityQuestion: data.securityQuestion,
          hashedAnswer: hashed
        }, { merge: true });
      }

      setLocale(data.locale);
      setShowOnboarding(false);
      setShowInteractiveTour(true);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  };

  const handleOnboardingCancel = async () => {
    if (!user) return;

    if (user.uid === 'guest-user') {
      try {
        const profileData = {
          uid: 'guest-user',
          name: 'Guest User',
          email: 'guest@vitalmind.app',
          age: 18,
          dob: '2008-01-01',
          username: 'guest',
          securityQuestion: 'What is your favorite color?',
          securityAnswer: 'blue',
          reminderEnabled: false,
          reminderTime: '08:00',
          locale: locale || 'en',
          baselineAnswers: {},
          baselineScore: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem('vitalmind_profile_guest', JSON.stringify(profileData));
        window.dispatchEvent(new Event('vitalmind_guest_data_changed'));
        setProfile(profileData);
        setShowOnboarding(false);
      } catch (e) {
        console.error("Guest onboarding skip error:", e);
      }
      return;
    }

    const path = `users/${user.uid}`;
    try {
      const userDoc = await getDoc(doc(db, path));
      const { hashAnswer } = await import('./context/AuthContext');
      const hashed = await hashAnswer('blue');
      
      const profileData: any = {
        uid: user.uid,
        name: user.displayName || 'User',
        email: user.email || '',
        age: 18,
        dob: '2008-01-01',
        username: userDoc.exists() ? userDoc.data().username : (user.displayName || user.uid).replace(/[^a-zA-Z0-9]/g, '').toLowerCase(),
        securityQuestion: 'What is your favorite color?',
        securityAnswer: hashed,
        reminderEnabled: false,
        reminderTime: '08:00',
        locale: locale || 'en',
        baselineAnswers: {},
        baselineScore: 0,
        updatedAt: serverTimestamp()
      };
      
      if (!userDoc.exists()) {
        profileData.createdAt = serverTimestamp();
      }

      await setDoc(doc(db, path), profileData, { merge: true });
      setProfile(profileData);
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
      <>
        <AuthScreens 
          onCrisisClick={() => setShowCrisisView(true)}
          onSuccess={(isNewUser) => {
            if (isNewUser) {
              setShowOnboarding(true);
            }
          }}
        />

        <AnimatePresence>
          {showCrisisView && (
            <CrisisOverlay onClose={() => setShowCrisisView(false)} />
          )}
        </AnimatePresence>
      </>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <DashboardView moodLogs={moodLogs} result={wellnessResult} setView={setCurrentView} profile={profile} communityVote={communityVote} submitVote={submitCommunityVote} setLocale={setLocale} tLocale={locale} setModalInfo={setModalInfo} easyMode={easyMode} speakText={speakText} triggerTour={() => setShowInteractiveTour(true)} />;
      case 'mood': return <MoodLoggerView onComplete={() => setCurrentView('dashboard')} userId={user.uid} />;
      case 'symptoms': return <SymptomLoggerView onComplete={() => setCurrentView('dashboard')} onNavigateToCrisis={() => setCurrentView('crisis')} userId={user.uid} />;
      case 'history': return (
        <HistoryView 
          moodLogs={moodLogs} 
          symptomLogs={symptomLogs} 
          doctorAppointments={doctorAppointments}
          addDoctorAppointment={addDoctorAppointment}
          deleteDoctorAppointment={deleteDoctorAppointment}
          onBack={() => setCurrentView('dashboard')} 
          user={user}
          profile={profile}
          streak={calculateStreak(moodLogs).currentStreak}
          easyMode={easyMode}
          speakText={speakText}
        />
      );
      case 'resources': return <ResourcesView setModalInfo={setModalInfo} onBack={() => setCurrentView('dashboard')} easyMode={easyMode} speakText={speakText} />;
      case 'profile': return (
        <ProfileEditView 
          profile={profile} 
          userId={user.uid} 
          medReminders={medReminders}
          addMedicationReminder={addMedicationReminder}
          toggleMedicationReminder={toggleMedicationReminder}
          deleteMedicationReminder={deleteMedicationReminder}
          safetyContacts={safetyContacts}
          addSafetyContact={addSafetyContact}
          deleteSafetyContact={deleteSafetyContact}
          systemLocale={locale}
          saveLocale={async (loc: any) => {
            setLocale(loc);
            if (user && user.uid !== 'guest-user') {
              await setDoc(doc(db, `users/${user.uid}`), { locale: loc }, { merge: true });
            } else if (user) {
              const localProfileRaw = localStorage.getItem('vitalmind_profile_guest');
              const localProfile = localProfileRaw ? JSON.parse(localProfileRaw) : {};
              localStorage.setItem('vitalmind_profile_guest', JSON.stringify({ ...localProfile, locale: loc }));
              window.dispatchEvent(new Event('vitalmind_guest_data_changed'));
            }
          }}
          theme={theme}
          setTheme={async (t: 'light' | 'dark') => {
            setTheme(t);
            localStorage.setItem('vitalmind_theme', t);
            if (user && user.uid !== 'guest-user') {
              await setDoc(doc(db, `users/${user.uid}`), { theme: t }, { merge: true });
            } else if (user) {
              const localProfileRaw = localStorage.getItem('vitalmind_profile_guest');
              const localProfile = localProfileRaw ? JSON.parse(localProfileRaw) : {};
              localStorage.setItem('vitalmind_profile_guest', JSON.stringify({ ...localProfile, theme: t }));
              window.dispatchEvent(new Event('vitalmind_guest_data_changed'));
            }
          }}
          easyMode={easyMode}
          setEasyMode={(val: boolean) => {
            setEasyMode(val);
            localStorage.setItem('vitalmind_easy_mode', val ? 'true' : 'false');
          }}
          speakText={speakText}
          triggerTour={() => setShowInteractiveTour(true)}
          onBack={() => setCurrentView('dashboard')} 
        />
      );
      case 'crisis': return <CrisisView safetyContacts={safetyContacts} onBack={() => setCurrentView('dashboard')} />;
    }
  };

  return (
    <div className={`flex h-screen overflow-hidden font-sans transition-all ${theme === 'dark' ? 'dark bg-[#131F24] text-slate-100' : 'bg-linear-to-tr from-[#E6F4FE] via-[#F3F8FC] to-[#F9FAFB] text-slate-900'}`}>
      {/* Sidebar - High Density Design */}
      <aside className={`w-72 border-r flex flex-col hidden lg:flex transition-all ${
        theme === 'dark' 
          ? 'bg-[#1C2C33] border-[#2C414C]' 
          : 'bg-[#E0F2FE]/40 backdrop-blur-lg border-blue-100'
      }`}>
        <div className={`p-8 border-b ${theme === 'dark' ? 'border-[#2C414C]' : 'border-[#CCFBF1]/40'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/10 hover:rotate-6 transition-transform">
              <Heart className="w-5 h-5 text-white fill-white/20" />
            </div>
            <h1 className="font-black text-xl tracking-tighter uppercase bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-emerald-400">Vital Mind</h1>
          </div>
        </div>
        
        <nav className="flex-1 p-6 space-y-2">
          <SidebarItem 
            active={currentView === 'dashboard'} 
            onClick={() => setCurrentView('dashboard')} 
            icon={<LayoutDashboard size={20} />} 
            label={t.dashboard} 
            id="nav-home"
          />
          <SidebarItem 
            active={currentView === 'mood'} 
            onClick={() => setCurrentView('mood')} 
            icon={<Heart size={20} />} 
            label={t.moodTracker} 
            id="nav-mood"
          />
          <SidebarItem 
            active={currentView === 'symptoms'} 
            onClick={() => setCurrentView('symptoms')} 
            icon={<Activity size={20} />} 
            label={t.symptoms} 
            id="nav-symptoms"
          />
          <SidebarItem 
            active={currentView === 'history'} 
            onClick={() => setCurrentView('history')} 
            icon={<Calendar size={20} />} 
            label={t.wellnessHistory} 
            id="nav-history"
          />
          <SidebarItem 
            active={currentView === 'resources'} 
            onClick={() => setCurrentView('resources')} 
            icon={<BookOpen size={20} />} 
            label={t.helpLibrary} 
            id="nav-resources"
          />
          <SidebarItem 
            active={currentView === 'crisis'} 
            onClick={() => setCurrentView('crisis')} 
            icon={<AlertCircle size={20} className="text-red-500" />} 
            label={t.crisisMode} 
            id="nav-crisis"
          />
        </nav>

        <div className={`p-6 border-t ${theme === 'dark' ? 'border-[#2C414C]' : 'border-[#CCFBF1]/40'}`}>
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden group">
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-1">Crisis Support</p>
              <p className="font-bold text-lg mb-4">0806 210 6493</p>
              <button 
                onClick={() => window.open('tel:08062106493')}
                className="w-full py-2 bg-white text-emerald-700 text-[10px] font-black rounded-lg uppercase transition-transform hover:scale-[1.02] cursor-pointer"
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
        <header className={`min-h-[5rem] h-auto py-3 border-b px-4 sm:px-6 md:px-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 transition-all ${
          theme === 'dark' 
            ? 'bg-[#131F24]/90 backdrop-blur-md border-[#2C414C] text-white' 
            : 'bg-white/85 backdrop-blur-md border-[#CCFBF1]/40'
        }`}>
          <div className="min-w-0 max-w-full">
            <h2 className="text-base xs:text-lg sm:text-xl font-black text-slate-800 dark:text-white tracking-tight leading-tight break-words">
              {t.welcome}, {user.displayName?.split(' ')[0] || 'User'} 👋
            </h2>
            <p className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 font-bold tracking-widest uppercase mt-0.5 break-all">
              <span className="hidden xs:inline">User ID: {user.uid.slice(0, 8)} • </span>Age: {profile?.dob ? calculateAge(profile.dob) : (profile?.age || '--')}
            </p>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-3.5 flex-wrap">
            <div id="header-wellness-state" className="text-left sm:text-right">
              <p className="hidden xs:block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter mb-0.5">Wellness State</p>
              <div className={`px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-wider ${
                !wellnessResult ? 'bg-slate-50 dark:bg-[#18262C] text-slate-400' :
                wellnessResult.state === 'Mild' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' :
                wellnessResult.state === 'Moderate' ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400' : 'bg-red-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
              }`}>
                {wellnessResult?.state || 'Scanning...'}
              </div>
            </div>
            <div className="flex items-center gap-1.5 xs:gap-2">
              <button 
                id="header-easy-mode"
                onClick={() => {
                  const val = !easyMode;
                  setEasyMode(val);
                  localStorage.setItem('vitalmind_easy_mode', val ? 'true' : 'false');
                  if (val) {
                    speakText("Voice helper active. Click volume buttons to hear clinical insights read out loud!");
                  }
                }} 
                title={easyMode ? "Switch to Standard View" : "Activate Easy Read Mode"}
                className={`w-9 h-9 xs:w-10 xs:h-10 rounded-xl border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                  easyMode 
                    ? 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' 
                    : 'bg-slate-50 dark:bg-[#18262C] border-slate-200 dark:border-[#2C414C] text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400'
                }`}
              >
                <Volume2 size={16} className={easyMode ? 'animate-bounce' : ''} />
              </button>
              <button 
                onClick={() => setShowInteractiveTour(true)} 
                title="Take App Tour"
                className="w-9 h-9 xs:w-10 xs:h-10 rounded-xl bg-slate-50 dark:bg-[#18262C] border border-slate-200 dark:border-[#2C414C] flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer shrink-0"
              >
                <Compass size={16} />
              </button>
              <button 
                id="tour-profile-btn"
                onClick={() => setCurrentView('profile')} 
                title="Settings & Profile"
                className="w-9 h-9 xs:w-10 xs:h-10 rounded-xl bg-slate-50 dark:bg-[#18262C] border border-slate-200 dark:border-[#2C414C] flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer shrink-0"
              >
                <User size={16} />
              </button>
              <button 
                onClick={() => setShowLogoutConfirm(true)} 
                title="Log out"
                className="w-9 h-9 xs:w-10 xs:h-10 rounded-xl bg-slate-50 dark:bg-[#18262C] border border-slate-200 dark:border-[#2C414C] flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-red-500 transition-colors cursor-pointer shrink-0"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-10 pb-28 lg:pb-10">
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

        <footer className={`h-auto md:h-10 border-t px-6 md:px-10 py-4 md:py-0 flex-col md:flex-row justify-between items-center text-[10px] font-black uppercase tracking-wider shrink-0 gap-2 transition-all hidden lg:flex ${
          theme === 'dark' 
            ? 'bg-[#131F24]/85 text-slate-400 border-[#2C414C]' 
            : 'bg-white/85 text-slate-400 border-[#CCFBF1]/40'
        }`}>
          <div>Vital Mind System • v1.1.0</div>
          <div className="flex gap-6">
            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Rule-Engine Active</span>
            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Secure Encryption</span>
          </div>
        </footer>
      </main>

      {/* In-app Smart Notification Banner */}
      <AnimatePresence>
        {activeNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-6 z-[120] max-w-sm w-full bg-white dark:bg-[#203038] border border-slate-150/80 dark:border-[#2C414C] shadow-2xl rounded-3xl p-6 flex flex-col gap-3 shadow-blue-100/30 dark:shadow-none"
          >
            <div className="flex justify-between items-start gap-4">
              <div className="flex gap-3">
                <span className="text-2xl pt-0.5 shrink-0">🔔</span>
                <div className="space-y-1">
                  <h4 className="font-black text-[10px] uppercase tracking-wider text-blue-600 dark:text-blue-400">VitalMind Alert</h4>
                  <p className="text-xs font-bold text-slate-800 dark:text-[#E3ECF0] leading-relaxed">{activeNotification.body}</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setActiveNotification(null)} 
                className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-350 transition-colors shrink-0 p-1"
              >
                ✕
              </button>
            </div>
            <div className="flex justify-end pt-1">
              <button 
                type="button"
                onClick={() => {
                  setActiveNotification(null);
                  setCurrentView('mood');
                }}
                className="text-[9px] font-black uppercase tracking-widest text-white bg-blue-600 hover:bg-blue-700 py-3 px-5 rounded-xl transition-all cursor-pointer"
              >
                Log Mood Now →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Nav (Bottom) */}
      <nav className={`fixed bottom-0 left-0 right-0 lg:hidden border-t flex justify-around p-3 pb-safe z-50 backdrop-blur-xl transition-all shadow-xl ${
        theme === 'dark' 
          ? 'bg-[#1C2C33]/95 border-[#2C414C] text-slate-100' 
          : 'bg-white/95 border-slate-200 text-slate-900'
      }`}>
        <NavButton active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} icon={<LayoutDashboard size={20} />} label="Home" theme={theme} id="nav-home" />
        <NavButton active={currentView === 'mood'} onClick={() => setCurrentView('mood')} icon={<Heart size={21} />} label="Mood" theme={theme} id="nav-mood" />
        <NavButton active={currentView === 'symptoms'} onClick={() => setCurrentView('symptoms')} icon={<Activity size={21} />} label="Symptoms" theme={theme} id="nav-symptoms" />
        <NavButton active={currentView === 'history'} onClick={() => setCurrentView('history')} icon={<Calendar size={20} />} label="History" theme={theme} id="nav-history" />
        <NavButton active={currentView === 'resources'} onClick={() => setCurrentView('resources')} icon={<BookOpen size={20} />} label="Help" theme={theme} id="nav-resources" />
      </nav>

      {/* Onboarding Dialog */}
      <AnimatePresence>
        {showOnboarding && (
          <OnboardingFlow 
            initialName={user.displayName || ''}
            onComplete={handleOnboardingComplete}
            onCancel={handleOnboardingCancel}
          />
        )}
      </AnimatePresence>

      {/* Interactive Guided Tour */}
      {showInteractiveTour && (
        <InteractiveTour 
          onClose={() => setShowInteractiveTour(false)}
          theme={theme}
          currentView={currentView}
          setCurrentView={setCurrentView}
        />
      )}

      {/* Info Modal */}
      <AnimatePresence>
        {modalInfo && (
          <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#203038] border border-slate-100 dark:border-[#2C414C] rounded-3xl p-8 w-full max-w-md shadow-2xl space-y-6"
            >
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
                  <Info size={24} />
                </div>
                <button 
                  onClick={() => setModalInfo(null)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-[#1C2C33] rounded-full text-slate-400 dark:text-slate-500 transition-colors"
                >
                  <Plus className="rotate-45" size={20} />
                </button>
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase mb-2">{modalInfo.title}</h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">{modalInfo.content}</p>
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

      {/* Personalized tip Modal */}
      <AnimatePresence>
        {activeSupportTip && (
          <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#203038] rounded-3xl p-8 w-full max-w-md shadow-2xl space-y-6 border border-slate-100 dark:border-[#2C414C]"
            >
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center border border-emerald-100/60 dark:border-emerald-900/50">
                  <Sparkles size={24} />
                </div>
                <button 
                  onClick={() => setActiveSupportTip(null)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-[#1C2C33] rounded-full text-slate-400 dark:text-slate-500 transition-colors"
                >
                  <Plus className="rotate-45" size={20} />
                </button>
              </div>
              <div>
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-100/50 dark:border-emerald-900/45">
                  Contextual Support Active
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase mb-2 mt-4">Personalized Wellness Tip</h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-semibold">{activeSupportTip}</p>
              </div>
              <button 
                onClick={() => setActiveSupportTip(null)}
                className="btn-primary w-full py-3.5 text-[10px] uppercase tracking-widest shadow-lg shadow-blue-100 dark:shadow-none"
              >
                Got it, thank you 🌱
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
              className="bg-white dark:bg-[#203038] border border-slate-150 dark:border-[#2C414C] rounded-3xl p-8 w-full max-w-sm shadow-2xl space-y-6 text-center"
            >
              <div className="w-16 h-16 bg-red-50 dark:bg-red-950/30 text-red-500 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-2">
                <LogOut size={28} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase mb-2">Are you sure?</h3>
                <p className="text-slate-500 dark:text-slate-400 font-medium">You will be logged out of your wellness dashboard.</p>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-4 bg-slate-100 dark:bg-[#18262C] text-slate-600 dark:text-slate-300 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 dark:hover:bg-[#203038] transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    logout();
                    setShowLogoutConfirm(false);
                  }}
                  className="flex-1 py-4 bg-red-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-red-700 shadow-lg shadow-red-100 dark:shadow-none transition-all"
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

function SidebarItem({ active, onClick, icon, label, id }: { active: boolean, onClick: () => void, icon: ReactNode, label: string, id?: string }) {
  return (
    <button 
      id={id}
      onClick={onClick}
      className={`wellness-sidebar-item w-full ${active ? 'wellness-sidebar-item-active shadow-sm' : 'wellness-sidebar-item-inactive'}`}
    >
      <span className={active ? 'text-blue-600' : 'text-slate-400'}>{icon}</span>
      <span className="tracking-tight">{label}</span>
    </button>
  );
}

function NavButton({ active, onClick, icon, label, theme, id }: { active: boolean, onClick: () => void, icon: ReactNode, label: string, theme?: string, id?: string }) {
  const activeClass = theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600';
  const inactiveClass = 'text-slate-400 hover:text-emerald-500 dark:text-slate-500';
  return (
    <button id={id} onClick={onClick} className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${active ? activeClass : inactiveClass}`}>
      <div className={`p-1.5 rounded-xl transition-all ${active ? 'scale-110 bg-emerald-500/10 dark:bg-emerald-500/20' : ''}`}>
        {icon}
      </div>
      <span className="text-[9px] font-black uppercase tracking-wider">{label}</span>
    </button>
  );
}

function DashboardView({ 
  moodLogs, 
  result, 
  setView, 
  profile, 
  communityVote, 
  submitVote, 
  setLocale, 
  tLocale, 
  setModalInfo,
  easyMode,
  speakText,
  triggerTour
}: { 
  moodLogs: any[], 
  result: any, 
  setView: (v: any) => void, 
  profile: any, 
  communityVote: string | null, 
  submitVote: (v: string) => void, 
  setLocale: (l: any) => void, 
  tLocale: any, 
  setModalInfo: (i: any) => void,
  easyMode: boolean,
  speakText: (t: string) => void,
  triggerTour: () => void
}) {

  const t = TRANSLATIONS[tLocale as Locale] || TRANSLATIONS['en'];

  const calculateStreakVal = (): number => {
    if (!moodLogs || moodLogs.length === 0) return 0;
    const sortedDates = [...new Set(moodLogs.map(log => {
      const d = resolveDate(log.timestamp);
      return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    }))].sort((a,b) => b - a); // descending order
    
    let streak = 0;
    let today = new Date();
    let currentDateMs = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    
    // Check if the most recent log was today or yesterday
    if (sortedDates[0] < currentDateMs - (1000 * 60 * 60 * 24)) {
      return 0; // streak broken
    }
    
    let expectDateMs = sortedDates[0];
    for (let i = 0; i < sortedDates.length; i++) {
      if (sortedDates[i] === expectDateMs) {
        streak++;
        expectDateMs -= 1000 * 60 * 60 * 24; // subtract one day
      } else if (sortedDates[i] < expectDateMs) {
        break; // gap found
      }
    }
    return streak;
  };

  const streakVal = calculateStreakVal();

  // Peer results for anonymous checkpoint
  const communityOptions = [
    { key: "calm", label: "Grounded and Calm today 🌱", peersCount: "1,490 check-ins", pct: 34 },
    { key: "fatigued", label: "Riding high fatigue wave 🌊", peersCount: "1,120 check-ins", pct: 26 },
    { key: "motivated", label: "Restored and motivated ⚡", peersCount: "980 check-ins", pct: 22 },
    { key: "stressed", label: "Coping with active stress 🌪️", peersCount: "780 check-ins", pct: 18 }
  ];

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-8">
      {/* Easy mode custom guidance assistant banner */}
      {easyMode && (
        <div id="easy-mode-guide-banner" className="col-span-12 bg-linear-to-r from-emerald-500/10 to-teal-500/10 dark:from-emerald-950/20 dark:to-teal-950/20 border border-emerald-500/30 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <h4 className="text-sm font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-2">
              <Volume2 className="animate-bounce" size={16} /> Easy Voice & Simple Mode Active
            </h4>
            <p className="text-xs text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
              Welcome! Standard text has been simplified for you. Tap any sentence with a sound icon (<Volume2 className="inline ml-1" size={12} />) to hear it read out.
            </p>
          </div>
          <button
            type="button"
            onClick={() => speakText("Welcome! Standard text has been simplified for you. Tap any sentence with a sound icon to hear it read out.")}
            className="py-3 px-5 text-[10px] font-black tracking-widest bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl uppercase flex items-center gap-2 transition-transform active:scale-[0.98] cursor-pointer shadow-md shadow-emerald-500/10"
          >
            <Volume2 size={14} /> Listen to Intro
          </button>
        </div>
      )}

      {/* Quick Crisis Access for low-energy states */}
      <div className="col-span-12">
        <div className="bg-red-50 dark:bg-red-950/20 border-l-4 border-red-600 dark:border-red-500 p-4 rounded-r-2xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-red-600 dark:bg-red-700 rounded-full flex items-center justify-center text-white shrink-0 shadow-lg shadow-red-200 dark:shadow-red-950/30">
              <Zap size={20} />
            </div>
            <div>
              <h4 className="font-black text-slate-900 dark:text-white uppercase text-[10px] tracking-widest flex items-center gap-2">
                <span>{t.inDistress}</span>
                {easyMode && (
                  <button 
                    type="button" 
                    onClick={() => speakText(t.inDistress + "! " + t.distressSub)} 
                    className="p-1 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 cursor-pointer"
                    title="Speak text"
                  >
                    <Volume2 size={12} />
                  </button>
                )}
              </h4>
              <p className="text-xs text-slate-600 dark:text-red-200/95 font-medium font-semibold">{t.distressSub}</p>
            </div>
          </div>
          <button 
            onClick={() => setView('crisis')}
            className="px-6 py-2 bg-red-600 text-white text-[10px] font-black rounded-xl uppercase tracking-widest hover:bg-red-700 transition-all shadow-md shadow-red-500/15 dark:shadow-none whitespace-nowrap"
          >
            {t.getHelpNow}
          </button>
        </div>
      </div>

      {/* 1-Minute Navigation Tour Callout */}
      <div className="col-span-12">
        <div className="bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100/50 dark:border-[#2C414C] p-5 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex gap-4 items-center">
            <div className="w-11 h-11 bg-blue-600 dark:bg-blue-700/60 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-500/10">
              <Compass size={22} className="animate-pulse" />
            </div>
            <div>
              <h4 className="font-black text-slate-800 dark:text-white uppercase text-[10px] tracking-widest flex items-center gap-2">
                New to VitalMind? Take the 1-Minute Visual Tour
              </h4>
              <p className="text-xs text-slate-500 dark:text-[#a8b8c0] font-medium leading-relaxed mt-0.5">
                Learn how to locate trackers, understand warning telemetry, download shared doctor reports & navigate seamlessly.
              </p>
            </div>
          </div>
          <button 
            onClick={triggerTour}
            className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black rounded-xl uppercase tracking-widest transition-all shadow-md shadow-blue-500/15 cursor-pointer whitespace-nowrap active:scale-[0.98]"
          >
            Start App Tour
          </button>
        </div>
      </div>

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
            className="bg-blue-600 p-8 rounded-3xl text-left shadow-xl shadow-blue-100 dark:shadow-none relative overflow-hidden group hover:scale-[1.02] transition-all"
          >
            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                <Plus size={24} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">{t.trackNew}</p>
              <h3 className="text-2xl font-black uppercase tracking-tighter">{t.moodLog}</h3>
            </div>
            <div className="absolute right-0 bottom-0 p-4 opacity-10 scale-150 rotate-12 group-hover:scale-[1.7] transition-transform">
              <Heart size={100} />
            </div>
          </button>

          <button 
            onClick={() => setView('symptoms')} 
            className="bg-emerald-600 p-8 rounded-3xl text-left shadow-xl shadow-emerald-100 dark:shadow-none relative overflow-hidden group hover:scale-[1.02] transition-all"
          >
            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                <Activity size={24} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">{t.reportNew}</p>
              <h3 className="text-2xl font-black uppercase tracking-tighter">{t.symptoms}</h3>
            </div>
            <div className="absolute right-0 bottom-0 p-4 opacity-10 scale-150 -rotate-12 group-hover:rotate-0 transition-transform">
              <Activity size={100} />
            </div>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
          <section id="tour-intelligence-center" className="wellness-card bg-white dark:bg-[#1C2C33] border border-slate-100 dark:border-[#2C414C]">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-[12px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-3">
                <Zap size={18} className="text-amber-500 fill-amber-500" />
                {t.intelligenceCenter}
              </h3>
              <button 
                onClick={() => setModalInfo({ 
                  title: "Vital Mind Intelligence", 
                  content: "Our rule-based system analyzes your emotional and physical logs over 14-day windows to detect trends and suggest medically-informed preventive actions."
                })}
                className="text-slate-300 dark:text-slate-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
              >
                <Info size={14} />
              </button>
            </div>
            
            <div className="space-y-4">
              {result?.recommendations.map((rec: string, i: number) => (
                <div key={i} className="flex gap-4 items-start p-5 bg-slate-50 dark:bg-[#18262C] border border-slate-100 dark:border-[#2C414C] rounded-2xl">
                  <CheckCircle2 size={20} className="text-blue-500 shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-2">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-relaxed">{rec}</p>
                    {easyMode && (
                      <button 
                        type="button"
                        onClick={() => speakText(rec)}
                        className="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#203038] dark:hover:bg-[#2a3c46] text-slate-500 dark:text-slate-400 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all"
                      >
                        <Volume2 size={12} /> Read aloud
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {(!result || result.recommendations.length === 0) && (
                <p className="text-slate-400 text-sm italic px-2">No active mental health recommendations. Keep tracking!</p>
              )}
            </div>
          </section>

          <section id="tour-preventive-care" className="wellness-card bg-blue-50/10 dark:bg-[#1C2C33] border border-blue-100/30 dark:border-[#2C414C]">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-[12px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-3">
                <Heart size={18} className="text-blue-500" />
                {t.preventiveHealth}
              </h3>
              <button 
                onClick={() => setModalInfo({ 
                  title: "Preventive Care", 
                  content: "By monitoring physical markers like fatigue and sleep alongside mood, we help you identify early signs of burnout or health issues before they escalate."
                })}
                className="text-blue-400 dark:text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <Info size={14} />
              </button>
            </div>
            
            <div className="space-y-4">
              {result?.preventiveTips.map((tip: string, i: number) => (
                <div key={i} className="flex gap-4 items-start p-5 bg-white dark:bg-[#18262C] border border-blue-100/50 dark:border-[#2C414C] rounded-2xl shadow-xs">
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 size={12} className="text-white" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-relaxed">{tip}</p>
                    {easyMode && (
                      <button 
                        type="button"
                        onClick={() => speakText(tip)}
                        className="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all"
                      >
                        <Volume2 size={12} /> Read aloud
                      </button>
                    )}
                  </div>
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
        
        {/* Streak & Consistency Tracker */}
        <section className="wellness-card border-l-4 border-l-amber-500 bg-amber-50/10 dark:bg-amber-950/10 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
              <Zap size={16} className="text-amber-500 fill-amber-500 animate-pulse" />
              {t.streakTracker}
            </h3>
            <span className="text-[10px] text-slate-400 font-extrabold font-mono">CONSECUTIVE DAYS</span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-slate-950 dark:text-white tracking-tight leading-none">{streakVal}</span>
            <span className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">Days</span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold leading-relaxed">
            {streakVal > 0 
              ? `You've checked in for ${streakVal} day${streakVal > 1 ? 's' : ''} straight! Consistency is wellness.` 
              : "Check in today to start your tracking streak! Keep reflecting daily."}
          </p>

          <div className="flex items-center gap-2 border-t border-slate-100 dark:border-[#2C414C] pt-3">
            <div className="text-[9px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-wider">Milestone achievements:</div>
            <div className="flex gap-1">
              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${streakVal >= 3 ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-[#18262C] text-slate-400 dark:text-slate-500'}`}>3D</span>
              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${streakVal >= 7 ? 'bg-amber-500 text-white animate-bounce' : 'bg-slate-100 dark:bg-[#18262C] text-slate-400 dark:text-slate-500'}`}>7D</span>
              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${streakVal >= 30 ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-[#18262C] text-slate-400 dark:text-slate-500'}`}>30D</span>
            </div>
          </div>
        </section>

        {/* Anonymous Community Check-in Module */}
        <section id="tour-peer-community" className="wellness-card bg-white/95 dark:bg-[#1C2C33] border border-slate-100 dark:border-[#2C414C] space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              👤 Peer Community Check-in
            </h3>
            <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-black bg-emerald-50 dark:bg-emerald-950/35 px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-900/30 animate-pulse uppercase tracking-wider">LIVE</span>
          </div>

          <p className="text-[10px] text-slate-400 dark:text-[#a8b8c0] font-bold leading-normal">Cast an anonymous ballot of your current emotional landscape. See how real peers worldwide are aligning today.</p>

          <div className="space-y-2 pt-1">
            {communityOptions.map((opt) => {
              const hasVoted = communityVote === opt.key;
              return (
                <button
                  key={opt.key}
                  disabled={!!communityVote}
                  onClick={() => submitVote(opt.key)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all relative overflow-hidden flex flex-col gap-1 ${
                    hasVoted 
                      ? 'bg-emerald-50/50 border-emerald-500 text-emerald-900 dark:bg-emerald-950/25 dark:border-emerald-500 dark:text-emerald-300 group shadow-xs scale-101' 
                      : !!communityVote 
                        ? 'bg-slate-50 border-slate-100 opacity-60 text-slate-400 dark:bg-[#18262C]/40 dark:border-[#2C414C] dark:text-slate-500 cursor-default' 
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 dark:bg-[#18262C] dark:hover:bg-[#203038] dark:border-[#2C414C] dark:text-slate-350 cursor-pointer'
                  }`}
                >
                  {/* Progress bar background indicator */}
                  {!!communityVote && (
                    <div 
                      className={`absolute left-0 top-0 bottom-0 ${hasVoted ? 'bg-emerald-500/10 dark:bg-emerald-500/20' : 'bg-slate-200/20 dark:bg-slate-700/10'} transition-all`}
                      style={{ width: `${opt.pct}%` }} 
                    />
                  )}
                  
                  <div className="relative z-10 flex justify-between items-center w-full">
                    <span className="text-xs font-bold">{opt.label}</span>
                    {!!communityVote && (
                      <span className="text-xs font-black">{opt.pct}%</span>
                    )}
                  </div>
                  
                  {!!communityVote && (
                    <span className="relative z-10 text-[9px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-widest">
                      {opt.peersCount} {hasVoted ? '(You aligned here!)' : ''}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {communityVote && (
            <div className="text-center pt-1">
              <button 
                onClick={() => submitVote('')} 
                className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 hover:text-red-500 border-b border-dashed border-slate-300 dark:border-[#2C414C] hover:border-red-400 transition-colors"
              >
                Reset Check-in selection
              </button>
            </div>
          )}
        </section>

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
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">{log.mood}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                    {resolveDate(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            <button onClick={() => setView('history')} className="w-full py-4 text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest border-t border-slate-50 dark:border-slate-800/50 mt-2 hover:translate-x-1 transition-transform flex items-center justify-center gap-2 cursor-pointer">
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
    case 'Hopeful': return '🌱';
    case 'Calm': return '😌';
    case 'Tired': return '🥱';
    case 'Lonely': return '👤';
    case 'Dissociated': return '🌫️';
    case 'Fearful': return '😨';
    default: return '❓';
  }
};

function MoodLoggerView({ onComplete, userId }: { onComplete: () => void, userId: string }) {
  const [selectedMoods, setSelectedMoods] = useState<MoodType[]>([]);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'all' | 'positive' | 'reflective' | 'active'>('all');

  const positiveMoods: { type: MoodType, emoji: string, color: string; desc: string }[] = [
    { type: 'Happy', emoji: '😊', color: 'bg-amber-500/10 text-amber-600 border-amber-500/30 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-500/30', desc: 'Savouring a bright moment' },
    { type: 'Hopeful', emoji: '🌱', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-500/30', desc: 'Looking forward with peace' },
    { type: 'Calm', emoji: '😌', color: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/30 dark:bg-cyan-950/20 dark:text-cyan-400 dark:border-cyan-500/30', desc: 'Feeling grounded and light' },
    { type: 'Neutral', emoji: '😐', color: 'bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/30 dark:bg-slate-800/35 dark:border-slate-700', desc: 'Steady and balanced state' },
  ];

  const reflectiveMoods: { type: MoodType, emoji: string, color: string; desc: string }[] = [
    { type: 'Sad', emoji: '😢', color: 'bg-blue-500/10 text-blue-600 border-blue-500/30 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-500/30', desc: 'Carrying general sadness' },
    { type: 'Tired', emoji: '🥱', color: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-500/30', desc: 'Exhausted or low on fuel' },
    { type: 'Lonely', emoji: '👤', color: 'bg-slate-500/10 text-slate-500 border-slate-500/30 dark:bg-slate-800/35 dark:text-slate-400 dark:border-slate-700', desc: 'Feeling isolated or apart' },
    { type: 'Dissociated', emoji: '🌫️', color: 'bg-zinc-500/10 text-zinc-650 dark:text-zinc-350 border-zinc-500/30 dark:bg-zinc-800/35 dark:border-zinc-700', desc: 'Fuzzy or detached from now' },
  ];

  const activeMoods: { type: MoodType, emoji: string, color: string; desc: string }[] = [
    { type: 'Stressed', emoji: '😫', color: 'bg-orange-500/10 text-orange-600 border-orange-500/30 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-500/30', desc: 'Tension is crowding in' },
    { type: 'Anxious', emoji: '😰', color: 'bg-purple-500/10 text-purple-600 border-purple-500/30 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-500/30', desc: 'Worry is active or heavy' },
    { type: 'Angry', emoji: '😡', color: 'bg-rose-500/10 text-rose-600 border-rose-500/30 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-500/30', desc: 'Fretful, heated or irritated' },
    { type: 'Fearful', emoji: '😨', color: 'bg-red-500/10 text-red-650 dark:text-red-400 border-red-500/30 dark:bg-red-950/20 dark:border-red-500/30', desc: 'Feeling unsafe or alarmed' },
  ];

  const allMoods = [...positiveMoods, ...reflectiveMoods, ...activeMoods];

  const getFilteredMoods = () => {
    switch (activeCategory) {
      case 'positive': return positiveMoods;
      case 'reflective': return reflectiveMoods;
      case 'active': return activeMoods;
      default: return allMoods;
    }
  };

  const [sleepScore, setSleepScore] = useState<number>(5);
  const [energyScore, setEnergyScore] = useState<number>(5);

  const prompts = [
    "What's one thing that felt heavy today?",
    "What's one small thing that helped?",
    "What am I grateful for in this moment?",
    "Describe the landscape of my thoughts right now."
  ];

  const toggleMood = (type: MoodType) => {
    if (selectedMoods.includes(type)) {
      setSelectedMoods(selectedMoods.filter(m => m !== type));
    } else {
      setSelectedMoods([...selectedMoods, type]);
    }
  };

  const handleSave = async () => {
    if (selectedMoods.length === 0) return;
    setSaving(true);
    const primaryMood = selectedMoods[0];
    const path = `users/${userId}/mood_logs`;
    try {
      if (userId === 'guest-user') {
        const localLogsRaw = localStorage.getItem('vitalmind_mood_logs_guest');
        const localLogs = localLogsRaw ? JSON.parse(localLogsRaw) : [];
        const newLog = {
          id: Math.random().toString(36).substring(2),
          userId,
          mood: primaryMood,
          moods: selectedMoods,
          note,
          sleepScore,
          energyScore,
          timestamp: { toDate: () => new Date(), seconds: Math.floor(Date.now() / 1000) }
        };
        const updated = [newLog, ...localLogs];
        localStorage.setItem('vitalmind_mood_logs_guest', JSON.stringify(updated));
        window.dispatchEvent(new Event('vitalmind_guest_data_changed'));

        // Fire post-log wellness tip
        const tipText = getContextualTip(primaryMood, []);
        localStorage.setItem('vitalmind_last_tip', tipText);
        window.dispatchEvent(new CustomEvent('vitalmind_show_tip', { detail: { tip: tipText, mood: primaryMood } }));

        onComplete();
        return;
      }

      await addDoc(collection(db, path), {
        userId,
        mood: primaryMood,
        moods: selectedMoods,
        note,
        sleepScore,
        energyScore,
        timestamp: serverTimestamp()
      });

      // Fire post-log wellness tip
      const tipText = getContextualTip(primaryMood, []);
      localStorage.setItem('vitalmind_last_tip', tipText);
      window.dispatchEvent(new CustomEvent('vitalmind_show_tip', { detail: { tip: tipText, mood: primaryMood } }));

      onComplete();
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-10 text-slate-800 dark:text-slate-100">
      <section>
        <button onClick={onComplete} className="text-slate-400 dark:text-slate-500 mb-6 hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-2 text-xs font-black uppercase tracking-widest cursor-pointer">
          <ChevronRight className="rotate-180" size={16} /> Back to Dashboard
        </button>
        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase mb-2">How are you feeling?</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium italic">Your reflection builds awareness. Choose all that apply today:</p>
      </section>

      {/* Category selector */}
      <div className="flex flex-wrap gap-2 bg-slate-100 dark:bg-slate-900/60 p-1.5 rounded-2xl max-w-lg border border-slate-200/50 dark:border-slate-800">
        <button 
          type="button"
          onClick={() => setActiveCategory('all')} 
          className={`flex-1 py-2 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${activeCategory === 'all' ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
        >
          All Moods
        </button>
        <button 
          type="button"
          onClick={() => setActiveCategory('positive')} 
          className={`flex-1 py-2 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${activeCategory === 'positive' ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
        >
          Bright & Calm
        </button>
        <button 
          type="button"
          onClick={() => setActiveCategory('reflective')} 
          className={`flex-1 py-2 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${activeCategory === 'reflective' ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
        >
          Reflective
        </button>
        <button 
          type="button"
          onClick={() => setActiveCategory('active')} 
          className={`flex-1 py-2 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${activeCategory === 'active' ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
        >
          Tense & Heavy
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {getFilteredMoods().map((m) => (
          <button
            key={m.type}
            type="button"
            onClick={() => toggleMood(m.type)}
            className={`flex flex-col items-center justify-center p-6 rounded-[28px] transition-all border text-center cursor-pointer ${
              selectedMoods.includes(m.type) 
                ? `${m.color} border-current border-2 scale-[1.01] font-bold shadow-sm` 
                : 'bg-white dark:bg-[#1C2C33] text-slate-400 dark:text-[#a8b8c0] border-[#CCFBF1]/40 dark:border-[#2C414C] shadow-xs hover:scale-[1.02] hover:bg-slate-50/50 dark:hover:bg-[#1C2C33]/60'
            }`}
            style={{ minHeight: '120px' }}
          >
            <span className="text-4xl mb-3">{m.emoji}</span>
            <span className="text-[10px] font-black uppercase tracking-widest block">{m.type}</span>
            <span className="text-[9px] text-slate-400 dark:text-[#a8b8c0] mt-1 font-medium hidden sm:block">{m.desc}</span>
          </button>
        ))}
      </div>

      {/* Sleep & Energy Tracker sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/70 dark:bg-[#1C2C33] p-6 rounded-[28px] border border-[#CCFBF1]/50 dark:border-[#2C414C]">
        <div className="space-y-3">
          <div className="flex justify-between items-center pr-1">
            <span className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">Sleep Quality last night</span>
            <span className="text-xs font-extrabold text-[#1474A4] dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 px-2.5 py-1 rounded-md border border-emerald-500/30">{sleepScore} / 10</span>
          </div>
          <p className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold">1 is poor sleeplessness, 10 is perfectly deep restfulness.</p>
          <input 
            type="range"
            min="1"
            max="10"
            value={sleepScore}
            onChange={(e) => setSleepScore(Number(e.target.value))}
            className="w-full accent-emerald-500 h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-auto cursor-pointer"
          />
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center pr-1">
            <span className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">Current Daily Energy Level</span>
            <span className="text-xs font-extrabold text-[#1474A4] dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 px-2.5 py-1 rounded-md border border-emerald-500/30">{energyScore} / 10</span>
          </div>
          <p className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold">1 is completely exhausted, 10 is vibrant and energetic.</p>
          <input 
            type="range"
            min="1"
            max="10"
            value={energyScore}
            onChange={(e) => setEnergyScore(Number(e.target.value))}
            className="w-full accent-emerald-500 h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-auto cursor-pointer"
          />
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pr-1">
          <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] px-1">Personal Note</label>
          <div className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold italic">Optional: Select an elegant journal guide below</div>
        </div>

        {/* Guided journal prompts */}
        <div className="flex flex-wrap gap-2.5">
          {prompts.map(p => (
            <button
              key={p}
              type="button"
              onClick={() => {
                const combined = note ? `${note}\n${p}` : p;
                setNote(combined);
              }}
              className="px-3.5 py-2 bg-white dark:bg-[#203038] hover:bg-slate-50 dark:hover:bg-[#2a3c46] text-[10px] text-slate-600 dark:text-[#a8b8c0] hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-[#2C414C] rounded-xl transition-all font-bold text-left shadow-xs cursor-pointer truncate max-w-sm"
            >
              🌱 {p}
            </button>
          ))}
        </div>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Briefly describe what's on your mind..."
          className="input-field min-h-[160px] p-6 text-base"
        />
      </section>

      <button
        disabled={selectedMoods.length === 0 || saving}
        onClick={handleSave}
        className="btn-primary w-full py-5 text-[12px] uppercase tracking-widest shadow-xl cursor-pointer"
      >
        {saving ? 'Transmitting Data...' : 'Confirm Mood Entry'}
      </button>
    </div>
  );
}

function SymptomLoggerView({ onComplete, onNavigateToCrisis, userId }: { onComplete: () => void, onNavigateToCrisis: () => void, userId: string }) {
  const [selected, setSelected] = useState<SymptomType[]>([]);
  const [saving, setSaving] = useState(false);

  const toggle = (s: SymptomType) => {
    if (selected.includes(s)) setSelected(selected.filter(i => i !== s));
    else setSelected([...selected, s]);
  };

  const mentalEmotionalSymptoms: SymptomType[] = [
    "Racing thoughts",
    "Difficulty concentrating",
    "Memory issues",
    "Low motivation",
    "Excessive worry",
    "Mood swings",
    "Feeling detached from reality",
    "Suicidal thoughts",
    "Self-harm urges",
    "Anxiety",
    "Social withdrawal",
    "Irritability"
  ];

  const physicalSymptoms: SymptomType[] = [
    "Headache",
    "Poor sleep / insomnia",
    "Fatigue",
    "Low appetite",
    "Overeating",
    "Dizziness",
    "Chest tightness",
    "Shortness of breath",
    "Palpitations",
    "Physical pain",
    "Frequent urination",
    "Trembling or shaking",
    "Muscle tension",
    "Digital eye strain"
  ];

  const handleSave = async () => {
    setSaving(true);
    const path = `users/${userId}/symptom_logs`;
    try {
      if (userId === 'guest-user') {
        const localLogsRaw = localStorage.getItem('vitalmind_symptom_logs_guest');
        const localLogs = localLogsRaw ? JSON.parse(localLogsRaw) : [];
        const newLog = {
          id: Math.random().toString(36).substring(2),
          userId,
          symptoms: selected,
          timestamp: { toDate: () => new Date(), seconds: Math.floor(Date.now() / 1000) }
        };
        const updated = [newLog, ...localLogs];
        localStorage.setItem('vitalmind_symptom_logs_guest', JSON.stringify(updated));
        window.dispatchEvent(new Event('vitalmind_guest_data_changed'));
        onComplete();
        return;
      }

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

  const renderSymptomChip = (s: SymptomType) => {
    const isSelected = selected.includes(s);
    const isCrisisTag = s === "Suicidal thoughts" || s === "Self-harm urges";
    
    return (
      <div key={s} className="space-y-2">
        <button
          type="button"
          onClick={() => toggle(s)}
          className={`w-full p-5 bg-white dark:bg-[#203038] border rounded-2xl flex justify-between items-center transition-all min-h-[56px] text-left active:scale-[0.99] cursor-pointer ${
            isSelected 
              ? isCrisisTag
                ? 'bg-rose-50/30 dark:bg-rose-950/25 border-rose-500 shadow-sm'
                : 'bg-blue-50/30 dark:bg-blue-950/25 border-blue-500 shadow-sm' 
              : 'border-slate-100/80 dark:border-[#2C414C] hover:bg-slate-50 hover:border-slate-300 dark:hover:bg-[#18262C]'
          }`}
        >
          <span className={`font-bold transition-all text-xs tracking-tight ${
            isSelected 
              ? isCrisisTag ? 'text-rose-700 dark:text-rose-400' : 'text-blue-700 dark:text-blue-400' 
              : 'text-slate-600 dark:text-slate-350'
          }`}>
            {s}{isCrisisTag ? '*' : ''}
          </span>
          <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ${
            isSelected 
              ? isCrisisTag ? 'bg-rose-600 border-rose-600 text-white' : 'bg-blue-600 border-blue-600 text-white'
              : 'border-slate-200 dark:border-slate-700'
          }`}>
            {isSelected && <CheckCircle2 size={14} />}
          </div>
        </button>

        {/* Micro-prompt for suicidal thoughts or self-harm urges */}
        {isSelected && isCrisisTag && (
          <motion.div 
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-xl text-[11px] font-bold text-rose-800 dark:text-rose-200 leading-normal space-y-2"
          >
            <p className="flex items-center gap-1.5 font-medium">
              <span className="text-rose-500 text-xs">❤️</span> Selecting this is okay. You're not alone.
            </p>
            <button
              type="button"
              onClick={onNavigateToCrisis}
              className="text-rose-900 border-b border-rose-900 hover:border-transparent transition-all uppercase tracking-widest text-[9px] font-black block"
            >
              Crisis support is one tap away →
            </button>
          </motion.div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <section>
        <button onClick={onComplete} className="text-slate-400 mb-6 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-2 text-xs font-black uppercase tracking-widest cursor-pointer">
          <ChevronRight className="rotate-180" size={16} /> Back to Dashboard
        </button>
        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase mb-2">Symptom Log</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium italic">Select any markers present in your current state. All items tracked confidentially.</p>
      </section>

      <div className="space-y-10">
        {/* Mental / Emotional Section */}
        <section className="space-y-4">
          <h3 className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.3em] border-b border-slate-100 dark:border-slate-800/80 pb-2">Mental & Emotional Indicators</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {mentalEmotionalSymptoms.map(s => renderSymptomChip(s))}
          </div>
        </section>

        {/* Physical Section */}
        <section className="space-y-4">
          <h3 className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.3em] border-b border-slate-100 dark:border-slate-800/80 pb-2">Physical & Somatic Indicators</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {physicalSymptoms.map(s => renderSymptomChip(s))}
          </div>
        </section>
      </div>

      <button
        disabled={saving}
        onClick={handleSave}
        className="btn-primary w-full py-5 text-[12px] uppercase tracking-widest shadow-xl shadow-blue-100 h-16"
      >
        {saving ? 'Logging Indicators...' : 'Submit Symptom Log'}
      </button>
    </div>
  );
}

function HistoryView({ 
  moodLogs, 
  symptomLogs, 
  doctorAppointments, 
  addDoctorAppointment, 
  deleteDoctorAppointment, 
  onBack,
  user,
  profile,
  streak,
  easyMode,
  speakText
}: { 
  moodLogs: any[], 
  symptomLogs: any[], 
  doctorAppointments: any[], 
  addDoctorAppointment: (doctorName: string, dateTime: string, discussedNotes: string, clinicalAdvice: string) => Promise<void>, 
  deleteDoctorAppointment: (id: string) => Promise<void>, 
  onBack: () => void,
  user: any,
  profile: any,
  streak: number,
  easyMode?: boolean,
  speakText?: (t: string) => void
}) {
  const [activeTab, setActiveTab ] = useState<'symptoms' | 'reports'>('symptoms');
  const [filterMood, setFilterMood] = useState<string>('All');
  const [filterState, setFilterState] = useState<string>('All');
  const [filterRange, setFilterRange] = useState<number>(30); // 7, 30, 9999 days

  // Reports internal state
  const [reportPeriod, setReportPeriod] = useState<'weekly' | 'monthly'>('weekly');

  // Consultation Diary setup form states
  const [docName, setDocName] = useState('');
  const [docDate, setDocDate] = useState('');
  const [docNotes, setDocNotes] = useState('');
  const [docAdvice, setDocAdvice] = useState('');
  const [isAddingAppointment, setIsAddingAppointment] = useState(false);

  const formatDate = (ts: any) => {
    if (!ts) return '';
    const date = resolveDate(ts);
    return date.toLocaleDateString('en-NG', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).toUpperCase();
  };

  const getMoodLevel = (m: string): number => {
    switch (m) {
      case 'Happy': case 'Hopeful': case 'Calm': return 5;
      case 'Neutral': return 3;
      case 'Sad': case 'Tired': case 'Lonely': return 2;
      case 'Stressed': case 'Anxious': case 'Angry': case 'Fearful': case 'Dissociated': return 1;
      default: return 3;
    }
  };

  const getSymptomTagsForMoodLog = (moodLog: any) => {
    const moodDate = resolveDate(moodLog.timestamp);
    const closest = symptomLogs.find(s => {
      const sDate = resolveDate(s.timestamp);
      const diffMs = Math.abs(moodDate.getTime() - sDate.getTime());
      return diffMs < 1000 * 60 * 60 * 12; // within 12 hours window
    });
    return closest ? closest.symptoms : [];
  };

  const getLogState = (mood: string, symptoms: string[]): "Mild" | "Moderate" | "Severe" => {
    if (symptoms.includes("Suicidal thoughts") || symptoms.includes("Self-harm urges")) {
      return "Severe";
    }
    const negativeMoods = ["Sad", "Stressed", "Anxious", "Angry", "Lonely", "Dissociated", "Fearful", "Tired"];
    if (negativeMoods.includes(mood) && symptoms.length > 0) return "Moderate";
    if (symptoms.length >= 3) return "Severe";
    return "Mild";
  };

  const exportToCSV = () => {
    const rows = [
      ["Date", "Time", "Primary Mood", "Mood Emotion Score", "Aligned Physical Symptoms", "Calculated Wellness Level", "Personal Reflective Notes"]
    ];

    moodLogs.forEach(m => {
      const moodDate = resolveDate(m.timestamp);
      const alignedSymptoms = getSymptomTagsForMoodLog(m);
      const calculatedState = getLogState(m.mood, alignedSymptoms);
      const score = getMoodLevel(m.mood);

      const dStr = moodDate.toLocaleDateString('en-NG');
      const tStr = moodDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      rows.push([
        dStr,
        tStr,
        m.mood,
        score.toString(),
        alignedSymptoms.join('; ') || 'None logs',
        calculatedState,
        (m.note || '').replace(/"/g, '""')
      ]);
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + rows.map(r => r.map(val => `"${val}"`).join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `vitalmind_health_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Header Style
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(16, 185, 129); // Beautiful emerald green
    doc.text("VITAL MIND SYSTEM", 20, 25);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139); // Slate-500
    doc.text(`Generated: ${new Date().toLocaleDateString('en-NG')} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, 20, 31);
    
    // Separator line
    doc.setDrawColor(204, 251, 241); // mint boundary
    doc.setLineWidth(0.5);
    doc.line(20, 35, 190, 35);
    
    // Patient Overview Block
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59); // Slate-800
    doc.text("PATIENT & RECORD OVERVIEW", 20, 45);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105); // Slate-600
    doc.text(`Full Record ID: ${user?.uid || 'Guest Master'}`, 20, 52);
    doc.text(`Patient Name: ${user?.displayName || 'Guest User'}`, 20, 58);
    doc.text(`Assigned Age: ${profile?.dob ? calculateAge(profile.dob) : (profile?.age || 'Not provided')} • Current Streak: ${streak} days`, 20, 64);
    
    // Insights Section
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text("CLINICAL INSIGHT & WORKFORCE REPORTS", 20, 75);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(71, 85, 105);
    
    const weeklyReportSummary = generateWellnessReport(moodLogs, symptomLogs, 7);
    const splitWeekly = doc.splitTextToSize(`Weekly Highlight: ${weeklyReportSummary.frequentSymptoms.length > 0 ? "Symptoms tracked: " + weeklyReportSummary.frequentSymptoms.join(', ') + ". " : ""}${weeklyReportSummary.actionableInsight}`, 170);
    doc.text(splitWeekly, 20, 82);
    
    const monthlyReportSummary = generateWellnessReport(moodLogs, symptomLogs, 30);
    const splitMonthly = doc.splitTextToSize(`Monthly Highlight: ${monthlyReportSummary.frequentSymptoms.length > 0 ? "Symptoms tracked: " + monthlyReportSummary.frequentSymptoms.join(', ') + ". " : ""}${monthlyReportSummary.actionableInsight}`, 170);
    doc.text(splitMonthly, 20, 94);

    // Logs List Title
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text("LOGGED JOURNAL TIMELINE", 20, 115);
    
    // Draw table headers
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 116, 139);
    doc.text("Date & Time", 20, 122);
    doc.text("Mood States", 55, 122);
    doc.text("State Level", 100, 122);
    doc.text("Aligned Symptom Markers / Journal Notes", 125, 122);
    
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.line(20, 124, 190, 124);
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    
    let yPosition = 130;
    const sortedLogsForPDF = [...moodLogs].sort((a,b) => {
      const db = resolveDate(b.timestamp);
      const da = resolveDate(a.timestamp);
      return db.getTime() - da.getTime();
    });
    
    sortedLogsForPDF.slice(0, 12).forEach((m, idx) => {
      if (yPosition > 275) {
        doc.addPage();
        yPosition = 25;
        // Print header on new page
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text("Date & Time", 20, yPosition);
        doc.text("Mood States", 55, yPosition);
        doc.text("State Level", 100, yPosition);
        doc.text("Aligned Symptom Markers / Journal Notes", 125, yPosition);
        doc.line(20, yPosition + 2, 190, yPosition + 2);
        yPosition += 8;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(71, 85, 105);
      }
      
      const moodDate = resolveDate(m.timestamp);
      const alignedSymptoms = getSymptomTagsForMoodLog(m);
      const calculatedState = getLogState(m.mood, alignedSymptoms);
      const currentMoods = (m.moods && Array.isArray(m.moods)) ? m.moods : [m.mood];
      
      const dStr = `${moodDate.toLocaleDateString('en-NG')} ${moodDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      const moodsStr = currentMoods.join(', ');
      
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text(dStr, 20, yPosition);
      doc.text(moodsStr, 55, yPosition);
      doc.text(calculatedState, 100, yPosition);
      
      doc.setFont("helvetica", "normal");
      const notePart = m.note ? `Notes: ${m.note}` : "";
      const symptomsPart = alignedSymptoms.length > 0 ? `Symptoms: ${alignedSymptoms.join(', ')}` : "";
      const details = [symptomsPart, notePart].filter(Boolean).join(' | ');
      
      const splitDetails = doc.splitTextToSize(details || "No indicators logged", 65);
      doc.text(splitDetails, 125, yPosition);
      
      // Calculate lines height
      const linesCount = splitDetails.length;
      yPosition += Math.max(linesCount * 4, 8);
      
      doc.setDrawColor(241, 245, 249);
      doc.line(20, yPosition - 2, 190, yPosition - 2);
    });
    
    // Page Number details
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text("Confidential Clinical Document • Vital Mind Mental Wellness Support System", 20, 287);
    
    doc.save(`vitalmind_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const getChartData = () => {
    const sortedMoods = [...moodLogs]
      .sort((a, b) => {
        const da = resolveDate(a.timestamp);
        const db = resolveDate(b.timestamp);
        return da.getTime() - db.getTime();
      })
      .slice(-7);

    if (sortedMoods.length === 0) {
      return Array(7).fill(0).map((_, i) => ({
        day: `Day ${i + 1}`,
        score: 3
      }));
    }

    return sortedMoods.map(m => {
      const d = resolveDate(m.timestamp);
      const dayName = d.toLocaleDateString('en-NG', { weekday: 'short', month: 'short', day: 'numeric' });
      return {
        day: dayName,
        score: getMoodLevel(m.mood),
        mood: m.mood
      };
    });
  };

  const filteredMoodLogs = moodLogs.filter(log => {
    const logDate = resolveDate(log.timestamp);
    const now = new Date();
    const diffDays = (now.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24);

    if (filterRange !== 9999 && diffDays > filterRange) return false;
    if (filterMood !== 'All' && log.mood !== filterMood) return false;

    const alignedSymptoms = getSymptomTagsForMoodLog(log);
    const logState = getLogState(log.mood, alignedSymptoms);
    if (filterState !== 'All' && logState !== filterState) return false;

    return true;
  });

  const filteredSymptomLogs = symptomLogs.filter(log => {
    const logDate = resolveDate(log.timestamp);
    const now = new Date();
    const diffDays = (now.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24);

    if (filterRange !== 9999 && diffDays > filterRange) return false;
    return true;
  });

  // Calculate Reports parameters using rule engine functions
  const analytics = generateWellnessReport(moodLogs, symptomLogs, reportPeriod === 'weekly' ? 7 : 30);

  const handleSaveAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName || !docDate) {
      alert("Please provide the Doctor Name and Appointment Time.");
      return;
    }
    await addDoctorAppointment(docName, docDate, docNotes, docAdvice);
    setDocName('');
    setDocDate('');
    setDocNotes('');
    setDocAdvice('');
    setIsAddingAppointment(false);
  };

  return (
    <div className="space-y-10 selection:bg-blue-100">
      <div className="flex justify-between items-center">
        <button onClick={onBack} className="text-slate-400 hover:text-slate-600 flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-colors cursor-pointer">
          <ChevronRight className="rotate-180" size={16} /> Back to Dashboard
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={exportToCSV}
            disabled={moodLogs.length === 0}
            className="py-3 px-4 text-[10px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl font-black uppercase tracking-widest text-slate-700 dark:text-slate-350 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-xs shrink-0"
          >
            <Download size={14} /> Export CSV
          </button>
          <button
            onClick={exportToPDF}
            disabled={moodLogs.length === 0}
            className="py-3 px-4 text-[10px] bg-emerald-600 dark:bg-emerald-500 text-white hover:bg-emerald-700 dark:hover:bg-emerald-650 rounded-xl font-black uppercase tracking-widest flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-xs shrink-0"
          >
            <Download size={14} /> Clinical PDF Report
          </button>
        </div>
      </div>

      <section>
        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase mb-2">My Reflective Journal</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium italic">Empower yourself with wellness trends and analytics reviews.</p>
      </section>

      {/* 2-Tab Control Selector Option Panel */}
      <div className="flex border-b border-slate-100 dark:border-slate-800 overflow-x-auto pb-px gap-2">
        <button 
          onClick={() => setActiveTab('symptoms')}
          className={`pb-3 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all shrink-0 cursor-pointer ${activeTab === 'symptoms' ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 font-extrabold' : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          Symptoms Only
        </button>
        <button 
          id="tour-wellness-reports"
          onClick={() => setActiveTab('reports')}
          className={`pb-3 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all shrink-0 cursor-pointer ${activeTab === 'reports' ? 'border-purple-600 text-purple-700 dark:text-purple-400' : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          Intelligence Reports
        </button>
      </div>

      {/* FILTER CONTROL (Only shown on Symptoms tab) */}
      {activeTab === 'symptoms' && (
        <section className="bg-slate-50 dark:bg-[#18262C] border border-slate-100 dark:border-[#2C414C] p-6 rounded-3xl space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 dark:text-slate-450 uppercase tracking-widest px-1">Date Range</label>
              <select
                value={filterRange}
                onChange={(e) => setFilterRange(Number(e.target.value))}
                className="w-full bg-white dark:bg-[#203038] border border-slate-200 dark:border-[#2C414C] rounded-xl py-3 px-4 font-bold text-xs text-slate-700 dark:text-[#E3ECF0] focus:outline-none focus:ring-2 focus:ring-blue-600/15 cursor-pointer"
              >
                <option value={7}>Last 7 Days</option>
                <option value={30}>Last 30 Days</option>
                <option value={9999}>All Time</option>
              </select>
            </div>
          </div>
        </section>
      )}

      {/* TAB RENDERING */}
      <div className="space-y-6">
        
        {/* TAB 2: Symptoms Only */}
        {activeTab === 'symptoms' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredSymptomLogs.length === 0 ? (
              <div className="col-span-full text-center py-20 text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest italic border-2 border-dashed border-slate-100 dark:border-[#2C414C] rounded-3xl bg-white dark:bg-[#203038]">
                No matching physical indicator logs found.
              </div>
            ) : (
              filteredSymptomLogs.map(log => (
                <div key={log.id} className="wellness-card space-y-4 hover:translate-y-[-2px] transition-transform flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-baseline mb-4">
                      <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter">Symptom Markers</h4>
                      <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{formatDate(log.timestamp)}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {log.symptoms.length === 0 ? (
                        <span className="text-xs text-slate-400 italic font-medium">None logged.</span>
                      ) : (
                        log.symptoms.map((s: string) => {
                          const isCrisis = s === "Suicidal thoughts" || s === "Self-harm urges";
                          return (
                            <span key={s} className={`text-[10px] font-black px-3 py-1.5 rounded-lg border uppercase tracking-wider ${
                              isCrisis 
                                ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400'
                                : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                            }`}>
                              {s}{isCrisis ? '*' : ''}
                            </span>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 3: Intelligence Reports */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-[#203038] border border-slate-100 dark:border-[#2C414C] rounded-3xl p-6 md:p-8 space-y-6 shadow-xs">
              
              {/* Period selection */}
              <div className="flex justify-between items-center bg-slate-50 dark:bg-[#18262C] p-1 rounded-xl max-w-xs border border-slate-100 dark:border-[#2C414C]">
                <button
                  type="button"
                  onClick={() => setReportPeriod('weekly')}
                  className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                    reportPeriod === 'weekly' ? 'bg-white dark:bg-[#203038] text-purple-700 dark:text-purple-400 shadow-xs border border-slate-100 dark:border-[#2C414C]' : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
                  }`}
                >
                  Weekly Summary
                </button>
                <button
                  type="button"
                  onClick={() => setReportPeriod('monthly')}
                  className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                    reportPeriod === 'monthly' ? 'bg-white dark:bg-[#203038] text-purple-700 dark:text-purple-400 shadow-xs border border-slate-100 dark:border-[#2C414C]' : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
                  }`}
                >
                  Monthly Summary
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Score */}
                <div className="p-6 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100/50 dark:border-purple-900/40 rounded-2xl space-y-2">
                  <h4 className="text-[9px] font-black uppercase tracking-widest text-purple-600 dark:text-purple-400">Total Check-ins</h4>
                  <p className="text-3xl font-black text-slate-900 dark:text-white">{analytics.totalLogsCount}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                    Successful mappings logged in chosen period.
                  </p>
                </div>

                {/* Dominant Mood */}
                <div className="p-6 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100/50 dark:border-blue-900/40 rounded-2xl space-y-2">
                  <h4 className="text-[9px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">Dominant Emotion</h4>
                  <p className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                    {analytics.dominantMood !== 'None' ? (
                      <>
                        <span>{getEmoji(analytics.dominantMood)}</span>
                        <span>{analytics.dominantMood}</span>
                      </>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500 font-bold italic">No data</span>
                    )}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                    Most frequently tracked emotional frequency.
                  </p>
                </div>

                {/* Frequency */}
                <div className="p-6 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100/50 dark:border-emerald-900/40 rounded-2xl space-y-2">
                  <h4 className="text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Top Physical Indicator</h4>
                  <p className="text-lg font-black text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                    {analytics.frequentSymptoms && analytics.frequentSymptoms.length > 0 ? (
                      <span>🟢 {analytics.frequentSymptoms[0]}</span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500 font-bold italic">No physical records</span>
                    )}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                    Most recurrent physical alignment.
                  </p>
                </div>

              </div>

              {/* Actionable insight box */}
              <div className="border border-slate-100 dark:border-[#2C414C] bg-slate-50 dark:bg-[#18262C] rounded-2xl p-6 space-y-3.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center">
                    <Zap size={14} />
                  </div>
                  <div>
                    <h5 className="text-xs font-black uppercase text-slate-900 dark:text-white">Preventive Actionable Insight</h5>
                    <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Automated clinical rule mapping translation</p>
                  </div>
                </div>
                
                <p className="text-sm text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">
                  {analytics.actionableInsight}
                </p>

                <div className="border-t border-slate-200/50 dark:border-[#2C414C] pt-3" />
                <div className="flex items-start gap-2 text-[10px] text-slate-400 dark:text-slate-500 leading-normal font-medium italic">
                  <span>ℹ️ Inspected from raw data patterns. Sharing these trends with your counselor during sessions helps bridge diagnostic loops and speeds up intervention cycles.</span>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function ResourcesView({ 
  setModalInfo, 
  onBack,
  easyMode,
  speakText
}: { 
  setModalInfo: (info: { title: string, content: string } | null) => void, 
  onBack: () => void,
  easyMode?: boolean,
  speakText?: (text: string) => void
}) {
  return (
    <div className="space-y-12">
      <button onClick={onBack} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-2 text-xs font-black uppercase tracking-widest">
        <ChevronRight className="rotate-180" size={16} /> Back to Dashboard
      </button>

      <section>
        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase mb-2">Help Library</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium italic">Verified mental health and preventive healthcare resources for Nigerians.</p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <section className="space-y-6">
          <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] px-1">Crisis Helplines</h3>
          <div className="space-y-4">
            {HELPLINES.map(h => (
              <a key={h.name} href={`tel:${h.number.replace(/\s/g, '')}`} className="wellness-card flex items-center justify-between hover:bg-blue-50 dark:hover:bg-[#1C2C33]/50 group border-slate-100 dark:border-[#2C414C]">
                <div className="space-y-1">
                  <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter">{h.name}</h4>
                  <p className="text-sm text-blue-600 font-bold tracking-tighter">{h.number}</p>
                </div>
                <div className="w-12 h-12 bg-slate-50 dark:bg-[#18262C] rounded-xl flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:bg-blue-600 group-hover:text-white dark:group-hover:bg-blue-600 dark:group-hover:text-white transition-all">
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
              <div key={r.title} className="wellness-card bg-emerald-50/20 dark:bg-emerald-950/10 border-emerald-100/50 dark:border-emerald-900/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white dark:bg-[#1C2C33] rounded-lg text-emerald-600 dark:text-emerald-400 shadow-sm">
                      <Activity size={18} />
                    </div>
                    <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter">{r.title}</h4>
                  </div>
                  <button 
                    onClick={() => setModalInfo({ title: r.title, content: `${r.content} This information is based on public health guidelines for young adults in Nigeria.` })}
                    className="p-2 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-[#18262C] rounded-lg transition-all"
                  >
                    <Info size={18} />
                  </button>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">{r.content}</p>
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

function ProfileEditView({ 
  profile, 
  userId, 
  medReminders, 
  addMedicationReminder, 
  toggleMedicationReminder, 
  deleteMedicationReminder, 
  safetyContacts, 
  addSafetyContact, 
  deleteSafetyContact, 
  systemLocale, 
  saveLocale, 
  theme,
  setTheme,
  easyMode,
  setEasyMode,
  speakText,
  triggerTour,
  onBack 
}: { 
  profile: any, 
  userId: string, 
  medReminders: any[], 
  addMedicationReminder: (medName: string, interval: string, time: string) => Promise<void>, 
  toggleMedicationReminder: (id: string, current: boolean) => Promise<void>, 
  deleteMedicationReminder: (id: string) => Promise<void>, 
  safetyContacts: any[], 
  addSafetyContact: (contactName: string, relationship: string, phone: string, email: string) => Promise<void>, 
  deleteSafetyContact: (id: string) => Promise<void>, 
  systemLocale: any, 
  saveLocale: (loc: any) => Promise<void>, 
  theme: 'light' | 'dark',
  setTheme: (t: 'light' | 'dark') => Promise<void>,
  easyMode?: boolean,
  setEasyMode?: (val: boolean) => void,
  speakText?: (text: string) => void,
  triggerTour?: () => void,
  onBack: () => void 
}) {
  const t = TRANSLATIONS[systemLocale as Locale] || TRANSLATIONS['en'];
  const [name, setName] = useState(profile?.name || '');
  const [dob, setDob] = useState(profile?.dob || '');
  const [age, setAge] = useState(() => {
    if (profile?.dob) return calculateAge(profile.dob).toString();
    return profile?.age?.toString() || '';
  });

  const handleDobChange = (val: string) => {
    setDob(val);
    if (val) {
      setAge(calculateAge(val).toString());
    } else {
      setAge('');
    }
  };

  const [partnerName, setPartnerName] = useState(profile?.wellnessPartnerName || '');
  const [partnerEmail, setPartnerEmail] = useState(profile?.wellnessPartnerEmail || '');
  const [reminderEnabled, setReminderEnabled] = useState(profile?.reminderEnabled !== false);
  const [reminderTime, setReminderTime] = useState(profile?.reminderTime || '09:00');
  const [saving, setSaving] = useState(false);
  const [testSent, setTestSent] = useState(false);

  // Medication Reminder Setup Form States
  const [medName, setMedName] = useState('');
  const [medInterval, setMedInterval] = useState('Daily');
  const [medTime, setMedTime] = useState('08:00');
  const [isAddingMed, setIsAddingMed] = useState(false);

  // Safety Emergency Trusted Contacts Setup Form States
  const [cName, setCName] = useState('');
  const [cRelation, setCRelation] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [cEmail, setCEmail] = useState('');
  const [isAddingContact, setIsAddingContact] = useState(false);

  const profileLoadedRef = useRef(false);
  useEffect(() => {
    if (profile && !profileLoadedRef.current) {
      profileLoadedRef.current = true;
      setName(profile.name || '');
      setDob(profile.dob || '');
      if (profile.dob) {
        setAge(calculateAge(profile.dob).toString());
      }
      setPartnerName(profile.wellnessPartnerName || '');
      setPartnerEmail(profile.wellnessPartnerEmail || '');
      setReminderEnabled(profile.reminderEnabled !== false);
      setReminderTime(profile.reminderTime || '09:00');
    }
  }, [profile]);

  const [permissionState, setPermissionState] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );

  const requestPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    const res = await Notification.requestPermission();
    setPermissionState(res);
  };

  const handleSendTestNotification = () => {
    if (typeof window === 'undefined') return;
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);

    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification("VitalMind Check-in", {
          body: `How are you feeling today, ${name || 'friend'}? Tap to log your mood.`,
          icon: '/favicon.ico'
        });
      } catch (e) {
        console.error("Test notification error:", e);
      }
    } else {
      const event = new CustomEvent('vitalmind_test_notification', {
        detail: {
          title: "VitalMind Check-in",
          body: `How are you feeling today, ${name || 'friend'}? Tap to log your mood.`
        }
      });
      window.dispatchEvent(event);
    }
  };

  const handleSaveMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medName) {
      alert("Please provide the medication name.");
      return;
    }
    await addMedicationReminder(medName, medInterval, medTime);
    setMedName('');
    setIsAddingMed(false);
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName || !cRelation || !cPhone) {
      alert("Please enter Name, Relation and Phone number.");
      return;
    }
    await addSafetyContact(cName, cRelation, cPhone, cEmail);
    setCName('');
    setCRelation('');
    setCPhone('');
    setCEmail('');
    setIsAddingContact(false);
  };

  const handleSave = async () => {
    if (!dob) {
      alert("Please select your Date of Birth.");
      return;
    }
    const parsedAge = calculateAge(dob);
    if (!name || isNaN(parsedAge) || parsedAge < 15 || parsedAge > 35) {
      alert(`Under current requirements, your computed age must be between 15 and 35 years based on your date of birth (Current age calculated: ${parsedAge || 0} years).`);
      return;
    }

    setSaving(true);
    try {
      if (userId === 'guest-user') {
        const localProfileRaw = localStorage.getItem('vitalmind_profile_guest');
        const localProfile = localProfileRaw ? JSON.parse(localProfileRaw) : {};
        const updated = {
          ...localProfile,
          name,
          age: parsedAge,
          dob,
          wellnessPartnerName: partnerName,
          wellnessPartnerEmail: partnerEmail,
          reminderEnabled,
          reminderTime,
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem('vitalmind_profile_guest', JSON.stringify(updated));
        window.dispatchEvent(new Event('vitalmind_guest_data_changed'));
        onBack();
        return;
      }

      const path = `users/${userId}`;
      await setDoc(doc(db, path), {
        name,
        age: parsedAge,
        dob,
        wellnessPartnerName: partnerName,
        wellnessPartnerEmail: partnerEmail,
        reminderEnabled,
        reminderTime,
        updatedAt: serverTimestamp()
      }, { merge: true });
      onBack();
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `users/${userId}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-10 selection:bg-emerald-100 pb-16 text-slate-900 dark:text-slate-100 font-sans">
      <section>
        <button onClick={onBack} className="text-slate-400 dark:text-slate-500 mb-6 hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-2 text-xs font-black uppercase tracking-widest cursor-pointer">
          <ChevronRight className="rotate-180" size={16} /> Back to Dashboard
        </button>
        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase mb-2">My Settings & Care Circle</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium italic">Adjust appearance theme, language, medical agents, check-in schedules, and safety networks.</p>
      </section>

      <div className="space-y-10">

        {/* Theme Settings Selection */}
        <div className="bg-white/95 dark:bg-[#203038] border border-[#CCFBF1]/50 dark:border-[#2C414C] p-6 rounded-[28px] space-y-4 shadow-xs">
          <h3 className="text-[10px] font-black text-[#10B981] dark:text-[#E0F2FE] uppercase tracking-[0.3em] border-b border-slate-50 dark:border-[#2C414C] pb-2">Appearance theme</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold">Tweak application color configuration for an elegant tracking experience.</p>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`p-4 rounded-2xl border transition-all text-left flex flex-col justify-between h-24 cursor-pointer ${
                theme === 'light' 
                  ? 'bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-600 dark:border-emerald-500 text-emerald-800 dark:text-emerald-400' 
                  : 'bg-white dark:bg-[#18262C] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#203038]/60 border-slate-200 dark:border-[#2C414C]'
              }`}
            >
              <span className="text-xl">☀️</span>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest block">Light Mode</span>
                <span className="text-[8px] text-slate-400 dark:text-slate-500 font-semibold block mt-1">Soft teal & light blue waves</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`p-4 rounded-2xl border transition-all text-left flex flex-col justify-between h-24 cursor-pointer ${
                theme === 'dark' 
                  ? 'bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-600 dark:border-emerald-500 text-emerald-800 dark:text-emerald-400' 
                  : 'bg-white dark:bg-[#18262C] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#203038]/60 border-slate-200 dark:border-[#2C414C]'
              }`}
            >
              <span className="text-xl">🌙</span>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest block">Dark Mode</span>
                <span className="text-[8px] text-slate-400 dark:text-slate-500 font-semibold block mt-1">Cosmic slate & midnight depths</span>
              </div>
            </button>
          </div>
        </div>

        {/* Language Settings Selection */}
        <div className="bg-white/95 dark:bg-[#203038] border border-slate-100 dark:border-[#2C414C] p-6 rounded-[28px] space-y-4 shadow-xs">
          <h3 className="text-[10px] font-black text-blue-600 dark:text-[#E0F2FE] uppercase tracking-[0.3em] border-b border-slate-50 dark:border-[#2C414C] pb-2 flex items-center gap-1.5 justify-start">
            🌐 Selection of language
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold">Select your preferred accent context for the wellness assistant and notifications.</p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {LANGUAGES.map((lang) => {
              const isActive = (systemLocale || 'en') === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => saveLocale(lang.code)}
                  className={`p-3 rounded-2xl border transition-all text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                    isActive 
                      ? 'bg-blue-500/10 dark:bg-blue-500/20 border-blue-600 dark:border-blue-500 text-blue-800 dark:text-blue-400 font-bold' 
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <span className="text-2xl">{lang.flag}</span>
                  <span className="text-[10px] uppercase font-black tracking-wider block">{lang.name}</span>
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Basic Information section */}
        <div className="bg-white dark:bg-[#203038] border border-slate-100 dark:border-[#2C414C] p-6 rounded-3xl space-y-6 shadow-xs">
          <h3 className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.3em] border-b border-slate-50 dark:border-[#2C414C] pb-2">Basic Information</h3>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Display Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field py-3.5 px-4 font-bold"
              required
            />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1 flex justify-between items-center w-full">
              <span>Date of Birth</span>
              {age && <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px] shrink-0">({age} yrs)</span>}
            </label>
            <input 
              type="date" 
              value={dob}
              onChange={(e) => handleDobChange(e.target.value)}
              className="input-field py-3.5 px-4 font-bold w-full"
              required
            />
          </div>
        </div>

        {/* FEATURE 4: Emergency Safety Trusted Contacts list */}
        <div className="bg-white dark:bg-[#203038] border border-slate-100 dark:border-[#2C414C] p-6 rounded-3xl space-y-6 shadow-xs">
          <div className="flex justify-between items-center border-b border-slate-50 dark:border-[#2C414C] pb-2">
            <h3 className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.3em]">{t.trustedContact}</h3>
            <button
              type="button"
              onClick={() => setIsAddingContact(!isAddingContact)}
              className="py-1.5 px-3 bg-emerald-50 dark:bg-emerald-950/20 text-[10px] text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900 rounded-lg font-black uppercase tracking-wider transition-colors cursor-pointer"
            >
              {isAddingContact ? 'Hide Form' : 'Add Contact'}
            </button>
          </div>
          
          <p className="text-xs text-slate-400 dark:text-slate-400/90 font-semibold leading-relaxed">
            Registered safety conduits receive priority display details during distressed episodes in Crisis Support mode. Add up to 3 trusted agents.
          </p>

          {isAddingContact && (
            <form onSubmit={handleSaveContact} className="bg-slate-50/50 dark:bg-[#1C2C33]/50 p-5 rounded-2xl border border-slate-100 dark:border-[#2C414C] space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-0.5">Contact Full Name</label>
                  <input
                    type="text"
                    value={cName}
                    onChange={(e) => setCName(e.target.value)}
                    placeholder="e.g. Samuel Adebayo"
                    className="input-field py-2.5 px-3 text-xs font-bold"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-0.5">Connection / Relationship</label>
                  <input
                    type="text"
                    value={cRelation}
                    onChange={(e) => setCRelation(e.target.value)}
                    placeholder="e.g. Spouse, Cousin, Advocate"
                    className="input-field py-2.5 px-3 text-xs font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-0.5">Mobile Phone (Emergency dial)</label>
                  <input
                    type="tel"
                    value={cPhone}
                    onChange={(e) => setCPhone(e.target.value)}
                    placeholder="e.g. +234 81 2345 6789"
                    className="input-field py-2.5 px-3 text-xs font-bold"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-0.5">E-mail Address (Optional)</label>
                  <input
                    type="email"
                    value={cEmail}
                    onChange={(e) => setCEmail(e.target.value)}
                    placeholder="e.g. family@guardian.com"
                    className="input-field py-2.5 px-3 text-xs font-bold"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary w-full py-3 text-[10px] uppercase tracking-widest text-white"
              >
                Add Safety Companion
              </button>
            </form>
          )}

          <div className="space-y-3">
            {safetyContacts.length === 0 ? (
              <div className="text-center py-6 text-slate-400 font-bold uppercase tracking-widest italic text-xs border border-dashed border-slate-100 dark:border-[#2C414C] rounded-2xl bg-slate-50/20 dark:bg-[#1C2C33]/20">
                No safety companions listed yet.
              </div>
            ) : (
              safetyContacts.map(con => (
                <div key={con.id} className="flex items-center justify-between p-4 border border-slate-100 dark:border-[#2C414C] bg-slate-50/50 dark:bg-[#1C2C33]/50 rounded-2xl shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 rounded-lg flex items-center justify-center font-black text-sm shrink-0">
                      👤
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">{con.name || con.contactName || 'Safety Companion'}</h4>
                      <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">{con.relationship} — {con.phone}</p>
                      {con.email && <span className="text-[9px] text-slate-500 dark:text-slate-400 font-mono italic leading-none">{con.email}</span>}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteSafetyContact(con.id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* FEATURE 8: Medication / Supplement reminder alerts list */}
        <div className="bg-white dark:bg-[#203038] border border-slate-100 dark:border-[#2C414C] p-6 rounded-3xl space-y-6 shadow-xs">
          <div className="flex justify-between items-center border-b border-slate-50 dark:border-[#2C414C] pb-2">
            <h3 className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.3em]">{t.medReminder}</h3>
            <button
              type="button"
              onClick={() => setIsAddingMed(!isAddingMed)}
              className="py-1.5 px-3 bg-indigo-50 dark:bg-indigo-950/20 text-[10px] text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900 rounded-lg font-black uppercase tracking-wider transition-colors cursor-pointer"
            >
              {isAddingMed ? 'Hide Form' : 'Add Medication Alert'}
            </button>
          </div>

          <p className="text-xs text-slate-400 dark:text-slate-400/90 font-semibold leading-relaxed">
            Configure alarms for preventive routines, clinical medicines, or dietary supplements to ensure high longitudinal discipline indices.
          </p>

          {isAddingMed && (
            <form onSubmit={handleSaveMedication} className="bg-slate-50/50 dark:bg-[#1C2C33]/55 p-5 rounded-2xl border border-slate-100 dark:border-[#2C414C] space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-0.5">Medication Name & Dosage</label>
                <input
                  type="text"
                  value={medName}
                  onChange={(e) => setMedName(e.target.value)}
                  placeholder="e.g. Ashwagandha 500mg, Escitalopram 10mg"
                  className="input-field py-2.5 px-3 text-xs font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-0.5">Alert Interval Cadence</label>
                  <select
                    value={medInterval}
                    onChange={(e) => setMedInterval(e.target.value)}
                    className="w-full bg-white dark:bg-[#18262C] border border-slate-200 dark:border-[#2C414C] rounded-xl py-2.5 px-3 font-semibold text-xs text-slate-700 dark:text-[#E3ECF0] focus:outline-none"
                  >
                    <option value="Daily">Once Daily</option>
                    <option value="Twice Daily">Twice Daily</option>
                    <option value="Weekly">Weekly</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-0.5">Alert Alarm Time</label>
                  <input
                    type="time"
                    value={medTime}
                    onChange={(e) => setMedTime(e.target.value)}
                    className="input-field py-2 px-3 text-xs font-bold w-full"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary w-full py-3 text-[10px] uppercase tracking-widest text-white"
              >
                Schedule Med Alert
              </button>
            </form>
          )}

          <div className="space-y-3">
            {medReminders.length === 0 ? (
              <div className="text-center py-6 text-slate-400 font-bold uppercase tracking-widest italic text-xs border border-dashed border-slate-100 dark:border-[#2C414C] rounded-2xl bg-slate-50/20 dark:bg-[#1C2C33]/20">
                No medication reminders scheduled.
              </div>
            ) : (
              medReminders.map(rem => (
                <div key={rem.id} className="flex items-center justify-between p-4 border border-slate-100 dark:border-[#2C414C] bg-slate-50/50 dark:bg-[#1C2C33]/50 rounded-2xl shadow-xs">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggleMedicationReminder(rem.id, rem.enabled)}
                      className={`w-9 h-6 rounded-full p-1 transition-colors relative shrink-0 border ${rem.enabled ? 'bg-indigo-600 border-indigo-600' : 'bg-slate-200 border-slate-300 dark:bg-[#18262C] dark:border-[#2C414C]'}`}
                      title={rem.enabled ? "Turn Off" : "Turn On"}
                    >
                      <div className={`w-3.5 h-3.5 rounded-full bg-white shadow-xs transition-all ${rem.enabled ? 'translate-x-3' : 'translate-x-0'}`} />
                    </button>
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-1.5 leading-none">
                        <span>💊 {rem.medicationName}</span>
                      </h4>
                      <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block mt-1.5">⏰ {rem.timeOfDay} ({rem.dosage})</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteMedicationReminder(rem.id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Daily Reminder Cadence */}
        <div className="bg-white dark:bg-[#203038] border border-slate-100 dark:border-[#2C414C] p-6 rounded-3xl space-y-6 shadow-xs">
          <h3 className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.3em] border-b border-slate-50 dark:border-[#2C414C] pb-2">Daily Check-in Alerts</h3>
          
          {permissionState === 'denied' && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-200 rounded-2xl flex items-center gap-3 text-xs font-bold leading-relaxed shadow-sm pb-2">
              <AlertCircle className="text-amber-600 shrink-0" size={18} />
              <span>Enable notifications to receive daily check-in reminders. If requested, grant permissions in your browser address bar.</span>
            </div>
          )}

          <div className="flex items-center justify-between p-6 bg-slate-50/50 dark:bg-[#1C2C33]/50 border border-slate-100 dark:border-[#2C414C] rounded-2xl shadow-xs">
            <div className="space-y-1">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">Self-Care Reminders</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold font-medium">Receive a gentle prompt to map your wellness daily.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                const toggled = !reminderEnabled;
                setReminderEnabled(toggled);
                if (toggled && permissionState !== 'granted') {
                  requestPermission();
                }
              }}
              className={`w-12 h-6 rounded-full p-1 transition-colors relative shrink-0 border ${reminderEnabled ? 'bg-blue-600 border-blue-600' : 'bg-slate-200 border-slate-300 dark:bg-[#18262C] dark:border-[#2C414C]'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${reminderEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          {reminderEnabled && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-4 overflow-hidden"
            >
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Alert Time</label>
                <input 
                  type="time" 
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="input-field py-3.5 px-4 font-bold"
                />
              </div>

              <div className="p-6 bg-slate-50 dark:bg-[#18262C] border border-slate-100/60 dark:border-[#2C414C] rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-xs">
                <div className="space-y-1">
                  <h5 className="font-black text-slate-900 dark:text-white text-[10px] uppercase tracking-wider">Test Reminder Setup</h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium font-semibold">Verify how notification popups arrive instantly on your device.</p>
                </div>
                <button
                  type="button"
                  onClick={handleSendTestNotification}
                  disabled={testSent}
                  className="py-3 px-5 text-[9px] font-black uppercase tracking-widest text-slate-700 dark:text-[#E3ECF0] bg-white dark:bg-[#203038] border border-slate-200 dark:border-[#2C414C] hover:bg-slate-50 dark:hover:bg-[#2a3c46] hover:border-slate-300 dark:hover:border-[#354D59] rounded-xl transition-all shrink-0 cursor-pointer"
                >
                  {testSent ? 'Fired! ✨' : 'Test Trigger'}
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Accessibility & Walkthrough Replay Tour Settings */}
        <div id="tour-accessibility-replay" className="bg-white dark:bg-[#203038] border border-slate-100 dark:border-[#2C414C] p-6 rounded-3xl space-y-6 shadow-xs">
          <h3 className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.3em] border-b border-slate-50 dark:border-[#2C414C] pb-2">Accessibility & App Assistant Guidance</h3>
          
          <div className="flex items-center justify-between p-6 bg-slate-50/50 dark:bg-[#1C2C33]/50 border border-slate-100 dark:border-[#2C414C] rounded-2xl shadow-xs">
            <div className="space-y-1">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">Easy Read & Volume Assistance</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">Simplifies layouts and reads clinical highlights for low digital literacy or reading needs.</p>
            </div>
            <button
              type="button"
              id="settings-easy-mode-btn"
              onClick={() => {
                if (setEasyMode) {
                  const val = !easyMode;
                  setEasyMode(val);
                  localStorage.setItem('vitalmind_easy_mode', val ? 'true' : 'false');
                  if (val && speakText) {
                    speakText("Easy read voice helper active.");
                  }
                }
              }}
              className={`w-12 h-6 rounded-full p-1 transition-colors relative shrink-0 border ${easyMode ? 'bg-[#10B981] border-[#10B981]' : 'bg-slate-200 border-slate-300 dark:bg-[#18262C] dark:border-[#2C414C]'}`}
            >
              <div className={`w-3.5 h-3.5 rounded-full bg-white shadow-xs transition-all ${easyMode ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-6 bg-slate-50/50 dark:bg-[#1C2C33]/50 border border-slate-100 dark:border-[#2C414C] rounded-2xl shadow-xs">
            <div className="space-y-1">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">Interactive Walkthrough Tour</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">Want to learn how the dashboard, mood logging, reports, and community systems work?</p>
            </div>
            <button
              type="button"
              id="replay-tour-btn"
              onClick={() => {
                if (triggerTour) {
                  triggerTour();
                }
              }}
              className="py-2 px-4 text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 hover:text-white dark:hover:text-white bg-emerald-50 dark:bg-[#18262C] hover:bg-emerald-600 dark:hover:bg-emerald-500 border border-emerald-100 dark:border-[#2C414C] rounded-xl transition-all cursor-pointer"
            >
              Replay Tour
            </button>
          </div>
        </div>
      </div>

      <button
        disabled={saving}
        onClick={handleSave}
        className="btn-primary w-full py-5 text-[12px] uppercase tracking-widest shadow-xl shadow-blue-100 mt-4 h-16"
      >
        {saving ? 'Updating Profile...' : 'Save Changes'}
      </button>
    </div>
  );
}

function CrisisView({ safetyContacts = [], onBack }: { safetyContacts?: any[], onBack: () => void }) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (num: string, id: string) => {
    try {
      navigator.clipboard.writeText(num);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-12 pb-12 select-none">
      <section>
        <button onClick={onBack} className="text-slate-400 mb-6 hover:text-slate-600 flex items-center gap-2 text-xs font-black uppercase tracking-widest cursor-pointer">
          <ChevronRight className="rotate-180" size={16} /> Back to Dashboard
        </button>
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-red-100 animate-pulse">
            <AlertCircle size={24} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Crisis Support</h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400 font-medium italic text-lg">You don't have to carry this alone. Please reach out to one of these verified resources now.</p>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 uppercase tracking-wide font-bold">
          💡 If direct dialing is restricted on your browser or device, tap Copy Number to paste directly into your phone dialer.
        </p>
      </section>

      {/* Primary User Safety Contacts List */}
      {safetyContacts.length > 0 && (
        <section className="bg-red-50/20 dark:bg-red-950/10 border-2 border-red-100 dark:border-red-900/30 rounded-[32px] p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-2">
            <span className="text-lg">🛡️</span>
            <div>
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest leading-none">Your Safety Circle</h3>
              <p className="text-[10px] text-slate-400 font-bold block mt-1.5 uppercase tracking-wider">PRE-CONFIGURED COMPANIONS & DISPATCHERS</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {safetyContacts.map(con => {
              const displayName = con.name || con.contactName || 'Safety Companion';
              const silentSmsBody = encodeURIComponent(`Hi ${displayName}, this is a silent check-in. I am feeling distressed right now & would love a gentle hand or voice. (Sent from VitalMind)`);
              const cleanDialNum = con.phone.replace(/[^\d+]/g, '');
              const isCopied = copiedId === con.id;
              return (
                <div key={con.id} className="bg-white dark:bg-[#203038] border border-red-100 dark:border-red-900/30 rounded-2xl p-5 shadow-xs flex flex-col justify-between gap-4">
                  <div>
                    <span className="text-[9px] font-black text-red-500 uppercase tracking-wider bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 px-2 py-0.5 rounded-md">
                      {con.relationship}
                    </span>
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-sm mt-2">{displayName}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">{con.phone}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-t border-slate-50 dark:border-slate-800/60 pt-3">
                    <a
                      href={`tel:${cleanDialNum}`}
                      className="py-3 px-4 bg-red-600 text-white rounded-lg flex items-center justify-center gap-1.5 hover:bg-red-700 font-black text-[9px] uppercase tracking-wider transition-colors shadow-sm"
                    >
                      📞 Voice Call
                    </a>
                    <a
                      href={`sms:${cleanDialNum}?body=${silentSmsBody}`}
                      className="py-3 px-4 bg-slate-900 dark:bg-[#18262C] text-white rounded-lg flex items-center justify-center gap-1.5 hover:bg-slate-800 dark:hover:bg-[#203038] font-black text-[9px] uppercase tracking-wider transition-colors shadow-sm border border-transparent dark:border-[#2C414C]"
                    >
                      💬 Silent SMS
                    </a>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy(con.phone, con.id)}
                    className="py-2 px-3 bg-slate-50 dark:bg-[#1C2C33] text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-100 dark:hover:bg-[#203038] font-black text-[9px] uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 border border-slate-100 dark:border-slate-800 cursor-pointer"
                  >
                    📋 {isCopied ? 'Copied Number!' : 'Copy Contact Number'}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="space-y-6">
          <h3 className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-[0.3em] px-1">Emergency Calls</h3>
          <div className="space-y-4">
            {HELPLINES.map(h => {
              const isCopied = copiedId === h.name;
              return (
                <div key={h.name} className="wellness-card bg-red-50/30 dark:bg-red-950/10 border-red-100/50 dark:border-red-900/30 flex items-center justify-between hover:bg-red-50 dark:hover:bg-red-950/20 group transition-all">
                  <div className="space-y-1">
                    <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter">{h.name}</h4>
                    <p className="text-sm text-red-600 dark:text-red-400 font-bold tracking-tighter">{h.number}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <a 
                      href={`tel:${h.number.replace(/[^\d+]/g, '')}`} 
                      className="w-10 h-10 bg-white dark:bg-[#18262C] border border-transparent dark:border-[#2C414C] rounded-xl flex items-center justify-center text-red-600 dark:text-red-400 shadow-sm hover:bg-red-600 hover:text-white transition-all"
                      title="Direct Voice Call"
                    >
                      <Phone size={16} />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleCopy(h.number, h.name)}
                      className="w-10 h-10 bg-white dark:bg-[#18262C] border border-transparent dark:border-[#2C414C] rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 shadow-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                      title="Copy Support Hotline"
                    >
                      {isCopied ? <span className="text-[8px] font-black uppercase text-emerald-600">Copied</span> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="space-y-6">
          <h3 className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.3em] px-1">Instant Actions</h3>
          <div className="space-y-4">
            <div className="wellness-card border-blue-100 dark:border-blue-900/35 bg-blue-50/10 dark:bg-blue-950/10">
              <h4 className="font-black text-slate-900 dark:text-white uppercase text-xs tracking-tight mb-3">Distress Protocol</h4>
              <ul className="space-y-3">
                <li className="flex gap-3 text-sm font-medium text-slate-600 dark:text-slate-300">
                  <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
                  Focus on your breathing. Slowly in through your nose, hold for 4, out through your mouth.
                </li>
                <li className="flex gap-3 text-sm font-medium text-slate-600 dark:text-slate-300">
                  <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
                  Ground yourself. Identify 5 things you can see, 4 things you can touch, 3 things you can hear.
                </li>
                <li className="flex gap-3 text-sm font-medium text-slate-600 dark:text-slate-300">
                  <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</span>
                  Call a friend or family member if you feel comfortable. Just say "I'm having a hard time."
                </li>
              </ul>
            </div>
            
            <div className="bg-slate-900 p-6 rounded-3xl text-white">
              <h4 className="font-black uppercase text-[10px] tracking-widest text-blue-400 mb-2">Note on Fatigue</h4>
              <p className="text-xs text-slate-300 font-medium leading-relaxed">
                If you feel too physically sick or exhausted to talk, it's okay to just rest. The trackers can wait. Your immediate safety and comfort are what matters most right now.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function CrisisOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-6 overflow-y-auto">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-[#203038] border border-slate-100 dark:border-[#2C414C] rounded-[40px] w-full max-w-2xl p-8 md:p-12 shadow-2xl relative"
      >
        <button 
          onClick={onClose}
          className="absolute right-8 top-8 p-3 bg-slate-100 dark:bg-[#18262C] hover:bg-slate-200 dark:hover:bg-[#2a3c46] rounded-full text-slate-400 dark:text-slate-500 transition-colors"
        >
          <Plus className="rotate-45" size={24} />
        </button>

        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-red-600 rounded-3xl flex items-center justify-center text-white mx-auto mb-8 shadow-2xl shadow-red-200 dark:shadow-none">
            <AlertCircle size={40} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase mb-4">Emergency Support</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium max-w-sm mx-auto">Verified Nigerian helplines available 24/7. Your wellbeing is the priority.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          {HELPLINES.map(h => (
            <a key={h.name} href={`tel:${h.number.replace(/\s/g, '')}`} className="flex items-center justify-between p-6 bg-slate-50 dark:bg-[#18262C] border border-slate-100 dark:border-[#2C414C] hover:bg-red-50 dark:hover:bg-red-950/20 hover:border-red-100 dark:hover:border-red-900/30 transition-all group rounded-3xl">
              <div>
                <h4 className="font-black text-slate-900 dark:text-white uppercase text-xs tracking-tight">{h.name}</h4>
                <p className="text-lg font-black text-red-600 tracking-tighter mt-1">{h.number}</p>
              </div>
              <div className="w-12 h-12 bg-white dark:bg-[#203038] rounded-2xl flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:bg-red-600 group-hover:text-white shadow-sm transition-all border border-transparent dark:border-[#2C414C]">
                <Phone size={20} />
              </div>
            </a>
          ))}
        </div>

        <button 
          onClick={onClose}
          className="w-full py-5 bg-slate-900 dark:bg-[#18262C] text-white rounded-2xl font-black uppercase tracking-widest text-[12px] shadow-xl hover:bg-slate-800 dark:hover:bg-[#2a3c46] transition-colors border border-transparent dark:border-[#2C414C]"
        >
          Return to Login
        </button>
      </motion.div>
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
