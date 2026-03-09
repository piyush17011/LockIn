import {
  collection, doc, addDoc, deleteDoc,
  getDocs, serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

const presetsRef = (userId) =>
  collection(db, 'presets', userId, 'userPresets');

export async function getUserPresets(userId) {
  const snap = await getDocs(presetsRef(userId));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function savePreset(userId, { name, exercises }) {
  const ref = await addDoc(presetsRef(userId), {
    name, exercises, createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function deletePreset(userId, presetId) {
  await deleteDoc(doc(db, 'presets', userId, 'userPresets', presetId));
}