import { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, Alert, Modal, Dimensions, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { addMeasurement, getMeasurements } from '../../services/measurementService';
import { useTheme } from '../../hooks/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SW } = Dimensions.get('window');

const METRICS = [
  { key: 'weight',  label: 'Weight',   unit: 'kg', icon: '⚖️',  color: '#00c896', step: 0.1, holdStep: 0.5  },
  { key: 'height',  label: 'Height',   unit: 'cm', icon: '📏',  color: '#54a0ff', step: 0.1, holdStep: 1.0  },
  { key: 'arm',     label: 'Arm',      unit: 'cm', icon: '💪',  color: '#7b61ff', step: 0.1, holdStep: 1.0  },
  { key: 'chest',   label: 'Chest',    unit: 'cm', icon: '🫀',  color: '#ff6b6b', step: 0.1, holdStep: 1.0  },
  { key: 'waist',   label: 'Waist',    unit: 'cm', icon: '🔄',  color: '#ff9f43', step: 0.1, holdStep: 1.0  },
  { key: 'quads',   label: 'Quads',    unit: 'cm', icon: '🦵',  color: '#54a0ff', step: 0.1, holdStep: 1.0  },
  { key: 'calves',  label: 'Calves',   unit: 'cm', icon: '🦶',  color: '#00c896', step: 0.1, holdStep: 1.0  },
  { key: 'bodyFat', label: 'Body Fat', unit: '%',  icon: '📊',  color: '#7b61ff', step: 0.1, holdStep: 0.5  },
];

const GOALS_STORAGE_KEY = uid => `lockin_measurement_goals_${uid}`;
const CALORIES_PROFILE_KEY = uid => `lockin_calories_${uid}`;

// ── Goal progress bar ────────────────────────────────────────────────────────
function GoalBar({ current, goal, color, unit, C, F }) {
  if (!goal || !current) return null;
  const pct     = Math.min(current / goal, 1);
  const reached = current >= goal;
  const diff    = +(goal - current).toFixed(1);
  return (
    <View style={{ marginTop: 8, gap: 4 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 10, color: C.textSub, fontFamily: F.body }}>
          {reached ? '🎯 Goal reached!' : `${diff} ${unit} to goal`}
        </Text>
        <Text style={{ fontSize: 10, color, fontFamily: F.heading }}>{current} / {goal} {unit}</Text>
      </View>
      <View style={{ height: 5, backgroundColor: color + '22', borderRadius: 3 }}>
        <View style={{ height: 5, width: `${pct * 100}%`, backgroundColor: reached ? '#00c896' : color, borderRadius: 3 }} />
      </View>
    </View>
  );
}

// ── Hold-to-repeat stepper ────────────────────────────────────────────────────
function Stepper({ metricKey, value, step, holdStep, color, headingFont, onChange }) {
  const holdTimer  = useRef(null);
  const fastTimer  = useRef(null);
  const isHolding  = useRef(false);

  const nudge = (dir, s) => {
    onChange(metricKey, prev => {
      const current = parseFloat(prev) || 0;
      return String(+(current + dir * s).toFixed(2));
    });
  };

  const startHold = (dir) => {
    isHolding.current = false;
    nudge(dir, step); // single tap increment first
    holdTimer.current = setTimeout(() => {
      isHolding.current = true;
      fastTimer.current = setInterval(() => nudge(dir, holdStep), 60);
    }, 380);
  };

  const stopHold = () => {
    clearTimeout(holdTimer.current);
    clearInterval(fastTimer.current);
    isHolding.current = false;
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, justifyContent: 'center' }}>
      <TouchableOpacity
        onPressIn={() => startHold(-1)} onPressOut={stopHold} activeOpacity={0.7}
        style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: color + '20', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: color + '55' }}
      >
        <Text style={{ color, fontSize: 28, lineHeight: 30, fontFamily: headingFont }}>−</Text>
      </TouchableOpacity>

      <TextInput
        style={{ color, fontSize: 36, textAlign: 'center', minWidth: 100, paddingVertical: 4, borderBottomWidth: 2, borderBottomColor: color + '60', fontFamily: headingFont }}
        value={value}
        onChangeText={v => { if (/^\d*\.?\d*$/.test(v)) onChange(metricKey, () => v); }}
        keyboardType="decimal-pad"
        selectTextOnFocus
      />

      <TouchableOpacity
        onPressIn={() => startHold(1)} onPressOut={stopHold} activeOpacity={0.7}
        style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: color + '20', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: color + '55' }}
      >
        <Text style={{ color, fontSize: 28, lineHeight: 30, fontFamily: headingFont }}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function MeasurementsScreen() {
  const { scheme: C, font: F } = useTheme();
  const { user } = useAuth();

  const [measurements, setMeasurements] = useState([]);
  const [fetching,     setFetching]     = useState(true);
  const [activeKey,    setActiveKey]    = useState(null); // which metric card is expanded
  const [form,         setForm]         = useState({});   // live edit values per metric
  const [saving,       setSaving]       = useState(false);
  const [activeTab,    setActiveTab]    = useState('metrics'); // 'metrics' | 'history'
  const [goals,        setGoals]        = useState({});   // { [metricKey]: number }
  const [goalModal,    setGoalModal]    = useState(null); // metricKey being edited
  const [goalInput,    setGoalInput]    = useState('');   // temp input value

  useEffect(() => {
    setMeasurements([]);
    setFetching(true);
    loadMeasurements();
    loadGoals();
  }, [user?.uid]);

  const loadGoals = async () => {
    if (!user) return;
    try {
      const raw = await AsyncStorage.getItem(GOALS_STORAGE_KEY(user.uid));
      if (raw) setGoals(JSON.parse(raw));
    } catch (_) {}
  };

  const saveGoal = async (key, value) => {
    const updated = { ...goals, [key]: value };
    setGoals(updated);
    if (user?.uid) await AsyncStorage.setItem(GOALS_STORAGE_KEY(user.uid), JSON.stringify(updated));
  };

  const removeGoal = async (key) => {
    const updated = { ...goals };
    delete updated[key];
    setGoals(updated);
    if (user?.uid) await AsyncStorage.setItem(GOALS_STORAGE_KEY(user.uid), JSON.stringify(updated));
  };

  // Sync weight/height changes to CaloriesScreen profile
  const syncToCaloriesProfile = async (key, val) => {
    if (key !== 'weight' && key !== 'height') return;
    if (!user?.uid) return;
    try {
      const raw = await AsyncStorage.getItem(CALORIES_PROFILE_KEY(user.uid));
      if (!raw) return;
      const profile = JSON.parse(raw);
      profile[key] = String(val);
      // Recalculate result if possible
      const w = key === 'weight' ? val : parseFloat(profile.weight);
      const h = key === 'height' ? val : parseFloat(profile.height);
      if (w && h && profile.result) {
        const bmi = w / ((h / 100) ** 2);
        const bmiVal = bmi.toFixed(1);
        const bmiLabel = bmi < 18.5 ? 'Underweight' : bmi < 23 ? 'Normal' : bmi < 27.5 ? 'Overweight' : 'Obese';
        const bmiColor = bmi < 18.5 ? '#54a0ff' : bmi < 23 ? '#00c896' : bmi < 27.5 ? '#ff9f43' : '#ff6b6b';
        profile.result.bmi = { value: bmiVal, label: bmiLabel, color: bmiColor };
        profile.result.targetCals = profile.result.targetCals; // keep existing
      }
      await AsyncStorage.setItem(CALORIES_PROFILE_KEY(user.uid), JSON.stringify(profile));
    } catch (_) {}
  };

  const loadMeasurements = async () => {
    if (!user) return;
    try { const data = await getMeasurements(user.uid); setMeasurements(data); }
    finally { setFetching(false); }
  };

  const getHistory = (key) => measurements.filter(m => m[key] !== undefined).map(m => m[key]);
  const getLatest  = (key) => { const v = getHistory(key); return v.length > 0 ? v[v.length - 1] : null; };
  const getChange  = (key) => { const v = getHistory(key); return v.length < 2 ? null : +(v[v.length - 1] - v[0]).toFixed(1); };

  // Open a card — pre-fill with latest value
  const openCard = (key) => {
    if (activeKey === key) { setActiveKey(null); return; }
    const latest = getLatest(key);
    setForm(prev => ({ ...prev, [key]: latest !== null ? String(latest) : '' }));
    setActiveKey(key);
  };

  const handleFormChange = (key, updater) =>
    setForm(prev => ({ ...prev, [key]: updater(prev[key] ?? '0') }));

  // Save only this one metric, update measurements state immediately so chart re-renders
  const handleSaveMetric = async (key) => {
    const val = parseFloat(form[key]);
    if (isNaN(val)) return Alert.alert('Enter a value first');
    setSaving(true);
    const entry = { [key]: val };
    // Optimistically add to local state so chart updates instantly
    const tempEntry = {
      id: `temp_${Date.now()}`,
      ...entry,
      createdAt: { toMillis: () => Date.now() },
    };
    setMeasurements(prev => [...prev, tempEntry]);
    try {
      await addMeasurement(user.uid, entry);
      setActiveKey(null); // close card only after successful save
      await syncToCaloriesProfile(key, val);
      await loadMeasurements();
    } catch {
      setMeasurements(prev => prev.filter(m => m.id !== tempEntry.id));
      Alert.alert('Error', 'Failed to save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const TABS = [
    { key: 'metrics', icon: 'body-outline',   label: 'Metrics' },
    { key: 'history', icon: 'time-outline',   label: 'History' },
  ];

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

      {/* ── HEADER ── */}
      <Animated.View entering={FadeInDown.duration(350)} style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12 }}>
        <Text style={{ fontSize: 28, color: C.text, fontFamily: F.display, letterSpacing: -0.5 }}>Measurements</Text>
        <Text style={{ fontSize: 13, color: C.textSub, fontFamily: F.body, marginTop: 2 }}>Tap a metric to update</Text>
      </Animated.View>

      {/* ── TABS ── */}
      <View style={{ flexDirection: 'row', marginHorizontal: 20, marginBottom: 14, backgroundColor: C.surface, borderRadius: 14, padding: 4, borderWidth: 1, borderColor: C.border }}>
        {TABS.map(tab => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity key={tab.key} onPress={() => setActiveTab(tab.key)}
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: 10, backgroundColor: active ? C.accent + '20' : 'transparent', borderWidth: active ? 1 : 0, borderColor: C.accent + '50' }}
              activeOpacity={0.7}
            >
              <Ionicons name={tab.icon} size={15} color={active ? C.accent : C.textSub} />
              <Text style={{ fontSize: 13, fontFamily: F.heading, color: active ? C.accent : C.textSub }}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ══ METRICS TAB ══ */}
      {activeTab === 'metrics' && (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 48, gap: 10 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {METRICS.map((m, i) => {
            const latest   = getLatest(m.key);
            const change   = getChange(m.key);
            const history  = getHistory(m.key);
            const isOpen   = activeKey === m.key;
            const curVal   = form[m.key] ?? (latest !== null ? String(latest) : '');
            const curNum   = parseFloat(curVal);
            const liveDiff = (latest !== null && !isNaN(curNum))
              ? +(curNum - latest).toFixed(2) : null;
                    // Append live input to chart so graph moves in real-time while editing
                    const liveHistory = isOpen && !isNaN(curNum) && curNum !== latest
                      ? [...history, curNum]
                      : history;

            return (
              <Animated.View key={m.key} entering={FadeInDown.duration(300).delay(i * 35)}>
                <TouchableOpacity
                  onPress={() => openCard(m.key)}
                  activeOpacity={0.8}
                  style={{
                    backgroundColor: isOpen ? m.color + '12' : C.card,
                    borderRadius: 18,
                    borderWidth: 1.5,
                    borderColor: isOpen ? m.color + '70' : C.border,
                    borderLeftWidth: 4,
                    borderLeftColor: m.color,
                    overflow: 'hidden',
                  }}
                >
                  {/* ── Collapsed row ── */}
                  <View style={{ padding: 16, paddingBottom: goals[m.key] && latest !== null && !isOpen ? 10 : 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <Text style={{ fontSize: 24 }}>{m.icon}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, color: C.textSub, fontFamily: F.heading, letterSpacing: 0.4 }}>
                          {m.label.toUpperCase()}
                        </Text>
                        <Text style={{ fontSize: 26, color: isOpen ? m.color : C.text, fontFamily: F.display, lineHeight: 30 }}>
                          {latest !== null ? latest : '—'}
                          {latest !== null &&
                            <Text style={{ fontSize: 13, color: C.textSub, fontFamily: F.body }}> {m.unit}</Text>
                          }
                        </Text>
                      </View>

                    {/* Change badge */}
                    {change !== null && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: (change <= 0 ? '#00c896' : '#ff6b6b') + '18', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                        <Ionicons name={change <= 0 ? 'trending-down' : 'trending-up'} size={12} color={change <= 0 ? '#00c896' : '#ff6b6b'} />
                        <Text style={{ fontSize: 12, color: change <= 0 ? '#00c896' : '#ff6b6b', fontFamily: F.heading }}>
                          {change > 0 ? '+' : ''}{change}
                        </Text>
                      </View>
                    )}

                    <TouchableOpacity
                      onPress={() => { setGoalInput(goals[m.key] ? String(goals[m.key]) : ''); setGoalModal(m.key); }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: goals[m.key] ? m.color + '22' : C.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: goals[m.key] ? m.color + '55' : C.border }}
                    >
                      <Ionicons name="flag-outline" size={13} color={goals[m.key] ? m.color : C.muted} />
                    </TouchableOpacity>
                    <Ionicons
                      name={isOpen ? 'chevron-up' : 'chevron-down'}
                      size={16} color={isOpen ? m.color : C.muted}
                    />
                    </View>{/* end inner row */}

                    {/* Goal bar — full width, below the row */}
                    {goals[m.key] && latest !== null && !isOpen && (
                      <GoalBar
                        current={latest}
                        goal={goals[m.key]}
                        color={m.color}
                        unit={m.unit}
                        C={C} F={F}
                      />
                    )}
                  </View>{/* end outer column */}

                  {/* ── Expanded: stepper + live diff + save + chart ── */}
                  {isOpen && (
                    <Animated.View entering={FadeIn.duration(200)} style={{ paddingHorizontal: 20, paddingBottom: 20, borderTopWidth: 1, borderTopColor: m.color + '30' }}>

                      {/* Stepper */}
                      <View style={{ paddingVertical: 20 }}>
                        <Stepper
                          metricKey={m.key}
                          value={curVal}
                          step={m.step}
                          holdStep={m.holdStep}
                          color={m.color}
                          headingFont={F.heading}
                          onChange={handleFormChange}
                        />
                        <Text style={{ fontSize: 11, color: C.muted, textAlign: 'center', marginTop: 6, fontFamily: F.body }}>
                          tap +0.1  ·  hold to go fast
                        </Text>
                      </View>

                      {/* Live diff */}
                      {liveDiff !== null && liveDiff !== 0 && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 14 }}>
                          <Ionicons name={liveDiff < 0 ? 'trending-down' : 'trending-up'} size={14} color={liveDiff < 0 ? '#00c896' : '#ff6b6b'} />
                          <Text style={{ fontSize: 14, color: liveDiff < 0 ? '#00c896' : '#ff6b6b', fontFamily: F.heading }}>
                            {liveDiff > 0 ? '+' : ''}{liveDiff} {m.unit} from last entry
                          </Text>
                        </View>
                      )}

                      {/* Goal progress bar */}
                      {goals[m.key] && (
                        <GoalBar
                          current={parseFloat(curVal)}
                          goal={goals[m.key]}
                          color={m.color}
                          unit={m.unit}
                          C={C} F={F}
                        />
                      )}

                      {/* Save button */}
                      <TouchableOpacity
                        onPress={() => handleSaveMetric(m.key)}
                        disabled={saving}
                        activeOpacity={0.85}
                        style={{ backgroundColor: m.color, borderRadius: 14, height: 48, alignItems: 'center', justifyContent: 'center', opacity: saving ? 0.6 : 1 }}
                      >
                        <Text style={{ color: '#000', fontSize: 15, fontFamily: F.heading }}>
                          {saving ? 'Saving…' : `Save ${m.label}`}
                        </Text>
                      </TouchableOpacity>

                      {/* Chart — live: appends current input value before saving */}
                      {liveHistory.length >= 2 && (
                        <View style={{ marginTop: 20 }}>
                          <Text style={{ fontSize: 11, color: C.textSub, fontFamily: F.heading, letterSpacing: 0.8, marginBottom: 8 }}>
                            PROGRESS
                          </Text>
                          <LineChart
                            data={{
                              labels: liveHistory.map((_, idx) => `${idx + 1}`),
                              datasets: [{ data: liveHistory, color: () => m.color, strokeWidth: 2.5 }],
                            }}
                            width={SW - 72}
                            height={130}
                            chartConfig={{
                              backgroundColor: 'transparent',
                              backgroundGradientFrom: C.card,
                              backgroundGradientTo: C.card,
                              decimalPlaces: 1,
                              color: () => m.color,
                              labelColor: () => C.textSub,
                              propsForDots: { r: '4', strokeWidth: '2', stroke: m.color },
                              propsForBackgroundLines: { stroke: C.border, strokeDasharray: '4' },
                            }}
                            bezier
                            style={{ borderRadius: 12, marginLeft: -8 }}
                            withInnerLines={false}
                            withOuterLines={false}
                          />
                        </View>
                      )}
                    </Animated.View>
                  )}
                </TouchableOpacity>
              </Animated.View>
            );
          })}

          {/* Empty state */}
          {!fetching && measurements.length === 0 && (
            <View style={{ alignItems: 'center', paddingVertical: 32, gap: 6 }}>
              <Text style={{ fontSize: 13, color: C.textSub, fontFamily: F.body }}>No data yet — tap any metric above to log your first entry</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* ══ HISTORY TAB ══ */}
      {activeTab === 'history' && (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 48, gap: 10 }} showsVerticalScrollIndicator={false}>
          {measurements.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 60, gap: 8 }}>
              <Text style={{ fontSize: 40 }}>📏</Text>
              <Text style={{ fontSize: 16, color: C.text, fontFamily: F.heading }}>No history yet</Text>
              <Text style={{ fontSize: 13, color: C.textSub, fontFamily: F.body }}>Tap a metric to log your first entry</Text>
            </View>
          ) : (
            (() => {
              // Group all entries by calendar day, take last value per metric per day
              const dayMap = {};
              measurements.forEach(entry => {
                const ms  = entry.createdAt?.toMillis ? entry.createdAt.toMillis() : Date.now();
                const day = new Date(ms).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
                if (!dayMap[day]) dayMap[day] = { day, ms, values: {} };
                // Last write wins for each metric within the same day
                METRICS.forEach(({ key }) => {
                  if (entry[key] !== undefined) dayMap[day].values[key] = entry[key];
                });
                if (ms > dayMap[day].ms) dayMap[day].ms = ms; // keep latest timestamp
              });
              const days = Object.values(dayMap).sort((a, b) => b.ms - a.ms).slice(0, 20);
              return days.map((group, i) => (
                <Animated.View key={group.day} entering={FadeIn.duration(260).delay(i * 35)}
                  style={{ backgroundColor: C.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: C.border }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    <Ionicons name="calendar-outline" size={12} color={C.textSub} />
                    <Text style={{ fontSize: 12, color: C.textSub, fontFamily: F.body }}>{group.day}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {METRICS.filter(({ key }) => group.values[key] !== undefined).map(({ key, label, unit, color }) => (
                      <View key={key} style={{ backgroundColor: color + '15', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center', borderWidth: 1, borderColor: color + '30' }}>
                        <Text style={{ fontSize: 15, color, fontFamily: F.display }}>
                          {group.values[key]}<Text style={{ fontSize: 10, color: C.textSub, fontFamily: F.body }}> {unit}</Text>
                        </Text>
                        <Text style={{ fontSize: 10, color: C.textSub, fontFamily: F.body }}>{label}</Text>
                      </View>
                    ))}
                  </View>
                </Animated.View>
              ));
            })()
          )}
        </ScrollView>
      )}
      {/* ── GOAL SETTING MODAL ── */}
      <Modal
        visible={goalModal !== null}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setGoalModal(null)}
      >
        {goalModal && (() => {
          const m = METRICS.find(x => x.key === goalModal);
          if (!m) return null;
          const latest = getLatest(m.key);
          return (
            <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#080b10' }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
              <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
                <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: '#333' }} />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }}>
                <Text style={{ fontSize: 28, marginRight: 10 }}>{m.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[{ fontSize: 20, color: '#fff' }, { fontFamily: F.display }]}>{m.label} Goal</Text>
                  {latest !== null && (
                    <Text style={[{ fontSize: 12, color: '#888', marginTop: 2 }, { fontFamily: F.body }]}>Current: {latest} {m.unit}</Text>
                  )}
                </View>
                <TouchableOpacity onPress={() => setGoalModal(null)}
                  style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#1a1a2e', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#333' }}>
                  <Ionicons name="close" size={16} color="#888" />
                </TouchableOpacity>
              </View>

              <View style={{ paddingHorizontal: 20, gap: 16 }}>
                <View style={{ backgroundColor: '#1a1a2e', borderRadius: 18, padding: 20, borderWidth: 1.5, borderColor: m.color + '44', alignItems: 'center', gap: 8 }}>
                  <Text style={[{ fontSize: 12, color: '#888', letterSpacing: 1 }, { fontFamily: F.heading }]}>TARGET {m.unit.toUpperCase()}</Text>
                  <TextInput
                    style={[{ fontSize: 48, color: m.color, textAlign: 'center', minWidth: 120, borderBottomWidth: 2, borderBottomColor: m.color + '60', paddingBottom: 4 }, { fontFamily: F.display }]}
                    value={goalInput}
                    onChangeText={v => { if (/^\d*\.?\d*$/.test(v)) setGoalInput(v); }}
                    keyboardType="decimal-pad"
                    selectTextOnFocus
                    autoFocus
                    placeholder="0"
                    placeholderTextColor={m.color + '44'}
                  />
                  <Text style={[{ fontSize: 13, color: '#888' }, { fontFamily: F.body }]}>{m.unit}</Text>
                </View>

                {/* Quick suggestions */}
                {latest !== null && (
                  <View style={{ gap: 8 }}>
                    <Text style={[{ fontSize: 11, color: '#888', letterSpacing: 1 }, { fontFamily: F.heading }]}>QUICK TARGETS</Text>
                    <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                      {[-10, -5, -3, +3, +5, +10].map(delta => {
                        const suggested = +(latest + delta).toFixed(1);
                        if (suggested <= 0) return null;
                        return (
                          <TouchableOpacity key={delta} onPress={() => setGoalInput(String(suggested))}
                            activeOpacity={0.7}
                            style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: goalInput === String(suggested) ? m.color + '22' : '#1a1a2e', borderWidth: 1.5, borderColor: goalInput === String(suggested) ? m.color + '80' : '#333' }}>
                            <Text style={[{ fontSize: 13, color: goalInput === String(suggested) ? m.color : '#aaa' }, { fontFamily: F.heading }]}>
                              {delta > 0 ? '+' : ''}{delta} → {suggested}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* Action buttons */}
                <View style={{ gap: 10 }}>
                  <TouchableOpacity
                    onPress={() => {
                      const val = parseFloat(goalInput);
                      if (!isNaN(val) && val > 0) { saveGoal(m.key, val); setGoalModal(null); }
                      else Alert.alert('Invalid', 'Enter a valid goal value.');
                    }}
                    activeOpacity={0.85}
                    style={{ height: 52, borderRadius: 16, backgroundColor: m.color, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={[{ color: '#000', fontSize: 16 }, { fontFamily: F.heading }]}>Set Goal 🎯</Text>
                  </TouchableOpacity>

                  {goals[m.key] && (
                    <TouchableOpacity
                      onPress={() => { removeGoal(m.key); setGoalModal(null); }}
                      activeOpacity={0.8}
                      style={{ height: 44, borderRadius: 16, backgroundColor: '#ff6b6b18', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#ff6b6b44' }}>
                      <Text style={[{ color: '#ff6b6b', fontSize: 14 }, { fontFamily: F.heading }]}>Remove Goal</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </KeyboardAvoidingView>
          );
        })()}
      </Modal>
    </KeyboardAvoidingView>
  );
}
