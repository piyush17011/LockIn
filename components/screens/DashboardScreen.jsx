import { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Dimensions, LayoutAnimation, Platform, UIManager, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  FadeInDown,
  useSharedValue, useAnimatedStyle,
  withSpring, withTiming,
  runOnJS,
} from 'react-native-reanimated';
import LottieView from 'lottie-react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useWorkoutsContext } from '../../hooks/WorkoutsContext';
import { logoutUser } from '../../services/authService';
import { markRestDay } from '../../services/workoutService';
import { QUOTES } from '../../constants/exercises';

import { useTheme } from '../../hooks/ThemeContext';
import ColorSwitcher from './ColorSwitcher';
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: SW } = Dimensions.get('window');
const WEEK_DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function getTodayStatus(workouts) {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const w = workouts.find((w) => w.date === todayStr);
  if (!w) return { label: 'Rest day', icon: '😴', done: false };
  return { label: w.type, icon: '✅', done: true };
}

const shadow = (color = '#000', opacity = 0.1, radius = 12, y = 4) => ({
  shadowColor: color,
  shadowOffset: { width: 0, height: y },
  shadowOpacity: opacity,
  shadowRadius: radius,
  elevation: Math.round(radius / 2),
});

// ── Animated streak number ──────────────────────────────────
function AnimatedStreakNumber({ value, style, onDisplayChange }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (value === 0) return;
    let start = 0;
    const duration = 900;
    const steps = 30;
    const increment = value / steps;
    const interval = duration / steps;
    const timer = setInterval(() => {
      start += increment;
      const next = start >= value ? value : Math.floor(start);
      setDisplay(next);
      onDisplayChange?.(next);
      if (start >= value) clearInterval(timer);
    }, interval);
    return () => clearInterval(timer);
  }, [value]);
  return <Text style={style}>{display}</Text>;
}

// ── Week dot with spring entrance ──────────────────────────
function WeekDot({ day, index, worked, isToday, isRest, C, ff }) {
  const scale = useSharedValue(0);
  const now = new Date(); now.setHours(0,0,0,0);
  const dayDate = new Date(day); dayDate.setHours(0,0,0,0);
  const isPast   = dayDate < now;
  const isMissed = isPast && !worked && !isRest;

  useEffect(() => {
    setTimeout(() => {
      scale.value = withSpring(1, {
        damping: worked ? 8 : 14,
        stiffness: worked ? 180 : 120,
      });
    }, index * 60);
  }, []);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const bgColor = worked   ? C.accent
    : isRest               ? '#ff9f4322'
    : isMissed             ? '#ff6b6b18'
    : isToday              ? C.accent + '11'
    : C.surface;

  const borderColor = worked ? 'transparent'
    : isRest   ? '#ff9f4366'
    : isMissed ? '#ff6b6b66'
    : isToday  ? C.accent
    : C.border;

  return (
    <View style={{ alignItems: 'center', gap: 6 }}>
      <Text style={[{ fontSize: 11, letterSpacing: 0.5, color: isToday ? C.accent : C.textSub }, ff.heading]}>
        {WEEK_DAYS[index]}
      </Text>
      <Animated.View style={animStyle}>
        <View style={{
          width: 34, height: 34, borderRadius: 17,
          alignItems: 'center', justifyContent: 'center',
          backgroundColor: bgColor,
          borderWidth: 1.5, borderColor,
          ...shadow(worked ? C.accent : '#000', worked ? 0.25 : 0.05, 8, 3),
        }}>
          {worked
            ? <Ionicons name="checkmark" size={16} color={C.bg} />
            : isRest
              ? <Text style={{ fontSize: 14 }}>😴</Text>
            : isMissed
              ? <Text style={{ fontSize: 14 }}>❌</Text>
            : isToday
              ? <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.accent }} />
            : null
          }
        </View>
      </Animated.View>
    </View>
  );
}

// ── Expandable workout card ─────────────────────────────────
function WorkoutCard({ w, idx, todayStr, C, ff }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const yesterdayStr = format(addDays(new Date(), -1), 'yyyy-MM-dd');
  const dayLabel =
    w.date === todayStr     ? 'Today'     :
    w.date === yesterdayStr ? 'Yesterday' :
    format(parseISO(w.date), 'EEE, MMM d');

  const toggle = () => {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(260, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity)
    );
    setIsExpanded(prev => !prev);
  };

  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(340 + idx * 60)}
      style={{ backgroundColor: C.card, borderRadius: 18, overflow: 'hidden', ...shadow('#000', 0.07, 12, 3) }}
    >
      <View style={{ height: 3, backgroundColor: C.accent + (idx === 0 ? 'FF' : idx === 1 ? 'AA' : '66') }} />
      <TouchableOpacity onPress={toggle} activeOpacity={0.8} style={{ padding: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{
            width: 42, height: 42, borderRadius: 14,
            backgroundColor: C.accent + '18',
            alignItems: 'center', justifyContent: 'center', marginRight: 12,
          }}>
            <Ionicons name="barbell-outline" size={20} color={C.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={[{ fontSize: 15, color: C.text }, ff.heading]}>{w.type}</Text>
              {w.exercises?.length > 0 && (
                <View style={{ backgroundColor: C.accent + '18', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 }}>
                  <Text style={[{ fontSize: 10, color: C.accent }, ff.heading]}>{w.exercises.length} ex</Text>
                </View>
              )}
            </View>
            <Text style={[{ fontSize: 12, color: C.textSub, marginTop: 2 }, ff.body]}>{dayLabel}</Text>
          </View>
          <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={C.textSub} />
        </View>

        {isExpanded && (
          <View style={{ marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: C.border }}>
            {w.exercises?.map((ex, i) => {
              const repsArr   = ex.reps   ? ex.reps.toString().split('/')   : [];
              const weightArr = ex.weight ? ex.weight.toString().split('/') : [];
              const setCount  = ex.sets || repsArr.length || 1;
              return (
                <View key={i} style={{ marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <Text style={{ fontSize: 14 }}>{ex.emoji || '💪'}</Text>
                    <Text style={[{ fontSize: 13, color: C.text }, ff.heading]}>{ex.name}</Text>
                  </View>
                  <View style={{ gap: 4, paddingLeft: 20 }}>
                    {Array.from({ length: setCount }).map((_, si) => (
                      <View key={si} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={{ backgroundColor: C.accent + '18', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 }}>
                          <Text style={[{ fontSize: 10, color: C.accent }, ff.heading]}>Set {si + 1}</Text>
                        </View>
                        <Text style={[{ fontSize: 13, color: C.textSub }, ff.body]}>
                          {weightArr[si] || '0'}kg · {repsArr[si] || '0'} reps
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              );
            })}
            {w.notes && (
              <View style={{ flexDirection: 'row', gap: 6, alignItems: 'flex-start', borderTopWidth: 1, borderTopColor: C.border, paddingTop: 10, marginTop: 4 }}>
                <Ionicons name="document-text-outline" size={13} color={C.textSub} />
                <Text style={[{ fontSize: 12, color: C.textSub, fontStyle: 'italic', flex: 1 }, ff.body]}>{w.notes}</Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function DashboardScreen({ navigation }) {
  const { scheme: C, font: F } = useTheme();
  const ff = {
    display:  { fontFamily: F.display },
    heading:  { fontFamily: F.heading },
    body:     { fontFamily: F.body },
    bodySemi: { fontFamily: F.bodySemi },
  };

  const { user, userData }      = useAuth();
  const { workouts, loading, restDays = [], addRestDayLocally } = useWorkoutsContext();
  const [quote]                 = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);


  // ── Pending session banner ─────────────────────────────────
  const [pendingSession, setPendingSession] = useState(null);
  useEffect(() => {
    const checkSession = async () => {
      try {
        const raw = await AsyncStorage.getItem('active_workout_session'); // matches SESSION_KEY in WorkoutSessionScreen
        if (raw) {
          const session = JSON.parse(raw);
          // Only show banner if it belongs to current user
          if (session.userId === user?.uid) setPendingSession(session);
          else setPendingSession(null);
        } else {
          setPendingSession(null);
        }
      } catch { setPendingSession(null); }
    };
    checkSession();
    // Re-check whenever screen focuses
    const unsubscribe = navigation.addListener('focus', checkSession);
    return unsubscribe;
  }, [user?.uid]);

  // Fire size — grows as count-up runs, capped at 96
  const [displayStreak, setDisplayStreak] = useState(0);
  const fireSize = Math.min(96, 76 + Math.floor(displayStreak / 5) * 4);

  // ── 3. Action buttons — individual spring scale on mount ───
  const actionScales = [0,1,2,3].map(() => useSharedValue(0));
  useEffect(() => {
    actionScales.forEach((sv, i) => {
      setTimeout(() => {
        sv.value = withSpring(1, { damping: 10, stiffness: 160 });
      }, 200 + i * 60);
    });
  }, []);

  // ── 6. Quote — fade + slide up ─────────────────────────────
  const quoteOpacity   = useSharedValue(0);
  const quoteTranslate = useSharedValue(14);
  useEffect(() => {
    setTimeout(() => {
      quoteOpacity.value   = withTiming(1, { duration: 600 });
      quoteTranslate.value = withTiming(0, { duration: 600 });
    }, 400);
  }, []);
  const quoteStyle = useAnimatedStyle(() => ({
    opacity: quoteOpacity.value,
    transform: [{ translateY: quoteTranslate.value }],
  }));

  // ── Lottie refs ────────────────────────────────────────────
  const checkmarkRef     = useRef(null);
  const communityRef     = useRef(null);  // top bar icon
  const communityCardRef = useRef(null);  // community card below quote

  // Play checkmark once after mount if today is done
  const todayStatus = getTodayStatus(workouts);
  useEffect(() => {
    if (todayStatus.done) {
      setTimeout(() => checkmarkRef.current?.play(), 600);
    }
  }, [todayStatus.done]);

  // Data
  const weekStart     = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays      = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekStart_str = format(weekDays[0], 'yyyy-MM-dd');
  const weekEnd_str   = format(weekDays[6], 'yyyy-MM-dd');
  const todayStr      = format(new Date(), 'yyyy-MM-dd');

  const todayWorkout = workouts.find(w => w.date === todayStr) || null;
  const workedDates  = new Set(workouts.map(w => w.date));
  
  const restDatesSet = new Set(restDays);
  const todayStr_    = format(new Date(), 'yyyy-MM-dd');
  const isTodayRest  = restDatesSet.has(todayStr_);
  const isTodayWorked = workedDates.has(todayStr_);
  const typeMap      = {};
  [...workouts].reverse().forEach(w => { typeMap[w.date] = w.type; });

  const streak      = userData?.streak || 0;
  const bestStreak  = userData?.longestStreak || 0;
  const weekCount   = new Set(
    workouts.filter(w => w.date >= weekStart_str && w.date <= weekEnd_str).map(w => w.date)
  ).size;
  const displayName = (userData?.displayName || user?.displayName || 'Athlete');

  const ACTIONS = [
    { label: 'Log',      icon: 'barbell-outline',  color: C.accent,  tab: 'LogWorkout',   onPress: () => {
        if (pendingSession) {
          navigation.navigate('WorkoutSession', {
            workout:           pendingSession.workout,
            date:              pendingSession.date,
            restoredExercises: pendingSession.exercises,
            restoredSets:      pendingSession.sets,
            wallStart:         pendingSession.wallStart,
            onSave:            (w) => { addWorkoutLocally?.(w); },
          });
        } else {
          navigation.navigate('LogWorkout');
        }
      }
    },
    { label: 'Body',     icon: 'body-outline',      color: '#7b61ff', tab: 'Measurements' },
    { label: 'Calories', icon: 'flame-outline',     color: '#ff9f43', tab: 'Calories'     },
    { label: 'Muscles',  icon: 'fitness-outline',   color: '#54a0ff', tab: 'MuscleMap'    },
  ];

  

  const handleMarkRest = () => {
    Alert.alert('Mark as Rest Day?', 'This will count toward your streak.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Mark Rest', onPress: () => {
        addRestDayLocally?.(todayStr_);
        markRestDay(user.uid, todayStr_).catch(() => Alert.alert('Error', 'Could not save rest day.'));
      }},
    ]);
  };

  const cardBg = C.card;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 48 }}
      >

        {/* ── TOP BAR ── */}
        <Animated.View entering={FadeInDown.duration(400)} style={{
          flexDirection: 'row', justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 20, paddingTop: 10, paddingBottom: 8,
        }}>
          <TouchableOpacity
            onPress={() => navigation.navigate('UserProfile')}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
            activeOpacity={0.8}
          >
            <View style={{
              width: 44, height: 44, borderRadius: 22,
              backgroundColor: C.accent + '22',
              borderWidth: 2, borderColor: C.accent + '55',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={[{ fontSize: 20, color: C.accent }, ff.display]}>
                {displayName[0].toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={[{ fontSize: 11, color: C.textSub, letterSpacing: 0.5 }, ff.body]}>
                Good {getTimeOfDay()}
              </Text>
              <Text style={[{ fontSize: 17, color: C.text, letterSpacing: -0.3 }, ff.heading]}>
                {displayName} 👋
              </Text>
            </View>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <ColorSwitcher />
            {/* ── Community feed button with Lottie ── */}
            <TouchableOpacity
              onPress={() => navigation.navigate('Feed')}
              onPressIn={() => communityRef.current?.play()}
              style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
            >
              <LottieView
                ref={communityRef}
                source={require('../../assets/animations/community.json')}
                loop={false}
                autoPlay={false}
                style={{ width: 36, height: 36 }}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => logoutUser()}
              style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="log-out-outline" size={18} color={C.textSub} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ── STREAK HERO ── */}
        <Animated.View entering={FadeInDown.duration(500).delay(60)} style={{ paddingHorizontal: 20, marginTop: 12 }}>
          <View style={{
            borderRadius: 24, overflow: 'hidden',
            backgroundColor: cardBg,
            ...shadow(C.accent, 0.18, 20, 6),
          }}>
            <View style={{ height: 3, backgroundColor: C.accent, borderRadius: 2 }} />
            <View style={{ padding: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>

                  {/* ── 🔥 Streak fire Lottie — grows with count-up ── */}
                  <LottieView
                    source={require('../../assets/animations/fire.json')}
                    autoPlay
                    loop
                    style={{ width: fireSize, height: fireSize, marginBottom: 4 }}
                  />

                  <View>
                    {/* ── 1. Count-up streak number ── */}
                    <AnimatedStreakNumber
                      value={streak}
                      onDisplayChange={setDisplayStreak}
                      style={[{ fontSize: 75, lineHeight: 72, color: C.accent, letterSpacing: -2 }, ff.display]}
                    />
                    <Text style={[{ fontSize: 13, color: C.textSub, letterSpacing: 1, marginTop: -4 }, ff.heading]}>
                      DAY STREAK
                    </Text>
                  </View>
                </View>

                {/* Right col: today status + best streak */}
                <View style={{ alignItems: 'flex-end', gap: 10 }}>
                  {/* Today pill — with Lottie status icons */}
                  <View style={{
                    backgroundColor: todayStatus.done ? C.accent + '22' : C.surface,
                    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8,
                    borderWidth: 1,
                    borderColor: todayStatus.done ? C.accent + '55' : C.border,
                    alignItems: 'center',
                  }}>
                    {/* ── 5. Today status Lottie ── */}
                    {todayStatus.done ? (
                      <LottieView
                        ref={checkmarkRef}
                        source={require('../../assets/animations/checkmark.json')}
                        loop={false}
                        autoPlay={false}
                        style={{ width: 80, height: 80, margin: -22 }}
                      />
                    ) : (
                      <LottieView
                        source={require('../../assets/animations/sleeping.json')}
                        autoPlay
                        loop
                        style={{ width: 56, height: 56 }}
                      />
                    )}
                    <Text style={[{
                      fontSize: 11, marginTop: 3, letterSpacing: 0.5,
                      color: todayStatus.done ? C.accent : C.textSub,
                    }, ff.heading]}>
                      {todayStatus.label}
                    </Text>
                  </View>
                  {/* Best streak */}
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[{ fontSize: 10, color: C.textSub, letterSpacing: 1 }, ff.body]}>Personal best</Text>
                    <Text style={[{ fontSize: 22, color: C.textSub, letterSpacing: -1 }, ff.display]}>
                      {bestStreak} <Text style={[{ fontSize: 11 }, ff.body]}>days</Text>
                    </Text>
                  </View>
                </View>
              </View>

              {/* Week progress bar */}
              <View style={{ marginTop: 20 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={[{ fontSize: 11, color: C.textSub, letterSpacing: 0.5 }, ff.body]}>This week</Text>
                  <Text style={[{ fontSize: 11, color: C.accent }, ff.heading]}>{weekCount}/7 days</Text>
                </View>
                <View style={{ height: 6, backgroundColor: C.surface, borderRadius: 3, overflow: 'hidden' }}>
                  <View style={{
                    height: '100%',
                    width: `${(weekCount / 7) * 100}%`,
                    backgroundColor: C.accent,
                    borderRadius: 3,
                  }} />
                </View>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* ── WEEK TRACKER ── */}
        <Animated.View entering={FadeInDown.duration(500).delay(120)} style={{ paddingHorizontal: 20, marginTop: 16 }}>
          <View style={{ backgroundColor: cardBg, borderRadius: 20, padding: 20, ...shadow('#000', 0.07, 14, 4) }}>
            <Text style={[{ fontSize: 12, color: C.textSub, letterSpacing: 1, marginBottom: 16 }, ff.heading]}>
              WEEKLY OVERVIEW
            </Text>
            {loading ? (
              <Text style={[{ color: C.textSub, textAlign: 'center', fontSize: 12 }, ff.body]}>Loading...</Text>
            ) : (
              // ── 2. Week dots with staggered spring entrance ──
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                {weekDays.map((day, i) => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const isToday = isSameDay(day, new Date());
                  const worked  = workedDates.has(dateStr);
                  return (
                    <WeekDot
                      key={i}
                      day={day}
                      index={i}
                      worked={worked}
                      isToday={isToday}
                      isRest={restDatesSet.has(format(day, 'yyyy-MM-dd'))}
                      C={C}
                      ff={ff}
                    />
                  );
                })}
              </View>
            )}
          </View>
        </Animated.View>

        {/* ── CONTINUE WORKOUT BANNER ── */}
        {pendingSession && (
          <Animated.View entering={FadeInDown.duration(400).delay(100)} style={{ paddingHorizontal: 20, marginTop: 16 }}>
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => navigation.navigate('WorkoutSession', {
                workout:           pendingSession.workout,
                date:              pendingSession.date,
                restoredExercises: pendingSession.exercises,
                restoredSets:      pendingSession.sets,
                wallStart:         pendingSession.wallStart,
                onSave:            (w) => { },
              })}
              style={{
                backgroundColor: 'rgba(0,245,196,0.08)',
                borderRadius: 18, padding: 16,
                borderWidth: 1.5, borderColor: 'rgba(0,245,196,0.35)',
                flexDirection: 'row', alignItems: 'center', gap: 14,
              }}
            >
              <View style={{
                width: 48, height: 48, borderRadius: 24,
                backgroundColor: 'rgba(0,245,196,0.15)',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Ionicons name="play-circle" size={28} color={C.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[{ fontSize: 15, color: C.accent, fontWeight: '800' }, ff.heading]}>
                  Continue Your Workout
                </Text>
                <Text style={[{ fontSize: 12, color: C.textSub, marginTop: 2 }, ff.body]}>
                  {pendingSession.workout?.type} · tap to resume
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={C.accent} />
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* ── MARK REST DAY BANNER ── */}
        {!isTodayWorked && !isTodayRest && (
          <Animated.View entering={FadeInDown.duration(400).delay(120)} style={{ paddingHorizontal: 20, marginTop: 16 }}>
            <TouchableOpacity
              onPress={handleMarkRest}
              activeOpacity={0.85}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 14,
                backgroundColor: '#ff9f4312',
                borderRadius: 18, padding: 16,
                borderWidth: 1.5, borderColor: '#ff9f4344',
              }}
            >
              <View style={{
                width: 44, height: 44, borderRadius: 22,
                backgroundColor: '#ff9f4322',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Text style={{ fontSize: 22 }}>😴</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[{ fontSize: 14, color: '#ff9f43' }, ff.heading]}>Mark Today as Rest Day</Text>
                <Text style={[{ fontSize: 12, color: C.textSub, marginTop: 2 }, ff.body]}>Recovery counts toward your streak</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#ff9f43" />
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* ── QUICK ACTIONS GRID ── */}
        <Animated.View entering={FadeInDown.duration(500).delay(180)} style={{ paddingHorizontal: 20, marginTop: 16 }}>
          <Text style={[{ fontSize: 12, color: C.textSub, letterSpacing: 1, marginBottom: 12 }, ff.heading]}>
            QUICK ACTIONS
          </Text>
          {/* ── 3. Staggered spring scale entrance ── */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {ACTIONS.map((action, i) => {
              const scaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: actionScales[i].value }] }));
              return (
                <Animated.View key={action.label} style={[{ flex: 1 }, scaleStyle]}>
                  <TouchableOpacity
                    onPress={() => action.onPress ? action.onPress() : navigation.navigate(action.tab)}
                    activeOpacity={0.75}
                    style={{
                      backgroundColor: cardBg,
                      borderRadius: 18, padding: 14,
                      alignItems: 'center', gap: 10,
                      ...shadow(action.color, 0.12, 12, 4),
                    }}
                  >
                    <View style={{
                      width: 46, height: 46, borderRadius: 23,
                      backgroundColor: action.color + '18',
                      alignItems: 'center', justifyContent: 'center',
                      borderWidth: 1.5, borderColor: action.color + '35',
                    }}>
                      <Ionicons name={action.icon} size={22} color={action.color} />
                    </View>
                    <Text style={[{ fontSize: 11, color: C.textSub, textAlign: 'center', letterSpacing: 0.3 }, ff.body]}>
                      {action.label}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        </Animated.View>

        {/* ── QUOTE ── */}
        {/* ── 6. Fade + slide up ── */}
        <Animated.View style={[quoteStyle, { paddingHorizontal: 20, marginTop: 16 }]}>
          <View style={{
            backgroundColor: cardBg, borderRadius: 20,
            padding: 20, borderLeftWidth: 3, borderLeftColor: C.accent,
            ...shadow('#000', 0.06, 10, 3),
          }}>
            <Text style={[{ fontSize: 13, color: C.textSub, fontStyle: 'italic', lineHeight: 21 }, ff.body]}>
              "{quote.text}"
            </Text>
            <Text style={[{ fontSize: 11, color: C.accent, marginTop: 8, letterSpacing: 0.5 }, ff.heading]}>
              — {quote.author}
            </Text>
          </View>
        </Animated.View>

        {/* ── COMMUNITY + SHARE ROW ── */}
        <Animated.View entering={FadeInDown.duration(500).delay(280)} style={{
          flexDirection: 'row', gap: 10,
          paddingHorizontal: 20, marginTop: 16,
        }}>
          {/* Community */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Feed')}
            activeOpacity={0.8}
            style={{
              flex: 1, backgroundColor: '#7b61ff18',
              borderRadius: 18, padding: 16,
              borderWidth: 1, borderColor: '#7b61ff33',
              alignItems: 'center', gap: 8,
              
            }}
          onPressIn={() => communityCardRef.current?.play()}
          >
            <LottieView
              ref={communityCardRef}
              source={require('../../assets/animations/community.json')}
              loop={false}
              autoPlay={false}
              style={{ width: 116, height: 66 }}
            />
            <Text style={[{ fontSize: 18, color: '#9b81ff', textAlign: 'center', letterSpacing: 0.3 }, ff.heading]}>
              Community{'\n'}Feed
            </Text>
          </TouchableOpacity>

          {/* Share workout */}
          {todayWorkout ? (
            <TouchableOpacity
              onPress={() => navigation.navigate('WorkoutShare', {
                workout: todayWorkout,
                streak: userData?.streak || 0,
                userName: displayName,
                userId: user?.uid,
              })}
              activeOpacity={0.8}
              style={{
                flex: 1, backgroundColor: C.accent + '18',
                borderRadius: 18, padding: 16,
                borderWidth: 1, borderColor: C.accent + '33',
                alignItems: 'center', gap: 8,
               
              }}
            >
              <View style={{
                width: 56, height: 56, borderRadius: 18,
                backgroundColor: C.accent,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Ionicons name="share-social" size={16} color={C.bg} />
              </View>
              <Text style={[{ fontSize: 19, color: C.accent, textAlign: 'center', letterSpacing: 0.3 }, ff.heading]}>
                Share{'\n'}{todayWorkout.type}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={{
              flex: 1, backgroundColor: C.surface,
              borderRadius: 18, padding: 16,
              borderWidth: 1, borderColor: C.border,
              alignItems: 'center', gap: 8, justifyContent: 'center',
            }}>
              <Text style={{ fontSize: 28 }}>😴</Text>
              <Text style={[{ fontSize: 11, color: C.textSub, textAlign: 'center' }, ff.body]}>
                No workout{'\n'}today yet
              </Text>
            </View>
          )}
        </Animated.View>

        {/* ── RECENT WORKOUTS ── */}
        {!loading && workouts.length > 0 && (
          <Animated.View entering={FadeInDown.duration(500).delay(320)} style={{ paddingHorizontal: 20, marginTop: 24 }}>
            <Text style={[{ fontSize: 12, color: C.textSub, letterSpacing: 1, marginBottom: 12 }, ff.heading]}>
              RECENT WORKOUTS
            </Text>
            {/* ── 4. Smooth expand/collapse via LayoutAnimation ── */}
            <View style={{ gap: 10 }}>
              {workouts.slice(0, 3).map((w, idx) => (
                <WorkoutCard
                  key={w.id}
                  w={w}
                  idx={idx}
                  todayStr={todayStr}
                  C={C}
                  ff={ff}
                />
              ))}
            </View>
          </Animated.View>
        )}

      </ScrollView>

    </View>
  );
}
