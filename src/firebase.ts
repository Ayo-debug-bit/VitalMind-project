import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, enableMultiTabIndexedDbPersistence } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Enable offline persistence
enableMultiTabIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn("Firestore persistence failed: Multiple tabs open");
  } else if (err.code === 'unimplemented') {
    console.warn("Firestore persistence failed: Browser not supported");
  }
});

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Connection test
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

export { signInWithPopup, signOut, onAuthStateChanged };
export type { User };
