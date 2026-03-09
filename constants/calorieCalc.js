// constants/calorieCalc.js
// MET (Metabolic Equivalent of Task) values per exercise type
// Calories = MET × weight(kg) × duration(hours)
// For weight training: we estimate duration from sets × reps

const DEFAULT_WEIGHT_KG = 70; // fallback if user hasn't set weight

// MET values for workout types
const WORKOUT_TYPE_MET = {
  'Push':        5.0,
  'Pull':        5.0,
  'Legs':        6.0,
  'Upper Body':  5.0,
  'Lower Body':  6.0,
  'Full Body':   6.5,
  'Cardio':      8.0,
  'HIIT':        10.0,
  'Mobility':    2.5,
  'Custom':      5.0,
};

// Per-exercise MET overrides
const EXERCISE_MET = {
  // Cardio
  'Treadmill Run':    9.0,
  'Jump Rope':        12.0,
  'Cycling':          8.0,
  'Stair Climber':    9.0,
  'Rowing Machine':   7.0,
  'Elliptical':       6.5,
  // HIIT
  'Burpees':          10.0,
  'Box Jumps':        8.5,
  'Mountain Climbers':9.0,
  'Jump Squats':      8.0,
  'Kettlebell Swings':8.0,
  'Battle Ropes':     9.0,
  // Heavy compound
  'Deadlifts':        6.0,
  'Squats':           6.0,
  'Bench Press':      5.0,
  'Pull-Ups':         5.5,
  // Default weight training
  'default':          4.5,
};

/**
 * Calculate calories burned for weight training exercises
 * Based on sets × reps × estimated time per rep
 */
export function calcWeightTrainingCalories(exercises, userWeightKg = DEFAULT_WEIGHT_KG, workoutType = 'Custom') {
  if (!exercises || exercises.length === 0) return 0;

  let totalSeconds = 0;
  let weightedMETSeconds = 0;

  exercises.forEach((ex) => {
    const sets = ex.sets || [];
    const met = EXERCISE_MET[ex.name] || EXERCISE_MET['default'];

    sets.forEach((set) => {
      const reps = parseInt(set.reps) || 0;
      if (reps === 0) return;
      // ~3 seconds per rep + 2 second transition
      const setSeconds = reps * 3 + 2;
      totalSeconds += setSeconds;
      weightedMETSeconds += met * setSeconds;
    });
  });

  if (totalSeconds === 0) return 0;
  const avgMET = weightedMETSeconds / totalSeconds;
  const hours = totalSeconds / 3600;
  return Math.round(avgMET * userWeightKg * hours);
}

/**
 * Calculate calories burned from actual elapsed time (for cardio / session timer)
 */
export function calcSessionCalories(durationSeconds, workoutType = 'Custom', userWeightKg = DEFAULT_WEIGHT_KG) {
  const met = WORKOUT_TYPE_MET[workoutType] || 5.0;
  const hours = durationSeconds / 3600;
  return Math.round(met * userWeightKg * hours);
}

/**
 * Combined: use session duration for cardio/HIIT, exercise data for weight training
 */
export function calcTotalCalories({ exercises, durationSeconds, workoutType, userWeightKg = DEFAULT_WEIGHT_KG }) {
  const cardioTypes = ['Cardio', 'HIIT', 'Mobility'];
  if (cardioTypes.includes(workoutType)) {
    return calcSessionCalories(durationSeconds, workoutType, userWeightKg);
  }
  // Weight training: combine both (active lifting + rest periods)
  const exerciseCals = calcWeightTrainingCalories(exercises, userWeightKg, workoutType);
  const sessionCals  = calcSessionCalories(durationSeconds, workoutType, userWeightKg);
  // Take the higher of the two (session time includes warm-up/rest)
  return Math.max(exerciseCals, sessionCals);
}

export function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s > 0 ? s + 's' : ''}`.trim();
  return `${s}s`;
}

export function formatDurationShort(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
