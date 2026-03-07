import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getUserWorkouts, getUserRestDays } from '../services/workoutService';
import { useAuth } from './useAuth';

const WorkoutsContext = createContext(null);

export function WorkoutsProvider({ children }) {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState([]);
  const [restDays, setRestDays] = useState([]); // array of date strings 'yyyy-MM-dd'
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (showLoading = false) => {
    if (!user?.uid) return;
    if (showLoading) setLoading(true);
    try {
      const [data, rests] = await Promise.all([
        getUserWorkouts(user.uid),
        getUserRestDays(user.uid),
      ]);
      setWorkouts(data);
      setRestDays(rests);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => { refresh(true); }, [refresh]);

  const addWorkoutLocally = useCallback((workout) => {
    setWorkouts((prev) => [workout, ...prev].sort((a, b) => (a.date > b.date ? -1 : 1)));
  }, []);

  const removeWorkoutLocally = useCallback((workoutId) => {
    setWorkouts((prev) => prev.filter((w) => w.id !== workoutId));
  }, []);

  const addRestDayLocally = useCallback((date) => {
    setRestDays((prev) => prev.includes(date) ? prev : [...prev, date]);
  }, []);

  return (
    <WorkoutsContext.Provider value={{
      workouts, restDays, loading,
      refresh, addWorkoutLocally, removeWorkoutLocally, addRestDayLocally,
    }}>
      {children}
    </WorkoutsContext.Provider>
  );
}

export function useWorkoutsContext() {
  return useContext(WorkoutsContext);
}
