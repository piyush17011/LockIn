import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInRight, useSharedValue, useAnimatedStyle, withSpring, withRepeat, withSequence } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useWorkoutsContext } from '../../hooks/WorkoutsContext';
import { logoutUser } from '../../services/authService';
import { QUOTES } from '../../constants/exercises';
import { Colors, Spacing, Radius } from '../../constants/theme';
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns';

const WEEK_DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function getTodayStatus(workouts) {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayWorkout = workouts.find((w) => w.date === todayStr);
  if (!todayWorkout) return { label: 'Rest', icon: '😴', color: Colors.muted };
  return { label: todayWorkout.type, icon: '✅', color: Colors.accent };
}

export default function DashboardScreen({ navigation }) {
  const { user, userData } = useAuth();
  const { workouts, loading } = useWorkoutsContext();
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  const [expandedId, setExpandedId] = useState(null);
  const streakScale = useSharedValue(1);

  useEffect(() => {
    streakScale.value = withRepeat(withSequence(withSpring(1.06), withSpring(1)), -1, true);
  }, []);

  const streakStyle = useAnimatedStyle(() => ({ transform: [{ scale: streakScale.value }] }));

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekStart_str = format(weekDays[0], 'yyyy-MM-dd');
  const weekEnd_str = format(weekDays[6], 'yyyy-MM-dd');

  const workedOutDates = new Set(workouts.map((w) => w.date));
  const workoutTypeMap = {};
  // Use first logged workout per date (workouts are sorted newest-first, so reverse)
  [...workouts].reverse().forEach((w) => { workoutTypeMap[w.date] = w.type; });

  const streak = userData?.streak || 0;
  const todayStatus = getTodayStatus(workouts);
  const weekCount = new Set(
    workouts.filter((w) => w.date >= weekStart_str && w.date <= weekEnd_str).map((w) => w.date)
  ).size;

  const QUICK_ACTIONS = [
    { label: 'Log Workout',  icon: 'barbell-outline', color: Colors.accent, tab: 'Calendar'     },
    { label: 'Measurements', icon: 'body-outline',    color: Colors.purple, tab: 'Measurements' },
    { label: 'Calories',     icon: 'flame-outline',   color: Colors.orange, tab: 'Calories'     },
    { label: 'Muscle Map',   icon: 'fitness-outline', color: Colors.blue,   tab: 'MuscleMap'    },
  ];

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
          <LinearGradient colors={['rgba(0,245,196,0.1)', 'transparent']} style={styles.headerGrad} />
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>Good {getTimeOfDay()},</Text>
              <Text style={styles.name}>{userData?.displayName || user?.displayName || 'Athlete'} 👋</Text>
            </View>
            <TouchableOpacity onPress={() => logoutUser()} style={styles.logoutBtn}>
              <Ionicons name="log-out-outline" size={22} color={Colors.muted} />
            </TouchableOpacity>
          </View>
          <View style={styles.quoteCard}>
            <Text style={styles.quoteText}>"{quote.text}"</Text>
            <Text style={styles.quoteAuthor}>— {quote.author}</Text>
          </View>
        </Animated.View>

        {/* Streak + Today + Week count */}
        <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.statRow}>
          <Animated.View style={[styles.streakCard, streakStyle]}>
            <LinearGradient colors={['rgba(0,245,196,0.2)', 'rgba(0,245,196,0.05)']} style={styles.streakGrad}>
              <Text style={styles.streakFire}>🔥</Text>
              <Text style={styles.streakNum}>{streak}</Text>
              <Text style={styles.streakLabel}>Day Streak</Text>
              <Text style={styles.streakSub}>Best: {userData?.longestStreak || 0}</Text>
            </LinearGradient>
          </Animated.View>
          <View style={styles.statRight}>
            <View style={[styles.statSmall, todayStatus.label !== 'Rest' && styles.statSmallActive]}>
              <Text style={styles.todayIcon}>{todayStatus.icon}</Text>
              <Text style={[styles.statSmallLabel, { color: todayStatus.color, fontWeight: '700' }]}>
                Today: {todayStatus.label}
              </Text>
            </View>
            <View style={styles.statSmall}>
              {loading ? (
                <Text style={styles.weekNum}>–</Text>
              ) : (
                <Text style={styles.weekNum}>{weekCount}<Text style={{ fontSize: 18, color: Colors.muted }}>/7</Text></Text>
              )}
              <Text style={styles.statSmallLabel}>This Week</Text>
            </View>
          </View>
        </Animated.View>

        {/* Weekly Overview */}
        <Animated.View entering={FadeInDown.duration(500).delay(200)} style={styles.weekCard}>
          <Text style={styles.sectionTitle}>Weekly Overview</Text>
          {loading ? (
            <Text style={[styles.dayLabel, { textAlign: 'center', marginTop: 12 }]}>Loading...</Text>
          ) : (
            <View style={styles.weekRow}>
              {weekDays.map((day, i) => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const isToday = isSameDay(day, new Date());
                const worked = workedOutDates.has(dateStr);
                const wType = workoutTypeMap[dateStr];
                return (
                  <View key={i} style={styles.dayCol}>
                    <Text style={[styles.dayLabel, isToday && { color: Colors.accent }]}>{WEEK_DAYS[i]}</Text>
                    <View style={[
                      styles.dayDot,
                      worked && styles.dayDotFilled,
                      isToday && !worked && { borderColor: Colors.accent },
                    ]}>
                      {worked && <Ionicons name="checkmark" size={12} color={Colors.bg} />}
                    </View>
                    <Text style={[styles.dayDate, worked && { color: Colors.accent }]}>
                      {wType ? wType.slice(0, 3) : format(day, 'd')}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </Animated.View>

        {/* Community Banner */}
        <Animated.View entering={FadeInDown.duration(500).delay(250)}>
          <TouchableOpacity style={styles.communityBanner} onPress={() => navigation.navigate('Feed')} activeOpacity={0.85}>
            <View style={styles.communityLeft}>
              <Text style={styles.communityEmoji}>🏋️</Text>
              <View>
                <Text style={styles.communityTitle}>Community Feed</Text>
                <Text style={styles.communitySub}>See what everyone is grinding</Text>
              </View>
            </View>
            <View style={styles.communityRight}>
              <Ionicons name="arrow-forward-circle" size={32} color="#7b61ff" />
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View entering={FadeInDown.duration(500).delay(300)}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            {QUICK_ACTIONS.map((action, i) => (
              <Animated.View key={action.label} entering={FadeInRight.duration(400).delay(350 + i * 60)}>
                <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate(action.tab)}>
                  <View style={[styles.actionIcon, { backgroundColor: action.color + '22' }]}>
                    <Ionicons name={action.icon} size={24} color={action.color} />
                  </View>
                  <Text style={styles.actionLabel}>{action.label}</Text>
                  <Ionicons name="chevron-forward" size={16} color={Colors.muted} />
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* Recent Workouts */}
        {!loading && workouts.length > 0 && (
          <Animated.View entering={FadeInDown.duration(500).delay(400)}>
            <Text style={styles.sectionTitle}>Recent Workouts</Text>
            {workouts.slice(0, 3).map((w) => {
              const isExpanded = expandedId === w.id;
              const todayStr = format(new Date(), 'yyyy-MM-dd');
              const yesterdayStr = format(addDays(new Date(), -1), 'yyyy-MM-dd');
              const dayLabel =
                w.date === todayStr ? 'Today' :
                w.date === yesterdayStr ? 'Yesterday' :
                format(parseISO(w.date), 'EEEE, MMM d');

              return (
                <TouchableOpacity
                  key={w.id}
                  style={styles.recentCard}
                  onPress={() => setExpandedId(isExpanded ? null : w.id)}
                  activeOpacity={0.8}
                >
                  {/* Card header row */}
                  <View style={styles.recentHeader}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={styles.recentType}>{w.type}</Text>
                        {w.exercises?.length > 0 && (
                          <View style={styles.exCountBadge}>
                            <Text style={styles.exCountText}>{w.exercises.length} exercises</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.recentDate}>{dayLabel}</Text>
                    </View>
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={Colors.muted}
                    />
                  </View>

                  {/* Expanded exercises + notes */}
                  {isExpanded && (
                    <View style={styles.recentDetail}>
                      <View style={styles.recentDivider} />
                      {w.exercises?.map((ex, i) => {
                        // Parse per-set reps and weights (stored as "10/8/6")
                        const repsArr = ex.reps ? ex.reps.toString().split('/') : [];
                        const weightArr = ex.weight ? ex.weight.toString().split('/') : [];
                        const setCount = ex.sets || repsArr.length || 1;
                        return (
                          <View key={i} style={styles.recentExBlock}>
                            <View style={styles.recentExHeader}>
                              <Text style={styles.recentExEmoji}>{ex.emoji || '💪'}</Text>
                              <Text style={styles.recentExName}>{ex.name}</Text>
                            </View>
                            {Array.from({ length: setCount }).map((_, si) => (
                              <View key={si} style={styles.recentSetRow}>
                                <View style={styles.recentSetBadge}>
                                  <Text style={styles.recentSetBadgeText}>Set {si + 1}</Text>
                                </View>
                                <Text style={styles.recentSetDetail}>
                                  {weightArr[si] || '0'}kg
                                </Text>
                                <Text style={styles.recentSetSep}>·</Text>
                                <Text style={styles.recentSetDetail}>
                                  {repsArr[si] || '0'} reps
                                </Text>
                              </View>
                            ))}
                          </View>
                        );
                      })}
                      {w.notes ? (
                        <View style={styles.recentNoteRow}>
                          <Ionicons name="document-text-outline" size={14} color={Colors.muted} />
                          <Text style={styles.recentNote}>{w.notes}</Text>
                        </View>
                      ) : null}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </Animated.View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.lg, paddingTop: 60 },
  header: { marginBottom: Spacing.lg },
  headerGrad: { position: 'absolute', top: -60, left: -20, right: -20, height: 250 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.md },
  greeting: { color: Colors.muted, fontSize: 14 },
  name: { color: Colors.text, fontSize: 24, fontWeight: '800', marginTop: 2 },
  logoutBtn: { padding: 8, backgroundColor: Colors.surface, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border },
  quoteCard: { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, borderLeftWidth: 3, borderLeftColor: Colors.accent },
  quoteText: { color: Colors.textSub, fontSize: 13, fontStyle: 'italic', lineHeight: 20 },
  quoteAuthor: { color: Colors.muted, fontSize: 12, marginTop: 6 },
  statRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg },
  streakCard: { flex: 1, borderRadius: Radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(0,245,196,0.3)' },
  streakGrad: { padding: Spacing.md, alignItems: 'center', justifyContent: 'center', minHeight: 140 },
  streakFire: { fontSize: 32 },
  streakNum: { fontSize: 48, fontWeight: '800', color: Colors.accent, lineHeight: 56 },
  streakLabel: { color: Colors.text, fontWeight: '600', fontSize: 13 },
  streakSub: { color: Colors.muted, fontSize: 12, marginTop: 2 },
  statRight: { flex: 1, gap: Spacing.md },
  statSmall: { flex: 1, backgroundColor: Colors.card, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border, padding: Spacing.sm },
  statSmallActive: { borderColor: 'rgba(0,245,196,0.3)', backgroundColor: 'rgba(0,245,196,0.08)' },
  todayIcon: { fontSize: 24, marginBottom: 4 },
  statSmallLabel: { color: Colors.muted, fontSize: 12, marginTop: 2, textAlign: 'center' },
  weekNum: { fontSize: 32, fontWeight: '800', color: Colors.text },
  weekCard: { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.md },
  dayCol: { alignItems: 'center', gap: 4 },
  dayLabel: { color: Colors.muted, fontSize: 12, fontWeight: '600' },
  dayDot: { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  dayDotFilled: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  dayDate: { color: Colors.muted, fontSize: 10, fontWeight: '600' },
  sectionTitle: { color: Colors.text, fontSize: 16, fontWeight: '700', marginBottom: Spacing.md },
  actionGrid: { gap: Spacing.sm, marginBottom: Spacing.lg },
  actionCard: { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  actionIcon: { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  actionLabel: { flex: 1, color: Colors.text, fontWeight: '600', fontSize: 15 },
  recentCard: { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  recentHeader: { flexDirection: 'row', alignItems: 'center' },
  recentType: { color: Colors.text, fontWeight: '700', fontSize: 15 },
  recentDate: { color: Colors.muted, fontSize: 12, marginTop: 2 },
  exCountBadge: { backgroundColor: 'rgba(0,245,196,0.12)', borderRadius: Radius.full, paddingHorizontal: 7, paddingVertical: 2 },
  exCountText: { color: Colors.accent, fontSize: 11, fontWeight: '700' },
  recentDetail: { marginTop: Spacing.sm },
  recentDivider: { height: 1, backgroundColor: Colors.border, marginBottom: Spacing.sm },
  recentExBlock: { marginBottom: Spacing.sm },
  recentExHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  recentExEmoji: { fontSize: 16 },
  recentExName: { color: Colors.text, fontSize: 13, fontWeight: '700' },
  recentSetRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 3, paddingLeft: 22 },
  recentSetBadge: { backgroundColor: 'rgba(0,245,196,0.1)', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, minWidth: 44 },
  recentSetBadgeText: { color: Colors.accent, fontSize: 10, fontWeight: '700', textAlign: 'center' },
  recentSetDetail: { color: Colors.muted, fontSize: 13, fontWeight: '500' },
  recentSetSep: { color: Colors.border, fontSize: 12 },
  recentNoteRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1, borderColor: Colors.border },
  recentNote: { color: Colors.muted, fontSize: 12, fontStyle: 'italic', flex: 1 },
  communityBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(123,97,255,0.1)',
    borderRadius: Radius.xl, padding: Spacing.md,
    borderWidth: 1.5, borderColor: 'rgba(123,97,255,0.35)',
    marginBottom: Spacing.lg,
  },
  communityLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  communityEmoji: { fontSize: 36 },
  communityTitle: { color: Colors.text, fontWeight: '800', fontSize: 16 },
  communitySub: { color: Colors.muted, fontSize: 12, marginTop: 2 },
  communityRight: { opacity: 0.9 },
});
