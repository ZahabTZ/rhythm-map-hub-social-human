// Firebase configuration and authentication setup - uses firebase_barebones_javascript integration
import { initializeApp } from "firebase/app";
import { getAuth, signInWithRedirect, GoogleAuthProvider, getRedirectResult, onAuthStateChanged, signOut } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Sign in with Google
export function signInWithGoogle() {
  signInWithRedirect(auth, googleProvider);
}

// Sign out
export function signOutUser() {
  return signOut(auth);
}

// Handle redirect result after Google sign-in
export function handleRedirect() {
  return getRedirectResult(auth);
}

// Auth state listener
export function onAuthStateChange(callback: (user: any) => void) {
  return onAuthStateChanged(auth, callback);
}