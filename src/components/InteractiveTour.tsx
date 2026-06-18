import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ChevronRight, 
  Compass, 
  Sparkles
} from 'lucide-react';

interface TourStep {
  id: string;
  targetId: string;
  title: string;
  description: string;
  arrowPosition: 'top' | 'bottom' | 'left' | 'right';
  badge: string;
  type: 'action' | 'information' | 'navigation';
  isInteractive?: boolean;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    targetId: 'header-wellness-state',
    title: "1. Welcome, Let's Explore!",
    description: "Welcome to your Preventive Healthcare & Mental Wellness workspace. Let's do a friendly guided walkthrough to build your spatial layout awareness. Click 'Next' to begin!",
    arrowPosition: 'top',
    badge: 'Onboarding System',
    type: 'navigation'
  },
  {
    id: 'wellness_index',
    targetId: 'header-wellness-state',
    title: '2. Your Wellness Indicator',
    description: "This is your calculated overall Wellness Index. When you log your mood and physical symptoms regularly, our rule engine evaluates your data to trigger clinical guidance.",
    arrowPosition: 'top',
    badge: 'Wellness Scale',
    type: 'information'
  },
  {
    id: 'mood_tab',
    targetId: 'nav-mood',
    title: '3. Tap to track your Mood',
    description: "Let's log your first mood! Tap the highlighted Mood button in the navigation bar to pull up the Mood Tracker module.",
    arrowPosition: 'bottom',
    badge: 'Interactive Lab',
    type: 'action',
    isInteractive: true
  },
  {
    id: 'choose_mood',
    targetId: 'mood-btn-Calm',
    title: '4. Choose Mood "Calm"',
    description: "Now let's record how you feel. Click the 'Calm' emoji card highlighted below to select it.",
    arrowPosition: 'bottom',
    badge: 'Interactive Lab',
    type: 'action',
    isInteractive: true
  },
  {
    id: 'save_mood',
    targetId: 'mood-submit-btn',
    title: '5. Submit Mood Entry',
    description: "To register your current state, click the 'Confirm Mood Entry' button to save your log securely.",
    arrowPosition: 'top',
    badge: 'Interactive Lab',
    type: 'action',
    isInteractive: true
  },
  {
    id: 'symptoms_tab',
    targetId: 'nav-symptoms',
    title: '6. Open Symptom Logger',
    description: "Great mood reflection! Next, let's learn how to log symptoms. Tap the Symptoms tab highlighted below.",
    arrowPosition: 'bottom',
    badge: 'Interactive Lab',
    type: 'action',
    isInteractive: true
  },
  {
    id: 'choose_symptom',
    targetId: 'symptom-btn-Fatigue',
    title: '7. Log "Fatigue" Symptom',
    description: "Click the 'Fatigue' card highlighted below to add this physical biomarker to your status checklist.",
    arrowPosition: 'top',
    badge: 'Interactive Lab',
    type: 'action',
    isInteractive: true
  },
  {
    id: 'save_symptoms',
    targetId: 'symptom-submit-btn',
    title: '8. Submit Symptom Log',
    description: "Perfect! Record this securely. Click the blue 'Submit Symptom Log' button to compute warning metrics.",
    arrowPosition: 'top',
    badge: 'Interactive Lab',
    type: 'action',
    isInteractive: true
  },
  {
    id: 'preventive_care',
    targetId: 'tour-preventive-care',
    title: '9. Preventive Care Vitals',
    description: "This pane automatically displays age- and sex-specific medical action recommendations. It updates dynamically as vetted guidelines refresh, keeping you aligned.",
    arrowPosition: 'top',
    badge: 'Educational Insight',
    type: 'information'
  },
  {
    id: 'intelligence_center',
    targetId: 'tour-intelligence-center',
    title: '10. Intelligence Insights',
    description: "This is your rule-based Intelligence Hub. It compiles health signals over a rolling 14-day window to raise preventative alert rules. Check this regularly to catch warnings early!",
    arrowPosition: 'top',
    badge: 'Educational Insight',
    type: 'information'
  },
  {
    id: 'peer_community',
    targetId: 'tour-peer-community',
    title: '11. Safe Peer Space',
    description: "A secure, confidential space to interact anonymously with peers, coordinate support networks, and participate in peer-voted wellness discussions.",
    arrowPosition: 'top',
    badge: 'Navigation Hub',
    type: 'navigation'
  },
  {
    id: 'emergency_support',
    targetId: 'nav-crisis',
    title: '12. Crisis & Emergency Support',
    description: "Your health and safety comes first. For any self-harm warnings or immediate crisis assistance, responders and pre-selected contacts are available one-tap away.",
    arrowPosition: 'bottom',
    badge: 'Navigation Hub',
    type: 'navigation'
  },
  {
    id: 'reports',
    targetId: 'tour-wellness-reports',
    title: '13. High-Contrast Health Reports',
    description: "Whenever you consult a clinician, use the history segment to download high-contrast formatted PDF trackers of your overall wellness indicators.",
    arrowPosition: 'bottom',
    badge: 'Educational Insight',
    type: 'information'
  },
  {
    id: 'profile_instructions',
    targetId: 'settings-easy-mode-btn',
    title: '14. Easy Mode & Languages',
    description: "Lastly, click your Profile anytime to switch to Easy Mode (providing read-aloud spoken prompts) or translate the hub between English, Hausa, Igbo, and Yoruba!",
    arrowPosition: 'top',
    badge: 'Navigation Hub',
    type: 'navigation'
  }
];

interface InteractiveTourProps {
  onClose: () => void;
  theme?: 'light' | 'dark';
  currentView: 'dashboard' | 'mood' | 'symptoms' | 'history' | 'resources' | 'profile' | 'crisis';
  setCurrentView: (view: 'dashboard' | 'mood' | 'symptoms' | 'history' | 'resources' | 'profile' | 'crisis') => void;
  isPopupOpen?: boolean;
}

export function InteractiveTour({ onClose, theme = 'light', currentView, setCurrentView, isPopupOpen = false }: InteractiveTourProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const lastScrollIndexRef = useRef<number>(-1);

  const currentStep = TOUR_STEPS[currentStepIndex];
  const PADDING = 6; // px padding around masks to prevent target overlapping and blocking mob inputs

  // Automatically collapse action/interactive steps by default
  useEffect(() => {
    if (currentStep) {
      setIsCollapsed(currentStep.type === 'action');
    }
  }, [currentStepIndex, currentStep?.id]);

  // A ref to keep track of the absolute latest step index to prevent duplicate or asynchronous race conditions
  const currentStepIndexRef = useRef(currentStepIndex);
  useEffect(() => {
    currentStepIndexRef.current = currentStepIndex;
  }, [currentStepIndex]);

  // Resolves target views dynamically depending on stepId
  const getStepView = (stepId: string): 'dashboard' | 'mood' | 'symptoms' | 'history' | 'resources' | 'profile' | 'crisis' => {
    if (
      stepId === 'welcome' || 
      stepId === 'wellness_index' ||
      stepId === 'mood_tab' ||
      stepId === 'preventive_care' ||
      stepId === 'intelligence_center' ||
      stepId === 'peer_community' ||
      stepId === 'emergency_support'
    ) {
      return 'dashboard';
    }
    if (stepId === 'choose_mood' || stepId === 'save_mood') {
      return 'mood';
    }
    if (stepId === 'choose_symptom' || stepId === 'save_symptoms') {
      return 'symptoms';
    }
    if (stepId === 'reports') {
      return 'history';
    }
    if (stepId === 'profile_instructions') {
      return 'profile';
    }
    return 'dashboard';
  };

  // Safe and synchronized step switcher carrying view updates to completely block race condition flickers
  const changeStep = (newIndex: number) => {
    if (newIndex < 0 || newIndex >= TOUR_STEPS.length) return;
    
    const nextStep = TOUR_STEPS[newIndex];
    const targetView = getStepView(nextStep.id);
    
    setCurrentStepIndex(newIndex);
    
    // Smoothly click report tabs programmatically if transitioning into History report step
    if (nextStep.id === 'reports') {
      setTimeout(() => {
        const tabEl = document.getElementById('tour-wellness-reports');
        if (tabEl) tabEl.click();
      }, 350);
    }

    if (currentView !== targetView) {
      setCurrentView(targetView);
    }
  };

  // Completely immune to batching and async overlaps: Checks if the step being advanced from is still currently active
  const safeAdvance = (fromIndex: number) => {
    if (currentStepIndexRef.current === fromIndex) {
      changeStep(fromIndex + 1);
    }
  };

  const safeJump = (fromIndex: number, toIndex: number) => {
    if (currentStepIndexRef.current === fromIndex) {
      changeStep(toIndex);
    }
  };

  // Store tour completeness in localStorage
  const handleTourFinish = () => {
    localStorage.setItem('preventive_healthcare_tour_completed', 'true');
    onClose();
  };

  // Synchronize step with manual/button click view transitions ONLY if they are intended navigation triggers
  useEffect(() => {
    if (currentStep.id === 'mood_tab' && currentView === 'mood') {
      safeAdvance(currentStepIndex);
    } else if (currentStep.id === 'symptoms_tab' && currentView === 'symptoms') {
      safeAdvance(currentStepIndex);
    } else if (currentStep.id === 'save_mood' && currentView === 'dashboard') {
      const targetIndex = TOUR_STEPS.findIndex(s => s.id === 'symptoms_tab');
      if (targetIndex !== -1) {
        safeJump(currentStepIndex, targetIndex);
      }
    } else if (currentStep.id === 'save_symptoms' && currentView === 'dashboard') {
      const targetIndex = TOUR_STEPS.findIndex(s => s.id === 'preventive_care');
      if (targetIndex !== -1) {
        safeJump(currentStepIndex, targetIndex);
      }
    }
  }, [currentView, currentStepIndex]);

  // Robust element finder selecting visible candidates
  const findElement = (): HTMLElement | null => {
    if (!currentStep) return null;
    let element: HTMLElement | null = null;

    // Crisis fallback detection
    if (currentStep.targetId === 'nav-crisis') {
      const desktopCrisis = document.getElementById('nav-crisis');
      const isDesktopVisible = desktopCrisis && desktopCrisis.getBoundingClientRect().width > 0;
      if (isDesktopVisible) {
        element = desktopCrisis;
      } else {
        element = document.getElementById('dashboard-crisis-btn');
      }
    } else {
      // Robust Candidate Query loops through duplicates (Desktop Sidebar vs Mobile bottoms)
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
    }
    return element;
  };

  // Track physical position/vitals of the highlighted step target
  useEffect(() => {
    let active = true;
    let animationFrameId: number;
    const startTime = Date.now();
    const trackingDuration = 2500;
    
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
        // Safe timeout fallback
        if (Date.now() - startTime > 400) {
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

  // Unified deterministic state and CustomEvent observers
  useEffect(() => {
    if (!currentStep) return;

    const stepIndexAtSetup = currentStepIndex;

    const onMoodSelected = (e: Event) => {
      const ce = e as CustomEvent;
      if (currentStep.id === 'choose_mood' && ce.detail?.mood === 'Calm') {
        safeAdvance(stepIndexAtSetup);
      }
    };

    const onMoodSaved = () => {
      if (currentStep.id === 'save_mood') {
        const targetIdx = TOUR_STEPS.findIndex(s => s.id === 'symptoms_tab');
        if (targetIdx !== -1) {
          safeJump(stepIndexAtSetup, targetIdx);
        }
      }
    };

    const onSymptomSelected = (e: Event) => {
      const ce = e as CustomEvent;
      if (currentStep.id === 'choose_symptom' && ce.detail?.symptom === 'Fatigue') {
        safeAdvance(stepIndexAtSetup);
      }
    };

    const onSymptomSaved = () => {
      if (currentStep.id === 'save_symptoms') {
        const targetIdx = TOUR_STEPS.findIndex(s => s.id === 'preventive_care');
        if (targetIdx !== -1) {
          safeJump(stepIndexAtSetup, targetIdx);
        }
      }
    };

    window.addEventListener('tour_mood_selected', onMoodSelected);
    window.addEventListener('tour_mood_saved', onMoodSaved);
    window.addEventListener('tour_symptom_selected', onSymptomSelected);
    window.addEventListener('tour_symptom_saved', onSymptomSaved);

    // C. Traditional click intersection capturing fallback
    let handleGlobalClick: ((e: MouseEvent) => void) | null = null;
    if (currentStep.type === 'action') {
      handleGlobalClick = (e: MouseEvent) => {
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
            safeAdvance(stepIndexAtSetup);
          }, 180);
        }
      };
      window.addEventListener('click', handleGlobalClick, true);
    }

    return () => {
      window.removeEventListener('tour_mood_selected', onMoodSelected);
      window.removeEventListener('tour_mood_saved', onMoodSaved);
      window.removeEventListener('tour_symptom_selected', onSymptomSelected);
      window.removeEventListener('tour_symptom_saved', onSymptomSaved);
      if (handleGlobalClick) {
        window.removeEventListener('click', handleGlobalClick, true);
      }
    };
  }, [currentStepIndex, currentStep]);

  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      changeStep(currentStepIndex + 1);
    } else {
      handleTourFinish();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      changeStep(currentStepIndex - 1);
    }
  };

  // Build responsive, non-overlapping floating prompt card positions
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

    const cardWidth = 360;
    const estimatedCardHeight = 220;
    
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

  // Position cursor hand dynamically depending on screen space coordinates
  const getCursorProps = () => {
    if (!coords) return null;
    
    const targetMiddleX = coords.left + (coords.width / 2);
    const isNearBottom = (coords.top + (coords.height / 2)) > window.innerHeight * 0.55;
    
    if (isNearBottom) {
      return {
        top: `${coords.top - 58}px`,
        left: `${targetMiddleX - 36}px`,
        emoji: '👇',
        yOffset: [0, 8, 0] // Bounce downwards
      };
    } else {
      return {
        top: `${coords.top + coords.height + 8}px`,
        left: `${targetMiddleX - 36}px`,
        emoji: '👆',
        yOffset: [0, -8, 0] // Bounce upwards
      };
    }
  };

  const cursorProps = getCursorProps();
  const isTargetAtTop = coords && coords.top < 140;
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Color code styles based on Type
  const getBadgeColors = (type: 'action' | 'information' | 'navigation') => {
    switch (type) {
      case 'action':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30';
      case 'information':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200/50';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/50';
    }
  };

  const isOverlayBlocked = currentStep.type !== 'action' && !isPopupOpen;

  return (
    <div id="interactive-tour-overlay" className="fixed inset-0 z-[9999] pointer-events-none select-none">
      
      {/* 4-Panel Moderate Mask allows Spatial Awareness & keeps viewport visible */}
      {!isPopupOpen && (
        coords ? (
          <>
            {/* Top light sheet */}
            <div 
              className={`fixed bg-slate-900/10 dark:bg-black/20 z-[9990] transition-all duration-150 ${isOverlayBlocked ? 'pointer-events-auto' : 'pointer-events-none'}`}
              style={{
                top: 0,
                left: 0,
                width: '100vw',
                height: `${Math.max(0, coords.top - PADDING)}px`,
              }}
            />
            {/* Bottom light sheet */}
            <div 
              className={`fixed bg-slate-900/10 dark:bg-black/20 z-[9990] transition-all duration-150 ${isOverlayBlocked ? 'pointer-events-auto' : 'pointer-events-none'}`}
              style={{
                top: `${coords.top + coords.height + PADDING}px`,
                left: 0,
                width: '100vw',
                bottom: 0,
              }}
            />
            {/* Left light sheet */}
            <div 
              className={`fixed bg-slate-900/10 dark:bg-black/20 z-[9990] transition-all duration-150 ${isOverlayBlocked ? 'pointer-events-auto' : 'pointer-events-none'}`}
              style={{
                top: `${Math.max(0, coords.top - PADDING)}px`,
                left: 0,
                width: `${Math.max(0, coords.left - PADDING)}px`,
                height: `${coords.height + 2 * PADDING}px`,
              }}
            />
            {/* Right light sheet */}
            <div 
              className={`fixed bg-slate-900/10 dark:bg-black/20 z-[9990] transition-all duration-150 ${isOverlayBlocked ? 'pointer-events-auto' : 'pointer-events-none'}`}
              style={{
                top: `${Math.max(0, coords.top - PADDING)}px`,
                left: `${coords.left + coords.width + PADDING}px`,
                right: 0,
                height: `${coords.height + 2 * PADDING}px`,
              }}
            />
          </>
        ) : (
          <div className={`fixed inset-0 bg-slate-900/12 dark:bg-black/35 z-[9990] ${isOverlayBlocked ? 'pointer-events-auto' : 'pointer-events-none'}`} />
        )
      )}

      {/* Target focus glowing indicators */}
      <AnimatePresence>
        {!isPopupOpen && coords && (
          <motion.div
            key="focus-ring"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ 
              top: coords.top - PADDING - 3,
              left: coords.left - PADDING - 3,
              width: coords.width + 2 * PADDING + 6,
              height: coords.height + 2 * PADDING + 6,
              opacity: 1, 
              scale: 1 
            }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 220, damping: 26 }}
            className="absolute border-[3px] border-emerald-500 rounded-2xl pointer-events-none z-[9998] shadow-[0_0_15px_rgba(16,185,129,0.5)]"
            style={{
              position: 'absolute',
            }}
          >
            <span className="absolute inset-0 rounded-2xl border-2 border-emerald-400/80 animate-pulse opacity-90" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Adaptive hand pointer cursor with corresponding emoji orientation (👆 vs 👇) */}
      <AnimatePresence mode="wait">
        {!isPopupOpen && cursorProps && (
          <motion.div
            key={`cursor-step-${currentStepIndex}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            style={{ 
              position: 'absolute',
              top: cursorProps.top,
              left: cursorProps.left,
            }}
            className="z-[10000] pointer-events-none flex flex-col items-center"
          >
            <div className="relative flex flex-col items-center">
              <span className="absolute inline-flex h-10 w-10 rounded-full bg-emerald-500/20 animate-ping" />
              
              <motion.div 
                animate={{ y: cursorProps.yOffset }}
                transition={{ repeat: Infinity, duration: 1.3, ease: "easeInOut" }}
                className="bg-white dark:bg-[#1C2C33] border border-emerald-500 py-1.5 px-2.5 rounded-xl shadow-xl flex items-center gap-1.5 shrink-0"
              >
                <span className="text-xl leading-none">{cursorProps.emoji}</span>
                <span className="text-[8px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider whitespace-nowrap">
                  {currentStep.type === 'action' ? 'Click here!' : 'Notice here'}
                </span>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Guidance floating card OR Compact Action Mode Pill */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-text">
        <div className="relative w-full h-full">
          <AnimatePresence mode="wait">
            {isPopupOpen ? (
              <motion.div
                key="tour-paused-pill"
                initial={{ opacity: 0, y: 15, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15, scale: 0.96 }}
                transition={{ duration: 0.18 }}
                style={{
                  position: 'fixed',
                  zIndex: 10001,
                }}
                className={`fixed left-1/2 -translate-x-1/2 w-[calc(100%-32px)] sm:w-[480px] pointer-events-auto bottom-6 bg-[#FAF0E6]/95 dark:bg-[#2C2421]/95 border-2 border-amber-500/80 p-3 rounded-2xl shadow-2xl flex items-center justify-between gap-3 text-left backdrop-blur-md`}
              >
                {/* Left side text segment */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="bg-amber-500 text-white p-1.5 rounded-lg shrink-0 flex items-center justify-center animate-pulse">
                    <Sparkles size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[8px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider">
                        Walkthrough Paused
                      </span>
                    </div>
                    <h5 className="text-[11px] font-black text-slate-800 dark:text-white uppercase tracking-wider truncate mt-0.5">
                      Feedback Required
                    </h5>
                    <p className="text-[10px] text-slate-500 dark:text-[#a8b8c0] font-bold leading-tight truncate">
                      An active alert or medical guideline tip is shown. Close it to resume.
                    </p>
                  </div>
                </div>

                {/* Skip option */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={onClose}
                    className="p-1 px-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-[8px] font-black uppercase tracking-wider rounded-lg border border-slate-200/50 dark:border-slate-800 cursor-pointer transition-colors"
                  >
                    Skip
                  </button>
                </div>
              </motion.div>
            ) : isCollapsed ? (
              <motion.div
                key={`tour-pill-${currentStepIndex}`}
                initial={{ opacity: 0, y: isTargetAtTop ? 15 : -15, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: isTargetAtTop ? 15 : -15, scale: 0.96 }}
                transition={{ duration: 0.18 }}
                style={{
                  position: 'fixed',
                  zIndex: 10001,
                }}
                className={`fixed left-1/2 -translate-x-1/2 w-[calc(100%-32px)] sm:w-[480px] pointer-events-auto ${
                  isTargetAtTop 
                    ? (isMobile ? 'bottom-20' : 'bottom-6') 
                    : 'top-4'
                } bg-white/95 dark:bg-[#1E2E35]/95 border-2 border-emerald-500/80 p-3 rounded-2xl shadow-2xl flex items-center justify-between gap-3 text-left backdrop-blur-md`}
              >
                {/* Left side text segment */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="bg-emerald-555 text-white p-1 rounded-lg shrink-0 flex items-center justify-center">
                    <Compass size={14} className="animate-spin text-emerald-500" style={{ animationDuration: '6s' }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[8px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">
                        Step {currentStepIndex + 1} of {TOUR_STEPS.length}
                      </span>
                      <span className="text-[8px] font-black px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 uppercase tracking-widest leading-none shrink-0 animate-pulse">
                        {currentStep.type === 'action' ? 'Action Required' : 'Collapsed'}
                      </span>
                    </div>
                    <h5 className="text-[11px] font-black text-slate-800 dark:text-white uppercase tracking-wider truncate mt-0.5">
                      {currentStep.title.replace(/^\d+\.\s*/, '')}
                    </h5>
                    <p className="text-[10px] text-slate-500 dark:text-[#a8b8c0] font-bold leading-tight truncate">
                      {currentStep.description}
                    </p>
                  </div>
                </div>

                {/* Right side buttons segment (completely out of the way) */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => setIsCollapsed(false)}
                    className="p-1 px-2 text-slate-500 dark:text-[#a8b8c0] hover:text-emerald-600 dark:hover:text-emerald-400 font-black text-[8px] uppercase tracking-wider transition-all border border-slate-205/60 dark:border-slate-800 rounded-lg cursor-pointer bg-slate-50 dark:bg-[#152329]"
                    title="See detailed guidance"
                  >
                    Details
                  </button>
                  {currentStep.type === 'action' ? (
                    <button
                      onClick={handleNext}
                      className="p-1 px-2 bg-amber-500/10 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 font-bold text-[8px] uppercase tracking-wider border border-amber-500/30 rounded-lg cursor-pointer transition-colors"
                      title="Bypass interactive action"
                    >
                      Bypass
                    </button>
                  ) : (
                    <button
                      onClick={handleNext}
                      className="p-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[8px] uppercase tracking-wider rounded-lg shadow-sm cursor-pointer transition-colors"
                    >
                      Next
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                    title="Skip walkthrough"
                  >
                    <X size={12} />
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={`tour-card-${currentStepIndex}`}
                initial={{ opacity: 0, y: 15, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15, scale: 0.97 }}
                transition={{ duration: 0.18 }}
                style={cardPosition.style}
                className="pointer-events-auto bg-white/95 dark:bg-[#1E2E35] border border-slate-200 dark:border-[#2C414C] p-5 rounded-[24px] shadow-2xl flex flex-col gap-4 z-[10001] text-left backdrop-blur-md"
              >
                {/* Header with Minimize */}
                <div className="flex justify-between items-center bg-slate-50 dark:bg-[#152329] -mx-5 -mt-5 p-3.5 px-5 rounded-t-[24px] border-b border-slate-100 dark:border-[#2C414C]">
                  <div className="flex items-center gap-2">
                    <Compass size={14} className="text-emerald-500 animate-spin" style={{ animationDuration: '4s' }} />
                    <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${getBadgeColors(currentStep.type)}`}>
                      {currentStep.badge}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 pointer-events-auto">
                    <button
                      onClick={() => setIsCollapsed(true)}
                      className="p-1 px-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-[8px] font-black uppercase tracking-wider rounded-lg border border-slate-200/50 dark:border-slate-800 cursor-pointer transition-colors"
                      title="Minimize this guide to keep workspace clear"
                    >
                      Minimize
                    </button>
                    <button 
                      onClick={onClose}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors pointer-events-auto"
                      title="Skip Tour"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>

                {/* Title & supportive explanation */}
                <div className="space-y-1.5 px-1">
                  <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    {currentStep.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-[#a8b8c0] font-bold leading-relaxed">
                    {currentStep.description}
                  </p>
                  {currentStep.type === 'action' && (
                    <div className="inline-flex items-center gap-1.5 bg-amber-50/50 dark:bg-amber-955/10 border border-amber-100 dark:border-amber-900/30 p-1.5 rounded-lg text-amber-800 dark:text-amber-400 font-bold text-[8px] uppercase tracking-wider mt-1 w-full text-center justify-center">
                      <Sparkles size={10} className="animate-pulse text-amber-500 shrink-0" /> Interactive indicator: select highlighted item!
                    </div>
                  )}
                </div>

                {/* Interface progress & safe skip actions */}
                <div className="flex justify-between items-center pt-2.5 px-1 border-t border-slate-100 dark:border-[#2C414C]">
                  <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Step {currentStepIndex + 1} of {TOUR_STEPS.length}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={onClose}
                      className="px-2 py-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-[9px] font-black uppercase tracking-wider transition-colors cursor-pointer pointer-events-auto"
                    >
                      Skip
                    </button>
                    {currentStepIndex > 0 && (
                      <button 
                        onClick={handlePrev}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#152329] dark:hover:bg-[#1E2E35] text-slate-600 dark:text-slate-300 text-[9px] font-black uppercase tracking-wider rounded-lg transition-colors cursor-pointer pointer-events-auto border border-slate-200 dark:border-[#2C414C]/30"
                      >
                        Back
                      </button>
                    )}
                    {currentStep.type !== 'action' ? (
                      <button 
                        onClick={handleNext}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-black uppercase tracking-wider rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-1 cursor-pointer pointer-events-auto"
                      >
                        {currentStepIndex === TOUR_STEPS.length - 1 ? 'Finish Tour' : 'Next'} <ChevronRight size={10} />
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={handleNext}
                          className="px-2 py-1 text-slate-400 dark:text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 text-[8px] font-black uppercase tracking-wider rounded-md border border-slate-200 dark:border-slate-800 pointer-events-auto transition-all cursor-pointer bg-slate-50/50 dark:bg-[#152329]"
                          title="Bypass performing this active log step and advance"
                        >
                          Bypass
                        </button>
                        <div className="px-2 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[8px] font-black uppercase tracking-widest rounded-lg border border-amber-500/20 text-center animate-pulse">
                          Awaiting Action...
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

    </div>
  );
}
