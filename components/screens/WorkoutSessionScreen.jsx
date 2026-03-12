import { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Alert, Vibration, StatusBar, Animated as RNAnimated,
  TextInput, Modal, KeyboardAvoidingView, Platform, AppState,
  InteractionManager, FlatList, BackHandler, StyleSheet,
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
import { useWorkoutsContext } from '../../hooks/WorkoutsContext';
import Svg, { Circle } from 'react-native-svg';

// ── Cardio keyword detection ──────────────────────────────────────────────────
const CARDIO_KW = ['running','cycling','jump rope','rowing','swimming','elliptical','stair','walk','jog','sprint','treadmill','cardio','burpee','mountain climber','box jump','skipping','hiit','bike','run'];
function detectCardio(name = '', muscle = '') {
  const s = (name + ' ' + muscle).toLowerCase();
  return CARDIO_KW.some((k) => s.includes(k));
}

function pad(n) { return String(n).padStart(2, '0'); }
function formatTime(s) { return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`; }

const REST_OPTIONS = [
  { label: '30s',   value: 30  },
  { label: '1 min', value: 60  },
  { label: '90s',   value: 90  },
  { label: '2 min', value: 120 },
];

export const SESSION_KEY = 'active_workout_session';

// ── Exercise picker constants ─────────────────────────────────────────────────
const CUSTOM_MUSCLE_OPTIONS = [
  { label: 'Chest',      value: 'chest'      },
  { label: 'Back',       value: 'back'       },
  { label: 'Shoulders',  value: 'shoulders'  },
  { label: 'Biceps',     value: 'biceps'     },
  { label: 'Triceps',    value: 'triceps'    },
  { label: 'Abs / Core', value: 'abs'        },
  { label: 'Quads',      value: 'quads'      },
  { label: 'Hamstrings', value: 'hamstrings' },
  { label: 'Glutes',     value: 'glutes'     },
  { label: 'Calves',     value: 'calves'     },
  { label: 'Forearms',   value: 'forearms'   },
  { label: 'Traps',      value: 'traps'      },
  { label: 'Full Body',  value: 'full body'  },
  { label: 'Legs',       value: 'legs'       },
  { label: 'Cardio',     value: 'cardio'     },
];

const MUSCLE_FILTERS = [
  { label: 'All',       value: null        },
  { label: 'Chest',     value: 'chest'     },
  { label: 'Back',      value: 'back'      },
  { label: 'Shoulders', value: 'shoulders' },
  { label: 'Arms',      value: 'arms'      },
  { label: 'Abs',       value: 'abs'       },
  { label: 'Legs',      value: 'legs'      },
  { label: 'Cardio',    value: 'cardio'    },
];

function matchesMuscleFilter(ex, filter) {
  if (!filter) return true;
  const m = (ex.muscle || '').toLowerCase();
  if (filter === 'arms')   return m.includes('bicep') || m.includes('tricep') || m.includes('arm') || m.includes('forearm');
  if (filter === 'legs')   return m.includes('quad') || m.includes('hamstring') || m.includes('glute') || m.includes('calf') || m.includes('calve') || m.includes('leg');
  if (filter === 'abs')    return m.includes('abs') || m.includes('core');
  if (filter === 'cardio') return m.includes('cardio');
  return m.includes(filter);
}

// ── Exercise Picker (inline — same as LogWorkoutScreen) ──────────────────────
function ExercisePicker({ visible, workoutType, selectedNames, onSelect, onClose, C, F }) {
  const [search,       setSearch]       = useState('');
  const [muscleFilter, setMuscleFilter] = useState(null);
  const [showCustom,   setShowCustom]   = useState(false);
  const [customName,   setCustomName]   = useState('');
  const [muscleModal,  setMuscleModal]  = useState(false);
  const [pendingName,  setPendingName]  = useState('');

  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (muscleModal) { setMuscleModal(false); return true; }
      if (showCustom)  { setShowCustom(false);  return true; }
      onClose(); return true;
    });
    return () => sub.remove();
  }, [visible, onClose, muscleModal, showCustom]);

  const allExercises = Object.values(PRESET_EXERCISES || {})
    .flat()
    .filter((e, i, arr) => arr.findIndex((x) => x.name === e.name) === i);

  const pool = (workoutType === 'Custom' || !(PRESET_EXERCISES?.[workoutType]?.length))
    ? allExercises
    : PRESET_EXERCISES[workoutType];

  const filtered = pool.filter((e) => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = matchesMuscleFilter(e, muscleFilter);
    return matchSearch && matchFilter;
  });

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill}>
      <View style={[pk.root, { backgroundColor: C.bg }]}>
        <StatusBar barStyle="light-content" />

        {/* ── Header ── */}
        <View style={[pk.header, { borderColor: C.border }]}>
          <TouchableOpacity onPress={onClose} style={[pk.backBtn, { backgroundColor: C.surface, borderColor: C.border }]}>
            <Ionicons name="arrow-back" size={20} color={C.text} />
          </TouchableOpacity>
          <Text style={[pk.title, { color: C.text, fontFamily: F.display }]}>Add Exercise</Text>
          <TouchableOpacity onPress={onClose} style={[pk.doneBtn, { backgroundColor: C.accent }]}>
            <Text style={[pk.doneBtnText, { color: C.btnText, fontFamily: F.heading }]}>Done</Text>
          </TouchableOpacity>
        </View>

        {/* ── Add custom ── */}
        {showCustom ? (
          <View style={[pk.customBox, { backgroundColor: C.surface, borderColor: C.accent + '44' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TextInput
                style={[pk.customInput, { backgroundColor: C.card, borderColor: C.border, color: C.text, fontFamily: F.body, flex: 1 }]}
                placeholder="Exercise name..."
                placeholderTextColor={C.muted}
                value={customName}
                onChangeText={setCustomName}
                autoFocus
              />
              <TouchableOpacity
                style={[pk.customBtn, { backgroundColor: C.accent }, !customName.trim() && { opacity: 0.4 }]}
                disabled={!customName.trim()}
                onPress={() => { setPendingName(customName.trim()); setMuscleModal(true); }}
              >
                <Text style={[pk.customBtnText, { color: C.btnText, fontFamily: F.heading }]}>Next →</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setShowCustom(false); setCustomName(''); }} style={{ padding: 8 }}>
                <Ionicons name="close" size={18} color={C.textSub} />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={[pk.addCustomBtn, { backgroundColor: C.accent + '15', borderColor: C.accent + '44' }]}
            onPress={() => setShowCustom(true)}
          >
            <Ionicons name="add-circle-outline" size={18} color={C.accent} />
            <Text style={{ color: C.accent, fontWeight: '700', fontSize: 14, fontFamily: F.heading }}>
              Add Custom Exercise
            </Text>
          </TouchableOpacity>
        )}

        {/* ── Search ── */}
        <View style={[pk.searchWrap, { backgroundColor: C.surface, borderColor: C.border }]}>
          <Ionicons name="search-outline" size={16} color={C.textSub} style={{ marginRight: 8 }} />
          <TextInput
            style={[pk.searchInput, { color: C.text, fontFamily: F.body }]}
            placeholder="Search exercises..."
            placeholderTextColor={C.textSub}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={C.muted} />
            </TouchableOpacity>
          )}
        </View>

        {/* ── Muscle filter chips ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          style={{ flexShrink: 0 }}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingBottom: 10, paddingTop: 8 }}>
          {MUSCLE_FILTERS.map((f) => {
            const active = muscleFilter === f.value;
            return (
              <TouchableOpacity
                key={f.label}
                onPress={() => setMuscleFilter(active ? null : f.value)}
                style={{
                  paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
                  borderWidth: 1.5,
                  borderColor: active ? C.accent : C.border,
                  backgroundColor: active ? C.accent : C.surface,
                }}
              >
                <Text style={{ color: active ? C.btnText : C.textSub, fontWeight: '600', fontSize: 12, fontFamily: F.body }}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Exercise grid — 2 per row ── */}
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.name}
          numColumns={2}
          columnWrapperStyle={{ gap: 10, paddingHorizontal: 16, marginBottom: 10 }}
          contentContainerStyle={{ paddingBottom: 40, paddingTop: 4 }}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <Text style={[pk.emptyText, { color: C.textSub, fontFamily: F.body }]}>No exercises found</Text>
          }
          renderItem={({ item }) => {
            const isSelected = selectedNames.includes(item.name);
            return (
              <TouchableOpacity
                style={[pk.exCard, { backgroundColor: C.surface, borderColor: C.border },
                  isSelected && { borderColor: C.accent, backgroundColor: C.accent + '12' }]}
                onPress={() => onSelect(item)}
                activeOpacity={0.75}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ fontSize: 22 }}>{item.emoji}</Text>
                  <View style={[pk.checkCircle, { borderColor: isSelected ? C.accent : C.border },
                    isSelected && { backgroundColor: C.accent }]}>
                    {isSelected && <Ionicons name="checkmark" size={11} color={C.btnText} />}
                  </View>
                </View>
                <Text style={[pk.exName, { color: isSelected ? C.accent : C.text, fontFamily: F.heading }]}
                  numberOfLines={2}>{item.name}</Text>
                <Text style={[pk.exMuscle, { color: C.muted, fontFamily: F.body }]}
                  numberOfLines={1}>{item.muscle}</Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* ── Muscle picker modal ── */}
      <Modal visible={muscleModal} transparent animationType="slide" onRequestClose={() => setMuscleModal(false)}>
        <View style={{ flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: C.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40 }}>
            <View style={{ alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderColor: C.border }}>
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: C.border, marginBottom: 12 }} />
              <Text style={{ color: C.text, fontSize: 17, fontWeight: '700', fontFamily: F.heading }}>
                What does "{pendingName}" train?
              </Text>
              <Text style={{ color: C.textSub, fontSize: 13, marginTop: 4, fontFamily: F.body }}>
                Helps track muscle usage on your body map
              </Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 20 }}>
              {CUSTOM_MUSCLE_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => {
                    onSelect({ name: pendingName, emoji: '💪', muscle: opt.value });
                    setCustomName(''); setMuscleModal(false); setPendingName(''); setShowCustom(false);
                  }}
                  style={{ paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5,
                    borderColor: C.accent + '55', backgroundColor: C.surface }}
                >
                  <Text style={{ color: C.text, fontWeight: '600', fontSize: 14, fontFamily: F.body }}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const pk = StyleSheet.create({
  root:         { flex: 1, paddingTop: 56 },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, marginBottom: 8 },
  backBtn:      { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  title:        { fontSize: 18, fontWeight: '800' },
  doneBtn:      { borderRadius: 999, paddingHorizontal: 16, paddingVertical: 7 },
  doneBtnText:  { fontWeight: '800', fontSize: 13 },
  addCustomBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginBottom: 10, paddingVertical: 11, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1.5 },
  customBox:    { marginHorizontal: 16, marginBottom: 10, padding: 12, borderRadius: 14, borderWidth: 1.5 },
  customInput:  { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, height: 44, fontSize: 14 },
  customBtn:    { borderRadius: 12, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', height: 44 },
  customBtnText:{ fontWeight: '800', fontSize: 13 },
  searchWrap:   { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, height: 44, marginBottom: 10, marginHorizontal: 16 },
  searchInput:  { flex: 1, fontSize: 14 },
  exCard:       { flex: 1, borderRadius: 16, padding: 14, borderWidth: 1.5, minHeight: 100 },
  exName:       { fontWeight: '700', fontSize: 13, lineHeight: 18 },
  exMuscle:     { fontSize: 11, marginTop: 3 },
  checkCircle:  { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  emptyText:    { textAlign: 'center', paddingVertical: 40, fontSize: 14 },
});



// ── Cardio set timer — wall-clock based, survives app close ──────────────────
// Each cardio set holds: { minutes, seconds, done, timerWallStart (ms)|null, timerRunning }
// wallStart is persisted into the session snapshot so AppState restore can recompute elapsed.

function CardioSetTimer({ set, setIdx, exIdx, prevSet, C, F, updateSet, toggleDone, startRestFor }) {
  // Derive live elapsed from wallStart every second
  const [liveSec, setLiveSec] = useState(() => {
    if (set.timerRunning && set.timerWallStart) {
      return Math.floor((Date.now() - set.timerWallStart) / 1000);
    }
    return (parseInt(set.minutes || 0) * 60) + parseInt(set.seconds || 0);
  });
  const intervalRef = useRef(null);
  const [manualMode, setManualMode] = useState(false);

  // Sync liveSec when set changes (e.g. after AppState resume)
  useEffect(() => {
    if (set.timerRunning && set.timerWallStart) {
      setLiveSec(Math.floor((Date.now() - set.timerWallStart) / 1000));
    }
  }, [set.timerWallStart, set.timerRunning]);

  // Keep ticking while running
  useEffect(() => {
    if (set.timerRunning && set.timerWallStart) {
      intervalRef.current = setInterval(() => {
        setLiveSec(Math.floor((Date.now() - set.timerWallStart) / 1000));
      }, 500);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [set.timerRunning, set.timerWallStart]);

  const displaySec = set.timerRunning ? liveSec : (parseInt(set.minutes || 0) * 60 + parseInt(set.seconds || 0));
  const mm = Math.floor(displaySec / 60);
  const ss = displaySec % 60;

  const handleStart = () => {
    const wallStart = Date.now();
    updateSet(exIdx, setIdx, '__cardioStart', wallStart); // custom field merged in updateSet
    setManualMode(false);
  };

  const handleStop = () => {
    const elapsed = set.timerWallStart ? Math.floor((Date.now() - set.timerWallStart) / 1000) : liveSec;
    const m = Math.floor(elapsed / 60);
    const s = elapsed % 60;
    updateSet(exIdx, setIdx, '__cardioStop', { minutes: String(m), seconds: String(s) });
    setLiveSec(elapsed);
  };

  const handleDone = () => {
    // If still running, stop first then mark done
    if (set.timerRunning) {
      const elapsed = set.timerWallStart ? Math.floor((Date.now() - set.timerWallStart) / 1000) : liveSec;
      const m = Math.floor(elapsed / 60);
      const s = elapsed % 60;
      updateSet(exIdx, setIdx, '__cardioDone', { minutes: String(m), seconds: String(s) });
    } else {
      toggleDone(exIdx, setIdx);
      return; // toggleDone already calls startRestFor
    }
    // Manually fire rest timer since we bypassed toggleDone
    startRestFor(exIdx, setIdx);
  };

  const isRunning = !!set.timerRunning;
  const hasDuration = displaySec > 0;

  return (
    <View style={{ marginBottom: 8 }}>
      {/* Main timer row */}
      <View style={[
        { borderRadius: 14, padding: 12, borderWidth: 1, borderColor: C.border, backgroundColor: C.bg },
        set.done      && { borderColor: C.accent + '55', backgroundColor: C.accent + '08' },
        isRunning     && { borderColor: '#ff9f43' + '80', backgroundColor: '#ff9f4308' },
      ]}>
        {/* Top: set number + timer display */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <View style={[
            { width: 28, height: 28, borderRadius: 14, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
            set.done && { backgroundColor: C.accent },
            isRunning && { backgroundColor: '#ff9f43' },
          ]}>
            {set.done
              ? <Ionicons name="checkmark" size={13} color={C.btnText} />
              : isRunning
                ? <Ionicons name="timer-outline" size={13} color="#fff" />
                : <Text style={{ color: C.textSub, fontWeight: '700', fontSize: 12, fontFamily: F.heading }}>{setIdx + 1}</Text>
            }
          </View>

          {/* Big time display */}
          {manualMode ? (
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <TextInput
                style={{ flex: 1, height: 42, backgroundColor: C.surface, borderRadius: 10, borderWidth: 1, borderColor: C.border, color: C.text, fontWeight: '700', fontSize: 18, textAlign: 'center', fontFamily: F.heading }}
                placeholder="0" placeholderTextColor={C.muted}
                keyboardType="numeric"
                value={set.minutes}
                onChangeText={v => updateSet(exIdx, setIdx, 'minutes', v.replace(/[^0-9]/g, ''))}
              />
              <Text style={{ color: C.muted, fontWeight: '800', fontSize: 20 }}>:</Text>
              <TextInput
                style={{ flex: 1, height: 42, backgroundColor: C.surface, borderRadius: 10, borderWidth: 1, borderColor: C.border, color: C.text, fontWeight: '700', fontSize: 18, textAlign: 'center', fontFamily: F.heading }}
                placeholder="00" placeholderTextColor={C.muted}
                keyboardType="numeric" maxLength={2}
                value={set.seconds}
                onChangeText={v => updateSet(exIdx, setIdx, 'seconds', v.replace(/[^0-9]/g, ''))}
              />
            </View>
          ) : (
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={[
                { fontSize: 34, letterSpacing: 2, fontFamily: F.display },
                { color: set.done ? C.accent : isRunning ? '#ff9f43' : hasDuration ? C.text : C.muted },
              ]}>
                {String(mm).padStart(2,'0')}:{String(ss).padStart(2,'0')}
              </Text>
              {isRunning && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#ff9f43' }} />
                  <Text style={{ color: '#ff9f43', fontSize: 10, fontFamily: F.body }}>LIVE</Text>
                </View>
              )}
              {/* Previous session time shown below current — only when not running */}
              {!isRunning && !set.done && prevSet && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
                  <Ionicons name="time-outline" size={10} color={C.muted} />
                  <Text style={{ color: C.muted, fontSize: 11, fontFamily: F.body }}>
                    prev {String(parseInt(prevSet.minutes || 0)).padStart(2,'0')}:{String(parseInt(prevSet.seconds || 0)).padStart(2,'0')}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Pencil / keyboard toggle */}
          <TouchableOpacity
            onPress={() => { if (isRunning) return; setManualMode(m => !m); }}
            hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
            style={{ opacity: isRunning ? 0.3 : 1 }}
          >
            <Ionicons name={manualMode ? 'timer-outline' : 'pencil'} size={15} color={C.muted} />
          </TouchableOpacity>
        </View>

        {/* Buttons row */}
        {!set.done && (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {!isRunning ? (
              <TouchableOpacity
                onPress={handleStart}
                style={{ flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 38, borderRadius: 10, backgroundColor: '#ff9f4322', borderWidth: 1, borderColor: '#ff9f4355' }}
                activeOpacity={0.8}
              >
                <Ionicons name="play" size={14} color="#ff9f43" />
                <Text style={{ color: '#ff9f43', fontWeight: '700', fontSize: 13, fontFamily: F.heading }}>Start</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleStop}
                style={{ flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 38, borderRadius: 10, backgroundColor: '#ff6b6b20', borderWidth: 1, borderColor: '#ff6b6b55' }}
                activeOpacity={0.8}
              >
                <Ionicons name="stop" size={14} color="#ff6b6b" />
                <Text style={{ color: '#ff6b6b', fontWeight: '700', fontSize: 13, fontFamily: F.heading }}>Stop</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={handleDone}
              disabled={!hasDuration && !isRunning}
              style={[
                { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, height: 38, borderRadius: 10, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
                (!hasDuration && !isRunning) && { opacity: 0.35 },
              ]}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-done" size={14} color={C.accent} />
              <Text style={{ color: C.accent, fontWeight: '700', fontSize: 13, fontFamily: F.heading }}>Done</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Done state — tap to undo */}
        {set.done && (
          <TouchableOpacity
            onPress={() => toggleDone(exIdx, setIdx)}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 6 }}
          >
            <Ionicons name="checkmark-circle" size={16} color={C.accent} />
            <Text style={{ color: C.accent, fontSize: 12, fontFamily: F.body }}>Done · tap to undo</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ── Animated set row — pops in when added (strength) ─────────────────────────
function SetRow({ set, setIdx, exIdx, isThisResting, isCardio, prevSet, C, F, updateSet, toggleDone, startRestFor }) {
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

  // Previous set reference row
  const PrevHint = prevSet ? (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3, paddingHorizontal: 2, opacity: 0.85 }}>
      <View style={{ width: 28, alignItems: 'center' }}>
        <Ionicons name="time-outline" size={11} color={C.textSub} />
      </View>
      {isCardio ? (
        <View style={{ flex: 2, flexDirection: 'row', justifyContent: 'center', gap: 4 }}>
          <Text style={{ color: C.textSub, fontSize: 12, fontWeight: '600', fontFamily: F.body }}>
            {prevSet.minutes || '0'}m {prevSet.seconds || '00'}s
          </Text>
        </View>
      ) : (
        <>
          <Text style={{ flex: 1, textAlign: 'center', color: C.textSub, fontSize: 12, fontWeight: '600', fontFamily: F.body }}>
            {prevSet.weight ? `${prevSet.weight} kg` : '—'}
          </Text>
          <Text style={{ flex: 1, textAlign: 'center', color: C.textSub, fontSize: 12, fontWeight: '600', fontFamily: F.body }}>
            {prevSet.reps ? `${prevSet.reps} reps` : '—'}
          </Text>
        </>
      )}
      <View style={{ width: 44, alignItems: 'center' }}>
        <Ionicons name="checkmark-done" size={13} color={C.textSub} />
      </View>
    </View>
  ) : null;

  if (isCardio) {
    return (
      <Animated.View style={animStyle}>
        <CardioSetTimer
          set={set} setIdx={setIdx} exIdx={exIdx}
          prevSet={prevSet}
          C={C} F={F} updateSet={updateSet} toggleDone={toggleDone} startRestFor={startRestFor}
        />
      </Animated.View>
    );
  }

  return (
    <Animated.View style={animStyle}>
      {PrevHint}
      <View style={[
        { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.bg, borderRadius: 12, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: C.border },
        set.done      && { borderColor: C.accent + '44', backgroundColor: C.accent + '08' },
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

// ── Score / Congrats Modal ─────────────────────────────────────────────────────
function ScoreModal({ data, C, F, onContinue }) {
  const [showReport, setShowReport] = useState(false);
  if (!data) return null;
  const { score, exReport, isFirstTime, elapsed } = data;

  // tier
  let emoji, headline, sub, scoreColor;
  if (isFirstTime)    { emoji='🎉'; headline='First session logged!'; sub='Your baseline is set. Beat it next time.'; scoreColor='#7b61ff'; }
  else if (score===0) { emoji='👀'; headline='Nothing logged.';       sub='Mark sets as done next time to get a score.'; scoreColor='#aaaaaa'; }
  else if (score>=85) { emoji='🔥'; headline='Incredible session!';    sub='You dominated every lift today.';           scoreColor='#ff6b6b'; }
  else if (score>=70) { emoji='💪'; headline='Solid progress!';        sub='Most exercises improved. Keep building.';   scoreColor='#ff9f43'; }
  else if (score>=55) { emoji='📈'; headline='Steady gains!';          sub='More wins than losses — you\'re trending up.'; scoreColor='#00e096'; }
  else if (score>=40) { emoji='🎯'; headline='Maintained!';            sub='Consistent performance. Push a bit more next time.'; scoreColor='#54a0ff'; }
  else                { emoji='😤'; headline='Recovery day.';          sub='Happens to everyone. Come back stronger.';  scoreColor='#aaaaaa'; }

  const progressCount  = exReport.filter((r) => r.status === 'progress').length;
  const maintainCount  = exReport.filter((r) => r.status === 'maintained').length;
  const declineCount   = exReport.filter((r) => r.status === 'declined').length;
  const newCount       = exReport.filter((r) => r.status === 'new').length;

  // circular arc for score
  const RADIUS = 54, CIRC = 2 * Math.PI * RADIUS;
  const dash   = (score / 100) * CIRC;

  const statusMeta = {
    progress:   { icon: 'trending-up',   color: '#00e096', label: 'Overload ✓' },
    maintained: { icon: 'remove',        color: '#54a0ff', label: 'Maintained'  },
    declined:   { icon: 'trending-down', color: '#ff6b6b', label: 'Declined'    },
    new:        { icon: 'add-circle',    color: '#7b61ff', label: 'New'         },
  };

  return (
    <Modal visible transparent animationType="fade">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.88)', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <Animated.View entering={FadeInDown.springify().damping(14)} style={{
          width: '100%', maxWidth: 370,
          backgroundColor: C.card, borderRadius: 28,
          borderWidth: 1.5, borderColor: scoreColor + '44',
          overflow: 'hidden',
        }}>

          {/* ── Main score view ── */}
          {!showReport ? (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 26, alignItems: 'center' }}>
              {/* emoji */}
              <Text style={{ fontSize: 48, marginBottom: 6 }}>{emoji}</Text>
              <Text style={{ color: C.text, fontSize: 22, fontWeight: '900', fontFamily: F.display, textAlign: 'center', marginBottom: 4 }}>{headline}</Text>
              <Text style={{ color: C.textSub, fontSize: 13, fontFamily: F.body, textAlign: 'center', marginBottom: 22, lineHeight: 19 }}>{sub}</Text>

              {/* circular score */}
              <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                <Svg width={136} height={136} style={{ position: 'absolute' }}>
                  <Circle cx="68" cy="68" r={RADIUS} fill="none" stroke={C.surface} strokeWidth="10" />
                  <Circle cx="68" cy="68" r={RADIUS} fill="none" stroke={scoreColor} strokeWidth="10"
                    strokeDasharray={`${dash} ${CIRC}`} strokeLinecap="round"
                    rotation="-90" originX="68" originY="68" />
                </Svg>
                <View style={{ width: 136, height: 136, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: scoreColor, fontSize: 42, fontWeight: '900', fontFamily: F.display, lineHeight: 48 }}>{score}</Text>
                  <Text style={{ color: C.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1, fontFamily: F.heading }}>/ 100</Text>
                </View>
              </View>

              {/* quick stats */}
              <View style={{ flexDirection: 'row', gap: 8, width: '100%', marginBottom: 18 }}>
                {[
                  { icon: 'time-outline',       color: '#54a0ff', val: `${Math.floor(elapsed/60)}m`,  label: 'Duration' },
                  { icon: 'trending-up-outline', color: '#00e096', val: progressCount,                  label: 'PRs'      },
                  { icon: 'barbell-outline',     color: '#ff9f43', val: exReport.length,               label: 'Exercises'},
                ].map((s) => (
                  <View key={s.label} style={{ flex: 1, backgroundColor: C.bg, borderRadius: 14, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: C.border }}>
                    <Ionicons name={s.icon} size={18} color={s.color} style={{ marginBottom: 4 }} />
                    <Text style={{ color: C.text, fontSize: 18, fontWeight: '800', fontFamily: F.display }}>{s.val}</Text>
                    <Text style={{ color: C.muted, fontSize: 10, fontWeight: '600', fontFamily: F.body }}>{s.label}</Text>
                  </View>
                ))}
              </View>

              {/* overload summary chips */}
              {!isFirstTime && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 22 }}>
                  {progressCount  > 0 && <View style={{ flexDirection:'row', alignItems:'center', gap:4, backgroundColor:'#00e09618', borderRadius:20, paddingHorizontal:12, paddingVertical:6, borderWidth:1, borderColor:'#00e09633' }}><Ionicons name="trending-up" size={13} color="#00e096"/><Text style={{ color:'#00e096', fontSize:12, fontWeight:'700', fontFamily:F.heading }}>{progressCount} PR{progressCount>1?'s':''}</Text></View>}
                  {maintainCount  > 0 && <View style={{ flexDirection:'row', alignItems:'center', gap:4, backgroundColor:'#54a0ff18', borderRadius:20, paddingHorizontal:12, paddingVertical:6, borderWidth:1, borderColor:'#54a0ff33' }}><Ionicons name="remove"      size={13} color="#54a0ff"/><Text style={{ color:'#54a0ff', fontSize:12, fontWeight:'700', fontFamily:F.heading }}>{maintainCount} held</Text></View>}
                  {declineCount   > 0 && <View style={{ flexDirection:'row', alignItems:'center', gap:4, backgroundColor:'#ff6b6b18', borderRadius:20, paddingHorizontal:12, paddingVertical:6, borderWidth:1, borderColor:'#ff6b6b33' }}><Ionicons name="trending-down" size={13} color="#ff6b6b"/><Text style={{ color:'#ff6b6b', fontSize:12, fontWeight:'700', fontFamily:F.heading }}>{declineCount} down</Text></View>}
                  {newCount       > 0 && <View style={{ flexDirection:'row', alignItems:'center', gap:4, backgroundColor:'#7b61ff18', borderRadius:20, paddingHorizontal:12, paddingVertical:6, borderWidth:1, borderColor:'#7b61ff33' }}><Ionicons name="add-circle"  size={13} color="#7b61ff"/><Text style={{ color:'#7b61ff', fontSize:12, fontWeight:'700', fontFamily:F.heading }}>{newCount} new</Text></View>}
                </View>
              )}

              {/* buttons */}
              <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
                {!isFirstTime && (
                  <TouchableOpacity
                    style={{ flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: 'center', backgroundColor: C.surface, borderWidth: 1, borderColor: C.border }}
                    onPress={() => setShowReport(true)}
                  >
                    <Text style={{ color: C.text, fontSize: 14, fontWeight: '700', fontFamily: F.heading }}>📊 Report</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={{ flex: 2, borderRadius: 14, paddingVertical: 14, alignItems: 'center', backgroundColor: scoreColor }}
                  onPress={onContinue}
                >
                  <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800', fontFamily: F.heading }}>Continue →</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

          ) : (
            // ── Report view ──
            <View style={{ maxHeight: 560 }}>
              {/* report header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', padding: 20, paddingBottom: 12, borderBottomWidth: 1, borderColor: C.border }}>
                <TouchableOpacity onPress={() => setShowReport(false)} style={{ marginRight: 12 }}>
                  <Ionicons name="arrow-back" size={22} color={C.text} />
                </TouchableOpacity>
                <Text style={{ color: C.text, fontSize: 17, fontWeight: '800', fontFamily: F.display, flex: 1 }}>Progressive Overload Report</Text>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
                <Text style={{ color: C.textSub, fontSize: 12, fontFamily: F.body, marginBottom: 14, lineHeight: 18 }}>
                  Based on estimated 1-rep max (e1RM). Higher weight with fewer reps still counts as progress.
                </Text>

                {exReport.map((ex, i) => {
                  const meta = statusMeta[ex.status];
                  const pctChange = ex.prevE1RM > 0
                    ? Math.round(((ex.currE1RM - ex.prevE1RM) / ex.prevE1RM) * 100)
                    : null;
                  return (
                    <View key={i} style={{
                      flexDirection: 'row', alignItems: 'center', gap: 12,
                      backgroundColor: C.bg, borderRadius: 14, padding: 14,
                      marginBottom: 8, borderWidth: 1,
                      borderColor: meta.color + '44',
                      borderLeftWidth: 3, borderLeftColor: meta.color,
                    }}>
                      <Text style={{ fontSize: 22 }}>{ex.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: C.text, fontSize: 14, fontWeight: '700', fontFamily: F.heading }} numberOfLines={1}>{ex.name}</Text>
                        {ex.status === 'new' ? (
                          <Text style={{ color: C.muted, fontSize: 12, fontFamily: F.body }}>First time logged</Text>
                        ) : ex.isCardio ? (
                          <Text style={{ color: C.textSub, fontSize: 12, fontFamily: F.body }}>
                            {Math.floor(ex.currE1RM / 60)}m {ex.currE1RM % 60}s
                            {ex.prevE1RM != null && ` vs ${Math.floor(ex.prevE1RM / 60)}m ${ex.prevE1RM % 60}s`}
                          </Text>
                        ) : (
                          <Text style={{ color: C.textSub, fontSize: 12, fontFamily: F.body }}>
                            {ex.muscle || ''}
                          </Text>
                        )}
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 2 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: meta.color + '20', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                          <Ionicons name={meta.icon} size={12} color={meta.color} />
                          <Text style={{ color: meta.color, fontSize: 11, fontWeight: '700', fontFamily: F.heading }}>{meta.label}</Text>
                        </View>
                        {pctChange != null && (
                          <Text style={{ color: meta.color, fontSize: 11, fontWeight: '700', fontFamily: F.heading }}>
                            {pctChange >= 0 ? '+' : ''}{pctChange}%
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </ScrollView>

              <View style={{ padding: 16, paddingTop: 8, borderTopWidth: 1, borderColor: C.border }}>
                <TouchableOpacity
                  style={{ borderRadius: 14, paddingVertical: 14, alignItems: 'center', backgroundColor: scoreColor }}
                  onPress={onContinue}
                >
                  <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800', fontFamily: F.heading }}>Continue →</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

// ── Exercise card ──────────────────────────────────────────────────────────────
function ExCard({ ex, exIdx, sets, activeRest, restLeft, C, F, updateSet, toggleDone, addSet, removeSet, removeExercise, prevSets, startRestFor }) {
  const allDone   = (sets[exIdx] || []).every((s) => s.done);
  const isResting = activeRest?.exIdx === exIdx;
  const isCardio  = !!ex.isCardio;

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
        {isCardio ? (
          <>
            <Text style={{ color: C.muted, fontSize: 10, fontWeight: '700', letterSpacing: 0.8, flex: 1, textAlign: 'center', fontFamily: F.heading }}>DURATION</Text>
          </>
        ) : (
          <>
            <Text style={{ color: C.muted, fontSize: 10, fontWeight: '700', letterSpacing: 0.8, flex: 1, textAlign: 'center', fontFamily: F.heading }}>WEIGHT (kg)</Text>
            <Text style={{ color: C.muted, fontSize: 10, fontWeight: '700', letterSpacing: 0.8, flex: 1, textAlign: 'center', fontFamily: F.heading }}>REPS</Text>
          </>
        )}
        <View style={{ width: 44, alignItems: 'center' }}>
          {prevSets?.length ? (
            <Text style={{ color: C.textSub, fontSize: 9, fontWeight: '700', letterSpacing: 0.6, fontFamily: F.heading }}>PREV</Text>
          ) : <View />}
        </View>
      </View>

      {sets[exIdx].map((set, setIdx) => {
        const isThisResting = activeRest?.exIdx === exIdx && activeRest?.setIdx === setIdx;
        return (
          <SetRow
            key={setIdx}
            set={set} setIdx={setIdx} exIdx={exIdx}
            isThisResting={isThisResting}
            isCardio={isCardio}
            prevSet={prevSets?.[setIdx] || null}
            C={C} F={F}
            updateSet={updateSet}
            toggleDone={toggleDone}
            startRestFor={startRestFor}
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
  const { workout, date, restoredExercises, restoredSets, wallStart: restoredWallStart, prevSetsMap: paramPrevSetsMap } = route.params;
  const { user, userData } = useAuth();
  const userWeightKg = userData?.calorieProfile?.weight || 70;
  const { scheme: C, font: F } = useTheme();
  const ff = { heading: { fontFamily: F.heading }, body: { fontFamily: F.body }, display: { fontFamily: F.display } };

  // ─── PREVIOUS SETS MAP ───────────────────────────────────────────────────────
  // Passed directly from LogWorkoutScreen at navigate time — always fresh, no async.
  const { workouts, refresh, addWorkoutLocally } = useWorkoutsContext();
  const [prevSetsMap, setPrevSetsMap] = useState(paramPrevSetsMap || {});

  // If context updates (e.g. back-to-back sessions), rebuild from workouts
  useEffect(() => {
    if (!workouts?.length) return;
    const sorted = [...workouts].sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0) || (b.date || '').localeCompare(a.date || ''));
    const map = {};
    for (const w of sorted) {
      for (const ex of w.exercises || []) {
        if (map[ex.name] || !ex.sets) continue;
        const repsArr   = typeof ex.reps   === 'string' ? ex.reps.split('/') : [];
        const weightArr = typeof ex.weight === 'string' ? ex.weight.split('/') : [];
        const count     = parseInt(ex.sets) || repsArr.length || 1;
        const isCardioEx = ex.isCardio || detectCardio(ex.name, ex.muscle || '');
        map[ex.name] = Array.from({ length: count }, (_, i) => {
          if (isCardioEx) {
            const raw = repsArr[i] || repsArr[0] || '0:00';
            const [m, s] = raw.split(':');
            return { minutes: m || '0', seconds: s || '00', isCardio: true };
          }
          return { weight: weightArr[i] || weightArr[0] || '', reps: repsArr[i] || repsArr[0] || '' };
        });
      }
    }
    setPrevSetsMap(map);
  }, [workouts]);

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

  // Re-sync cardio set timers when app resumes from background.
  // Any set with timerRunning=true has its wallStart preserved in state/AsyncStorage,
  // so we just need to trigger a re-render — CardioSetTimer reads Date.now() on its own.
  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') {
        // Force a sets re-render so CardioSetTimer components recalculate liveSec
        setSets(prev => prev.map(exSets =>
          exSets.map(s => s.timerRunning ? { ...s } : s)
        ));
      }
    });
    return () => sub.remove();
  }, []);

  // ─── REST TIMER — wall-clock based (survives app minimize) ─────────────────
  // restWallStart: the Date.now() when rest began — recomputing from this means
  // the countdown is always correct even if the JS interval was paused by the OS.
  const [restDuration, setRestDuration]     = useState(60);
  const [showRestPicker, setShowRestPicker] = useState(false);
  const [customRest, setCustomRest]         = useState('');
  const [activeRest, setActiveRest]         = useState(null);   // { exIdx, setIdx }
  const [restLeft, setRestLeft]             = useState(0);
  const restWallStartRef = useRef(null);   // Date.now() when rest began
  const restIntervalRef  = useRef(null);
  const restAnim         = useRef(new RNAnimated.Value(1)).current;

  const computeRestLeft = (duration) => {
    if (!restWallStartRef.current) return duration;
    const elapsed = Math.floor((Date.now() - restWallStartRef.current) / 1000);
    return Math.max(0, duration - elapsed);
  };

  const startRestFor = (exIdx, setIdx) => {
    if (restIntervalRef.current) clearInterval(restIntervalRef.current);
    restAnim.stopAnimation(); restAnim.setValue(1);
    restWallStartRef.current = Date.now();
    setActiveRest({ exIdx, setIdx }); setRestLeft(restDuration);
    // Defer vibration so it doesn't block the tap response
    setTimeout(() => Vibration.vibrate(200), 0);
    RNAnimated.timing(restAnim, { toValue: 0, duration: restDuration * 1000, useNativeDriver: false }).start();
    // 1s interval instead of 500ms — half the re-renders
    restIntervalRef.current = setInterval(() => {
      const left = computeRestLeft(restDuration);
      setRestLeft(left);
      if (left <= 0) {
        clearInterval(restIntervalRef.current);
        restWallStartRef.current = null;
        setActiveRest(null); restAnim.setValue(1);
        setTimeout(() => Vibration.vibrate([0, 200, 100, 200]), 0);
      }
    }, 1000);
  };

  const skipRest = () => {
    if (restIntervalRef.current) clearInterval(restIntervalRef.current);
    restAnim.stopAnimation(); restAnim.setValue(1);
    restWallStartRef.current = null;
    setActiveRest(null); setRestLeft(restDuration);
  };

  // Re-sync rest countdown when app comes to foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active' && activeRest && restWallStartRef.current) {
        const left = computeRestLeft(restDuration);
        setRestLeft(left);
        if (left <= 0) {
          skipRest();
          Vibration.vibrate([0, 200, 100, 200]);
        }
      }
    });
    return () => sub.remove();
  }, [activeRest, restDuration]);

  useEffect(() => () => { if (restIntervalRef.current) clearInterval(restIntervalRef.current); }, []);

  // ─── EXERCISES & SETS ────────────────────────────────────────────────────────
  const [exercises, setExercises] = useState(() =>
    restoredExercises?.length
      ? restoredExercises
      : workout.exercises.map((ex) => ({
          ...ex,
          isCardio: ex.isCardio ?? detectCardio(ex.name, ex.muscle),
        }))
  );
  const [sets, setSets] = useState(() => {
    if (restoredSets?.length) return restoredSets;
    return workout.exercises.map((ex) => {
      const isCardio = ex.isCardio ?? detectCardio(ex.name, ex.muscle);
      if (isCardio) {
        const count = ex.sets?.length || 1;
        return Array.from({ length: count }, () => ({
          minutes: '', seconds: '', done: false,
          timerWallStart: null, timerRunning: false,
        }));
      }
      if (ex.sets?.length) {
        return ex.sets.map((s) => ({ weight: s.weight || '', reps: s.reps || '', done: false }));
      }
      return [{ weight: '', reps: '', done: false }];
    });
  });

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

  const updateSet = (exIdx, setIdx, field, val) => {
    setSets((prev) => prev.map((exSets, i) => {
      if (i !== exIdx) return exSets;
      return exSets.map((s, j) => {
        if (j !== setIdx) return s;
        // Special cardio timer actions
        if (field === '__cardioStart') {
          return { ...s, timerWallStart: val, timerRunning: true, minutes: '', seconds: '' };
        }
        if (field === '__cardioStop') {
          return { ...s, timerWallStart: null, timerRunning: false, minutes: val.minutes, seconds: val.seconds };
        }
        if (field === '__cardioDone') {
          return { ...s, timerWallStart: null, timerRunning: false, minutes: val.minutes, seconds: val.seconds, done: true };
        }
        return { ...s, [field]: val };
      });
    }));
  };

  const toggleDone = (exIdx, setIdx) => {
    const wasDone = sets[exIdx][setIdx].done;
    // Update done state immediately for instant visual feedback
    setSets((prev) => prev.map((exSets, i) =>
      i !== exIdx ? exSets : exSets.map((s, j) => {
        if (j !== setIdx) return s;
        return { ...s, done: !s.done, timerRunning: false, timerWallStart: null };
      })
    ));
    // Defer rest timer + vibration until after the UI has painted the checkmark
    InteractionManager.runAfterInteractions(() => {
      if (!wasDone) startRestFor(exIdx, setIdx);
      else if (activeRest?.exIdx === exIdx && activeRest?.setIdx === setIdx) skipRest();
    });
  };

  const addSet = (exIdx) => {
    const isCardio = exercises[exIdx]?.isCardio;
    setSets((prev) => prev.map((exSets, i) => {
      if (i !== exIdx) return exSets;
      const last = exSets.at(-1);
      return isCardio
        ? [...exSets, { minutes: '', seconds: '', done: false, timerWallStart: null, timerRunning: false }]
        : [...exSets, { weight: last?.weight || '', reps: last?.reps || '', done: false }];
    }));
  };

  const removeSet = (exIdx) => {
    if (sets[exIdx].length === 1) return;
    setSets((prev) => prev.map((exSets, i) =>
      i !== exIdx ? exSets : exSets.slice(0, -1)
    ));
  };

  // ─── PERSISTENCE ─────────────────────────────────────────────────────────────
  const persistTimerRef = useRef(null);
  const persistNow = () => {
    if (!user?.uid) return;
    // Debounce: wait 1.5s after last change before writing — prevents lag on every tap
    if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    persistTimerRef.current = setTimeout(() => {
      AsyncStorage.setItem(SESSION_KEY, JSON.stringify({
        workout, date,
        exercises: exercisesRef.current,
        sets:      setsRef.current,
        wallStart: wallStartRef.current,
        savedAt:   Date.now(),
        userId:    user.uid,
      })).catch(() => {});
    }, 1500);
  };

  useEffect(() => { persistNow(); }, [sets, exercises]);

  // ─── PROGRESS & CALORIES ─────────────────────────────────────────────────────
  const totalSets    = sets.reduce((a, ex) => a + ex.length, 0);
  const doneSets     = sets.reduce((a, ex) => a + ex.filter((s) => s.done).length, 0);
  const progress     = totalSets > 0 ? doneSets / totalSets : 0;
  const liveCalories = calcTotalCalories({
    exercises: exercises.map((ex, i) => ({
      name: ex.name,
      isCardio: ex.isCardio,
      // Cardio sets: pass minutes/seconds so calcCardioExerciseCalories can use real durations
      // Strength sets: pass reps/weight for MET × rep-time calc
      sets: (sets[i] || []).filter((s) => s.done).map((s) =>
        ex.isCardio
          ? { minutes: s.minutes || '0', seconds: s.seconds || '0' }
          : { reps: s.reps, weight: s.weight }
      ),
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
  const [scoreData, setScoreData] = useState(null);

  // ── e1RM: Epley formula — best single-set estimate of 1-rep max ──────────────
  // heavier weight × fewer reps still produces a higher e1RM than lighter × more
  const e1RM = (weight, reps) => {
    const w = parseFloat(weight) || 0;
    const r = parseFloat(reps)   || 0;
    if (w <= 0 || r <= 0) return 0;
    if (r === 1) return w;
    return w * (1 + r / 30);
  };

  // best e1RM across all sets of an exercise entry (from saved payload format)
  const bestE1RM = (ex) => {
    if (ex.isCardio) return ex.durationSeconds || 0;
    const repsArr   = typeof ex.reps   === 'string' ? ex.reps.split('/')   : [];
    const weightArr = typeof ex.weight === 'string' ? ex.weight.split('/') : [];
    const count = parseInt(ex.sets) || repsArr.length || 1;
    let best = 0;
    for (let i = 0; i < count; i++) {
      const v = e1RM(weightArr[i] || weightArr[0], repsArr[i] || repsArr[0]);
      if (v > best) best = v;
    }
    return best;
  };

  // total volume (for overall workout score baseline)
  const totalVolume = (flat) => flat.reduce((sum, ex) => {
    if (ex.isCardio) return sum + (ex.durationSeconds || 0);
    const repsArr   = typeof ex.reps   === 'string' ? ex.reps.split('/')   : [];
    const weightArr = typeof ex.weight === 'string' ? ex.weight.split('/') : [];
    const count = parseInt(ex.sets) || repsArr.length || 1;
    for (let i = 0; i < count; i++) {
      sum += (parseFloat(weightArr[i] || weightArr[0]) || 1) * (parseFloat(repsArr[i] || repsArr[0]) || 0);
    }
    return sum;
  }, 0);

  // per-exercise overload report: compare current vs prev e1RM
  // Score is based ONLY on exercises done this session — added/removed exercises don't distort it
  const buildExReport = (flat) => {
    const sorted = workouts?.length
      ? [...workouts].sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      : [];

    // For each exercise, find its most recent previous entry across ALL workouts (any type)
    const prevMap = {};
    for (const w of sorted) {
      for (const ex of (w.exercises || [])) {
        if (!prevMap[ex.name]) prevMap[ex.name] = ex;  // first hit = most recent
      }
    }

    return flat.map((ex) => {
      const prev    = prevMap[ex.name];
      const curr    = bestE1RM(ex);
      const prevVal = prev ? bestE1RM(prev) : null;

      let status;
      if (!prev || prevVal === 0) {
        status = 'new';
      } else if (curr > prevVal * 1.02) {
        status = 'progress';
      } else if (curr >= prevVal * 0.97) {
        status = 'maintained';
      } else {
        status = 'declined';
      }

      return {
        name: ex.name, emoji: ex.emoji || '💪',
        isCardio: ex.isCardio, muscle: ex.muscle || '',
        currE1RM: Math.round(curr * 10) / 10,
        prevE1RM: prevVal != null ? Math.round(prevVal * 10) / 10 : null,
        status,
      };
    });
  };

  // 0–100 score based purely on exercises in THIS session
  // new exercises are excluded from win/loss calc (they don't help or hurt the score)
  // wins=1pt, maintained=0.5pt, declined=0pt out of total comparable exercises
  const calcScore0to100 = (flat) => {
    if (!flat?.length) return 0;   // nothing logged — no score

    const report   = buildExReport(flat);
    const relevant = report.filter((r) => r.status !== 'new');

    if (!relevant.length) return 100;  // all new exercises — perfect first session

    const wins       = relevant.filter((r) => r.status === 'progress').length;
    const maintained = relevant.filter((r) => r.status === 'maintained').length;

    // base: 0–100 purely from exercise outcomes
    const base = ((wins + maintained * 0.5) / relevant.length) * 100;

    // small volume bonus/penalty (±10 pts) — compare shared exercises vs their last appearance
    const sorted  = workouts?.length
      ? [...workouts].sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      : [];
    const allPrevMap = {};
    for (const w of sorted) {
      for (const ex of (w.exercises || [])) {
        if (!allPrevMap[ex.name]) allPrevMap[ex.name] = ex;
      }
    }
    const sharedNames = new Set(relevant.map((r) => r.name));
    const currVol = totalVolume(flat.filter((e) => sharedNames.has(e.name)));
    const prevVol = totalVolume(Object.values(allPrevMap).filter((e) => sharedNames.has(e.name)));
    const volBonus = prevVol > 0 ? Math.min(10, Math.max(-10, ((currVol - prevVol) / prevVol) * 20)) : 0;

    return Math.round(Math.min(100, Math.max(0, base + volBonus)));
  };

  // find prev workout of same type
  const getPrevWorkout = (type) => {
    if (!workouts?.length) return null;
    return [...workouts]
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      .find((w) => w.type === type) || null;
  };

  const saveAndShare = async () => {
    setSaving(true);
    if (timerIntervalRef.current) { clearInterval(timerIntervalRef.current); timerIntervalRef.current = null; }

    const flat = exercises.map((ex, exIdx) => {
      const done = (sets[exIdx] || []).filter((s) => s.done);
      if (!done.length) return null;
      if (ex.isCardio) {
        const totalSec = done.reduce((sum, s) => {
          return sum + (parseInt(s.minutes || 0) * 60) + parseInt(s.seconds || 0);
        }, 0);
        return {
          name: ex.name, emoji: ex.emoji, muscle: ex.muscle, isCardio: true,
          sets: done.length,
          reps: done.map((s) => `${s.minutes || 0}:${String(s.seconds || 0).padStart(2,'0')}`).join('/'),
          weight: '0',
          durationSeconds: totalSec,
        };
      }
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
        isCardio: ex.isCardio,
        sets: (sets[i] || []).filter((s) => s.done).map((s) =>
          ex.isCardio
            ? { minutes: s.minutes || '0', seconds: s.seconds || '0' }
            : { reps: s.reps, weight: s.weight }
        ),
      })),
      durationSeconds: elapsed,
      workoutType: workout.type,
      userWeightKg,
    });

    const payload = {
      type: workout.type, exercises: flat,
      notes: `${formatTime(elapsed)} session`,
      date: today, durationSeconds: elapsed, caloriesBurned: finalCalories,
      savedAt: Date.now(),   // ms timestamp — used to sort same-day workouts correctly
    };

    route.params?.onSave?.({ id: `temp_${Date.now()}`, userId: user.uid, ...payload });
    // Push into local ref immediately — Firestore sync may lag, but next session
    // needs to see this workout right away for correct "previous" display
    const localEntry = { id: `local_${Date.now()}`, userId: user.uid, ...payload };
    // re-fetch so next session in same app launch sees updated prev
    await AsyncStorage.removeItem(SESSION_KEY).catch(() => {});
    // addWorkoutLocally instantly updates context.workouts →
    // triggers useEffect([workouts]) → rebuilds prevSetsMap immediately, no fetch needed
    addWorkoutLocally({ id: `temp_${Date.now()}`, userId: user.uid, ...payload });
    logWorkout(user.uid, payload).then(() => refresh?.()).catch((e) => console.error('Save failed', e));
    setSaving(false);

    // ── score + report ──
    const score     = calcScore0to100(flat);
    const exReport  = buildExReport(flat);
    const prevW     = getPrevWorkout(workout.type);
    const isFirstTime = !prevW;
    setScoreData({ score, exReport, isFirstTime, payload, workoutId: `share_${Date.now()}`, elapsed });
  };

  const addExerciseMidSession = (item) => {
    const already = exercises.find((e) => e.name === item.name);
    if (already) return;
    const isCardio = detectCardio(item.name, item.muscle);
    const prev = prevSetsMap[item.name];
    setExercises((prev) => [...prev, { name: item.name, emoji: item.emoji, muscle: item.muscle, isCardio }]);
    setSets((prevSets) => {
      const newSet = isCardio
        ? [{ minutes: '', seconds: '', done: false, timerWallStart: null, timerRunning: false }]
        : prev?.length
          ? prev.map((s) => ({ weight: s.weight || '', reps: s.reps || '', done: false }))
          : [{ weight: '', reps: '', done: false }];
      return [...prevSets, newSet];
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
        paddingHorizontal: 20, paddingTop: 6, paddingBottom: 10,
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
              prevSets={prevSetsMap[ex.name] || null}
              startRestFor={startRestFor}
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

      {/* ── Score / Congrats modal ── */}
      <ScoreModal
        data={scoreData}
        C={C} F={F}
        onContinue={() => {
          const shareParams = {
            workout:  { ...scoreData.payload, id: scoreData.workoutId },
            prCount:  scoreData.exReport.filter(r => r.status === 'progress').length,
            streak:   userData?.streak || 0,
            userName: userData?.displayName || user?.displayName || 'Athlete',
            userId:   user.uid,
          };
          setScoreData(null);
          // Replace so the session screen is destroyed — back button won't return to it
          navigation.replace('WorkoutShare', shareParams);
        }}
      />
    </View>
  );
}
