import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { addMeasurement, getMeasurements } from '../../services/measurementService';
import { Colors, Spacing, Radius } from '../../constants/theme';

const { width } = Dimensions.get('window');
const METRICS = [
  { key: 'weight',  label: 'Weight',   unit: 'kg', icon: '⚖️', color: Colors.accent  },
  { key: 'height',  label: 'Height',   unit: 'cm', icon: '📏', color: Colors.blue    },
  { key: 'arm',     label: 'Arm',      unit: 'cm', icon: '💪', color: Colors.purple  },
  { key: 'chest',   label: 'Chest',    unit: 'cm', icon: '🫀', color: Colors.red     },
  { key: 'waist',   label: 'Waist',    unit: 'cm', icon: '🔄', color: Colors.orange  },
  { key: 'quads',   label: 'Quads',    unit: 'cm', icon: '🦵', color: Colors.blue    },
  { key: 'calves',  label: 'Calves',   unit: 'cm', icon: '🦶', color: Colors.accent  },
  { key: 'bodyFat', label: 'Body Fat', unit: '%',  icon: '📊', color: Colors.purple  },
];

export default function MeasurementsScreen() {
  const { user } = useAuth();
  const [measurements, setMeasurements] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [activeMetric, setActiveMetric] = useState('weight');
  const [form, setForm] = useState({});
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    // Reset when user changes — prevents showing previous user's data
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

  const handleSave = () => {
    if (!Object.values(form).some((v) => v !== '')) {
      return Alert.alert('Error', 'Enter at least one measurement');
    }

    const entry = {};
    METRICS.forEach(({ key }) => { if (form[key]) entry[key] = parseFloat(form[key]); });

    // Close modal and clear form instantly
    setModalVisible(false);
    setForm({});

    // Optimistic update — add to memory immediately with temp timestamp
    const tempEntry = { id: `temp_${Date.now()}`, ...entry, createdAt: { toMillis: () => Date.now() } };
    setMeasurements((prev) => [...prev, tempEntry]);

    // Save to Firestore in background, then sync real doc back
    addMeasurement(user.uid, entry)
      .then(() => loadMeasurements())
      .catch(() => {
        setMeasurements((prev) => prev.filter((m) => m.id !== tempEntry.id));
        Alert.alert('Error', 'Failed to save. Please try again.');
      });
  };

  const getHistory = (key) => measurements.filter((m) => m[key] !== undefined).map((m) => m[key]);
  const getLatest  = (key) => { const v = getHistory(key); return v.length > 0 ? v[v.length - 1] : null; };
  const getChange  = (key) => { const v = getHistory(key); return v.length < 2 ? null : (v[v.length - 1] - v[0]).toFixed(1); };

  const activeHistory = getHistory(activeMetric);
  const activeM = METRICS.find((m) => m.key === activeMetric);

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(500)}>
          <View style={styles.pageHeader}>
            <View>
              <Text style={styles.pageTitle}>Measurements</Text>
              <Text style={styles.pageSub}>Track your body progress</Text>
            </View>
            <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
              <Ionicons name="add" size={22} color={Colors.bg} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Metric cards */}
        <View style={styles.metricsGrid}>
          {METRICS.map((m) => {
            const latest = getLatest(m.key);
            const change = getChange(m.key);
            const changeNum = change !== null ? parseFloat(change) : null;
            return (
              <TouchableOpacity
                key={m.key}
                style={[styles.metricCard, activeMetric === m.key && { borderColor: m.color, backgroundColor: m.color + '11' }]}
                onPress={() => setActiveMetric(m.key)}
              >
                <Text style={styles.metricIcon}>{m.icon}</Text>
                <Text style={styles.metricLabel}>{m.label}</Text>
                <Text style={[styles.metricVal, { color: m.color }]}>
                  {latest !== null ? latest + m.unit : '–'}
                </Text>
                {changeNum !== null && (
                  <Text style={[styles.metricChange, { color: changeNum <= 0 ? Colors.accent : Colors.red }]}>
                    {changeNum >= 0 ? '+' : ''}{change}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Chart */}
        {activeHistory.length >= 1 && (
          <Animated.View entering={FadeInDown.duration(500).delay(200)} style={styles.chartCard}>
            <Text style={styles.chartTitle}>{activeM?.label} Progress</Text>
            <LineChart
              data={{
                labels: activeHistory.map((_, i) => '#' + (i + 1)),
                datasets: [{ data: activeHistory, color: () => activeM?.color || Colors.accent, strokeWidth: 2 }],
              }}
              width={width - Spacing.lg * 2 - Spacing.md * 2}
              height={180}
              chartConfig={{
                backgroundColor: Colors.card,
                backgroundGradientFrom: Colors.card,
                backgroundGradientTo: Colors.card,
                decimalPlaces: 1,
                color: () => activeM?.color || Colors.accent,
                labelColor: () => Colors.muted,
                propsForDots: { r: '4', strokeWidth: '2', stroke: activeM?.color },
                propsForBackgroundLines: { stroke: Colors.border },
              }}
              bezier
              style={{ borderRadius: Radius.md }}
            />
          </Animated.View>
        )}

        {/* History list */}
        {measurements.length > 0 && (
          <Animated.View entering={FadeInDown.duration(500).delay(300)}>
            <Text style={styles.sectionTitle}>History</Text>
            {[...measurements].reverse().slice(0, 10).map((m, i) => {
              const dateLabel = m.createdAt?.toMillis
                ? new Date(m.createdAt.toMillis()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                : 'Just now';
              const filled = METRICS.filter(({ key }) => m[key] !== undefined);
              return (
                <View key={m.id} style={styles.historyCard}>
                  <Text style={styles.historyDate}>{dateLabel}</Text>
                  <View style={styles.historyMetrics}>
                    {filled.map(({ key, label, unit, color }) => (
                      <View key={key} style={styles.historyChip}>
                        <Text style={[styles.historyChipVal, { color }]}>{m[key]}{unit}</Text>
                        <Text style={styles.historyChipLabel}>{label}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              );
            })}
          </Animated.View>
        )}

        {!fetching && measurements.length === 0 && (
          <View style={styles.empty}>
            <Text style={{ fontSize: 48 }}>📏</Text>
            <Text style={styles.emptyText}>No measurements yet</Text>
            <Text style={styles.emptySub}>Tap + to log your first entry</Text>
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Measurements</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled">
            {METRICS.map((m) => (
              <View key={m.key} style={styles.formRow}>
                <Text style={styles.formIcon}>{m.icon}</Text>
                <Text style={styles.formLabel}>{m.label} ({m.unit})</Text>
                <TextInput
                  style={[styles.formInput, { color: m.color }]}
                  placeholder="–"
                  placeholderTextColor={Colors.muted}
                  value={form[m.key] || ''}
                  onChangeText={(v) => setForm({ ...form, [m.key]: v })}
                  keyboardType="decimal-pad"
                />
              </View>
            ))}
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Save Measurements</Text>
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.lg, paddingTop: 60 },
  pageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.lg },
  pageTitle: { fontSize: 28, fontWeight: '800', color: Colors.text },
  pageSub: { color: Colors.muted, fontSize: 14, marginTop: 4 },
  addBtn: { width: 44, height: 44, borderRadius: Radius.full, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  metricCard: { width: '47%', backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  metricIcon: { fontSize: 24, marginBottom: 4 },
  metricLabel: { color: Colors.muted, fontSize: 12, fontWeight: '600' },
  metricVal: { fontSize: 20, fontWeight: '800', marginTop: 2 },
  metricChange: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  chartCard: { backgroundColor: Colors.card, borderRadius: Radius.xl, padding: Spacing.md, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  chartTitle: { color: Colors.text, fontSize: 16, fontWeight: '700', marginBottom: Spacing.md },
  sectionTitle: { color: Colors.text, fontSize: 16, fontWeight: '700', marginBottom: Spacing.md },
  historyCard: { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  historyDate: { color: Colors.muted, fontSize: 12, fontWeight: '600', marginBottom: Spacing.sm },
  historyMetrics: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  historyChip: { backgroundColor: Colors.surface, borderRadius: Radius.sm, paddingHorizontal: Spacing.sm, paddingVertical: 4, alignItems: 'center' },
  historyChipVal: { fontSize: 13, fontWeight: '800' },
  historyChipLabel: { color: Colors.muted, fontSize: 10, marginTop: 1 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { color: Colors.text, fontSize: 18, fontWeight: '700', marginTop: 12 },
  emptySub: { color: Colors.muted, fontSize: 14, marginTop: 4 },
  modal: { flex: 1, backgroundColor: Colors.bg, padding: Spacing.lg, paddingTop: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  modalTitle: { fontSize: 22, fontWeight: '800', color: Colors.text },
  formRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  formIcon: { fontSize: 20, marginRight: Spacing.sm },
  formLabel: { flex: 1, color: Colors.text, fontSize: 15 },
  formInput: { fontWeight: '700', fontSize: 16, textAlign: 'right', minWidth: 60 },
  saveBtn: { backgroundColor: Colors.accent, borderRadius: Radius.lg, height: 54, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.lg },
  saveBtnText: { color: Colors.bg, fontWeight: '800', fontSize: 16 },
});
