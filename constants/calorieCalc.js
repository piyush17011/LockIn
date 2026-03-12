// constants/calorieCalc.js
// MET (Metabolic Equivalent of Task) values per exercise type
// Calories = MET × weight(kg) × duration(hours)

const DEFAULT_WEIGHT_KG = 70;

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

const EXERCISE_MET = {
  // Cardio
  'Treadmill Run':     9.0,
  'Jump Rope':         12.0,
  'Cycling':           8.0,
  'Stair Climber':     9.0,
  'Rowing Machine':    7.0,
  'Elliptical':        6.5,
  'Running':           9.5,
  'Swimming':          8.0,
  'Walking':           3.5,
  'Jogging':           7.0,
  // HIIT
  'Burpees':           10.0,
  'Box Jumps':         8.5,
  'Mountain Climbers': 9.0,
  'Jump Squats':       8.0,
  'Kettlebell Swings': 8.0,
  'Battle Ropes':      9.0,
  // Heavy compound
  'Deadlifts':         6.0,
  'Squats':            6.0,
  'Bench Press':       5.0,
  'Pull-Ups':          5.5,
  // Default
  'default_cardio':    7.5,
  'default':           4.5,
};

// ── Weight training ───────────────────────────────────────────────────────────
export function calcWeightTrainingCalories(exercises, userWeightKg = DEFAULT_WEIGHT_KG, workoutType = 'Custom') {
  if (!exercises || exercises.length === 0) return 0;

  let totalSeconds = 0;
  let weightedMETSeconds = 0;

  exercises.forEach((ex) => {
    if (ex.isCardio) return; // handled separately
    const sets = ex.sets || [];
    const met = EXERCISE_MET[ex.name] || EXERCISE_MET['default'];

    sets.forEach((set) => {
      const reps = parseInt(set.reps) || 0;
      if (reps === 0) return;
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

// ── Cardio exercises — uses actual timed duration per set ─────────────────────
// Each cardio exercise entry can carry either:
//   sets: [{ minutes, seconds }]  ← from the live session (CardioSetTimer)
//   durationSeconds               ← pre-summed total (saved payload format)
export function calcCardioExerciseCalories(exercises, userWeightKg = DEFAULT_WEIGHT_KG) {
  if (!exercises || exercises.length === 0) return 0;

  let total = 0;

  exercises.forEach((ex) => {
    if (!ex.isCardio) return;
    const met = EXERCISE_MET[ex.name] || EXERCISE_MET['default_cardio'];

    // Live session format: sets array with minutes/seconds per set
    if (Array.isArray(ex.sets) && ex.sets.length > 0 && typeof ex.sets[0] === 'object') {
      ex.sets.forEach((set) => {
        const secs = (parseInt(set.minutes || 0) * 60) + parseInt(set.seconds || 0);
        if (secs > 0) {
          total += Math.round(met * userWeightKg * (secs / 3600));
        }
      });
    }
    // Saved payload format: durationSeconds (sum of all sets)
    else if (ex.durationSeconds && ex.durationSeconds > 0) {
      total += Math.round(met * userWeightKg * (ex.durationSeconds / 3600));
    }
    // Fallback: reps stored as "2:30/1:45" strings (from saved workout history)
    else if (typeof ex.reps === 'string' && ex.reps.includes(':')) {
      ex.reps.split('/').forEach((chunk) => {
        const [m, s] = chunk.split(':');
        const secs = (parseInt(m || 0) * 60) + parseInt(s || 0);
        if (secs > 0) {
          total += Math.round(met * userWeightKg * (secs / 3600));
        }
      });
    }
  });

  return total;
}

// ── Session-level (fallback for pure cardio workouts with no per-exercise data) ──
export function calcSessionCalories(durationSeconds, workoutType = 'Custom', userWeightKg = DEFAULT_WEIGHT_KG) {
  const met = WORKOUT_TYPE_MET[workoutType] || 5.0;
  const hours = durationSeconds / 3600;
  return Math.round(met * userWeightKg * hours);
}

// ── Combined — works for strength, cardio, and mixed workouts ─────────────────
//
// Strategy:
//   Strength exercises  → MET × estimated active time from reps
//   Cardio exercises    → MET × actual timed duration per set
//   Session overhead    → rest periods, warm-up, transitions (session elapsed minus
//                         active exercise time, at resting/low MET)
//   Pure cardio session → per-exercise calc; fall back to session timer if no
//                         set durations were logged
//
export function calcTotalCalories({ exercises, durationSeconds, workoutType, userWeightKg = DEFAULT_WEIGHT_KG }) {
  const hasExercises = exercises && exercises.length > 0;

  const cardioExercises  = hasExercises ? exercises.filter(e => e.isCardio)  : [];
  const strengthExercises = hasExercises ? exercises.filter(e => !e.isCardio) : [];

  const cardioCals   = calcCardioExerciseCalories(cardioExercises, userWeightKg);
  const strengthCals = calcWeightTrainingCalories(strengthExercises, userWeightKg, workoutType);

  // Session-level calories based on total elapsed time at workout-type MET
  const sessionCals = calcSessionCalories(durationSeconds, workoutType, userWeightKg);

  // Pure cardio session: use per-exercise if we have real durations, else fall back
  const pureCardioTypes = ['Cardio', 'HIIT', 'Mobility'];
  if (pureCardioTypes.includes(workoutType)) {
    // If cardio exercises have actual logged times, use those (more accurate)
    if (cardioCals > 0) return cardioCals;
    // Otherwise fall back to session timer × workout MET
    return sessionCals;
  }

  // Mixed / strength workout
  if (strengthCals === 0 && cardioCals === 0) {
    // Nothing logged yet — use session timer as live estimate
    return sessionCals;
  }

  // Combine: strength + cardio exercise calories, then ensure we don't go
  // below session-level estimate (session time captures rest + warmup too)
  const exerciseCals = strengthCals + cardioCals;
  return Math.max(exerciseCals, sessionCals);
}

// ── Formatting helpers ────────────────────────────────────────────────────────
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
