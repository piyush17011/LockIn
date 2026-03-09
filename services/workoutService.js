import { collection, doc, addDoc, setDoc, updateDoc, getDocs, getDoc, query, where, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import { format } from 'date-fns';

export const logWorkout = async (userId, workoutData) => {
  const ref = await addDoc(collection(db, 'workouts'), {
    userId, ...workoutData,
    date: workoutData.date || format(new Date(), 'yyyy-MM-dd'),
    createdAt: serverTimestamp(),
  });
  const today = format(new Date(), 'yyyy-MM-dd');
  if ((workoutData.date || today) === today) {
    await updateStreak(userId);
  }
  return ref.id;
};

export const getUserWorkouts = async (userId) => {
  const q = query(collection(db, 'workouts'), where('userId', '==', userId));
  const snap = await getDocs(q);
  const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return docs.sort((a, b) => (a.date > b.date ? -1 : 1));
};

export const getWorkoutByDate = async (userId, date) => {
  const q = query(collection(db, 'workouts'), where('userId', '==', userId), where('date', '==', date));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const deleteWorkout = async (workoutId) => deleteDoc(doc(db, 'workouts', workoutId));

// Rest days stored as restDays/{userId}_{date}
export const markRestDay = async (userId, date) => {
  const today = format(new Date(), 'yyyy-MM-dd');
  // Can only mark rest for today
  if (date !== today) return;
  const ref = doc(db, 'restDays', userId + '_' + date);
  await setDoc(ref, { userId, date, createdAt: serverTimestamp() }, { merge: true });
  await updateStreak(userId);
};

export const getUserRestDays = async (userId) => {
  const q = query(collection(db, 'restDays'), where('userId', '==', userId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data().date);
};

export const updateStreak = async (userId) => {
  const userRef = doc(db, 'users', userId);
  const snap = await getDoc(userRef);
  const data = snap.data();
  const today = format(new Date(), 'yyyy-MM-dd');
  if (data.lastWorkoutDate === today) return;
  const yesterday = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');
  const lastDate = data.lastWorkoutDate || '';  // ← handles null
  const streak = lastDate === yesterday ? (data.streak || 0) + 1 : 1;
  const longestStreak = Math.max(streak, data.longestStreak || 0);
  await updateDoc(userRef, { streak, longestStreak, lastWorkoutDate: today });
};

export const saveCalorieProfile = async (userId, profile) => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, { calorieProfile: profile });
};

export const getCalorieProfile = async (userId) => {
  const userRef = doc(db, 'users', userId);
  const snap = await getDoc(userRef);
  return snap.data()?.calorieProfile || null;
};

// ── Update an existing workout ────────────────────────────────────────────────
export async function updateWorkout(workoutId, { type, exercises, notes }) {
  const { doc, updateDoc } = await import('firebase/firestore');
  const { db } = await import('./firebase');
  await updateDoc(doc(db, 'workouts', workoutId), { type, exercises, notes });
}
