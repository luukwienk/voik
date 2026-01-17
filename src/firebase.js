import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { debugLog } from './utils/debug';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Log environment variables to verify (only in development)
debugLog('Firebase Config:', firebaseConfig);

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const provider = new GoogleAuthProvider();

provider.setCustomParameters({
  prompt: 'select_account'
});

const signInWithGoogle = () => {
  return signInWithPopup(auth, provider);
};

const signOutUser = () => {
  return signOut(auth);
};

export {
  auth,
  db,
  storage,
  signInWithGoogle,
  signOutUser,
  onAuthStateChanged,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  setDoc,
  onSnapshot,
  // storage helpers
  storageRef,
  uploadBytesResumable,
  getDownloadURL
};
