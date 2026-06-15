import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  Mail, 
  Lock, 
  User as UserIcon, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle, 
  ChevronRight,
  ShieldCheck,
  CheckSquare,
  Square,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { getDoc, doc } from 'firebase/firestore';

interface AuthScreensProps {
  onCrisisClick: () => void;
  onSuccess: (isNewUser: boolean) => void;
}

export function AuthScreens({ onCrisisClick, onSuccess }: AuthScreensProps) {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const { login, loginWithEmail, registerWithEmail, resetPasswordByEmail, getSecurityQuestion, resetPasswordBySecurityQuestion, continueAsGuest, loginWithGoogleSimulated } = useAuth();
  
  // Login Form States
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginRemember, setLoginRemember] = useState(true);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Simulated Google Login Fallback State
  const [simulatedGoogleEmail, setSimulatedGoogleEmail] = useState('oluyemiayomide16@gmail.com');

  // Sign Up Form States
  const [signupName, setSignupName] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupAgree, setSignupAgree] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);

  // Sign Up Inline Error States
  const [usernameError, setUsernameError] = useState('');
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');

  const isOperationNotAllowed = (errText: string) => {
    return errText.toLowerCase().includes('operation-not-allowed') || errText.toLowerCase().includes('not enabled');
  };

  // Forgot Password States
  const [forgotMode, setForgotMode] = useState<'selection' | 'email' | 'security'>('selection');
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotError, setForgotError] = useState('');

  // Live Password Strength Indicator
  const [passwordStrength, setPasswordStrength] = useState<'Weak' | 'Fair' | 'Strong' | ''>('');

  useEffect(() => {
    if (!signupPassword) {
      setPasswordStrength('');
      return;
    }
    const hasMinLength = signupPassword.length >= 8;
    const hasNumber = /[0-9]/.test(signupPassword);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(signupPassword);

    if (hasMinLength && hasNumber && hasSpecial) {
      setPasswordStrength('Strong');
    } else if (hasMinLength && (hasNumber || hasSpecial)) {
      setPasswordStrength('Fair');
    } else {
      setPasswordStrength('Weak');
    }
  }, [signupPassword]);

  // Validate Username Uniqueness (Debounced or Async)
  const checkUsernameUniqueness = async (uname: string) => {
    const trimmed = uname.trim().toLowerCase();
    if (!trimmed) {
      setUsernameError('');
      return;
    }
    if (/\s/.test(trimmed)) {
      setUsernameError('Username must not contain any spaces.');
      return;
    }
    if (trimmed.length < 3) {
      setUsernameError('Username must be at least 3 characters.');
      return;
    }

    setUsernameChecking(true);
    try {
      const uDoc = await getDoc(doc(db, 'usernames', trimmed));
      if (uDoc.exists()) {
        setUsernameError('Username already taken');
      } else {
        setUsernameError('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUsernameChecking(false);
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s/g, '');
    setSignupUsername(value);
    setUsernameError('');
    if (value.length >= 3) {
      const timer = setTimeout(() => {
        checkUsernameUniqueness(value);
      }, 500);
      return () => clearTimeout(timer);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier || !loginPassword) {
      setLoginError('Incorrect email/username or password');
      return;
    }

    setLoginLoading(true);
    setLoginError('');
    try {
      await loginWithEmail(loginIdentifier, loginPassword, loginRemember);
      onSuccess(false); // standard login, not new user onboarding
    } catch (err: any) {
      setLoginError(err.message || 'Incorrect email/username or password');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');
    let hasErr = false;

    // Direct Pre-Validations
    if (!signupName.trim()) {
      setGeneralError('Please enter your full name.');
      return;
    }

    if (!signupUsername.trim()) {
      setUsernameError('Username is required.');
      hasErr = true;
    } else if (usernameError) {
      hasErr = true;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!signupEmail.trim() || !emailRegex.test(signupEmail)) {
      setEmailError('Please provide a valid email address.');
      hasErr = true;
    } else {
      setEmailError('');
    }

    if (passwordStrength !== 'Strong') {
      setPasswordError('Password must be at least 8 characters, with at least 1 number and 1 special character.');
      hasErr = true;
    } else {
      setPasswordError('');
    }

    if (signupPassword !== signupConfirmPassword) {
      setConfirmPasswordError('Passwords do not match.');
      hasErr = true;
    } else {
      setConfirmPasswordError('');
    }

    if (!signupAgree) {
      setGeneralError('You must agree to the Terms of Use and Privacy Policy to register.');
      hasErr = true;
    }

    if (hasErr) return;

    setSignupLoading(true);
    try {
      await registerWithEmail(signupName.trim(), signupUsername, signupEmail, signupPassword);
      onSuccess(true); // new user registration -> triggers onboarding!
    } catch (err: any) {
      setGeneralError(err.message || 'Registration failed. Please try again.');
    } finally {
      setSignupLoading(false);
    }
  };

  // Forgot Password Helpers
  const handleRetrieveQuestion = async () => {
    if (!forgotIdentifier.trim()) {
      setForgotError('Please enter your username first.');
      return;
    }
    setForgotLoading(true);
    setForgotError('');
    setForgotMessage('');
    try {
      const result = await getSecurityQuestion(forgotIdentifier);
      if (result) {
        setSecurityQuestion(result.question);
        setForgotMode('security');
      } else {
        setForgotError('No security question has been set for this username. Please use standard Email Reset.');
      }
    } catch (err: any) {
      setForgotError(err.message || 'Error looking up username.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleEmailReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotIdentifier.trim()) {
      setForgotError('Please enter your email or username.');
      return;
    }
    setForgotLoading(true);
    setForgotError('');
    setForgotMessage('');
    try {
      await resetPasswordByEmail(forgotIdentifier);
      setForgotMessage('If this account exists, a secure password reset email has been dispatched.');
    } catch (err: any) {
      setForgotError(err.message || 'Failed to trigger reset. Please check inputs.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleSecurityQuestionReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!securityAnswer.trim()) {
      setForgotError('Please enter your security question answer.');
      return;
    }
    setForgotLoading(true);
    setForgotError('');
    setForgotMessage('');
    try {
      await resetPasswordBySecurityQuestion(forgotIdentifier, securityAnswer);
      setForgotMessage('Correct! A password reset link has been dispatched to your registered email.');
    } catch (err: any) {
      setForgotError(err.message || 'Incorrect answer. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center p-4 md:p-6 bg-slate-50 relative overflow-y-auto font-sans">
      {/* Background Ambience */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/40 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-100/40 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 flex flex-col items-center py-4">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-5 animate-fadeIn">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mb-2 shadow-2xl shadow-blue-200 hover:rotate-6 transition-transform">
            <Heart className="w-7 h-7 text-white fill-white/20" />
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter uppercase">Vital Mind</h1>
        </div>

        {/* Dynamic Canvas Container */}
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-2xl p-6 md:p-8 w-full">
          <AnimatePresence mode="wait">
            
            {/* LOGIN MODE */}
            {mode === 'login' && (
              <motion.form 
                key="login"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleLoginSubmit}
                className="space-y-5"
              >
                <div>
                  <h2 className="text-xl font-black text-slate-900 uppercase">Welcome Back</h2>
                  <p className="text-xs text-slate-400 font-medium mt-1">Access your personal, secure dashboard.</p>
                </div>

                {loginError && (
                  isOperationNotAllowed(loginError) ? (
                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 space-y-3 px-4 font-medium text-xs">
                      <div className="flex justify-between items-center bg-amber-100/40 p-1.5 rounded-xl border border-amber-200/50">
                        <div className="flex items-center gap-2 font-black text-amber-800 uppercase tracking-wider text-[11px]">
                          <AlertCircle className="shrink-0 text-amber-600 animate-bounce" size={18} />
                          <span>{loginError.toLowerCase().includes('google') && !loginError.toLowerCase().includes('email/password') ? 'Google Provider Required' : 'Provider Setup Required'}</span>
                        </div>
                        <button 
                          type="button"
                          onClick={() => setLoginError('')}
                          className="p-1 hover:bg-amber-200/60 rounded-lg text-amber-700 hover:text-amber-900 transition-colors cursor-pointer"
                          title="Exit Prompt"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <p className="leading-relaxed text-slate-700">
                        This project is set up with Firebase, but the <strong>{loginError.toLowerCase().includes('google') && !loginError.toLowerCase().includes('email/password') ? 'Google' : 'Email/Password'}</strong> provider is disabled in your Firebase Console.
                      </p>
                      <div className="p-3 bg-white/75 rounded-xl border border-amber-100 space-y-1.5 text-slate-600 text-[11px] leading-relaxed">
                        <div className="font-bold text-slate-800 uppercase tracking-wide text-[9px] mb-0.5">How to enable this:</div>
                        <div>1. Open your <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-bold hover:text-blue-800">Firebase Console</a>.</div>
                        <div>2. Select your project and click on <strong>Authentication</strong>.</div>
                        <div>3. Click the <strong>Sign-in method</strong> tab.</div>
                        {loginError.toLowerCase().includes('google') && !loginError.toLowerCase().includes('email/password') ? (
                          <>
                            <div>4. Click <strong>Add new provider</strong> and select <strong>Google</strong>.</div>
                            <div>5. Enable it, fill support email, and save.</div>
                          </>
                        ) : (
                          <div>4. Click on <strong>Email/Password</strong>, select <strong>Enable</strong>, and click <strong>Save</strong>.</div>
                        )}
                      </div>
                      <div className="pt-2 flex flex-col gap-2">
                        <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest text-center">Or use backup option:</span>
                        {loginError.toLowerCase().includes('google') && !loginError.toLowerCase().includes('email/password') ? (
                          <div className="p-3 bg-white hover:bg-slate-50 border border-slate-100 rounded-xl space-y-3 shadow-sm transition-all text-left">
                            <span className="text-[9px] text-blue-600 font-black uppercase tracking-wide flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                              Simulate Google Sign-In
                            </span>
                            <p className="text-[10px] text-slate-500 leading-normal font-medium">
                              Since Google authentication is blocked by sandbox constraints, continue locally using your Google email address:
                            </p>
                            <div className="space-y-1">
                              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest pl-0.5">Google Email Address</label>
                              <input 
                                type="email"
                                value={simulatedGoogleEmail}
                                onChange={(e) => setSimulatedGoogleEmail(e.target.value)}
                                placeholder="oluyemiayomide16@gmail.com"
                                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:outline-none rounded-xl py-2 px-3 text-xs font-semibold text-slate-800 transition-colors"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={async () => {
                                setLoginLoading(true);
                                setLoginError('');
                                try {
                                  await loginWithGoogleSimulated(simulatedGoogleEmail);
                                  onSuccess(false);
                                } catch (err: any) {
                                  setLoginError('Could not launch simulated Google session');
                                } finally {
                                  setLoginLoading(false);
                                }
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white w-full py-2.5 rounded-xl text-[10px] uppercase font-black tracking-widest flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
                            >
                              <svg className="w-3.5 h-3.5 shrink-0 fill-current" viewBox="0 0 24 24">
                                <path d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.866-3.577-7.866-8s3.536-8 7.866-8c2.46 0 4.105 1.025 5.047 1.926l3.241-3.116C18.308 1.83 15.518 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.478 0 10.793-4.537 10.793-10.986 0-.74-.08-1.3-.177-1.859H12.24z" fill="currentColor"/>
                              </svg>
                              <span>Authorize as {simulatedGoogleEmail.split('@')[0]}</span>
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={async () => {
                              setLoginLoading(true);
                              setLoginError('');
                              try {
                                await login();
                                onSuccess(false);
                              } catch (err: any) {
                                setLoginError(err?.message || 'Google sign-in failed');
                              } finally {
                                setLoginLoading(false);
                              }
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white w-full py-2.5 rounded-2xl text-[10px] uppercase font-black tracking-widest flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
                          >
                            <svg className="w-4 h-4 shrink-0 fill-current" viewBox="0 0 24 24">
                              <path d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.866-3.577-7.866-8s3.536-8 7.866-8c2.46 0 4.105 1.025 5.047 1.926l3.241-3.116C18.308 1.83 15.518 1 12.24 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.478 0 10.793-4.537 10.793-10.986 0-.74-.08-1.3-.177-1.859H12.24z" fill="currentColor"/>
                            </svg>
                            <span>Sign In with Google</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={async () => {
                            setLoginLoading(true);
                            setLoginError('');
                            try {
                              await continueAsGuest();
                              onSuccess(false);
                            } catch (err: any) {
                              setLoginError('Could not launch guest session');
                            } finally {
                              setLoginLoading(false);
                            }
                          }}
                          className="bg-slate-800 hover:bg-slate-900 text-white w-full py-2.5 rounded-2xl text-[10px] uppercase font-black tracking-widest flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 animate-pulse"
                        >
                          <span>Continue as Guest (No Setup Required)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setLoginError('')}
                          className="w-full py-2 bg-amber-100 hover:bg-amber-200 text-amber-950 rounded-xl text-[10px] uppercase font-black tracking-widest flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <X size={12} /> Cancel & Close Warning
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-5 bg-red-50 text-red-900 rounded-2xl space-y-3 border border-red-200 text-xs font-semibold">
                      <div className="flex justify-between items-center bg-red-100/40 p-1.5 rounded-xl border border-red-200/50">
                        <div className="flex items-center gap-2 font-black text-red-800 uppercase tracking-wider text-[11px]">
                          <AlertCircle className="shrink-0 text-red-600 animate-bounce" size={18} />
                          <span>Login Failure</span>
                        </div>
                        <button 
                          type="button"
                          onClick={() => setLoginError('')}
                          className="p-1 hover:bg-red-200/60 rounded-lg text-red-700 hover:text-red-950 transition-colors cursor-pointer"
                          title="Clear Error"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      
                      <p className="leading-relaxed text-slate-700 font-medium">
                        {loginError}
                      </p>

                      <div className="pt-2 border-t border-red-100/70 flex flex-col gap-2 font-normal">
                        <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest text-center mt-1">Stuck? Bypass or simulation option:</span>
                        
                        <div className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl space-y-3 shadow-xs transition-all text-left">
                          <span className="text-[9px] text-blue-600 font-black uppercase tracking-wide flex items-center gap-1 font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                            Simulate Google Sign-In
                          </span>
                          <p className="text-[10px] text-slate-500 leading-normal">
                            If Firebase is blocked by sandbox policy or you have credentials problems, proceed locally with your Google email:
                          </p>
                          <div className="space-y-1">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest pl-0.5">Google Email Address</label>
                            <input 
                              type="email"
                              value={simulatedGoogleEmail}
                              onChange={(e) => setSimulatedGoogleEmail(e.target.value)}
                              placeholder="oluyemiayomide16@gmail.com"
                              className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:outline-none rounded-xl py-2 px-3 text-xs font-semibold text-slate-800 transition-colors"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              setLoginLoading(true);
                              setLoginError('');
                              try {
                                await loginWithGoogleSimulated(simulatedGoogleEmail);
                                onSuccess(false);
                              } catch (err: any) {
                                setLoginError('Could not launch simulated Google session');
                              } finally {
                                setLoginLoading(false);
                              }
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white w-full py-2.5 rounded-xl text-[10px] uppercase font-black tracking-widest flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer font-bold"
                          >
                            <svg className="w-3.5 h-3.5 shrink-0 fill-current" viewBox="0 0 24 24">
                              <path d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.866-3.577-7.866-8s3.536-8 7.866-8c2.46 0 4.105 1.025 5.047 1.926l3.241-3.116C18.308 1.83 15.518 1 12.24 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.478 0 10.793-4.537 10.793-10.986 0-.74-.08-1.3-.177-1.859H12.24z" fill="currentColor"/>
                            </svg>
                            <span>Authorize as {simulatedGoogleEmail.split('@')[0]}</span>
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={async () => {
                            setLoginLoading(true);
                            setLoginError('');
                            try {
                              await continueAsGuest();
                              onSuccess(false);
                            } catch (err: any) {
                              setLoginError('Could not launch guest session');
                            } finally {
                              setLoginLoading(false);
                            }
                          }}
                          className="bg-slate-800 hover:bg-slate-950 text-white w-full py-2.5 rounded-xl text-[10px] uppercase font-black tracking-widest flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer font-bold"
                        >
                          <span>Continue as Guest (No Setup Required)</span>
                        </button>
                      </div>
                    </div>
                  )
                )}

                 <div className="space-y-4">
                  {/* Identifier */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Email or Username</label>
                    <div className="relative">
                      <input 
                        type="text"
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        placeholder="e.g. jamilu or email"
                        className="input-field py-3 text-sm font-semibold w-full"
                        style={{ paddingLeft: '2.75rem' }}
                        required
                      />
                      <UserIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center pl-1 pr-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Password</label>
                      <button 
                        type="button"
                        onClick={() => {
                          setForgotMode('selection');
                          setForgotIdentifier(loginIdentifier);
                          setForgotMessage('');
                          setForgotError('');
                          setMode('forgot');
                        }}
                        className="text-[10px] font-black uppercase text-blue-600 hover:underline"
                        tabIndex={0}
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <input 
                        type={showLoginPassword ? 'text' : 'password'}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Enter password"
                        className="input-field py-3 text-sm font-semibold w-full"
                        style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem' }}
                        required
                      />
                      <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <button 
                        type="button" 
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center justify-between">
                  <button 
                    type="button"
                    onClick={() => setLoginRemember(!loginRemember)}
                    className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-700"
                  >
                    {loginRemember ? (
                      <CheckSquare className="text-blue-600 shrink-0" size={16} />
                    ) : (
                      <Square className="text-slate-300 shrink-0" size={16} />
                    )}
                    <span>Remember me on this browser</span>
                  </button>
                </div>

                 {/* Actions */}
                <div className="space-y-3 pt-2">
                  <button 
                    type="submit"
                    disabled={loginLoading}
                    className="btn-primary w-full py-3.5 text-[11px] font-black uppercase tracking-widest shadow-xl shadow-blue-100 flex items-center justify-center"
                  >
                    {loginLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Sign In'}
                  </button>

                  <div className="flex items-center my-3 relative">
                    <div className="flex-1 border-t border-slate-100"></div>
                    <span className="px-3 text-[9px] font-black uppercase text-slate-400 tracking-widest">or</span>
                    <div className="flex-1 border-t border-slate-100"></div>
                  </div>

                  <button 
                    type="button"
                    onClick={async () => {
                      setLoginLoading(true);
                      setLoginError('');
                      try {
                        await login();
                        onSuccess(false);
                      } catch (err: any) {
                        setLoginError(err?.message || 'Google sign-in failed');
                      } finally {
                        setLoginLoading(false);
                       }
                    }}
                    className="w-full py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 hover:scale-[1.01] active:scale-[0.99] transition-all shadow-sm"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.866-3.577-7.866-8s3.536-8 7.866-8c2.46 0 4.105 1.025 5.047 1.926l3.241-3.116C18.308 1.83 15.518 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.478 0 10.793-4.537 10.793-10.986 0-.74-.08-1.3-.177-1.859H12.24z"/>
                    </svg>
                    <span>Continue with Google</span>
                  </button>

                  <button 
                    type="button"
                    onClick={async () => {
                      setLoginLoading(true);
                      setLoginError('');
                      try {
                        await continueAsGuest();
                        onSuccess(false);
                      } catch (err: any) {
                        setLoginError('Could not launch guest session');
                      } finally {
                        setLoginLoading(false);
                      }
                    }}
                    className="w-full py-3 bg-slate-50 border border-slate-100 hover:bg-slate-100/80 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all"
                  >
                    <span>Continue as Guest</span>
                  </button>

                  <button 
                    type="button"
                    onClick={() => {
                      setGeneralError('');
                      setMode('signup');
                    }}
                    className="w-full text-center text-xs font-bold text-slate-500 hover:text-slate-700 mt-1 block"
                  >
                    Don't have an account? <span className="text-blue-600 hover:underline">Sign up</span>
                  </button>
                </div>
              </motion.form>
            )}

            {/* SIGN UP MODE */}
            {mode === 'signup' && (
              <motion.form 
                key="signup"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onSubmit={handleSignupSubmit}
                className="space-y-4"
              >
                <div>
                  <h2 className="text-xl font-black text-slate-900 uppercase">Create Account</h2>
                  <p className="text-xs text-slate-400 font-medium mt-1">Become part of the Vital Mind secure system.</p>
                </div>

                {generalError && (
                  isOperationNotAllowed(generalError) ? (
                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 space-y-3 px-4 font-medium text-xs">
                      <div className="flex justify-between items-center bg-amber-100/40 p-1.5 rounded-xl border border-amber-200/50">
                        <div className="flex items-center gap-2 font-black text-amber-800 uppercase tracking-wider text-[11px]">
                          <AlertCircle className="shrink-0 text-amber-600 animate-bounce" size={18} />
                          <span>{generalError.toLowerCase().includes('google') && !generalError.toLowerCase().includes('email/password') ? 'Google Provider Required' : 'Registration Setup Required'}</span>
                        </div>
                        <button 
                          type="button"
                          onClick={() => setGeneralError('')}
                          className="p-1 hover:bg-amber-200/60 rounded-lg text-amber-700 hover:text-amber-900 transition-colors cursor-pointer"
                          title="Exit Prompt"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <p className="leading-relaxed text-slate-700">
                        This project is set up with Firebase, but the <strong>{generalError.toLowerCase().includes('google') && !generalError.toLowerCase().includes('email/password') ? 'Google' : 'Email/Password'}</strong> provider is disabled in your Firebase Console.
                      </p>
                      <div className="p-3 bg-white/75 rounded-xl border border-amber-100 space-y-1.5 text-slate-600 text-[11px] leading-relaxed">
                        <div className="font-bold text-slate-800 uppercase tracking-wide text-[9px] mb-0.5">How to enable this:</div>
                        <div>1. Open your <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-bold hover:text-blue-800">Firebase Console</a>.</div>
                        <div>2. Select your project and click on <strong>Authentication</strong>.</div>
                        <div>3. Click the <strong>Sign-in method</strong> tab.</div>
                        {generalError.toLowerCase().includes('google') && !generalError.toLowerCase().includes('email/password') ? (
                          <>
                            <div>4. Click <strong>Add new provider</strong> and select <strong>Google</strong>.</div>
                            <div>5. Enable it, fill support email, and save.</div>
                          </>
                        ) : (
                          <div>4. Click on <strong>Email/Password</strong>, select <strong>Enable</strong>, and click <strong>Save</strong>.</div>
                        )}
                      </div>
                      <div className="pt-2 flex flex-col gap-2">
                        <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest text-center">Or use backup registration:</span>
                        {generalError.toLowerCase().includes('google') && !generalError.toLowerCase().includes('email/password') ? (
                          <div className="p-3 bg-white hover:bg-slate-50 border border-slate-100 rounded-xl space-y-3 shadow-sm transition-all text-left">
                            <span className="text-[9px] text-blue-600 font-black uppercase tracking-wide flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                              Simulate Google Sign-Up
                            </span>
                            <p className="text-[10px] text-slate-500 leading-normal font-medium">
                              Since Google authentication is blocked by sandbox constraints, register locally using your Google email address:
                            </p>
                            <div className="space-y-1">
                              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest pl-0.5">Google Email Address</label>
                              <input 
                                type="email"
                                value={simulatedGoogleEmail}
                                onChange={(e) => setSimulatedGoogleEmail(e.target.value)}
                                placeholder="oluyemiayomide16@gmail.com"
                                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:outline-none rounded-xl py-2 px-3 text-xs font-semibold text-slate-800 transition-colors"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={async () => {
                                setSignupLoading(true);
                                setGeneralError('');
                                try {
                                  await loginWithGoogleSimulated(simulatedGoogleEmail);
                                  onSuccess(true); // onboarding for new simulated sign-ups
                                } catch (err: any) {
                                  setGeneralError('Could not launch simulated Google session');
                                } finally {
                                  setSignupLoading(false);
                                }
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white w-full py-2.5 rounded-xl text-[10px] uppercase font-black tracking-widest flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
                            >
                              <svg className="w-3.5 h-3.5 shrink-0 fill-current" viewBox="0 0 24 24">
                                <path d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.866-3.577-7.866-8s3.536-8 7.866-8c2.46 0 4.105 1.025 5.047 1.926l3.241-3.116C18.308 1.83 15.518 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.478 0 10.793-4.537 10.793-10.986 0-.74-.08-1.3-.177-1.859H12.24z" fill="currentColor"/>
                              </svg>
                              <span>Authorize as {simulatedGoogleEmail.split('@')[0]}</span>
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={async () => {
                              setSignupLoading(true);
                              setGeneralError('');
                              try {
                                await login();
                                onSuccess(true); // new user onboarding on first Google sign-up
                              } catch (err: any) {
                                setGeneralError(err?.message || 'Google registration failed');
                              } finally {
                                setSignupLoading(false);
                              }
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white w-full py-2.5 rounded-2xl text-[10px] uppercase font-black tracking-widest flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
                          >
                            <svg className="w-4 h-4 shrink-0 fill-current" viewBox="0 0 24 24">
                              <path d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.866-3.577-7.866-8s3.536-8 7.866-8c2.46 0 4.105 1.025 5.047 1.926l3.241-3.116C18.308 1.83 15.518 1 12.24 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.478 0 10.793-4.537 10.793-10.986 0-.74-.08-1.3-.177-1.859H12.24z" fill="currentColor"/>
                            </svg>
                            <span>Sign Up with Google</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={async () => {
                            setSignupLoading(true);
                            setGeneralError('');
                            try {
                              await continueAsGuest();
                              onSuccess(false);
                            } catch (err: any) {
                              setGeneralError('Could not launch guest session');
                            } finally {
                              setSignupLoading(false);
                            }
                          }}
                          className="bg-slate-800 hover:bg-slate-900 text-white w-full py-2.5 rounded-2xl text-[10px] uppercase font-black tracking-widest flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 animate-pulse"
                        >
                          <span>Continue as Guest (No Setup Required)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setGeneralError('')}
                          className="w-full py-2 bg-amber-100 hover:bg-amber-200 text-amber-950 rounded-xl text-[10px] uppercase font-black tracking-widest flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <X size={12} /> Cancel & Close Warning
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-5 bg-red-50 text-red-900 rounded-2xl space-y-3 border border-red-200 text-xs font-semibold">
                      <div className="flex justify-between items-center bg-red-100/40 p-1.5 rounded-xl border border-red-200/50">
                        <div className="flex items-center gap-2 font-black text-red-800 uppercase tracking-wider text-[11px]">
                          <AlertCircle className="shrink-0 text-red-600 animate-bounce" size={18} />
                          <span>Registration Failure</span>
                        </div>
                        <button 
                          type="button"
                          onClick={() => setGeneralError('')}
                          className="p-1 hover:bg-red-200/60 rounded-lg text-red-700 hover:text-red-950 transition-colors cursor-pointer"
                          title="Clear Error"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      
                      <p className="leading-relaxed text-slate-700 font-medium">
                        {generalError}
                      </p>

                      <div className="pt-2 border-t border-red-100/70 flex flex-col gap-2 font-normal">
                        <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest text-center mt-1">Stuck? Bypass or simulation option:</span>
                        
                        <div className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl space-y-3 shadow-xs transition-all text-left">
                          <span className="text-[9px] text-blue-600 font-black uppercase tracking-wide flex items-center gap-1 font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                            Simulate Google Sign-Up
                          </span>
                          <p className="text-[10px] text-slate-500 leading-normal">
                            If Firebase is blocked by sandbox policy or registration fails, proceed locally with your Google email:
                          </p>
                          <div className="space-y-1">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest pl-0.5">Google Email Address</label>
                            <input 
                              type="email"
                              value={simulatedGoogleEmail}
                              onChange={(e) => setSimulatedGoogleEmail(e.target.value)}
                              placeholder="oluyemiayomide16@gmail.com"
                              className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:outline-none rounded-xl py-2 px-3 text-xs font-semibold text-slate-800 transition-colors"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              setSignupLoading(true);
                              setGeneralError('');
                              try {
                                await loginWithGoogleSimulated(simulatedGoogleEmail);
                                onSuccess(true); // onboarding path
                              } catch (err: any) {
                                setGeneralError('Could not launch simulated Google session');
                              } finally {
                                setSignupLoading(false);
                              }
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white w-full py-2.5 rounded-xl text-[10px] uppercase font-black tracking-widest flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer font-bold"
                          >
                            <svg className="w-3.5 h-3.5 shrink-0 fill-current" viewBox="0 0 24 24">
                              <path d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.866-3.577-7.866-8s3.536-8 7.866-8c2.46 0 4.105 1.025 5.047 1.926l3.241-3.116C18.308 1.83 15.518 1 12.24 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.478 0 10.793-4.537 10.793-10.986 0-.74-.08-1.3-.177-1.859H12.24z" fill="currentColor"/>
                            </svg>
                            <span>Authorize as {simulatedGoogleEmail.split('@')[0]}</span>
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={async () => {
                            setSignupLoading(true);
                            setGeneralError('');
                            try {
                              await continueAsGuest();
                              onSuccess(false);
                            } catch (err: any) {
                              setGeneralError('Could not launch guest session');
                            } finally {
                              setSignupLoading(false);
                            }
                          }}
                          className="bg-slate-800 hover:bg-slate-950 text-white w-full py-2.5 rounded-xl text-[10px] uppercase font-black tracking-widest flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer font-bold"
                        >
                          <span>Continue as Guest (No Setup Required)</span>
                        </button>
                      </div>
                    </div>
                  )
                )}

                <div className="space-y-3.5 max-h-[45vh] overflow-y-auto pr-1">
                  {/* Full Name */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-0.5">Full Name</label>
                    <input 
                      type="text"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      placeholder="e.g. Jamilu Abubakar"
                      className="input-field py-2.5 px-4 text-xs font-semibold w-full"
                      required
                    />
                  </div>

                  {/* Username */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center pl-0.5 pr-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Username</label>
                      {usernameChecking && <span className="text-[9px] text-slate-400 animate-pulse uppercase font-bold">Checking...</span>}
                    </div>
                    <input 
                      type="text"
                      value={signupUsername}
                      onChange={handleUsernameChange}
                      onBlur={() => checkUsernameUniqueness(signupUsername)}
                      placeholder="e.g. jamilu (no spaces)"
                      className={`input-field py-2.5 px-4 text-xs font-semibold w-full ${usernameError ? 'border-red-300 focus:border-red-500' : ''}`}
                      required
                    />
                    {usernameError && (
                      <p className="text-[10px] text-red-500 font-bold mt-1 flex items-center gap-1">
                        <AlertCircle size={10} /> {usernameError}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-0.5">Email Address</label>
                    <input 
                      type="email"
                      value={signupEmail}
                      onChange={(e) => {
                        setSignupEmail(e.target.value);
                        setEmailError('');
                      }}
                      placeholder="e.g. user@domain.com"
                      className="input-field py-2.5 px-4 text-xs font-semibold w-full"
                      required
                    />
                    {emailError && (
                      <p className="text-[10px] text-red-500 font-bold mt-1 flex items-center gap-1">
                        <AlertCircle size={10} /> {emailError}
                      </p>
                    )}
                  </div>

                  {/* Password */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-0.5">Password</label>
                    <div className="relative">
                      <input 
                        type={showSignupPassword ? 'text' : 'password'}
                        value={signupPassword}
                        onChange={(e) => {
                          setSignupPassword(e.target.value);
                          setPasswordError('');
                        }}
                        placeholder="At least 8 chars"
                        className="input-field py-2.5 pl-4 pr-10 text-xs font-semibold w-full"
                        required
                      />
                      <button 
                        type="button"
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                      >
                        {showSignupPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>

                    {/* Password Strength Meter */}
                    {signupPassword && (
                      <div className="mt-1.5 space-y-1">
                        <div className="flex justify-between items-center px-0.5">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Strength:</span>
                          <span className={`text-[9px] font-black uppercase ${
                            passwordStrength === 'Strong' ? 'text-emerald-500' :
                            passwordStrength === 'Fair' ? 'text-amber-500' : 'text-red-500'
                          }`}>{passwordStrength}</span>
                        </div>
                        <div className="flex h-1.5 gap-1 rounded-full overflow-hidden bg-slate-100">
                          <div className={`h-full rounded-full transition-all ${
                            passwordStrength === 'Strong' ? 'w-full bg-emerald-500' :
                            passwordStrength === 'Fair' ? 'w-2/3 bg-amber-500' : 'w-1/3 bg-red-500'
                          }`} />
                        </div>
                        <p className="text-[9px] text-slate-400 leading-normal">
                          Rule: Minimum 8 characters, at least 1 number, and 1 special symbol.
                        </p>
                      </div>
                    )}
                    {passwordError && (
                      <p className="text-[10px] text-red-500 font-bold mt-1 leading-normal flex items-start gap-1">
                        <AlertCircle className="mt-0.5 shrink-0" size={10} /> {passwordError}
                      </p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-0.5">Confirm Password</label>
                    <div className="relative">
                      <input 
                        type={showSignupConfirmPassword ? 'text' : 'password'}
                        value={signupConfirmPassword}
                        onChange={(e) => {
                          setSignupConfirmPassword(e.target.value);
                          setConfirmPasswordError('');
                        }}
                        placeholder="Re-enter password"
                        className="input-field py-2.5 pl-4 pr-10 text-xs font-semibold w-full"
                        required
                      />
                      <button 
                        type="button"
                        onClick={() => setShowSignupConfirmPassword(!showSignupConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                      >
                        {showSignupConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    {confirmPasswordError && (
                      <p className="text-[10px] text-red-500 font-bold mt-1 flex items-center gap-1">
                        <AlertCircle size={10} /> {confirmPasswordError}
                      </p>
                    )}
                  </div>

                  {/* Legal Checkbox */}
                  <button 
                    type="button"
                    onClick={() => setSignupAgree(!signupAgree)}
                    className="flex items-start gap-2 pt-1 text-[11px] font-semibold text-slate-500 text-left hover:text-slate-700 leading-normal"
                  >
                    {signupAgree ? (
                      <CheckSquare className="text-blue-600 mt-0.5 shrink-0" size={16} />
                    ) : (
                      <Square className="text-slate-300 mt-0.5 shrink-0" size={16} />
                    )}
                    <span>I agree to the <span className="text-blue-600 hover:underline">Terms of Use</span> and <span className="text-blue-600 hover:underline">Privacy Policy</span>.</span>
                  </button>
                </div>

                 {/* Submit & Switch */}
                <div className="space-y-3 pt-3">
                  <button 
                    type="submit"
                    disabled={signupLoading || !!usernameError || usernameChecking}
                    className="btn-primary w-full py-3 text-[11px] font-black uppercase tracking-widest shadow-xl shadow-blue-100 flex items-center justify-center"
                  >
                    {signupLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Create Account'}
                  </button>

                  <div className="flex items-center my-3 relative">
                    <div className="flex-1 border-t border-slate-100"></div>
                    <span className="px-3 text-[9px] font-black uppercase text-slate-400 tracking-widest">or</span>
                    <div className="flex-1 border-t border-slate-100"></div>
                  </div>

                  <button 
                    type="button"
                    onClick={async () => {
                      setSignupLoading(true);
                      setGeneralError('');
                      try {
                        await login();
                        onSuccess(true); // new user registration on first Google popup!
                      } catch (err: any) {
                        setGeneralError(err?.message || 'Google signup failed');
                      } finally {
                        setSignupLoading(false);
                      }
                    }}
                    className="w-full py-2.5 bg-white border border-slate-200 text-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 hover:scale-[1.01] active:scale-[0.99] transition-all shadow-sm"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.866-3.577-7.866-8s3.536-8 7.866-8c2.46 0 4.105 1.025 5.047 1.926l3.241-3.116C18.308 1.83 15.518 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.478 0 10.793-4.537 10.793-10.986 0-.74-.08-1.3-.177-1.859H12.24z"/>
                    </svg>
                    <span>Continue with Google</span>
                  </button>

                  <button 
                    type="button"
                    onClick={async () => {
                      setSignupLoading(true);
                      setGeneralError('');
                      try {
                        await continueAsGuest();
                        onSuccess(false);
                      } catch (err: any) {
                        setGeneralError('Could not launch guest session');
                      } finally {
                        setSignupLoading(false);
                      }
                    }}
                    className="w-full py-3 bg-slate-50 border border-slate-100 hover:bg-slate-100/80 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all"
                  >
                    <span>Continue as Guest</span>
                  </button>

                  <button 
                    type="button"
                    onClick={() => setMode('login')}
                    className="w-full text-center text-xs font-bold text-slate-500 mt-1 block hover:text-slate-700"
                  >
                    Already have an account? <span className="text-blue-600 hover:underline">Log in</span>
                  </button>
                </div>
              </motion.form>
            )}

            {/* FORGOT PASSWORD MODE */}
            {mode === 'forgot' && (
              <motion.div 
                key="forgot"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-5"
              >
                <div>
                  <h2 className="text-xl font-black text-slate-900 uppercase">Recover Password</h2>
                  <p className="text-xs text-slate-400 font-medium mt-1">Select your preferred recovery protocol.</p>
                </div>

                {forgotMessage && (
                  <div className="p-4 bg-emerald-50 text-emerald-700 rounded-2xl flex items-start gap-2.5 text-xs font-semibold border border-emerald-100 leading-normal animate-bounce">
                    <CheckCircle2 className="shrink-0 mt-0.5" size={16} />
                    <span>{forgotMessage}</span>
                  </div>
                )}

                {forgotError && (
                  <div className="p-4 bg-red-50 text-red-600 rounded-2xl flex items-start gap-2.5 text-xs font-semibold border border-red-100 leading-normal">
                    <AlertCircle className="shrink-0 mt-0.5" size={16} />
                    <span>{forgotError}</span>
                  </div>
                )}

                {forgotMode === 'selection' && !forgotMessage && (
                  <div className="space-y-4 pt-2">
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      How would you like to verify authorization and recover your credentials?
                    </p>

                    <div className="grid grid-cols-1 gap-3">
                      <button 
                        type="button"
                        onClick={() => {
                          setForgotMode('email');
                          setForgotError('');
                        }}
                        className="p-5 bg-slate-50 border border-slate-100 hover:bg-blue-50/50 hover:border-blue-100 rounded-2xl flex items-center gap-4 text-left transition-all group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          <Mail size={18} />
                        </div>
                        <div>
                          <h4 className="text-xs font-black uppercase text-slate-900 tracking-tight">Standard Email Link</h4>
                          <p className="text-[10px] font-medium text-slate-400 leading-normal mt-0.5">Recieve a secure self-reset page link in your inbox.</p>
                        </div>
                      </button>

                      <button 
                        type="button"
                        onClick={() => {
                          setForgotMode('security');
                          setForgotError('');
                        }}
                        className="p-5 bg-slate-50 border border-slate-100 hover:bg-emerald-50/50 hover:border-emerald-100 rounded-2xl flex items-center gap-4 text-left transition-all group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                          <ShieldCheck size={18} />
                        </div>
                        <div>
                          <h4 className="text-xs font-black uppercase text-slate-900 tracking-tight">Security Question</h4>
                          <p className="text-[10px] font-medium text-slate-400 leading-normal mt-0.5">Answer your security question securely on this browser.</p>
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* Email Link Entry */}
                {forgotMode === 'email' && !forgotMessage && (
                  <form onSubmit={handleEmailReset} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Email or Username</label>
                      <input 
                        type="text"
                        value={forgotIdentifier}
                        onChange={(e) => setForgotIdentifier(e.target.value)}
                        placeholder="Enter email or username"
                        className="input-field py-3 px-4 text-sm font-semibold w-full"
                        required
                      />
                    </div>

                    <button 
                      type="submit"
                      disabled={forgotLoading}
                      className="btn-primary w-full py-3.5 text-[11px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center"
                    >
                      {forgotLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Send Reset Link'}
                    </button>
                  </form>
                )}

                {/* Security Question Verification Entry */}
                {forgotMode === 'security' && !forgotMessage && (
                  <div className="space-y-4 animate-fadeIn">
                    {!securityQuestion ? (
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Confirm Username</label>
                          <input 
                            type="text"
                            value={forgotIdentifier}
                            onChange={(e) => setForgotIdentifier(e.target.value)}
                            placeholder="Type username (no spaces)"
                            className="input-field py-3 px-4 text-sm font-semibold w-full"
                            required
                          />
                        </div>
                        <button 
                          type="button"
                          onClick={handleRetrieveQuestion}
                          disabled={forgotLoading}
                          className="btn-primary w-full py-3 text-[11.5px] font-black uppercase tracking-widest shadow-md flex items-center justify-center"
                        >
                          {forgotLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Lookup Security Question'}
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleSecurityQuestionReset} className="space-y-4">
                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-semibold text-slate-700 leading-relaxed">
                          <HelpCircle className="inline text-blue-600 mr-1.5" size={16} />
                          <span className="font-bold">Question:</span> "{securityQuestion}"
                        </div>

                        <div className="space-y-11.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Your Answer</label>
                          <input 
                            type="text"
                            value={securityAnswer}
                            onChange={(e) => setSecurityAnswer(e.target.value)}
                            placeholder="Enter case-insensitive answer"
                            className="input-field py-3 px-4 text-sm font-semibold w-full"
                            required
                          />
                        </div>

                        <button 
                          type="submit"
                          disabled={forgotLoading}
                          className="btn-primary w-full py-3.5 text-[11px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center"
                        >
                          {forgotLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Verify Answer'}
                        </button>
                      </form>
                    )}
                  </div>
                )}

                {/* Bottom navigation */}
                <div className="flex justify-between items-center border-t border-slate-50 pt-4">
                  {forgotMode !== 'selection' && !forgotMessage ? (
                    <button 
                      type="button" 
                      onClick={() => {
                        setForgotMode('selection');
                        setForgotError('');
                      }} 
                      className="text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
                    >
                      ← Back Options
                    </button>
                  ) : (
                    <div />
                  )}
                  <button 
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setForgotMode('selection');
                      setForgotIdentifier('');
                      setSecurityQuestion('');
                      setSecurityAnswer('');
                      setForgotMessage('');
                    }}
                    className="text-xs font-bold text-blue-600 hover:underline pl-1"
                  >
                    Return to Sign In
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Support Buttons */}
        <div className="mt-8 flex flex-col w-full gap-3">
          <button 
            onClick={onCrisisClick}
            className="w-full py-4 bg-white/70 backdrop-blur-md border border-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 hover:text-red-600 transition-all flex items-center justify-center gap-2"
          >
            <AlertCircle size={14} className="text-red-500" /> I Need Help Right Now
          </button>
        </div>

        <p className="mt-8 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">
          Vital Mind • Preventive Security Care
        </p>
      </div>
    </div>
  );
}
