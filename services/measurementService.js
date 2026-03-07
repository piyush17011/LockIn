import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export const addMeasurement = (userId, data) =>
  addDoc(collection(db, 'measurements'), { userId, ...data, createdAt: serverTimestamp() });

export const getMeasurements = async (userId) => {
  // No orderBy — sort client-side to avoid composite index requirement
  const q = query(collection(db, 'measurements'), where('userId', '==', userId));
  const snap = await getDocs(q);
  const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  // Sort ascending by createdAt (Firestore Timestamp has toMillis())
  return docs.sort((a, b) => {
    const aMs = a.createdAt?.toMillis?.() ?? 0;
    const bMs = b.createdAt?.toMillis?.() ?? 0;
    return aMs - bMs;
  });
};
