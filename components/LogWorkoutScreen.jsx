import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, FlatList, BackHandler, Dimensions,
  KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useWorkoutsContext } from '../../hooks/WorkoutsContext';
import { logWorkout, deleteWorkout } from '../../services/workoutService';
import { getUserPresets, savePreset, deletePreset } from '../../services/presetService';
import { WORKOUT_TYPES, PRESET_EXERCISES } from '../../constants/exercises';
import { Colors } from '../../constants/theme';
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

// Big center emoji shown on each default preset card (placeholder for Lottie later)
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

// ─── Exercise Picker ──────────────────────────────────────────────────────────
function ExercisePicker({ visible, workoutType, selectedNames, onSelect, onClose }) {
  const [search, setSearch]           = useState('');
  const [customName, setCustomName]   = useState('');

  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => { onClose(); return true; });
    return () => sub.remove();
  }, [visible, onClose]);

  const allExercises = Object.values(PRESET_EXERCISES || {})
    .flat()
    .filter((e, i, arr) => arr.findIndex((x) => x.name === e.name) === i);

  const pool = (workoutType === 'Custom' || !(PRESET_EXERCISES?.[workoutType]?.length))
    ? allExercises
    : PRESET_EXERCISES[workoutType];

  const filtered = pool.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase())
  );

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill}>
      <View style={pick.root}>
        <StatusBar barStyle="light-content" />
        <View style={pick.header}>
          <TouchableOpacity onPress={onClose} style={pick.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#ffffff" />
          </TouchableOpacity>
          <Text style={pick.title}>Choose Exercises</Text>
          <TouchableOpacity onPress={onClose} style={pick.doneBtn}>
            <Text style={pick.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
        <View style={pick.searchWrap}>
          <Ionicons name="search-outline" size={16} color="#6b7a99" style={{ marginRight: 8 }} />
          <TextInput
            style={pick.searchInput}
            placeholder="Search exercises..."
            placeholderTextColor="#6b7a99"
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.name}
          style={{ flex: 1 }}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={<Text style={pick.emptyText}>No exercises found</Text>}
          renderItem={({ item }) => {
            const isSelected = selectedNames.includes(item.name);
            return (
              <TouchableOpacity
                style={[pick.exRow, isSelected && pick.exRowSelected]}
                onPress={() => onSelect(item)}
              >
                <Text style={pick.exEmoji}>{item.emoji}</Text>
                <View style={pick.exInfo}>
                  <Text style={[pick.exName, isSelected && { color: '#00f5c4' }]}>{item.name}</Text>
                  <Text style={pick.exMuscle}>{item.muscle}</Text>
                </View>
                <View style={[pick.checkCircle, isSelected && pick.checkCircleActive]}>
                  {isSelected && <Ionicons name="checkmark" size={14} color="#080b10" />}
                </View>
              </TouchableOpacity>
            );
          }}
          ListFooterComponent={
            <View style={pick.customSection}>
              <Text style={pick.customLabel}>CAN'T FIND IT? ADD CUSTOM</Text>
              <View style={pick.customRow}>
                <TextInput
                  style={pick.customInput}
                  placeholder="Exercise name..."
                  placeholderTextColor="#6b7a99"
                  value={customName}
                  onChangeText={setCustomName}
                />
                <TouchableOpacity
                  style={[pick.customBtn, !customName && { opacity: 0.4 }]}
                  disabled={!customName}
                  onPress={() => {
                    onSelect({ name: customName.trim(), emoji: '💪', muscle: 'Custom' });
                    setCustomName('');
                  }}
                >
                  <Text style={pick.customBtnText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          }
        />
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function LogWorkoutScreen({ route, navigation }) {
  const { date, editingWorkout: editingParam } = route.params || {};
  const { user }                               = useAuth();
  const { addWorkoutLocally, refresh }         = useWorkoutsContext();

  const DRAFT_KEY = user?.uid ? `workout_draft_${user.uid}` : null;

  // Step: 1 = choose preset/type, 2 = log exercises
  const [step, setStep]                           = useState(editingParam ? 2 : 1);
  const [workoutType, setWorkoutType]             = useState(editingParam?.type || 'Push');
  const [exercises, setExercises]                 = useState(() => {
    if (!editingParam) return [];
    return (editingParam.exercises || []).map((ex) => {
      const repsArr   = ex.reps    ? ex.reps.toString().split('/')   : [''];
      const weightArr = ex.weight  ? ex.weight.toString().split('/') : [''];
      const count     = ex.sets    || repsArr.length || 1;
      return {
        name: ex.name, emoji: ex.emoji || '💪', muscle: ex.muscle || '',
        sets: Array.from({ length: count }, (_, i) => ({
          reps: repsArr[i] || '', weight: weightArr[i] || '',
        })),
      };
    });
  });
  const [notes, setNotes]                         = useState(editingParam?.notes || '');
  const [pickerVisible, setPickerVisible]         = useState(false);
  const [userPresets, setUserPresets]             = useState([]);
  const [previewPreset, setPreviewPreset]         = useState(null);

  // Preset creation
  const [newPresetName, setNewPresetName]         = useState('');
  const [newPresetExercises, setNewPresetExercises] = useState([]);
  const [presetPickerVisible, setPresetPickerVisible] = useState(false);
  const [savingPreset, setSavingPreset]           = useState(false);
  const [editingPreset, setEditingPreset]         = useState(null);
  const [showCreatePreset, setShowCreatePreset]   = useState(false);

  // Load user presets
  useEffect(() => {
    if (!user?.uid) return;
    getUserPresets(user.uid).then(setUserPresets).catch(() => {});
  }, [user?.uid]);

  // Load draft (only for fresh logs, not edits)
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

  // Auto-save draft
  useEffect(() => {
    if (!DRAFT_KEY || editingParam) return;
    if (exercises.length === 0 && !notes) return;
    AsyncStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ workoutType, exercises, notes, date })
    ).catch(() => {});
  }, [workoutType, exercises, notes]);

  // Hardware back button
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (pickerVisible)         { setPickerVisible(false);     return true; }
      if (presetPickerVisible)   { setPresetPickerVisible(false); return true; }
      if (showCreatePreset)      { setShowCreatePreset(false);   return true; }
      if (previewPreset)         { setPreviewPreset(null);       return true; }
      if (step === 2 && !editingParam) { setStep(1);            return true; }
      navigation.goBack();
      return true;
    });
    return () => sub.remove();
  }, [pickerVisible, presetPickerVisible, showCreatePreset, previewPreset, step, editingParam]);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const applyPreset = (preset) => {
    setExercises(preset.exercises.map((e) => ({
      ...e,
      sets: e.sets?.length ? e.sets : [{ weight: '', reps: '' }],
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

  const updateSet     = (exIdx, setIdx, field, val) => {
    const u = [...exercises]; u[exIdx].sets[setIdx][field] = val; setExercises(u);
  };
  const addSet        = (exIdx) => {
    const u  = [...exercises];
    const ex = u[exIdx];
    u[exIdx].sets.push(ex.isCardio ? { minutes: '', seconds: '' } : { weight: '', reps: '' });
    setExercises(u);
  };
  const removeSet     = (exIdx, setIdx) => {
    const u = [...exercises];
    if (u[exIdx].sets.length === 1) return;
    u[exIdx].sets.splice(setIdx, 1);
    setExercises(u);
  };
  const removeExercise = (exIdx) => setExercises(exercises.filter((_, i) => i !== exIdx));

  const handleSave = () => {
    if (exercises.length === 0)
      return Alert.alert('Error', 'Select at least one exercise');

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

    if (flat.length === 0)
      return Alert.alert('Error', 'Add at least one exercise with valid data');

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
    if (!newPresetName.trim())        return Alert.alert('Name required', 'Give your preset a name.');
    if (newPresetExercises.length === 0) return Alert.alert('No exercises', 'Add at least one exercise.');
    setSavingPreset(true);
    const exData = newPresetExercises.map((e) => ({ name: e.name, emoji: e.emoji, muscle: e.muscle }));
    try {
      if (editingPreset) {
        const { doc, updateDoc } = require('firebase/firestore');
        const { db }             = require('../../services/firebase');
        await updateDoc(
          doc(db, 'presets', user.uid, 'userPresets', editingPreset.id),
          { name: newPresetName.trim(), exercises: exData }
        );
        setUserPresets((prev) =>
          prev.map((p) => p.id === editingPreset.id
            ? { ...p, name: newPresetName.trim(), exercises: exData }
            : p
          )
        );
        Alert.alert('Updated! ✅', `"${newPresetName.trim()}" preset updated.`);
      } else {
        const id = await savePreset(user.uid, { name: newPresetName.trim(), exercises: exData });
        setUserPresets((prev) => [...prev, { id, name: newPresetName.trim(), exercises: exData }]);
        Alert.alert('Saved! ✅', `"${newPresetName.trim()}" preset created.`);
      }
      setShowCreatePreset(false);
      setNewPresetName('');
      setNewPresetExercises([]);
      setEditingPreset(null);
    } catch { Alert.alert('Error', 'Could not save preset.'); }
    finally { setSavingPreset(false); }
  };

  const handleDeletePreset = (presetId) => {
    Alert.alert('Delete Preset', 'Remove this preset?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: () => {
          setUserPresets((prev) => prev.filter((p) => p.id !== presetId));
          deletePreset(user.uid, presetId).catch(() => {});
        },
      },
    ]);
  };

  const selectedExNames = exercises.map((e) => e.name);

  // ── Preset Preview ────────────────────────────────────────────────────────────
  if (previewPreset) {
    return (
      <View style={s.root}>
        <StatusBar barStyle="light-content" />
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => setPreviewPreset(null)}>
            <Ionicons name="arrow-back" size={22} color="#ffffff" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>{previewPreset.name}</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
          <Text style={s.sectionLabel}>{previewPreset.exercises?.length} EXERCISES</Text>
          {previewPreset.exercises?.map((ex, i) => (
            <Animated.View key={i} entering={FadeInDown.delay(i * 40).duration(300)} style={s.previewExRow}>
              <Text style={{ fontSize: 24 }}>{ex.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.previewExName}>{ex.name}</Text>
                <Text style={s.previewExMuscle}>{ex.muscle}</Text>
              </View>
              <Text style={s.previewExSets}>{ex.sets?.length || 1} sets</Text>
            </Animated.View>
          ))}
          <View style={{ height: 24 }} />
          <TouchableOpacity
            style={s.primaryBtn}
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
                onSave: (w) => addWorkoutLocally(w),
              });
            }}
          >
            <Ionicons name="play" size={18} color="#080b10" />
            <Text style={s.primaryBtnText}>Start Workout</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.secondaryBtn}
            onPress={() => { applyPreset(previewPreset); setPreviewPreset(null); setStep(2); }}
          >
            <Ionicons name="add-circle-outline" size={18} color="#6b7a99" />
            <Text style={s.secondaryBtnText}>Log Manually Instead</Text>
          </TouchableOpacity>
          <View style={{ height: 60 }} />
        </ScrollView>
      </View>
    );
  }

  // ── Create / Edit Preset ──────────────────────────────────────────────────────
  if (showCreatePreset) {
    return (
      <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <StatusBar barStyle="light-content" />
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => { setShowCreatePreset(false); setEditingPreset(null); setNewPresetName(''); setNewPresetExercises([]); }}>
            <Ionicons name="arrow-back" size={22} color="#ffffff" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>{editingPreset ? 'Edit Preset' : 'New Preset'}</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
          <Text style={s.fieldLabel}>Preset Name</Text>
          <TextInput
            style={s.notesInput}
            placeholder="e.g. My Push Day..."
            placeholderTextColor="#6b7a99"
            value={newPresetName}
            onChangeText={setNewPresetName}
          />
          <TouchableOpacity style={s.selectExBtn} onPress={() => setPresetPickerVisible(true)}>
            <Ionicons name="barbell-outline" size={20} color="#00f5c4" />
            <Text style={s.selectExText}>
              {newPresetExercises.length === 0 ? 'Select Exercises' : `${newPresetExercises.length} selected — Edit`}
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#6b7a99" />
          </TouchableOpacity>
          {newPresetExercises.map((ex, i) => (
            <View key={i} style={s.previewExRow}>
              <Text style={{ fontSize: 20 }}>{ex.emoji}</Text>
              <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 15, flex: 1 }}>{ex.name}</Text>
              <Text style={{ color: '#a0aec0', fontSize: 12 }}>{ex.muscle}</Text>
            </View>
          ))}
          <TouchableOpacity
            style={[s.primaryBtn, { marginTop: 24 }, (newPresetExercises.length === 0 || savingPreset) && { opacity: 0.5 }]}
            onPress={handleSavePreset}
            disabled={newPresetExercises.length === 0 || savingPreset}
          >
            <Text style={s.primaryBtnText}>{editingPreset ? '✏️ Update Preset' : '💾 Save Preset'}</Text>
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
          />
        )}
      </KeyboardAvoidingView>
    );
  }

  // ── Step 2: Log Exercises ─────────────────────────────────────────────────────
  if (step === 2) {
    return (
      <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <StatusBar barStyle="light-content" />
        <View style={s.header}>
          {!editingParam ? (
            <TouchableOpacity style={s.backBtn} onPress={() => setStep(1)}>
              <Ionicons name="arrow-back" size={22} color="#ffffff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={22} color="#ffffff" />
            </TouchableOpacity>
          )}
          <Text style={s.headerTitle}>{editingParam ? 'Edit Workout' : workoutType}</Text>
          <TouchableOpacity
            style={[s.saveHeaderBtn, exercises.length === 0 && { opacity: 0.4 }]}
            onPress={handleSave}
            disabled={exercises.length === 0}
          >
            <Text style={s.saveHeaderBtnText}>{editingParam ? 'Update' : 'Save'}</Text>
          </TouchableOpacity>
        </View>

        {/* Step dots */}
        {!editingParam && (
          <View style={s.stepRow}>
            <View style={[s.stepDot, s.stepDotActive]} />
            <View style={[s.stepLine, s.stepLineActive]} />
            <View style={[s.stepDot, s.stepDotActive]} />
          </View>
        )}

        <ScrollView
          contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity style={s.selectExBtn} onPress={() => setPickerVisible(true)}>
            <Ionicons name="barbell-outline" size={20} color="#00f5c4" />
            <Text style={s.selectExText}>
              {exercises.length === 0 ? 'Select Exercises' : `${exercises.length} exercises — Edit`}
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#6b7a99" />
          </TouchableOpacity>

          {exercises.map((ex, exIdx) => (
            <Animated.View key={ex.name} entering={FadeInDown.duration(250)} style={s.exCard}>
              <View style={s.exCardHeader}>
                <Text style={{ fontSize: 28 }}>{ex.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.exCardName}>{ex.name}</Text>
                  <Text style={s.exCardMuscle}>{ex.muscle}</Text>
                </View>
                <TouchableOpacity onPress={() => removeExercise(exIdx)}>
                  <Ionicons name="close-circle-outline" size={22} color="#ff6b6b" />
                </TouchableOpacity>
              </View>
              <View style={s.setHeaderRow}>
                <Text style={s.setHeaderCell}>SET</Text>
                <Text style={s.setHeaderCell}>{ex.isCardio ? 'MIN' : 'WEIGHT (kg)'}</Text>
                <Text style={s.setHeaderCell}>{ex.isCardio ? 'SEC' : 'REPS'}</Text>
                <View style={{ width: 28 }} />
              </View>
              {ex.sets.map((set, setIdx) => (
                <View key={setIdx} style={s.setRow}>
                  <View style={s.setNumBadge}>
                    <Text style={s.setNumText}>{setIdx + 1}</Text>
                  </View>
                  {ex.isCardio ? (
                    <>
                      <TextInput style={s.setInput} placeholder="min" placeholderTextColor="#6b7a99" value={set.minutes} onChangeText={(v) => updateSet(exIdx, setIdx, 'minutes', v)} keyboardType="numeric" />
                      <TextInput style={s.setInput} placeholder="sec" placeholderTextColor="#6b7a99" value={set.seconds} onChangeText={(v) => updateSet(exIdx, setIdx, 'seconds', v)} keyboardType="numeric" />
                    </>
                  ) : (
                    <>
                      <TextInput style={s.setInput} placeholder="0" placeholderTextColor="#6b7a99" value={set.weight} onChangeText={(v) => updateSet(exIdx, setIdx, 'weight', v)} keyboardType="decimal-pad" />
                      <TextInput style={s.setInput} placeholder="0" placeholderTextColor="#6b7a99" value={set.reps}   onChangeText={(v) => updateSet(exIdx, setIdx, 'reps',   v)} keyboardType="numeric"      />
                    </>
                  )}
                  <TouchableOpacity onPress={() => removeSet(exIdx, setIdx)}>
                    <Ionicons name="remove-circle-outline" size={20} color={ex.sets.length > 1 ? '#ff6b6b' : '#1e2535'} />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={s.addSetBtn} onPress={() => addSet(exIdx)}>
                <Ionicons name="add-circle-outline" size={17} color="#00f5c4" />
                <Text style={s.addSetText}>Add Set</Text>
              </TouchableOpacity>
            </Animated.View>
          ))}

          <Text style={s.fieldLabel}>Notes (optional)</Text>
          <TextInput
            style={s.notesInput}
            placeholder="How did it go?"
            placeholderTextColor="#6b7a99"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />

          <TouchableOpacity
            style={[s.primaryBtn, { marginTop: 24 }, exercises.length === 0 && { opacity: 0.5 }]}
            onPress={handleSave}
            disabled={exercises.length === 0}
          >
            <Text style={s.primaryBtnText}>{editingParam ? '✏️ Update Workout' : '🔥 Save Workout'}</Text>
          </TouchableOpacity>
        </ScrollView>

        {pickerVisible && (
          <ExercisePicker
            visible={pickerVisible}
            workoutType={workoutType}
            selectedNames={selectedExNames}
            onSelect={handlePickExercise}
            onClose={() => setPickerVisible(false)}
          />
        )}
      </KeyboardAvoidingView>
    );
  }

  // ── Step 1: Choose Preset / Type ──────────────────────────────────────────────
  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#ffffff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Start Workout</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Step dots */}
      <View style={s.stepRow}>
        <View style={[s.stepDot, s.stepDotActive]} />
        <View style={s.stepLine} />
        <View style={s.stepDot} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Create preset CTA */}
        <Animated.View entering={FadeInDown.duration(350)}>
          <TouchableOpacity style={s.createPresetBtn} onPress={() => setShowCreatePreset(true)}>
            <View style={s.createPresetIcon}>
              <Ionicons name="add" size={22} color="#00f5c4" />
            </View>
            <Text style={s.createPresetText}>Create New Preset</Text>
            <Ionicons name="chevron-forward" size={18} color="#6b7a99" />
          </TouchableOpacity>
        </Animated.View>

        {/* My Presets */}
        {userPresets.length > 0 && (
          <Animated.View entering={FadeInDown.delay(60).duration(350)}>
            <Text style={s.sectionLabel}>MY PRESETS</Text>
            {userPresets.map((preset) => (
              <View key={preset.id} style={s.presetCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.presetCardName}>{preset.name}</Text>
                    <Text style={s.presetCardSub}>{preset.exercises.length} exercises</Text>
                  </View>
                  <TouchableOpacity
                    style={s.presetCardIconBtn}
                    onPress={() => {
                      setEditingPreset(preset);
                      setNewPresetName(preset.name);
                      setNewPresetExercises(preset.exercises.map((e) => ({ name: e.name, emoji: e.emoji || '💪', muscle: e.muscle || '' })));
                      setShowCreatePreset(true);
                    }}
                  >
                    <Ionicons name="create-outline" size={16} color="#54a0ff" />
                  </TouchableOpacity>
                  <TouchableOpacity style={s.presetCardIconBtn} onPress={() => handleDeletePreset(preset.id)}>
                    <Ionicons name="trash-outline" size={16} color="#ff6b6b" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={s.presetOpenBtn}
                    onPress={() => setPreviewPreset(preset)}
                  >
                    <Text style={s.presetOpenText}>Open</Text>
                    <Ionicons name="chevron-forward" size={14} color="#080b10" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </Animated.View>
        )}

        {/* Default Presets — big emoji cards */}
        <Animated.View entering={FadeInDown.delay(120).duration(350)}>
          <Text style={s.sectionLabel}>QUICK START</Text>
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
                style={[s.carouselCard, { width: CARD_WIDTH }]}
                onPress={() => navigation.navigate('WorkoutSession', {
                  workout: { type: preset.name, exercises: preset.exercises },
                  date,
                  onSave: (w) => addWorkoutLocally(w),
                })}
                activeOpacity={0.88}
              >
                {/* Hero emoji — swap for Lottie later */}
                <View style={s.carouselHeroWrap}>
                  <Text style={s.carouselHeroEmoji}>{PRESET_HERO_EMOJI[preset.id]}</Text>
                </View>

                {/* Name + exercise count */}
                <Text style={s.carouselCardName}>{preset.name}</Text>
                <Text style={s.carouselCardSub}>{preset.exercises.length} exercises</Text>

                {/* Exercise pills */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10, marginBottom: 16 }}>
                  {preset.exercises.slice(0, 3).map((ex, i) => (
                    <View key={i} style={s.exPill}>
                      <Text style={{ fontSize: 11 }}>{ex.emoji}</Text>
                      <Text style={s.exPillText}>{ex.name}</Text>
                    </View>
                  ))}
                  {preset.exercises.length > 3 && (
                    <View style={s.exPill}>
                      <Text style={s.exPillText}>+{preset.exercises.length - 3} more</Text>
                    </View>
                  )}
                </View>

                <View style={s.carouselStartBtn}>
                  <Ionicons name="play" size={14} color="#080b10" />
                  <Text style={s.carouselStartBtnText}>Start Workout</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:             { flex: 1, backgroundColor: '#080b10' },
  header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12, borderBottomWidth: 1, borderColor: '#1a2133' },
  backBtn:          { width: 40, height: 40, borderRadius: 20, backgroundColor: '#111827', borderWidth: 1, borderColor: '#1a2133', alignItems: 'center', justifyContent: 'center' },
  headerTitle:      { color: '#f0f4ff', fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  saveHeaderBtn:    { backgroundColor: '#00c896', borderRadius: 999, paddingHorizontal: 18, paddingVertical: 8 },
  saveHeaderBtnText:{ color: '#080b10', fontWeight: '800', fontSize: 14 },

  stepRow:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 0 },
  stepDot:          { width: 10, height: 10, borderRadius: 5, backgroundColor: '#1a2133', borderWidth: 1, borderColor: '#2a3550' },
  stepDotActive:    { backgroundColor: '#00c896', borderColor: '#00c896' },
  stepLine:         { width: 60, height: 2, backgroundColor: '#1a2133' },
  stepLineActive:   { backgroundColor: '#00c896' },

  sectionLabel:     { color: '#4a5578', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginTop: 20, marginBottom: 10 },
  fieldLabel:       { color: '#4a5578', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 16 },

  createPresetBtn:  { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,200,150,0.07)', borderRadius: 16, padding: 16, borderWidth: 1.5, borderColor: 'rgba(0,200,150,0.22)', gap: 12 },
  createPresetIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,200,150,0.12)', alignItems: 'center', justifyContent: 'center' },
  createPresetText: { flex: 1, color: '#00c896', fontWeight: '700', fontSize: 15 },

  presetCard:       { backgroundColor: '#111827', borderRadius: 18, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#1a2133' },
  presetCardName:   { color: '#f0f4ff', fontWeight: '700', fontSize: 15 },
  presetCardSub:    { color: '#4a5578', fontSize: 12, marginTop: 2 },
  presetCardIconBtn:{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#0d1117', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#1a2133', marginLeft: 8 },
  presetOpenBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#00c896', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, marginLeft: 8 },
  presetOpenText:   { color: '#080b10', fontWeight: '700', fontSize: 13 },

  carouselCard:     { backgroundColor: '#111827', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#1a2133', minHeight: 260 },
  carouselHeroWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: 16, height: 100, backgroundColor: 'rgba(0,200,150,0.05)', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(0,200,150,0.08)' },
  carouselHeroEmoji:{ fontSize: 62 },
  carouselCardName: { color: '#f0f4ff', fontWeight: '800', fontSize: 22 },
  carouselCardSub:  { color: '#4a5578', fontSize: 13, fontWeight: '500', marginTop: 2 },
  carouselStartBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#00c896', borderRadius: 14, paddingVertical: 12, marginTop: 14 },
  carouselStartBtnText: { color: '#080b10', fontWeight: '800', fontSize: 14 },
  exPill:           { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#0d1117', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5, borderWidth: 1, borderColor: '#1a2133' },
  exPillText:       { color: '#6b7a99', fontSize: 11, fontWeight: '500' },

  selectExBtn:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0d1117', borderRadius: 16, padding: 16, borderWidth: 1.5, borderColor: '#00c896', gap: 8, marginBottom: 8 },
  selectExText:     { flex: 1, color: '#f0f4ff', fontWeight: '600', fontSize: 15 },

  exCard:           { backgroundColor: '#111827', borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#1a2133', borderTopWidth: 3, borderTopColor: '#00c896' },
  exCardHeader:     { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 },
  exCardName:       { color: '#f0f4ff', fontWeight: '700', fontSize: 15 },
  exCardMuscle:     { color: '#4a5578', fontSize: 12, marginTop: 2 },

  setHeaderRow:     { flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingHorizontal: 2 },
  setHeaderCell:    { flex: 1, color: '#4a5578', fontSize: 10, fontWeight: '700', letterSpacing: 1, textAlign: 'center' },
  setRow:           { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  setNumBadge:      { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,200,150,0.12)', alignItems: 'center', justifyContent: 'center' },
  setNumText:       { color: '#00c896', fontWeight: '800', fontSize: 13 },
  setInput:         { flex: 1, backgroundColor: '#0d1117', borderRadius: 10, paddingVertical: 10, color: '#f0f4ff', fontWeight: '700', fontSize: 17, textAlign: 'center', borderWidth: 1, borderColor: '#1a2133' },
  addSetBtn:        { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 8, marginTop: 4 },
  addSetText:       { color: '#00c896', fontWeight: '600', fontSize: 14 },

  notesInput:       { backgroundColor: '#0d1117', borderRadius: 14, padding: 16, color: '#f0f4ff', borderWidth: 1, borderColor: '#1a2133', textAlignVertical: 'top', minHeight: 80, fontSize: 14 },

  primaryBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#00c896', borderRadius: 18, height: 56 },
  primaryBtnText:   { color: '#080b10', fontWeight: '800', fontSize: 17 },
  secondaryBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#111827', borderRadius: 18, height: 52, marginTop: 12, borderWidth: 1, borderColor: '#1a2133' },
  secondaryBtnText: { color: '#4a5578', fontWeight: '600', fontSize: 14 },

  previewExRow:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111827', borderRadius: 16, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#1a2133', gap: 12 },
  previewExName:    { color: '#f0f4ff', fontWeight: '600', fontSize: 15 },
  previewExMuscle:  { color: '#4a5578', fontSize: 12, marginTop: 2 },
  previewExSets:    { color: '#4a5578', fontSize: 13 },
});

const pick = StyleSheet.create({
  root:           { flex: 1, backgroundColor: '#080b10', paddingTop: 56 },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 12, borderBottomWidth: 1, borderColor: '#1a2133', marginBottom: 8 },
  backBtn:        { width: 38, height: 38, borderRadius: 19, backgroundColor: '#111827', borderWidth: 1, borderColor: '#1a2133', alignItems: 'center', justifyContent: 'center' },
  title:          { fontSize: 18, fontWeight: '800', color: '#f0f4ff' },
  doneBtn:        { backgroundColor: '#00c896', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 7 },
  doneBtnText:    { color: '#080b10', fontWeight: '800', fontSize: 13 },
  searchWrap:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0d1117', borderRadius: 14, borderWidth: 1, borderColor: '#1a2133', paddingHorizontal: 16, height: 46, marginBottom: 10, marginHorizontal: 24 },
  searchInput:    { flex: 1, color: '#f0f4ff', fontSize: 14 },
  exRow:          { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0d1117', borderRadius: 16, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: '#1a2133', marginHorizontal: 24 },
  exRowSelected:  { borderColor: '#00c896', backgroundColor: 'rgba(0,200,150,0.07)' },
  exEmoji:        { fontSize: 26, marginRight: 16 },
  exInfo:         { flex: 1 },
  exName:         { color: '#f0f4ff', fontWeight: '600', fontSize: 15 },
  exMuscle:       { color: '#4a5578', fontSize: 12, marginTop: 2 },
  checkCircle:    { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: '#1a2133', alignItems: 'center', justifyContent: 'center' },
  checkCircleActive: { backgroundColor: '#00c896', borderColor: '#00c896' },
  emptyText:      { color: '#4a5578', textAlign: 'center', paddingVertical: 24, fontSize: 14 },
  customSection:  { marginTop: 24, marginBottom: 32, marginHorizontal: 24 },
  customLabel:    { color: '#4a5578', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  customRow:      { flexDirection: 'row', gap: 8 },
  customInput:    { flex: 1, backgroundColor: '#111827', borderRadius: 14, borderWidth: 1, borderColor: '#1a2133', paddingHorizontal: 16, color: '#f0f4ff', height: 48, fontSize: 14 },
  customBtn:      { backgroundColor: '#00c896', borderRadius: 14, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center', height: 48 },
  customBtnText:  { color: '#080b10', fontWeight: '800', fontSize: 14 },
});
