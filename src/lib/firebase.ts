import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration for latrics-org-management project
const firebaseConfig = {
  apiKey: "AIzaSyB-YM8CMZa-zXX-gRUzX27CqphFGHPbBPk",
  authDomain: "latrics-org-management.firebaseapp.com",
  projectId: "latrics-org-management",
  storageBucket: "latrics-org-management.appspot.com",
  messagingSenderId: "467534930192",
  appId: "1:467534930192:android:df49a2a5ecedc40b0c8595"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
