import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDP8l0NzNT2HA3OD-1YbTFZbLduaJv5Stg",
  authDomain: "blockchain-9ff21.firebaseapp.com",
  projectId: "blockchain-9ff21",
  storageBucket: "blockchain-9ff21.firebasestorage.app",
  messagingSenderId: "278166498848",
  appId: "1:278166498848:web:3fe48bd8bb6f5b4e1a5e1b",
  measurementId: "G-QE63NQ1P9F"
};

// Initialize Firebase - prevent duplicate initialization
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

export default app;
