import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Dimensions, StatusBar,
} from 'react-native';
import Svg, { Path, Ellipse } from 'react-native-svg';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { MUSCLE_EXERCISES } from '../../constants/exercises';
import { useTheme } from '../../hooks/ThemeContext';

const { width: SW, height: SH } = Dimensions.get('window');

// Body SVG takes upper ~55% of screen, panel takes rest
const BODY_AREA_H = SH * 0.54;
const SVG_H       = BODY_AREA_H - 80; // minus toggle + padding
const SVG_W       = SVG_H / 2.2;      // keep natural body proportions

const BASE   = '#1a2133';
const STROKE = '#2a3550';

// ── Front Body ───────────────────────────────────────────────────────────────
function FrontBody({ selected, onSelect }) {
  const s = (key) => {
    const m = MUSCLE_EXERCISES[key];
    const active = selected === key;
    return {
      fill:        active ? m?.color        : m?.color + '55',
      stroke:      active ? m?.color        : m?.color + '99',
      strokeWidth: active ? 2              : 1,
      opacity:     active ? 1              : 0.9,
    };
  };
  const p = (key) => ({ onPress: () => onSelect(key) });

  return (
    <Svg width={SVG_W} height={SVG_H} viewBox="0 0 120 280">

      {/* HEAD */}
      <Ellipse cx="60" cy="14" rx="11" ry="13" fill={BASE} stroke={STROKE} strokeWidth="1" />
      {/* neck */}
      <Path d="M54 26 L54 34 Q60 37 66 34 L66 26 Q60 29 54 26Z" fill={BASE} stroke={STROKE} strokeWidth="0.8" />

      {/* TORSO */}
      <Path d="M36 34 Q28 38 24 46 L22 70 L22 130 Q38 136 60 137 Q82 136 98 130 L98 70 L96 46 Q92 38 84 34 Q72 31 60 31 Q48 31 36 34Z"
        fill={BASE} stroke={STROKE} strokeWidth="1" />

      {/* SHOULDERS */}
      <Path d="M24 46 Q16 50 14 62 Q15 72 22 76 Q28 78 33 73 Q38 66 37 56 Q34 46 24 46Z"
        {...s('shoulders')} {...p('shoulders')} />
      <Path d="M96 46 Q104 50 106 62 Q105 72 98 76 Q92 78 87 73 Q82 66 83 56 Q86 46 96 46Z"
        {...s('shoulders')} {...p('shoulders')} />

      {/* CHEST — two pecs */}
      <Path d="M37 46 Q30 52 29 66 Q30 78 37 82 Q45 86 56 84 Q60 83 60 70 L60 46 Q50 43 37 46Z"
        {...s('chest')} {...p('chest')} />
      <Path d="M83 46 Q90 52 91 66 Q90 78 83 82 Q75 86 64 84 Q60 83 60 70 L60 46 Q70 43 83 46Z"
        {...s('chest')} {...p('chest')} />
      {/* sternum line */}
      <Path d="M60 46 L60 84" stroke={selected==='chest' ? MUSCLE_EXERCISES.chest?.color+'88' : STROKE} strokeWidth="0.7" fill="none" />

      {/* BICEPS */}
      <Path d="M16 78 Q11 86 11 97 Q12 108 18 112 Q23 114 27 109 Q32 102 31 91 Q30 80 24 77 Q19 76 16 78Z"
        {...s('biceps')} {...p('biceps')} />
      <Path d="M104 78 Q109 86 109 97 Q108 108 102 112 Q97 114 93 109 Q88 102 89 91 Q90 80 96 77 Q101 76 104 78Z"
        {...s('biceps')} {...p('biceps')} />

      {/* FOREARMS */}
      <Path d="M12 114 Q8 124 10 134 Q12 140 17 142 Q23 143 26 137 Q29 129 28 119 Q26 112 21 111 Q15 111 12 114Z"
        fill={BASE} stroke={STROKE} strokeWidth="0.8" />
      <Path d="M108 114 Q112 124 110 134 Q108 140 103 142 Q97 143 94 137 Q91 129 92 119 Q94 112 99 111 Q105 111 108 114Z"
        fill={BASE} stroke={STROKE} strokeWidth="0.8" />

      {/* HANDS */}
      <Ellipse cx="15" cy="149" rx="6" ry="8" fill={BASE} stroke={STROKE} strokeWidth="0.8" />
      <Ellipse cx="105" cy="149" rx="6" ry="8" fill={BASE} stroke={STROKE} strokeWidth="0.8" />

      {/* ABS — 6 pack */}
      <Path d="M42 86 Q40 90 40 137 Q50 141 60 141 Q70 141 80 137 Q80 90 78 86 Q70 83 60 83 Q50 83 42 86Z"
        fill={BASE} stroke={STROKE} strokeWidth="0.8" />
      {[0,1,2].map(row => (
        [0,1].map(col => {
          const x1 = col===0 ? 42 : 60;
          const x2 = col===0 ? 60 : 78;
          const y1 = 86 + row*18;
          const y2 = y1 + 16;
          const mx = col===0 ? 'Q44' : 'Q76';
          return (
            <Path key={`${row}-${col}`}
              d={`M${x1} ${y1} ${mx} ${y1+2} ${x2} ${y1} L${x2} ${y2} ${mx} ${y2+2} ${x1} ${y2}Z`}
              {...s('abs')} {...p('abs')} />
          );
        })
      ))}
      {/* lower abs */}
      <Path d="M42 140 Q40 148 44 153 Q52 158 60 158 L60 140Z" {...s('abs')} {...p('abs')} />
      <Path d="M78 140 Q80 148 76 153 Q68 158 60 158 L60 140Z" {...s('abs')} {...p('abs')} />

      {/* HIP */}
      <Path d="M40 152 Q34 156 33 163 Q36 170 60 172 Q84 170 87 163 Q86 156 80 152 Q70 156 60 157 Q50 156 40 152Z"
        fill={BASE} stroke={STROKE} strokeWidth="0.8" />

      {/* QUADS */}
      <Path d="M33 168 Q27 178 27 198 Q29 216 35 224 Q41 230 48 228 Q55 224 56 210 Q57 194 54 178 Q50 168 44 166 Q38 165 33 168Z"
        {...s('quads')} {...p('quads')} />
      <Path d="M87 168 Q93 178 93 198 Q91 216 85 224 Q79 230 72 228 Q65 224 64 210 Q63 194 66 178 Q70 168 76 166 Q82 165 87 168Z"
        {...s('quads')} {...p('quads')} />

      {/* KNEES */}
      <Ellipse cx="44" cy="230" rx="9" ry="7" fill={BASE} stroke={STROKE} strokeWidth="0.8" />
      <Ellipse cx="76" cy="230" rx="9" ry="7" fill={BASE} stroke={STROKE} strokeWidth="0.8" />

      {/* CALVES */}
      <Path d="M36 237 Q32 250 34 262 Q37 270 43 271 Q50 271 52 263 Q54 252 52 241 Q50 234 45 232 Q39 232 36 237Z"
        {...s('calves')} {...p('calves')} />
      <Path d="M84 237 Q88 250 86 262 Q83 270 77 271 Q70 271 68 263 Q66 252 68 241 Q70 234 75 232 Q81 232 84 237Z"
        {...s('calves')} {...p('calves')} />

      {/* FEET */}
      <Path d="M34 271 Q30 277 31 281 Q36 284 46 283 Q51 280 51 276 L51 271Z" fill={BASE} stroke={STROKE} strokeWidth="0.8" />
      <Path d="M86 271 Q90 277 89 281 Q84 284 74 283 Q69 280 69 276 L69 271Z" fill={BASE} stroke={STROKE} strokeWidth="0.8" />
    </Svg>
  );
}

// ── Back Body ────────────────────────────────────────────────────────────────
function BackBody({ selected, onSelect }) {
  const s = (key) => {
    const m = MUSCLE_EXERCISES[key];
    const active = selected === key;
    return {
      fill:        active ? m?.color        : m?.color + '55',
      stroke:      active ? m?.color        : m?.color + '99',
      strokeWidth: active ? 2              : 1,
      opacity:     active ? 1              : 0.9,
    };
  };
  const p = (key) => ({ onPress: () => onSelect(key) });

  return (
    <Svg width={SVG_W} height={SVG_H} viewBox="0 0 120 280">

      {/* HEAD */}
      <Ellipse cx="60" cy="14" rx="11" ry="13" fill={BASE} stroke={STROKE} strokeWidth="1" />
      <Path d="M54 26 L54 34 Q60 37 66 34 L66 26 Q60 29 54 26Z" fill={BASE} stroke={STROKE} strokeWidth="0.8" />

      {/* TORSO */}
      <Path d="M36 34 Q28 38 24 46 L22 70 L22 130 Q38 136 60 137 Q82 136 98 130 L98 70 L96 46 Q92 38 84 34 Q72 31 60 31 Q48 31 36 34Z"
        fill={BASE} stroke={STROKE} strokeWidth="1" />

      {/* REAR SHOULDERS */}
      <Path d="M24 46 Q16 50 14 62 Q15 72 22 76 Q28 78 33 73 Q38 66 37 56 Q34 46 24 46Z"
        {...s('shoulders')} {...p('shoulders')} />
      <Path d="M96 46 Q104 50 106 62 Q105 72 98 76 Q92 78 87 73 Q82 66 83 56 Q86 46 96 46Z"
        {...s('shoulders')} {...p('shoulders')} />

      {/* TRAPS */}
      <Path d="M54 34 Q44 36 37 44 Q44 52 60 54 Q76 52 83 44 Q76 36 66 34 Q60 32 54 34Z"
        fill={MUSCLE_EXERCISES.back?.color+'55'} stroke={MUSCLE_EXERCISES.back?.color+'99'} strokeWidth="1"
        {...p('back')} />

      {/* LATS */}
      <Path d="M24 50 Q22 64 22 88 Q24 108 30 120 Q38 130 48 128 Q56 126 58 118 L58 56 Q42 48 24 50Z"
        {...s('back')} {...p('back')} />
      <Path d="M96 50 Q98 64 98 88 Q96 108 90 120 Q82 130 72 128 Q64 126 62 118 L62 56 Q78 48 96 50Z"
        {...s('back')} {...p('back')} />
      {/* spine */}
      <Path d="M60 38 L60 132" stroke={STROKE} strokeWidth="1" fill="none" />

      {/* LOWER BACK */}
      <Path d="M48 128 Q42 136 44 148 Q52 154 60 154 Q68 154 76 148 Q78 136 72 128 Q66 126 60 126 Q54 126 48 128Z"
        {...s('back')} {...p('back')} />

      {/* TRICEPS */}
      <Path d="M16 78 Q11 86 11 97 Q12 108 18 112 Q23 114 27 109 Q32 102 31 91 Q30 80 24 77 Q19 76 16 78Z"
        {...s('triceps')} {...p('triceps')} />
      <Path d="M104 78 Q109 86 109 97 Q108 108 102 112 Q97 114 93 109 Q88 102 89 91 Q90 80 96 77 Q101 76 104 78Z"
        {...s('triceps')} {...p('triceps')} />

      {/* FOREARMS */}
      <Path d="M12 114 Q8 124 10 134 Q12 140 17 142 Q23 143 26 137 Q29 129 28 119 Q26 112 21 111 Q15 111 12 114Z"
        fill={BASE} stroke={STROKE} strokeWidth="0.8" />
      <Path d="M108 114 Q112 124 110 134 Q108 140 103 142 Q97 143 94 137 Q91 129 92 119 Q94 112 99 111 Q105 111 108 114Z"
        fill={BASE} stroke={STROKE} strokeWidth="0.8" />

      {/* HANDS */}
      <Ellipse cx="15" cy="149" rx="6" ry="8" fill={BASE} stroke={STROKE} strokeWidth="0.8" />
      <Ellipse cx="105" cy="149" rx="6" ry="8" fill={BASE} stroke={STROKE} strokeWidth="0.8" />

      {/* GLUTES */}
      <Path d="M32 156 Q26 164 27 178 Q31 190 41 193 Q51 194 56 184 Q60 174 58 162 Q54 154 46 152 Q38 151 32 156Z"
        {...s('glutes')} {...p('glutes')} />
      <Path d="M88 156 Q94 164 93 178 Q89 190 79 193 Q69 194 64 184 Q60 174 62 162 Q66 154 74 152 Q82 151 88 156Z"
        {...s('glutes')} {...p('glutes')} />
      <Path d="M60 154 L60 194" stroke={STROKE} strokeWidth="0.8" fill="none" />

      {/* HAMSTRINGS */}
      <Path d="M28 192 Q24 206 25 222 Q28 236 36 240 Q44 242 50 234 Q55 224 54 208 Q52 196 46 192 Q38 190 28 192Z"
        {...s('hamstrings')} {...p('hamstrings')} />
      <Path d="M92 192 Q96 206 95 222 Q92 236 84 240 Q76 242 70 234 Q65 224 66 208 Q68 196 74 192 Q82 190 92 192Z"
        {...s('hamstrings')} {...p('hamstrings')} />

      {/* KNEES */}
      <Ellipse cx="44" cy="244" rx="9" ry="7" fill={BASE} stroke={STROKE} strokeWidth="0.8" />
      <Ellipse cx="76" cy="244" rx="9" ry="7" fill={BASE} stroke={STROKE} strokeWidth="0.8" />

      {/* CALVES (back) */}
      <Path d="M35 251 Q31 264 33 276 Q37 284 43 285 Q50 285 52 277 Q54 265 52 253 Q50 246 45 244 Q38 244 35 251Z"
        {...s('calves')} {...p('calves')} />
      <Path d="M85 251 Q89 264 87 276 Q83 284 77 285 Q70 285 68 277 Q66 265 68 253 Q70 246 75 244 Q82 244 85 251Z"
        {...s('calves')} {...p('calves')} />

      {/* FEET */}
      <Path d="M33 285 Q29 291 30 295 Q35 298 45 297 Q50 294 50 290 L50 285Z" fill={BASE} stroke={STROKE} strokeWidth="0.8" />
      <Path d="M87 285 Q91 291 90 295 Q85 298 75 297 Q70 294 70 290 L70 285Z" fill={BASE} stroke={STROKE} strokeWidth="0.8" />
    </Svg>
  );
}

// ── Main Screen ──────────────────────────────────────────────────────────────
export default function MuscleMapScreen() {
  const { scheme: C, font: F } = useTheme();
  const ff = {
    display:  { fontFamily: F.display },
    heading:  { fontFamily: F.heading },
    body:     { fontFamily: F.body },
  };

  const [selected, setSelected] = useState(null);
  const [view,     setView]     = useState('front');

  const frontKeys = ['chest','shoulders','biceps','abs','quads','calves'];
  const backKeys  = ['shoulders','back','triceps','glutes','hamstrings','calves'];
  const muscleKeys = view === 'front' ? frontKeys : backKeys;
  const selectedData = selected ? MUSCLE_EXERCISES[selected] : null;

  const handleSelect = (key) => setSelected(prev => prev === key ? null : key);
  const switchView   = (v) => { setView(v); setSelected(null); };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>

      {/* ── TOP HALF — fixed body diagram ── */}
      <View style={{ height: BODY_AREA_H, paddingTop: 52, paddingHorizontal: 20 }}>

        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <View>
            <Text style={[{ fontSize: 22, color: C.text, letterSpacing: -0.3 }, ff.display]}>
              Muscle Map
            </Text>
            <Text style={[{ fontSize: 12, color: C.textSub }, ff.body]}>
              Tap a muscle to see exercises
            </Text>
          </View>

          {/* Front / Back pill toggle */}
          <View style={{
            flexDirection: 'row',
            backgroundColor: C.surface,
            borderRadius: 20, padding: 3,
            borderWidth: 1, borderColor: C.border,
          }}>
            {['front','back'].map(v => (
              <TouchableOpacity
                key={v}
                onPress={() => switchView(v)}
                style={{
                  paddingHorizontal: 14, paddingVertical: 7,
                  borderRadius: 17,
                  backgroundColor: view === v ? C.accent : 'transparent',
                }}
              >
                <Text style={[{
                  fontSize: 12,
                  color: view === v ? C.bg : C.textSub,
                }, ff.heading]}>
                  {v === 'front' ? 'Front' : 'Back'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Body + muscle chips side by side */}
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>

          {/* SVG body */}
          <View style={{
            backgroundColor: C.card,
            borderRadius: 20, padding: 10,
            borderWidth: 1, borderColor: C.border,
            alignItems: 'center', justifyContent: 'center',
            alignSelf: 'stretch',
          }}>
            {view === 'front'
              ? <FrontBody selected={selected} onSelect={handleSelect} />
              : <BackBody  selected={selected} onSelect={handleSelect} />
            }
          </View>

          {/* Muscle chips — vertical list next to body */}
          <View style={{ gap: 7, justifyContent: 'center' }}>
            {muscleKeys.map(key => {
              const m = MUSCLE_EXERCISES[key];
              const active = selected === key;
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => handleSelect(key)}
                  activeOpacity={0.8}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 7,
                    paddingHorizontal: 10, paddingVertical: 7,
                    borderRadius: 12,
                    backgroundColor: active ? m?.color + '22' : C.card,
                    borderWidth: 1.5,
                    borderColor: active ? m?.color : C.border,
                  }}
                >
                  <View style={{
                    width: 8, height: 8, borderRadius: 4,
                    backgroundColor: m?.color,
                  }} />
                  <Text style={[{
                    fontSize: 12,
                    color: active ? m?.color : C.textSub,
                  }, ff.heading]}>
                    {m?.label || key}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {/* ── BOTTOM HALF — scrollable exercise panel ── */}
      <View style={{ flex: 1 }}>
        {selectedData ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          >
            <Animated.View
              key={selected}
              entering={FadeIn.duration(300)}
            >
              {/* Panel header */}
              <View style={{
                flexDirection: 'row', alignItems: 'center',
                gap: 10, marginBottom: 14,
              }}>
                <View style={{
                  width: 12, height: 12, borderRadius: 6,
                  backgroundColor: selectedData.color,
                }} />
                <Text style={[{ fontSize: 18, color: selectedData.color }, ff.display]}>
                  {selectedData.label}
                </Text>
                <View style={{
                  backgroundColor: selectedData.color + '20',
                  borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
                  marginLeft: 'auto',
                }}>
                  <Text style={[{ fontSize: 11, color: selectedData.color }, ff.heading]}>
                    {selectedData.exercises.length} exercises
                  </Text>
                </View>
              </View>

              {/* Exercise list */}
              <View style={{ gap: 8 }}>
                {selectedData.exercises.map((ex, i) => (
                  <Animated.View
                    key={ex}
                    entering={FadeInDown.duration(250).delay(i * 35)}
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: 12,
                      backgroundColor: C.card,
                      borderRadius: 14, padding: 12,
                      borderWidth: 1, borderColor: C.border,
                      borderLeftWidth: 3, borderLeftColor: selectedData.color,
                    }}
                  >
                    <View style={{
                      width: 28, height: 28, borderRadius: 14,
                      backgroundColor: selectedData.color + '22',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Text style={[{ fontSize: 13, color: selectedData.color }, ff.heading]}>
                        {i + 1}
                      </Text>
                    </View>
                    <Text style={[{ flex: 1, fontSize: 14, color: C.text }, ff.heading]}>
                      {ex}
                    </Text>
                    <Ionicons name="barbell-outline" size={15} color={C.textSub} />
                  </Animated.View>
                ))}
              </View>
            </Animated.View>
          </ScrollView>
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
            <Text style={{ fontSize: 36, marginBottom: 10 }}>👆</Text>
            <Text style={[{ fontSize: 15, color: C.text, textAlign: 'center' }, ff.heading]}>
              Tap a muscle
            </Text>
            <Text style={[{ fontSize: 13, color: C.textSub, textAlign: 'center', marginTop: 4 }, ff.body]}>
              on the diagram or the chips to see exercises
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
