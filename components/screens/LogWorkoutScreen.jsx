import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, FlatList, BackHandler, Dimensions,
  KeyboardAvoidingView, Platform, StatusBar, Modal,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useWorkoutsContext } from '../../hooks/WorkoutsContext';
import { logWorkout, deleteWorkout } from '../../services/workoutService';
import { getUserPresets, savePreset, deletePreset } from '../../services/presetService';
import { WORKOUT_TYPES, PRESET_EXERCISES } from '../../constants/exercises';
import { useTheme } from '../../hooks/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Fallbacks ────────────────────────────────────────────────────────────────
const HIIT_FALLBACK = [
  { name: 'Burpees', emoji: '🔥', muscle: 'Full Body' },
  { name: 'Jump Squats', emoji: '⚡', muscle: 'Legs' },
  { name: 'Mountain Climbers', emoji: '🏔️', muscle: 'Core' },
  { name: 'High Knees', emoji: '🦵', muscle: 'Cardio' },
  { name: 'Box Jumps', emoji: '📦', muscle: 'Legs' },
  { name: 'Kettlebell Swings', emoji: '🏋️', muscle: 'Full Body' },
];
const CARDIO_FALLBACK = [
  { name: 'Treadmill Run', emoji: '🏃', muscle: 'Cardio' },
  { name: 'Jump Rope', emoji: '🪢', muscle: 'Cardio' },
  { name: 'Rowing Machine', emoji: '🚣', muscle: 'Cardio' },
  { name: 'Cycling', emoji: '🚴', muscle: 'Cardio' },
  { name: 'Stair Climber', emoji: '🪜', muscle: 'Cardio' },
  { name: 'Elliptical', emoji: '🔄', muscle: 'Cardio' },
];
const FULLBODY_FALLBACK = [
  { name: 'Deadlift', emoji: '🏋️', muscle: 'Full Body' },
  { name: 'Pull-Ups', emoji: '💪', muscle: 'Back' },
  { name: 'Push-Ups', emoji: '👊', muscle: 'Chest' },
  { name: 'Squats', emoji: '🦵', muscle: 'Legs' },
  { name: 'Overhead Press', emoji: '🙌', muscle: 'Shoulders' },
  { name: 'Plank', emoji: '🧱', muscle: 'Core' },
];

const toPresetEx = (e) => ({ ...e, sets: [{ weight: '', reps: '' }] });

const PRESET_HERO_EMOJI = {
  default_push:     '💪',
  default_pull:     '🔝',
  default_legs:     '🦵',
  default_upper:    '🏋️',
  default_lower:    '🍑',
  default_fullbody: '⚡',
  default_hiit:     '🔥',
  default_cardio:   '🏃',
};

const DEFAULT_PRESETS = [
  { id: 'default_push',     name: '💪 Push',       exercises: (PRESET_EXERCISES?.['Push']       || []).slice(0, 6).map(toPresetEx) },
  { id: 'default_pull',     name: '🔝 Pull',       exercises: (PRESET_EXERCISES?.['Pull']       || []).slice(0, 6).map(toPresetEx) },
  { id: 'default_legs',     name: '🦵 Legs',       exercises: (PRESET_EXERCISES?.['Legs']       || []).slice(0, 6).map(toPresetEx) },
  { id: 'default_upper',    name: '🏋️ Upper Body', exercises: (PRESET_EXERCISES?.['Upper Body'] || []).slice(0, 6).map(toPresetEx) },
  { id: 'default_lower',    name: '🍑 Lower Body', exercises: (PRESET_EXERCISES?.['Lower Body'] || []).slice(0, 6).map(toPresetEx) },
  { id: 'default_fullbody', name: '⚡ Full Body',  exercises: (PRESET_EXERCISES?.['Full Body']  || FULLBODY_FALLBACK).slice(0, 6).map(toPresetEx) },
  { id: 'default_hiit',     name: '🔥 HIIT',       exercises: (PRESET_EXERCISES?.['HIIT']       || HIIT_FALLBACK).slice(0, 6).map(toPresetEx) },
  { id: 'default_cardio',   name: '🏃 Cardio',     exercises: (PRESET_EXERCISES?.['Cardio']     || CARDIO_FALLBACK).slice(0, 6).map(toPresetEx) },
];

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH   = SCREEN_WIDTH - 48;

// ─── Exercise Picker (receives C & F as props — can't call hooks in sub-components rendered conditionally) ──
// Muscles for custom exercise tagging
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

// Muscle filter chips shown in picker
const MUSCLE_FILTERS = [
  { label: 'All',       value: null          },
  { label: 'Chest',     value: 'chest'       },
  { label: 'Back',      value: 'back'        },
  { label: 'Shoulders', value: 'shoulders'   },
  { label: 'Arms',      value: 'arms'        }, // biceps + triceps
  { label: 'Abs',       value: 'abs'         },
  { label: 'Legs',      value: 'legs'        }, // quads + hamstrings + glutes + calves
  { label: 'Cardio',    value: 'cardio'      },
];

function matchesMuscleFilter(ex, filter) {
  if (!filter) return true;
  const m = (ex.muscle || '').toLowerCase();
  if (filter === 'arms')  return m.includes('bicep') || m.includes('tricep') || m.includes('arm') || m.includes('forearm');
  if (filter === 'legs')  return m.includes('quad') || m.includes('hamstring') || m.includes('glute') || m.includes('calf') || m.includes('calve') || m.includes('leg');
  if (filter === 'abs')   return m.includes('abs') || m.includes('core');
  if (filter === 'cardio')return m.includes('cardio');
  return m.includes(filter);
}

function ExercisePicker({ visible, workoutType, selectedNames, onSelect, onClose, C, F }) {
  const [search, setSearch]           = useState('');
  const [muscleFilter, setMuscleFilter] = useState(null);
  const [showCustom, setShowCustom]   = useState(false);
  const [customName, setCustomName]   = useState('');
  const [muscleModal, setMuscleModal] = useState(false);
  const [pendingName, setPendingName] = useState('');

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
          <Text style={[pk.title, { color: C.text, fontFamily: F.display }]}>Exercises</Text>
          <TouchableOpacity onPress={onClose} style={[pk.doneBtn, { backgroundColor: C.accent }]}>
            <Text style={[pk.doneBtnText, { color: C.btnText, fontFamily: F.heading }]}>Done</Text>
          </TouchableOpacity>
        </View>

        {/* ── Add custom — always visible at top ── */}
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
              <TouchableOpacity onPress={() => { setShowCustom(false); setCustomName(''); }}
                style={{ padding: 8 }}>
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

        {/* ── Exercise list — 2 per row ── */}
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
  root:        { flex: 1, paddingTop: 56 },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, marginBottom: 8 },
  backBtn:     { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  title:       { fontSize: 18, fontWeight: '800' },
  doneBtn:     { borderRadius: 999, paddingHorizontal: 16, paddingVertical: 7 },
  doneBtnText: { fontWeight: '800', fontSize: 13 },
  addCustomBtn:{ flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginBottom: 10, paddingVertical: 11, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1.5 },
  customBox:   { marginHorizontal: 16, marginBottom: 10, padding: 12, borderRadius: 14, borderWidth: 1.5 },
  customInput: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, height: 44, fontSize: 14 },
  customBtn:   { borderRadius: 12, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', height: 44 },
  customBtnText:{ fontWeight: '800', fontSize: 13 },
  searchWrap:  { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, height: 44, marginBottom: 10, marginHorizontal: 16 },
  searchInput: { flex: 1, fontSize: 14 },
  exCard:      { flex: 1, borderRadius: 16, padding: 14, borderWidth: 1.5, minHeight: 100 },
  exName:      { fontWeight: '700', fontSize: 13, lineHeight: 18 },
  exMuscle:    { fontSize: 11, marginTop: 3 },
  checkCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  emptyText:   { textAlign: 'center', paddingVertical: 40, fontSize: 14 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function LogWorkoutScreen({ route, navigation }) {
  const { scheme: C, font: F } = useTheme();

  const { date, editingWorkout: editingParam } = route.params || {};
  const { user }                               = useAuth();
  const { workouts, addWorkoutLocally, refresh } = useWorkoutsContext();

  // Build prevSetsMap from workouts — called right before navigating so it's always fresh
  const buildPrevSetsMap = () => {
    const map = {};
    if (!workouts?.length) return map;
    const sorted = [...workouts].sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0) || (b.date || '').localeCompare(a.date || ''));
    const cardioKw = ['cardio','run','bike','cycle','row','swim','elliptical','jump','treadmill','stair'];
    const isCardioEx = (name = '', muscle = '') =>
      cardioKw.some(k => name.toLowerCase().includes(k) || muscle.toLowerCase().includes(k));
    for (const w of sorted) {
      for (const ex of w.exercises || []) {
        if (map[ex.name] || !ex.sets) continue;
        const repsArr   = typeof ex.reps   === 'string' ? ex.reps.split('/') : [];
        const weightArr = typeof ex.weight === 'string' ? ex.weight.split('/') : [];
        const count     = parseInt(ex.sets) || repsArr.length || 1;
        const cardio    = ex.isCardio || isCardioEx(ex.name, ex.muscle || '');
        map[ex.name] = Array.from({ length: count }, (_, i) => {
          if (cardio) {
            const raw = repsArr[i] || repsArr[0] || '0:00';
            const [m, s] = raw.split(':');
            return { minutes: m || '0', seconds: s || '00', isCardio: true };
          }
          return { weight: weightArr[i] || weightArr[0] || '', reps: repsArr[i] || repsArr[0] || '' };
        });
      }
    }
    return map;
  };

  const DRAFT_KEY = user?.uid ? `workout_draft_${user.uid}` : null;

  const [step, setStep]                             = useState(editingParam ? 2 : 1);
  const [workoutType, setWorkoutType]               = useState(editingParam?.type || 'Push');
  const [exercises, setExercises]                   = useState(() => {
    if (!editingParam) return [];
    return (editingParam.exercises || []).map((ex) => {
      const repsArr   = ex.reps   ? ex.reps.toString().split('/')   : [''];
      const weightArr = ex.weight ? ex.weight.toString().split('/') : [''];
      const count     = ex.sets   || repsArr.length || 1;
      return {
        name: ex.name, emoji: ex.emoji || '💪', muscle: ex.muscle || '',
        sets: Array.from({ length: count }, (_, i) => ({
          reps: repsArr[i] || '', weight: weightArr[i] || '',
        })),
      };
    });
  });
  const [notes, setNotes]                               = useState(editingParam?.notes || '');
  const [pickerVisible, setPickerVisible]               = useState(false);
  const [userPresets, setUserPresets]                   = useState([]);
  const [previewPreset, setPreviewPreset]               = useState(null);
  const [newPresetName, setNewPresetName]               = useState('');
  const [newPresetExercises, setNewPresetExercises]     = useState([]);
  const [presetPickerVisible, setPresetPickerVisible]   = useState(false);
  const [savingPreset, setSavingPreset]                 = useState(false);
  const [editingPreset, setEditingPreset]               = useState(null);
  const [showCreatePreset, setShowCreatePreset]         = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    getUserPresets(user.uid).then(setUserPresets).catch(() => {});
  }, [user?.uid]);

  useEffect(() => {
    if (editingParam || !DRAFT_KEY) return;
    AsyncStorage.getItem(DRAFT_KEY)
      .then((raw) => {
        if (!raw) return;
        const draft = JSON.parse(raw);
        if (draft.exercises?.length > 0) {
          setWorkoutType(draft.workoutType || 'Push');
          setExercises(draft.exercises);
          setNotes(draft.notes || '');
          setStep(2);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!DRAFT_KEY || editingParam) return;
    if (exercises.length === 0 && !notes) return;
    AsyncStorage.setItem(DRAFT_KEY, JSON.stringify({ workoutType, exercises, notes, date })).catch(() => {});
  }, [workoutType, exercises, notes]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (pickerVisible)               { setPickerVisible(false);       return true; }
      if (presetPickerVisible)         { setPresetPickerVisible(false); return true; }
      if (showCreatePreset)            { setShowCreatePreset(false);    return true; }
      if (previewPreset)               { setPreviewPreset(null);        return true; }
      if (step === 2 && !editingParam) { setStep(1);                    return true; }
      navigation.goBack();
      return true;
    });
    return () => sub.remove();
  }, [pickerVisible, presetPickerVisible, showCreatePreset, previewPreset, step, editingParam]);

  const applyPreset = (preset) => {
    setExercises(preset.exercises.map((e) => ({
      ...e, sets: e.sets?.length ? e.sets : [{ weight: '', reps: '' }],
    })));
    const typeName = preset.name.replace(/^.+? /, '').trim();
    const matched  = ['Push','Pull','Legs','Upper Body','Lower Body','Full Body','Cardio','HIIT','Mobility']
      .find((t) => typeName.toLowerCase().includes(t.toLowerCase()));
    if (matched) setWorkoutType(matched);
  };

  const handlePickExercise = (item) => {
    const exists = exercises.find((e) => e.name === item.name);
    if (exists) {
      setExercises(exercises.filter((e) => e.name !== item.name));
    } else {
      const cardioKw = ['running','cycling','jump rope','rowing','swimming','elliptical','stair','walk','jog','sprint','treadmill','cardio','burpee','mountain climber','box jump','skipping','hiit','bike','run'];
      const isCardio = cardioKw.some((k) =>
        item.name.toLowerCase().includes(k) || (item.muscle || '').toLowerCase().includes('cardio')
      );
      setExercises([...exercises, {
        name: item.name, emoji: item.emoji, muscle: item.muscle,
        isCardio, sets: [isCardio ? { minutes: '', seconds: '' } : { weight: '', reps: '' }],
      }]);
    }
  };

  const updateSet      = (exIdx, setIdx, field, val) => { const u = [...exercises]; u[exIdx].sets[setIdx][field] = val; setExercises(u); };
  const addSet         = (exIdx) => { const u = [...exercises]; u[exIdx].sets.push(u[exIdx].isCardio ? { minutes: '', seconds: '' } : { weight: '', reps: '' }); setExercises(u); };
  const removeSet      = (exIdx, setIdx) => { const u = [...exercises]; if (u[exIdx].sets.length === 1) return; u[exIdx].sets.splice(setIdx, 1); setExercises(u); };
  const removeExercise = (exIdx) => setExercises(exercises.filter((_, i) => i !== exIdx));

  const handleSave = () => {
    if (exercises.length === 0) return Alert.alert('Error', 'Select at least one exercise');
    const flat = exercises
      .filter((ex) => ex.sets.some((s) =>
        parseFloat(s.reps) > 0 || parseFloat(s.weight) > 0 ||
        parseFloat(s.minutes) > 0 || parseFloat(s.seconds) > 0
      ))
      .map((ex) => ({
        name: ex.name, emoji: ex.emoji,
        sets:    ex.sets.length,
        reps:    ex.sets.map((s) => s.reps    || '0').join('/'),
        weight:  ex.sets.map((s) => s.weight  || '0').join('/'),
        minutes: ex.sets.map((s) => s.minutes || '0').join('/'),
        seconds: ex.sets.map((s) => s.seconds || '0').join('/'),
        isCardio: ex.isCardio || false,
      }));
    if (flat.length === 0) return Alert.alert('Error', 'Add at least one exercise with valid data');

    if (editingParam) {
      const updated = { ...editingParam, type: workoutType, exercises: flat, notes };
      addWorkoutLocally(updated);
      const { doc, updateDoc } = require('firebase/firestore');
      const { db }             = require('../../services/firebase');
      updateDoc(doc(db, 'workouts', editingParam.id), { type: workoutType, exercises: flat, notes })
        .then(() => refresh())
        .catch(() => { Alert.alert('Error', 'Failed to update workout.'); refresh(); });
    } else {
      const tempId = `temp_${Date.now()}`;
      addWorkoutLocally({ id: tempId, userId: user.uid, type: workoutType, exercises: flat, notes, date });
      if (DRAFT_KEY) AsyncStorage.removeItem(DRAFT_KEY).catch(() => {});
      Alert.alert('🔥 Locked in!', 'Workout saved. Keep grinding!');
      logWorkout(user.uid, { type: workoutType, exercises: flat, notes, date })
        .then(() => refresh())
        .catch(() => { Alert.alert('Error', 'Failed to save workout.'); refresh(); });
    }
    navigation.goBack();
  };

  const handleSavePreset = async () => {
    if (!newPresetName.trim())           return Alert.alert('Name required', 'Give your preset a name.');
    if (newPresetExercises.length === 0) return Alert.alert('No exercises', 'Add at least one exercise.');
    setSavingPreset(true);
    const exData = newPresetExercises.map((e) => ({ name: e.name, emoji: e.emoji, muscle: e.muscle }));
    try {
      if (editingPreset) {
        const { doc, updateDoc } = require('firebase/firestore');
        const { db }             = require('../../services/firebase');
        await updateDoc(doc(db, 'presets', user.uid, 'userPresets', editingPreset.id), { name: newPresetName.trim(), exercises: exData });
        setUserPresets((prev) => prev.map((p) => p.id === editingPreset.id ? { ...p, name: newPresetName.trim(), exercises: exData } : p));
        Alert.alert('Updated! ✅', `"${newPresetName.trim()}" preset updated.`);
      } else {
        const id = await savePreset(user.uid, { name: newPresetName.trim(), exercises: exData });
        setUserPresets((prev) => [...prev, { id, name: newPresetName.trim(), exercises: exData }]);
        Alert.alert('Saved! ✅', `"${newPresetName.trim()}" preset created.`);
      }
      setShowCreatePreset(false); setNewPresetName(''); setNewPresetExercises([]); setEditingPreset(null);
    } catch { Alert.alert('Error', 'Could not save preset.'); }
    finally { setSavingPreset(false); }
  };

  const handleDeletePreset = (presetId) => {
    Alert.alert('Delete Preset', 'Remove this preset?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        setUserPresets((prev) => prev.filter((p) => p.id !== presetId));
        deletePreset(user.uid, presetId).catch(() => {});
      }},
    ]);
  };

  const selectedExNames = exercises.map((e) => e.name);

  // ── Shared inline style helpers ───────────────────────────────────────────────
  const root        = [s.root,        { backgroundColor: C.bg }];
  const header      = [s.header,      { borderColor: C.border }];
  const backBtn     = [s.backBtn,     { backgroundColor: C.surface, borderColor: C.border }];
  const headerTitle = [s.headerTitle, { color: C.text, fontFamily: F.display }];
  const sectionLbl  = [s.sectionLabel,{ color: C.textSub, fontFamily: F.heading }];
  const fieldLbl    = [s.fieldLabel,  { color: C.textSub, fontFamily: F.heading }];

  // ── Preset Preview ─────────────────────────────────────────────────────────────
  if (previewPreset) {
    return (
      <View style={root}>
        <StatusBar barStyle="light-content" />
        <View style={header}>
          <TouchableOpacity style={backBtn} onPress={() => setPreviewPreset(null)}>
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </TouchableOpacity>
          <Text style={headerTitle}>{previewPreset.name}</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
          <Text style={sectionLbl}>{previewPreset.exercises?.length} EXERCISES</Text>
          {previewPreset.exercises?.map((ex, i) => (
            <Animated.View key={i} entering={FadeInDown.delay(i * 40).duration(300)}
              style={[s.previewExRow, { backgroundColor: C.card, borderColor: C.border }]}>
              <Text style={{ fontSize: 24 }}>{ex.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[s.previewExName, { color: C.text, fontFamily: F.heading }]}>{ex.name}</Text>
                <Text style={[s.previewExMuscle, { color: C.textSub, fontFamily: F.body }]}>{ex.muscle}</Text>
              </View>
              <Text style={[s.previewExSets, { color: C.textSub, fontFamily: F.body }]}>{ex.sets?.length || 1} sets</Text>
            </Animated.View>
          ))}
          <View style={{ height: 24 }} />
          <TouchableOpacity
            style={[s.primaryBtn, { backgroundColor: C.accent }]}
            onPress={() => {
              setPreviewPreset(null);
              navigation.navigate('WorkoutSession', {
                workout: {
                  type: previewPreset.name,
                  exercises: previewPreset.exercises.map((e) => ({
                    ...e, sets: e.sets?.length ? e.sets : [{ weight: '', reps: '' }],
                  })),
                },
                date,
                prevSetsMap: buildPrevSetsMap(),
                onSave: (w) => addWorkoutLocally(w),
              });
            }}
          >
            <Ionicons name="play" size={18} color={C.btnText} />
            <Text style={[s.primaryBtnText, { color: C.btnText, fontFamily: F.heading }]}>Start Workout</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.secondaryBtn, { backgroundColor: C.surface, borderColor: C.border }]}
            onPress={() => { applyPreset(previewPreset); setPreviewPreset(null); setStep(2); }}
          >
            <Ionicons name="add-circle-outline" size={18} color={C.textSub} />
            <Text style={[s.secondaryBtnText, { color: C.textSub, fontFamily: F.body }]}>Log Manually Instead</Text>
          </TouchableOpacity>
          <View style={{ height: 60 }} />
        </ScrollView>
      </View>
    );
  }

  // ── Create / Edit Preset ───────────────────────────────────────────────────────
  if (showCreatePreset) {
    return (
      <KeyboardAvoidingView style={root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <StatusBar barStyle="light-content" />
        <View style={header}>
          <TouchableOpacity style={backBtn}
            onPress={() => { setShowCreatePreset(false); setEditingPreset(null); setNewPresetName(''); setNewPresetExercises([]); }}>
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </TouchableOpacity>
          <Text style={headerTitle}>{editingPreset ? 'Edit Preset' : 'New Preset'}</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
          <Text style={fieldLbl}>Preset Name</Text>
          <TextInput
            style={[s.notesInput, { backgroundColor: C.surface, borderColor: C.border, color: C.text, fontFamily: F.body }]}
            placeholder="e.g. My Push Day..."
            placeholderTextColor={C.textSub}
            value={newPresetName}
            onChangeText={setNewPresetName}
          />
          <TouchableOpacity
            style={[s.selectExBtn, { backgroundColor: C.surface, borderColor: C.accent }]}
            onPress={() => setPresetPickerVisible(true)}
          >
            <Ionicons name="barbell-outline" size={20} color={C.accent} />
            <Text style={[s.selectExText, { color: C.text, fontFamily: F.heading }]}>
              {newPresetExercises.length === 0 ? 'Select Exercises' : `${newPresetExercises.length} selected — Edit`}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={C.textSub} />
          </TouchableOpacity>
          {newPresetExercises.map((ex, i) => (
            <View key={i} style={[s.previewExRow, { backgroundColor: C.card, borderColor: C.border }]}>
              <Text style={{ fontSize: 20 }}>{ex.emoji}</Text>
              <Text style={{ color: C.text, fontFamily: F.heading, fontWeight: '700', fontSize: 15, flex: 1 }}>{ex.name}</Text>
              <Text style={{ color: C.textSub, fontFamily: F.body, fontSize: 12 }}>{ex.muscle}</Text>
            </View>
          ))}
          <TouchableOpacity
            style={[s.primaryBtn, { backgroundColor: C.accent, marginTop: 24 },
              (newPresetExercises.length === 0 || savingPreset) && { opacity: 0.5 }]}
            onPress={handleSavePreset}
            disabled={newPresetExercises.length === 0 || savingPreset}
          >
            <Text style={[s.primaryBtnText, { color: C.btnText, fontFamily: F.heading }]}>
              {editingPreset ? '✏️ Update Preset' : '💾 Save Preset'}
            </Text>
          </TouchableOpacity>
          <View style={{ height: 60 }} />
        </ScrollView>
        {presetPickerVisible && (
          <ExercisePicker
            visible={presetPickerVisible}
            workoutType="Custom"
            selectedNames={newPresetExercises.map((e) => e.name)}
            onSelect={(item) => {
              const exists = newPresetExercises.find((e) => e.name === item.name);
              if (exists) setNewPresetExercises(newPresetExercises.filter((e) => e.name !== item.name));
              else setNewPresetExercises([...newPresetExercises, item]);
            }}
            onClose={() => setPresetPickerVisible(false)}
            C={C} F={F}
          />
        )}
      </KeyboardAvoidingView>
    );
  }

  // ── Step 2: Log Exercises ──────────────────────────────────────────────────────
  if (step === 2) {
    return (
      <KeyboardAvoidingView style={root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <StatusBar barStyle="light-content" />
        <View style={header}>
          <TouchableOpacity style={backBtn} onPress={() => editingParam ? navigation.goBack() : setStep(1)}>
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </TouchableOpacity>
          <Text style={headerTitle}>{editingParam ? 'Edit Workout' : workoutType}</Text>
          <TouchableOpacity
            style={[s.saveHeaderBtn, { backgroundColor: C.accent }, exercises.length === 0 && { opacity: 0.4 }]}
            onPress={handleSave}
            disabled={exercises.length === 0}
          >
            <Text style={[s.saveHeaderBtnText, { color: C.btnText, fontFamily: F.heading }]}>
              {editingParam ? 'Update' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        {!editingParam && (
          <View style={s.stepRow}>
            <View style={[s.stepDot, { backgroundColor: C.accent, borderColor: C.accent }]} />
            <View style={[s.stepLine, { backgroundColor: C.accent }]} />
            <View style={[s.stepDot, { backgroundColor: C.accent, borderColor: C.accent }]} />
          </View>
        )}

        <ScrollView
          contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={[s.selectExBtn, { backgroundColor: C.surface, borderColor: C.accent }]}
            onPress={() => setPickerVisible(true)}
          >
            <Ionicons name="barbell-outline" size={20} color={C.accent} />
            <Text style={[s.selectExText, { color: C.text, fontFamily: F.heading }]}>
              {exercises.length === 0 ? 'Select Exercises' : `${exercises.length} exercises — Edit`}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={C.textSub} />
          </TouchableOpacity>

          {exercises.map((ex, exIdx) => (
            <Animated.View key={ex.name} entering={FadeInDown.duration(250)}
              style={[s.exCard, { backgroundColor: C.card, borderColor: C.border, borderTopColor: C.accent }]}>
              <View style={s.exCardHeader}>
                <Text style={{ fontSize: 28 }}>{ex.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[s.exCardName, { color: C.text, fontFamily: F.heading }]}>{ex.name}</Text>
                  <Text style={[s.exCardMuscle, { color: C.textSub, fontFamily: F.body }]}>{ex.muscle}</Text>
                </View>
                <TouchableOpacity onPress={() => removeExercise(exIdx)}>
                  <Ionicons name="close-circle-outline" size={22} color="#f87171" />
                </TouchableOpacity>
              </View>

              <View style={s.setHeaderRow}>
                <Text style={[s.setHeaderCell, { color: C.textSub, fontFamily: F.heading }]}>SET</Text>
                <Text style={[s.setHeaderCell, { color: C.textSub, fontFamily: F.heading }]}>{ex.isCardio ? 'MIN' : 'WEIGHT (kg)'}</Text>
                <Text style={[s.setHeaderCell, { color: C.textSub, fontFamily: F.heading }]}>{ex.isCardio ? 'SEC' : 'REPS'}</Text>
                <View style={{ width: 28 }} />
              </View>

              {ex.sets.map((set, setIdx) => (
                <View key={setIdx} style={s.setRow}>
                  <View style={[s.setNumBadge, { backgroundColor: C.accent + '22' }]}>
                    <Text style={[s.setNumText, { color: C.accent, fontFamily: F.heading }]}>{setIdx + 1}</Text>
                  </View>
                  {ex.isCardio ? (
                    <>
                      <TextInput style={[s.setInput, { backgroundColor: C.surface, borderColor: C.border, color: C.text, fontFamily: F.heading }]} placeholder="min" placeholderTextColor={C.textSub} value={set.minutes} onChangeText={(v) => updateSet(exIdx, setIdx, 'minutes', v)} keyboardType="numeric" />
                      <TextInput style={[s.setInput, { backgroundColor: C.surface, borderColor: C.border, color: C.text, fontFamily: F.heading }]} placeholder="sec" placeholderTextColor={C.textSub} value={set.seconds} onChangeText={(v) => updateSet(exIdx, setIdx, 'seconds', v)} keyboardType="numeric" />
                    </>
                  ) : (
                    <>
                      <TextInput style={[s.setInput, { backgroundColor: C.surface, borderColor: C.border, color: C.text, fontFamily: F.heading }]} placeholder="0" placeholderTextColor={C.textSub} value={set.weight} onChangeText={(v) => updateSet(exIdx, setIdx, 'weight', v)} keyboardType="decimal-pad" />
                      <TextInput style={[s.setInput, { backgroundColor: C.surface, borderColor: C.border, color: C.text, fontFamily: F.heading }]} placeholder="0" placeholderTextColor={C.textSub} value={set.reps}   onChangeText={(v) => updateSet(exIdx, setIdx, 'reps',   v)} keyboardType="numeric" />
                    </>
                  )}
                  <TouchableOpacity onPress={() => removeSet(exIdx, setIdx)}>
                    <Ionicons name="remove-circle-outline" size={20} color={ex.sets.length > 1 ? '#f87171' : C.border} />
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity style={s.addSetBtn} onPress={() => addSet(exIdx)}>
                <Ionicons name="add-circle-outline" size={17} color={C.accent} />
                <Text style={[s.addSetText, { color: C.accent, fontFamily: F.body }]}>Add Set</Text>
              </TouchableOpacity>
            </Animated.View>
          ))}

          <Text style={fieldLbl}>Notes (optional)</Text>
          <TextInput
            style={[s.notesInput, { backgroundColor: C.surface, borderColor: C.border, color: C.text, fontFamily: F.body }]}
            placeholder="How did it go?"
            placeholderTextColor={C.textSub}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />

          <TouchableOpacity
            style={[s.primaryBtn, { backgroundColor: C.accent, marginTop: 24 }, exercises.length === 0 && { opacity: 0.5 }]}
            onPress={handleSave}
            disabled={exercises.length === 0}
          >
            <Text style={[s.primaryBtnText, { color: C.btnText, fontFamily: F.heading }]}>
              {editingParam ? '✏️ Update Workout' : '🔥 Save Workout'}
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {pickerVisible && (
          <ExercisePicker
            visible={pickerVisible}
            workoutType={workoutType}
            selectedNames={selectedExNames}
            onSelect={handlePickExercise}
            onClose={() => setPickerVisible(false)}
            C={C} F={F}
          />
        )}
      </KeyboardAvoidingView>
    );
  }

  // ── Step 1: Choose Preset / Type ───────────────────────────────────────────────
  return (
    <View style={root}>
      <StatusBar barStyle="light-content" />
      <View style={header}>
        <TouchableOpacity style={backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={headerTitle}>Start Workout</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={s.stepRow}>
        <View style={[s.stepDot, { backgroundColor: C.accent, borderColor: C.accent }]} />
        <View style={[s.stepLine, { backgroundColor: C.border }]} />
        <View style={[s.stepDot, { backgroundColor: C.border, borderColor: C.border }]} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>

        {/* Create preset CTA */}
        <Animated.View entering={FadeInDown.duration(350)}>
          <TouchableOpacity
            style={[s.createPresetBtn, { backgroundColor: C.accent + '12', borderColor: C.accent + '44' }]}
            onPress={() => setShowCreatePreset(true)}
          >
            <View style={[s.createPresetIcon, { backgroundColor: C.accent + '20' }]}>
              <Ionicons name="add" size={22} color={C.accent} />
            </View>
            <Text style={[s.createPresetText, { color: C.accent, fontFamily: F.heading }]}>Create New Preset</Text>
            <Ionicons name="chevron-forward" size={18} color={C.textSub} />
          </TouchableOpacity>
        </Animated.View>

        {/* My Presets */}
        {userPresets.length > 0 && (
          <Animated.View entering={FadeInDown.delay(60).duration(350)}>
            <Text style={sectionLbl}>MY PRESETS</Text>
            {userPresets.map((preset) => (
              <View key={preset.id} style={[s.presetCard, { backgroundColor: C.card, borderColor: C.border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.presetCardName, { color: C.text, fontFamily: F.heading }]}>{preset.name}</Text>
                    <Text style={[s.presetCardSub, { color: C.textSub, fontFamily: F.body }]}>{preset.exercises.length} exercises</Text>
                  </View>
                  <TouchableOpacity
                    style={[s.presetCardIconBtn, { backgroundColor: C.surface, borderColor: C.border }]}
                    onPress={() => {
                      setEditingPreset(preset);
                      setNewPresetName(preset.name);
                      setNewPresetExercises(preset.exercises.map((e) => ({ name: e.name, emoji: e.emoji || '💪', muscle: e.muscle || '' })));
                      setShowCreatePreset(true);
                    }}
                  >
                    <Ionicons name="create-outline" size={16} color="#54a0ff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.presetCardIconBtn, { backgroundColor: C.surface, borderColor: C.border }]}
                    onPress={() => handleDeletePreset(preset.id)}
                  >
                    <Ionicons name="trash-outline" size={16} color="#f87171" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.presetOpenBtn, { backgroundColor: C.accent }]}
                    onPress={() => setPreviewPreset(preset)}
                  >
                    <Text style={[s.presetOpenText, { color: C.btnText, fontFamily: F.heading }]}>Open</Text>
                    <Ionicons name="chevron-forward" size={14} color={C.btnText} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </Animated.View>
        )}

        {/* Default Presets */}
        <Animated.View entering={FadeInDown.delay(120).duration(350)}>
          <Text style={sectionLbl}>QUICK START</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 14, paddingBottom: 12, paddingRight: 4 }}
            snapToInterval={CARD_WIDTH + 14}
            decelerationRate="fast"
            snapToAlignment="start"
          >
            {DEFAULT_PRESETS.map((preset) => (
              <TouchableOpacity
                key={preset.id}
                style={[s.carouselCard, { width: CARD_WIDTH, backgroundColor: C.card, borderColor: C.border }]}
                onPress={() => navigation.navigate('WorkoutSession', {
                  workout: { type: preset.name, exercises: preset.exercises },
                  date,
                  prevSetsMap: buildPrevSetsMap(),
                  onSave: (w) => addWorkoutLocally(w),
                })}
                activeOpacity={0.88}
              >
                <View style={[s.carouselHeroWrap, { backgroundColor: C.accent + '0e', borderColor: C.accent + '28' }]}>
                  <Text style={s.carouselHeroEmoji}>{PRESET_HERO_EMOJI[preset.id]}</Text>
                </View>
                <Text style={[s.carouselCardName, { color: C.text, fontFamily: F.display }]}>{preset.name}</Text>
                <Text style={[s.carouselCardSub, { color: C.textSub, fontFamily: F.body }]}>{preset.exercises.length} exercises</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10, marginBottom: 16 }}>
                  {preset.exercises.slice(0, 3).map((ex, i) => (
                    <View key={i} style={[s.exPill, { backgroundColor: C.surface, borderColor: C.border }]}>
                      <Text style={{ fontSize: 11 }}>{ex.emoji}</Text>
                      <Text style={[s.exPillText, { color: C.textSub, fontFamily: F.body }]}>{ex.name}</Text>
                    </View>
                  ))}
                  {preset.exercises.length > 3 && (
                    <View style={[s.exPill, { backgroundColor: C.surface, borderColor: C.border }]}>
                      <Text style={[s.exPillText, { color: C.textSub, fontFamily: F.body }]}>+{preset.exercises.length - 3} more</Text>
                    </View>
                  )}
                </View>
                <View style={[s.carouselStartBtn, { backgroundColor: C.accent }]}>
                  <Ionicons name="play" size={14} color={C.btnText} />
                  <Text style={[s.carouselStartBtnText, { color: C.btnText, fontFamily: F.heading }]}>Start Workout</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

      </ScrollView>
    </View>
  );
}

// ─── Styles (layout only — all colors applied inline via C & F) ───────────────
const s = StyleSheet.create({
  root:             { flex: 1 },
  header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 6, paddingBottom: 12, borderBottomWidth: 1 },
  backBtn:          { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  headerTitle:      { fontSize: 18, fontWeight: '800' },
  saveHeaderBtn:    { borderRadius: 999, paddingHorizontal: 18, paddingVertical: 8 },
  saveHeaderBtnText:{ fontWeight: '800', fontSize: 14 },

  stepRow:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 0 },
  stepDot:          { width: 10, height: 10, borderRadius: 5, borderWidth: 1 },
  stepLine:         { width: 60, height: 2 },

  sectionLabel:     { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginTop: 20, marginBottom: 10 },
  fieldLabel:       { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 16 },

  createPresetBtn:  { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 16, borderWidth: 1.5, gap: 12 },
  createPresetIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  createPresetText: { flex: 1, fontWeight: '700', fontSize: 15 },

  presetCard:       { borderRadius: 18, padding: 16, marginBottom: 10, borderWidth: 1 },
  presetCardName:   { fontWeight: '700', fontSize: 15 },
  presetCardSub:    { fontSize: 12, marginTop: 2 },
  presetCardIconBtn:{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, marginLeft: 8 },
  presetOpenBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, marginLeft: 8 },
  presetOpenText:   { fontWeight: '700', fontSize: 13 },

  carouselCard:     { borderRadius: 24, padding: 20, borderWidth: 1, minHeight: 260 },
  carouselHeroWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: 16, height: 100, borderRadius: 18, borderWidth: 1 },
  carouselHeroEmoji:{ fontSize: 62 },
  carouselCardName: { fontWeight: '800', fontSize: 22 },
  carouselCardSub:  { fontSize: 13, fontWeight: '500', marginTop: 2 },
  carouselStartBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 12, marginTop: 14 },
  carouselStartBtnText: { fontWeight: '800', fontSize: 14 },
  exPill:           { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5, borderWidth: 1 },
  exPillText:       { fontSize: 11, fontWeight: '500' },

  selectExBtn:      { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 16, borderWidth: 1.5, gap: 8, marginBottom: 8 },
  selectExText:     { flex: 1, fontWeight: '600', fontSize: 15 },

  exCard:           { borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 1, borderTopWidth: 3 },
  exCardHeader:     { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 },
  exCardName:       { fontWeight: '700', fontSize: 15 },
  exCardMuscle:     { fontSize: 12, marginTop: 2 },
  setHeaderRow:     { flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingHorizontal: 2 },
  setHeaderCell:    { flex: 1, fontSize: 10, fontWeight: '700', letterSpacing: 1, textAlign: 'center' },
  setRow:           { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  setNumBadge:      { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  setNumText:       { fontWeight: '800', fontSize: 13 },
  setInput:         { flex: 1, borderRadius: 10, paddingVertical: 10, fontWeight: '700', fontSize: 17, textAlign: 'center', borderWidth: 1 },
  addSetBtn:        { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 8, marginTop: 4 },
  addSetText:       { fontWeight: '600', fontSize: 14 },

  notesInput:       { borderRadius: 14, padding: 16, borderWidth: 1, textAlignVertical: 'top', minHeight: 80, fontSize: 14 },

  primaryBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 18, height: 56 },
  primaryBtnText:   { fontWeight: '800', fontSize: 17 },
  secondaryBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 18, height: 52, marginTop: 12, borderWidth: 1 },
  secondaryBtnText: { fontWeight: '600', fontSize: 14 },

  previewExRow:     { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 14, marginBottom: 8, borderWidth: 1, gap: 12 },
  previewExName:    { fontWeight: '600', fontSize: 15 },
  previewExMuscle:  { fontSize: 12, marginTop: 2 },
  previewExSets:    { fontSize: 13 },
});

