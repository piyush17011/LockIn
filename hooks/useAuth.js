import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) { setUserData(null); setLoading(false); return; }
      const ref = doc(db, 'users', firebaseUser.uid);
      const unsubDoc = onSnapshot(ref, (snap) => {
        setUserData(snap.data());
        setLoading(false);
      });
      return unsubDoc;
    });
    return unsub;
  }, []);

  return { user, userData, loading };
};