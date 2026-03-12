import { useState, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, ScrollView, TouchableOpacity,
  Alert, Modal, Animated as RNAnimated,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import Animated, {
  FadeInDown, FadeInUp, FadeIn, FadeOut,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useWorkoutsContext } from '../../hooks/WorkoutsContext';
import { deleteWorkout, markRestDay } from '../../services/workoutService';
import WorkoutShareSheet from './WorkoutShareSheet';
import { PRESET_EXERCISES } from '../../constants/exercises';
import { useTheme } from '../../hooks/ThemeContext';
import { format, parseISO, isBefore, startOfDay } from 'date-fns';

const TODAY = format(new Date(), 'yyyy-MM-dd');

// ── Fallbacks ──────────────────────────────────────────────
const HIIT_FALLBACK = [
  { name: 'Burpees',           emoji: '🔥', muscle: 'Full Body' },
  { name: 'Jump Squats',       emoji: '⚡', muscle: 'Legs'      },
  { name: 'Mountain Climbers', emoji: '🏔️', muscle: 'Core'      },
  { name: 'High Knees',        emoji: '🦵', muscle: 'Cardio'    },
  { name: 'Box Jumps',         emoji: '📦', muscle: 'Legs'      },
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
  { name: 'Deadlift',       emoji: '🏋️', muscle: 'Full Body'  },
  { name: 'Pull-Ups',       emoji: '💪', muscle: 'Back'        },
  { name: 'Push-Ups',       emoji: '👊', muscle: 'Chest'       },
  { name: 'Squats',         emoji: '🦵', muscle: 'Legs'        },
  { name: 'Overhead Press', emoji: '🙌', muscle: 'Shoulders'   },
  { name: 'Plank',          emoji: '🧱', muscle: 'Core'        },
];

const toPresetEx = (e) => ({ ...e, sets: [{ weight: '', reps: '' }] });

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

// Soft shadow helper (matches Dashboard)
const shadow = (color = '#000', opacity = 0.1, radius = 12, y = 4) => ({
  shadowColor: color,
  shadowOffset: { width: 0, height: y },
  shadowOpacity: opacity,
  shadowRadius: radius,
  elevation: Math.round(radius / 2),
});

export default function CalendarScreen({ navigation, route }) {
  const { scheme: C, font: F } = useTheme();
  const ff = {
    display:  { fontFamily: F.display },
    heading:  { fontFamily: F.heading },
    body:     { fontFamily: F.body },
    bodySemi: { fontFamily: F.bodySemi },
  };

  const { user, userData } = useAuth();
  const { workouts, restDays, refresh, addWorkoutLocally, removeWorkoutLocally, addRestDayLocally } = useWorkoutsContext();

  const [selected,     setSelected]     = useState(TODAY);
  const [shareWorkout, setShareWorkout] = useState(null);
  // Controls whether day-detail section is visible — used for fade swap
  const [detailKey, setDetailKey] = useState(TODAY);

  // ── 7. Scroll-aware header ──────────────────────────────
  const scrollY      = useRef(new RNAnimated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({ inputRange: [0, 60], outputRange: [1, 0], extrapolate: 'clamp' });
  const headerHeight  = scrollY.interpolate({ inputRange: [0, 60], outputRange: [64, 0],  extrapolate: 'clamp' });

  // 5. Log button — smooth fade in only (no pulse)

  useFocusEffect(useCallback(() => { refresh(); }, []));

  // ── Derived data ────────────────────────────────────────
  const workoutDates  = new Set(workouts.map(w => w.date));
  const restDatesSet  = new Set(restDays);

  const DAY_COLORS = {
    workout: { bg: C.accent + '28', border: C.accent,  text: C.accent   },
    rest:    { bg: '#ff9f4328',     border: '#ff9f43',  text: '#ff9f43'  },
    missed:  { bg: '#ff6b6b28',     border: '#ff6b6b',  text: '#ff6b6b'  },
  };

  const markedDates = {};
  workouts.forEach(w => {
    markedDates[w.date] = { customStyles: {
      container: { backgroundColor: DAY_COLORS.workout.bg, borderRadius: 10, borderWidth: 1.5, borderColor: DAY_COLORS.workout.border },
      text:      { color: DAY_COLORS.workout.text, fontWeight: '800' },
    }};
  });
  restDays.forEach(date => {
    if (!workoutDates.has(date)) {
      markedDates[date] = { customStyles: {
        container: { backgroundColor: DAY_COLORS.rest.bg, borderRadius: 10, borderWidth: 1.5, borderColor: DAY_COLORS.rest.border },
        text:      { color: DAY_COLORS.rest.text, fontWeight: '800' },
      }};
    }
  });

  const allActivityDates  = [...workoutDates, ...restDatesSet].sort();
  const firstActivityDate = allActivityDates.length > 0 ? allActivityDates[0] : null;
  if (firstActivityDate) {
    for (let i = 1; i <= 365; i++) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const dateStr = format(d, 'yyyy-MM-dd');
      if (dateStr < firstActivityDate) break;
      if (!workoutDates.has(dateStr) && !restDatesSet.has(dateStr)) {
        markedDates[dateStr] = { customStyles: {
          container: { backgroundColor: DAY_COLORS.missed.bg, borderRadius: 10, borderWidth: 1.5, borderColor: DAY_COLORS.missed.border },
          text:      { color: DAY_COLORS.missed.text, fontWeight: '800' },
        }};
      }
    }
  }

  // Selected day highlight
  const existing = markedDates[selected]?.customStyles || {};
  markedDates[selected] = { customStyles: {
    container: { ...(existing.container || {}), borderWidth: 2.5, borderColor: C.text },
    text: existing.text || { color: C.text, fontWeight: '800' },
  }};

  const dayWorkouts = workouts.filter(w => w.date === selected);
  const isRestDay   = restDatesSet.has(selected);
  const isPast      = selected < TODAY;
  const isToday     = selected === TODAY;
  const isFuture    = selected > TODAY;
  const isMissed    = isPast && !workoutDates.has(selected) && !restDatesSet.has(selected) && firstActivityDate !== null && selected >= firstActivityDate;

  // ── 2. Day selection — swap detail with fade ────────────
  const handleDayPress = (day) => {
    if (day.dateString > TODAY) {
      Alert.alert('Future date', "You can't log workouts for future dates!");
      return;
    }
    setSelected(day.dateString);
    setDetailKey(day.dateString); // triggers re-mount of Animated.View with new key
  };

  const openLogWorkout  = () => navigation.navigate('LogWorkout', { date: selected });
  const openEditWorkout = (w) => navigation.navigate('LogWorkout', { date: selected, editingWorkout: w });

  const handleMarkRest = () => {
    if (selected !== TODAY) return;
    Alert.alert('Mark as Rest Day?', 'This will count toward your streak.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Mark Rest', onPress: () => {
        addRestDayLocally(TODAY);
        markRestDay(user.uid, TODAY).catch(() => { Alert.alert('Error', 'Could not save rest day.'); refresh(); });
      }},
    ]);
  };

  const handleDelete = (id) => Alert.alert('Delete', 'Remove this workout?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: () => {
      removeWorkoutLocally(id);
      deleteWorkout(id).catch(() => { refresh(); Alert.alert('Error', 'Failed to delete workout.'); });
    }},
  ]);

  const getDayStatusBadge = () => {
    if (dayWorkouts.length > 0) return {
      label: dayWorkouts.length > 1 ? `${dayWorkouts.length} Workouts` : dayWorkouts[0].type,
      color: C.accent, bg: C.accent + '20', icon: '💪',
    };
    if (isRestDay)  return { label: 'Rest Day', color: '#ff9f43', bg: '#ff9f4320', icon: '😌' };
    if (isMissed)   return { label: 'Missed',   color: '#ff6b6b', bg: '#ff6b6b20', icon: '❌' };
    return null;
  };
  const badge = getDayStatusBadge();

  const LEGEND = [
    { color: DAY_COLORS.workout.border, label: 'Workout' },
    { color: DAY_COLORS.rest.border,    label: 'Rest'    },
    { color: DAY_COLORS.missed.border,  label: 'Missed'  },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <RNAnimated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48, paddingTop: 12 }}
        onScroll={RNAnimated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >

        {/* ── 7. SCROLL-AWARE HEADER ── */}
        <RNAnimated.View style={{ opacity: headerOpacity, height: headerHeight, overflow: 'hidden' }}>
          <Animated.View entering={FadeInDown.duration(400)}>
            <Text style={[{ fontSize: 26, color: C.text, letterSpacing: -0.5 }, ff.display]}>
              Workout Calendar
            </Text>
            <Text style={[{ fontSize: 13, color: C.textSub, marginTop: 3 }, ff.body]}>
              Tap a date to view or log workouts
            </Text>
          </Animated.View>
        </RNAnimated.View>

        {/* ── 6. LEGEND DOTS POP-IN ── */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(80)}
          style={{ flexDirection: 'row', gap: 16, marginTop: 12, marginBottom: 16 }}
        >
          {LEGEND.map((item, i) => (
            <Animated.View
              key={item.label}
              entering={FadeIn.duration(300).delay(80 + i * 60)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
            >
              <View style={{
                width: 10, height: 10, borderRadius: 5,
                backgroundColor: item.color,
                ...shadow(item.color, 0.4, 6, 2),
              }} />
              <Text style={[{ fontSize: 12, color: C.textSub }, ff.body]}>{item.label}</Text>
            </Animated.View>
          ))}
        </Animated.View>

        {/* ── 1. CALENDAR SLIDE-UP ENTRANCE ── */}
        <Animated.View
          entering={FadeIn.duration(400).delay(100)}
          style={{
            borderRadius: 22, overflow: 'hidden',
            marginBottom: 22,
            backgroundColor: C.card,
            borderWidth: 1, borderColor: C.border,
            ...shadow('#000', 0.1, 16, 5),
          }}
        >
          <Calendar
            markingType="custom"
            onDayPress={handleDayPress}
            maxDate={TODAY}
            markedDates={markedDates}
            theme={{
              backgroundColor:            C.card,
              calendarBackground:         C.card,
              dayTextColor:               C.text,
              textDisabledColor:          C.muted,
              monthTextColor:             C.text,
              arrowColor:                 C.accent,
              selectedDayBackgroundColor: C.accent,
              selectedDayTextColor:       C.bg,
              todayTextColor:             C.accent,
              dotColor:                   C.accent,
              textMonthFontSize:          15,
              textMonthFontWeight:        '700',
              textDayFontSize:            13,
              'stylesheet.calendar.header': {
                header: {
                  flexDirection: 'row', justifyContent: 'space-between',
                  paddingHorizontal: 10, paddingVertical: 10, alignItems: 'center',
                },
              },
            }}
          />
        </Animated.View>

        {/* ── 2. DAY DETAIL — key-based fade swap ── */}
        <Animated.View
          key={detailKey}
          entering={FadeIn.duration(250)}
          exiting={FadeOut.duration(150)}
        >
          {/* Day header row */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <View style={{ flex: 1 }}>
              <Text style={[{ fontSize: 18, color: C.text, letterSpacing: -0.3 }, ff.heading]}>
                {format(new Date(selected + 'T12:00:00'), 'EEEE, MMM d')}
              </Text>
              {badge && (
                <Animated.View
                  entering={FadeIn.duration(250).delay(100)}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 5,
                    paddingHorizontal: 10, paddingVertical: 4,
                    borderRadius: 20, alignSelf: 'flex-start', marginTop: 5,
                    backgroundColor: badge.bg,
                  }}
                >
                  <Text style={{ fontSize: 12 }}>{badge.icon}</Text>
                  <Text style={[{ fontSize: 12, color: badge.color }, ff.heading]}>{badge.label}</Text>
                </Animated.View>
              )}
            </View>

            {/* ── 5. LOG BUTTON PULSE ── */}
            {!isFuture && !isMissed && (
              <Animated.View entering={FadeIn.duration(400)}>
                <TouchableOpacity
                  onPress={openLogWorkout}
                  activeOpacity={0.85}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 6,
                    backgroundColor: C.accent, borderRadius: 20,
                    paddingHorizontal: 16, paddingVertical: 9,
                    ...shadow(C.accent, 0.35, 12, 4),
                  }}
                >
                  <Ionicons name="add" size={18} color={C.bg} />
                  <Text style={[{ color: C.bg, fontSize: 14 }, ff.heading]}>Log</Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>

          {/* ── Day content states ── */}

          {isFuture ? (
            // ── 4. FUTURE — bounce emoji ──
            <View style={{ alignItems: 'center', paddingVertical: 36 }}>
              <Animated.Text entering={FadeIn.duration(350)} style={{ fontSize: 48 }}>🔮</Animated.Text>
              <Text style={[{ fontSize: 16, color: C.text, marginTop: 12 }, ff.heading]}>Future date</Text>
              <Text style={[{ fontSize: 13, color: C.textSub, marginTop: 4 }, ff.body]}>Can't log workouts yet!</Text>
            </View>

          ) : isMissed ? (
            // ── 4. MISSED — bounce emoji ──
            <View style={{ alignItems: 'center', paddingVertical: 36 }}>
              <Animated.Text entering={FadeIn.duration(350)} style={{ fontSize: 48 }}>❌</Animated.Text>
              <Text style={[{ fontSize: 16, color: '#ff6b6b', marginTop: 12 }, ff.heading]}>Missed Day</Text>
              <Text style={[{ fontSize: 13, color: C.textSub, marginTop: 4 }, ff.body]}>Streak was broken here</Text>
            </View>

          ) : dayWorkouts.length === 0 && !isRestDay ? (
            // ── 4. EMPTY — bounce emoji ──
            <View style={{ alignItems: 'center', paddingVertical: 36 }}>
              <Animated.Text entering={FadeIn.duration(350)} style={{ fontSize: 48 }}>😴</Animated.Text>
              <Text style={[{ fontSize: 16, color: C.text, marginTop: 12 }, ff.heading]}>No workouts logged</Text>
              <Text style={[{ fontSize: 13, color: C.textSub, marginTop: 4 }, ff.body]}>Tap Log to add one</Text>
              {isToday && (
                <Animated.View entering={FadeInDown.duration(300).delay(200)}>
                  <TouchableOpacity
                    onPress={handleMarkRest}
                    activeOpacity={0.8}
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: 8,
                      marginTop: 20, borderWidth: 1.5, borderColor: '#ff9f43',
                      borderRadius: 20, paddingHorizontal: 18, paddingVertical: 10,
                      backgroundColor: '#ff9f4315',
                    }}
                  >
                    <Text style={{ fontSize: 16 }}>😌</Text>
                    <Text style={[{ color: '#ff9f43', fontSize: 14 }, ff.heading]}>Mark as Rest Day</Text>
                  </TouchableOpacity>
                </Animated.View>
              )}
            </View>

          ) : isRestDay && dayWorkouts.length === 0 ? (
            // ── 4. REST — bounce emoji ──
            <View style={{ alignItems: 'center', paddingVertical: 36 }}>
              <Animated.Text entering={FadeIn.duration(350)} style={{ fontSize: 48 }}>😌</Animated.Text>
              <Text style={[{ fontSize: 16, color: '#ff9f43', marginTop: 12 }, ff.heading]}>Rest Day</Text>
              <Text style={[{ fontSize: 13, color: C.textSub, marginTop: 4 }, ff.body]}>Recovery counts too</Text>
              {isToday && (
                <Animated.View entering={FadeInDown.duration(300).delay(200)}>
                  <TouchableOpacity
                    onPress={openLogWorkout}
                    activeOpacity={0.8}
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: 8,
                      marginTop: 20, borderWidth: 1.5, borderColor: C.accent,
                      borderRadius: 20, paddingHorizontal: 18, paddingVertical: 10,
                      backgroundColor: C.accent + '15',
                    }}
                  >
                    <Ionicons name="barbell-outline" size={16} color={C.accent} />
                    <Text style={[{ color: C.accent, fontSize: 14 }, ff.heading]}>Log Workout Instead</Text>
                  </TouchableOpacity>
                </Animated.View>
              )}
            </View>

          ) : (
            // ── 3. WORKOUT CARDS — staggered entrance ──
            <View style={{ gap: 12 }}>
              {dayWorkouts.map((w, idx) => (
                <Animated.View
                  key={w.id}
                  entering={FadeIn.duration(300).delay(idx * 70)}
                  style={{
                    backgroundColor: C.card,
                    borderRadius: 20, overflow: 'hidden',
                    borderWidth: 1, borderColor: C.border,
                    ...shadow(C.accent, 0.08, 14, 4),
                  }}
                >
                  {/* Top accent strip */}
                  <View style={{ height: 3, backgroundColor: C.accent }} />

                  <View style={{ padding: 16 }}>
                    {/* Card header */}
                    <View style={{
                      flexDirection: 'row', justifyContent: 'space-between',
                      alignItems: 'center', marginBottom: 12,
                    }}>
                      <View style={{
                        backgroundColor: C.accent + '20', borderRadius: 12,
                        paddingHorizontal: 12, paddingVertical: 5,
                      }}>
                        <Text style={[{ color: C.accent, fontSize: 13 }, ff.heading]}>{w.type}</Text>
                      </View>

                      {/* Action icons */}
                      <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
                        <TouchableOpacity
                          onPress={() => setShareWorkout(w)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons name="share-social-outline" size={18} color={C.accent} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => openEditWorkout(w)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons name="create-outline" size={18} color="#54a0ff" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDelete(w.id)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons name="trash-outline" size={18} color="#ff6b6b" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Exercises */}
                    {w.exercises?.map((ex, i) => {
                      const repsArr   = ex.reps   ? ex.reps.toString().split('/')   : [];
                      const weightArr = ex.weight ? ex.weight.toString().split('/') : [];
                      const setCount  = ex.sets || repsArr.length || 1;
                      return (
                        <View key={i} style={{ marginBottom: 10 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                            <Text style={{ fontSize: 17 }}>{ex.emoji || '💪'}</Text>
                            <Text style={[{ fontSize: 13, color: C.text }, ff.heading]}>{ex.name}</Text>
                          </View>
                          <View style={{ gap: 4, paddingLeft: 24 }}>
                            {Array.from({ length: setCount }).map((_, si) => (
                              <View key={si} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <View style={{
                                  backgroundColor: C.accent + '18',
                                  borderRadius: 7, paddingHorizontal: 7, paddingVertical: 2, minWidth: 46,
                                }}>
                                  <Text style={[{ color: C.accent, fontSize: 10, textAlign: 'center' }, ff.heading]}>
                                    Set {si + 1}
                                  </Text>
                                </View>
                                <Text style={[{ fontSize: 13, color: C.textSub }, ff.body]}>
                                  {weightArr[si] || '0'}kg
                                </Text>
                                <Text style={{ color: C.border, fontSize: 12 }}>·</Text>
                                <Text style={[{ fontSize: 13, color: C.textSub }, ff.body]}>
                                  {repsArr[si] || '0'} reps
                                </Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      );
                    })}

                    {/* Notes */}
                    {w.notes ? (
                      <View style={{
                        flexDirection: 'row', gap: 6, alignItems: 'flex-start',
                        borderTopWidth: 1, borderTopColor: C.border,
                        paddingTop: 10, marginTop: 4,
                      }}>
                        <Ionicons name="document-text-outline" size={13} color={C.textSub} style={{ marginTop: 1 }} />
                        <Text style={[{ fontSize: 13, color: C.textSub, fontStyle: 'italic', flex: 1 }, ff.body]}>
                          {w.notes}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </Animated.View>
              ))}
            </View>
          )}
        </Animated.View>

        <View style={{ height: 40 }} />
      </RNAnimated.ScrollView>

      {/* Share Modal */}
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
            userId={user?.uid}
            navigation={navigation}
            onClose={() => setShareWorkout(null)}
          />
        )}
      </Modal>
    </View>
  );
}
