import { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Alert, Dimensions, Modal, KeyboardAvoidingView, Platform,
  AppState, Pressable,
} from 'react-native';
import Animated, {
  FadeInDown, FadeIn, FadeInUp, useSharedValue,
  useAnimatedStyle, withSpring, withTiming, interpolate,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useWorkoutsContext } from '../../hooks/WorkoutsContext';
import { saveCalorieProfile, getCalorieProfile } from '../../services/workoutService';
import { useTheme } from '../../hooks/ThemeContext';
import { isSameDay, parseISO } from 'date-fns';
import { Pedometer } from 'expo-sensors';
import {
  scheduleWaterReminders, cancelWaterReminders, setupNotificationCategories,
  loadReminderSettings, saveReminderSettings,
  DEFAULT_REMINDER_SETTINGS, INTERVAL_OPTIONS, intervalLabel,
} from '../../services/waterNotifications';

const { width: SW, height: SH } = Dimensions.get('window');

const getStorageKey  = uid        => `lockin_calories_${uid}`;
const getFoodLogKey  = (uid, d)   => `lockin_foodlog_${uid}_${d}`;
const getWaterKey    = (uid, d)   => `lockin_water_${uid}_${d}`;
const getWaterSetKey = uid        => `lockin_water_settings_${uid}`;
const todayStr       = ()         => new Date().toISOString().split('T')[0];

function calcWaterGoal(weightKg, activityKey) {
  const base  = Math.round(weightKg * 35);
  const extra = activityKey >= 1.725 ? 750 : activityKey >= 1.55 ? 500 : activityKey >= 1.375 ? 250 : 0;
  return base + extra;
}
const stepsToCalories = (steps, kg = 70) => Math.round(steps * 0.04 * (kg / 70));

function getMacros(cal, goal, kg) {
  const p = Math.round(kg * (goal === 'bulk' ? 2.3 : goal === 'cut' ? 1.8 : 1.5));
  const f = Math.round((cal * (goal === 'bulk' ? 0.20 : 0.22)) / 9);
  const c = Math.round((cal - p * 4 - f * 9) / 4);
  return { protein: p, carbs: c, fat: f };
}
function getBMI(w, h) {
  const bmi = w / ((h / 100) ** 2);
  if (bmi < 18.5) return { value: bmi.toFixed(1), label: 'Underweight', color: '#54a0ff' };
  if (bmi < 23)   return { value: bmi.toFixed(1), label: 'Normal',      color: '#00c896' };
  if (bmi < 27.5) return { value: bmi.toFixed(1), label: 'Overweight',  color: '#ff9f43' };
  return              { value: bmi.toFixed(1), label: 'Obese',       color: '#ff6b6b' };
}

const shadow = (color = '#000', o = 0.1, r = 12, y = 4) => ({
  shadowColor: color, shadowOffset: { width: 0, height: y },
  shadowOpacity: o, shadowRadius: r, elevation: Math.round(r / 2),
});

const ACTIVITY = [
  { key: 1.2,   label: 'Sedentary',   desc: 'Desk job, no exercise',   icon: '🛋️' },
  { key: 1.375, label: 'Light',       desc: '1–3x/week exercise',      icon: '🚶' },
  { key: 1.55,  label: 'Moderate',    desc: '3–5x/week exercise',      icon: '🏃' },
  { key: 1.725, label: 'Active',      desc: '6–7x/week hard training', icon: '💪' },
  { key: 1.9,   label: 'Very Active', desc: 'Athlete / physical job',  icon: '🔥' },
];
const GOALS = [
  { key: 'cut',      label: 'Cut',      desc: 'Lose fat',     icon: '📉', adjust: -300 },
  { key: 'maintain', label: 'Maintain', desc: 'Stay lean',    icon: '⚖️', adjust: 0   },
  { key: 'bulk',     label: 'Bulk',     desc: 'Build muscle', icon: '📈', adjust: 200  },
];
const QUICK_FOODS = [
  { name: 'Roti',          serving: '1 roti',    weight: '~40g',   cal: 80,  icon: '🫓', macro: { p: 3, c: 18, f: 1  } },
  { name: 'Rice',          serving: '1 cup',     weight: '~180g',  cal: 206, icon: '🍚', macro: { p: 4, c: 45, f: 0  } },
  { name: 'Dal',           serving: '1 bowl',    weight: '~200g',  cal: 150, icon: '🥣', macro: { p: 9, c: 26, f: 1  } },
  { name: 'Paneer',        serving: '100g',      weight: '100g',   cal: 296, icon: '🧀', macro: { p: 18, c: 4, f: 22 } },
  { name: 'Egg',           serving: '1 whole',   weight: '~50g',   cal: 78,  icon: '🥚', macro: { p: 6, c: 1, f: 5   } },
  { name: 'Chicken',       serving: '100g',      weight: '100g',   cal: 165, icon: '🍗', macro: { p: 31, c: 0, f: 4  } },
  { name: 'Banana',        serving: '1 medium',  weight: '~120g',  cal: 89,  icon: '🍌', macro: { p: 1, c: 23, f: 0  } },
  { name: 'Milk',          serving: '1 glass',   weight: '250ml',  cal: 149, icon: '🥛', macro: { p: 8, c: 12, f: 8  } },
  { name: 'Curd',          serving: '1 bowl',    weight: '~150g',  cal: 98,  icon: '🫙', macro: { p: 11, c: 8, f: 3  } },
  { name: 'Peanuts',       serving: '30g',       weight: '30g',    cal: 170, icon: '🥜', macro: { p: 7, c: 5, f: 15  } },
  { name: 'Oats',          serving: '1 bowl',    weight: '~40g dry',cal: 148, icon: '🌾', macro: { p: 5, c: 27, f: 3 } },
  { name: 'Samosa',        serving: '1 piece',   weight: '~100g',  cal: 262, icon: '🥟', macro: { p: 4, c: 28, f: 14 } },
  { name: 'Idli',          serving: '2 pieces',  weight: '~100g',  cal: 138, icon: '🫓', macro: { p: 4, c: 29, f: 0  } },
  { name: 'Dosa',          serving: '1 dosa',    weight: '~120g',  cal: 168, icon: '🥞', macro: { p: 5, c: 30, f: 3  } },
  { name: 'Rajma',         serving: '1 bowl',    weight: '~200g',  cal: 180, icon: '🫘', macro: { p: 13, c: 32, f: 1 } },
  { name: 'Almonds',       serving: '10 pieces', weight: '~15g',   cal: 70,  icon: '🌰', macro: { p: 3, c: 2, f: 6   } },
  { name: 'Apple',         serving: '1 medium',  weight: '~180g',  cal: 95,  icon: '🍎', macro: { p: 0, c: 25, f: 0  } },
  { name: 'Ghee',          serving: '1 tsp',     weight: '~5g',    cal: 45,  icon: '🧈', macro: { p: 0, c: 0, f: 5   } },
  { name: 'Poha',          serving: '1 bowl',    weight: '~200g',  cal: 250, icon: '🍲', macro: { p: 4, c: 52, f: 4  } },
  { name: 'Paratha',       serving: '1 paratha', weight: '~100g',  cal: 260, icon: '🫓', macro: { p: 6, c: 35, f: 11 } },
  { name: 'Upma',          serving: '1 bowl',    weight: '~200g',  cal: 200, icon: '🍲', macro: { p: 5, c: 35, f: 5  } },
  { name: 'Chana',         serving: '1 bowl',    weight: '~200g',  cal: 165, icon: '🫘', macro: { p: 9, c: 28, f: 3  } },
  { name: 'Whey Protein',  serving: '1 scoop',   weight: '~30g',   cal: 120, icon: '💪', macro: { p: 24, c: 4, f: 2  } },
  { name: 'Peanut Butter', serving: '1 tbsp',    weight: '~16g',   cal: 94,  icon: '🥜', macro: { p: 4, c: 3, f: 8   } },
];
const CUP_SIZES = [
  { ml: 150, label: '150ml', desc: 'Small' },
  { ml: 200, label: '200ml', desc: 'Cup'   },
  { ml: 250, label: '250ml', desc: 'Large' },
  { ml: 300, label: '300ml', desc: 'Mug'   },
  { ml: 500, label: '500ml', desc: 'Bottle'},
];

// ── Arc ring (border-trick) ───────────────────────────────────────────────────
function Ring({ pct, size = 100, stroke = 9, color, bg, children }) {
  const p = Math.min(pct, 1);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ position: 'absolute', width: size, height: size, borderRadius: size / 2, borderWidth: stroke, borderColor: (bg || color) + '22' }} />
      <View style={{ position: 'absolute', width: size, height: size, borderRadius: size / 2, borderWidth: stroke,
        borderColor: 'transparent',
        borderTopColor:    p > 0    ? color : 'transparent',
        borderRightColor:  p > 0.25 ? color : 'transparent',
        borderBottomColor: p > 0.5  ? color : 'transparent',
        borderLeftColor:   p > 0.75 ? color : 'transparent',
        transform: [{ rotate: '-90deg' }],
      }} />
      {children}
    </View>
  );
}

// ── HERO HEADER ───────────────────────────────────────────────────────────────
// Big calorie ring + stats chips + water quick-add + steps — all above the fold
function HeroHeader({
  eaten, burned, target, effectiveSteps, weightNum,
  mlDrunk, goalMl, cupMl, onAddWater, onRemoveWater, onEditCupSize, onReminderSettings, reminderActive,
  logMacros, macros,
  pedometerOn, manualEdit, steps, liveSteps,
  setSteps, setManualEdit,
  todayWorkouts,
  onNutritionDetail,
  C, ff,
}) {
  const [burnedExpanded, setBurnedExpanded] = useState(false);
  const net     = eaten - burned;
  const remain  = Math.max(0, target - net);
  const overBy  = net > target ? net - target : 0;
  const calPct  = Math.min(net / (target || 1), 1.2);
  const ringCol = overBy > 0 ? '#ff6b6b' : calPct > 0.85 ? '#ff9f43' : C.accent;
  const waterPct = Math.min(mlDrunk / (goalMl || 1), 1);
  const stepsCal = stepsToCalories(effectiveSteps, weightNum);
  const workoutBurnedTotal = todayWorkouts.reduce((s, w) => s + (w.caloriesBurned || 0), 0);

  return (
    <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>

      {/* ── Main card ── */}
      <View style={{ backgroundColor: C.card, borderRadius: 28, padding: 20, borderWidth: 1, borderColor: C.border, ...shadow(C.accent, 0.08, 20, 6) }}>

        {/* Top row: big ring + right stats */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18, marginBottom: 18 }}>

          {/* Calorie ring */}
          <Ring pct={calPct} size={120} stroke={11} color={ringCol}>
            <View style={{ alignItems: 'center' }}>
              <Text style={[{ fontSize: 26, color: ringCol, lineHeight: 28, letterSpacing: -0.5 }, ff.display]}>
                {target ? remain : '—'}
              </Text>
              <Text style={[{ fontSize: 9, color: C.textSub, marginTop: 1 }, ff.body]}>
                {overBy > 0 ? 'over' : 'left'}
              </Text>
              <Text style={[{ fontSize: 9, color: C.textSub }, ff.body]}>kcal</Text>
            </View>
          </Ring>

          {/* Right column */}
          <View style={{ flex: 1, gap: 10 }}>
            {/* Eaten / Burned row */}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1, backgroundColor: C.accent + '12', borderRadius: 14, padding: 10, borderWidth: 1, borderColor: C.accent + '30' }}>
                <Text style={[{ fontSize: 9, color: C.textSub, letterSpacing: 0.6 }, ff.heading]}>EATEN</Text>
                <Text style={[{ fontSize: 19, color: C.accent, marginTop: 1 }, ff.display]}>{eaten}</Text>
                <Text style={[{ fontSize: 9, color: C.textSub }, ff.body]}>kcal</Text>
              </View>
              <TouchableOpacity
                onPress={() => setBurnedExpanded(p => !p)}
                activeOpacity={0.8}
                style={{ flex: 1, backgroundColor: burnedExpanded ? '#00c89620' : '#00c89612', borderRadius: 14, padding: 10, borderWidth: 1, borderColor: burnedExpanded ? '#00c89655' : '#00c89630' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={[{ fontSize: 9, color: C.textSub, letterSpacing: 0.6 }, ff.heading]}>BURNED</Text>
                  <Ionicons name={burnedExpanded ? 'chevron-up' : 'information-circle-outline'} size={11} color="#00c896" />
                </View>
                <Text style={[{ fontSize: 19, color: '#00c896', marginTop: 1 }, ff.display]}>{burned}</Text>
                <Text style={[{ fontSize: 9, color: C.textSub }, ff.body]}>kcal</Text>
              </TouchableOpacity>
            </View>

            {/* Burned breakdown — expands when card is tapped */}
            {burnedExpanded && (
              <Animated.View entering={FadeIn.duration(200)}>
                <View style={{ backgroundColor: '#00c89610', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: '#00c89630', marginTop: -2 }}>
                  {/* Header */}
                  <Text style={[{ fontSize: 9, color: '#00c896', letterSpacing: 0.8, marginBottom: 8 }, ff.heading]}>BREAKDOWN</Text>
                  {/* Workout rows */}
                  {todayWorkouts.length > 0 ? todayWorkouts.map((w, i) => (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                      <Text style={{ fontSize: 11 }}>🏋️</Text>
                      <Text style={[{ flex: 1, fontSize: 10, color: C.text }, ff.body]} numberOfLines={1}>{w.type || 'Workout'}</Text>
                      <Text style={[{ fontSize: 11, color: '#00c896' }, ff.heading]}>−{w.caloriesBurned || 0}</Text>
                    </View>
                  )) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                      <Text style={{ fontSize: 11 }}>🏋️</Text>
                      <Text style={[{ flex: 1, fontSize: 10, color: C.muted }, ff.body]}>No workouts logged</Text>
                      <Text style={[{ fontSize: 11, color: C.muted }, ff.heading]}>0</Text>
                    </View>
                  )}
                  {/* Steps row */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <Text style={{ fontSize: 11 }}>👟</Text>
                    <Text style={[{ flex: 1, fontSize: 10, color: C.text }, ff.body]}>{effectiveSteps.toLocaleString()} steps</Text>
                    <Text style={[{ fontSize: 11, color: '#00c896' }, ff.heading]}>−{stepsCal}</Text>
                  </View>
                  {/* Divider + total */}
                  <View style={{ height: 1, backgroundColor: '#00c89630', marginBottom: 6 }} />
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={[{ fontSize: 10, color: C.textSub }, ff.body]}>Total burned</Text>
                    <Text style={[{ fontSize: 13, color: '#00c896' }, ff.heading]}>−{burned} kcal</Text>
                  </View>
                </View>
              </Animated.View>
            )}

            {/* Target row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.surface, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: C.border }}>
              <Text style={[{ fontSize: 11, color: C.textSub }, ff.body]}>Target</Text>
              <Text style={[{ fontSize: 14, color: C.text }, ff.heading]}>{target || '—'} kcal</Text>
              {/* Nutrition detail button */}
              <TouchableOpacity onPress={onNutritionDetail} activeOpacity={0.7}
                style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: C.accent + '18', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.accent + '40' }}>
                <Ionicons name="bar-chart-outline" size={13} color={C.accent} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── Macro pills row ── */}
        {macros && (
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 18 }}>
            {[
              { label: 'P', eaten: logMacros.p, goal: macros.protein, color: '#00c896' },
              { label: 'C', eaten: logMacros.c, goal: macros.carbs,   color: '#ff9f43' },
              { label: 'F', eaten: logMacros.f, goal: macros.fat,     color: '#7b61ff' },
            ].map(m => {
              const p = Math.min(m.eaten / (m.goal || 1), 1);
              return (
                <View key={m.label} style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={[{ fontSize: 10, color: m.color }, ff.heading]}>{m.label}</Text>
                    <Text style={[{ fontSize: 10, color: C.textSub }, ff.body]}>{m.eaten}/{m.goal}g</Text>
                  </View>
                  <View style={{ height: 4, backgroundColor: m.color + '20', borderRadius: 2 }}>
                    <View style={{ height: 4, width: `${p * 100}%`, backgroundColor: m.color, borderRadius: 2 }} />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ── Steps strip — slim top row ── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#00c89610', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: '#00c89628', marginBottom: 10 }}>
          <Text style={{ fontSize: 14, marginRight: 8 }}>👟</Text>
          <Text style={[{ fontSize: 9, color: C.textSub, letterSpacing: 0.6, marginRight: 6 }, ff.heading]}>STEPS</Text>
          {pedometerOn && !manualEdit && (
            <View style={{ backgroundColor: '#00c89622', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1, marginRight: 6 }}>
              <Text style={[{ fontSize: 8, color: '#00c896' }, ff.heading]}>LIVE</Text>
            </View>
          )}
          {manualEdit ? (
            <TextInput
              style={[{ fontSize: 16, color: C.text, flex: 1, paddingVertical: 0 }, ff.display]}
              value={steps > 0 ? String(steps) : ''}
              onChangeText={v => setSteps(parseInt(v.replace(/[^0-9]/g, '')) || 0)}
              keyboardType="number-pad" autoFocus placeholder="0"
              placeholderTextColor={C.muted} returnKeyType="done"
              onSubmitEditing={() => setManualEdit(false)}
            />
          ) : (
            <Text style={[{ fontSize: 16, color: '#00c896', flex: 1 }, ff.display]}>{effectiveSteps.toLocaleString()}</Text>
          )}
          <Text style={[{ fontSize: 10, color: C.textSub, marginRight: 10 }, ff.body]}>−{stepsCal} kcal</Text>
          <TouchableOpacity onPress={() => { if (manualEdit) { setManualEdit(false); } else { setSteps(effectiveSteps); setManualEdit(true); } }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name={manualEdit ? 'checkmark-circle' : 'pencil'} size={14} color={manualEdit ? '#00c896' : C.muted} />
          </TouchableOpacity>
        </View>

        {/* ── Water — full width card ── */}
        <View style={{ backgroundColor: '#54a0ff10', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#54a0ff30' }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Text style={{ fontSize: 13, marginRight: 6 }}>💧</Text>
            <Text style={[{ fontSize: 9, color: C.textSub, letterSpacing: 0.6, flex: 1 }, ff.heading]}>WATER INTAKE</Text>
            <TouchableOpacity onPress={onEditCupSize} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={{ marginRight: 10 }}>
              <Ionicons name="pencil" size={13} color={C.muted} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onReminderSettings} hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}>
              <Ionicons name={reminderActive ? 'notifications' : 'notifications-outline'} size={15} color={reminderActive ? '#54a0ff' : C.muted} />
            </TouchableOpacity>
          </View>
          {/* Ring + value + progress */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 }}>
            <Ring pct={waterPct} size={56} stroke={6} color="#54a0ff">
              <Text style={{ fontSize: 13 }}>💧</Text>
            </Ring>
            <View style={{ flex: 1 }}>
              <Text style={[{ fontSize: 26, color: '#54a0ff', lineHeight: 28 }, ff.display]}>
                {mlDrunk}<Text style={[{ fontSize: 11, color: C.textSub }, ff.body]}>ml</Text>
              </Text>
              <Text style={[{ fontSize: 10, color: C.textSub, marginTop: 2 }, ff.body]}>
                {Math.max(goalMl - mlDrunk, 0) > 0
                  ? `${Math.max(goalMl - mlDrunk, 0)}ml to goal`
                  : '✅ Goal reached!'}
              </Text>
              <View style={{ height: 4, backgroundColor: '#54a0ff18', borderRadius: 2, marginTop: 6 }}>
                <View style={{ height: 4, width: `${waterPct * 100}%`, backgroundColor: '#54a0ff', borderRadius: 2 }} />
              </View>
            </View>
            <Text style={[{ fontSize: 10, color: C.textSub }, ff.body]}>{cupMl}ml / glass</Text>
          </View>
          {/* +/- buttons */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity onPress={onRemoveWater} activeOpacity={0.7}
              style={{ flex: 1, height: 36, borderRadius: 10, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border }}>
              <Text style={[{ fontSize: 16, color: C.textSub }, ff.heading]}>−</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onAddWater} activeOpacity={0.8}
              style={{ flex: 3, height: 36, borderRadius: 10, backgroundColor: '#54a0ff22', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#54a0ff40' }}>
              <Text style={[{ fontSize: 13, color: '#54a0ff' }, ff.heading]}>+ {cupMl}ml</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

// ── NUTRITION DETAIL SHEET (modal) ────────────────────────────────────────────
function NutritionDetailSheet({ visible, onClose, eaten, burned, target, macros, logMacros, todayWorkouts, effectiveSteps, weightNum, mlDrunk, goalMl, cupMl, onAddWater, onRemoveWater, onSetCupSize, C, ff }) {
  const net    = eaten - burned;
  const remain = Math.max(0, target - net);
  const overBy = net > target ? net - target : 0;
  const [showCupPicker, setShowCupPicker] = useState(false);
  const waterPct = Math.min(mlDrunk / (goalMl || 1), 1);
  const workoutTotal = todayWorkouts.reduce((s, w) => s + (w.caloriesBurned || 0), 0);
  const stepsCal = stepsToCalories(effectiveSteps, weightNum);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        {/* Handle + header */}
        <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: C.border }} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }}>
          <Text style={[{ flex: 1, fontSize: 20, color: C.text }, ff.display]}>Today's Breakdown</Text>
          <TouchableOpacity onPress={onClose} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border }}>
            <Ionicons name="close" size={16} color={C.textSub} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 50, gap: 16 }} showsVerticalScrollIndicator={false}>

          {/* Calorie balance */}
          <View style={{ backgroundColor: C.card, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: C.border }}>
            <Text style={[{ fontSize: 11, color: C.textSub, letterSpacing: 1, marginBottom: 14 }, ff.heading]}>CALORIE BALANCE</Text>
            <View style={{ flexDirection: 'row', gap: 0 }}>
              {[
                { label: 'Target',  val: target,  color: C.text   },
                { label: 'Eaten',   val: eaten,   color: C.accent },
                { label: 'Burned',  val: burned,  color: '#00c896'},
                { label: overBy > 0 ? 'Over' : 'Left', val: overBy > 0 ? overBy : remain, color: overBy > 0 ? '#ff6b6b' : '#00c896'},
              ].map((r, i) => (
                <View key={r.label} style={{ flex: 1, alignItems: 'center', borderRightWidth: i < 3 ? 1 : 0, borderRightColor: C.border }}>
                  <Text style={[{ fontSize: 20, color: r.color }, ff.display]}>{r.val}</Text>
                  <Text style={[{ fontSize: 9, color: C.textSub, marginTop: 2 }, ff.body]}>{r.label}</Text>
                  <Text style={[{ fontSize: 9, color: C.textSub }, ff.body]}>kcal</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Macros detail */}
          {macros && (
            <View style={{ backgroundColor: C.card, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: C.border }}>
              <Text style={[{ fontSize: 11, color: C.textSub, letterSpacing: 1, marginBottom: 14 }, ff.heading]}>MACROS</Text>
              <View style={{ gap: 12 }}>
                {[
                  { label: 'Protein', eaten: logMacros.p, goal: macros.protein, color: '#00c896', note: 'dal · eggs · paneer' },
                  { label: 'Carbs',   eaten: logMacros.c, goal: macros.carbs,   color: '#ff9f43', note: 'rice · roti · oats'  },
                  { label: 'Fat',     eaten: logMacros.f, goal: macros.fat,     color: '#7b61ff', note: 'nuts · ghee · oil'   },
                ].map(m => {
                  const p = Math.min(m.eaten / (m.goal || 1), 1);
                  return (
                    <View key={m.label}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                        <View>
                          <Text style={[{ fontSize: 13, color: C.text }, ff.heading]}>{m.label}</Text>
                          <Text style={[{ fontSize: 10, color: C.textSub }, ff.body]}>{m.note}</Text>
                        </View>
                        <Text style={[{ fontSize: 16, color: m.color }, ff.display]}>{m.eaten}<Text style={[{ fontSize: 11, color: C.textSub }, ff.body]}>/{m.goal}g</Text></Text>
                      </View>
                      <View style={{ height: 6, backgroundColor: m.color + '18', borderRadius: 3 }}>
                        <View style={{ height: 6, width: `${p * 100}%`, backgroundColor: m.color, borderRadius: 3 }} />
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Burned breakdown */}
          {(todayWorkouts.length > 0 || effectiveSteps > 0) && (
            <View style={{ backgroundColor: C.card, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: C.border }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <Text style={[{ fontSize: 11, color: C.textSub, letterSpacing: 1 }, ff.heading]}>BURNED TODAY</Text>
                <Text style={[{ fontSize: 18, color: '#00c896' }, ff.display]}>{workoutTotal + stepsCal} <Text style={[{ fontSize: 10, color: C.textSub }, ff.body]}>kcal</Text></Text>
              </View>
              <View style={{ gap: 8 }}>
                {todayWorkouts.map((w, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#00c89610', borderRadius: 12, padding: 12 }}>
                    <Text style={{ fontSize: 18 }}>🏋️</Text>
                    <Text style={[{ flex: 1, fontSize: 13, color: C.text }, ff.body]}>{w.type || 'Workout'}</Text>
                    <Text style={[{ fontSize: 14, color: '#00c896' }, ff.heading]}>−{w.caloriesBurned || 0} kcal</Text>
                  </View>
                ))}
                {effectiveSteps > 0 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#00c89610', borderRadius: 12, padding: 12 }}>
                    <Text style={{ fontSize: 18 }}>👟</Text>
                    <Text style={[{ flex: 1, fontSize: 13, color: C.text }, ff.body]}>{effectiveSteps.toLocaleString()} steps</Text>
                    <Text style={[{ fontSize: 14, color: '#00c896' }, ff.heading]}>−{stepsCal} kcal</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Water detail */}
          <View style={{ backgroundColor: C.card, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: C.border }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={[{ fontSize: 11, color: C.textSub, letterSpacing: 1 }, ff.heading]}>WATER INTAKE</Text>
              <TouchableOpacity onPress={() => setShowCupPicker(p => !p)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#54a0ff18', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: '#54a0ff40' }}>
                <Text style={[{ fontSize: 10, color: '#54a0ff' }, ff.heading]}>Cup: {cupMl}ml</Text>
                <Ionicons name={showCupPicker ? 'chevron-up' : 'chevron-down'} size={10} color="#54a0ff" />
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginBottom: 8 }}>
              <Text style={[{ fontSize: 32, color: '#54a0ff' }, ff.display]}>{mlDrunk}</Text>
              <Text style={[{ fontSize: 14, color: C.textSub }, ff.body]}>/ {goalMl} ml</Text>
            </View>
            <View style={{ height: 8, backgroundColor: '#54a0ff18', borderRadius: 4, marginBottom: 12 }}>
              <View style={{ height: 8, width: `${waterPct * 100}%`, backgroundColor: '#54a0ff', borderRadius: 4 }} />
            </View>
            <Text style={[{ fontSize: 11, color: waterPct >= 1 ? '#00c896' : C.textSub, marginBottom: 12 }, ff.body]}>
              {waterPct >= 1 ? '✅ Daily goal reached!' : `${Math.max(goalMl - mlDrunk, 0)} ml remaining`}
            </Text>

            {showCupPicker && (
              <Animated.View entering={FadeIn.duration(160)} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                {CUP_SIZES.map(c => (
                  <TouchableOpacity key={c.ml} onPress={() => { onSetCupSize(c.ml); setShowCupPicker(false); }}
                    style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, backgroundColor: c.ml === cupMl ? '#54a0ff28' : C.surface, borderWidth: 1, borderColor: c.ml === cupMl ? '#54a0ff70' : C.border }}>
                    <Text style={[{ fontSize: 12, color: c.ml === cupMl ? '#54a0ff' : C.text }, ff.heading]}>{c.label}</Text>
                    <Text style={[{ fontSize: 9, color: C.textSub }, ff.body]}>{c.desc}</Text>
                  </TouchableOpacity>
                ))}
              </Animated.View>
            )}

            {/* Glass grid */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
              {Array.from({ length: Math.min(Math.ceil(goalMl / cupMl), 12) }).map((_, i) => {
                const filled = i < Math.floor(mlDrunk / cupMl);
                return (
                  <View key={i} style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: filled ? '#54a0ff28' : C.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: filled ? '#54a0ff55' : C.border }}>
                    <Text style={{ fontSize: 15 }}>{filled ? '💧' : '○'}</Text>
                  </View>
                );
              })}
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity onPress={onRemoveWater} activeOpacity={0.7}
                style={{ flex: 1, height: 42, borderRadius: 12, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border }}>
                <Text style={[{ fontSize: 13, color: C.textSub }, ff.heading]}>− Remove</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onAddWater} activeOpacity={0.85}
                style={{ flex: 2, height: 42, borderRadius: 12, backgroundColor: '#54a0ff20', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#54a0ff50' }}>
                <Text style={[{ fontSize: 13, color: '#54a0ff' }, ff.heading]}>💧 +{cupMl}ml</Text>
              </TouchableOpacity>
            </View>
          </View>

        </ScrollView>
      </View>
    </Modal>
  );
}

// ── Add food modal ────────────────────────────────────────────────────────────
function AddFoodModal({ visible, onClose, onAdd, C, ff }) {
  const [tab,    setTab]   = useState('quick');
  const [search, setSrch]  = useState('');
  const [cName,  setCName] = useState('');
  const [cCal,   setCCal]  = useState('');
  const [cP,     setCP]    = useState('');
  const [cC,     setCC]    = useState('');
  const [cF,     setCF]    = useState('');
  const [qtys,   setQtys]  = useState({});

  const filtered = QUICK_FOODS.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));
  const getQty   = n => qtys[n] ?? 1;
  const setQty   = (n, v) => setQtys(p => ({ ...p, [n]: Math.max(1, v) }));

  const addCustom = () => {
    if (!cName || !cCal) return Alert.alert('Enter name and calories');
    onAdd({ name: cName, cal: parseInt(cCal), icon: '🍽️', macro: { p: parseInt(cP||0), c: parseInt(cC||0), f: parseInt(cF||0) }, type: 'food', qty: 1 });
    setCName(''); setCCal(''); setCP(''); setCC(''); setCF('');
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: C.border }} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14 }}>
          <Text style={[{ flex: 1, fontSize: 20, color: C.text }, ff.display]}>Add Food</Text>
          <TouchableOpacity onPress={onClose} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border }}>
            <Ionicons name="close" size={16} color={C.textSub} />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={{ flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, backgroundColor: C.surface, borderRadius: 12, padding: 3, borderWidth: 1, borderColor: C.border }}>
          {[{ key: 'quick', label: 'Quick Add', icon: 'flash-outline' }, { key: 'custom', label: 'Custom', icon: 'create-outline' }].map(t => {
            const active = tab === t.key;
            return (
              <TouchableOpacity key={t.key} onPress={() => setTab(t.key)}
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8, borderRadius: 9, backgroundColor: active ? C.accent + '20' : 'transparent', borderWidth: active ? 1 : 0, borderColor: C.accent + '50' }}>
                <Ionicons name={t.icon} size={12} color={active ? C.accent : C.textSub} />
                <Text style={[{ fontSize: 12, color: active ? C.accent : C.textSub }, ff.heading]}>{t.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
          {tab === 'quick' && (
            <View>
              <TextInput style={[{ backgroundColor: C.surface, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: C.text, borderWidth: 1, borderColor: C.border, marginBottom: 12 }, ff.body]}
                placeholder="Search…" placeholderTextColor={C.muted} value={search} onChangeText={setSrch} />
              <View style={{ gap: 8 }}>
                {filtered.map((f, i) => {
                  const q = getQty(f.name);
                  return (
                    <Animated.View key={f.name} entering={FadeIn.duration(160).delay(i * 12)}>
                      <View style={{ backgroundColor: C.card, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: C.border }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                          <Text style={{ fontSize: 24 }}>{f.icon}</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={[{ fontSize: 15, color: C.text }, ff.heading]}>{f.name}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
                              <Text style={[{ fontSize: 11, color: C.textSub }, ff.body]}>{f.serving}</Text>
                              <Text style={[{ fontSize: 10, color: C.muted }, ff.body]}>·</Text>
                              <Text style={[{ fontSize: 11, color: C.textSub }, ff.body]}>{f.weight}</Text>
                            </View>
                            <View style={{ flexDirection: 'row', gap: 5, marginTop: 6 }}>
                              {[
                                { label: 'P', val: f.macro.p * q, color: '#00c896' },
                                { label: 'C', val: f.macro.c * q, color: '#ff9f43' },
                                { label: 'F', val: f.macro.f * q, color: '#7b61ff' },
                              ].map(m => (
                                <View key={m.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: m.color + '18', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1, borderColor: m.color + '35' }}>
                                  <Text style={[{ fontSize: 10, color: m.color }, ff.heading]}>{m.label}</Text>
                                  <Text style={[{ fontSize: 11, color: m.color }, ff.display]}>{m.val}</Text>
                                  <Text style={[{ fontSize: 9, color: m.color + 'aa' }, ff.body]}>g</Text>
                                </View>
                              ))}
                            </View>
                          </View>
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={[{ fontSize: 20, color: C.accent }, ff.display]}>{f.cal * q}</Text>
                            <Text style={[{ fontSize: 9, color: C.textSub }, ff.body]}>kcal</Text>
                          </View>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 10, borderWidth: 1, borderColor: C.border, overflow: 'hidden' }}>
                            <TouchableOpacity onPress={() => setQty(f.name, q - 1)} style={{ width: 34, height: 32, alignItems: 'center', justifyContent: 'center' }}>
                              <Text style={[{ fontSize: 17, color: q <= 1 ? C.muted : C.text }, ff.heading]}>−</Text>
                            </TouchableOpacity>
                            <Text style={[{ fontSize: 14, color: C.text, minWidth: 26, textAlign: 'center' }, ff.heading]}>{q}</Text>
                            <TouchableOpacity onPress={() => setQty(f.name, q + 1)} style={{ width: 34, height: 32, alignItems: 'center', justifyContent: 'center' }}>
                              <Text style={[{ fontSize: 17, color: C.text }, ff.heading]}>+</Text>
                            </TouchableOpacity>
                          </View>
                          <TouchableOpacity
                            onPress={() => {
                              onAdd({ name: `${f.name}${q > 1 ? ` ×${q}` : ''}`, cal: f.cal * q, icon: f.icon, macro: { p: f.macro.p * q, c: f.macro.c * q, f: f.macro.f * q }, type: 'food', qty: q });
                              setQtys(p => ({ ...p, [f.name]: 1 }));
                            }}
                            style={{ flex: 1, height: 32, borderRadius: 10, backgroundColor: C.accent + '18', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.accent + '45' }}>
                            <Text style={[{ fontSize: 12, color: C.accent }, ff.heading]}>Add{q > 1 ? ` ×${q}` : ''}</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </Animated.View>
                  );
                })}
              </View>
            </View>
          )}

          {tab === 'custom' && (
            <View style={{ backgroundColor: C.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border, gap: 12 }}>
              {[['Food name', cName, setCName, 'default'], ['Calories (kcal)', cCal, setCCal, 'number-pad']].map(([ph, val, set, kb]) => (
                <TextInput key={ph} style={[{ backgroundColor: C.surface, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: C.text, borderWidth: 1, borderColor: C.border }, ff.body]}
                  placeholder={ph} placeholderTextColor={C.muted} value={val} onChangeText={set} keyboardType={kb} />
              ))}
              <Text style={[{ fontSize: 11, color: C.textSub, letterSpacing: 0.8 }, ff.heading]}>MACROS (OPTIONAL)</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[['P g', cP, setCP], ['C g', cC, setCC], ['F g', cF, setCF]].map(([ph, val, set]) => (
                  <TextInput key={ph} style={[{ flex: 1, backgroundColor: C.surface, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10, fontSize: 14, color: C.text, borderWidth: 1, borderColor: C.border, textAlign: 'center' }, ff.body]}
                    placeholder={ph} placeholderTextColor={C.muted} value={val} onChangeText={set} keyboardType="number-pad" />
                ))}
              </View>
              <TouchableOpacity onPress={addCustom} style={{ height: 46, borderRadius: 12, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={[{ color: C.btnText, fontSize: 14 }, ff.heading]}>Add Food</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Result card ───────────────────────────────────────────────────────────────
function ResultCard({ result, weight, C, ff, onEdit }) {
  const goalData = GOALS.find(g => g.key === result.goal);
  const macros   = getMacros(result.targetCals, result.goal, weight);
  return (
    <Animated.View entering={FadeIn.duration(300)}>
      <View style={{ backgroundColor: C.card, borderRadius: 22, overflow: 'hidden', marginBottom: 12, borderWidth: 1, borderColor: C.border, borderTopWidth: 3, borderTopColor: C.accent, ...shadow(C.accent, 0.12, 14, 4) }}>
        <View style={{ padding: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <View>
              <Text style={[{ fontSize: 11, color: C.textSub, letterSpacing: 1, marginBottom: 4 }, ff.heading]}>DAILY TARGET</Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 5 }}>
                <Text style={[{ fontSize: 52, color: C.accent, lineHeight: 56, letterSpacing: -1 }, ff.display]}>{result.targetCals}</Text>
                <Text style={[{ fontSize: 14, color: C.textSub }, ff.body]}>kcal</Text>
              </View>
              <Text style={[{ fontSize: 12, color: C.textSub, marginTop: 2 }, ff.body]}>TDEE {result.tdee} · {goalData?.label} {goalData?.icon}</Text>
            </View>
            <View style={{ backgroundColor: result.bmi.color + '18', borderRadius: 16, padding: 14, alignItems: 'center', borderWidth: 1.5, borderColor: result.bmi.color + '40', minWidth: 80 }}>
              <Text style={[{ fontSize: 22, color: result.bmi.color }, ff.display]}>{result.bmi.value}</Text>
              <Text style={[{ fontSize: 10, color: result.bmi.color, marginTop: 2 }, ff.heading]}>{result.bmi.label}</Text>
              <Text style={[{ fontSize: 9, color: C.textSub, marginTop: 1 }, ff.body]}>BMI (Asian)</Text>
            </View>
          </View>
        </View>
        <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: C.border }}>
          {[
            { label: 'Protein', val: macros.protein, color: '#00c896', icon: '🥩' },
            { label: 'Carbs',   val: macros.carbs,   color: '#ff9f43', icon: '🍚' },
            { label: 'Fat',     val: macros.fat,     color: '#7b61ff', icon: '🥜' },
          ].map((m, i) => (
            <View key={m.label} style={{ flex: 1, alignItems: 'center', paddingVertical: 14, borderRightWidth: i < 2 ? 1 : 0, borderRightColor: C.border }}>
              <Text style={{ fontSize: 16 }}>{m.icon}</Text>
              <Text style={[{ fontSize: 20, color: m.color, marginTop: 4 }, ff.display]}>{m.val}<Text style={[{ fontSize: 10, color: C.textSub }, ff.body]}>g</Text></Text>
              <Text style={[{ fontSize: 10, color: C.textSub }, ff.heading]}>{m.label.toUpperCase()}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity onPress={onEdit} style={{ borderTopWidth: 1, borderTopColor: C.border, paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
          <Text style={{ fontSize: 13 }}>✏️</Text>
          <Text style={[{ fontSize: 13, color: C.textSub }, ff.body]}>Edit inputs</Text>
        </TouchableOpacity>
      </View>
      {[
        { label: 'Cut',      cal: result.deficit,  color: '#00c896', icon: '📉', goalKey: 'cut'      },
        { label: 'Maintain', cal: result.tdee,     color: '#54a0ff', icon: '⚖️', goalKey: 'maintain' },
        { label: 'Bulk',     cal: result.surplus,  color: '#7b61ff', icon: '📈', goalKey: 'bulk'     },
      ].map(r => {
        const isActive = result.goal === r.goalKey;
        return (
          <View key={r.label} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: isActive ? r.color + '10' : C.card, borderRadius: 16, padding: 16, marginBottom: 8, borderWidth: isActive ? 1.5 : 1, borderColor: isActive ? r.color + '55' : C.border, borderLeftWidth: 3, borderLeftColor: r.color }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Text style={{ fontSize: 20 }}>{r.icon}</Text>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={[{ fontSize: 14, color: C.text }, ff.heading]}>{r.label}</Text>
                  {isActive && <View style={{ backgroundColor: r.color + '22', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}><Text style={[{ fontSize: 9, color: r.color }, ff.heading]}>YOUR GOAL</Text></View>}
                </View>
              </View>
            </View>
            <Text style={[{ fontSize: 22, color: r.color }, ff.display]}>{r.cal}<Text style={[{ fontSize: 10, color: C.textSub }, ff.body]}> kcal</Text></Text>
          </View>
        );
      })}
    </Animated.View>
  );
}

// ── MAIN SCREEN ───────────────────────────────────────────────────────────────
export default function CaloriesScreen() {
  const { scheme: C, font: F } = useTheme();
  const ff = { display: { fontFamily: F.display }, heading: { fontFamily: F.heading }, body: { fontFamily: F.body } };
  const { user }          = useAuth();
  const { workouts = [] } = useWorkoutsContext();

  // Profile
  const [age,       setAge]      = useState('');
  const [weight,    setWeight]   = useState('');
  const [height,    setHeight]   = useState('');
  const [gender,    setGender]   = useState('male');
  const [activity,  setActivity] = useState(1.55);
  const [goal,      setGoal]     = useState('maintain');
  const [result,    setResult]   = useState(null);
  const [collapsed, setCollapsed]= useState(false);

  // Daily
  const [foodLog,      setFoodLog]     = useState([]);
  const [mlDrunk,      setMlDrunk]     = useState(0);
  const [cupMl,        setCupMl]       = useState(250);
  const [steps,        setSteps]       = useState(0);
  const [liveSteps,    setLiveSteps]   = useState(0);
  const [pedometerOn,  setPedometerOn] = useState(false);
  const [manualEdit,   setManualEdit]  = useState(false);
  const [addModal,       setAddModal]      = useState(false);
  const [waterSettings,  setWaterSettings] = useState(false);  // reminder settings modal
  const [cupPickerModal, setCupPickerModal]= useState(false);  // cup size picker modal
  const [reminderConfig, setReminderConfig]= useState(DEFAULT_REMINDER_SETTINGS);
  const [detailSheet,  setDetailSheet] = useState(false);
  const [activeTab,    setActiveTab]   = useState('today');

  const todayWorkouts = workouts.filter(w => {
    try { return isSameDay(parseISO(w.date), new Date()); } catch { return false; }
  });
  const weightNum   = parseFloat(weight) || 70;
  const waterGoalMl = result ? calcWaterGoal(weightNum, activity) : 2000;
  const effectiveSteps = manualEdit ? steps : (pedometerOn ? liveSteps : steps);

  // Computed
  const eaten        = foodLog.reduce((s, f) => s + f.cal, 0);
  const workoutBurned = todayWorkouts.reduce((s, w) => s + (w.caloriesBurned || 0), 0);
  const stepsBurned  = stepsToCalories(effectiveSteps, weightNum);
  const burned       = workoutBurned + stepsBurned;
  const logMacros    = foodLog.reduce((s, f) => ({ p: s.p + (f.macro?.p || 0), c: s.c + (f.macro?.c || 0), f: s.f + (f.macro?.f || 0) }), { p: 0, c: 0, f: 0 });
  const macros       = result ? getMacros(result.targetCals, result.goal, weightNum) : null;

  useEffect(() => {
    setAge(''); setWeight(''); setHeight('');
    setGender('male'); setActivity(1.55); setGoal('maintain');
    setResult(null); setCollapsed(false);
    const uid = user?.uid || 'guest';
    const today = todayStr();
    AsyncStorage.getItem(getStorageKey(uid)).then(r => { if (r) try { applyProfile(JSON.parse(r)); } catch (_) {} });
    if (user?.uid) getCalorieProfile(user.uid).then(p => { if (p) { applyProfile(p); AsyncStorage.setItem(getStorageKey(user.uid), JSON.stringify(p)); } }).catch(() => {});
    AsyncStorage.getItem(getFoodLogKey(uid, today)).then(r => { if (r) try { setFoodLog(JSON.parse(r)); } catch (_) {} });
    AsyncStorage.getItem(getWaterKey(uid, today)).then(r => { if (r) setMlDrunk(parseInt(r) || 0); });
    AsyncStorage.getItem(getWaterSetKey(uid)).then(r => { if (r) try { const s = JSON.parse(r); if (s.cupMl) setCupMl(s.cupMl); } catch (_) {} });
    // Load reminder settings
    loadReminderSettings().then(s => setReminderConfig(s));
    // Setup notification categories and response handler
    setupNotificationCategories();
  }, [user?.uid]);

  const applyProfile = s => {
    if (s.age) setAge(s.age); if (s.weight) setWeight(s.weight); if (s.height) setHeight(s.height);
    if (s.gender) setGender(s.gender); if (s.activity) setActivity(s.activity); if (s.goal) setGoal(s.goal);
    if (s.result) { setResult(s.result); setCollapsed(true); }
  };

  const saveFoodLog = log => AsyncStorage.setItem(getFoodLogKey(user?.uid || 'guest', todayStr()), JSON.stringify(log));
  const addFood     = item => { const next = [...foodLog, { ...item, id: Date.now() }]; setFoodLog(next); saveFoodLog(next); };
  const removeEntry = id   => { const next = foodLog.filter(f => f.id !== id); setFoodLog(next); saveFoodLog(next); };

  const updateQty = (id, delta) => {
    const next = foodLog.map(f => {
      if (f.id !== id) return f;
      const q = Math.max(1, (f.qty || 1) + delta);
      const base = f.cal / (f.qty || 1);
      const bm   = { p: (f.macro?.p || 0) / (f.qty || 1), c: (f.macro?.c || 0) / (f.qty || 1), f: (f.macro?.f || 0) / (f.qty || 1) };
      return { ...f, qty: q, cal: Math.round(base * q), macro: { p: Math.round(bm.p * q), c: Math.round(bm.c * q), f: Math.round(bm.f * q) } };
    });
    setFoodLog(next); saveFoodLog(next);
  };

  const hasNudgedRef = useRef(false);
  const addWater = () => {
    const n = mlDrunk + cupMl;
    setMlDrunk(n);
    AsyncStorage.setItem(getWaterKey(user?.uid || 'guest', todayStr()), String(n));
    if (!reminderConfig.enabled && !hasNudgedRef.current) {
      hasNudgedRef.current = true;
      Alert.alert(
        '💧 Stay on track!',
        'Want reminders to drink water throughout the day? Tap the bell icon to set them up.',
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Set up reminders', onPress: () => setWaterSettings(true) },
        ]
      );
    }
  };
  const removeWater = () => { const n = Math.max(0, mlDrunk - cupMl); setMlDrunk(n); AsyncStorage.setItem(getWaterKey(user?.uid || 'guest', todayStr()), String(n)); };
  const saveCupSize = ml  => { setCupMl(ml); AsyncStorage.setItem(getWaterSetKey(user?.uid || 'guest'), JSON.stringify({ cupMl: ml })); };

  const applyReminderConfig = async (newConfig) => {
    setReminderConfig(newConfig);
    await saveReminderSettings(newConfig);
    await scheduleWaterReminders(newConfig, mlDrunk, waterGoalMl, cupMl);
  };

  const calculate = () => {
    const a = parseInt(age), w = parseFloat(weight), h = parseFloat(height);
    if (!a || !w || !h) return Alert.alert('Missing info', 'Fill in age, weight and height.');
    const bmr = gender === 'male' ? 10*w + 6.25*h - 5*a + 5 : 10*w + 6.25*h - 5*a - 161;
    const tdee = Math.round(bmr * activity);
    const targetCals = tdee + GOALS.find(g => g.key === goal).adjust;
    const bmi = getBMI(w, h);
    const newResult = { tdee, deficit: tdee - 300, surplus: tdee + 200, targetCals, bmi, goal };
    setResult(newResult); setCollapsed(true); setActiveTab('today');
    const profile = { age, weight, height, gender, activity, goal, result: newResult };
    AsyncStorage.setItem(getStorageKey(user?.uid || 'guest'), JSON.stringify(profile));
    if (user?.uid) saveCalorieProfile(user.uid, profile).catch(() => {});
  };

  // Notification listener removed — expo-notifications push infra not available in Expo Go SDK 53 Android
  // Re-add when using a development build

  useEffect(() => {
    let subscription = null;
    let debounceTimer = null;
    const getStartOfToday = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0); };
    const syncSteps = async () => {
      try { const { steps: s } = await Pedometer.getStepCountAsync(getStartOfToday(), new Date()); setLiveSteps(s); } catch (_) {}
    };
    (async () => {
      const ok = await Pedometer.isAvailableAsync().catch(() => false);
      if (!ok) return;
      setPedometerOn(true);
      await syncSteps();
      subscription = Pedometer.watchStepCount(() => { clearTimeout(debounceTimer); debounceTimer = setTimeout(syncSteps, 10000); });
    })();
    const appSub = AppState.addEventListener('change', s => { if (s === 'active') syncSteps(); });
    return () => { if (subscription) subscription.remove(); if (debounceTimer) clearTimeout(debounceTimer); appSub.remove(); };
  }, []);

  const TABS = [
    { key: 'today',      icon: 'today-outline',     label: 'Today'      },
    { key: 'calculator', icon: 'calculator-outline', label: 'Calculator' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>

      {/* ── HEADER ── */}
      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14, flexDirection: 'row', alignItems: 'flex-end' }}>
        <View style={{ flex: 1 }}>
          <Text style={[{ fontSize: 26, color: C.text, letterSpacing: -0.5 }, ff.display]}>Nutrition</Text>
          <Text style={[{ fontSize: 12, color: C.textSub, marginTop: 1 }, ff.body]}>ICMR/NIN Indian dietary guidelines</Text>
        </View>
        {/* Tab switcher in header */}
        <View style={{ flexDirection: 'row', backgroundColor: C.surface, borderRadius: 12, padding: 3, borderWidth: 1, borderColor: C.border }}>
          {TABS.map(tab => {
            const active = activeTab === tab.key;
            return (
              <TouchableOpacity key={tab.key} onPress={() => setActiveTab(tab.key)}
                style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 9, backgroundColor: active ? C.accent + '20' : 'transparent', borderWidth: active ? 1 : 0, borderColor: C.accent + '50' }}
                activeOpacity={0.7}>
                <Ionicons name={tab.icon} size={16} color={active ? C.accent : C.textSub} />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ══ TODAY TAB ══ */}
      {activeTab === 'today' && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>

          {/* No profile prompt */}
          {!result && (
            <Animated.View entering={FadeInDown.duration(300)} style={{ marginHorizontal: 16, backgroundColor: C.card, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: C.border, alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Text style={{ fontSize: 40 }}>🔥</Text>
              <Text style={[{ fontSize: 16, color: C.text, textAlign: 'center' }, ff.heading]}>Set your calorie target first</Text>
              <Text style={[{ fontSize: 12, color: C.textSub, textAlign: 'center' }, ff.body]}>Tap the calculator icon above to enter your stats</Text>
              <TouchableOpacity onPress={() => setActiveTab('calculator')} activeOpacity={0.85}
                style={{ marginTop: 4, backgroundColor: C.accent, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 }}>
                <Text style={[{ color: C.btnText, fontSize: 13 }, ff.heading]}>Go to Calculator →</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* HERO: calorie ring + stats + water + steps */}
          <Animated.View entering={FadeInDown.duration(350)}>
            <HeroHeader
              eaten={eaten} burned={burned} target={result?.targetCals || 0}
              effectiveSteps={effectiveSteps} weightNum={weightNum}
              mlDrunk={mlDrunk} goalMl={waterGoalMl} cupMl={cupMl}
              onAddWater={addWater} onRemoveWater={removeWater} onEditCupSize={() => setCupPickerModal(true)}
              onReminderSettings={() => setWaterSettings(true)} reminderActive={reminderConfig.enabled}
              logMacros={logMacros} macros={macros}
              pedometerOn={pedometerOn} manualEdit={manualEdit}
              steps={steps} liveSteps={liveSteps}
              setSteps={setSteps} setManualEdit={setManualEdit}
              todayWorkouts={todayWorkouts}
              onNutritionDetail={() => setDetailSheet(true)}
              C={C} ff={ff}
            />
          </Animated.View>

          {/* ── FOOD LOG ── */}
          <Animated.View entering={FadeInDown.duration(350).delay(60)} style={{ paddingHorizontal: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Text style={[{ flex: 1, fontSize: 11, color: C.textSub, letterSpacing: 1 }, ff.heading]}>TODAY'S LOG</Text>
              <TouchableOpacity onPress={() => setAddModal(true)} activeOpacity={0.85}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.accent, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 8 }}>
                <Ionicons name="add" size={14} color={C.btnText} />
                <Text style={[{ fontSize: 12, color: C.btnText }, ff.heading]}>Add Food</Text>
              </TouchableOpacity>
            </View>

            {foodLog.length === 0 ? (
              <TouchableOpacity onPress={() => setAddModal(true)} activeOpacity={0.8}
                style={{ backgroundColor: C.card, borderRadius: 18, padding: 24, borderWidth: 1, borderColor: C.border, borderStyle: 'dashed', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 30 }}>🍽️</Text>
                <Text style={[{ fontSize: 14, color: C.textSub }, ff.body]}>Tap to log your first meal</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ gap: 8 }}>
                {foodLog.map((entry, i) => (
                  <Animated.View key={entry.id} entering={FadeIn.duration(200).delay(i * 20)}>
                    <View style={{ backgroundColor: C.card, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: C.border, borderLeftWidth: 3, borderLeftColor: C.accent }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <Text style={{ fontSize: 22 }}>{entry.icon}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={[{ fontSize: 13, color: C.text }, ff.heading]}>{entry.name}</Text>
                          {entry.macro && (
                            <Text style={[{ fontSize: 10, color: C.textSub, marginTop: 1 }, ff.body]}>P{entry.macro.p} C{entry.macro.c} F{entry.macro.f}g</Text>
                          )}
                        </View>
                        <Text style={[{ fontSize: 16, color: C.accent }, ff.display]}>{entry.cal}</Text>
                        <Text style={[{ fontSize: 9, color: C.textSub, marginRight: 4 }, ff.body]}>kcal</Text>
                        <TouchableOpacity onPress={() => removeEntry(entry.id)} hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}>
                          <Ionicons name="close-circle" size={18} color={C.muted} />
                        </TouchableOpacity>
                      </View>
                      {/* Qty stepper */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 9, gap: 8 }}>
                        <Text style={[{ fontSize: 10, color: C.textSub }, ff.body]}>Qty</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 8, borderWidth: 1, borderColor: C.border, overflow: 'hidden' }}>
                          <TouchableOpacity onPress={() => updateQty(entry.id, -1)} style={{ width: 28, height: 26, alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={[{ fontSize: 15, color: (entry.qty || 1) <= 1 ? C.muted : C.text }, ff.heading]}>−</Text>
                          </TouchableOpacity>
                          <Text style={[{ fontSize: 13, color: C.text, minWidth: 22, textAlign: 'center' }, ff.heading]}>{entry.qty || 1}</Text>
                          <TouchableOpacity onPress={() => updateQty(entry.id, 1)} style={{ width: 28, height: 26, alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={[{ fontSize: 15, color: C.text }, ff.heading]}>+</Text>
                          </TouchableOpacity>
                        </View>
                        <Text style={[{ fontSize: 10, color: C.textSub }, ff.body]}>{entry.cal} kcal total</Text>
                      </View>
                    </View>
                  </Animated.View>
                ))}

                {/* Totals */}
                <View style={{ flexDirection: 'row', backgroundColor: C.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border, marginTop: 4 }}>
                  {[
                    { label: 'Eaten',  val: eaten,          color: C.accent  },
                    { label: 'Burned', val: burned,         color: '#00c896' },
                    { label: 'Net',    val: eaten - burned, color: C.text    },
                  ].map((t, i) => (
                    <View key={t.label} style={{ flex: 1, alignItems: 'center', borderRightWidth: i < 2 ? 1 : 0, borderRightColor: C.border }}>
                      <Text style={[{ fontSize: 19, color: t.color }, ff.display]}>{t.val}</Text>
                      <Text style={[{ fontSize: 10, color: C.textSub, marginTop: 2 }, ff.body]}>{t.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </Animated.View>
        </ScrollView>
      )}

      {/* ══ CALCULATOR TAB ══ */}
      {activeTab === 'calculator' && (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {result && (
            <Animated.View entering={FadeInDown.duration(300)} style={{ marginTop: 4, marginBottom: 16 }}>
              <ResultCard result={result} weight={weightNum} C={C} ff={ff} onEdit={() => setCollapsed(false)} />
            </Animated.View>
          )}
          {collapsed && result ? (
            <TouchableOpacity onPress={() => setCollapsed(false)}
              style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: C.border, marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={[{ fontSize: 10, color: C.textSub, letterSpacing: 1, marginBottom: 3 }, ff.heading]}>CURRENT INPUTS</Text>
                <Text style={[{ fontSize: 13, color: C.text }, ff.body]}>{gender === 'male' ? '♂️' : '♀️'} {age}y · {weight}kg · {height}cm · {ACTIVITY.find(a => a.key === activity)?.label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={C.textSub} />
            </TouchableOpacity>
          ) : (
            <Animated.View entering={FadeInDown.duration(350)}>
              <Text style={[{ fontSize: 11, color: C.textSub, letterSpacing: 1, marginBottom: 10, marginTop: result ? 16 : 4 }, ff.heading]}>GENDER</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
                {['male', 'female'].map(g => (
                  <TouchableOpacity key={g} onPress={() => setGender(g)} activeOpacity={0.8}
                    style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: gender === g ? C.accent + '18' : C.card, borderRadius: 14, padding: 14, borderWidth: 1.5, borderColor: gender === g ? C.accent + '80' : C.border }}>
                    <Text style={{ fontSize: 20 }}>{g === 'male' ? '♂️' : '♀️'}</Text>
                    <Text style={[{ fontSize: 14, color: gender === g ? C.accent : C.textSub }, ff.heading]}>{g === 'male' ? 'Male' : 'Female'}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={[{ fontSize: 11, color: C.textSub, letterSpacing: 1, marginBottom: 10 }, ff.heading]}>YOUR STATS</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
                {[{ label: 'Age', value: age, setter: setAge, unit: 'yrs' }, { label: 'Weight', value: weight, setter: setWeight, unit: 'kg' }, { label: 'Height', value: height, setter: setHeight, unit: 'cm' }].map(f => (
                  <View key={f.label} style={{ flex: 1, backgroundColor: C.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border }}>
                    <Text style={[{ fontSize: 10, color: C.textSub, letterSpacing: 0.5, marginBottom: 6 }, ff.heading]}>{f.label.toUpperCase()}</Text>
                    <TextInput style={[{ fontSize: 26, color: C.text }, ff.display]} placeholder="0" placeholderTextColor={C.border} value={f.value} onChangeText={f.setter} keyboardType="decimal-pad" />
                    <Text style={[{ fontSize: 11, color: C.textSub }, ff.body]}>{f.unit}</Text>
                  </View>
                ))}
              </View>
              <Text style={[{ fontSize: 11, color: C.textSub, letterSpacing: 1, marginBottom: 10 }, ff.heading]}>GOAL</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
                {GOALS.map(g => {
                  const gc = g.key === 'cut' ? '#00c896' : g.key === 'maintain' ? '#54a0ff' : '#7b61ff';
                  return (
                    <TouchableOpacity key={g.key} onPress={() => setGoal(g.key)} activeOpacity={0.8}
                      style={{ flex: 1, alignItems: 'center', gap: 4, backgroundColor: goal === g.key ? gc + '18' : C.card, borderRadius: 14, padding: 14, borderWidth: 1.5, borderColor: goal === g.key ? gc + '80' : C.border }}>
                      <Text style={{ fontSize: 22 }}>{g.icon}</Text>
                      <Text style={[{ fontSize: 13, color: goal === g.key ? gc : C.text }, ff.heading]}>{g.label}</Text>
                      <Text style={[{ fontSize: 10, color: C.textSub }, ff.body]}>{g.desc}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={[{ fontSize: 11, color: C.textSub, letterSpacing: 1, marginBottom: 10 }, ff.heading]}>ACTIVITY LEVEL</Text>
              <View style={{ gap: 8, marginBottom: 24 }}>
                {ACTIVITY.map(a => (
                  <TouchableOpacity key={a.key} onPress={() => setActivity(a.key)} activeOpacity={0.8}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: activity === a.key ? C.accent + '12' : C.card, borderRadius: 14, padding: 14, borderWidth: 1.5, borderColor: activity === a.key ? C.accent + '70' : C.border, borderLeftWidth: 3, borderLeftColor: activity === a.key ? C.accent : C.border }}>
                    <Text style={{ fontSize: 22 }}>{a.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[{ fontSize: 14, color: activity === a.key ? C.accent : C.text }, ff.heading]}>{a.label}</Text>
                      <Text style={[{ fontSize: 11, color: C.textSub, marginTop: 2 }, ff.body]}>{a.desc}</Text>
                    </View>
                    {activity === a.key && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.accent }} />}
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity onPress={calculate} activeOpacity={0.85}
                style={{ height: 56, borderRadius: 18, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 20, ...shadow(C.accent, 0.3, 14, 5) }}>
                <Text style={[{ color: C.btnText, fontSize: 17 }, ff.heading]}>{result ? 'Recalculate 🔄' : 'Calculate 🔥'}</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </ScrollView>
      )}

      {/* ── Cup size picker modal ── */}
      <Modal visible={cupPickerModal} animationType="slide" presentationStyle="formSheet" onRequestClose={() => setCupPickerModal(false)}>
        <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: 24, paddingHorizontal: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
            <Text style={[{ flex: 1, fontSize: 20, color: C.text }, ff.display]}>Cup Size</Text>
            <TouchableOpacity onPress={() => setCupPickerModal(false)} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border }}>
              <Ionicons name="close" size={16} color={C.textSub} />
            </TouchableOpacity>
          </View>
          <Text style={[{ fontSize: 12, color: C.textSub, marginBottom: 16 }, ff.body]}>
            Choose your default glass/cup size. This is used for +/− water buttons and notifications.
          </Text>
          <View style={{ gap: 10 }}>
            {CUP_SIZES.map(c => (
              <TouchableOpacity key={c.ml} onPress={() => { saveCupSize(c.ml); setCupPickerModal(false); }}
                activeOpacity={0.8}
                style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: c.ml === cupMl ? '#54a0ff18' : C.card, borderRadius: 16, padding: 16, borderWidth: 1.5, borderColor: c.ml === cupMl ? '#54a0ff70' : C.border }}>
                <Text style={{ fontSize: 22, marginRight: 14 }}>
                  {c.ml <= 200 ? '🥛' : c.ml <= 300 ? '☕' : '🍶'}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={[{ fontSize: 15, color: c.ml === cupMl ? '#54a0ff' : C.text }, ff.heading]}>{c.label}</Text>
                  <Text style={[{ fontSize: 11, color: C.textSub }, ff.body]}>{c.desc}</Text>
                </View>
                {c.ml === cupMl && <Ionicons name="checkmark-circle" size={20} color="#54a0ff" />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* ── Water reminder settings modal ── */}
      <Modal visible={waterSettings} animationType="slide" presentationStyle="formSheet" onRequestClose={() => setWaterSettings(false)}>
        <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: 24, paddingHorizontal: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Text style={[{ flex: 1, fontSize: 20, color: C.text }, ff.display]}>Water Reminders</Text>
            <TouchableOpacity onPress={() => setWaterSettings(false)} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border }}>
              <Ionicons name="close" size={16} color={C.textSub} />
            </TouchableOpacity>
          </View>
          <Text style={[{ fontSize: 12, color: C.textSub, marginBottom: 24, lineHeight: 18 }, ff.body]}>
            Get nudged to drink water throughout the day. You can log directly from the notification — no need to open the app.
          </Text>

          {/* Enable toggle */}
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border, marginBottom: 16 }}>
            <View style={{ flex: 1 }}>
              <Text style={[{ fontSize: 15, color: C.text }, ff.heading]}>Enable reminders</Text>
              <Text style={[{ fontSize: 11, color: C.textSub, marginTop: 2 }, ff.body]}>
                {reminderConfig.enabled ? `Active · ${intervalLabel(reminderConfig.intervalMinutes)}` : 'Off'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                applyReminderConfig({ ...reminderConfig, enabled: !reminderConfig.enabled });
              }}
              style={{ width: 50, height: 28, borderRadius: 14, backgroundColor: reminderConfig.enabled ? '#54a0ff' : C.surface, justifyContent: 'center', paddingHorizontal: 3, borderWidth: 1, borderColor: reminderConfig.enabled ? '#54a0ff' : C.border }}>
              <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: reminderConfig.enabled ? '#fff' : C.muted, alignSelf: reminderConfig.enabled ? 'flex-end' : 'flex-start' }} />
            </TouchableOpacity>
          </View>

          {reminderConfig.enabled && (
            <Animated.View entering={FadeIn.duration(200)}>
              {/* Interval */}
              <Text style={[{ fontSize: 11, color: C.textSub, letterSpacing: 1, marginBottom: 10 }, ff.heading]}>REMINDER INTERVAL</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                {INTERVAL_OPTIONS.map(opt => (
                  <TouchableOpacity key={opt.minutes}
                    onPress={() => applyReminderConfig({ ...reminderConfig, intervalMinutes: opt.minutes })}
                    style={{ paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, backgroundColor: reminderConfig.intervalMinutes === opt.minutes ? '#54a0ff22' : C.card, borderWidth: 1.5, borderColor: reminderConfig.intervalMinutes === opt.minutes ? '#54a0ff80' : C.border }}>
                    <Text style={[{ fontSize: 13, color: reminderConfig.intervalMinutes === opt.minutes ? '#54a0ff' : C.text }, ff.heading]}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Active hours */}
              <Text style={[{ fontSize: 11, color: C.textSub, letterSpacing: 1, marginBottom: 10 }, ff.heading]}>ACTIVE HOURS</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
                {[
                  { label: 'From', key: 'startHour', options: [6,7,8,9,10] },
                  { label: 'Until', key: 'endHour',  options: [20,21,22,23] },
                ].map(row => (
                  <View key={row.key} style={{ flex: 1 }}>
                    <Text style={[{ fontSize: 10, color: C.textSub, marginBottom: 6 }, ff.body]}>{row.label}</Text>
                    <View style={{ gap: 5 }}>
                      {row.options.map(h => (
                        <TouchableOpacity key={h}
                          onPress={() => applyReminderConfig({ ...reminderConfig, [row.key]: h })}
                          style={{ paddingVertical: 7, paddingHorizontal: 10, borderRadius: 10, backgroundColor: reminderConfig[row.key] === h ? '#54a0ff22' : C.card, borderWidth: 1, borderColor: reminderConfig[row.key] === h ? '#54a0ff70' : C.border }}>
                          <Text style={[{ fontSize: 13, color: reminderConfig[row.key] === h ? '#54a0ff' : C.text, textAlign: 'center' }, ff.heading]}>
                            {h}:00
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ))}
              </View>

              <View style={{ backgroundColor: '#54a0ff10', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#54a0ff30' }}>
                <Text style={[{ fontSize: 12, color: '#54a0ff', lineHeight: 18 }, ff.body]}>
                  💡 From the notification you can tap <Text style={[ff.heading]}>"💧 Logged a glass"</Text> to instantly log {cupMl}ml without opening the app, or snooze for 30 min.
                </Text>
              </View>
            </Animated.View>
          )}
        </View>
      </Modal>

      {/* Modals */}
      <AddFoodModal visible={addModal} onClose={() => setAddModal(false)} onAdd={addFood} C={C} ff={ff} />
      <NutritionDetailSheet
        visible={detailSheet} onClose={() => setDetailSheet(false)}
        eaten={eaten} burned={burned} target={result?.targetCals || 0}
        macros={macros} logMacros={logMacros}
        todayWorkouts={todayWorkouts} effectiveSteps={effectiveSteps} weightNum={weightNum}
        mlDrunk={mlDrunk} goalMl={waterGoalMl} cupMl={cupMl}
        onAddWater={addWater} onRemoveWater={removeWater} onSetCupSize={saveCupSize}
        C={C} ff={ff}
      />
    </View>
  );
}
