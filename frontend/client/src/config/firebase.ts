// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
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

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Analytics (optional)
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;
