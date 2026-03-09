import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal, FlatList } from 'react-native';
import { Calendar } from 'react-native-calendars';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import WorkoutShareSheet from './WorkoutShareSheet';
import { useWorkoutsContext } from '../../hooks/WorkoutsContext';
import { logWorkout, deleteWorkout, markRestDay } from '../../services/workoutService';
import { WORKOUT_TYPES, PRESET_EXERCISES } from '../../constants/exercises';
import { Colors, Spacing, Radius } from '../../constants/theme';
import { format, parseISO, isBefore, startOfDay } from 'date-fns';

const TODAY = format(new Date(), 'yyyy-MM-dd');

// Day state colours
const DAY_COLORS = {
  workout: { bg: 'rgba(0,245,196,0.18)',  border: '#00f5c4', text: '#00f5c4' },
  rest:    { bg: 'rgba(255,159,67,0.18)', border: '#ff9f43', text: '#ff9f43' },
  missed:  { bg: 'rgba(255,107,107,0.18)',border: '#ff6b6b', text: '#ff6b6b' },
};

// ─── Exercise Picker Modal ────────────────────────────────────────────────────
function ExercisePicker({ visible, workoutType, selectedNames, onSelect, onClose }) {
  const [search, setSearch] = useState('');
  const [customName, setCustomName] = useState('');

  // All exercises across every type (deduplicated by name)
  const allExercises = Object.entries(PRESET_EXERCISES)
    .filter(([key]) => key !== 'Custom')
    .flatMap(([type, exList]) => exList.map((e) => ({ ...e, sourceType: type })))
    .filter((e, idx, arr) => arr.findIndex((x) => x.name === e.name) === idx);

  // Base pool: if Custom or searching, show all; else show type presets
  const basePool = (workoutType === 'Custom' || search)
    ? allExercises
    : (PRESET_EXERCISES[workoutType] || []);

  const filtered = basePool.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={pick.root}>
        <View style={pick.header}>
          <Text style={pick.title}>Choose Exercises</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="checkmark-done" size={26} color={Colors.accent} />
          </TouchableOpacity>
        </View>
        <View style={pick.searchWrap}>
          <Ionicons name="search-outline" size={16} color={Colors.muted} style={{ marginRight: 8 }} />
          <TextInput
            style={pick.searchInput}
            placeholder="Search exercises..."
            placeholderTextColor={Colors.muted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.name}
          style={{ flex: 1 }}
          ListEmptyComponent={<Text style={pick.emptyText}>No exercises found for "{search}"</Text>}
          renderItem={({ item }) => {
            const isSelected = selectedNames.includes(item.name);
            return (
              <TouchableOpacity
                style={[pick.exRow, isSelected && pick.exRowSelected]}
                onPress={() => onSelect(item)}
              >
                <Text style={pick.exEmoji}>{item.emoji}</Text>
                <View style={pick.exInfo}>
                  <Text style={[pick.exName, isSelected && { color: Colors.accent }]}>{item.name}</Text>
                  <Text style={pick.exMuscle}>{item.muscle}</Text>
                </View>
                <View style={[pick.checkCircle, isSelected && pick.checkCircleActive]}>
                  {isSelected && <Ionicons name="checkmark" size={14} color={Colors.bg} />}
                </View>
              </TouchableOpacity>
            );
          }}
          ListFooterComponent={
            <View style={pick.customSection}>
              <Text style={pick.customLabel}>CANT FIND IT? ADD CUSTOM</Text>
              <View style={pick.customRow}>
                <TextInput
                  style={pick.customInput}
                  placeholder="Exercise name..."
                  placeholderTextColor={Colors.muted}
                  value={customName}
                  onChangeText={setCustomName}
                />
                <TouchableOpacity
                  style={[pick.customBtn, !customName && { opacity: 0.4 }]}
                  disabled={!customName}
                  onPress={() => { onSelect({ name: customName.trim(), emoji: '💪', muscle: 'Custom' }); setCustomName(''); }}
                >
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

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function CalendarScreen() {
  const { user, userData } = useAuth();
  const { workouts, restDays, refresh, addWorkoutLocally, removeWorkoutLocally, addRestDayLocally } = useWorkoutsContext();

  const [selected, setSelected] = useState(TODAY);
  const [logModalVisible, setLogModalVisible] = useState(false);
  const [shareWorkout, setShareWorkout] = useState(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [workoutType, setWorkoutType] = useState('Push');
  const [notes, setNotes] = useState('');
  const [exercises, setExercises] = useState([]);

  // ── Derive day states from in-memory data ───────────────────────────────────
  const workoutDates = new Set(workouts.map((w) => w.date));
  const restDatesSet = new Set(restDays);

  // Build marked dates for calendar
  // Rules: workout=green, rest=orange, missed(past, neither)=red, future=untouched
  const markedDates = {};

  // Mark workout days
  workouts.forEach((w) => {
    markedDates[w.date] = {
      customStyles: {
        container: { backgroundColor: DAY_COLORS.workout.bg, borderRadius: 8, borderWidth: 1.5, borderColor: DAY_COLORS.workout.border },
        text: { color: DAY_COLORS.workout.text, fontWeight: '800' },
      },
    };
  });

  // Mark rest days (only if no workout that day — workout takes priority)
  restDays.forEach((date) => {
    if (!workoutDates.has(date)) {
      markedDates[date] = {
        customStyles: {
          container: { backgroundColor: DAY_COLORS.rest.bg, borderRadius: 8, borderWidth: 1.5, borderColor: DAY_COLORS.rest.border },
          text: { color: DAY_COLORS.rest.text, fontWeight: '800' },
        },
      };
    }
  });

  // Mark missed days — only between first ever activity and yesterday
  // Before first activity: clean calendar (new user sees no red)
  const allActivityDates = [...workoutDates, ...restDatesSet].sort();
  const firstActivityDate = allActivityDates.length > 0 ? allActivityDates[0] : null;

  if (firstActivityDate) {
    for (let i = 1; i <= 365; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = format(d, 'yyyy-MM-dd');
      // Stop once we reach before the first activity
      if (dateStr < firstActivityDate) break;
      if (!workoutDates.has(dateStr) && !restDatesSet.has(dateStr)) {
        markedDates[dateStr] = {
          customStyles: {
            container: { backgroundColor: DAY_COLORS.missed.bg, borderRadius: 8, borderWidth: 1.5, borderColor: DAY_COLORS.missed.border },
            text: { color: DAY_COLORS.missed.text, fontWeight: '800' },
          },
        };
      }
    }
  }

  // Selected day overlay — merge with existing style or add fresh
  const existing = markedDates[selected]?.customStyles || {};
  markedDates[selected] = {
    customStyles: {
      container: {
        ...(existing.container || {}),
        borderWidth: 2.5,
        borderColor: '#ffffff',
      },
      text: existing.text || { color: Colors.text, fontWeight: '800' },
    },
  };

  // Workouts for selected date
  const dayWorkouts = workouts.filter((w) => w.date === selected);
  const isRestDay = restDatesSet.has(selected);
  const isPast = selected < TODAY;
  const isToday = selected === TODAY;
  const isFuture = selected > TODAY;
  // Only missed if after first ever activity — before that, calendar is clean
  const isMissed = isPast && !workoutDates.has(selected) && !restDatesSet.has(selected) && firstActivityDate !== null && selected >= firstActivityDate;

  const handleDayPress = (day) => {
    if (day.dateString > TODAY) {
      Alert.alert('Future date', "You can't log workouts for future dates!");
      return;
    }
    setSelected(day.dateString);
  };

  // ── Rest day handler ────────────────────────────────────────────────────────
  const handleMarkRest = () => {
    if (selected !== TODAY) return;
    Alert.alert('Mark as Rest Day?', 'This will count toward your streak.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Mark Rest', onPress: () => {
          addRestDayLocally(TODAY);
          markRestDay(user.uid, TODAY).catch(() => {
            Alert.alert('Error', 'Could not save rest day.');
            refresh();
          });
        },
      },
    ]);
  };

  // ── Exercise picker toggle ──────────────────────────────────────────────────
  const handlePickExercise = (item) => {
    const exists = exercises.find((e) => e.name === item.name);
    let newExercises;
    if (exists) {
      newExercises = exercises.filter((e) => e.name !== item.name);
    } else {
      newExercises = [...exercises, { name: item.name, emoji: item.emoji, muscle: item.muscle, sourceType: item.sourceType, sets: [{ weight: '', reps: '' }] }];
    }
    setExercises(newExercises);
    // Auto-set type to Custom if exercises come from multiple routine types
    const sourceTypes = [...new Set(newExercises.map((e) => e.sourceType).filter(Boolean))];
    if (sourceTypes.length > 1) {
      setWorkoutType('Custom');
    }
  };

  const updateSet = (exIdx, setIdx, field, val) => {
    const updated = [...exercises];
    updated[exIdx].sets[setIdx][field] = val;
    setExercises(updated);
  };

  const addSet = (exIdx) => {
    const updated = [...exercises];
    const prevWeight = updated[exIdx].sets[updated[exIdx].sets.length - 1]?.weight || '';
    updated[exIdx].sets.push({ weight: prevWeight, reps: '' });
    setExercises(updated);
  };

  const removeSet = (exIdx, setIdx) => {
    const updated = [...exercises];
    if (updated[exIdx].sets.length === 1) return;
    updated[exIdx].sets.splice(setIdx, 1);
    setExercises(updated);
  };

  const removeExercise = (exIdx) => setExercises(exercises.filter((_, i) => i !== exIdx));

  // ── Save workout ────────────────────────────────────────────────────────────
  const handleSave = () => {
    if (exercises.length === 0) return Alert.alert('Error', 'Select at least one exercise');
    const flat = exercises.map((ex) => ({
      name: ex.name, emoji: ex.emoji,
      sets: ex.sets.length,
      reps: ex.sets.map((s) => s.reps || '0').join('/'),
      weight: ex.sets.map((s) => s.weight || '0').join('/'),
    }));
    setLogModalVisible(false);
    setExercises([]);
    setNotes('');
    const tempId = `temp_${Date.now()}`;
    addWorkoutLocally({ id: tempId, userId: user.uid, type: workoutType, exercises: flat, notes, date: selected });
    logWorkout(user.uid, { type: workoutType, exercises: flat, notes, date: selected })
      .then((id) => { refresh(); setShareWorkout({ id, type: workoutType, exercises: flat, notes, date: selected }); })
      .catch(() => { removeWorkoutLocally(tempId); Alert.alert('Error', 'Failed to save workout. Please try again.'); });
  };

  const openLogModal = () => { setExercises([]); setNotes(''); setWorkoutType('Push'); setLogModalVisible(true); };

  const handleDelete = (id) => Alert.alert('Delete', 'Remove this workout?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: () => {
      removeWorkoutLocally(id);
      deleteWorkout(id).catch(() => { refresh(); Alert.alert('Error', 'Failed to delete workout.'); });
    }},
  ]);

  const selectedExNames = exercises.map((e) => e.name);

  // ── Day status label ────────────────────────────────────────────────────────
  const getDayStatusBadge = () => {
    if (dayWorkouts.length > 0) return { label: `${dayWorkouts.length > 1 ? dayWorkouts.length + ' Workouts' : dayWorkouts[0].type}`, color: Colors.accent, bg: 'rgba(0,245,196,0.12)', icon: '💪' };
    if (isRestDay) return { label: 'Rest Day', color: '#ff9f43', bg: 'rgba(255,159,67,0.12)', icon: '😌' };
    if (isMissed) return { label: 'Missed', color: Colors.red, bg: 'rgba(255,107,107,0.12)', icon: '❌' };
    if (isToday) return null;
    return null;
  };
  const badge = getDayStatusBadge();

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(500)}>
          <Text style={styles.pageTitle}>Workout Calendar</Text>
          <Text style={styles.pageSub}>Tap a date to view or log workouts</Text>

          {/* Legend */}
          <View style={styles.legend}>
            {[
              { color: DAY_COLORS.workout.border, label: 'Workout' },
              { color: DAY_COLORS.rest.border,    label: 'Rest'    },
              { color: DAY_COLORS.missed.border,  label: 'Missed'  },
            ].map((item) => (
              <View key={item.label} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                <Text style={styles.legendLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.calWrap}>
          <Calendar
            markingType="custom"
            onDayPress={handleDayPress}
            maxDate={TODAY}
            markedDates={markedDates}
            theme={{
              backgroundColor: Colors.card, calendarBackground: Colors.card,
              dayTextColor: Colors.text, textDisabledColor: Colors.muted,
              monthTextColor: Colors.text, arrowColor: Colors.accent,
              selectedDayBackgroundColor: Colors.accent, selectedDayTextColor: Colors.bg,
              todayTextColor: Colors.accent, dotColor: Colors.accent,
              textMonthFontSize: 16, textMonthFontWeight: '700',
            }}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(200)}>
          {/* Day header */}
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

          {/* Day content */}
          {isFuture ? (
            <View style={styles.emptyDay}>
              <Text style={{ fontSize: 40 }}>🔮</Text>
              <Text style={styles.emptyText}>Future date</Text>
              <Text style={styles.emptySub}>Can not log workouts yet!</Text>
            </View>
          ) : isMissed ? (
            <View style={styles.missedDay}>
              <Text style={{ fontSize: 40 }}>❌</Text>
              <Text style={[styles.emptyText, { color: Colors.red }]}>Missed Day</Text>
              <Text style={styles.emptySub}>Streak was broken here</Text>
            </View>
          ) : dayWorkouts.length === 0 && !isRestDay ? (
            <View style={styles.emptyDay}>
              <Text style={{ fontSize: 40 }}>😴</Text>
              <Text style={styles.emptyText}>No workouts logged</Text>
              <Text style={styles.emptySub}>Tap Log to add one</Text>
              {/* Mark as rest only for today */}
              {isToday && (
                <TouchableOpacity style={styles.restBtn} onPress={handleMarkRest}>
                  <Text style={styles.restBtnIcon}>😌</Text>
                  <Text style={styles.restBtnText}>Mark as Rest Day</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : isRestDay && dayWorkouts.length === 0 ? (
            <View style={styles.restDay}>
              <Text style={{ fontSize: 40 }}>😌</Text>
              <Text style={[styles.emptyText, { color: '#ff9f43' }]}>Rest Day</Text>
              <Text style={styles.emptySub}>Recovery counts too</Text>
              {/* Still allow logging a workout on a rest day */}
              {isToday && (
                <TouchableOpacity style={styles.addBtnSecondary} onPress={openLogModal}>
                  <Ionicons name="barbell-outline" size={16} color={Colors.accent} />
                  <Text style={styles.addBtnSecondaryText}>Log Workout Instead</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            dayWorkouts.map((w) => (
              <Animated.View key={w.id} entering={FadeIn.duration(300)} style={styles.workoutCard}>
                <View style={styles.workoutCardHeader}>
                  <View style={styles.typeBadge}><Text style={styles.typeBadgeText}>{w.type}</Text></View>
                  <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => setShareWorkout(w)}>
                      <Ionicons name="share-social-outline" size={18} color={Colors.accent} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(w.id)}>
                      <Ionicons name="trash-outline" size={18} color={Colors.red} />
                    </TouchableOpacity>
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
                          <View style={styles.savedSetBadge}>
                            <Text style={styles.savedSetBadgeText}>Set {si + 1}</Text>
                          </View>
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

      {/* Share Sheet */}
      <Modal
        visible={!!shareWorkout}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShareWorkout(null)}
      >
        {shareWorkout && (
          <WorkoutShareSheet
            workout={shareWorkout}
            streak={userData?.streak || 0}
            userName={userData?.displayName || user?.displayName || 'Athlete'}
            onClose={() => setShareWorkout(null)}
          />
        )}
      </Modal>

      <ExercisePicker
        visible={pickerVisible}
        workoutType={workoutType}
        selectedNames={selectedExNames}
        onSelect={handlePickExercise}
        onClose={() => setPickerVisible(false)}
      />

      {/* Log Workout Modal */}
      <Modal visible={logModalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Log Workout</Text>
            <TouchableOpacity onPress={() => setLogModalVisible(false)}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={styles.fieldLabel}>Workout Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
              {WORKOUT_TYPES.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeChip, workoutType === t && styles.typeChipActive]}
                  onPress={() => setWorkoutType(t)}
                >
                  <Text style={[styles.typeChipText, workoutType === t && { color: Colors.accent }]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.selectExBtn} onPress={() => setPickerVisible(true)}>
              <Ionicons name="barbell-outline" size={20} color={Colors.accent} />
              <Text style={styles.selectExText}>
                {exercises.length === 0 ? 'Select Exercises' : `${exercises.length} selected — Edit`}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.muted} />
            </TouchableOpacity>
            {exercises.length > 0 && (
              <>
                <Text style={styles.fieldLabel}>Sets & Reps</Text>
                {exercises.map((ex, exIdx) => (
                  <View key={ex.name} style={styles.exCard}>
                    <View style={styles.exCardHeader}>
                      <Text style={styles.exCardEmoji}>{ex.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.exCardName}>{ex.name}</Text>
                        <Text style={styles.exCardMuscle}>{ex.muscle}</Text>
                      </View>
                      <TouchableOpacity onPress={() => removeExercise(exIdx)}>
                        <Ionicons name="close-circle-outline" size={22} color={Colors.red} />
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
                        <View style={styles.setNumBadge}>
                          <Text style={styles.setNumText}>{setIdx + 1}</Text>
                        </View>
                        <TextInput
                          style={styles.setInput}
                          placeholder="0"
                          placeholderTextColor={Colors.muted}
                          value={set.weight}
                          onChangeText={(v) => updateSet(exIdx, setIdx, 'weight', v)}
                          keyboardType="decimal-pad"
                        />
                        <TextInput
                          style={styles.setInput}
                          placeholder="0"
                          placeholderTextColor={Colors.muted}
                          value={set.reps}
                          onChangeText={(v) => updateSet(exIdx, setIdx, 'reps', v)}
                          keyboardType="numeric"
                        />
                        <TouchableOpacity onPress={() => removeSet(exIdx, setIdx)}>
                          <Ionicons name="remove-circle-outline" size={20} color={ex.sets.length > 1 ? Colors.red : Colors.border} />
                        </TouchableOpacity>
                      </View>
                    ))}
                    <TouchableOpacity style={styles.addSetBtn} onPress={() => addSet(exIdx)}>
                      <Ionicons name="add-circle-outline" size={17} color={Colors.accent} />
                      <Text style={styles.addSetText}>Add Set</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </>
            )}
            <Text style={styles.fieldLabel}>Notes (optional)</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="How did it go?"
              placeholderTextColor={Colors.muted}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />
            <TouchableOpacity
              style={[styles.saveBtn, exercises.length === 0 && { opacity: 0.5 }]}
              onPress={handleSave}
              disabled={exercises.length === 0}
            >
              <Text style={styles.saveBtnText}>🔥 Save Workout</Text>
            </TouchableOpacity>
            <View style={{ height: 60 }} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const pick = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg, padding: Spacing.lg, paddingTop: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  title: { fontSize: 22, fontWeight: '800', color: Colors.text },
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.md, height: 44, marginBottom: Spacing.md },
  searchInput: { flex: 1, color: Colors.text, fontSize: 14 },
  exRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  exRowSelected: { borderColor: Colors.accent, backgroundColor: 'rgba(0,245,196,0.07)' },
  exEmoji: { fontSize: 28, marginRight: Spacing.md },
  exInfo: { flex: 1 },
  exName: { color: Colors.text, fontWeight: '600', fontSize: 15 },
  exMuscle: { color: Colors.muted, fontSize: 12, marginTop: 2 },
  checkCircle: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  checkCircleActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  emptyText: { color: Colors.muted, textAlign: 'center', paddingVertical: 20, fontSize: 14 },
  customSection: { marginTop: Spacing.lg, marginBottom: Spacing.xl },
  customLabel: { color: Colors.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: Spacing.sm },
  customRow: { flexDirection: 'row', gap: Spacing.sm },
  customInput: { flex: 1, backgroundColor: Colors.card, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.md, color: Colors.text, height: 48, fontSize: 14 },
  customBtn: { backgroundColor: Colors.accent, borderRadius: Radius.md, paddingHorizontal: Spacing.lg, alignItems: 'center', justifyContent: 'center', height: 48 },
  customBtnText: { color: Colors.bg, fontWeight: '800', fontSize: 14 },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.lg, paddingTop: 60 },
  pageTitle: { fontSize: 28, fontWeight: '800', color: Colors.text },
  pageSub: { color: Colors.muted, fontSize: 14, marginTop: 4 },
  legend: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm, marginBottom: Spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { color: Colors.muted, fontSize: 12, fontWeight: '600' },
  calWrap: { borderRadius: Radius.xl, overflow: 'hidden', marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  dayTitle: { color: Colors.text, fontSize: 18, fontWeight: '700' },
  dayBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full, alignSelf: 'flex-start', marginTop: 4 },
  dayBadgeIcon: { fontSize: 12 },
  dayBadgeText: { fontSize: 12, fontWeight: '700' },
  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.accent, borderRadius: Radius.full, paddingHorizontal: 16, paddingVertical: 8, gap: 4 },
  addBtnText: { color: Colors.bg, fontWeight: '700', fontSize: 14 },
  addBtnSecondary: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Spacing.md, paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.accent },
  addBtnSecondaryText: { color: Colors.accent, fontWeight: '700', fontSize: 13 },
  emptyDay: { alignItems: 'center', paddingVertical: 32 },
  restDay: { alignItems: 'center', paddingVertical: 32 },
  missedDay: { alignItems: 'center', paddingVertical: 32 },
  emptyText: { color: Colors.text, fontSize: 16, fontWeight: '600', marginTop: 8 },
  emptySub: { color: Colors.muted, fontSize: 14, marginTop: 4 },
  restBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: Spacing.lg, backgroundColor: 'rgba(255,159,67,0.12)', borderWidth: 1.5, borderColor: '#ff9f43', borderRadius: Radius.full, paddingHorizontal: 20, paddingVertical: 10 },
  restBtnIcon: { fontSize: 16 },
  restBtnText: { color: '#ff9f43', fontWeight: '700', fontSize: 14 },
  workoutCard: { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  workoutCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  typeBadge: { backgroundColor: 'rgba(0,245,196,0.15)', borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 4 },
  typeBadgeText: { color: Colors.accent, fontWeight: '700', fontSize: 12 },
  savedExBlock: { marginBottom: Spacing.sm },
  savedExHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  savedExEmoji: { fontSize: 18 },
  savedExName: { color: Colors.text, fontSize: 13, fontWeight: '700' },
  savedSetRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 3, paddingLeft: 24 },
  savedSetBadge: { backgroundColor: 'rgba(0,245,196,0.1)', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, minWidth: 44 },
  savedSetBadgeText: { color: Colors.accent, fontSize: 10, fontWeight: '700', textAlign: 'center' },
  savedSetDetail: { color: Colors.muted, fontSize: 13 },
  savedSetSep: { color: Colors.border, fontSize: 12 },
  workoutNote: { color: Colors.muted, fontSize: 13, marginTop: Spacing.sm, fontStyle: 'italic', borderTopWidth: 1, borderColor: Colors.border, paddingTop: Spacing.sm },
  modal: { flex: 1, backgroundColor: Colors.bg, padding: Spacing.lg, paddingTop: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  modalTitle: { fontSize: 22, fontWeight: '800', color: Colors.text },
  fieldLabel: { color: Colors.muted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.sm, marginTop: Spacing.md },
  typeChip: { borderRadius: Radius.full, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: Colors.border, marginRight: Spacing.sm, backgroundColor: Colors.card },
  typeChipActive: { backgroundColor: 'rgba(0,245,196,0.15)', borderColor: Colors.accent },
  typeChipText: { color: Colors.muted, fontWeight: '600', fontSize: 13 },
  selectExBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.accent, gap: Spacing.sm, marginBottom: Spacing.sm },
  selectExText: { flex: 1, color: Colors.text, fontWeight: '600', fontSize: 15 },
  exCard: { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  exCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md, gap: Spacing.sm },
  exCardEmoji: { fontSize: 28 },
  exCardName: { color: Colors.text, fontWeight: '700', fontSize: 15 },
  exCardMuscle: { color: Colors.muted, fontSize: 12 },
  setHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, paddingHorizontal: 2 },
  setHeaderCell: { flex: 1, color: Colors.muted, fontSize: 10, fontWeight: '700', letterSpacing: 1, textAlign: 'center' },
  setRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm, gap: Spacing.sm },
  setNumBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,245,196,0.15)', alignItems: 'center', justifyContent: 'center' },
  setNumText: { color: Colors.accent, fontWeight: '800', fontSize: 13 },
  setInput: { flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.sm, paddingVertical: 8, color: Colors.text, fontWeight: '700', fontSize: 16, textAlign: 'center', borderWidth: 1, borderColor: Colors.border },
  addSetBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: Spacing.sm, marginTop: 4 },
  addSetText: { color: Colors.accent, fontWeight: '600', fontSize: 14 },
  notesInput: { backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md, color: Colors.text, borderWidth: 1, borderColor: Colors.border, textAlignVertical: 'top', minHeight: 80, marginTop: 4 },
  saveBtn: { backgroundColor: Colors.accent, borderRadius: Radius.lg, height: 54, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.lg },
  saveBtnText: { color: Colors.bg, fontWeight: '800', fontSize: 16 },
});