import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, onAuthStateChanged, User, signOut, googleProvider, signInWithPopup, db } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail, 
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence 
} from 'firebase/auth';
import { getDoc, setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { safeLocalStorage, safeSessionStorage } from '../lib/safeStorage';

const localStorage = safeLocalStorage;
const sessionStorage = safeSessionStorage;

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>; // keeping standard google popup sign-in
  logout: () => Promise<void>;
  continueAsGuest: () => Promise<void>;
  loginWithGoogleSimulated: (email: string) => Promise<void>;
  loginWithEmail: (emailOrUsername: string, password: string, rememberMe: boolean) => Promise<void>;
  registerWithEmail: (fullName: string, username: string, email: string, password: string) => Promise<void>;
  resetPasswordByEmail: (emailOrUsername: string) => Promise<void>;
  getSecurityQuestion: (emailOrUsername: string) => Promise<{ question: string; email: string } | null>;
  resetPasswordBySecurityQuestion: (emailOrUsername: string, answer: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper for offline-safe security answer hashing
export async function hashAnswer(answer: string): Promise<string> {
  const normalized = answer.toLowerCase().trim();
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    // Simple pure JS hash fallback to prevent crashes in non-HTTPS / sandboxed iframe environments
    let hash = 5381;
    for (let i = 0; i < normalized.length; i++) {
      hash = (hash * 33) ^ normalized.charCodeAt(i);
    }
    return (hash >>> 0).toString(16).padStart(8, '0');
  }
  const msgBuffer = new TextEncoder().encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      if (authUser) {
        setUser(authUser);
        setLoading(false);
      } else {
        const sessionGuest = sessionStorage.getItem('vitalmind_guest_active');
        if (sessionGuest) {
          setUser({
            uid: 'guest-user',
            displayName: 'Guest User',
            email: 'guest@vitalmind.app',
            isAnonymous: true,
          } as any);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  // Standard Google POPUP login
  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Login failed:", error);
      if (error.code === 'auth/unauthorized-domain') {
        throw new Error("This domain is not authorized for Firebase Authentication. Please add it in your Firebase Console under Authentication > Settings > Authorized Domains.");
      } else if (error.code === 'auth/popup-blocked') {
        throw new Error("The login popup was blocked by your browser. Please allow popups for this site and try again.");
      } else if (error.code === 'auth/cancelled-popup-request') {
        // Silently handle cancelled popup
        return;
      } else if (error.code === 'auth/operation-not-allowed') {
        throw new Error("Google Sign-In is not enabled in your Firebase Console. Please enable the 'Google' sign-in provider under Authentication > Sign-in method in your Firebase Console.");
      } else {
        throw new Error(error.message || "Google sign-in failed.");
      }
    }
  };

  const loginWithEmail = async (emailOrUsername: string, password: string, rememberMe: boolean) => {
    let email = emailOrUsername.trim();
    const identLower = emailOrUsername.toLowerCase().trim();
    
    // Check local accounts first (even if email or username)
    const localAccounts = JSON.parse(localStorage.getItem('vitalmind_local_accounts') || '{}');
    let localAcc = localAccounts[identLower];
    if (!localAcc) {
      // Search if there is an account where email matches
      const matchedKey = Object.keys(localAccounts).find(k => localAccounts[k].email === identLower);
      if (matchedKey) {
        localAcc = localAccounts[matchedKey];
      }
    }

    if (localAcc) {
      const pHash = await hashAnswer(password);
      if (pHash === localAcc.passwordHash) {
        sessionStorage.setItem('vitalmind_guest_active', 'true');
        const mockProfile = {
          uid: 'guest-user',
          name: localAcc.name,
          email: localAcc.email,
          username: localAcc.username || emailOrUsername,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem('vitalmind_profile_guest', JSON.stringify(mockProfile));
        setUser({
          uid: 'guest-user',
          displayName: localAcc.name,
          email: localAcc.email,
          isAnonymous: true
        } as any);
        return;
      } else {
        throw new Error("Incorrect email/username or password");
      }
    }
    
    // Check if username mapping is needed
    if (!email.includes('@')) {
      const usernameLower = emailOrUsername.toLowerCase().trim();
      const lookupDoc = await getDoc(doc(db, 'usernames', usernameLower));
      if (!lookupDoc.exists()) {
        throw new Error("Incorrect email/username or password");
      }
      email = lookupDoc.data().email;
    }

    // Set persistence according to Remember Me
    const persistenceType = rememberMe ? browserLocalPersistence : browserSessionPersistence;
    await setPersistence(auth, persistenceType);

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error("Firebase Sign In Error:", error);
      if (error.code === 'auth/operation-not-allowed') {
        throw new Error("Email/Password login is not enabled in your Firebase Console. Please sign in with Google instead, or enable 'Email/Password' under Authentication > Sign-in method in your Firebase Console.");
      }
      throw new Error("Incorrect email/username or password");
    }
  };

  const registerWithEmail = async (fullName: string, username: string, email: string, password: string) => {
    const usernameLower = username.toLowerCase().trim().replace(/\s/g, '');
    if (usernameLower !== username.toLowerCase()) {
      throw new Error("Username must not contain any spaces.");
    }

    // 1. Verify username uniqueness locally first
    const localAccounts = JSON.parse(localStorage.getItem('vitalmind_local_accounts') || '{}');
    if (localAccounts[usernameLower]) {
      throw new Error("Username already taken");
    }

    // Verify online uniqueness if database is connected
    try {
      const lookupDoc = await getDoc(doc(db, 'usernames', usernameLower));
      if (lookupDoc.exists()) {
        throw new Error("Username already taken");
      }
    } catch (dbErr) {
      console.warn("Database uniqueness check skipped/unavailable:", dbErr);
    }

    // 2. Create standard Firebase Authentication Credential
    let userCred;
    try {
      userCred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const authUser = userCred.user;

      // 3. Update Auth Profile
      await updateProfile(authUser, { displayName: fullName });

      // 4. Save to firestore usernames map
      await setDoc(doc(db, 'usernames', usernameLower), {
        uid: authUser.uid,
        email: email.toLowerCase().trim()
      });

      // 5. Initialize user profile
      await setDoc(doc(db, 'users', authUser.uid), {
        uid: authUser.uid,
        name: fullName,
        email: email.toLowerCase().trim(),
        username: usernameLower,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error: any) {
      console.error("Firebase registration error:", error);
      if (error.code === 'auth/operation-not-allowed') {
        console.warn("Falling back to client-side local account simulation");
        
        const passwordHash = await hashAnswer(password);
        localAccounts[usernameLower] = {
          uid: 'local-user-' + usernameLower,
          name: fullName,
          email: email.toLowerCase().trim(),
          username: usernameLower,
          passwordHash: passwordHash
        };
        localStorage.setItem('vitalmind_local_accounts', JSON.stringify(localAccounts));

        // Sign in immediately using sessionStorage guest state
        sessionStorage.setItem('vitalmind_guest_active', 'true');
        
        // Pre-create the local profile in guest structure so App.tsx reads it correctly
        const mockProfile = {
          uid: 'guest-user',
          name: fullName,
          email: email.toLowerCase().trim(),
          username: usernameLower,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem('vitalmind_profile_guest', JSON.stringify(mockProfile));
        
        setUser({
          uid: 'guest-user',
          displayName: fullName,
          email: email.toLowerCase().trim(),
          isAnonymous: true
        } as any);
        return;
      }
      throw error;
    }
  };

  const resetPasswordByEmail = async (emailOrUsername: string) => {
    let email = emailOrUsername.trim();
    if (!email.includes('@')) {
      const usernameLower = emailOrUsername.toLowerCase().trim();
      const lookupDoc = await getDoc(doc(db, 'usernames', usernameLower));
      if (!lookupDoc.exists()) {
        throw new Error("Incorrect email/username or password");
      }
      email = lookupDoc.data().email;
    }
    await sendPasswordResetEmail(auth, email);
  };

  const getSecurityQuestion = async (emailOrUsername: string): Promise<{ question: string; email: string } | null> => {
    const val = emailOrUsername.trim();
    if (!val) return null;

    let username = "";
    if (!val.includes('@')) {
      username = val.toLowerCase();
    } else {
      // If email, we can prompt entering username
      return null;
    }

    const lookupDoc = await getDoc(doc(db, 'usernames', username));
    if (lookupDoc.exists() && lookupDoc.data().securityQuestion) {
      return {
        question: lookupDoc.data().securityQuestion,
        email: lookupDoc.data().email
      };
    }
    return null;
  };

  const resetPasswordBySecurityQuestion = async (emailOrUsername: string, answer: string): Promise<void> => {
    const val = emailOrUsername.trim();
    if (val.includes('@')) {
      throw new Error("Password reset via security question requires entering your username.");
    }

    const username = val.toLowerCase();
    const lookupDoc = await getDoc(doc(db, 'usernames', username));
    if (!lookupDoc.exists()) {
      throw new Error("Username not found");
    }

    const data = lookupDoc.data();
    if (!data.securityQuestion || !data.hashedAnswer) {
      throw new Error("No security question configured for this account. Please use email reset.");
    }

    const ansHash = await hashAnswer(answer);
    if (ansHash !== data.hashedAnswer) {
      throw new Error("Incorrect answer to security question.");
    }

    await sendPasswordResetEmail(auth, data.email);
  };

  const continueAsGuest = async () => {
    sessionStorage.setItem('vitalmind_guest_active', 'true');
    setUser({
      uid: 'guest-user',
      displayName: 'Guest User',
      email: 'guest@vitalmind.app',
      isAnonymous: true,
    } as any);
  };

  const loginWithGoogleSimulated = async (email: string) => {
    const emailLower = email.toLowerCase().trim();
    const name = emailLower.split('@')[0];
    const usernameLower = name.replace(/[^a-z0-9]/g, '');
    
    sessionStorage.setItem('vitalmind_guest_active', 'true');
    const mockProfile = {
      uid: 'guest-user',
      name: name.charAt(0).toUpperCase() + name.slice(1),
      email: emailLower,
      username: usernameLower,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem('vitalmind_profile_guest', JSON.stringify(mockProfile));
    
    setUser({
      uid: 'guest-user',
      displayName: mockProfile.name,
      email: emailLower,
      isAnonymous: true
    } as any);
  };

  const logout = async () => {
    try {
      sessionStorage.removeItem('vitalmind_guest_active');
      localStorage.removeItem('vitalmind_profile_guest');
      localStorage.removeItem('vitalmind_mood_logs_guest');
      localStorage.removeItem('vitalmind_symptom_logs_guest');
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Logout failed:", error);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{
      user, 
      loading, 
      login, 
      logout,
      continueAsGuest,
      loginWithGoogleSimulated,
      loginWithEmail,
      registerWithEmail,
      resetPasswordByEmail,
      getSecurityQuestion,
      resetPasswordBySecurityQuestion
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
