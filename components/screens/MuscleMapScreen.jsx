import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import Svg, { Path, G, Ellipse, Circle } from 'react-native-svg';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { MUSCLE_EXERCISES } from '../../constants/exercises';
import { Colors, Spacing, Radius } from '../../constants/theme';

const { width } = Dimensions.get('window');
const SVG_W = width - Spacing.lg * 2 - Spacing.md * 2;
const SVG_H = SVG_W * 2.1;

const BASE = '#1a2133';
const STROKE = '#2a3550';

// ─── Front Body SVG ──────────────────────────────────────────────────────────
function FrontBody({ selected, onSelect }) {
  const c = (key) => {
    const m = MUSCLE_EXERCISES[key];
    const isSelected = selected === key;
    return {
      fill: isSelected ? m?.color : m?.color + '44',
      stroke: isSelected ? m?.color : m?.color + '88',
      strokeWidth: isSelected ? 2.5 : 1.2,
      opacity: isSelected ? 1 : 0.85,
    };
  };

  return (
    <Svg width={SVG_W} height={SVG_H} viewBox="0 0 200 420">

      {/* ── Head ── */}
      <Ellipse cx="100" cy="22" rx="17" ry="20" fill={BASE} stroke={STROKE} strokeWidth="1.2" />
      {/* neck */}
      <Path d="M91 40 L91 52 Q100 56 109 52 L109 40 Q100 44 91 40Z" fill={BASE} stroke={STROKE} strokeWidth="1" />

      {/* ── Torso base ── */}
      <Path d="M68 52 Q58 56 50 65 L44 100 L44 190 Q60 198 100 200 Q140 198 156 190 L156 100 L150 65 Q142 56 132 52 Q116 48 100 48 Q84 48 68 52Z" fill={BASE} stroke={STROKE} strokeWidth="1.2" />

      {/* ── Chest (pecs) ── */}
      <Path d="M70 60 Q62 66 58 80 Q60 100 70 106 Q82 112 98 110 Q100 110 100 110 L100 68 Q86 62 70 60Z"
        {...c('chest')} onPress={() => onSelect('chest')} />
      <Path d="M130 60 Q138 66 142 80 Q140 100 130 106 Q118 112 102 110 Q100 110 100 110 L100 68 Q114 62 130 60Z"
        {...c('chest')} onPress={() => onSelect('chest')} />
      {/* chest line */}
      <Path d="M100 68 L100 110" stroke={selected === 'chest' ? MUSCLE_EXERCISES.chest.color : STROKE} strokeWidth="1" fill="none" />

      {/* ── Shoulders (front delts) ── */}
      <Path d="M50 65 Q42 70 38 84 Q40 96 48 100 Q54 102 60 96 Q66 88 66 76 Q62 64 50 65Z"
        {...c('shoulders')} onPress={() => onSelect('shoulders')} />
      <Path d="M150 65 Q158 70 162 84 Q160 96 152 100 Q146 102 140 96 Q134 88 134 76 Q138 64 150 65Z"
        {...c('shoulders')} onPress={() => onSelect('shoulders')} />

      {/* ── Biceps ── */}
      <Path d="M40 102 Q34 112 34 126 Q36 140 44 144 Q50 146 56 140 Q62 132 60 118 Q58 104 50 100 Q44 100 40 102Z"
        {...c('biceps')} onPress={() => onSelect('biceps')} />
      <Path d="M160 102 Q166 112 166 126 Q164 140 156 144 Q150 146 144 140 Q138 132 140 118 Q142 104 150 100 Q156 100 160 102Z"
        {...c('biceps')} onPress={() => onSelect('biceps')} />

      {/* ── Forearms ── */}
      <Path d="M36 146 Q30 158 32 172 Q34 182 40 184 Q48 186 52 178 Q56 168 54 154 Q52 144 46 142 Q40 142 36 146Z"
        fill={BASE} stroke={STROKE} strokeWidth="1" />
      <Path d="M164 146 Q170 158 168 172 Q166 182 160 184 Q152 186 148 178 Q144 168 146 154 Q148 144 154 142 Q160 142 164 146Z"
        fill={BASE} stroke={STROKE} strokeWidth="1" />

      {/* ── Hands ── */}
      <Ellipse cx="38" cy="192" rx="9" ry="12" fill={BASE} stroke={STROKE} strokeWidth="1" />
      <Ellipse cx="162" cy="192" rx="9" ry="12" fill={BASE} stroke={STROKE} strokeWidth="1" />

      {/* ── Abs ── */}
      {/* abs outline */}
      <Path d="M80 114 Q76 118 76 198 Q88 202 100 202 Q112 202 124 198 Q124 118 120 114 Q110 110 100 110 Q90 110 80 114Z"
        fill={BASE} stroke={STROKE} strokeWidth="1" />
      {/* abs blocks - 3 rows x 2 cols */}
      <Path d="M82 116 Q82 132 88 134 Q94 136 98 134 Q100 133 100 116 Q92 112 82 116Z" {...c('abs')} onPress={() => onSelect('abs')} />
      <Path d="M118 116 Q118 132 112 134 Q106 136 102 134 Q100 133 100 116 Q108 112 118 116Z" {...c('abs')} onPress={() => onSelect('abs')} />
      <Path d="M82 136 Q82 152 88 154 Q94 156 98 154 L100 136 Q92 134 82 136Z" {...c('abs')} onPress={() => onSelect('abs')} />
      <Path d="M118 136 Q118 152 112 154 Q106 156 102 154 L100 136 Q108 134 118 136Z" {...c('abs')} onPress={() => onSelect('abs')} />
      <Path d="M82 156 Q82 172 88 174 Q94 176 98 174 L100 156 Q92 154 82 156Z" {...c('abs')} onPress={() => onSelect('abs')} />
      <Path d="M118 156 Q118 172 112 174 Q106 176 102 174 L100 156 Q108 154 118 156Z" {...c('abs')} onPress={() => onSelect('abs')} />
      {/* lower abs / v-taper */}
      <Path d="M82 176 Q80 192 88 198 Q94 202 100 202 L100 176 Q92 174 82 176Z" {...c('abs')} onPress={() => onSelect('abs')} />
      <Path d="M118 176 Q120 192 112 198 Q106 202 100 202 L100 176 Q108 174 118 176Z" {...c('abs')} onPress={() => onSelect('abs')} />

      {/* ── Hip / pelvis ── */}
      <Path d="M76 198 Q60 202 58 212 Q62 222 100 224 Q138 222 142 212 Q140 202 124 198 Q112 202 100 202 Q88 202 76 198Z"
        fill={BASE} stroke={STROKE} strokeWidth="1" />

      {/* ── Quads ── */}
      <Path d="M60 222 Q52 232 50 260 Q52 286 60 300 Q68 310 78 308 Q88 304 90 288 Q92 268 88 244 Q84 226 76 220 Q68 218 60 222Z"
        {...c('quads')} onPress={() => onSelect('quads')} />
      <Path d="M140 222 Q148 232 150 260 Q148 286 140 300 Q132 310 122 308 Q112 304 110 288 Q108 268 112 244 Q116 226 124 220 Q132 218 140 222Z"
        {...c('quads')} onPress={() => onSelect('quads')} />
      {/* quad separation line */}
      <Path d="M74 226 Q78 264 80 300" stroke={selected==='quads' ? MUSCLE_EXERCISES.quads.color+'88' : STROKE} strokeWidth="0.8" fill="none"/>
      <Path d="M126 226 Q122 264 120 300" stroke={selected==='quads' ? MUSCLE_EXERCISES.quads.color+'88' : STROKE} strokeWidth="0.8" fill="none"/>

      {/* ── Knees ── */}
      <Ellipse cx="72" cy="312" rx="14" ry="10" fill={BASE} stroke={STROKE} strokeWidth="1" />
      <Ellipse cx="128" cy="312" rx="14" ry="10" fill={BASE} stroke={STROKE} strokeWidth="1" />

      {/* ── Calves (front shin) ── */}
      <Path d="M60 322 Q56 338 58 358 Q62 372 70 374 Q78 374 82 364 Q86 350 84 332 Q82 320 74 318 Q66 318 60 322Z"
        {...c('calves')} onPress={() => onSelect('calves')} />
      <Path d="M140 322 Q144 338 142 358 Q138 372 130 374 Q122 374 118 364 Q114 350 116 332 Q118 320 126 318 Q134 318 140 322Z"
        {...c('calves')} onPress={() => onSelect('calves')} />

      {/* ── Feet ── */}
      <Path d="M58 374 Q52 382 54 388 Q60 392 74 390 Q80 386 80 380 L80 374Z" fill={BASE} stroke={STROKE} strokeWidth="1" />
      <Path d="M142 374 Q148 382 146 388 Q140 392 126 390 Q120 386 120 380 L120 374Z" fill={BASE} stroke={STROKE} strokeWidth="1" />
    </Svg>
  );
}

// ─── Back Body SVG ───────────────────────────────────────────────────────────
function BackBody({ selected, onSelect }) {
  const c = (key) => {
    const m = MUSCLE_EXERCISES[key];
    const isSelected = selected === key;
    return {
      fill: isSelected ? m?.color : m?.color + '44',
      stroke: isSelected ? m?.color : m?.color + '88',
      strokeWidth: isSelected ? 2.5 : 1.2,
      opacity: isSelected ? 1 : 0.85,
    };
  };

  return (
    <Svg width={SVG_W} height={SVG_H} viewBox="0 0 200 420">

      {/* ── Head ── */}
      <Ellipse cx="100" cy="22" rx="17" ry="20" fill={BASE} stroke={STROKE} strokeWidth="1.2" />
      <Path d="M91 40 L91 52 Q100 56 109 52 L109 40 Q100 44 91 40Z" fill={BASE} stroke={STROKE} strokeWidth="1" />

      {/* ── Torso base ── */}
      <Path d="M68 52 Q58 56 50 65 L44 100 L44 190 Q60 198 100 200 Q140 198 156 190 L156 100 L150 65 Q142 56 132 52 Q116 48 100 48 Q84 48 68 52Z" fill={BASE} stroke={STROKE} strokeWidth="1.2" />

      {/* ── Rear Shoulders ── */}
      <Path d="M50 65 Q42 70 38 84 Q40 96 48 100 Q54 102 60 96 Q66 88 66 76 Q62 64 50 65Z"
        {...c('shoulders')} onPress={() => onSelect('shoulders')} />
      <Path d="M150 65 Q158 70 162 84 Q160 96 152 100 Q146 102 140 96 Q134 88 134 76 Q138 64 150 65Z"
        {...c('shoulders')} onPress={() => onSelect('shoulders')} />

      {/* ── Traps ── */}
      <Path d="M91 52 Q80 54 70 60 Q76 70 100 72 Q124 70 130 60 Q120 54 109 52 Q100 50 91 52Z"
        fill={MUSCLE_EXERCISES.back?.color+'44'} stroke={MUSCLE_EXERCISES.back?.color+'88'} strokeWidth="1.2"
        onPress={() => onSelect('back')} />

      {/* ── Lats / Back ── */}
      <Path d="M50 68 Q44 80 44 110 Q48 140 58 158 Q70 168 84 166 Q92 164 96 156 L96 80 Q72 68 50 68Z"
        {...c('back')} onPress={() => onSelect('back')} />
      <Path d="M150 68 Q156 80 156 110 Q152 140 142 158 Q130 168 116 166 Q108 164 104 156 L104 80 Q128 68 150 68Z"
        {...c('back')} onPress={() => onSelect('back')} />
      {/* spine line */}
      <Path d="M100 56 L100 196" stroke={STROKE} strokeWidth="1.2" fill="none" />
      {/* back detail lines */}
      <Path d="M96 80 Q98 120 96 156" stroke={selected==='back' ? MUSCLE_EXERCISES.back.color+'66':STROKE} strokeWidth="0.8" fill="none"/>
      <Path d="M104 80 Q102 120 104 156" stroke={selected==='back' ? MUSCLE_EXERCISES.back.color+'66':STROKE} strokeWidth="0.8" fill="none"/>

      {/* ── Lower back ── */}
      <Path d="M84 166 Q76 178 78 194 Q88 200 100 200 Q112 200 122 194 Q124 178 116 166 Q108 164 100 164 Q92 164 84 166Z"
        {...c('back')} onPress={() => onSelect('back')} />

      {/* ── Triceps ── */}
      <Path d="M40 102 Q34 112 34 126 Q36 140 44 144 Q50 146 56 140 Q62 132 60 118 Q58 104 50 100 Q44 100 40 102Z"
        {...c('triceps')} onPress={() => onSelect('triceps')} />
      <Path d="M160 102 Q166 112 166 126 Q164 140 156 144 Q150 146 144 140 Q138 132 140 118 Q142 104 150 100 Q156 100 160 102Z"
        {...c('triceps')} onPress={() => onSelect('triceps')} />

      {/* ── Forearms ── */}
      <Path d="M36 146 Q30 158 32 172 Q34 182 40 184 Q48 186 52 178 Q56 168 54 154 Q52 144 46 142 Q40 142 36 146Z"
        fill={BASE} stroke={STROKE} strokeWidth="1" />
      <Path d="M164 146 Q170 158 168 172 Q166 182 160 184 Q152 186 148 178 Q144 168 146 154 Q148 144 154 142 Q160 142 164 146Z"
        fill={BASE} stroke={STROKE} strokeWidth="1" />

      {/* ── Hands ── */}
      <Ellipse cx="38" cy="192" rx="9" ry="12" fill={BASE} stroke={STROKE} strokeWidth="1" />
      <Ellipse cx="162" cy="192" rx="9" ry="12" fill={BASE} stroke={STROKE} strokeWidth="1" />

      {/* ── Glutes ── */}
      <Path d="M58 200 Q50 208 50 224 Q54 238 66 242 Q78 244 86 234 Q92 224 90 210 Q86 200 78 198 Q68 196 58 200Z"
        {...c('glutes')} onPress={() => onSelect('glutes')} />
      <Path d="M142 200 Q150 208 150 224 Q146 238 134 242 Q122 244 114 234 Q108 224 110 210 Q114 200 122 198 Q132 196 142 200Z"
        {...c('glutes')} onPress={() => onSelect('glutes')} />
      {/* glute line */}
      <Path d="M100 200 L100 244" stroke={STROKE} strokeWidth="1" fill="none"/>

      {/* ── Hamstrings ── */}
      <Path d="M52 244 Q46 260 48 284 Q52 306 62 312 Q72 316 80 308 Q88 298 88 274 Q88 252 84 242 Q76 238 68 240 Q58 242 52 244Z"
        {...c('hamstrings')} onPress={() => onSelect('hamstrings')} />
      <Path d="M148 244 Q154 260 152 284 Q148 306 138 312 Q128 316 120 308 Q112 298 112 274 Q112 252 116 242 Q124 238 132 240 Q142 242 148 244Z"
        {...c('hamstrings')} onPress={() => onSelect('hamstrings')} />

      {/* ── Knees ── */}
      <Ellipse cx="72" cy="316" rx="14" ry="10" fill={BASE} stroke={STROKE} strokeWidth="1" />
      <Ellipse cx="128" cy="316" rx="14" ry="10" fill={BASE} stroke={STROKE} strokeWidth="1" />

      {/* ── Calves (back) ── */}
      <Path d="M58 326 Q52 346 56 364 Q62 376 72 376 Q82 374 84 362 Q86 346 82 330 Q78 320 70 320 Q62 320 58 326Z"
        {...c('calves')} onPress={() => onSelect('calves')} />
      <Path d="M142 326 Q148 346 144 364 Q138 376 128 376 Q118 374 116 362 Q114 346 118 330 Q122 320 130 320 Q138 320 142 326Z"
        {...c('calves')} onPress={() => onSelect('calves')} />
      {/* calf separation */}
      <Path d="M68 326 Q70 350 70 370" stroke={selected==='calves'?MUSCLE_EXERCISES.calves.color+'88':STROKE} strokeWidth="0.8" fill="none"/>
      <Path d="M132 326 Q130 350 130 370" stroke={selected==='calves'?MUSCLE_EXERCISES.calves.color+'88':STROKE} strokeWidth="0.8" fill="none"/>

      {/* ── Feet ── */}
      <Path d="M56 376 Q50 384 52 390 Q58 394 72 392 Q80 388 80 382 L80 376Z" fill={BASE} stroke={STROKE} strokeWidth="1" />
      <Path d="M144 376 Q150 384 148 390 Q142 394 128 392 Q120 388 120 382 L120 376Z" fill={BASE} stroke={STROKE} strokeWidth="1" />
    </Svg>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function MuscleMapScreen() {
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState('front');

  const frontKeys = ['chest', 'shoulders', 'biceps', 'abs', 'quads', 'calves'];
  const backKeys  = ['shoulders', 'back', 'triceps', 'glutes', 'hamstrings', 'calves'];
  const uniqueKeys = view === 'front' ? frontKeys : backKeys;
  const selectedData = selected ? MUSCLE_EXERCISES[selected] : null;

  const handleSelect = (key) => setSelected(selected === key ? null : key);

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(500)}>
          <Text style={styles.pageTitle}>Muscle Map</Text>
          <Text style={styles.pageSub}>Tap a muscle to see exercises</Text>
        </Animated.View>

        {/* Front / Back toggle */}
        <View style={styles.toggle}>
          {['front', 'back'].map((v) => (
            <TouchableOpacity
              key={v}
              style={[styles.toggleBtn, view === v && styles.toggleBtnActive]}
              onPress={() => { setView(v); setSelected(null); }}
            >
              <Text style={[styles.toggleText, view === v && styles.toggleTextActive]}>
                {v === 'front' ? '🫀 Front' : '🔙 Back'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* SVG body */}
        <View style={styles.svgWrap}>
          {view === 'front'
            ? <FrontBody selected={selected} onSelect={handleSelect} />
            : <BackBody  selected={selected} onSelect={handleSelect} />
          }
        </View>

        {/* Muscle chips */}
        <View style={styles.chipsRow}>
          {uniqueKeys.map((key) => {
            const m = MUSCLE_EXERCISES[key];
            const isSelected = selected === key;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.chip, isSelected && { backgroundColor: m?.color + '33', borderColor: m?.color }]}
                onPress={() => handleSelect(key)}
              >
                <View style={[styles.chipDot, { backgroundColor: m?.color }]} />
                <Text style={[styles.chipText, isSelected && { color: m?.color }]}>{m?.label || key}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Exercise panel */}
        {selectedData && (
          <Animated.View entering={FadeIn.duration(400)} style={[styles.exercisePanel, { borderColor: selectedData.color + '40' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm }}>
              <View style={[styles.muscleDot, { backgroundColor: selectedData.color }]} />
              <Text style={[styles.muscleTitle, { color: selectedData.color }]}>{selectedData.label}</Text>
              <Text style={styles.exerciseCount}>{selectedData.exercises.length} exercises</Text>
            </View>
            <Text style={styles.exerciseSub}>Recommended exercises:</Text>
            {selectedData.exercises.map((ex, i) => (
              <Animated.View key={ex} entering={FadeInDown.duration(300).delay(i * 40)} style={styles.exRow}>
                <View style={[styles.exNum, { backgroundColor: selectedData.color + '22' }]}>
                  <Text style={[styles.exNumText, { color: selectedData.color }]}>{i + 1}</Text>
                </View>
                <Text style={styles.exName}>{ex}</Text>
                <Ionicons name="barbell-outline" size={16} color={Colors.muted} />
              </Animated.View>
            ))}
          </Animated.View>
        )}

        {!selected && (
          <View style={styles.hint}>
            <Text style={styles.hintText}>👆 Tap a muscle on the diagram or use the chips above</Text>
          </View>
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
  pageSub: { color: Colors.muted, fontSize: 14, marginBottom: Spacing.lg, marginTop: 4 },
  toggle: { flexDirection: 'row', backgroundColor: Colors.card, borderRadius: Radius.full, padding: 4, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: Radius.full, alignItems: 'center' },
  toggleBtnActive: { backgroundColor: Colors.accent },
  toggleText: { color: Colors.muted, fontWeight: '600', fontSize: 14 },
  toggleTextActive: { color: Colors.bg, fontWeight: '700' },
  svgWrap: { alignItems: 'center', backgroundColor: Colors.card, borderRadius: Radius.xl, padding: Spacing.md, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: Radius.full, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.card },
  chipDot: { width: 8, height: 8, borderRadius: 4 },
  chipText: { color: Colors.muted, fontWeight: '600', fontSize: 13 },
  exercisePanel: { backgroundColor: Colors.card, borderRadius: Radius.xl, padding: Spacing.lg, borderWidth: 1, marginBottom: Spacing.lg },
  muscleDot: { width: 12, height: 12, borderRadius: 6 },
  muscleTitle: { fontSize: 20, fontWeight: '800', flex: 1 },
  exerciseCount: { color: Colors.muted, fontSize: 12, fontWeight: '600' },
  exerciseSub: { color: Colors.muted, fontSize: 13, marginBottom: Spacing.md },
  exRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderColor: Colors.border, gap: Spacing.md },
  exNum: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  exNumText: { fontWeight: '700', fontSize: 13 },
  exName: { flex: 1, color: Colors.text, fontSize: 15 },
  hint: { alignItems: 'center', paddingVertical: Spacing.xl },
  hintText: { color: Colors.muted, fontSize: 14, textAlign: 'center' },
});
