import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

// Register — no email verification
export const registerUser = async (email, password, displayName) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName });
  await setDoc(doc(db, 'users', cred.user.uid), {
    uid: cred.user.uid, email, displayName,
    createdAt: serverTimestamp(), streak: 0, longestStreak: 0, lastWorkoutDate: null,
  });
  return cred.user;
};

// Login — straight in, no verification check
export const loginUser = async (email, password) => {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
};

// Forgot password — sends reset link
export const forgotPassword = async (email) => {
  await sendPasswordResetEmail(auth, email);
};

export const logoutUser = () => signOut(auth);
