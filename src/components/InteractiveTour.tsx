import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ChevronRight, 
  Compass, 
  CheckCircle,
  HelpCircle,
  Sparkles
} from 'lucide-react';

interface TourStep {
  id: string;
  targetId: string;
  title: string;
  description: string;
  arrowPosition: 'top' | 'bottom' | 'left' | 'right';
  badge: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'intro',
    targetId: 'header-wellness-state',
    title: '1. Dashboard Overview',
    description: 'This welcome dashboard is your main station. It tracks your overall computed wellness state, daily streak achievements, and provides quick navigation.',
    arrowPosition: 'top',
    badge: 'Welcome'
  },
  {
    id: 'mood',
    targetId: 'nav-mood',
    title: '2. Mood Tracking',
    description: 'First, log your baseline mental state here. Track metrics like anxiety, sleep quality, and energy levels to analyze emotional and mental trends.',
    arrowPosition: 'bottom',
    badge: 'Baseline'
  },
  {
    id: 'symptoms',
    targetId: 'nav-symptoms',
    title: '3. Symptom Logging',
    description: 'Symptom Logging lets you track targeted physical and neurological indicators. The engine translates these into clinical risk alerts automatically.',
    arrowPosition: 'bottom',
    badge: 'Physical State'
  },
  {
    id: 'intelligence',
    targetId: 'tour-intelligence-center',
    title: '4. Intelligence Center',
    description: 'Intelligence Center provides personalized wellness insights, recommendations, and health information based on your activities.',
    arrowPosition: 'top',
    badge: 'Insights'
  },
  {
    id: 'preventive',
    targetId: 'tour-preventive-care',
    title: '5. Preventive Care',
    description: 'Preventive Care helps users build healthy habits and access health information for early prevention and improved well-being.',
    arrowPosition: 'top',
    badge: 'Prevention'
  },
  {
    id: 'community',
    targetId: 'tour-peer-community',
    title: '6. Community & Peer Check-in',
    description: 'Community / Peer Checking allows users to connect, share experiences, and receive support from peers in a safe environment.',
    arrowPosition: 'top',
    badge: 'Peer Support'
  },
  {
    id: 'history',
    targetId: 'nav-history',
    title: '7. Health History',
    description: 'Wellness History catalogs your historic mood scores and logged bodily indicators, ensuring no check-in is lost over time.',
    arrowPosition: 'bottom',
    badge: 'Check-in Logs'
  },
  {
    id: 'reports',
    targetId: 'tour-wellness-reports',
    title: '8. Wellness Reports',
    description: 'Under Wellness Reports, the application generates weekly and monthly highlights. You can even export complete Clinical PDF Status Reports here to share with a professional doctor!',
    arrowPosition: 'top',
    badge: 'PDF Exports'
  },
  {
    id: 'resources',
    targetId: 'nav-resources',
    title: '9. Help & Resources',
    description: 'Preventive Help lets you browse clinically vetted help guides, offline resources, and mindfulness toolkits designed to support Nigerian young adults.',
    arrowPosition: 'bottom',
    badge: 'Vetted Guides'
  },
  {
    id: 'crisis',
    targetId: 'nav-crisis',
    title: '10. Emergency Support',
    description: 'In deep crisis? The Emergency Support overlay gives you instant hotlines, direct distress messaging, and critical clinical intervention tools.',
    arrowPosition: 'bottom',
    badge: 'Emergency Help'
  },
  {
    id: 'profile',
    targetId: 'tour-profile-btn',
    title: '11. Profile & Setup',
    description: 'Manage your display name, partner email, language selections, and overall account preferences in your Profile section.',
    arrowPosition: 'top',
    badge: 'My Setup'
  },
  {
    id: 'accessibility_settings',
    targetId: 'tour-accessibility-replay',
    title: '12. Easy Mode & Multilingual Settings',
    description: 'Easily switch the entire experience across English, Yoruba, Igbo, or Hausa. Enable Easy Read mode to read insights out loud, adjust themes and replay this tour anytime!',
    arrowPosition: 'top',
    badge: 'Language & Accessible'
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
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const lastScrollIndexRef = useRef<number>(-1);

  const currentStep = TOUR_STEPS[currentStepIndex];

  // Automatically switch view based on current step
  useEffect(() => {
    if (!currentStep) return;
    
    // Map step to the corresponding view
    let targetView: 'dashboard' | 'mood' | 'symptoms' | 'history' | 'resources' | 'profile' | 'crisis' | null = null;
    if (
      currentStep.id === 'intro' || 
      currentStep.id === 'community' || 
      currentStep.id === 'intelligence' || 
      currentStep.id === 'preventive'
    ) {
      targetView = 'dashboard';
    } else if (currentStep.id === 'mood') {
      targetView = 'mood';
    } else if (currentStep.id === 'symptoms') {
      targetView = 'symptoms';
    } else if (currentStep.id === 'history' || currentStep.id === 'reports') {
      targetView = 'history';
    } else if (currentStep.id === 'resources') {
      targetView = 'resources';
    } else if (currentStep.id === 'crisis') {
      targetView = 'crisis';
    } else if (currentStep.id === 'profile' || currentStep.id === 'accessibility_settings') {
      targetView = 'profile';
    }
    
    if (targetView && currentView !== targetView) {
      setCurrentView(targetView);
    }
  }, [currentStepIndex, currentStep, currentView, setCurrentView]);

  // Recalculate target positions using requestAnimationFrame for continuous, ultra-smooth tracking during transitions/scrolls
  useEffect(() => {
    let active = true;
    let animationFrameId: number;
    const startTime = Date.now();
    const trackingDuration = 2000; // Track continuously for 2.0 seconds after step/view change to cover all animations & smooth scrolling
    
    const findElement = (): HTMLElement | null => {
      if (!currentStep) return null;
      let element: HTMLElement | null = null;
      if (currentStep.targetId.startsWith('nav-')) {
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
        // Auto-scroll once per step to guarantee visibility for off-screen/below fold features
        if (lastScrollIndexRef.current !== currentStepIndex) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          lastScrollIndexRef.current = currentStepIndex;
        }

        const rect = element.getBoundingClientRect();
        
        setCoords(prevCoords => {
          // Only update state if coords have actually changed to avoid unnecessary re-renders
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
        // If element is not found yet, we set coordinates to null so we don't display a stale spotlight elsewhere
        // But only do so if we are fresh in this step (to avoid flickering)
        if (Date.now() - startTime > 300) {
          // If after 300ms (exit transitions) the element is still missing, clear the highlight
          setCoords(null);
        }
      }

      // Continue tracking frame-by-frame during the active transition window
      if (Date.now() - startTime < trackingDuration) {
        animationFrameId = requestAnimationFrame(track);
      } else {
        // After transition settles, do a low-frequency keep-alive check just in case layout shifts
        setTimeout(() => {
          if (active) {
            track();
          }
        }, 100);
      }
    };

    track();

    // Event listener updates coordinates continuously on scroll or resize
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

    // Watch for DOM changes to ensure position updates if tabs render deferred
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

  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  // Determine modal card absolute positioning relative to target coordinates
  const getCardStyle = () => {
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

    const isMobile = window.innerWidth < 768;
    const cardWidth = isMobile ? 290 : 350;
    const estimatedCardHeight = 225; // Safe approximation of the card height
    
    let top = coords.top + coords.height + 16;
    let left = coords.left + (coords.width / 2) - (cardWidth / 2);

    // Adjustments to lock within viewport boundaries
    if (left < 16) left = 16;
    if (left + cardWidth > window.innerWidth - 16) {
      left = window.innerWidth - cardWidth - 16;
    }

    // Smart placement decision: place above or below the target based on viewport space
    const spaceBelow = window.innerHeight - (coords.top + coords.height);
    const spaceAbove = coords.top;

    if (currentStep.arrowPosition === 'bottom' || (spaceBelow < estimatedCardHeight + 20 && spaceAbove > spaceBelow)) {
      // Placed above the target
      top = coords.top - estimatedCardHeight - 16;
      if (top < 16) {
        // Fallback to below if above doesn't fit either
        top = coords.top + coords.height + 16;
      }
    } else {
      // Placed below the target
      top = coords.top + coords.height + 16;
      if (top + estimatedCardHeight > window.innerHeight - 16) {
        // Fallback to above if below overflows
        top = coords.top - estimatedCardHeight - 16;
      }
    }

    // Final clamps to ensure the guide card never overflows off-screen
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

  return (
    <div id="interactive-tour-overlay" className="fixed inset-0 z-[9999] pointer-events-none select-none">
      
      {/* Background Mask spotlight highlights - stays active continuously to prevent flickering or unmounting flashes */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 bg-black/50 dark:bg-black/75 pointer-events-auto backdrop-blur-[1px]"
        style={{
          clipPath: coords ? `polygon(
            0% 0%, 
            0% 100%, 
            ${coords.left}px 100%, 
            ${coords.left}px ${coords.top}px, 
            ${coords.left + coords.width}px ${coords.top}px, 
            ${coords.left + coords.width}px ${coords.top + coords.height}px, 
            ${coords.left}px ${coords.top + coords.height}px, 
            ${coords.left}px 100%, 
            100% 100%, 
            100% 0%
          )` : 'polygon(0% 0%, 0% 100%, 0% 100%, 0% 0%, 0% 0%, 0% 0%, 0% 0%, 0% 100%, 100% 100%, 100% 0%)'
        }}
      />

      {/* Target Focus Ring Overlay with Subtle Pulse Focus Effect */}
      <AnimatePresence mode="wait">
        {coords && (
          <motion.div
            key={`focus-ring-${currentStepIndex}`}
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute border-2 border-emerald-500 rounded-2xl pointer-events-none z-[9998] shadow-[0_0_15px_rgba(16,185,129,0.5)]"
            style={{
              position: 'absolute',
              top: `${coords.top - 4}px`,
              left: `${coords.left - 4}px`,
              width: `${coords.width + 8}px`,
              height: `${coords.height + 8}px`,
            }}
          >
            <span className="absolute inset-0 rounded-2xl border border-emerald-400 animate-pulse opacity-75" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Guiding Cursor Hand Indicator */}
      <AnimatePresence mode="wait">
        {coords && (
          <motion.div
            key={`cursor-step-${currentStepIndex}`}
            initial={{ 
              opacity: 0, 
              x: coords.left + (coords.width / 2) + 20, 
              y: coords.top + (coords.height / 2) + 20 
            }}
            animate={{ 
              opacity: 1, 
              x: coords.left + (coords.width / 2) - 8,
              y: coords.top + (coords.height / 2) - 8
            }}
            transition={{ type: 'spring', stiffness: 100, damping: 15 }}
            className="absolute z-[10000] pointer-events-none"
          >
            {/* The clicking cursor visual */}
            <div className="relative">
              <span className="absolute inline-flex h-8 w-8 rounded-full bg-emerald-500/40 animate-ping" />
              <div className="absolute inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white shadow-lg" />
              
              {/* Hand Finger Pointer Graphic */}
              <motion.div 
                animate={{ y: [0, -6, 0] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                className="absolute top-3 left-3 bg-white dark:bg-[#18262C] border border-slate-200 dark:border-slate-800 p-1.5 rounded-xl shadow-xl flex items-center gap-1.5 shrink-0"
              >
                <span className="text-lg">👆</span>
                <span className="text-[8px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider whitespace-nowrap">Point Here</span>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Walkthrough Guide Floating Card */}
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
              className="pointer-events-auto bg-white dark:bg-[#203038] border border-slate-200 dark:border-[#2C414C] p-5 rounded-[24px] shadow-2xl flex flex-col gap-4 z-[10001] text-left"
            >
              {/* Header */}
              <div className="flex justify-between items-center bg-slate-50 dark:bg-[#18262C] -mx-5 -mt-5 p-3 px-4 rounded-t-[24px] border-b border-slate-100 dark:border-[#2C414C]">
                <div className="flex items-center gap-2">
                  <Compass size={14} className="text-emerald-500 animate-spin" />
                  <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{currentStep.badge}</span>
                </div>
                <button 
                  onClick={onClose}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
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
              </div>

              {/* Progress Steps Indicator */}
              <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-[#2C414C]">
                <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Step {currentStepIndex + 1} of {TOUR_STEPS.length}
                </span>
                
                <div className="flex gap-2">
                  <button 
                    onClick={onClose}
                    className="px-2.5 py-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-[10px] font-black uppercase rounded-lg transition-colors cursor-pointer"
                  >
                    Skip
                  </button>
                  {currentStepIndex > 0 && (
                    <button 
                      onClick={handlePrev}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#18262C] dark:hover:bg-[#2a3c46] text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase rounded-lg transition-colors cursor-pointer"
                    >
                      Back
                    </button>
                  )}
                  <button 
                    onClick={handleNext}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-1 cursor-pointer"
                  >
                    {currentStepIndex === TOUR_STEPS.length - 1 ? 'Finish' : 'Next'} <ChevronRight size={10} />
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

    </div>
  );
}
