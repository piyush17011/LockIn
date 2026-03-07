import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyCzjlEckMxa8cluOib8TG-uDS1XoDupCZ0",
  authDomain: "lockin-d4034.firebaseapp.com",
  projectId: "lockin-d4034",
  storageBucket: "lockin-d4034.firebasestorage.app",
  messagingSenderId: "104081889382",
  appId: "1:104081889382:web:643b49c2ec4558a3d6f5a7",
  measurementId: "G-QVP0ZVF12T"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let auth;
try {
  auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
} catch {
  auth = getAuth(app);
}

const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
