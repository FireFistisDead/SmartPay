import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDP8l0NzNT2HA3OD-1YbTFZbLduaJv5Stg",
  authDomain: "blockchain-9ff21.firebaseapp.com",
  projectId: "blockchain-9ff21",
  storageBucket: "blockchain-9ff21.firebasestorage.app",
  messagingSenderId: "1043682925172",
  appId: "1:1043682925172:web:de5608fe1bf5bfe3884f21",
  measurementId: "G-56TJD7EZP8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Google Sign In
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);

// Sign Out
export const signOutUser = () => signOut(auth);

export default app;
