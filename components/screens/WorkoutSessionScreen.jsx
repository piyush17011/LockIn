import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Vibration, StatusBar, Animated as RNAnimated,
  TextInput, Modal, KeyboardAvoidingView, Platform, AppState,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { logWorkout } from '../../services/workoutService';
import { calcTotalCalories } from '../../constants/calorieCalc';
import { format } from 'date-fns';

function pad(n) { return String(n).padStart(2, '0'); }
function formatTime(s) { return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`; }

const REST_OPTIONS = [
  { label: '30s',   value: 30  },
  { label: '1 min', value: 60  },
  { label: '90s',   value: 90  },
  { label: '2 min', value: 120 },
];

export const SESSION_KEY = 'active_workout_session';

export default function WorkoutSessionScreen({ route, navigation }) {
  const { workout, date } = route.params;
  const { user, userData } = useAuth();
  const userWeightKg = userData?.calorieProfile?.weight || 70;

  // ─────────────────────────────────────────────────────────────────────────────
  // TIMER
  //
  // How it works:
  //   accumulatedRef  = total seconds counted during all previous active periods
  //   sessionStartRef = Date.now() of when the CURRENT active period began
  //
  // Every tick:  elapsed = accumulatedRef + floor((now - sessionStartRef) / 1000)
  //
  // On background: freeze accumulatedRef (add current period), clear interval
  // On foreground: reset sessionStartRef to now, restart interval
  //
  // This means elapsed is ALWAYS correct regardless of how long the app was
  // in the background or recent apps.
  // ─────────────────────────────────────────────────────────────────────────────
  const accumulatedRef   = useRef(0);
  const sessionStartRef  = useRef(Date.now());
  const timerIntervalRef = useRef(null);
  const appStateRef      = useRef(AppState.currentState);
  const [elapsed, setElapsed] = useState(0);

  const startInterval = () => {
    if (timerIntervalRef.current) return;
    sessionStartRef.current = Date.now();
    timerIntervalRef.current = setInterval(() => {
      setElapsed(accumulatedRef.current + Math.floor((Date.now() - sessionStartRef.current) / 1000));
    }, 1000);
  };

  const stopInterval = () => {
    if (!timerIntervalRef.current) return;
    accumulatedRef.current += Math.floor((Date.now() - sessionStartRef.current) / 1000);
    clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = null;
  };

  useEffect(() => {
    startInterval();
    return () => stopInterval();
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      const prevState = appStateRef.current;
      appStateRef.current = nextState;

      if (prevState === 'active' && (nextState === 'background' || nextState === 'inactive')) {
        stopInterval();
        // Immediately persist to AsyncStorage while going to background
        persistNow();
      }
      if ((prevState === 'background' || prevState === 'inactive') && nextState === 'active') {
        startInterval();
      }
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // REST TIMER
  // ─────────────────────────────────────────────────────────────────────────────
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

  // ─────────────────────────────────────────────────────────────────────────────
  // EXERCISES & SETS
  // ─────────────────────────────────────────────────────────────────────────────
  const [exercises, setExercises] = useState(() => workout.exercises.map((ex) => ({ ...ex })));
  const [sets, setSets] = useState(() =>
    workout.exercises.map((ex) =>
      (ex.sets?.length ? ex.sets : [{ weight: '', reps: '' }]).map((s) => ({
        weight: s.weight || '', reps: s.reps || '', done: false,
      }))
    )
  );

  // Refs so persistNow() can always read latest values without stale closures
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

  // ─────────────────────────────────────────────────────────────────────────────
  // PERSISTENCE
  //
  // persistNow() reads from refs so it can be called from AppState handler
  // (which has no access to current React state via closure).
  //
  // The useEffect below calls persistNow() whenever sets/exercises change,
  // so every completed set / added exercise is immediately saved.
  // ─────────────────────────────────────────────────────────────────────────────
  const persistNow = () => {
    if (!user?.uid) return;
    const currentElapsed =
      accumulatedRef.current + Math.floor((Date.now() - sessionStartRef.current) / 1000);
    AsyncStorage.setItem(SESSION_KEY, JSON.stringify({
      workout,
      date,
      exercises: exercisesRef.current,
      sets: setsRef.current,
      elapsedSeconds: currentElapsed,
      savedAt: Date.now(),
      userId: user.uid,
    })).catch(() => {});
  };

  useEffect(() => { persistNow(); }, [sets, exercises]);

  // ─────────────────────────────────────────────────────────────────────────────
  // PROGRESS & LIVE CALORIES
  // ─────────────────────────────────────────────────────────────────────────────
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

  // ─────────────────────────────────────────────────────────────────────────────
  // FINISH
  // ─────────────────────────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);

  const saveAndShare = async () => {
    setSaving(true);
    stopInterval();

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

    navigation.replace('WorkoutShare', {
      workout: { ...payload, id: `share_${Date.now()}` },
      streak:   userData?.streak || 0,
      userName: userData?.displayName || user?.displayName || 'Athlete',
      userId:   user.uid,
    });
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
      { text: 'Quit', style: 'destructive', onPress: () => { stopInterval(); navigation.goBack(); } },
    ]);
  };

  const restBarWidth = restAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.iconBtn} onPress={handleQuit}>
          <Ionicons name="close" size={20} color="#6b7a99" />
        </TouchableOpacity>
        <View style={s.timerWrap}>
          <Text style={s.timerLabel}>ELAPSED</Text>
          <Text style={s.timer}>{formatTime(elapsed)}</Text>
        </View>
        <TouchableOpacity style={[s.finishBtn, saving && { opacity: 0.6 }]} onPress={handleFinish} disabled={saving}>
          <Text style={s.finishBtnText}>{saving ? '...' : 'Finish'}</Text>
        </TouchableOpacity>
      </View>

      {/* Live Stats */}
      <View style={s.statsRow}>
        <View style={s.statChip}>
          <Ionicons name="flame-outline" size={14} color="#ff9f43" />
          <Text style={s.statValue}>{liveCalories}</Text>
          <Text style={s.statLabel}>cal</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.statChip}>
          <Ionicons name="checkmark-circle-outline" size={14} color="#00f5c4" />
          <Text style={s.statValue}>{doneSets}</Text>
          <Text style={s.statLabel}>sets done</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.statChip}>
          <Ionicons name="barbell-outline" size={14} color="#54a0ff" />
          <Text style={s.statValue}>{exercises.length}</Text>
          <Text style={s.statLabel}>exercises</Text>
        </View>
      </View>

      {/* Rest Duration Picker */}
      <View style={s.restConfigRow}>
        <Ionicons name="timer-outline" size={15} color="#6b7a99" />
        <Text style={s.restConfigLabel}>Rest:</Text>
        {REST_OPTIONS.map((o) => (
          <TouchableOpacity key={o.value} style={[s.restChip, restDuration === o.value && s.restChipActive]} onPress={() => setRestDuration(o.value)}>
            <Text style={[s.restChipText, restDuration === o.value && s.restChipTextActive]}>{o.label}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={[s.restChip, !REST_OPTIONS.find((o) => o.value === restDuration) && s.restChipActive]} onPress={() => setShowRestPicker(true)}>
          <Text style={[s.restChipText, !REST_OPTIONS.find((o) => o.value === restDuration) && s.restChipTextActive]}>
            {REST_OPTIONS.find((o) => o.value === restDuration) ? 'Custom' : `${restDuration}s`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      <View style={s.progressBg}><View style={[s.progressFill, { width: `${progress * 100}%` }]} /></View>
      <Text style={s.progressLabel}>{doneSets}/{totalSets} sets complete</Text>

      {/* Active rest banner */}
      {activeRest && (
        <View style={s.restBanner}>
          <Text style={s.restEmoji}>😮‍💨</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.restTitle}>Rest · {exercises[activeRest.exIdx]?.name} set {activeRest.setIdx + 1}</Text>
            <Text style={s.restCount}>{restLeft}s</Text>
            <View style={s.restBarBg}><RNAnimated.View style={[s.restBarFill, { width: restBarWidth }]} /></View>
          </View>
          <TouchableOpacity style={s.skipBtn} onPress={skipRest}>
            <Text style={s.skipBtnText}>Skip →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Exercise list */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <Text style={s.workoutType}>{workout.type}</Text>

          {exercises.map((ex, exIdx) => {
            const allDone   = (sets[exIdx] || []).every((s) => s.done);
            const isResting = activeRest?.exIdx === exIdx;
            return (
              <View key={exIdx} style={[s.exCard, allDone && s.exCardDone, isResting && s.exCardResting]}>
                <View style={s.exHeader}>
                  <Text style={s.exEmoji}>{ex.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.exName}>{ex.name}</Text>
                    <Text style={s.exMuscle}>{ex.muscle}</Text>
                  </View>
                  {allDone
                    ? <Ionicons name="checkmark-circle" size={22} color="#00f5c4" />
                    : isResting
                      ? <View style={s.restingBadge}><Text style={s.restingBadgeText}>Resting {restLeft}s</Text></View>
                      : null}
                  <TouchableOpacity style={s.removeExBtn} onPress={() => removeExercise(exIdx)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="trash-outline" size={16} color="#ff6b6b" />
                  </TouchableOpacity>
                </View>

                <View style={s.setHeaderRow}>
                  <Text style={[s.setHeaderCell, { width: 32 }]}>SET</Text>
                  <Text style={[s.setHeaderCell, { flex: 1 }]}>WEIGHT (kg)</Text>
                  <Text style={[s.setHeaderCell, { flex: 1 }]}>REPS</Text>
                  <View style={{ width: 44 }} />
                </View>

                {sets[exIdx].map((set, setIdx) => {
                  const isThisResting = activeRest?.exIdx === exIdx && activeRest?.setIdx === setIdx;
                  return (
                    <View key={setIdx} style={[s.setRow, set.done && s.setRowDone, isThisResting && s.setRowResting]}>
                      <View style={[s.setNum, set.done && s.setNumDone]}>
                        {set.done ? <Ionicons name="checkmark" size={13} color="#080b10" /> : <Text style={s.setNumText}>{setIdx + 1}</Text>}
                      </View>
                      <TextInput
                        style={[s.setInput, set.done && s.setInputDone]}
                        placeholder="0" placeholderTextColor="#3a4560"
                        keyboardType="decimal-pad" value={set.weight}
                        onChangeText={(v) => updateSet(exIdx, setIdx, 'weight', v)}
                        editable={!set.done}
                      />
                      <TextInput
                        style={[s.setInput, set.done && s.setInputDone]}
                        placeholder="0" placeholderTextColor="#3a4560"
                        keyboardType="numeric" value={set.reps}
                        onChangeText={(v) => updateSet(exIdx, setIdx, 'reps', v)}
                        editable={!set.done}
                      />
                      <TouchableOpacity style={[s.doneBtn, set.done && s.doneBtnActive]} onPress={() => toggleDone(exIdx, setIdx)}>
                        <Ionicons name={set.done ? 'checkmark' : 'checkmark-outline'} size={18} color={set.done ? '#080b10' : '#6b7a99'} />
                      </TouchableOpacity>
                    </View>
                  );
                })}

                <View style={s.setActions}>
                  <TouchableOpacity style={s.addSetBtn} onPress={() => addSet(exIdx)}>
                    <Ionicons name="add-circle-outline" size={16} color="#00f5c4" />
                    <Text style={s.addSetText}>Add Set</Text>
                  </TouchableOpacity>
                  {sets[exIdx].length > 1 && (
                    <TouchableOpacity style={s.removeSetBtn} onPress={() => removeSet(exIdx)}>
                      <Ionicons name="remove-circle-outline" size={16} color="#ff6b6b" />
                      <Text style={s.removeSetText}>Remove Last</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}

          <TouchableOpacity style={[s.bigFinishBtn, saving && { opacity: 0.6 }]} onPress={handleFinish} disabled={saving}>
            <Text style={s.bigFinishText}>{saving ? 'Saving...' : '🔥 Finish Workout'}</Text>
            <Text style={s.bigFinishSub}>{formatTime(elapsed)} · {doneSets}/{totalSets} sets · ~{liveCalories} cal</Text>
          </TouchableOpacity>
          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Custom rest modal */}
      <Modal visible={showRestPicker} transparent animationType="fade">
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setShowRestPicker(false)}>
          <View style={s.restPickerCard}>
            <Text style={s.restPickerTitle}>Custom Rest (seconds)</Text>
            <TextInput
              style={s.restPickerInput} placeholder="e.g. 45"
              placeholderTextColor="#6b7a99" keyboardType="numeric"
              value={customRest} onChangeText={setCustomRest} autoFocus
            />
            <TouchableOpacity style={s.restPickerSave} onPress={() => {
              const v = parseInt(customRest);
              if (v > 0) { setRestDuration(v); setShowRestPicker(false); setCustomRest(''); }
              else Alert.alert('Invalid', 'Enter a number > 0');
            }}>
              <Text style={s.restPickerSaveText}>Set Rest Time</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#080b10' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 10 },
  iconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#131822', borderWidth: 1, borderColor: '#1e2535', alignItems: 'center', justifyContent: 'center' },
  timerWrap: { alignItems: 'center' },
  timerLabel: { color: '#6b7a99', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  timer: { color: '#ffffff', fontSize: 32, fontWeight: '800' },
  finishBtn: { backgroundColor: '#00f5c4', borderRadius: 20, paddingHorizontal: 18, paddingVertical: 8 },
  finishBtnText: { color: '#080b10', fontWeight: '800', fontSize: 14 },
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 20, marginBottom: 10, backgroundColor: '#131822', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#1e2535', gap: 8 },
  statChip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  statDivider: { width: 1, height: 20, backgroundColor: '#1e2535' },
  statValue: { color: '#ffffff', fontWeight: '800', fontSize: 16 },
  statLabel: { color: '#6b7a99', fontSize: 11, fontWeight: '600' },
  restConfigRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, marginBottom: 10, flexWrap: 'wrap' },
  restConfigLabel: { color: '#6b7a99', fontSize: 12, marginRight: 2 },
  restChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, backgroundColor: '#131822', borderWidth: 1, borderColor: '#1e2535' },
  restChipActive: { backgroundColor: 'rgba(0,245,196,0.15)', borderColor: '#00f5c4' },
  restChipText: { color: '#6b7a99', fontSize: 12, fontWeight: '600' },
  restChipTextActive: { color: '#00f5c4' },
  progressBg: { height: 4, backgroundColor: '#131822', marginHorizontal: 20, borderRadius: 2 },
  progressFill: { height: 4, backgroundColor: '#00f5c4', borderRadius: 2 },
  progressLabel: { color: '#6b7a99', fontSize: 12, textAlign: 'center', marginTop: 6, marginBottom: 4 },
  restBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 20, marginTop: 8, backgroundColor: '#131822', borderRadius: 14, padding: 12, borderWidth: 1.5, borderColor: 'rgba(0,245,196,0.3)' },
  restEmoji: { fontSize: 26 },
  restTitle: { color: '#6b7a99', fontSize: 11, fontWeight: '600' },
  restCount: { color: '#00f5c4', fontSize: 22, fontWeight: '800' },
  restBarBg: { height: 3, backgroundColor: '#0e1219', borderRadius: 2, marginTop: 4, overflow: 'hidden' },
  restBarFill: { height: 3, backgroundColor: '#00f5c4' },
  skipBtn: { backgroundColor: '#0e1219', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#1e2535' },
  skipBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },
  scroll: { padding: 20 },
  workoutType: { color: '#6b7a99', fontSize: 12, fontWeight: '700', letterSpacing: 1.5, marginBottom: 14, textTransform: 'uppercase' },
  exCard: { backgroundColor: '#131822', borderRadius: 18, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#1e2535' },
  exCardDone: { borderColor: 'rgba(0,245,196,0.3)', backgroundColor: 'rgba(0,245,196,0.04)' },
  exCardResting: { borderColor: 'rgba(0,245,196,0.2)' },
  exHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  exEmoji: { fontSize: 24 },
  exName: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
  exMuscle: { color: '#6b7a99', fontSize: 12, marginTop: 1 },
  restingBadge: { backgroundColor: 'rgba(0,245,196,0.12)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  restingBadgeText: { color: '#00f5c4', fontSize: 11, fontWeight: '700' },
  setHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6, paddingHorizontal: 2 },
  setHeaderCell: { color: '#3a4560', fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#0e1219', borderRadius: 12, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: '#1e2535' },
  setRowDone: { borderColor: 'rgba(0,245,196,0.2)', backgroundColor: 'rgba(0,245,196,0.05)' },
  setRowResting: { borderColor: 'rgba(0,245,196,0.35)' },
  setNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#1e2535', alignItems: 'center', justifyContent: 'center' },
  setNumDone: { backgroundColor: '#00f5c4' },
  setNumText: { color: '#6b7a99', fontWeight: '700', fontSize: 12 },
  setInput: { flex: 1, height: 38, backgroundColor: '#131822', borderRadius: 10, borderWidth: 1, borderColor: '#1e2535', color: '#ffffff', fontWeight: '600', fontSize: 15, textAlign: 'center' },
  setInputDone: { color: '#00f5c4', borderColor: 'rgba(0,245,196,0.2)', backgroundColor: 'rgba(0,245,196,0.05)' },
  doneBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#1e2535', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#1e2535' },
  doneBtnActive: { backgroundColor: '#00f5c4', borderColor: '#00f5c4' },
  setActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  addSetBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: 'rgba(0,245,196,0.06)', borderWidth: 1, borderColor: 'rgba(0,245,196,0.2)' },
  addSetText: { color: '#00f5c4', fontSize: 13, fontWeight: '600' },
  removeSetBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: 'rgba(255,107,107,0.06)', borderWidth: 1, borderColor: 'rgba(255,107,107,0.2)' },
  removeSetText: { color: '#ff6b6b', fontSize: 13, fontWeight: '600' },
  bigFinishBtn: { backgroundColor: 'rgba(0,245,196,0.1)', borderRadius: 18, padding: 20, alignItems: 'center', marginTop: 8, borderWidth: 1.5, borderColor: 'rgba(0,245,196,0.3)' },
  bigFinishText: { color: '#00f5c4', fontSize: 18, fontWeight: '800' },
  bigFinishSub: { color: '#6b7a99', fontSize: 13, marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center' },
  restPickerCard: { width: 280, backgroundColor: '#131822', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#1e2535' },
  restPickerTitle: { color: '#ffffff', fontWeight: '700', fontSize: 16, marginBottom: 16 },
  restPickerInput: { backgroundColor: '#0e1219', borderRadius: 12, borderWidth: 1, borderColor: '#1e2535', color: '#ffffff', fontSize: 18, fontWeight: '700', textAlign: 'center', padding: 14, marginBottom: 14 },
  restPickerSave: { backgroundColor: '#00f5c4', borderRadius: 12, padding: 14, alignItems: 'center' },
  restPickerSaveText: { color: '#080b10', fontWeight: '800', fontSize: 15 },
  removeExBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(255,107,107,0.08)', borderWidth: 1, borderColor: 'rgba(255,107,107,0.2)', alignItems: 'center', justifyContent: 'center', marginLeft: 6 },
});
