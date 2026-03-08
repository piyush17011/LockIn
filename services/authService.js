import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Configure Google Sign-In once — call this early (App.js or here at module level)
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  offlineAccess: false,
});

// Register + auto send verification email
export const registerUser = async (email, password, displayName) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName });
  await setDoc(doc(db, 'users', cred.user.uid), {
    uid: cred.user.uid, email, displayName,
    createdAt: serverTimestamp(), streak: 0, longestStreak: 0, lastWorkoutDate: null,
  });
  await sendEmailVerification(cred.user);
  return cred.user;
};

// Login — blocks unverified emails
export const loginUser = async (email, password) => {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  if (!cred.user.emailVerified) {
    await signOut(auth);
    throw new Error('EMAIL_NOT_VERIFIED');
  }
  return cred.user;
};

// Resend verification email
export const resendVerificationEmail = async (email, password) => {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  await sendEmailVerification(cred.user);
  await signOut(auth);
};

// Forgot password
export const forgotPassword = async (email) => {
  await sendPasswordResetEmail(auth, email);
};

// Google Sign-In using @react-native-google-signin/google-signin
export const loginWithGoogle = async () => {
  // Check Play Services available
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  // Trigger native Google sign-in sheet
  const { data } = await GoogleSignin.signIn();
  // Get tokens
  const { accessToken, idToken } = await GoogleSignin.getTokens();
  // Create Firebase credential
  const credential = GoogleAuthProvider.credential(idToken, accessToken);
  const cred = await signInWithCredential(auth, credential);
  // Create/merge user doc
  await setDoc(doc(db, 'users', cred.user.uid), {
    uid: cred.user.uid,
    email: cred.user.email,
    displayName: cred.user.displayName,
    createdAt: serverTimestamp(),
    streak: 0, longestStreak: 0, lastWorkoutDate: null,
  }, { merge: true });
  return cred.user;
};

export const logoutUser = async () => {
  try {
    // Sign out from Google too so next login shows account picker
    await GoogleSignin.signOut();
  } catch (_) {}
  return signOut(auth);
};
