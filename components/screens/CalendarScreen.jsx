import { useState, useEffect, useRef, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal, FlatList, BackHandler, Dimensions } from 'react-native';
import { Calendar } from 'react-native-calendars';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useWorkoutsContext } from '../../hooks/WorkoutsContext';
import { logWorkout, deleteWorkout, markRestDay } from '../../services/workoutService';
import { getUserPresets, savePreset, deletePreset } from '../../services/presetService';
import WorkoutShareSheet from './WorkoutShareSheet';
import { WORKOUT_TYPES, PRESET_EXERCISES } from '../../constants/exercises';
import { Colors, Spacing, Radius } from '../../constants/theme';
import { format, parseISO, isBefore, startOfDay } from 'date-fns';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TODAY = format(new Date(), 'yyyy-MM-dd');

// Fallback exercises for presets whose PRESET_EXERCISES key may not exist yet
const HIIT_FALLBACK = [
  { name: 'Burpees',        emoji: '🔥', muscle: 'Full Body' },
  { name: 'Jump Squats',    emoji: '⚡', muscle: 'Legs' },
  { name: 'Mountain Climbers', emoji: '🏔️', muscle: 'Core' },
  { name: 'High Knees',     emoji: '🦵', muscle: 'Cardio' },
  { name: 'Box Jumps',      emoji: '📦', muscle: 'Legs' },
  { name: 'Kettlebell Swings', emoji: '🏋️', muscle: 'Full Body' },
];
const CARDIO_FALLBACK = [
  { name: 'Treadmill Run',  emoji: '🏃', muscle: 'Cardio' },
  { name: 'Jump Rope',      emoji: '🪢', muscle: 'Cardio' },
  { name: 'Rowing Machine', emoji: '🚣', muscle: 'Cardio' },
  { name: 'Cycling',        emoji: '🚴', muscle: 'Cardio' },
  { name: 'Stair Climber',  emoji: '🪜', muscle: 'Cardio' },
  { name: 'Elliptical',     emoji: '🔄', muscle: 'Cardio' },
];
const FULLBODY_FALLBACK = [
  { name: 'Deadlift',       emoji: '🏋️', muscle: 'Full Body' },
  { name: 'Pull-Ups',       emoji: '💪', muscle: 'Back' },
  { name: 'Push-Ups',       emoji: '👊', muscle: 'Chest' },
  { name: 'Squats',         emoji: '🦵', muscle: 'Legs' },
  { name: 'Overhead Press', emoji: '🙌', muscle: 'Shoulders' },
  { name: 'Plank',          emoji: '🧱', muscle: 'Core' },
];

const toPresetEx = (e) => ({ ...e, sets: [{ weight: '', reps: '' }] });

const DEFAULT_PRESETS = [
  { id: 'default_push',      name: '💪 Push',       exercises: (PRESET_EXERCISES?.['Push']       || []).slice(0, 6).map(toPresetEx) },
  { id: 'default_pull',      name: '🔝 Pull',       exercises: (PRESET_EXERCISES?.['Pull']       || []).slice(0, 6).map(toPresetEx) },
  { id: 'default_legs',      name: '🦵 Legs',       exercises: (PRESET_EXERCISES?.['Legs']       || []).slice(0, 6).map(toPresetEx) },
  { id: 'default_upper',     name: '🏋️ Upper Body', exercises: (PRESET_EXERCISES?.['Upper Body'] || []).slice(0, 6).map(toPresetEx) },
  { id: 'default_lower',     name: '🍑 Lower Body', exercises: (PRESET_EXERCISES?.['Lower Body'] || []).slice(0, 6).map(toPresetEx) },
  { id: 'default_fullbody',  name: '⚡ Full Body',  exercises: (PRESET_EXERCISES?.['Full Body']  || FULLBODY_FALLBACK).slice(0, 6).map(toPresetEx) },
  { id: 'default_hiit',      name: '🔥 HIIT',       exercises: (PRESET_EXERCISES?.['HIIT']       || HIIT_FALLBACK).slice(0, 6).map(toPresetEx) },
  { id: 'default_cardio',    name: '🏃 Cardio',     exercises: (PRESET_EXERCISES?.['Cardio']     || CARDIO_FALLBACK).slice(0, 6).map(toPresetEx) },
];

const DAY_COLORS = {
  workout: { bg: 'rgba(0,245,196,0.18)',  border: '#00f5c4', text: '#00f5c4' },
  rest:    { bg: 'rgba(255,159,67,0.18)', border: '#ff9f43', text: '#ff9f43' },
  missed:  { bg: 'rgba(255,107,107,0.18)',border: '#ff6b6b', text: '#ff6b6b' },
};

// ─── Default Preset Carousel ──────────────────────────────────────────────────
const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = SCREEN_WIDTH - 80;
const CARD_MARGIN = 12;

function DefaultPresetCarousel({ presets, onSelect }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef(null);
  const tripled = [...presets, ...presets, ...presets];
  const offset = presets.length;

  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToIndex({ index: offset, animated: false });
    }, 100);
  }, []);

  const handleScrollEnd = (e) => {
    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.round(x / (CARD_WIDTH + CARD_MARGIN));
    const realIdx = idx % presets.length;
    setActiveIndex(realIdx);
    if (idx < offset) {
      flatListRef.current?.scrollToIndex({ index: idx + presets.length, animated: false });
    } else if (idx >= offset + presets.length) {
      flatListRef.current?.scrollToIndex({ index: idx - presets.length, animated: false });
    }
  };

  return (
    <View style={{ marginBottom: 8 }}>
      <FlatList
        ref={flatListRef}
        data={tripled}
        horizontal
        keyExtractor={(item, i) => item.id + '_' + i}
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + CARD_MARGIN}
        decelerationRate="fast"
        onMomentumScrollEnd={handleScrollEnd}
        getItemLayout={(_, index) => ({ length: CARD_WIDTH + CARD_MARGIN, offset: (CARD_WIDTH + CARD_MARGIN) * index, index })}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[carouselStyles.card, { width: CARD_WIDTH, marginRight: CARD_MARGIN }]}
            onPress={() => onSelect(item)}
            activeOpacity={0.85}
          >
            <View style={carouselStyles.cardHeader}>
              <Text style={carouselStyles.cardName}>{item.name}</Text>
              <Ionicons name="arrow-forward-circle" size={24} color="#00f5c4" />
            </View>
            <View style={carouselStyles.exList}>
              {item.exercises.slice(0, 4).map((ex, i) => (
                <View key={i} style={carouselStyles.exPill}>
                  <Text style={carouselStyles.exPillEmoji}>{ex.emoji}</Text>
                  <Text style={carouselStyles.exPillText}>{ex.name}</Text>
                </View>
              ))}
              {item.exercises.length > 4 && (
                <View style={carouselStyles.exPill}>
                  <Text style={carouselStyles.exPillText}>+{item.exercises.length - 4} more</Text>
                </View>
              )}
            </View>
            <TouchableOpacity style={carouselStyles.startBtn} onPress={() => onSelect(item)}>
              <Ionicons name="play" size={16} color="#080b10" />
              <Text style={carouselStyles.startBtnText}>Start Workout</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />
      <View style={carouselStyles.dots}>
        {presets.map((_, i) => (
          <View key={i} style={[carouselStyles.dot, i === activeIndex && carouselStyles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

const carouselStyles = StyleSheet.create({
  card: { backgroundColor: '#131822', borderRadius: 20, padding: 18, borderWidth: 1.5, borderColor: '#1e2535', minHeight: 160 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  cardName: { color: '#ffffff', fontWeight: '800', fontSize: 20 },
  exList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  exPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#0e1219', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: '#1e2535' },
  exPillEmoji: { fontSize: 14 },
  exPillText: { color: '#a0aec0', fontSize: 12, fontWeight: '500' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 12 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#1e2535' },
  dotActive: { width: 18, backgroundColor: '#00f5c4', borderRadius: 3 },
  startBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#00f5c4', borderRadius: 12, paddingVertical: 12, marginTop: 14 },
  startBtnText: { color: '#080b10', fontWeight: '800', fontSize: 14 },
});


function ExercisePicker({ visible, workoutType, selectedNames, onSelect, onClose }) {
  const [search, setSearch] = useState('');
  const [customName, setCustomName] = useState('');

  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => { onClose(); return true; });
    return () => sub.remove();
  }, [visible, onClose]);

  const allExercises = Object.values(PRESET_EXERCISES || {}).flat().filter((e, i, arr) => arr.findIndex((x) => x.name === e.name) === i);
  const pool = (workoutType === 'Custom' || !(PRESET_EXERCISES?.[workoutType]?.length)) ? allExercises : PRESET_EXERCISES[workoutType];
  const filtered = pool.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={pick.root}>
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
          <TextInput style={pick.searchInput} placeholder="Search exercises..." placeholderTextColor="#6b7a99" value={search} onChangeText={setSearch} />
        </View>
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.name}
          style={{ flex: 1, backgroundColor: '#080b10' }}
          ListEmptyComponent={<Text style={pick.emptyText}>No exercises found</Text>}
          renderItem={({ item }) => {
            const isSelected = selectedNames.includes(item.name);
            return (
              <TouchableOpacity style={[pick.exRow, isSelected && pick.exRowSelected]} onPress={() => onSelect(item)}>
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
              <Text style={pick.customLabel}>CANT FIND IT? ADD CUSTOM</Text>
              <View style={pick.customRow}>
                <TextInput style={pick.customInput} placeholder="Exercise name..." placeholderTextColor="#6b7a99" value={customName} onChangeText={setCustomName} />
                <TouchableOpacity style={[pick.customBtn, !customName && { opacity: 0.4 }]} disabled={!customName} onPress={() => { onSelect({ name: customName.trim(), emoji: '💪', muscle: 'Custom' }); setCustomName(''); }}>
                  <Text style={pick.customBtnText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          }
        />
      </View>
    </Modal>
  );
}

export default function CalendarScreen({ navigation, route }) {
  const { user, userData } = useAuth();
  const { workouts, restDays, refresh, addWorkoutLocally, removeWorkoutLocally, addRestDayLocally } = useWorkoutsContext();

  const [selected, setSelected] = useState(TODAY);
  const [logModalVisible, setLogModalVisible] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState(null);
  const [shareWorkout, setShareWorkout] = useState(null);
  const [userPresets, setUserPresets] = useState([]);
  const [presetModalVisible, setPresetModalVisible] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetExercises, setNewPresetExercises] = useState([]);
  const [presetPickerVisible, setPresetPickerVisible] = useState(false);
  const [savingPreset, setSavingPreset] = useState(false);
  const [editingPreset, setEditingPreset] = useState(null);
  const [logStep, setLogStep] = useState(1);
  const [previewPreset, setPreviewPreset] = useState(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const carouselRef = useRef(null);
  const DRAFT_KEY = user?.uid ? `workout_draft_${user.uid}` : null;
  const [pickerVisible, setPickerVisible] = useState(false);
  const [workoutType, setWorkoutType] = useState('Push');
  const [notes, setNotes] = useState('');
  const [exercises, setExercises] = useState([]);

  useEffect(() => {
    if (!DRAFT_KEY || !logModalVisible || editingWorkout) return;
    if (exercises.length === 0 && !notes) return;
    AsyncStorage.setItem(DRAFT_KEY, JSON.stringify({ workoutType, exercises, notes, date: selected })).catch(() => {});
  }, [workoutType, exercises, notes]);

  useEffect(() => {
    if (!user?.uid) return;
    getUserPresets(user.uid).then(setUserPresets).catch(() => {});
  }, [user?.uid]);

  // Refresh workouts when returning from WorkoutSession
  useFocusEffect(useCallback(() => {
    refresh();
  }, []));

  const workoutDates = new Set(workouts.map((w) => w.date));
  const restDatesSet = new Set(restDays);
  const markedDates = {};

  workouts.forEach((w) => {
    markedDates[w.date] = { customStyles: { container: { backgroundColor: DAY_COLORS.workout.bg, borderRadius: 8, borderWidth: 1.5, borderColor: DAY_COLORS.workout.border }, text: { color: DAY_COLORS.workout.text, fontWeight: '800' } } };
  });
  restDays.forEach((date) => {
    if (!workoutDates.has(date)) {
      markedDates[date] = { customStyles: { container: { backgroundColor: DAY_COLORS.rest.bg, borderRadius: 8, borderWidth: 1.5, borderColor: DAY_COLORS.rest.border }, text: { color: DAY_COLORS.rest.text, fontWeight: '800' } } };
    }
  });

  const allActivityDates = [...workoutDates, ...restDatesSet].sort();
  const firstActivityDate = allActivityDates.length > 0 ? allActivityDates[0] : null;
  if (firstActivityDate) {
    for (let i = 1; i <= 365; i++) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const dateStr = format(d, 'yyyy-MM-dd');
      if (dateStr < firstActivityDate) break;
      if (!workoutDates.has(dateStr) && !restDatesSet.has(dateStr)) {
        markedDates[dateStr] = { customStyles: { container: { backgroundColor: DAY_COLORS.missed.bg, borderRadius: 8, borderWidth: 1.5, borderColor: DAY_COLORS.missed.border }, text: { color: DAY_COLORS.missed.text, fontWeight: '800' } } };
      }
    }
  }

  const existing = markedDates[selected]?.customStyles || {};
  markedDates[selected] = { customStyles: { container: { ...(existing.container || {}), borderWidth: 2.5, borderColor: '#ffffff' }, text: existing.text || { color: Colors.text, fontWeight: '800' } } };

  const dayWorkouts = workouts.filter((w) => w.date === selected);
  const isRestDay = restDatesSet.has(selected);
  const isPast = selected < TODAY;
  const isToday = selected === TODAY;
  const isFuture = selected > TODAY;
  const isMissed = isPast && !workoutDates.has(selected) && !restDatesSet.has(selected) && firstActivityDate !== null && selected >= firstActivityDate;

  const applyPreset = (preset) => {
    setExercises(preset.exercises.map((e) => ({ ...e, sets: e.sets?.length ? e.sets : [{ weight: '', reps: '' }] })));
    const typeName = preset.name.replace(/^.+? /, '').trim();
    const matched = ['Push','Pull','Legs','Upper Body','Lower Body','Full Body','Cardio','HIIT','Mobility'].find((t) => typeName.toLowerCase().includes(t.toLowerCase()));
    if (matched) setWorkoutType(matched);
  };

  const openEditPreset = (preset) => {
    setEditingPreset(preset);
    setNewPresetName(preset.name);
    setNewPresetExercises(preset.exercises.map((e) => ({ name: e.name, emoji: e.emoji || '💪', muscle: e.muscle || '' })));
    setPresetModalVisible(true);
  };

  const handleSavePreset = async () => {
    if (!newPresetName.trim()) return Alert.alert('Name required', 'Give your preset a name.');
    if (newPresetExercises.length === 0) return Alert.alert('No exercises', 'Add at least one exercise.');
    setSavingPreset(true);
    const exData = newPresetExercises.map((e) => ({ name: e.name, emoji: e.emoji, muscle: e.muscle }));
    try {
      if (editingPreset) {
        // Update existing
        const { doc, updateDoc } = require('firebase/firestore');
        const { db } = require('../../services/firebase');
        await updateDoc(doc(db, 'presets', user.uid, 'userPresets', editingPreset.id), { name: newPresetName.trim(), exercises: exData });
        setUserPresets((prev) => prev.map((p) => p.id === editingPreset.id ? { ...p, name: newPresetName.trim(), exercises: exData } : p));
        Alert.alert('Updated! ✅', '"' + newPresetName.trim() + '" preset updated.');
      } else {
        const id = await savePreset(user.uid, { name: newPresetName.trim(), exercises: exData });
        setUserPresets((prev) => [...prev, { id, name: newPresetName.trim(), exercises: exData }]);
        Alert.alert('Saved! ✅', '"' + newPresetName.trim() + '" preset created.');
      }
      setPresetModalVisible(false); setNewPresetName(''); setNewPresetExercises([]); setEditingPreset(null);
    } catch { Alert.alert('Error', 'Could not save preset.'); }
    finally { setSavingPreset(false); }
  };

  const handleDeletePreset = (presetId) => {
    Alert.alert('Delete Preset', 'Remove this preset?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { setUserPresets((prev) => prev.filter((p) => p.id !== presetId)); deletePreset(user.uid, presetId).catch(() => {}); } },
    ]);
  };

  const openEditModal = (workout) => {
    setEditingWorkout(workout); setWorkoutType(workout.type || 'Push'); setNotes(workout.notes || '');
    const restored = (workout.exercises || []).map((ex) => {
      const repsArr = ex.reps ? ex.reps.toString().split('/') : [''];
      const weightArr = ex.weight ? ex.weight.toString().split('/') : [''];
      const count = ex.sets || repsArr.length || 1;
      return { name: ex.name, emoji: ex.emoji || '💪', muscle: ex.muscle || '', sets: Array.from({ length: count }, (_, i) => ({ reps: repsArr[i] || '', weight: weightArr[i] || '' })) };
    });
    setExercises(restored); setLogStep(2); setLogModalVisible(true);
  };

  const handleDayPress = (day) => {
    if (day.dateString > TODAY) { Alert.alert('Future date', "You can't log workouts for future dates!"); return; }
    setSelected(day.dateString);
  };

  const handleMarkRest = () => {
    if (selected !== TODAY) return;
    Alert.alert('Mark as Rest Day?', 'This will count toward your streak.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Mark Rest', onPress: () => { addRestDayLocally(TODAY); markRestDay(user.uid, TODAY).catch(() => { Alert.alert('Error', 'Could not save rest day.'); refresh(); }); } },
    ]);
  };

  const handlePickExercise = (item) => {
    const exists = exercises.find((e) => e.name === item.name);
    if (exists) setExercises(exercises.filter((e) => e.name !== item.name));
    else {
      const cardioKw = ['running','cycling','jump rope','rowing','swimming','elliptical','stair','walk','jog','sprint','treadmill','cardio','burpee','mountain climber','box jump','skipping','hiit','bike','run'];
      const isCardio = cardioKw.some((k) => item.name.toLowerCase().includes(k) || (item.muscle||'').toLowerCase().includes('cardio'));
      const defaultSet = isCardio ? { minutes: '', seconds: '' } : { weight: '', reps: '' };
      setExercises([...exercises, { name: item.name, emoji: item.emoji, muscle: item.muscle, isCardio, sets: [defaultSet] }]);
    }
  };

  const updateSet = (exIdx, setIdx, field, val) => { const updated = [...exercises]; updated[exIdx].sets[setIdx][field] = val; setExercises(updated); };
  const addSet = (exIdx) => { const updated = [...exercises]; const ex = updated[exIdx]; const isCardio = ex.isCardio || false; const newSet = isCardio ? { minutes: '', seconds: '' } : { weight: '', reps: '' }; updated[exIdx].sets.push(newSet); setExercises(updated); };
  const removeSet = (exIdx, setIdx) => { const updated = [...exercises]; if (updated[exIdx].sets.length === 1) return; updated[exIdx].sets.splice(setIdx, 1); setExercises(updated); };
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
        sets: ex.sets.length,
        reps: ex.sets.map((s) => s.reps || '0').join('/'),
        weight: ex.sets.map((s) => s.weight || '0').join('/'),
        minutes: ex.sets.map((s) => s.minutes || '0').join('/'),
        seconds: ex.sets.map((s) => s.seconds || '0').join('/'),
        isCardio: ex.isCardio || false,
      }));
    if (flat.length === 0) return Alert.alert('Error', 'Add at least one exercise with valid data');
    setLogModalVisible(false); setExercises([]); setNotes('');
    if (editingWorkout) {
      const updated = { ...editingWorkout, type: workoutType, exercises: flat, notes };
      addWorkoutLocally(updated); refresh();
      const { doc, updateDoc } = require('firebase/firestore');
      const { db } = require('../../services/firebase');
      updateDoc(doc(db, 'workouts', editingWorkout.id), { type: workoutType, exercises: flat, notes }).then(() => refresh()).catch(() => { Alert.alert('Error', 'Failed to update workout.'); refresh(); });
      setEditingWorkout(null);
    } else {
      const tempId = `temp_${Date.now()}`;
      addWorkoutLocally({ id: tempId, userId: user.uid, type: workoutType, exercises: flat, notes, date: selected });
      Alert.alert('🔥 Locked in!', 'Workout saved. Keep grinding!');
      logWorkout(user.uid, { type: workoutType, exercises: flat, notes, date: selected }).then(() => refresh()).catch(() => { removeWorkoutLocally(tempId); Alert.alert('Error', 'Failed to save workout.'); });
    }
  };

  const openLogModal = async () => {
    setEditingWorkout(null);
    setLogStep(1);
    if (DRAFT_KEY) {
      try {
        const raw = await AsyncStorage.getItem(DRAFT_KEY);
        if (raw) { const draft = JSON.parse(raw); setWorkoutType(draft.workoutType || 'Push'); setExercises(draft.exercises || []); setNotes(draft.notes || ''); setLogModalVisible(true); return; }
      } catch {}
    }
    setExercises([]); setNotes(''); setWorkoutType('Push'); setLogModalVisible(true);
  };

  const handleDelete = (id) => Alert.alert('Delete', 'Remove this workout?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: () => { removeWorkoutLocally(id); deleteWorkout(id).catch(() => { refresh(); Alert.alert('Error', 'Failed to delete workout.'); }); } },
  ]);

  const selectedExNames = exercises.map((e) => e.name);

  const getDayStatusBadge = () => {
    if (dayWorkouts.length > 0) return { label: dayWorkouts.length > 1 ? dayWorkouts.length + ' Workouts' : dayWorkouts[0].type, color: Colors.accent, bg: 'rgba(0,245,196,0.12)', icon: '💪' };
    if (isRestDay) return { label: 'Rest Day', color: '#ff9f43', bg: 'rgba(255,159,67,0.12)', icon: '😌' };
    if (isMissed) return { label: 'Missed', color: Colors.red, bg: 'rgba(255,107,107,0.12)', icon: '❌' };
    return null;
  };
  const badge = getDayStatusBadge();

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(500)}>
          <Text style={styles.pageTitle}>Workout Calendar</Text>
          <Text style={styles.pageSub}>Tap a date to view or log workouts</Text>
          <View style={styles.legend}>
            {[{ color: DAY_COLORS.workout.border, label: 'Workout' }, { color: DAY_COLORS.rest.border, label: 'Rest' }, { color: DAY_COLORS.missed.border, label: 'Missed' }].map((item) => (
              <View key={item.label} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                <Text style={styles.legendLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.calWrap}>
          <Calendar markingType="custom" onDayPress={handleDayPress} maxDate={TODAY} markedDates={markedDates}
            theme={{ backgroundColor: Colors.card, calendarBackground: Colors.card, dayTextColor: Colors.text, textDisabledColor: Colors.muted, monthTextColor: Colors.text, arrowColor: Colors.accent, selectedDayBackgroundColor: Colors.accent, selectedDayTextColor: Colors.bg, todayTextColor: Colors.accent, dotColor: Colors.accent, textMonthFontSize: 16, textMonthFontWeight: '700' }}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(200)}>
          <View style={styles.dayHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.dayTitle}>{format(new Date(selected + 'T12:00:00'), 'EEEE, MMM d')}</Text>
              {badge && (
                <View style={[styles.dayBadge, { backgroundColor: badge.bg }]}>
                  <Text style={styles.dayBadgeIcon}>{badge.icon}</Text>
                  <Text style={[styles.dayBadgeText, { color: badge.color }]}>{badge.label}</Text>
                </View>
              )}
            </View>
            {!isFuture && !isMissed && (
              <TouchableOpacity style={styles.addBtn} onPress={openLogModal}>
                <Ionicons name="add" size={20} color={Colors.bg} />
                <Text style={styles.addBtnText}>Log</Text>
              </TouchableOpacity>
            )}
          </View>

          {isFuture ? (
            <View style={styles.emptyDay}><Text style={{ fontSize: 40 }}>🔮</Text><Text style={styles.emptyText}>Future date</Text><Text style={styles.emptySub}>Can not log workouts yet!</Text></View>
          ) : isMissed ? (
            <View style={styles.missedDay}><Text style={{ fontSize: 40 }}>❌</Text><Text style={[styles.emptyText, { color: Colors.red }]}>Missed Day</Text><Text style={styles.emptySub}>Streak was broken here</Text></View>
          ) : dayWorkouts.length === 0 && !isRestDay ? (
            <View style={styles.emptyDay}>
              <Text style={{ fontSize: 40 }}>😴</Text>
              <Text style={styles.emptyText}>No workouts logged</Text>
              <Text style={styles.emptySub}>Tap Log to add one</Text>
              {isToday && <TouchableOpacity style={styles.restBtn} onPress={handleMarkRest}><Text style={styles.restBtnIcon}>😌</Text><Text style={styles.restBtnText}>Mark as Rest Day</Text></TouchableOpacity>}
            </View>
          ) : isRestDay && dayWorkouts.length === 0 ? (
            <View style={styles.restDay}>
              <Text style={{ fontSize: 40 }}>😌</Text>
              <Text style={[styles.emptyText, { color: '#ff9f43' }]}>Rest Day</Text>
              <Text style={styles.emptySub}>Recovery counts too</Text>
              {isToday && <TouchableOpacity style={styles.addBtnSecondary} onPress={openLogModal}><Ionicons name="barbell-outline" size={16} color={Colors.accent} /><Text style={styles.addBtnSecondaryText}>Log Workout Instead</Text></TouchableOpacity>}
            </View>
          ) : (
            dayWorkouts.map((w) => (
              <Animated.View key={w.id} entering={FadeIn.duration(300)} style={styles.workoutCard}>
                <View style={styles.workoutCardHeader}>
                  <View style={styles.typeBadge}><Text style={styles.typeBadgeText}>{w.type}</Text></View>
                  <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => setShareWorkout(w)}><Ionicons name="share-social-outline" size={18} color={Colors.accent} /></TouchableOpacity>
                    <TouchableOpacity onPress={() => openEditModal(w)}><Ionicons name="create-outline" size={18} color="#54a0ff" /></TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(w.id)}><Ionicons name="trash-outline" size={18} color={Colors.red} /></TouchableOpacity>
                  </View>
                </View>
                {w.exercises?.map((ex, i) => {
                  const repsArr = ex.reps ? ex.reps.toString().split('/') : [];
                  const weightArr = ex.weight ? ex.weight.toString().split('/') : [];
                  const setCount = ex.sets || repsArr.length || 1;
                  return (
                    <View key={i} style={styles.savedExBlock}>
                      <View style={styles.savedExHeader}>
                        <Text style={styles.savedExEmoji}>{ex.emoji || '💪'}</Text>
                        <Text style={styles.savedExName}>{ex.name}</Text>
                      </View>
                      {Array.from({ length: setCount }).map((_, si) => (
                        <View key={si} style={styles.savedSetRow}>
                          <View style={styles.savedSetBadge}><Text style={styles.savedSetBadgeText}>Set {si + 1}</Text></View>
                          <Text style={styles.savedSetDetail}>{weightArr[si] || '0'}kg</Text>
                          <Text style={styles.savedSetSep}>·</Text>
                          <Text style={styles.savedSetDetail}>{repsArr[si] || '0'} reps</Text>
                        </View>
                      ))}
                    </View>
                  );
                })}
                {w.notes ? <Text style={styles.workoutNote}>📝 {w.notes}</Text> : null}
              </Animated.View>
            ))
          )}
        </Animated.View>
        <View style={{ height: 40 }} />
      </ScrollView>

      <ExercisePicker visible={pickerVisible} workoutType={workoutType} selectedNames={selectedExNames} onSelect={handlePickExercise} onClose={() => setPickerVisible(false)} />

      {/* Log Workout Modal — 2 Step */}
      <Modal visible={logModalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.darkSheet}>
          <View style={styles.modalHeader}>
            {logStep === 2 && (
              <TouchableOpacity onPress={() => setLogStep(1)} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={20} color="#ffffff" />
              </TouchableOpacity>
            )}
            <Text style={styles.modalTitle}>{editingWorkout ? 'Edit Workout' : logStep === 1 ? 'Start Workout' : workoutType}</Text>
            <TouchableOpacity onPress={() => { setLogModalVisible(false); setEditingWorkout(null); setLogStep(1); if (DRAFT_KEY && !editingWorkout) AsyncStorage.removeItem(DRAFT_KEY).catch(() => {}); }}>
              <Ionicons name="close" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* Step indicator */}
          {!editingWorkout && (
            <View style={styles.stepRow}>
              <View style={[styles.stepDot, logStep >= 1 && styles.stepDotActive]} />
              <View style={[styles.stepLine, logStep >= 2 && styles.stepLineActive]} />
              <View style={[styles.stepDot, logStep >= 2 && styles.stepDotActive]} />
            </View>
          )}

          {/* ── STEP 1: Choose preset or type ── */}
          {(logStep === 1 && !editingWorkout) ? (
            <ScrollView showsVerticalScrollIndicator={false} style={{ backgroundColor: '#080b10' }}>

              {/* Create New Preset — top */}
              <TouchableOpacity style={styles.createPresetTopBtn} onPress={() => setPresetModalVisible(true)}>
                <View style={styles.createPresetTopIcon}>
                  <Ionicons name="add" size={22} color="#00f5c4" />
                </View>
                <Text style={styles.createPresetTopText}>Create New Preset</Text>
                <Ionicons name="chevron-forward" size={18} color="#6b7a99" />
              </TouchableOpacity>

              {/* My Presets */}
              {userPresets.length > 0 && (
                <>
                  <Text style={styles.stepSectionLabel}>MY PRESETS</Text>
                  {userPresets.map((preset) => (
                    <View key={preset.id} style={styles.presetCard}>
                      <Text style={styles.presetCardName}>{preset.name}</Text>
                      <Text style={styles.presetCardSub}>{preset.exercises.length} exercises</Text>
                      <View style={styles.presetCardActions}>
                        <TouchableOpacity onPress={() => openEditPreset(preset)} style={styles.presetCardBtn}>
                          <Ionicons name="create-outline" size={16} color="#54a0ff" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDeletePreset(preset.id)} style={styles.presetCardBtn}>
                          <Ionicons name="trash-outline" size={16} color="#ff6b6b" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.presetCardOpenBtn} onPress={() => setPreviewPreset(preset)}>
                          <Text style={styles.presetCardOpenText}>Open</Text>
                          <Ionicons name="chevron-forward" size={14} color="#080b10" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </>
              )}

              {/* Default Presets Carousel */}
              <Text style={styles.stepSectionLabel}>DEFAULT PRESETS</Text>
              <DefaultPresetCarousel
                presets={DEFAULT_PRESETS}
                onSelect={(preset) => {
                  setLogModalVisible(false);
                  navigation.navigate('WorkoutSession', {
                    workout: { type: preset.name, exercises: preset.exercises },
                    date: selected,
                    onSave: (w) => addWorkoutLocally(w),
                  });
                }}
              />

              {/* Start from scratch */}
              <Text style={styles.stepSectionLabel}>START FROM SCRATCH</Text>
              <View style={styles.typeGrid}>
                {['Push','Pull','Legs','Upper Body','Lower Body','Full Body','Cardio','HIIT','Mobility','Custom'].map((t) => (
                  <TouchableOpacity key={t} style={styles.typeGridItem} onPress={() => { setWorkoutType(t); setExercises([]); setLogStep(2); }}>
                    <Text style={styles.typeGridText}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={{ height: 40 }} />
            </ScrollView>
          ) : (
            /* ── STEP 2: Exercises + Sets ── */
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={{ backgroundColor: '#080b10' }}>
              <TouchableOpacity style={styles.selectExBtn} onPress={() => setPickerVisible(true)}>
                <Ionicons name="barbell-outline" size={20} color="#00f5c4" />
                <Text style={styles.selectExText}>{exercises.length === 0 ? 'Select Exercises' : exercises.length + ' exercises — Edit'}</Text>
                <Ionicons name="chevron-forward" size={18} color="#6b7a99" />
              </TouchableOpacity>

              {exercises.length > 0 && (
                <>
                  {exercises.map((ex, exIdx) => (
                    <View key={ex.name} style={styles.exCard}>
                      <View style={styles.exCardHeader}>
                        <Text style={styles.exCardEmoji}>{ex.emoji}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.exCardName}>{ex.name}</Text>
                          <Text style={styles.exCardMuscle}>{ex.muscle}</Text>
                        </View>
                        <TouchableOpacity onPress={() => removeExercise(exIdx)}>
                          <Ionicons name="close-circle-outline" size={22} color="#ff6b6b" />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.setHeaderRow}>
                        <Text style={styles.setHeaderCell}>SET</Text>
                        <Text style={styles.setHeaderCell}>WEIGHT (kg)</Text>
                        <Text style={styles.setHeaderCell}>REPS</Text>
                        <Text style={{ width: 28 }} />
                      </View>
                      {ex.sets.map((set, setIdx) => (
                        <View key={setIdx} style={styles.setRow}>
                          <View style={styles.setNumBadge}><Text style={styles.setNumText}>{setIdx + 1}</Text></View>
                          {ex.isCardio ? (
                            <>
                              <TextInput style={styles.setInput} placeholder="min" placeholderTextColor="#6b7a99" value={set.minutes} onChangeText={(v) => updateSet(exIdx, setIdx, 'minutes', v)} keyboardType="numeric" />
                              <TextInput style={styles.setInput} placeholder="sec" placeholderTextColor="#6b7a99" value={set.seconds} onChangeText={(v) => updateSet(exIdx, setIdx, 'seconds', v)} keyboardType="numeric" />
                            </>
                          ) : (
                            <>
                              <TextInput style={styles.setInput} placeholder="0" placeholderTextColor="#6b7a99" value={set.weight} onChangeText={(v) => updateSet(exIdx, setIdx, 'weight', v)} keyboardType="decimal-pad" />
                              <TextInput style={styles.setInput} placeholder="0" placeholderTextColor="#6b7a99" value={set.reps} onChangeText={(v) => updateSet(exIdx, setIdx, 'reps', v)} keyboardType="numeric" />
                            </>
                          )}
                          <TouchableOpacity onPress={() => removeSet(exIdx, setIdx)}>
                            <Ionicons name="remove-circle-outline" size={20} color={ex.sets.length > 1 ? '#ff6b6b' : '#1e2535'} />
                          </TouchableOpacity>
                        </View>
                      ))}
                      <TouchableOpacity style={styles.addSetBtn} onPress={() => addSet(exIdx)}>
                        <Ionicons name="add-circle-outline" size={17} color="#00f5c4" />
                        <Text style={styles.addSetText}>Add Set</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </>
              )}

              <Text style={styles.fieldLabel}>Notes (optional)</Text>
              <TextInput style={styles.notesInput} placeholder="How did it go?" placeholderTextColor="#6b7a99" value={notes} onChangeText={setNotes} multiline numberOfLines={3} />
              <TouchableOpacity style={[styles.saveBtn, exercises.length === 0 && { opacity: 0.5 }]} onPress={handleSave} disabled={exercises.length === 0}>
                <Text style={styles.saveBtnText}>{editingWorkout ? '✏️ Update Workout' : '🔥 Save Workout'}</Text>
              </TouchableOpacity>
              <View style={{ height: 60 }} />
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* Preset Preview Modal */}
      <Modal visible={!!previewPreset} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.darkSheet}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setPreviewPreset(null)}>
              <Ionicons name="close" size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{previewPreset?.name}</Text>
            <View style={{ width: 24 }} />
          </View>
          <ScrollView showsVerticalScrollIndicator={false} style={{ backgroundColor: '#080b10' }}>
            <Text style={[styles.stepSectionLabel, { marginTop: 8 }]}>{previewPreset?.exercises?.length} EXERCISES</Text>
            {previewPreset?.exercises?.map((ex, i) => (
              <View key={i} style={styles.previewExRow}>
                <Text style={styles.previewExEmoji}>{ex.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.previewExName}>{ex.name}</Text>
                  <Text style={styles.previewExMuscle}>{ex.muscle}</Text>
                </View>
                <Text style={styles.previewExSets}>{ex.sets?.length || 1} sets</Text>
              </View>
            ))}
            <View style={{ height: 24 }} />
            <TouchableOpacity style={styles.previewStartBtn} onPress={() => {
              setPreviewPreset(null);
              setLogModalVisible(false);
              navigation.navigate('WorkoutSession', {
                workout: { type: previewPreset.name, exercises: previewPreset.exercises.map((e) => ({ ...e, sets: e.sets?.length ? e.sets : [{ weight: '', reps: '' }] })) },
                date: selected,
                onSave: (w) => addWorkoutLocally(w),
              });
            }}>
              <Ionicons name="play" size={18} color="#080b10" />
              <Text style={styles.previewStartBtnText}>Start Workout</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.previewLogBtn} onPress={() => {
              applyPreset(previewPreset);
              setPreviewPreset(null);
              setLogStep(2);
            }}>
              <Ionicons name="add-circle-outline" size={18} color="#6b7a99" />
              <Text style={styles.previewLogBtnText}>Log Manually Instead</Text>
            </TouchableOpacity>
            <View style={{ height: 60 }} />
          </ScrollView>
        </View>
      </Modal>

      {/* Share Modal */}
      <Modal visible={!!shareWorkout} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShareWorkout(null)}>
        {shareWorkout && <WorkoutShareSheet workout={shareWorkout} streak={userData?.streak || 0} userName={userData?.displayName || user?.displayName || 'Athlete'} userId={user?.uid} navigation={navigation} onClose={() => setShareWorkout(null)} />}
      </Modal>

      {/* Create Preset Modal */}
      <Modal visible={presetModalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.darkSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editingPreset ? 'Edit Preset' : 'New Preset'}</Text>
            <TouchableOpacity onPress={() => { setPresetModalVisible(false); setNewPresetName(''); setNewPresetExercises([]); setEditingPreset(null); }}>
              <Ionicons name="close" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={{ backgroundColor: '#080b10' }}>
            <Text style={styles.fieldLabel}>Preset Name</Text>
            <TextInput style={styles.notesInput} placeholder="e.g. My Push Day..." placeholderTextColor="#6b7a99" value={newPresetName} onChangeText={setNewPresetName} />

            <TouchableOpacity style={styles.selectExBtn} onPress={() => setPresetPickerVisible(true)}>
              <Ionicons name="barbell-outline" size={20} color="#00f5c4" />
              <Text style={styles.selectExText}>{newPresetExercises.length === 0 ? 'Select Exercises' : newPresetExercises.length + ' selected — Edit'}</Text>
              <Ionicons name="chevron-forward" size={18} color="#6b7a99" />
            </TouchableOpacity>

            {newPresetExercises.length > 0 && (
              <View style={{ marginBottom: 16 }}>
                {newPresetExercises.map((ex, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#131822', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#1e2535' }}>
                    <Text style={{ fontSize: 20 }}>{ex.emoji}</Text>
                    <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 15, flex: 1 }}>{ex.name}</Text>
                    <Text style={{ color: '#a0aec0', fontSize: 12 }}>{ex.muscle}</Text>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity style={[styles.saveBtn, (newPresetExercises.length === 0 || savingPreset) && { opacity: 0.5 }]} onPress={handleSavePreset} disabled={newPresetExercises.length === 0 || savingPreset}>
              <Text style={styles.saveBtnText}>{editingPreset ? '✏️ Update Preset' : '💾 Save Preset'}</Text>
            </TouchableOpacity>
            <View style={{ height: 60 }} />
          </ScrollView>
        </View>
      </Modal>

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
    </View>
  );
}

const pick = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#080b10', paddingTop: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 12, borderBottomWidth: 1, borderColor: '#1e2535', marginBottom: 8 },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#131822', borderWidth: 1, borderColor: '#1e2535', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '800', color: '#ffffff' },
  doneBtn: { backgroundColor: '#00f5c4', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 7 },
  doneBtnText: { color: '#080b10', fontWeight: '800', fontSize: 13 },
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0e1219', borderRadius: 12, borderWidth: 1, borderColor: '#1e2535', paddingHorizontal: 16, height: 44, marginBottom: 8, marginHorizontal: 24 },
  searchInput: { flex: 1, color: '#ffffff', fontSize: 14 },
  exRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0e1219', borderRadius: 16, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: '#1e2535', marginHorizontal: 24 },
  exRowSelected: { borderColor: '#00f5c4', backgroundColor: 'rgba(0,245,196,0.07)' },
  exEmoji: { fontSize: 26, marginRight: 16 },
  exInfo: { flex: 1 },
  exName: { color: '#ffffff', fontWeight: '600', fontSize: 15 },
  exMuscle: { color: '#6b7a99', fontSize: 12, marginTop: 2 },
  checkCircle: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: '#1e2535', alignItems: 'center', justifyContent: 'center' },
  checkCircleActive: { backgroundColor: '#00f5c4', borderColor: '#00f5c4' },
  emptyText: { color: '#6b7a99', textAlign: 'center', paddingVertical: 24, fontSize: 14 },
  customSection: { marginTop: 24, marginBottom: 32, marginHorizontal: 24 },
  customLabel: { color: '#6b7a99', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  customRow: { flexDirection: 'row', gap: 8 },
  customInput: { flex: 1, backgroundColor: '#131822', borderRadius: 12, borderWidth: 1, borderColor: '#1e2535', paddingHorizontal: 16, color: '#ffffff', height: 48, fontSize: 14 },
  customBtn: { backgroundColor: '#00f5c4', borderRadius: 12, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center', height: 48 },
  customBtnText: { color: '#080b10', fontWeight: '800', fontSize: 14 },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#080b10' },
  scroll: { padding: 24, paddingTop: 60 },
  pageTitle: { fontSize: 28, fontWeight: '800', color: '#e8edf5' },
  pageSub: { color: '#6b7a99', fontSize: 14, marginTop: 4 },
  legend: { flexDirection: 'row', gap: 16, marginTop: 8, marginBottom: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { color: '#6b7a99', fontSize: 12, fontWeight: '600' },
  calWrap: { borderRadius: 24, overflow: 'hidden', marginBottom: 24, borderWidth: 1, borderColor: '#1e2535' },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  dayTitle: { color: '#e8edf5', fontSize: 18, fontWeight: '700' },
  dayBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, alignSelf: 'flex-start', marginTop: 4 },
  dayBadgeIcon: { fontSize: 12 },
  dayBadgeText: { fontSize: 12, fontWeight: '700' },
  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#00f5c4', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8, gap: 4 },
  addBtnText: { color: '#080b10', fontWeight: '700', fontSize: 14 },
  addBtnSecondary: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, borderWidth: 1.5, borderColor: '#00f5c4' },
  addBtnSecondaryText: { color: '#00f5c4', fontWeight: '700', fontSize: 13 },
  emptyDay: { alignItems: 'center', paddingVertical: 32 },
  restDay: { alignItems: 'center', paddingVertical: 32 },
  missedDay: { alignItems: 'center', paddingVertical: 32 },
  emptyText: { color: '#e8edf5', fontSize: 16, fontWeight: '600', marginTop: 8 },
  emptySub: { color: '#6b7a99', fontSize: 14, marginTop: 4 },
  restBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24, backgroundColor: 'rgba(255,159,67,0.12)', borderWidth: 1.5, borderColor: '#ff9f43', borderRadius: 999, paddingHorizontal: 20, paddingVertical: 10 },
  restBtnIcon: { fontSize: 16 },
  restBtnText: { color: '#ff9f43', fontWeight: '700', fontSize: 14 },
  workoutCard: { backgroundColor: '#131822', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#1e2535' },
  workoutCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  typeBadge: { backgroundColor: 'rgba(0,245,196,0.15)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 },
  typeBadgeText: { color: '#00f5c4', fontWeight: '700', fontSize: 12 },
  savedExBlock: { marginBottom: 8 },
  savedExHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  savedExEmoji: { fontSize: 18 },
  savedExName: { color: '#e8edf5', fontSize: 13, fontWeight: '700' },
  savedSetRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 3, paddingLeft: 24 },
  savedSetBadge: { backgroundColor: 'rgba(0,245,196,0.1)', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, minWidth: 44 },
  savedSetBadgeText: { color: '#00f5c4', fontSize: 10, fontWeight: '700', textAlign: 'center' },
  savedSetDetail: { color: '#6b7a99', fontSize: 13 },
  savedSetSep: { color: '#1e2535', fontSize: 12 },
  workoutNote: { color: '#6b7a99', fontSize: 13, marginTop: 8, fontStyle: 'italic', borderTopWidth: 1, borderColor: '#1e2535', paddingTop: 8 },
  darkSheet: { flex: 1, backgroundColor: '#080b10', padding: 24, paddingTop: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#ffffff' },
  fieldLabel: { color: '#6b7a99', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 16 },
  typeChip: { borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: '#1e2535', marginRight: 8, backgroundColor: '#131822' },
  typeChipActive: { backgroundColor: 'rgba(0,245,196,0.15)', borderColor: '#00f5c4' },
  typeChipText: { color: '#6b7a99', fontWeight: '600', fontSize: 13 },
  selectExBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0e1219', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#00f5c4', gap: 8, marginBottom: 8 },
  selectExText: { flex: 1, color: '#ffffff', fontWeight: '600', fontSize: 15 },
  exCard: { backgroundColor: '#131822', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#1e2535' },
  exCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 8 },
  exCardEmoji: { fontSize: 28 },
  exCardName: { color: '#e8edf5', fontWeight: '700', fontSize: 15 },
  exCardMuscle: { color: '#6b7a99', fontSize: 12 },
  setHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, paddingHorizontal: 2 },
  setHeaderCell: { flex: 1, color: '#6b7a99', fontSize: 10, fontWeight: '700', letterSpacing: 1, textAlign: 'center' },
  setRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  setNumBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,245,196,0.15)', alignItems: 'center', justifyContent: 'center' },
  setNumText: { color: '#00f5c4', fontWeight: '800', fontSize: 13 },
  setInput: { flex: 1, backgroundColor: '#0e1219', borderRadius: 8, paddingVertical: 8, color: '#e8edf5', fontWeight: '700', fontSize: 16, textAlign: 'center', borderWidth: 1, borderColor: '#1e2535' },
  addSetBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 8, marginTop: 4 },
  addSetText: { color: '#00f5c4', fontWeight: '600', fontSize: 14 },
  notesInput: { backgroundColor: '#0e1219', borderRadius: 12, padding: 16, color: '#ffffff', borderWidth: 1, borderColor: '#1e2535', textAlignVertical: 'top', minHeight: 80, marginTop: 4 },
  saveBtn: { backgroundColor: '#00f5c4', borderRadius: 16, height: 54, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  saveBtnText: { color: '#080b10', fontWeight: '800', fontSize: 16 },
  createPresetTopBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,245,196,0.08)', borderRadius: 16, padding: 16, marginTop: 8, marginBottom: 4, borderWidth: 1.5, borderColor: 'rgba(0,245,196,0.25)', gap: 12 },
  createPresetTopIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,245,196,0.15)', alignItems: 'center', justifyContent: 'center' },
  createPresetTopText: { flex: 1, color: '#00f5c4', fontWeight: '700', fontSize: 15 },
  stepRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20, gap: 0 },
  stepDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#1e2535', borderWidth: 1, borderColor: '#6b7a99' },
  stepDotActive: { backgroundColor: '#00f5c4', borderColor: '#00f5c4' },
  stepLine: { width: 60, height: 2, backgroundColor: '#1e2535' },
  stepLineActive: { backgroundColor: '#00f5c4' },
  stepSectionLabel: { color: '#6b7a99', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginTop: 20, marginBottom: 10 },
  presetCard: { backgroundColor: '#131822', borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#1e2535' },
  presetExPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  presetExPill: { backgroundColor: '#0e1219', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: '#1e2535' },
  presetExPillText: { color: '#6b7a99', fontSize: 12 },
  previewExRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#131822', borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#1e2535', gap: 12 },
  previewExEmoji: { fontSize: 24 },
  previewExName: { color: '#ffffff', fontWeight: '600', fontSize: 15 },
  previewExMuscle: { color: '#6b7a99', fontSize: 12, marginTop: 2 },
  previewExSets: { color: '#6b7a99', fontSize: 13 },
  previewStartBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#00f5c4', borderRadius: 16, padding: 18, marginBottom: 12 },
  previewStartBtnText: { color: '#080b10', fontWeight: '800', fontSize: 16 },
  previewLogBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#131822', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#1e2535' },
  previewLogBtnText: { color: '#6b7a99', fontWeight: '600', fontSize: 14 },
  presetCardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  presetCardLeft: { flex: 1 },
  presetCardName: { color: '#ffffff', fontWeight: '700', fontSize: 16 },
  presetCardSub: { color: '#6b7a99', fontSize: 12, marginTop: 3 },
  presetCardActions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  presetCardOpenBtn: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#00f5c4', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  presetCardOpenText: { color: '#080b10', fontWeight: '700', fontSize: 13 },
  presetCardBtns: { flexDirection: 'row', gap: 8 },
  presetCardLogBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#0e1219', borderRadius: 10, paddingVertical: 10, borderWidth: 1, borderColor: '#1e2535' },
  presetCardLogBtnText: { color: '#6b7a99', fontWeight: '600', fontSize: 13 },
  presetCardStartBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#00f5c4', borderRadius: 10, paddingVertical: 10 },
  presetCardStartBtnText: { color: '#080b10', fontWeight: '800', fontSize: 13 },
  presetCardBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#0e1219', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#1e2535' },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10 },
  typeGridItem: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#131822', borderRadius: 12, borderWidth: 1, borderColor: '#1e2535' },
  typeGridText: { color: '#e8edf5', fontWeight: '600', fontSize: 14 },
  newPresetRowBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 16, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: 'rgba(0,245,196,0.3)', backgroundColor: 'rgba(0,245,196,0.06)' },
  newPresetRowBtnText: { color: '#00f5c4', fontWeight: '700', fontSize: 14 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#131822', borderWidth: 1, borderColor: '#1e2535', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  presetsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 },
  newPresetBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,245,196,0.1)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(0,245,196,0.3)' },
  newPresetBtnText: { color: '#00f5c4', fontWeight: '700', fontSize: 12 },
  presetChipText: { color: '#00f5c4', fontWeight: '600', fontSize: 13 },
});
