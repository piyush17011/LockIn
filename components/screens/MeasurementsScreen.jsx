import { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, Alert, Modal, Dimensions,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { addMeasurement, getMeasurements } from '../../services/measurementService';
import { useTheme } from '../../hooks/ThemeContext';

const { width: SW } = Dimensions.get('window');

const METRICS = [
  { key: 'weight',  label: 'Weight',   unit: 'kg', icon: '⚖️', color: '#00c896', step: 0.1 },
  { key: 'height',  label: 'Height',   unit: 'cm', icon: '📏', color: '#54a0ff', step: 0.5 },
  { key: 'arm',     label: 'Arm',      unit: 'cm', icon: '💪', color: '#7b61ff', step: 0.5 },
  { key: 'chest',   label: 'Chest',    unit: 'cm', icon: '🫀', color: '#ff6b6b', step: 0.5 },
  { key: 'waist',   label: 'Waist',    unit: 'cm', icon: '🔄', color: '#ff9f43', step: 0.5 },
  { key: 'quads',   label: 'Quads',    unit: 'cm', icon: '🦵', color: '#54a0ff', step: 0.5 },
  { key: 'calves',  label: 'Calves',   unit: 'cm', icon: '🦶', color: '#00c896', step: 0.5 },
  { key: 'bodyFat', label: 'Body Fat', unit: '%',  icon: '📊', color: '#7b61ff', step: 0.1 },
];

const shadow = (color = '#000', opacity = 0.08, radius = 12, y = 4) => ({
  shadowColor: color,
  shadowOffset: { width: 0, height: y },
  shadowOpacity: opacity,
  shadowRadius: radius,
  elevation: Math.round(radius / 2),
});

// ── Hold-to-repeat stepper ─────────────────────────────────────
function Stepper({ metricKey, value, step, color, headingFont, onChange }) {
  const holdTimer = useRef(null);
  const fastTimer = useRef(null);

  const nudge = (dir) => {
    onChange(metricKey, prev => {
      const current = parseFloat(prev) || 0;
      return String(+(current + dir * step).toFixed(2));
    });
  };

  const startHold = (dir) => {
    nudge(dir);
    holdTimer.current = setTimeout(() => {
      fastTimer.current = setInterval(() => nudge(dir), 60);
    }, 380);
  };

  const stopHold = () => {
    clearTimeout(holdTimer.current);
    clearInterval(fastTimer.current);
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <TouchableOpacity
        onPressIn={() => startHold(-1)}
        onPressOut={stopHold}
        activeOpacity={0.7}
        style={{
          width: 42, height: 42, borderRadius: 21,
          backgroundColor: color + '20',
          alignItems: 'center', justifyContent: 'center',
          borderWidth: 1.5, borderColor: color + '55',
        }}
      >
        <Text style={{ color, fontSize: 22, lineHeight: 24, fontFamily: headingFont }}>−</Text>
      </TouchableOpacity>

      <TextInput
        style={{
          color,
          fontSize: 26,
          textAlign: 'center',
          minWidth: 80,
          paddingVertical: 4,
          borderBottomWidth: 2,
          borderBottomColor: color + '60',
          fontFamily: headingFont,
        }}
        value={value}
        onChangeText={v => {
          if (/^\d*\.?\d*$/.test(v)) onChange(metricKey, () => v);
        }}
        keyboardType="decimal-pad"
        selectTextOnFocus
      />

      <TouchableOpacity
        onPressIn={() => startHold(1)}
        onPressOut={stopHold}
        activeOpacity={0.7}
        style={{
          width: 42, height: 42, borderRadius: 21,
          backgroundColor: color + '20',
          alignItems: 'center', justifyContent: 'center',
          borderWidth: 1.5, borderColor: color + '55',
        }}
      >
        <Text style={{ color, fontSize: 22, lineHeight: 24, fontFamily: headingFont }}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function MeasurementsScreen() {
  const { scheme: C, font: F } = useTheme();
  const ff = {
    display:  { fontFamily: F.display },
    heading:  { fontFamily: F.heading },
    body:     { fontFamily: F.body },
    bodySemi: { fontFamily: F.bodySemi },
  };

  const { user } = useAuth();
  const [measurements, setMeasurements] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [activeMetric, setActiveMetric] = useState('weight');
  const [form,         setForm]         = useState({});
  const [fetching,     setFetching]     = useState(true);

  useEffect(() => {
    setMeasurements([]);
    setFetching(true);
    loadMeasurements();
  }, [user?.uid]);

  const loadMeasurements = async () => {
    if (!user) return;
    try {
      const data = await getMeasurements(user.uid);
      setMeasurements(data);
    } finally {
      setFetching(false);
    }
  };

  // Pre-fill with last known values when modal opens
  const openModal = () => {
    const prefill = {};
    METRICS.forEach(({ key }) => {
      const latest = getLatest(key);
      if (latest !== null) prefill[key] = String(latest);
    });
    setForm(prefill);
    setModalVisible(true);
  };

  // Updater used by Stepper — takes key + functional updater
  const handleFormChange = (key, updater) => {
    setForm(prev => ({ ...prev, [key]: updater(prev[key] ?? '0') }));
  };

  const handleSave = () => {
    if (!Object.values(form).some(v => v !== '')) {
      return Alert.alert('Error', 'Enter at least one measurement');
    }
    const entry = {};
    METRICS.forEach(({ key }) => { if (form[key]) entry[key] = parseFloat(form[key]); });
    setModalVisible(false);
    setForm({});
    const tempEntry = { id: `temp_${Date.now()}`, ...entry, createdAt: { toMillis: () => Date.now() } };
    setMeasurements(prev => [...prev, tempEntry]);
    addMeasurement(user.uid, entry)
      .then(() => loadMeasurements())
      .catch(() => {
        setMeasurements(prev => prev.filter(m => m.id !== tempEntry.id));
        Alert.alert('Error', 'Failed to save. Please try again.');
      });
  };

  const getHistory = (key) => measurements.filter(m => m[key] !== undefined).map(m => m[key]);
  const getLatest  = (key) => { const v = getHistory(key); return v.length > 0 ? v[v.length - 1] : null; };
  const getChange  = (key) => { const v = getHistory(key); return v.length < 2 ? null : (v[v.length - 1] - v[0]).toFixed(1); };

  const activeHistory = getHistory(activeMetric);
  const activeM       = METRICS.find(m => m.key === activeMetric);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 64, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >

        {/* ── HEADER ── */}
        <Animated.View entering={FadeInDown.duration(400)} style={{
          flexDirection: 'row', justifyContent: 'space-between',
          alignItems: 'flex-start', marginBottom: 28,
        }}>
          <View>
            <Text style={[{ fontSize: 26, color: C.text, letterSpacing: -0.5 }, ff.display]}>
              Measurements
            </Text>
            <Text style={[{ fontSize: 13, color: C.textSub, marginTop: 3 }, ff.body]}>
              Track your body progress
            </Text>
          </View>
          <TouchableOpacity
            onPress={openModal}
            activeOpacity={0.85}
            style={{
              width: 44, height: 44, borderRadius: 22,
              backgroundColor: C.accent,
              alignItems: 'center', justifyContent: 'center',
              // ...shadow(C.accent, 0.3, 12, 4),
            }}
          >
            <Ionicons name="add" size={22} color={C.bg} />
          </TouchableOpacity>
        </Animated.View>

        {/* ── METRIC CARDS GRID ── */}
        <Animated.View entering={FadeInDown.duration(400).delay(80)}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
            {METRICS.map((m, i) => {
              const latest    = getLatest(m.key);
              const change    = getChange(m.key);
              const changeNum = change !== null ? parseFloat(change) : null;
              const isActive  = activeMetric === m.key;

              return (
                <Animated.View
                  key={m.key}
                  entering={FadeIn.duration(300).delay(100 + i * 40)}
                  style={{ width: (SW - 50) / 2 }}
                >
                  <TouchableOpacity
                    onPress={() => setActiveMetric(m.key)}
                    activeOpacity={0.8}
                    style={{
                      backgroundColor: isActive ? m.color + '18' : C.card,
                      borderRadius: 18, padding: 16,
                      borderWidth: 1.5,
                      borderColor: isActive ? m.color + '80' : C.border,
                      alignItems: 'center',
                      // ...shadow(isActive ? m.color : '#000', isActive ? 0.15 : 0.06, 12, 3),
                    }}
                  >
                    {isActive && (
                      <View style={{
                        position: 'absolute', top: 0, left: 0, right: 0,
                        height: 3, backgroundColor: m.color,
                        borderTopLeftRadius: 18, borderTopRightRadius: 18,
                      }} />
                    )}

                    <Text style={{ fontSize: 28, marginBottom: 6 }}>{m.icon}</Text>
                    <Text style={[{ fontSize: 12, color: C.textSub, letterSpacing: 0.5, marginBottom: 6 }, ff.heading]}>
                      {m.label.toUpperCase()}
                    </Text>

                    {/* ↑ Bigger value */}
                    <Text style={[{ fontSize: 30, color: isActive ? m.color : C.text, lineHeight: 32 }, ff.display]}>
                      {latest !== null ? `${latest}` : '–'}
                    </Text>
                    {latest !== null && (
                      <Text style={[{ fontSize: 13, color: C.textSub, marginTop: 2 }, ff.body]}>
                        {m.unit}
                      </Text>
                    )}

                    {changeNum !== null && (
                      <View style={{
                        flexDirection: 'row', alignItems: 'center', gap: 3,
                        marginTop: 7,
                        backgroundColor: (changeNum <= 0 ? '#00c896' : '#ff6b6b') + '18',
                        borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
                      }}>
                        <Ionicons
                          name={changeNum <= 0 ? 'trending-down' : 'trending-up'}
                          size={12}
                          color={changeNum <= 0 ? '#00c896' : '#ff6b6b'}
                        />
                        <Text style={[{
                          fontSize: 12,
                          color: changeNum <= 0 ? '#00c896' : '#ff6b6b',
                        }, ff.heading]}>
                          {changeNum >= 0 ? '+' : ''}{change}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        </Animated.View>

        {/* ── CHART ── */}
        {activeHistory.length >= 1 && (
          <Animated.View
            entering={FadeIn.duration(400).delay(120)}
            style={{
              backgroundColor: C.card, borderRadius: 22,
              padding: 18, marginBottom: 24,
              borderWidth: 1, borderColor: C.border,
              borderTopWidth: 3, borderTopColor: activeM?.color,
              // ...shadow('#000', 0.08, 14, 4),
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Text style={{ fontSize: 18 }}>{activeM?.icon}</Text>
              <Text style={[{ fontSize: 15, color: C.text }, ff.heading]}>
                {activeM?.label} Progress
              </Text>
              <View style={{
                marginLeft: 'auto', backgroundColor: activeM?.color + '20',
                borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3,
              }}>
                <Text style={[{ fontSize: 11, color: activeM?.color }, ff.heading]}>
                  {activeHistory.length} entries
                </Text>
              </View>
            </View>
            <LineChart
              data={{
                labels: activeHistory.map((_, i) => `#${i + 1}`),
                datasets: [{
                  data: activeHistory,
                  color: () => activeM?.color || C.accent,
                  strokeWidth: 2.5,
                }],
              }}
              width={SW - 76}
              height={160}
              chartConfig={{
                backgroundColor:         C.card,
                backgroundGradientFrom:  C.card,
                backgroundGradientTo:    C.card,
                decimalPlaces:           1,
                color:                   () => activeM?.color || C.accent,
                labelColor:              () => C.textSub,
                propsForDots:            { r: '4', strokeWidth: '2', stroke: activeM?.color },
                propsForBackgroundLines: { stroke: C.border, strokeDasharray: '4' },
              }}
              bezier
              style={{ borderRadius: 12, marginLeft: -8 }}
              withInnerLines={true}
              withOuterLines={false}
            />
          </Animated.View>
        )}

        {/* ── HISTORY ── */}
        {measurements.length > 0 && (
          <Animated.View entering={FadeInDown.duration(400).delay(160)}>
            <Text style={[{ fontSize: 12, color: C.textSub, letterSpacing: 1, marginBottom: 12 }, ff.heading]}>
              HISTORY
            </Text>
            <View style={{ gap: 10 }}>
              {[...measurements].reverse().slice(0, 10).map((m, i) => {
                const dateLabel = m.createdAt?.toMillis
                  ? new Date(m.createdAt.toMillis()).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })
                  : 'Just now';
                const filled = METRICS.filter(({ key }) => m[key] !== undefined);
                return (
                  <Animated.View
                    key={m.id}
                    entering={FadeIn.duration(300).delay(i * 50)}
                    style={{
                      backgroundColor: C.card, borderRadius: 18,
                      padding: 16, borderWidth: 1, borderColor: C.border,
                      // ...shadow('#000', 0.05, 10, 3),
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                      <Ionicons name="calendar-outline" size={13} color={C.textSub} />
                      <Text style={[{ fontSize: 12, color: C.textSub, marginLeft: 5 }, ff.body]}>
                        {dateLabel}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      {filled.map(({ key, label, unit, color }) => (
                        <View key={key} style={{
                          backgroundColor: color + '15',
                          borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6,
                          alignItems: 'center', borderWidth: 1, borderColor: color + '30',
                        }}>
                          <Text style={[{ fontSize: 16, color }, ff.display]}>
                            {m[key]}<Text style={[{ fontSize: 11, color: C.textSub }, ff.body]}> {unit}</Text>
                          </Text>
                          <Text style={[{ fontSize: 11, color: C.textSub, marginTop: 1 }, ff.body]}>
                            {label}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </Animated.View>
                );
              })}
            </View>
          </Animated.View>
        )}

        {/* ── EMPTY STATE ── */}
        {!fetching && measurements.length === 0 && (
          <Animated.View entering={FadeIn.duration(400)} style={{ alignItems: 'center', paddingVertical: 60 }}>
            <Text style={{ fontSize: 48 }}>📏</Text>
            <Text style={[{ fontSize: 18, color: C.text, marginTop: 12 }, ff.heading]}>
              No measurements yet
            </Text>
            <Text style={[{ fontSize: 13, color: C.textSub, marginTop: 4 }, ff.body]}>
              Tap + to log your first entry
            </Text>
            <TouchableOpacity
              onPress={openModal}
              activeOpacity={0.85}
              style={{
                marginTop: 20, flexDirection: 'row', alignItems: 'center', gap: 8,
                backgroundColor: C.accent, borderRadius: 20,
                paddingHorizontal: 20, paddingVertical: 12,
                // ...shadow(C.accent, 0.25, 12, 4),
              }}
            >
              <Ionicons name="add" size={18} color={C.bg} />
              <Text style={[{ color: C.bg, fontSize: 14 }, ff.heading]}>Add First Entry</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

      </ScrollView>

      {/* ── ADD / UPDATE MODAL ── */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: C.bg }}>

          <View style={{
            flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
            paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16,
            borderBottomWidth: 1, borderBottomColor: C.border,
          }}>
            <View>
              <Text style={[{ fontSize: 20, color: C.text }, ff.display]}>Update Measurements</Text>
              <Text style={[{ fontSize: 12, color: C.textSub, marginTop: 2 }, ff.body]}>
                Hold + / − to change quickly
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={{
                width: 34, height: 34, borderRadius: 17,
                backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Ionicons name="close" size={18} color={C.textSub} />
            </TouchableOpacity>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
          >
            <View style={{ gap: 12 }}>
              {METRICS.map((m, i) => {
                const latest  = getLatest(m.key);
                const current = parseFloat(form[m.key] ?? '');
                const diff    = (latest !== null && !isNaN(current))
                  ? +(current - latest).toFixed(2) : null;

                return (
                  <Animated.View
                    key={m.key}
                    entering={FadeInDown.duration(280).delay(i * 30)}
                    style={{
                      backgroundColor: C.card, borderRadius: 18,
                      padding: 16,
                      borderWidth: 1, borderColor: C.border,
                      borderLeftWidth: 3, borderLeftColor: m.color,
                      // ...shadow('#000', 0.05, 10, 3),
                    }}
                  >
                    {/* Label row */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                      <Text style={{ fontSize: 22, marginRight: 10 }}>{m.icon}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[{ fontSize: 15, color: C.text }, ff.heading]}>{m.label}</Text>
                        {latest !== null ? (
                          <Text style={[{ fontSize: 12, color: C.textSub }, ff.body]}>
                            Last recorded: {latest} {m.unit}
                          </Text>
                        ) : (
                          <Text style={[{ fontSize: 12, color: C.textSub }, ff.body]}>
                            No record yet
                          </Text>
                        )}
                      </View>

                      {/* Live change diff badge */}
                      {diff !== null && diff !== 0 && (
                        <View style={{
                          backgroundColor: (diff < 0 ? '#00c896' : '#ff6b6b') + '20',
                          borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
                          flexDirection: 'row', alignItems: 'center', gap: 3,
                        }}>
                          <Ionicons
                            name={diff < 0 ? 'trending-down' : 'trending-up'}
                            size={11}
                            color={diff < 0 ? '#00c896' : '#ff6b6b'}
                          />
                          <Text style={[{
                            fontSize: 12,
                            color: diff < 0 ? '#00c896' : '#ff6b6b',
                          }, ff.heading]}>
                            {diff > 0 ? '+' : ''}{diff} {m.unit}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* ── Stepper ── */}
                    <View style={{ alignItems: 'center' }}>
                      <Stepper
                        metricKey={m.key}
                        value={form[m.key] ?? ''}
                        step={m.step}
                        color={m.color}
                        headingFont={F.heading}
                        onChange={handleFormChange}
                      />
                      <Text style={[{ fontSize: 11, color: C.textSub, marginTop: 6 }, ff.body]}>
                        step {m.step} {m.unit}  ·  hold to change fast
                      </Text>
                    </View>
                  </Animated.View>
                );
              })}
            </View>

            <Animated.View entering={FadeInDown.duration(280).delay(METRICS.length * 30 + 60)}>
              <TouchableOpacity
                onPress={handleSave}
                activeOpacity={0.85}
                style={{
                  backgroundColor: C.accent, borderRadius: 18,
                  height: 54, alignItems: 'center', justifyContent: 'center',
                  marginTop: 20,
                  // ...shadow(C.accent, 0.25, 14, 4),
                }}
              >
                <Text style={[{ color: C.bg, fontSize: 16 }, ff.heading]}>
                  Save Measurements
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
