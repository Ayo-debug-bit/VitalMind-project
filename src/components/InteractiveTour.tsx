import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ChevronRight, 
  Compass, 
  Sparkles,
  ArrowBigDown
} from 'lucide-react';

interface TourStep {
  id: string;
  targetId: string;
  title: string;
  description: string;
  arrowPosition: 'top' | 'bottom' | 'left' | 'right';
  badge: string;
  isInteractive?: boolean;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    targetId: 'header-wellness-state',
    title: "1. Welcome! Let's Practice",
    description: "Welcome to your Preventive Healthcare & Mental Wellness assistance workspace. Let's do a quick, hands-on practice walkthrough of how everything connects to build your mental model!",
    arrowPosition: 'top',
    badge: 'Onboarding System'
  },
  {
    id: 'wellness_index',
    targetId: 'header-wellness-state',
    title: '2. Your Wellness Indicator',
    description: "This is your calculated overall Wellness Score. When you log your mood and physical symptoms regularly, our clinically vetted rules evaluate your status to guide your clinical & preventive actions!",
    arrowPosition: 'top',
    badge: 'State Score'
  },
  {
    id: 'mood_tab',
    targetId: 'nav-mood',
    title: '3. Tap to track your Mood',
    description: 'Let\'s try it! Tap the "Mood" button highlighted below in the navigation bar to open the Mood Tracker dashboard.',
    arrowPosition: 'bottom',
    badge: 'Hands-on Practice',
    isInteractive: true
  },
  {
    id: 'choose_mood',
    targetId: 'mood-btn-Calm',
    title: '4. Choose Mood "Calm"',
    description: 'Wonderful! Now select a mood to register. Click the "Calm" emoji button highlighted in the spotlight catalog.',
    arrowPosition: 'bottom',
    badge: 'Choose Mood',
    isInteractive: true
  },
  {
    id: 'save_mood',
    targetId: 'mood-submit-btn',
    title: '5. Submit Mood Entry',
    description: 'Look at that! Once selected, click the green "Confirm Mood Entry" button to save your mood and return back.',
    arrowPosition: 'top',
    badge: 'Save Entry',
    isInteractive: true
  },
  {
    id: 'symptoms_tab',
    targetId: 'nav-symptoms',
    title: '6. Open Symptom Logger',
    description: 'Excellent mood check-in! Next, let\'s learn how to log a symptom. Tap the "Symptoms" tab highlighted below.',
    arrowPosition: 'bottom',
    badge: 'Symptom Entry',
    isInteractive: true
  },
  {
    id: 'choose_symptom',
    targetId: 'symptom-btn-Fatigue',
    title: '7. Log "Fatigue" Symptom',
    description: 'Well done! Select markers present in your current state to log them. Click the "Fatigue" card highlighted below.',
    arrowPosition: 'top',
    badge: 'Hands-on',
    isInteractive: true
  },
  {
    id: 'save_symptoms',
    targetId: 'symptom-submit-btn',
    title: '8. Submit Symptom Log',
    description: 'Great! Now save your reports securely. Click the blue "Submit Symptom Log" button to record this and return.',
    arrowPosition: 'top',
    badge: 'Save Symptoms',
    isInteractive: true
  },
  {
    id: 'preventive_care',
    targetId: 'tour-preventive-care',
    title: '9. Preventive Care Vitals',
    description: 'Amazing! Now look at the Preventive Care recommendations. Vetted clinical guidelines for age & sex update dynamically to ensure you stay healthy.',
    arrowPosition: 'top',
    badge: 'Preventive Actions'
  },
  {
    id: 'intelligence_center',
    targetId: 'tour-intelligence-center',
    title: '10. Intelligence Insights',
    description: 'Here is your rule-based Intelligence Center. It computes warning markers over 14-day rolling windows to suggest medical actions, so check it regularly!',
    arrowPosition: 'top',
    badge: 'Smart Center'
  },
  {
    id: 'peer_community',
    targetId: 'tour-peer-community',
    title: '11. Safe Peer Space',
    description: 'Connect with other peers anonymously, vote on wellness topics, and build your supportive medical circle securely!',
    arrowPosition: 'top',
    badge: 'Peer Network'
  },
  {
    id: 'emergency_support',
    targetId: 'nav-crisis',
    title: '12. Crisis & Emergency Support',
    description: 'Your safety is absolutely critical. For any immediate assistance or suicidal/self-harm warnings, emergency advisors and pre-saved safety circle dispatchers are always one-tap away here.',
    arrowPosition: 'bottom',
    badge: 'Emergency Help'
  },
  {
    id: 'reports',
    targetId: 'tour-wellness-reports',
    title: '13. Clinical Wellness Reports',
    description: 'Need to consult with a doctor? Click the "History" section anytime to download high-contrast formatted PDF reports to share with clinical practitioners.',
    arrowPosition: 'bottom',
    badge: 'PDF Exports'
  },
  {
    id: 'profile_instructions',
    targetId: 'tour-profile-btn',
    title: '14. Easy Mode & Translations',
    description: 'Lastly, click your Profile anytime to switch to Easy Mode (adding full reading voice prompts) or change between Hausa, Igbo, Yoruba, or English translations!',
    arrowPosition: 'top',
    badge: 'Done!'
  }
];

interface InteractiveTourProps {
  onClose: () => void;
  theme?: 'light' | 'dark';
  currentView: 'dashboard' | 'mood' | 'symptoms' | 'history' | 'resources' | 'profile' | 'crisis';
  setCurrentView: (view: 'dashboard' | 'mood' | 'symptoms' | 'history' | 'resources' | 'profile' | 'crisis') => void;
}

export function InteractiveTour({ onClose, theme = 'light', currentView, setCurrentView }: InteractiveTourProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const lastScrollIndexRef = useRef<number>(-1);

  const currentStep = TOUR_STEPS[currentStepIndex];

  // Save completion status to localStorage
  const handleTourFinish = () => {
    localStorage.setItem('preventive_healthcare_tour_completed', 'true');
    onClose();
  };

  // Automatically switch view based on current step
  useEffect(() => {
    if (!currentStep) return;
    
    let targetView: 'dashboard' | 'mood' | 'symptoms' | 'history' | 'resources' | 'profile' | 'crisis' | null = null;
    
    if (
      currentStep.id === 'welcome' || 
      currentStep.id === 'wellness_index' ||
      currentStep.id === 'mood_tab' ||
      currentStep.id === 'preventive_care' ||
      currentStep.id === 'intelligence_center' ||
      currentStep.id === 'peer_community'
    ) {
      targetView = 'dashboard';
    } else if (currentStep.id === 'choose_mood' || currentStep.id === 'save_mood') {
      targetView = 'mood';
    } else if (currentStep.id === 'choose_symptom' || currentStep.id === 'save_symptoms') {
      targetView = 'symptoms';
    } else if (currentStep.id === 'reports') {
      targetView = 'history';
    } else if (currentStep.id === 'profile_instructions') {
      targetView = 'profile';
    }
    
    if (targetView && currentView !== targetView) {
      setCurrentView(targetView);
    }
  }, [currentStepIndex, currentStep, currentView, setCurrentView]);

  // Track coordinates of the current step
  useEffect(() => {
    let active = true;
    let animationFrameId: number;
    const startTime = Date.now();
    const trackingDuration = 2000;
    
    const findElement = (): HTMLElement | null => {
      if (!currentStep) return null;
      let element: HTMLElement | null = null;

      // Special fallback matching for emergency button (desktop vs mobile)
      if (currentStep.targetId === 'nav-crisis') {
        const desktopCrisis = document.getElementById('nav-crisis');
        const isDesktopVisible = desktopCrisis && desktopCrisis.getBoundingClientRect().width > 0;
        if (isDesktopVisible) {
          element = desktopCrisis;
        } else {
          element = document.getElementById('dashboard-crisis-btn');
        }
      } else if (currentStep.targetId.startsWith('nav-')) {
        const candidates = document.querySelectorAll(`[id="${currentStep.targetId}"]`);
        for (let i = 0; i < candidates.length; i++) {
          const el = candidates[i] as HTMLElement;
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            element = el;
            break;
          }
        }
        if (!element) {
          element = document.getElementById(currentStep.targetId);
        }
      } else {
        element = document.getElementById(currentStep.targetId);
      }
      return element;
    };

    const track = () => {
      if (!active) return;
      
      const element = findElement();
      if (element) {
        if (lastScrollIndexRef.current !== currentStepIndex) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          lastScrollIndexRef.current = currentStepIndex;
        }

        const rect = element.getBoundingClientRect();
        
        setCoords(prevCoords => {
          if (
            prevCoords &&
            Math.abs(prevCoords.top - rect.top) < 0.5 &&
            Math.abs(prevCoords.left - rect.left) < 0.5 &&
            Math.abs(prevCoords.width - rect.width) < 0.5 &&
            Math.abs(prevCoords.height - rect.height) < 0.5
          ) {
            return prevCoords;
          }
          return {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          };
        });
      } else {
        if (Date.now() - startTime > 350) {
          setCoords(null);
        }
      }

      if (Date.now() - startTime < trackingDuration) {
        animationFrameId = requestAnimationFrame(track);
      } else {
        setTimeout(() => {
          if (active) {
            track();
          }
        }, 120);
      }
    };

    track();

    const updateOnEvent = () => {
      const element = findElement();
      if (element) {
        const rect = element.getBoundingClientRect();
        setCoords({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });
      }
    };

    window.addEventListener('resize', updateOnEvent, { passive: true });
    window.addEventListener('scroll', updateOnEvent, { passive: true });

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && document.body) {
      observer = new ResizeObserver(() => {
        updateOnEvent();
      });
      observer.observe(document.body);
    }

    return () => {
      active = false;
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', updateOnEvent);
      window.removeEventListener('scroll', updateOnEvent);
      if (observer) {
        observer.disconnect();
      }
    };
  }, [currentStepIndex, currentView]);

  // Click interceptor at capture level ensures interactive step auto-advances
  useEffect(() => {
    if (!currentStep || !currentStep.isInteractive) return;

    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      const targetId = currentStep.targetId;
      let matched = false;

      if (targetId === 'nav-crisis') {
        if (target.closest('#nav-crisis') || target.closest('#dashboard-crisis-btn')) {
          matched = true;
        }
      } else {
        if (target.closest(`[id="${targetId}"]`)) {
          matched = true;
        }
      }

      if (matched) {
        setTimeout(() => {
          setCurrentStepIndex(index => {
            if (index < TOUR_STEPS.length - 1) {
              return index + 1;
            }
            return index;
          });
        }, 350);
      }
    };

    window.addEventListener('click', handleGlobalClick, true);
    return () => {
      window.removeEventListener('click', handleGlobalClick, true);
    };
  }, [currentStepIndex, currentStep]);

  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      handleTourFinish();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  // Build responsive, non-overlapping card positions without using viewports
  const getCardStyle = () => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      let positionAtTop = false;
      if (coords) {
        const targetY = coords.top + (coords.height / 2);
        if (targetY > window.innerHeight / 2) {
          positionAtTop = true;
        }
      }
      return {
        style: {
          position: 'fixed' as const,
          top: positionAtTop ? '16px' : 'auto',
          bottom: positionAtTop ? 'auto' : '16px',
          left: '16px',
          right: '16px',
          maxWidth: 'calc(100% - 32px)',
          margin: '0 auto',
          zIndex: 10001,
        }
      };
    }

    if (!coords) {
      return {
        style: {
          position: 'fixed' as const,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }
      };
    }

    const cardWidth = 350;
    const estimatedCardHeight = 225;
    
    let top = coords.top + coords.height + 16;
    let left = coords.left + (coords.width / 2) - (cardWidth / 2);

    if (left < 16) left = 16;
    if (left + cardWidth > window.innerWidth - 16) {
      left = window.innerWidth - cardWidth - 16;
    }

    const spaceBelow = window.innerHeight - (coords.top + coords.height);
    const spaceAbove = coords.top;

    if (currentStep.arrowPosition === 'bottom' || (spaceBelow < estimatedCardHeight + 20 && spaceAbove > spaceBelow)) {
      top = coords.top - estimatedCardHeight - 16;
      if (top < 16) {
        top = coords.top + coords.height + 16;
      }
    } else {
      top = coords.top + coords.height + 16;
      if (top + estimatedCardHeight > window.innerHeight - 16) {
        top = coords.top - estimatedCardHeight - 16;
      }
    }

    if (top < 16) top = 16;
    if (top + estimatedCardHeight > window.innerHeight - 16) {
      top = window.innerHeight - estimatedCardHeight - 16;
    }

    return {
      style: {
        position: 'absolute' as const,
        top: `${top}px`,
        left: `${left}px`,
        width: `${cardWidth}px`,
      }
    };
  };

  const cardPosition = getCardStyle();

  const getClipPath = () => {
    if (!coords) return 'polygon(0% 0%, 0% 100%, 100% 100%, 100% 0%)';
    const padding = 6;
    const cl = Math.max(0, coords.left - padding);
    const ct = Math.max(0, coords.top - padding);
    const cw = coords.width + (padding * 2);
    const ch = coords.height + (padding * 2);
    
    return `polygon(
      0% 0%, 
      0% 100%, 
      ${cl}px 100%, 
      ${cl}px ${ct}px, 
      ${cl + cw}px ${ct}px, 
      ${cl + cw}px ${ct + ch}px, 
      ${cl}px ${ct + ch}px, 
      ${cl}px 100%, 
      100% 100%, 
      100% 0%
    )`;
  };

  return (
    <div id="interactive-tour-overlay" className="fixed inset-0 z-[9999] pointer-events-none select-none">
      
      {/* Background Mask - Softened dimming as requested to keep context recognizable */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 bg-black/25 dark:bg-black/55 pointer-events-auto backdrop-blur-[0.5px]"
        style={{ clipPath: getClipPath() }}
      />

      {/* Target Focus Ring Overlay with pulsing ring glow */}
      <AnimatePresence mode="wait">
        {coords && (
          <motion.div
            key={`focus-ring-${currentStepIndex}`}
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute border-[3px] border-emerald-500 rounded-2xl pointer-events-none z-[9998] shadow-[0_0_20px_rgba(16,185,129,0.7)]"
            style={{
              position: 'absolute',
              top: `${coords.top - 6}px`,
              left: `${coords.left - 6}px`,
              width: `${coords.width + 12}px`,
              height: `${coords.height + 12}px`,
            }}
          >
            <span className="absolute inset-x-0 -top-10 flex h-8 items-center justify-center pointer-events-none animate-bounce">
              <ArrowBigDown className="text-emerald-500 fill-emerald-500 animate-pulse" size={32} />
            </span>
            <span className="absolute inset-0 rounded-2xl border-2 border-emerald-400 animate-pulse opacity-90" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Guiding Cursor Hand Element - pointing straight up '👆' from exactly below the target box */}
      <AnimatePresence mode="wait">
        {coords && (
          <motion.div
            key={`cursor-step-${currentStepIndex}`}
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            style={{ 
              position: 'absolute',
              top: `${coords.top + coords.height + 4}px`,
              left: `${coords.left + (coords.width / 2) - 36}px`,
            }}
            className="z-[10000] pointer-events-none flex flex-col items-center"
          >
            <div className="relative flex flex-col items-center">
              {/* Animated Ripple ring underneath hand */}
              <span className="absolute -top-3 inline-flex h-12 w-12 rounded-full bg-emerald-500/25 animate-ping" />
              
              <motion.div 
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                className="bg-white dark:bg-[#18262C] border-2 border-emerald-500 p-2 rounded-xl shadow-2xl flex items-center gap-1.5 shrink-0"
              >
                <span className="text-xl">👆</span>
                <span className="text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider whitespace-nowrap">
                  {currentStep.isInteractive ? 'Click here!' : 'Primary spot'}
                </span>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Guide Floating Card */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-text">
        <div className="relative w-full h-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={`tour-card-${currentStepIndex}`}
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              style={cardPosition.style}
              className="pointer-events-auto bg-white/95 dark:bg-[#203038] border border-slate-200 dark:border-[#2C414C] p-5 rounded-[24px] shadow-2xl flex flex-col gap-4 z-[10001] text-left backdrop-blur-md"
            >
              {/* Header */}
              <div className="flex justify-between items-center bg-slate-50 dark:bg-[#18262C] -mx-5 -mt-5 p-3 px-4 rounded-t-[24px] border-b border-slate-100 dark:border-[#2C414C]">
                <div className="flex items-center gap-2">
                  <Compass size={14} className="text-emerald-500 animate-spin" />
                  <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{currentStep.badge}</span>
                </div>
                <button 
                  onClick={onClose}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors pointer-events-auto"
                  title="Skip Tour"
                >
                  <X size={12} />
                </button>
              </div>

              {/* Title & Description */}
              <div className="space-y-1.5">
                <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-1.5">
                  {currentStep.title}
                </h4>
                <p className="text-xs text-slate-500 dark:text-[#a8b8c0] font-medium leading-relaxed">
                  {currentStep.description}
                </p>
                {currentStep.isInteractive && (
                  <div className="inline-flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 p-1.5 rounded-lg text-amber-800 dark:text-amber-400 font-bold text-[9px] uppercase tracking-wider mt-1.5">
                    <Sparkles size={10} className="animate-pulse text-amber-600" /> Complete This Action To Advance Automatically!
                  </div>
                )}
              </div>

              {/* Progress Panel */}
              <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-[#2C414C]">
                <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Step {currentStepIndex + 1} of {TOUR_STEPS.length}
                </span>
                
                <div className="flex gap-2">
                  <button 
                    onClick={onClose}
                    className="px-2.5 py-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-[10px] font-black uppercase rounded-lg transition-colors cursor-pointer pointer-events-auto"
                  >
                    Skip
                  </button>
                  {currentStepIndex > 0 && (
                    <button 
                      onClick={handlePrev}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#18262C] dark:hover:bg-[#2a3c46] text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase rounded-lg transition-colors cursor-pointer pointer-events-auto"
                    >
                      Back
                    </button>
                  )}
                  {/* Hide Next button on interactive steps so users learn by clicking the app element */}
                  {!currentStep.isInteractive ? (
                    <button 
                      onClick={handleNext}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-1 cursor-pointer pointer-events-auto"
                    >
                      {currentStepIndex === TOUR_STEPS.length - 1 ? 'Finish' : 'Next'} <ChevronRight size={10} />
                    </button>
                  ) : (
                    <div className="px-3.5 py-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-[9px] font-extrabold uppercase rounded-lg border border-blue-100 dark:border-blue-950 animate-pulse text-center">
                      Awaiting Action...
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

    </div>
  );
}
