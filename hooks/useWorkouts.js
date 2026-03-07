import { useState, useEffect } from 'react';
import { getUserWorkouts } from '../services/workoutService';

export const useWorkouts = (userId) => {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!userId) return;
    setLoading(true);
    try { const data = await getUserWorkouts(userId); setWorkouts(data); }
    finally { setLoading(false); }
  };

  useEffect(() => { refresh(); }, [userId]);
  return { workouts, loading, refresh };
};