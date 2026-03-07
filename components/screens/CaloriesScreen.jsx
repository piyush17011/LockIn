import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Animated as RNAnimated } from 'react-native';
import Animated, { FadeInDown, FadeIn, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../hooks/useAuth';
import { saveCalorieProfile, getCalorieProfile } from '../../services/workoutService';
import { Colors, Spacing, Radius } from '../../constants/theme';

const getStorageKey = (uid) => `lockin_calories_${uid}`;

const ACTIVITY = [
  { key: 1.2,   label: 'Sedentary',   desc: 'Little/no exercise', icon: '🛋️' },
  { key: 1.375, label: 'Light',       desc: '1–3x/week',          icon: '🚶' },
  { key: 1.55,  label: 'Moderate',    desc: '3–5x/week',          icon: '🏃' },
  { key: 1.725, label: 'Active',      desc: '6–7x/week',          icon: '💪' },
  { key: 1.9,   label: 'Very Active', desc: 'Athlete level',      icon: '🔥' },
];

const GOALS = [
  { key: 'cut',      label: 'Cut',      desc: 'Lose fat',     icon: '📉', color: Colors.accent, adjust: -500 },
  { key: 'maintain', label: 'Maintain', desc: 'Stay lean',    icon: '⚖️', color: Colors.blue,   adjust: 0   },
  { key: 'bulk',     label: 'Bulk',     desc: 'Build muscle', icon: '📈', color: Colors.purple, adjust: 300 },
];

function getMacros(calories, goal) {
  const splits = {
    cut:      { protein: 0.40, carbs: 0.35, fat: 0.25 },
    maintain: { protein: 0.30, carbs: 0.40, fat: 0.30 },
    bulk:     { protein: 0.30, carbs: 0.50, fat: 0.20 },
  };
  const s = splits[goal];
  return {
    protein: Math.round((calories * s.protein) / 4),
    carbs:   Math.round((calories * s.carbs)   / 4),
    fat:     Math.round((calories * s.fat)      / 9),
  };
}

function getBMI(weight, height) {
  const h = height / 100;
  const bmi = weight / (h * h);
  let label, color;
  if      (bmi < 18.5) { label = 'Underweight'; color = Colors.blue;   }
  else if (bmi < 25)   { label = 'Normal';       color = Colors.accent; }
  else if (bmi < 30)   { label = 'Overweight';   color = Colors.orange; }
  else                  { label = 'Obese';        color = Colors.red;    }
  return { value: bmi.toFixed(1), label, color };
}

// ── Compact summary strip shown at the top once calculated ──────────────────
function ResultStrip({ result, goalColor, onEdit }) {
  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.strip}>
      <LinearGradient
        colors={[goalColor + '22', 'transparent']}
        style={styles.stripGrad}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
      />

      {/* Top row: target calories + BMI */}
      <View style={styles.stripTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.stripSmall}>Daily Target</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
            <Text style={[styles.stripBig, { color: goalColor }]}>{result.targetCals}</Text>
            <Text style={styles.stripUnit}>kcal</Text>
          </View>
          <Text style={styles.stripSub}>TDEE {result.tdee} kcal · {GOALS.find(g => g.key === result.goal)?.label}</Text>
        </View>
        <View style={styles.bmiPill}>
          <Text style={[styles.bmiPillVal, { color: result.bmi.color }]}>{result.bmi.value}</Text>
          <Text style={[styles.bmiPillLabel, { color: result.bmi.color }]}>{result.bmi.label}</Text>
          <Text style={styles.bmiPillTitle}>BMI</Text>
        </View>
      </View>

      {/* Macros row */}
      <View style={styles.macroStrip}>
        {[
          { label: 'Protein', val: result.macros.protein, unit: 'g', color: Colors.accent, icon: '🥩' },
          { label: 'Carbs',   val: result.macros.carbs,   unit: 'g', color: Colors.orange, icon: '🍚' },
          { label: 'Fat',     val: result.macros.fat,     unit: 'g', color: Colors.purple, icon: '🥑' },
        ].map((m, i) => (
          <View key={m.label} style={[styles.macroChip, i < 2 && { borderRightWidth: 1, borderRightColor: Colors.border }]}>
            <Text style={styles.macroChipIcon}>{m.icon}</Text>
            <Text style={[styles.macroChipVal, { color: m.color }]}>{m.val}<Text style={styles.macroChipUnit}>{m.unit}</Text></Text>
            <Text style={styles.macroChipLabel}>{m.label}</Text>
          </View>
        ))}
      </View>

      {/* Edit button */}
      <TouchableOpacity style={styles.editBtn} onPress={onEdit}>
        <Text style={styles.editBtnText}>✏️  Edit inputs</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Main screen ──────────────────────────────────────────────────────────────
export default function CaloriesScreen() {
  const { user } = useAuth();
  const [age,       setAge]      = useState('');
  const [weight,    setWeight]   = useState('');
  const [height,    setHeight]   = useState('');
  const [gender,    setGender]   = useState('male');
  const [activity,  setActivity] = useState(1.55);
  const [goal,      setGoal]     = useState('maintain');
  const [result,    setResult]   = useState(null);
  const [collapsed, setCollapsed] = useState(false); // inputs collapsed after first calc

  useEffect(() => {
    // Reset state when user changes — prevents showing previous user's data
    setAge(''); setWeight(''); setHeight('');
    setGender('male'); setActivity(1.55); setGoal('maintain');
    setResult(null); setCollapsed(false);

    // Try AsyncStorage first for instant load, then sync from Firestore
    AsyncStorage.getItem(getStorageKey(user?.uid || 'guest')).then((raw) => {
      if (raw) {
        try {
          const s = JSON.parse(raw);
          applyProfile(s);
        } catch (_) {}
      }
    });
    // Always fetch from Firestore to stay in sync across devices
    if (user?.uid) {
      getCalorieProfile(user.uid).then((profile) => {
        if (profile) {
          applyProfile(profile);
          // Keep AsyncStorage in sync
          AsyncStorage.setItem(getStorageKey(user?.uid || 'guest'), JSON.stringify(profile));
        }
      }).catch(() => {});
    }
  }, [user?.uid]);

  const applyProfile = (s) => {
    if (s.age)      setAge(s.age);
    if (s.weight)   setWeight(s.weight);
    if (s.height)   setHeight(s.height);
    if (s.gender)   setGender(s.gender);
    if (s.activity) setActivity(s.activity);
    if (s.goal)     setGoal(s.goal);
    if (s.result)   { setResult(s.result); setCollapsed(true); }
  };

  const calculate = () => {
    const a = parseInt(age), w = parseFloat(weight), h = parseFloat(height);
    if (!a || !w || !h) return;
    const bmr = gender === 'male'
      ? 10 * w + 6.25 * h - 5 * a + 5
      : 10 * w + 6.25 * h - 5 * a - 161;
    const tdee      = Math.round(bmr * activity);
    const goalData  = GOALS.find((g) => g.key === goal);
    const targetCals = tdee + goalData.adjust;
    const macros    = getMacros(targetCals, goal);
    const bmi       = getBMI(w, h);
    const newResult = { tdee, deficit: tdee - 500, surplus: tdee + 300, targetCals, macros, bmi, goal };
    setResult(newResult);
    setCollapsed(true); // collapse inputs after calculating
    const profile = { age, weight, height, gender, activity, goal, result: newResult };
    // Save to AsyncStorage for instant next load
    AsyncStorage.setItem(getStorageKey(user?.uid || 'guest'), JSON.stringify(profile));
    // Save to Firestore so it syncs across devices
    if (user?.uid) saveCalorieProfile(user.uid, profile).catch(() => {});
  };

  const activeGoal = GOALS.find((g) => g.key === goal);

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        <Animated.View entering={FadeInDown.duration(500)}>
          <Text style={styles.pageTitle}>Calorie Calculator</Text>
          <Text style={styles.pageSub}>Your daily fuel targets</Text>
        </Animated.View>

        {/* ── Result strip always at top once calculated ── */}
        {result && (
          <ResultStrip
            result={result}
            goalColor={GOALS.find(g => g.key === result.goal)?.color || Colors.accent}
            onEdit={() => setCollapsed(false)}
          />
        )}

        {/* ── Inputs — collapsed to a summary row after first calc ── */}
        {collapsed && result ? (
          // Collapsed summary — shows current inputs, tap to expand
          <TouchableOpacity style={styles.collapsedBar} onPress={() => setCollapsed(false)}>
            <View style={{ flex: 1 }}>
              <Text style={styles.collapsedLabel}>Current Inputs</Text>
              <Text style={styles.collapsedValues}>
                {gender === 'male' ? '♂️' : '♀️'} {age}yrs · {weight}kg · {height}cm · {ACTIVITY.find(a => a.key === activity)?.label}
              </Text>
            </View>
            <Text style={styles.collapsedChevron}>›</Text>
          </TouchableOpacity>
        ) : (
          // Expanded inputs
          <Animated.View entering={FadeInDown.duration(400)}>

            {/* Gender */}
            <Text style={styles.sectionLabel}>Gender</Text>
            <View style={styles.genderRow}>
              {['male', 'female'].map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.genderBtn, gender === g && styles.genderBtnActive]}
                  onPress={() => setGender(g)}
                >
                  <Text style={styles.genderIcon}>{g === 'male' ? '♂️' : '♀️'}</Text>
                  <Text style={[styles.genderText, gender === g && { color: Colors.accent }]}>
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Stats */}
            <Text style={styles.sectionLabel}>Your Stats</Text>
            <View style={styles.inputGrid}>
              {[
                { label: 'Age',    value: age,    setter: setAge,    suffix: 'yrs' },
                { label: 'Weight', value: weight, setter: setWeight, suffix: 'kg'  },
                { label: 'Height', value: height, setter: setHeight, suffix: 'cm'  },
              ].map((f) => (
                <View key={f.label} style={styles.inputCard}>
                  <Text style={styles.inputLabel}>{f.label}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                    <TextInput
                      style={styles.input}
                      placeholder="0"
                      placeholderTextColor={Colors.muted}
                      value={f.value}
                      onChangeText={f.setter}
                      keyboardType="decimal-pad"
                    />
                    <Text style={styles.inputSuffix}>{f.suffix}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Goal */}
            <Text style={styles.sectionLabel}>Goal</Text>
            <View style={styles.goalRow}>
              {GOALS.map((g) => (
                <TouchableOpacity
                  key={g.key}
                  style={[styles.goalCard, goal === g.key && { borderColor: g.color, backgroundColor: g.color + '15' }]}
                  onPress={() => setGoal(g.key)}
                >
                  <Text style={styles.goalIcon}>{g.icon}</Text>
                  <Text style={[styles.goalLabel, goal === g.key && { color: g.color }]}>{g.label}</Text>
                  <Text style={styles.goalDesc}>{g.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Activity */}
            <Text style={styles.sectionLabel}>Activity Level</Text>
            {ACTIVITY.map((a) => (
              <TouchableOpacity
                key={a.key}
                style={[styles.activityCard, activity === a.key && styles.activityCardActive]}
                onPress={() => setActivity(a.key)}
              >
                <Text style={{ fontSize: 22 }}>{a.icon}</Text>
                <View style={{ flex: 1, marginLeft: Spacing.md }}>
                  <Text style={[styles.activityLabel, activity === a.key && { color: Colors.accent }]}>{a.label}</Text>
                  <Text style={styles.activityDesc}>{a.desc}</Text>
                </View>
                {activity === a.key && <View style={styles.activeDot} />}
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.calcBtn} onPress={calculate}>
              <LinearGradient colors={['#00f5c4', '#00c9a7']} style={styles.calcBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={styles.calcBtnText}>{result ? 'Recalculate 🔄' : 'Calculate 🔥'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* All 3 targets always visible below */}
        {result && (
          <Animated.View entering={FadeInDown.duration(400).delay(100)}>
            <Text style={styles.sectionLabel}>All Targets</Text>
            {[
              { label: 'Deficit',     cal: result.deficit,  desc: '−500 · Fat loss',      color: Colors.accent, icon: '📉' },
              { label: 'Maintenance', cal: result.tdee,     desc: 'TDEE baseline',         color: Colors.blue,   icon: '⚖️' },
              { label: 'Surplus',     cal: result.surplus,  desc: '+300 · Muscle gain',    color: Colors.purple, icon: '📈' },
            ].map((r) => {
              const isActive =
                (result.goal === 'cut'      && r.label === 'Deficit')     ||
                (result.goal === 'maintain' && r.label === 'Maintenance') ||
                (result.goal === 'bulk'     && r.label === 'Surplus');
              return (
                <View key={r.label} style={[styles.resultCard, { borderColor: r.color + '40' }, isActive && { borderWidth: 2, borderColor: r.color }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                    <Text style={{ fontSize: 22 }}>{r.icon}</Text>
                    <View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.resultLabel}>{r.label}</Text>
                        {isActive && <View style={[styles.activeBadge, { backgroundColor: r.color + '25' }]}><Text style={[styles.activeBadgeText, { color: r.color }]}>Your goal</Text></View>}
                      </View>
                      <Text style={styles.resultDesc}>{r.desc}</Text>
                    </View>
                  </View>
                  <Text style={[styles.resultCal, { color: r.color }]}>
                    {r.cal}<Text style={{ fontSize: 12, color: Colors.muted }}> kcal</Text>
                  </Text>
                </View>
              );
            })}
            <Text style={styles.disclaimer}>
              Mifflin-St Jeor formula. Adjust ±100 kcal based on weekly progress.
            </Text>
          </Animated.View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.lg, paddingTop: 60 },
  pageTitle: { fontSize: 28, fontWeight: '800', color: Colors.text },
  pageSub: { color: Colors.muted, fontSize: 14, marginBottom: Spacing.sm, marginTop: 4 },
  sectionLabel: { color: Colors.muted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.sm, marginTop: Spacing.lg },

  // Result strip
  strip: { backgroundColor: Colors.card, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', marginTop: Spacing.md },
  stripGrad: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  stripTop: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, paddingBottom: Spacing.sm },
  stripBig: { fontSize: 42, fontWeight: '800', lineHeight: 48 },
  stripUnit: { color: Colors.muted, fontSize: 14, fontWeight: '600' },
  stripSmall: { color: Colors.muted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 },
  stripSub: { color: Colors.muted, fontSize: 12, marginTop: 2 },
  bmiPill: { alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, minWidth: 80 },
  bmiPillVal: { fontSize: 22, fontWeight: '800' },
  bmiPillLabel: { fontSize: 11, fontWeight: '700', marginTop: 1 },
  bmiPillTitle: { color: Colors.muted, fontSize: 10, marginTop: 2 },
  macroStrip: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: Colors.border },
  macroChip: { flex: 1, alignItems: 'center', paddingVertical: Spacing.sm, gap: 2 },
  macroChipIcon: { fontSize: 16 },
  macroChipVal: { fontSize: 16, fontWeight: '800' },
  macroChipUnit: { fontSize: 11, fontWeight: '400' },
  macroChipLabel: { color: Colors.muted, fontSize: 10, fontWeight: '600' },
  editBtn: { borderTopWidth: 1, borderTopColor: Colors.border, paddingVertical: Spacing.sm, alignItems: 'center' },
  editBtnText: { color: Colors.muted, fontSize: 13, fontWeight: '600' },

  // Collapsed bar
  collapsedBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, marginTop: Spacing.md },
  collapsedLabel: { color: Colors.muted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 },
  collapsedValues: { color: Colors.text, fontSize: 13, fontWeight: '500' },
  collapsedChevron: { color: Colors.muted, fontSize: 24, fontWeight: '300' },

  // Inputs
  genderRow: { flexDirection: 'row', gap: Spacing.md },
  genderBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  genderBtnActive: { borderColor: Colors.accent, backgroundColor: 'rgba(0,245,196,0.1)' },
  genderIcon: { fontSize: 20 },
  genderText: { color: Colors.muted, fontWeight: '600', fontSize: 15 },
  inputGrid: { flexDirection: 'row', gap: Spacing.sm },
  inputCard: { flex: 1, backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  inputLabel: { color: Colors.muted, fontSize: 11, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { flex: 1, color: Colors.text, fontSize: 22, fontWeight: '800' },
  inputSuffix: { color: Colors.muted, fontSize: 12 },
  goalRow: { flexDirection: 'row', gap: Spacing.sm },
  goalCard: { flex: 1, backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', gap: 4 },
  goalIcon: { fontSize: 22 },
  goalLabel: { color: Colors.text, fontWeight: '700', fontSize: 13 },
  goalDesc: { color: Colors.muted, fontSize: 11 },
  activityCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  activityCardActive: { borderColor: Colors.accent, backgroundColor: 'rgba(0,245,196,0.08)' },
  activityLabel: { color: Colors.textSub, fontWeight: '600', fontSize: 14 },
  activityDesc: { color: Colors.muted, fontSize: 12, marginTop: 2 },
  activeDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.accent },
  calcBtn: { borderRadius: Radius.lg, overflow: 'hidden', marginTop: Spacing.lg, marginBottom: Spacing.sm },
  calcBtnGrad: { height: 56, alignItems: 'center', justifyContent: 'center' },
  calcBtnText: { color: Colors.bg, fontWeight: '800', fontSize: 18 },

  // All targets
  resultCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, marginBottom: Spacing.sm },
  resultLabel: { color: Colors.text, fontWeight: '700', fontSize: 14 },
  resultDesc: { color: Colors.muted, fontSize: 11, marginTop: 2 },
  resultCal: { fontSize: 24, fontWeight: '800' },
  activeBadge: { borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  activeBadgeText: { fontSize: 10, fontWeight: '700' },
  disclaimer: { color: Colors.muted, fontSize: 11, textAlign: 'center', marginTop: Spacing.lg, fontStyle: 'italic', lineHeight: 16 },
});
