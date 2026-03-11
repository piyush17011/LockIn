import { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Alert, Vibration, StatusBar, Animated as RNAnimated,
  TextInput, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp, FadeIn, useSharedValue, useAnimatedStyle, withSpring, withTiming, withSequence } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { logWorkout } from '../../services/workoutService';
import { calcTotalCalories } from '../../constants/calorieCalc';
import { format } from 'date-fns';
import { useTheme } from '../../hooks/ThemeContext';
import { PRESET_EXERCISES } from '../../constants/exercises';

function pad(n) { return String(n).padStart(2, '0'); }
function formatTime(s) { return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`; }

const REST_OPTIONS = [
  { label: '30s',   value: 30  },
  { label: '1 min', value: 60  },
  { label: '90s',   value: 90  },
  { label: '2 min', value: 120 },
];

export const SESSION_KEY = 'active_workout_session';

// ── Exercise Picker (inline — same as LogWorkoutScreen) ──────────────────────
function ExercisePicker({ visible, workoutType, selectedNames, onSelect, onClose, C, F }) {
  const [search, setSearch] = useState('');

  const allExercises = Object.values(PRESET_EXERCISES || {})
    .flat()
    .filter((e, i, arr) => arr.findIndex((x) => x.name === e.name) === i);

  const pool = (workoutType === 'Custom' || !(PRESET_EXERCISES?.[workoutType]?.length))
    ? allExercises
    : PRESET_EXERCISES[workoutType];

  const filtered = pool.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()));

  if (!visible) return null;

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99 }}>
      <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: 56 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 12, borderBottomWidth: 1, borderColor: C.border, marginBottom: 8 }}>
          <TouchableOpacity style={{ width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' }} onPress={onClose}>
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: '800', color: C.text, fontFamily: F.display }}>Add Exercise</Text>
          <TouchableOpacity style={{ borderRadius: 999, paddingHorizontal: 16, paddingVertical: 7, backgroundColor: C.accent }} onPress={onClose}>
            <Text style={{ fontWeight: '800', fontSize: 13, color: C.btnText, fontFamily: F.heading }}>Done</Text>
          </TouchableOpacity>
        </View>
        {/* Search */}
        <View style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface, paddingHorizontal: 16, height: 46, marginBottom: 10, marginHorizontal: 24 }}>
          <Ionicons name="search-outline" size={16} color={C.textSub} style={{ marginRight: 8 }} />
          <TextInput
            style={{ flex: 1, fontSize: 14, color: C.text, fontFamily: F.body }}
            placeholder="Search exercises..."
            placeholderTextColor={C.textSub}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        {/* List */}
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {filtered.length === 0 && (
            <Text style={{ textAlign: 'center', paddingVertical: 24, fontSize: 14, color: C.textSub, fontFamily: F.body }}>No exercises found</Text>
          )}
          {filtered.map((item) => {
            const isSelected = selectedNames.includes(item.name);
            return (
              <TouchableOpacity
                key={item.name}
                style={[
                  { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 16, marginBottom: 8, borderWidth: 1, marginHorizontal: 24, backgroundColor: C.surface, borderColor: C.border },
                  isSelected && { borderColor: C.accent, backgroundColor: C.accent + '15' },
                ]}
                onPress={() => !isSelected && onSelect(item)}
              >
                <Text style={{ fontSize: 26, marginRight: 16 }}>{item.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '600', fontSize: 15, color: isSelected ? C.accent : C.text, fontFamily: F.heading }}>{item.name}</Text>
                  <Text style={{ fontSize: 12, marginTop: 2, color: C.textSub, fontFamily: F.body }}>{item.muscle}</Text>
                </View>
                <View style={{ width: 28, height: 28, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center', borderColor: isSelected ? C.accent : C.border, backgroundColor: isSelected ? C.accent : 'transparent' }}>
                  {isSelected && <Ionicons name="checkmark" size={14} color={C.btnText} />}
                </View>
              </TouchableOpacity>
            );
          })}
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </View>
  );
}



// ── Animated set row — pops in when added ─────────────────────────────────────
function SetRow({ set, setIdx, exIdx, isThisResting, C, F, updateSet, toggleDone }) {
  const scale = useSharedValue(0.85);
  const opacity = useSharedValue(0);
  useEffect(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 200 });
    opacity.value = withTiming(1, { duration: 200 });
  }, []);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));
  return (
    <Animated.View style={animStyle}>
      <View style={[
        { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.bg, borderRadius: 12, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: C.border },
        set.done  && { borderColor: C.accent + '44', backgroundColor: C.accent + '08' },
        isThisResting && { borderColor: C.accent + '60' },
      ]}>
        <View style={[
          { width: 28, height: 28, borderRadius: 14, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
          set.done && { backgroundColor: C.accent },
        ]}>
          {set.done
            ? <Ionicons name="checkmark" size={13} color={C.btnText} />
            : <Text style={{ color: C.textSub, fontWeight: '700', fontSize: 12, fontFamily: F.heading }}>{setIdx + 1}</Text>
          }
        </View>
        <TextInput
          style={[
            { flex: 1, height: 46, paddingVertical: 6, backgroundColor: C.surface, borderRadius: 10, borderWidth: 1, borderColor: C.border, color: C.text, fontWeight: '600', fontSize: 15, textAlign: 'center', fontFamily: F.heading },
            set.done && { color: C.accent, borderColor: C.accent + '40', backgroundColor: C.accent + '08' },
          ]}
          placeholder="0" placeholderTextColor={C.muted}
          keyboardType="decimal-pad" value={set.weight}
          onChangeText={(v) => updateSet(exIdx, setIdx, 'weight', v)}
          editable={!set.done}
        />
        <TextInput
          style={[
            { flex: 1, height: 46, paddingVertical: 6, backgroundColor: C.surface, borderRadius: 10, borderWidth: 1, borderColor: C.border, color: C.text, fontWeight: '600', fontSize: 15, textAlign: 'center', fontFamily: F.heading },
            set.done && { color: C.accent, borderColor: C.accent + '40', backgroundColor: C.accent + '08' },
          ]}
          placeholder="0" placeholderTextColor={C.muted}
          keyboardType="numeric" value={set.reps}
          onChangeText={(v) => updateSet(exIdx, setIdx, 'reps', v)}
          editable={!set.done}
        />
        <TouchableOpacity
          style={[
            { width: 38, height: 38, borderRadius: 10, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
            set.done && { backgroundColor: C.accent, borderColor: C.accent },
          ]}
          onPress={() => toggleDone(exIdx, setIdx)}
        >
          <Ionicons name={set.done ? 'checkmark' : 'checkmark-outline'} size={18} color={set.done ? C.btnText : C.textSub} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

// ── Exercise card ──────────────────────────────────────────────────────────────
function ExCard({ ex, exIdx, sets, activeRest, restLeft, C, F, updateSet, toggleDone, addSet, removeSet, removeExercise }) {
  const allDone   = (sets[exIdx] || []).every((s) => s.done);
  const isResting = activeRest?.exIdx === exIdx;

  // pulse accent glow when resting
  const glowOpacity = useSharedValue(0);
  useEffect(() => {
    if (isResting) {
      glowOpacity.value = withSequence(
        withTiming(1, { duration: 600 }),
        withTiming(0.3, { duration: 600 }),
      );
      // keep pulsing
      const id = setInterval(() => {
        glowOpacity.value = withSequence(
          withTiming(1, { duration: 600 }),
          withTiming(0.3, { duration: 600 }),
        );
      }, 1200);
      return () => clearInterval(id);
    } else {
      glowOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [isResting]);

  const glowStyle = useAnimatedStyle(() => ({
    borderColor: C.accent,
    borderWidth: isResting ? 1.5 : 1,
    shadowColor: C.accent,
    shadowOpacity: glowOpacity.value * 0.3,
    shadowRadius: 12,
    elevation: glowOpacity.value * 4,
  }));

  return (
    <Animated.View
      entering={FadeInDown.duration(300).springify()}
      style={[
        { backgroundColor: C.card, borderRadius: 18, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: C.border },
        allDone && { borderColor: C.accent + '44', backgroundColor: C.accent + '06' },
        glowStyle,
      ]}
    >
      {/* Exercise header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <Text style={{ fontSize: 24 }}>{ex.emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ color: C.text, fontWeight: '700', fontSize: 15, fontFamily: F.heading }}>{ex.name}</Text>
          <Text style={{ color: C.textSub, fontSize: 12, marginTop: 1, fontFamily: F.body }}>{ex.muscle}</Text>
        </View>
        {allDone
          ? <Animated.View entering={FadeIn.duration(300)}>
              <Ionicons name="checkmark-circle" size={22} color={C.accent} />
            </Animated.View>
          : isResting
            ? <View style={{ backgroundColor: C.accent + '20', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                <Text style={{ color: C.accent, fontSize: 11, fontWeight: '700', fontFamily: F.heading }}>Resting {restLeft}s</Text>
              </View>
            : null
        }
        <TouchableOpacity
          style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#ff6b6b10', borderWidth: 1, borderColor: '#ff6b6b30', alignItems: 'center', justifyContent: 'center', marginLeft: 6 }}
          onPress={() => removeExercise(exIdx)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="trash-outline" size={16} color="#ff6b6b" />
        </TouchableOpacity>
      </View>

      {/* Set column headers */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6, paddingHorizontal: 2 }}>
        <Text style={{ color: C.muted, fontSize: 10, fontWeight: '700', letterSpacing: 0.8, width: 36, fontFamily: F.heading }}>SET</Text>
        <Text style={{ color: C.muted, fontSize: 10, fontWeight: '700', letterSpacing: 0.8, flex: 1, textAlign: 'center', fontFamily: F.heading }}>WEIGHT (kg)</Text>
        <Text style={{ color: C.muted, fontSize: 10, fontWeight: '700', letterSpacing: 0.8, flex: 1, textAlign: 'center', fontFamily: F.heading }}>REPS</Text>
        <View style={{ width: 44 }} />
      </View>

      {sets[exIdx].map((set, setIdx) => {
        const isThisResting = activeRest?.exIdx === exIdx && activeRest?.setIdx === setIdx;
        return (
          <SetRow
            key={setIdx}
            set={set} setIdx={setIdx} exIdx={exIdx}
            isThisResting={isThisResting}
            C={C} F={F}
            updateSet={updateSet}
            toggleDone={toggleDone}
          />
        );
      })}

      {/* Add / remove set */}
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: C.accent + '10', borderWidth: 1, borderColor: C.accent + '33' }}
          onPress={() => addSet(exIdx)}
        >
          <Ionicons name="add-circle-outline" size={16} color={C.accent} />
          <Text style={{ color: C.accent, fontSize: 13, fontWeight: '600', fontFamily: F.body }}>Add Set</Text>
        </TouchableOpacity>
        {sets[exIdx].length > 1 && (
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: '#ff6b6b0a', borderWidth: 1, borderColor: '#ff6b6b33' }}
            onPress={() => removeSet(exIdx)}
          >
            <Ionicons name="remove-circle-outline" size={16} color="#ff6b6b" />
            <Text style={{ color: '#ff6b6b', fontSize: 13, fontWeight: '600', fontFamily: F.body }}>Remove Last</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

export default function WorkoutSessionScreen({ route, navigation }) {
  const { workout, date, restoredExercises, restoredSets, wallStart: restoredWallStart } = route.params;
  const { user, userData } = useAuth();
  const userWeightKg = userData?.calorieProfile?.weight || 70;
  const { scheme: C, font: F } = useTheme();
  const ff = { heading: { fontFamily: F.heading }, body: { fontFamily: F.body }, display: { fontFamily: F.display } };

  // ─── TIMER ───────────────────────────────────────────────────────────────────
  const wallStartRef     = useRef(restoredWallStart ?? Date.now());
  const timerIntervalRef = useRef(null);
  const [elapsed, setElapsed] = useState(
    restoredWallStart ? Math.floor((Date.now() - restoredWallStart) / 1000) : 0
  );

  useEffect(() => {
    timerIntervalRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - wallStartRef.current) / 1000));
    }, 1000);
    return () => { if (timerIntervalRef.current) clearInterval(timerIntervalRef.current); };
  }, []);

  // ─── REST TIMER ──────────────────────────────────────────────────────────────
  const [restDuration, setRestDuration]     = useState(60);
  const [showRestPicker, setShowRestPicker] = useState(false);
  const [customRest, setCustomRest]         = useState('');
  const [activeRest, setActiveRest]         = useState(null);
  const [restLeft, setRestLeft]             = useState(0);
  const restIntervalRef = useRef(null);
  const restAnim        = useRef(new RNAnimated.Value(1)).current;

  const startRestFor = (exIdx, setIdx) => {
    if (restIntervalRef.current) clearInterval(restIntervalRef.current);
    restAnim.stopAnimation(); restAnim.setValue(1);
    setActiveRest({ exIdx, setIdx }); setRestLeft(restDuration);
    Vibration.vibrate(200);
    RNAnimated.timing(restAnim, { toValue: 0, duration: restDuration * 1000, useNativeDriver: false }).start();
    restIntervalRef.current = setInterval(() => {
      setRestLeft((r) => {
        if (r <= 1) {
          clearInterval(restIntervalRef.current);
          setActiveRest(null); restAnim.setValue(1);
          Vibration.vibrate([0, 200, 100, 200]);
          return restDuration;
        }
        return r - 1;
      });
    }, 1000);
  };

  const skipRest = () => {
    if (restIntervalRef.current) clearInterval(restIntervalRef.current);
    restAnim.stopAnimation(); restAnim.setValue(1);
    setActiveRest(null); setRestLeft(restDuration);
  };

  useEffect(() => () => { if (restIntervalRef.current) clearInterval(restIntervalRef.current); }, []);

  // ─── EXERCISES & SETS ────────────────────────────────────────────────────────
  const [exercises, setExercises] = useState(() =>
    restoredExercises?.length
      ? restoredExercises
      : workout.exercises.map((ex) => ({ ...ex }))
  );
  const [sets, setSets] = useState(() =>
    restoredSets?.length
      ? restoredSets
      : workout.exercises.map((ex) =>
          (ex.sets?.length ? ex.sets : [{ weight: '', reps: '' }]).map((s) => ({
            weight: s.weight || '', reps: s.reps || '', done: false,
          }))
        )
  );

  const exercisesRef = useRef(exercises);
  const setsRef      = useRef(sets);
  useEffect(() => { exercisesRef.current = exercises; }, [exercises]);
  useEffect(() => { setsRef.current = sets; }, [sets]);

  const removeExercise = (exIdx) => {
    Alert.alert('Remove Exercise?', `Remove "${exercises[exIdx].name}"? Your preset won't be affected.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => {
        if (activeRest?.exIdx === exIdx) skipRest();
        setExercises((prev) => prev.filter((_, i) => i !== exIdx));
        setSets((prev) => prev.filter((_, i) => i !== exIdx));
      }},
    ]);
  };

  const updateSet = (exIdx, setIdx, field, val) =>
    setSets((prev) => prev.map((exSets, i) =>
      i !== exIdx ? exSets : exSets.map((s, j) => j !== setIdx ? s : { ...s, [field]: val })
    ));

  const toggleDone = (exIdx, setIdx) => {
    const wasDone = sets[exIdx][setIdx].done;
    setSets((prev) => prev.map((exSets, i) =>
      i !== exIdx ? exSets : exSets.map((s, j) => j !== setIdx ? s : { ...s, done: !s.done })
    ));
    if (!wasDone) startRestFor(exIdx, setIdx);
    else if (activeRest?.exIdx === exIdx && activeRest?.setIdx === setIdx) skipRest();
  };

  const addSet = (exIdx) =>
    setSets((prev) => prev.map((exSets, i) =>
      i !== exIdx ? exSets : [...exSets, { weight: exSets.at(-1)?.weight || '', reps: exSets.at(-1)?.reps || '', done: false }]
    ));

  const removeSet = (exIdx) => {
    if (sets[exIdx].length === 1) return;
    setSets((prev) => prev.map((exSets, i) =>
      i !== exIdx ? exSets : exSets.slice(0, -1)
    ));
  };

  // ─── PERSISTENCE ─────────────────────────────────────────────────────────────
  const persistNow = () => {
    if (!user?.uid) return;
    AsyncStorage.setItem(SESSION_KEY, JSON.stringify({
      workout, date,
      exercises: exercisesRef.current,
      sets:      setsRef.current,
      wallStart: wallStartRef.current,
      savedAt:   Date.now(),
      userId:    user.uid,
    })).catch(() => {});
  };

  useEffect(() => { persistNow(); }, [sets, exercises]);

  // ─── PROGRESS & CALORIES ─────────────────────────────────────────────────────
  const totalSets    = sets.reduce((a, ex) => a + ex.length, 0);
  const doneSets     = sets.reduce((a, ex) => a + ex.filter((s) => s.done).length, 0);
  const progress     = totalSets > 0 ? doneSets / totalSets : 0;
  const liveCalories = calcTotalCalories({
    exercises: exercises.map((ex, i) => ({
      name: ex.name,
      sets: (sets[i] || []).filter((s) => s.done).map((s) => ({ reps: s.reps, weight: s.weight })),
    })),
    durationSeconds: elapsed,
    workoutType: workout.type,
    userWeightKg,
  });

  // Animate stats when doneSets changes
  const statScale = useSharedValue(1);
  useEffect(() => {
    if (doneSets > 0) {
      statScale.value = withSequence(withSpring(1.15, { damping: 8 }), withSpring(1));
    }
  }, [doneSets]);
  const statScaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: statScale.value }] }));

  // ─── FINISH ──────────────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);
  const [showExPicker, setShowExPicker] = useState(false);

  const saveAndShare = async () => {
    setSaving(true);
    if (timerIntervalRef.current) { clearInterval(timerIntervalRef.current); timerIntervalRef.current = null; }

    const flat = exercises.map((ex, exIdx) => {
      const done = (sets[exIdx] || []).filter((s) => s.done);
      if (!done.length) return null;
      return {
        name: ex.name, emoji: ex.emoji, muscle: ex.muscle,
        sets:   done.length,
        reps:   done.map((s) => s.reps   || '0').join('/'),
        weight: done.map((s) => s.weight || '0').join('/'),
      };
    }).filter(Boolean);

    const today = date || format(new Date(), 'yyyy-MM-dd');
    const finalCalories = calcTotalCalories({
      exercises: exercises.map((ex, i) => ({
        name: ex.name,
        sets: (sets[i] || []).filter((s) => s.done).map((s) => ({ reps: s.reps, weight: s.weight })),
      })),
      durationSeconds: elapsed,
      workoutType: workout.type,
      userWeightKg,
    });

    const payload = {
      type: workout.type, exercises: flat,
      notes: `${formatTime(elapsed)} session`,
      date: today, durationSeconds: elapsed, caloriesBurned: finalCalories,
    };

    route.params?.onSave?.({ id: `temp_${Date.now()}`, userId: user.uid, ...payload });
    await AsyncStorage.removeItem(SESSION_KEY).catch(() => {});
    logWorkout(user.uid, payload).catch((e) => console.error('Save failed', e));
    setSaving(false);

    navigation.navigate('WorkoutShare', {
      workout: { ...payload, id: `share_${Date.now()}` },
      streak:   userData?.streak || 0,
      userName: userData?.displayName || user?.displayName || 'Athlete',
      userId:   user.uid,
    });
  };

  const addExerciseMidSession = (item) => {
    const already = exercises.find((e) => e.name === item.name);
    if (already) return;
    const cardioKw = ['running','cycling','jump rope','rowing','swimming','elliptical','stair','walk','jog','sprint','treadmill','cardio','burpee','mountain climber','box jump','skipping','hiit','bike','run'];
    const isCardio = cardioKw.some((k) =>
      item.name.toLowerCase().includes(k) || (item.muscle || '').toLowerCase().includes('cardio')
    );
    setExercises((prev) => [...prev, { name: item.name, emoji: item.emoji, muscle: item.muscle, isCardio }]);
    setSets((prev) => [...prev, [isCardio ? { minutes: '', seconds: '' } : { weight: '', reps: '', done: false }]]);
  };

  const handleFinish = () => {
    const isPartial = doneSets < totalSets;
    const summary   = `${formatTime(elapsed)}  ·  ~${liveCalories} cal`;
    if (isPartial) {
      Alert.alert('Log Partial Workout? 📋',
        `Only ${doneSets}/${totalSets} sets completed.\nOnly finished sets will be saved.\n\n${summary}`,
        [{ text: 'Keep Going', style: 'cancel' }, { text: 'Log Partial', onPress: saveAndShare }]
      );
    } else {
      Alert.alert('Finish Workout? 🔥',
        `${doneSets}/${totalSets} sets  ·  ${summary}`,
        [{ text: 'Keep Going', style: 'cancel' }, { text: 'Finish 🔥', onPress: saveAndShare }]
      );
    }
  };

  const handleQuit = () => {
    Alert.alert('Quit Workout?', 'Your progress is saved — continue from the Dashboard.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Quit', style: 'destructive', onPress: () => {
          if (timerIntervalRef.current) { clearInterval(timerIntervalRef.current); timerIntervalRef.current = null; }
          navigation.goBack();
        } },
    ]);
  };

  const restBarWidth = restAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  // ─── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" />

      {/* ── Header ── */}
      <Animated.View entering={FadeInDown.duration(350)} style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingTop: 56, paddingBottom: 10,
      }}>
        <TouchableOpacity
          style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' }}
          onPress={handleQuit}
        >
          <Ionicons name="close" size={20} color={C.textSub} />
        </TouchableOpacity>

        {/* Timer — center */}
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: C.textSub, fontSize: 10, fontWeight: '700', letterSpacing: 1, fontFamily: F.heading }}>ELAPSED</Text>
          <Text style={{ color: C.text, fontSize: 32, fontWeight: '800', fontFamily: F.display }}>{formatTime(elapsed)}</Text>
        </View>

        <TouchableOpacity
          style={[{ backgroundColor: C.accent, borderRadius: 20, paddingHorizontal: 18, paddingVertical: 8 }, saving && { opacity: 0.6 }]}
          onPress={handleFinish} disabled={saving}
        >
          <Text style={{ color: C.btnText, fontWeight: '800', fontSize: 14, fontFamily: F.heading }}>{saving ? '...' : 'Finish'}</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* ── Live stats ── */}
      <Animated.View entering={FadeInDown.duration(350).delay(60)} style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        marginHorizontal: 20, marginBottom: 10,
        backgroundColor: C.card, borderRadius: 14, padding: 12,
        borderWidth: 1, borderColor: C.border, gap: 8,
      }}>
        <Animated.View style={[{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 }]}>
          <Ionicons name="flame-outline" size={14} color="#ff9f43" />
          <Text style={{ color: C.text, fontWeight: '800', fontSize: 16, fontFamily: F.display }}>{liveCalories}</Text>
          <Text style={{ color: C.textSub, fontSize: 11, fontWeight: '600', fontFamily: F.body }}>cal</Text>
        </Animated.View>
        <View style={{ width: 1, height: 20, backgroundColor: C.border }} />
        <Animated.View style={[{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 }, statScaleStyle]}>
          <Ionicons name="checkmark-circle-outline" size={14} color={C.accent} />
          <Text style={{ color: C.text, fontWeight: '800', fontSize: 16, fontFamily: F.display }}>{doneSets}</Text>
          <Text style={{ color: C.textSub, fontSize: 11, fontWeight: '600', fontFamily: F.body }}>sets done</Text>
        </Animated.View>
        <View style={{ width: 1, height: 20, backgroundColor: C.border }} />
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <Ionicons name="barbell-outline" size={14} color="#54a0ff" />
          <Text style={{ color: C.text, fontWeight: '800', fontSize: 16, fontFamily: F.display }}>{exercises.length}</Text>
          <Text style={{ color: C.textSub, fontSize: 11, fontWeight: '600', fontFamily: F.body }}>exercises</Text>
        </View>
      </Animated.View>

      {/* ── Rest duration picker ── */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, marginBottom: 10, flexWrap: 'wrap' }}>
        <Ionicons name="timer-outline" size={15} color={C.textSub} />
        <Text style={{ color: C.textSub, fontSize: 12, marginRight: 2, fontFamily: F.body }}>Rest:</Text>
        {REST_OPTIONS.map((o) => {
          const active = restDuration === o.value;
          return (
            <TouchableOpacity
              key={o.value}
              style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, backgroundColor: active ? C.accent + '20' : C.surface, borderWidth: 1, borderColor: active ? C.accent : C.border }}
              onPress={() => setRestDuration(o.value)}
            >
              <Text style={{ color: active ? C.accent : C.textSub, fontSize: 12, fontWeight: '600', fontFamily: F.body }}>{o.label}</Text>
            </TouchableOpacity>
          );
        })}
        {/* Custom chip */}
        {(() => {
          const isCustom = !REST_OPTIONS.find((o) => o.value === restDuration);
          return (
            <TouchableOpacity
              style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, backgroundColor: isCustom ? C.accent + '20' : C.surface, borderWidth: 1, borderColor: isCustom ? C.accent : C.border }}
              onPress={() => setShowRestPicker(true)}
            >
              <Text style={{ color: isCustom ? C.accent : C.textSub, fontSize: 12, fontWeight: '600', fontFamily: F.body }}>
                {isCustom ? `${restDuration}s` : 'Custom'}
              </Text>
            </TouchableOpacity>
          );
        })()}
      </View>

      {/* ── Progress bar ── */}
      <View style={{ height: 4, backgroundColor: C.surface, marginHorizontal: 20, borderRadius: 2 }}>
        <RNAnimated.View style={{ height: 4, backgroundColor: C.accent, borderRadius: 2, width: `${progress * 100}%` }} />
      </View>
      <Text style={{ color: C.textSub, fontSize: 12, textAlign: 'center', marginTop: 6, marginBottom: 4, fontFamily: F.body }}>
        {doneSets}/{totalSets} sets complete
      </Text>

      {/* ── Active rest banner ── */}
      {activeRest && (
        <Animated.View entering={FadeInUp.duration(300)} style={{
          flexDirection: 'row', alignItems: 'center', gap: 12,
          marginHorizontal: 20, marginTop: 8,
          backgroundColor: C.card, borderRadius: 14, padding: 12,
          borderWidth: 1.5, borderColor: C.accent + '50',
        }}>
          <Text style={{ fontSize: 26 }}>😮‍💨</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: C.textSub, fontSize: 11, fontWeight: '600', fontFamily: F.body }}>
              Rest · {exercises[activeRest.exIdx]?.name} set {activeRest.setIdx + 1}
            </Text>
            <Text style={{ color: C.accent, fontSize: 22, fontWeight: '800', fontFamily: F.display }}>{restLeft}s</Text>
            <View style={{ height: 3, backgroundColor: C.surface, borderRadius: 2, marginTop: 4, overflow: 'hidden' }}>
              <RNAnimated.View style={{ height: 3, backgroundColor: C.accent, width: restBarWidth }} />
            </View>
          </View>
          <TouchableOpacity
            style={{ backgroundColor: C.surface, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: C.border }}
            onPress={skipRest}
          >
            <Text style={{ color: C.text, fontWeight: '700', fontSize: 13, fontFamily: F.heading }}>Skip →</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* ── Exercise list ── */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={{ color: C.textSub, fontSize: 12, fontWeight: '700', letterSpacing: 1.5, marginBottom: 14, textTransform: 'uppercase', fontFamily: F.heading }}>
            {workout.type}
          </Text>

          {exercises.map((ex, exIdx) => (
            <ExCard
              key={exIdx}
              ex={ex} exIdx={exIdx}
              sets={sets}
              activeRest={activeRest}
              restLeft={restLeft}
              C={C} F={F}
              updateSet={updateSet}
              toggleDone={toggleDone}
              addSet={addSet}
              removeSet={removeSet}
              removeExercise={removeExercise}
            />
          ))}

          {/* Add exercise mid-session */}
          <Animated.View entering={FadeInDown.duration(300).delay(100)}>
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, padding: 14, marginBottom: 12, backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.border }}
              onPress={() => setShowExPicker(true)}
              activeOpacity={0.75}
            >
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: C.accent + '20', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="add" size={18} color={C.accent} />
              </View>
              <Text style={{ color: C.accent, fontWeight: '700', fontSize: 14, fontFamily: F.heading }}>Add Exercise</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Finish workout button */}
          <Animated.View entering={FadeInUp.duration(400).delay(200)}>
            <TouchableOpacity
              style={[
                { backgroundColor: C.accent + '18', borderRadius: 18, padding: 20, alignItems: 'center', marginTop: 8, borderWidth: 1.5, borderColor: C.accent + '44' },
                saving && { opacity: 0.6 },
              ]}
              onPress={handleFinish} disabled={saving}
            >
              <Text style={{ color: C.accent, fontSize: 18, fontWeight: '800', fontFamily: F.display }}>
                {saving ? 'Saving...' : '🔥 Finish Workout'}
              </Text>
              <Text style={{ color: C.textSub, fontSize: 13, marginTop: 4, fontFamily: F.body }}>
                {formatTime(elapsed)} · {doneSets}/{totalSets} sets · ~{liveCalories} cal
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Add exercise picker ── */}
      {showExPicker && (
        <ExercisePicker
          visible={showExPicker}
          workoutType={workout.type}
          selectedNames={exercises.map((e) => e.name)}
          onSelect={(item) => {
            addExerciseMidSession(item);
            setShowExPicker(false);
          }}
          onClose={() => setShowExPicker(false)}
          C={C} F={F}
        />
      )}

      {/* ── Custom rest modal ── */}
      <Modal visible={showRestPicker} transparent animationType="fade">
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center' }} activeOpacity={1} onPress={() => setShowRestPicker(false)}>
          <Animated.View entering={FadeInDown.duration(300)} style={{
            width: 280, backgroundColor: C.card, borderRadius: 20, padding: 24,
            borderWidth: 1, borderColor: C.border,
          }}>
            <Text style={{ color: C.text, fontWeight: '700', fontSize: 16, marginBottom: 16, fontFamily: F.heading }}>Custom Rest (seconds)</Text>
            <TextInput
              style={{ backgroundColor: C.bg, borderRadius: 12, borderWidth: 1, borderColor: C.border, color: C.text, fontSize: 18, fontWeight: '700', textAlign: 'center', padding: 14, marginBottom: 14, fontFamily: F.heading }}
              placeholder="e.g. 45" placeholderTextColor={C.textSub}
              keyboardType="numeric" value={customRest}
              onChangeText={setCustomRest} autoFocus
            />
            <TouchableOpacity
              style={{ backgroundColor: C.accent, borderRadius: 12, padding: 14, alignItems: 'center' }}
              onPress={() => {
                const v = parseInt(customRest);
                if (v > 0) { setRestDuration(v); setShowRestPicker(false); setCustomRest(''); }
                else Alert.alert('Invalid', 'Enter a number > 0');
              }}
            >
              <Text style={{ color: C.btnText, fontWeight: '800', fontSize: 15, fontFamily: F.heading }}>Set Rest Time</Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
