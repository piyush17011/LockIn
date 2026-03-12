import { useState, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Dimensions, Modal,
} from 'react-native';
import Svg, { Path, Ellipse, Circle, G, Defs, RadialGradient, Stop, LinearGradient } from 'react-native-svg';
import Animated, { FadeIn, FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { MUSCLE_EXERCISES } from '../../constants/exercises';
import { useTheme } from '../../hooks/ThemeContext';
import { useWorkoutsContext } from '../../hooks/WorkoutsContext';

const { width: SW, height: SH } = Dimensions.get('window');

const BODY_H = SH * 0.52;
const FIG_H  = BODY_H - 70;
const FIG_W  = FIG_H * 0.48;

const BASE       = '#0d1520';
const SKIN       = '#1c2a3a';
const SKIN_MID   = '#243040';
const SKIN_LIGHT = '#2e3d50';
const STROKE_COL = '#3a4f68';
const MUSCLE_STROKE = '#4a6080';

// ─── Muscular Front Body ──────────────────────────────────────────────────────
function FrontBody({ selected, onSelect }) {
  const hi = (key) => {
    const m = MUSCLE_EXERCISES[key];
    const active = selected === key;
    return {
      fill:        active ? m?.color + 'cc' : m?.color + '44',
      stroke:      active ? m?.color        : m?.color + '77',
      strokeWidth: active ? 2.5             : 1.2,
    };
  };
  const tap = (key) => ({ onPress: () => onSelect(key) });

  return (
    <Svg width={FIG_W} height={FIG_H} viewBox="0 0 110 290">
      <Defs>
        <LinearGradient id="skinGrad" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={SKIN_MID} />
          <Stop offset="0.5" stopColor={SKIN_LIGHT} />
          <Stop offset="1" stopColor={SKIN_MID} />
        </LinearGradient>
        <LinearGradient id="legGrad" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={SKIN} />
          <Stop offset="0.5" stopColor={SKIN_LIGHT} />
          <Stop offset="1" stopColor={SKIN} />
        </LinearGradient>
      </Defs>

      {/* ── HEAD ── */}
      <Ellipse cx="55" cy="13" rx="10" ry="12" fill={SKIN_LIGHT} stroke={STROKE_COL} strokeWidth="1" />
      {/* jaw */}
      <Path d="M46 18 Q46 25 55 27 Q64 25 64 18" fill={SKIN_LIGHT} stroke={STROKE_COL} strokeWidth="0.8" />
      {/* neck — trapezoidal, wide */}
      <Path d="M50 25 L49 37 Q55 40 61 37 L60 25 Q55 27 50 25Z" fill="url(#skinGrad)" stroke={STROKE_COL} strokeWidth="0.8" />
      {/* neck highlight */}
      <Path d="M53 26 Q55 28 57 26" fill="none" stroke={SKIN_LIGHT} strokeWidth="0.5" />

      {/* ── TRAPEZIUS (upper traps visible from front) ── */}
      <Path d="M49 35 Q38 37 33 46 Q40 51 55 52 Q70 51 77 46 Q72 37 61 35 Q55 33 49 35Z"
        fill={SKIN_MID} stroke={STROKE_COL} strokeWidth="0.8" />

      {/* ── TORSO BASE (wide v-taper) ── */}
      <Path d="M33 46 Q22 52 18 68 L17 100 L18 135 Q35 142 55 143 Q75 142 92 135 L93 100 L92 68 Q88 52 77 46 Q66 42 55 42 Q44 42 33 46Z"
        fill="url(#skinGrad)" stroke={STROKE_COL} strokeWidth="1" />

      {/* ── SHOULDERS (thick, rounded deltoids) ── */}
      <Path d="M33 46 Q20 50 16 64 Q15 76 22 82 Q28 86 36 80 Q42 72 41 60 Q39 49 33 46Z"
        {...hi('shoulders')} {...tap('shoulders')} />
      <Path d="M77 46 Q90 50 94 64 Q95 76 88 82 Q82 86 74 80 Q68 72 69 60 Q71 49 77 46Z"
        {...hi('shoulders')} {...tap('shoulders')} />
      {/* delt groove lines */}
      <Path d="M36 52 Q32 60 33 70" fill="none" stroke={selected==='shoulders'?MUSCLE_EXERCISES.shoulders?.color+'55':STROKE_COL} strokeWidth="0.6" />
      <Path d="M74 52 Q78 60 77 70" fill="none" stroke={selected==='shoulders'?MUSCLE_EXERCISES.shoulders?.color+'55':STROKE_COL} strokeWidth="0.6" />

      {/* ── CHEST (two full pecs with groove) ── */}
      {/* left pec */}
      <Path d="M35 50 Q26 58 26 74 Q27 87 35 93 Q43 98 54 95 Q57 93 57 80 L57 50 Q47 46 35 50Z"
        {...hi('chest')} {...tap('chest')} />
      {/* right pec */}
      <Path d="M75 50 Q84 58 84 74 Q83 87 75 93 Q67 98 56 95 Q53 93 53 80 L53 50 Q63 46 75 50Z"
        {...hi('chest')} {...tap('chest')} />
      {/* pec cleavage line */}
      <Path d="M55 48 Q55 56 55 96" stroke={selected==='chest'?MUSCLE_EXERCISES.chest?.color+'66':STROKE_COL} strokeWidth="0.8" fill="none" />
      {/* lower pec lines */}
      <Path d="M28 86 Q42 94 55 93" fill="none" stroke={selected==='chest'?MUSCLE_EXERCISES.chest?.color+'55':STROKE_COL+'88'} strokeWidth="0.7" />
      <Path d="M82 86 Q68 94 55 93" fill="none" stroke={selected==='chest'?MUSCLE_EXERCISES.chest?.color+'55':STROKE_COL+'88'} strokeWidth="0.7" />

      {/* ── UPPER ARMS / BICEPS ── */}
      <Path d="M18 83 Q12 93 12 107 Q13 118 20 123 Q26 126 31 119 Q36 110 35 97 Q34 84 28 81 Q22 79 18 83Z"
        {...hi('biceps')} {...tap('biceps')} />
      <Path d="M92 83 Q98 93 98 107 Q97 118 90 123 Q84 126 79 119 Q74 110 75 97 Q76 84 82 81 Q88 79 92 83Z"
        {...hi('biceps')} {...tap('biceps')} />
      {/* bicep peak line */}
      <Path d="M17 100 Q23 96 29 100" fill="none" stroke={selected==='biceps'?MUSCLE_EXERCISES.biceps?.color+'88':STROKE_COL+'66'} strokeWidth="0.8" />
      <Path d="M93 100 Q87 96 81 100" fill="none" stroke={selected==='biceps'?MUSCLE_EXERCISES.biceps?.color+'88':STROKE_COL+'66'} strokeWidth="0.8" />

      {/* ── FOREARMS ── */}
      <Path d="M13 124 Q9 136 11 148 Q13 155 19 157 Q26 158 29 151 Q33 141 31 129 Q29 122 24 120 Q17 120 13 124Z"
        fill={SKIN_MID} stroke={STROKE_COL} strokeWidth="0.8" />
      <Path d="M97 124 Q101 136 99 148 Q97 155 91 157 Q84 158 81 151 Q77 141 79 129 Q81 122 86 120 Q93 120 97 124Z"
        fill={SKIN_MID} stroke={STROKE_COL} strokeWidth="0.8" />
      {/* forearm tendon lines */}
      <Path d="M14 130 Q18 128 22 132" fill="none" stroke={STROKE_COL+'88'} strokeWidth="0.5" />
      <Path d="M96 130 Q92 128 88 132" fill="none" stroke={STROKE_COL+'88'} strokeWidth="0.5" />

      {/* ── HANDS ── */}
      <Path d="M11 157 Q8 163 9 170 Q12 175 18 174 Q24 173 25 167 Q26 160 23 156Z" fill={SKIN} stroke={STROKE_COL} strokeWidth="0.7" />
      <Path d="M99 157 Q102 163 101 170 Q98 175 92 174 Q86 173 85 167 Q84 160 87 156Z" fill={SKIN} stroke={STROKE_COL} strokeWidth="0.7" />

      {/* ── SERRATUS (side ribs below armpit) ── */}
      {[0,1,2].map(i => (
        <Path key={`sl${i}`} d={`M26 ${88+i*7} Q22 ${90+i*7} 22 ${93+i*7}`} fill="none" stroke={STROKE_COL} strokeWidth="0.6" />
      ))}
      {[0,1,2].map(i => (
        <Path key={`sr${i}`} d={`M84 ${88+i*7} Q88 ${90+i*7} 88 ${93+i*7}`} fill="none" stroke={STROKE_COL} strokeWidth="0.6" />
      ))}

      {/* ── ABS (6-pack + obliques) ── */}
      {/* obliques */}
      <Path d="M27 100 Q25 120 28 140 Q34 150 41 148 Q44 138 43 118 Q42 100 38 96 Q32 94 27 100Z"
        {...hi('abs')} {...tap('abs')} />
      <Path d="M83 100 Q85 120 82 140 Q76 150 69 148 Q66 138 67 118 Q68 100 72 96 Q78 94 83 100Z"
        {...hi('abs')} {...tap('abs')} />
      {/* 6 rectus abdominis blocks */}
      {[0,1,2].map(row => (
        [0,1].map(col => {
          const lx = col===0 ? 42 : 55; const rx = col===0 ? 55 : 68;
          const ty = 95 + row*17; const by = ty + 15;
          const mx = col===0 ? 44 : 66;
          return (
            <Path key={`${row}-${col}`}
              d={`M${lx} ${ty} Q${mx} ${ty-1} ${rx} ${ty} L${rx} ${by} Q${mx} ${by+1} ${lx} ${by}Z`}
              {...hi('abs')} {...tap('abs')} />
          );
        })
      ))}
      {/* linea alba */}
      <Path d="M55 95 L55 148" stroke={selected==='abs'?MUSCLE_EXERCISES.abs?.color+'55':STROKE_COL} strokeWidth="0.8" fill="none" />
      {/* tendinous inscriptions */}
      {[0,1,2].map(i => (
        <Path key={`ins${i}`} d={`M42 ${103+i*17} Q55 ${101+i*17} 68 ${103+i*17}`} fill="none" stroke={STROKE_COL} strokeWidth="0.6" />
      ))}

      {/* ── HIP / PELVIS ── */}
      <Path d="M38 148 Q30 154 30 162 Q34 170 55 172 Q76 170 80 162 Q80 154 72 148 Q64 152 55 153 Q46 152 38 148Z"
        fill={SKIN_MID} stroke={STROKE_COL} strokeWidth="0.8" />
      {/* hip flexor lines */}
      <Path d="M40 162 Q48 165 55 164" fill="none" stroke={STROKE_COL+'88'} strokeWidth="0.6" />
      <Path d="M70 162 Q62 165 55 164" fill="none" stroke={STROKE_COL+'88'} strokeWidth="0.6" />

      {/* ── QUADS (teardrop shape, 4 heads implied) ── */}
      <Path d="M30 168 Q23 183 23 206 Q25 225 33 234 Q41 241 50 238 Q58 233 59 217 Q60 198 57 180 Q53 168 45 165 Q37 163 30 168Z"
        {...hi('quads')} {...tap('quads')} />
      <Path d="M80 168 Q87 183 87 206 Q85 225 77 234 Q69 241 60 238 Q52 233 51 217 Q50 198 53 180 Q57 168 65 165 Q73 163 80 168Z"
        {...hi('quads')} {...tap('quads')} />
      {/* quad separation lines */}
      <Path d="M32 185 Q40 182 46 188" fill="none" stroke={selected==='quads'?MUSCLE_EXERCISES.quads?.color+'55':STROKE_COL+'66'} strokeWidth="0.7" />
      <Path d="M78 185 Q70 182 64 188" fill="none" stroke={selected==='quads'?MUSCLE_EXERCISES.quads?.color+'55':STROKE_COL+'66'} strokeWidth="0.7" />
      {/* VMO teardrop */}
      <Path d="M47 225 Q43 232 46 238 Q51 241 55 239 Q57 233 55 226Z"
        fill={selected==='quads'?MUSCLE_EXERCISES.quads?.color+'66':'transparent'}
        stroke={selected==='quads'?MUSCLE_EXERCISES.quads?.color:STROKE_COL+'55'} strokeWidth="0.8" />
      <Path d="M63 225 Q67 232 64 238 Q59 241 55 239 Q53 233 55 226Z"
        fill={selected==='quads'?MUSCLE_EXERCISES.quads?.color+'66':'transparent'}
        stroke={selected==='quads'?MUSCLE_EXERCISES.quads?.color:STROKE_COL+'55'} strokeWidth="0.8" />

      {/* ── KNEES ── */}
      <Ellipse cx="41" cy="240" rx="9" ry="7" fill={SKIN} stroke={STROKE_COL} strokeWidth="0.8" />
      <Ellipse cx="69" cy="240" rx="9" ry="7" fill={SKIN} stroke={STROKE_COL} strokeWidth="0.8" />
      {/* kneecap detail */}
      <Path d="M37 238 Q41 236 45 238 Q45 243 41 244 Q37 243 37 238Z" fill={SKIN_MID} stroke={STROKE_COL+'88'} strokeWidth="0.5" />
      <Path d="M65 238 Q69 236 73 238 Q73 243 69 244 Q65 243 65 238Z" fill={SKIN_MID} stroke={STROKE_COL+'88'} strokeWidth="0.5" />

      {/* ── CALVES (big gastrocnemius) ── */}
      <Path d="M33 247 Q28 260 30 274 Q33 282 40 284 Q48 285 51 276 Q54 264 52 252 Q50 244 44 242 Q37 242 33 247Z"
        {...hi('calves')} {...tap('calves')} />
      <Path d="M77 247 Q82 260 80 274 Q77 282 70 284 Q62 285 59 276 Q56 264 58 252 Q60 244 66 242 Q73 242 77 247Z"
        {...hi('calves')} {...tap('calves')} />
      {/* gastrocnemius split */}
      <Path d="M35 260 Q41 256 47 260" fill="none" stroke={selected==='calves'?MUSCLE_EXERCISES.calves?.color+'66':STROKE_COL+'66'} strokeWidth="0.8" />
      <Path d="M75 260 Q69 256 63 260" fill="none" stroke={selected==='calves'?MUSCLE_EXERCISES.calves?.color+'66':STROKE_COL+'66'} strokeWidth="0.8" />

      {/* ── FEET ── */}
      <Path d="M31 284 Q27 290 28 295 Q33 298 44 297 Q50 294 50 289 L50 284Z" fill={SKIN} stroke={STROKE_COL} strokeWidth="0.7" />
      <Path d="M79 284 Q83 290 82 295 Q77 298 66 297 Q60 294 60 289 L60 284Z" fill={SKIN} stroke={STROKE_COL} strokeWidth="0.7" />
    </Svg>
  );
}

// ─── Muscular Back Body ───────────────────────────────────────────────────────
function BackBody({ selected, onSelect }) {
  const hi = (key) => {
    const m = MUSCLE_EXERCISES[key];
    const active = selected === key;
    return {
      fill:        active ? m?.color + 'cc' : m?.color + '44',
      stroke:      active ? m?.color        : m?.color + '77',
      strokeWidth: active ? 2.5             : 1.2,
    };
  };
  const tap = (key) => ({ onPress: () => onSelect(key) });

  return (
    <Svg width={FIG_W} height={FIG_H} viewBox="0 0 110 290">
      <Defs>
        <LinearGradient id="backGrad" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={SKIN_MID} />
          <Stop offset="0.5" stopColor={SKIN_LIGHT} />
          <Stop offset="1" stopColor={SKIN_MID} />
        </LinearGradient>
      </Defs>

      {/* HEAD — back */}
      <Ellipse cx="55" cy="13" rx="10" ry="12" fill={SKIN_MID} stroke={STROKE_COL} strokeWidth="1" />
      <Path d="M50 25 L49 37 Q55 40 61 37 L60 25 Q55 27 50 25Z" fill="url(#backGrad)" stroke={STROKE_COL} strokeWidth="0.8" />

      {/* TORSO */}
      <Path d="M33 46 Q22 52 18 68 L17 100 L18 135 Q35 142 55 143 Q75 142 92 135 L93 100 L92 68 Q88 52 77 46 Q66 42 55 42 Q44 42 33 46Z"
        fill="url(#backGrad)" stroke={STROKE_COL} strokeWidth="1" />

      {/* ── TRAPS (big diamond shape) ── */}
      <Path d="M49 34 Q37 37 33 48 Q40 56 55 58 Q70 56 77 48 Q73 37 61 34 Q55 32 49 34Z"
        {...hi('back')} {...tap('back')} />
      {/* trap lines */}
      <Path d="M55 34 L55 58" stroke={selected==='back'?MUSCLE_EXERCISES.back?.color+'55':STROKE_COL} strokeWidth="0.7" fill="none" />
      <Path d="M42 42 Q55 46 68 42" fill="none" stroke={selected==='back'?MUSCLE_EXERCISES.back?.color+'44':STROKE_COL+'66'} strokeWidth="0.6" />

      {/* ── REAR DELTS ── */}
      <Path d="M33 46 Q20 50 16 64 Q15 76 22 82 Q28 86 36 80 Q42 72 41 60 Q39 49 33 46Z"
        {...hi('shoulders')} {...tap('shoulders')} />
      <Path d="M77 46 Q90 50 94 64 Q95 76 88 82 Q82 86 74 80 Q68 72 69 60 Q71 49 77 46Z"
        {...hi('shoulders')} {...tap('shoulders')} />

      {/* ── LATS (wide flare) ── */}
      <Path d="M20 56 Q17 72 17 96 Q18 118 26 130 Q35 140 47 137 Q56 134 57 124 L57 62 Q40 54 20 56Z"
        {...hi('back')} {...tap('back')} />
      <Path d="M90 56 Q93 72 93 96 Q92 118 84 130 Q75 140 63 137 Q54 134 53 124 L53 62 Q70 54 90 56Z"
        {...hi('back')} {...tap('back')} />
      {/* spine */}
      <Path d="M55 38 L55 140" stroke={STROKE_COL} strokeWidth="1" fill="none" />
      {/* lat fan lines */}
      {[0,1,2,3].map(i => (
        <Path key={`ll${i}`} d={`M24 ${70+i*14} Q36 ${67+i*14} 52 ${68+i*14}`} fill="none" stroke={STROKE_COL+'55'} strokeWidth="0.5" />
      ))}
      {[0,1,2,3].map(i => (
        <Path key={`lr${i}`} d={`M86 ${70+i*14} Q74 ${67+i*14} 58 ${68+i*14}`} fill="none" stroke={STROKE_COL+'55'} strokeWidth="0.5" />
      ))}

      {/* ── LOWER BACK / ERECTORS ── */}
      <Path d="M46 130 Q40 138 42 150 Q48 158 55 158 Q62 158 68 150 Q70 138 64 130 Q60 128 55 128 Q50 128 46 130Z"
        {...hi('back')} {...tap('back')} />
      {/* erector lines */}
      <Path d="M51 132 L51 156" fill="none" stroke={selected==='back'?MUSCLE_EXERCISES.back?.color+'55':STROKE_COL} strokeWidth="0.7" />
      <Path d="M59 132 L59 156" fill="none" stroke={selected==='back'?MUSCLE_EXERCISES.back?.color+'55':STROKE_COL} strokeWidth="0.7" />

      {/* ── TRICEPS ── */}
      <Path d="M18 83 Q12 93 12 107 Q13 118 20 123 Q26 126 31 119 Q36 110 35 97 Q34 84 28 81 Q22 79 18 83Z"
        {...hi('triceps')} {...tap('triceps')} />
      <Path d="M92 83 Q98 93 98 107 Q97 118 90 123 Q84 126 79 119 Q74 110 75 97 Q76 84 82 81 Q88 79 92 83Z"
        {...hi('triceps')} {...tap('triceps')} />
      {/* tricep horseshoe */}
      <Path d="M15 95 Q22 90 29 95 Q29 108 22 112 Q15 108 15 95Z"
        fill="none" stroke={selected==='triceps'?MUSCLE_EXERCISES.triceps?.color+'66':STROKE_COL+'55'} strokeWidth="0.7" />
      <Path d="M95 95 Q88 90 81 95 Q81 108 88 112 Q95 108 95 95Z"
        fill="none" stroke={selected==='triceps'?MUSCLE_EXERCISES.triceps?.color+'66':STROKE_COL+'55'} strokeWidth="0.7" />

      {/* FOREARMS */}
      <Path d="M13 124 Q9 136 11 148 Q13 155 19 157 Q26 158 29 151 Q33 141 31 129 Q29 122 24 120 Q17 120 13 124Z"
        fill={SKIN_MID} stroke={STROKE_COL} strokeWidth="0.8" />
      <Path d="M97 124 Q101 136 99 148 Q97 155 91 157 Q84 158 81 151 Q77 141 79 129 Q81 122 86 120 Q93 120 97 124Z"
        fill={SKIN_MID} stroke={STROKE_COL} strokeWidth="0.8" />

      {/* HANDS */}
      <Path d="M11 157 Q8 163 9 170 Q12 175 18 174 Q24 173 25 167 Q26 160 23 156Z" fill={SKIN} stroke={STROKE_COL} strokeWidth="0.7" />
      <Path d="M99 157 Q102 163 101 170 Q98 175 92 174 Q86 173 85 167 Q84 160 87 156Z" fill={SKIN} stroke={STROKE_COL} strokeWidth="0.7" />

      {/* ── GLUTES (round and prominent) ── */}
      <Path d="M28 162 Q20 174 21 190 Q25 206 36 210 Q47 213 54 202 Q59 190 57 174 Q53 160 44 157 Q34 155 28 162Z"
        {...hi('glutes')} {...tap('glutes')} />
      <Path d="M82 162 Q90 174 89 190 Q85 206 74 210 Q63 213 56 202 Q51 190 53 174 Q57 160 66 157 Q76 155 82 162Z"
        {...hi('glutes')} {...tap('glutes')} />
      {/* glute divide */}
      <Path d="M55 155 L55 210" stroke={STROKE_COL} strokeWidth="0.8" fill="none" />
      {/* glute roundness lines */}
      <Path d="M24 182 Q38 186 53 183" fill="none" stroke={selected==='glutes'?MUSCLE_EXERCISES.glutes?.color+'55':STROKE_COL+'55'} strokeWidth="0.7" />
      <Path d="M86 182 Q72 186 57 183" fill="none" stroke={selected==='glutes'?MUSCLE_EXERCISES.glutes?.color+'55':STROKE_COL+'55'} strokeWidth="0.7" />

      {/* ── HAMSTRINGS ── */}
      <Path d="M24 208 Q19 224 20 240 Q23 252 32 256 Q42 259 49 250 Q55 240 54 222 Q52 208 45 205 Q35 203 24 208Z"
        {...hi('hamstrings')} {...tap('hamstrings')} />
      <Path d="M86 208 Q91 224 90 240 Q87 252 78 256 Q68 259 61 250 Q55 240 56 222 Q58 208 65 205 Q75 203 86 208Z"
        {...hi('hamstrings')} {...tap('hamstrings')} />
      {/* bicep femoris / semitendinosus lines */}
      <Path d="M27 220 Q36 217 44 222" fill="none" stroke={selected==='hamstrings'?MUSCLE_EXERCISES.hamstrings?.color+'55':STROKE_COL+'55'} strokeWidth="0.7" />
      <Path d="M83 220 Q74 217 66 222" fill="none" stroke={selected==='hamstrings'?MUSCLE_EXERCISES.hamstrings?.color+'55':STROKE_COL+'55'} strokeWidth="0.7" />

      {/* KNEES */}
      <Ellipse cx="41" cy="258" rx="9" ry="7" fill={SKIN} stroke={STROKE_COL} strokeWidth="0.8" />
      <Ellipse cx="69" cy="258" rx="9" ry="7" fill={SKIN} stroke={STROKE_COL} strokeWidth="0.8" />

      {/* ── CALVES (back — big gastrocnemius) ── */}
      <Path d="M33 265 Q28 278 30 292 Q33 300 40 302 Q48 303 51 294 Q54 282 52 270 Q50 262 44 260 Q37 260 33 265Z"
        {...hi('calves')} {...tap('calves')} />
      <Path d="M77 265 Q82 278 80 292 Q77 300 70 302 Q62 303 59 294 Q56 282 58 270 Q60 262 66 260 Q73 260 77 265Z"
        {...hi('calves')} {...tap('calves')} />
      <Path d="M35 278 Q41 274 47 278" fill="none" stroke={selected==='calves'?MUSCLE_EXERCISES.calves?.color+'66':STROKE_COL+'66'} strokeWidth="0.8" />
      <Path d="M75 278 Q69 274 63 278" fill="none" stroke={selected==='calves'?MUSCLE_EXERCISES.calves?.color+'66':STROKE_COL+'66'} strokeWidth="0.8" />

      {/* FEET */}
      <Path d="M31 302 Q27 308 28 313 Q33 316 44 315 Q50 312 50 307 L50 302Z" fill={SKIN} stroke={STROKE_COL} strokeWidth="0.7" />
      <Path d="M79 302 Q83 308 82 313 Q77 316 66 315 Q60 312 60 307 L60 302Z" fill={SKIN} stroke={STROKE_COL} strokeWidth="0.7" />
    </Svg>
  );
}

// ─── Recovery status ─────────────────────────────────────────────────────────
const RECOVERY_STATUS = [
  { key: 'fresh',   label: 'Fresh',   color: '#00c896', icon: '⚡', desc: 'Ready to train' },
  { key: 'trained', label: 'Trained', color: '#ff9f43', icon: '🔥', desc: 'Worked today'   },
  { key: 'sore',    label: 'Sore',    color: '#ff6b6b', icon: '⚠️',  desc: 'Needs recovery' },
  { key: 'rest',    label: 'Rest',    color: '#7b61ff', icon: '😴', desc: 'Scheduled rest'  },
];

// ─── Weekly bar chart for weekly volume ──────────────────────────────────────
function WeeklyBarChart({ data, color, maxVal, C, ff }) {
  const DAYS = ['M','T','W','T','F','S','S'];
  const max = maxVal || Math.max(...data, 1);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 80 }}>
      {data.map((val, i) => {
        const pct = val / max;
        const barH = Math.max(pct * 58, val > 0 ? 10 : 3);
        return (
          <View key={i} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
            <View style={{ flex: 1, justifyContent: 'flex-end' }}>
              {val > 0 && (
                <Text style={[{ fontSize: 10, color, textAlign: 'center', marginBottom: 2, fontWeight: '700' }, ff.heading]}>{val}</Text>
              )}
              <View style={{
                height: barH, borderRadius: 5,
                backgroundColor: val > 0 ? color : C.border,
                opacity: val > 0 ? 1 : 0.25,
              }} />
            </View>
            <Text style={[{ fontSize: 10, color: C.text, opacity: 0.7 }, ff.body]}>{DAYS[i]}</Text>
          </View>
        );
      })}
    </View>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getWeekDates() {
  const today = new Date();
  const dow = (today.getDay() + 6) % 7; // Mon=0
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - dow + i);
    return d.toISOString().split('T')[0];
  });
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

// Maps the stored muscle string (e.g. "Chest", "Back", "Legs") → MUSCLE_EXERCISES keys
// Handles case-insensitive, partial, and multi-muscle mappings
const MUSCLE_LABEL_MAP = {
  // ── Single muscles ──────────────────────────────────────────────────────────
  'chest':            ['chest'],
  'back':             ['back'],
  'shoulders':        ['shoulders'],
  'biceps':           ['biceps'],
  'triceps':          ['triceps'],
  'abs':              ['abs'],
  'core':             ['abs'],
  'quads':            ['quads'],
  'hamstrings':       ['hamstrings'],
  'glutes':           ['glutes'],
  'calves':           ['calves'],
  'forearms':         ['forearms'],
  'traps':            ['traps'],
  // ── Sub-muscle labels from exercises.js ─────────────────────────────────────
  'upper chest':      ['chest'],
  'lower chest':      ['chest'],
  'chest/lats':       ['chest', 'back'],
  'chest/triceps':    ['chest', 'triceps'],
  'side delts':       ['shoulders'],
  'front delts':      ['shoulders'],
  'rear delts':       ['shoulders'],
  'lats':             ['back'],
  'mid back':         ['back'],
  'upper back':       ['back'],
  'back/biceps':      ['back', 'biceps'],
  'back/glutes':      ['back', 'glutes'],
  'quads/glutes':     ['quads', 'glutes'],
  'glutes/back':      ['glutes', 'back'],
  'hamstrings/back':  ['hamstrings', 'back'],
  'chest/shoulders':  ['chest', 'shoulders'],
  'back/core':        ['back', 'abs'],
  'arms/core':        ['biceps', 'triceps', 'abs'],
  'hips':             ['glutes'],
  'hips/glutes':      ['glutes'],
  'hips/ankles':      ['glutes'],
  'hip flexors':      ['glutes'],
  'spine':            ['back'],
  'spine/hamstrings': ['hamstrings', 'back'],
  // ── Multi-muscle groupings ───────────────────────────────────────────────────
  'legs':             ['quads', 'hamstrings', 'calves'],
  'full body':        ['chest', 'back', 'shoulders', 'abs', 'quads', 'hamstrings'],
  'upper body':       ['chest', 'back', 'shoulders', 'biceps', 'triceps'],
  'lower body':       ['quads', 'hamstrings', 'glutes', 'calves'],
  'push':             ['chest', 'shoulders', 'triceps'],
  'pull':             ['back', 'biceps'],
  // ── Catch-alls (no specific muscle map) ────────────────────────────────────
  'cardio':           [],
  'custom':           [],
};

function normaliseMuscle(raw) {
  if (!raw) return [];
  const key = raw.toLowerCase().trim();
  if (MUSCLE_LABEL_MAP[key]) return MUSCLE_LABEL_MAP[key];
  // fuzzy: check if any map key is contained in the raw string
  for (const [mapKey, keys] of Object.entries(MUSCLE_LABEL_MAP)) {
    if (key.includes(mapKey) || mapKey.includes(key)) return keys;
  }
  return [];
}

// Returns { muscleKey: { sets:[7], sessions:[7], totalSets, todaySets, exercises:{} } }
function computeMuscleStats(workouts) {
  const weekDates = getWeekDates();
  const stats = {};

  const ensure = (muscle) => {
    if (!stats[muscle]) stats[muscle] = {
      sets: [0,0,0,0,0,0,0],
      sessions: [false,false,false,false,false,false,false],
      totalSets: 0, todaySets: 0, exercises: {},
    };
  };

  workouts.forEach(w => {
    if (!w.exercises) return;
    const dayIdx = weekDates.indexOf(w.date);
    const isToday = w.date === todayStr();
    const inWeek  = dayIdx !== -1;

    w.exercises.forEach(ex => {
      const muscleKeys = normaliseMuscle(ex.muscle);
      if (!muscleKeys.length) return;

      const setCount = typeof ex.sets === 'number' ? ex.sets
        : Array.isArray(ex.sets) ? ex.sets.length
        : (ex.reps ? ex.reps.toString().split('/').length : 1);

      muscleKeys.forEach(muscle => {
        ensure(muscle);
        if (inWeek) {
          stats[muscle].sets[dayIdx]    += setCount;
          stats[muscle].sessions[dayIdx] = true;
          stats[muscle].totalSets       += setCount;
        }
        if (isToday) stats[muscle].todaySets += setCount;
        if (!stats[muscle].exercises[ex.name]) stats[muscle].exercises[ex.name] = 0;
        stats[muscle].exercises[ex.name] += setCount;
      });
    });
  });

  return stats;
}

// Auto-derive today's recovery status from workout data
function autoRecovery(muscleKey, stats) {
  const s = stats[muscleKey];
  if (!s) return null;
  if (s.todaySets > 0) return 'trained';
  const weekDates = getWeekDates();
  const todayIdx  = weekDates.indexOf(todayStr());
  if (todayIdx > 0 && s.sets[todayIdx - 1] > 0) return 'sore';
  return null;
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function MuscleMapScreen() {
  const { scheme: C, font: F } = useTheme();
  const ff = { display: { fontFamily: F.display }, heading: { fontFamily: F.heading }, body: { fontFamily: F.body } };

  const { workouts = [] } = useWorkoutsContext();

  const [selected,       setSelected]       = useState(null);
  const [view,           setView]           = useState('front');
  const [manualRecovery, setManualRecovery] = useState({});
  const [exModal,        setExModal]        = useState(false);
  const [weekTab,        setWeekTab]        = useState('sets');

  const frontKeys  = ['chest','shoulders','biceps','abs','quads','calves'];
  const backKeys   = ['shoulders','back','triceps','glutes','hamstrings','calves'];
  const allKeys    = [...new Set([...frontKeys, ...backKeys])];
  const muscleKeys = view === 'front' ? frontKeys : backKeys;

  const muscleStats = useMemo(() => computeMuscleStats(workouts), [workouts]);
  const getRecovery = useCallback((key) => manualRecovery[key] ?? autoRecovery(key, muscleStats), [manualRecovery, muscleStats]);

  const handleSelect = useCallback((key) => {
    setSelected(prev => prev === key ? null : key);
  }, []);
  const switchView = useCallback((v) => { setView(v); setSelected(null); }, []);
  const setManual  = useCallback((key, status) => {
    setManualRecovery(prev => ({ ...prev, [key]: status === prev[key] ? undefined : status }));
  }, []);

  const selectedData  = selected ? MUSCLE_EXERCISES[selected] : null;
  const selectedStats = selected ? muscleStats[selected] : null;
  const selRecovery   = selected ? getRecovery(selected) : null;
  const selRecInfo    = RECOVERY_STATUS.find(s => s.key === selRecovery);
  const trainedToday  = allKeys.filter(k => getRecovery(k) === 'trained' || muscleStats[k]?.todaySets > 0);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>

      {/* ── HEADER — compact single row ── */}
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Text style={[{ fontSize: 22, color: C.text, letterSpacing: -0.4 }, ff.display]}>Muscle Map</Text>
          <Text style={[{ fontSize: 11, color: C.textSub, marginTop: 1 }, ff.body]}>
            {trainedToday.length > 0 ? `${trainedToday.length} group${trainedToday.length > 1 ? 's' : ''} trained today` : 'Tap a muscle to explore'}
          </Text>
        </View>
        {/* Front/Back toggle */}
        <View style={{ flexDirection: 'row', backgroundColor: C.surface, borderRadius: 18, padding: 3, borderWidth: 1, borderColor: C.border }}>
          {['front','back'].map(v => (
            <TouchableOpacity key={v} onPressIn={() => switchView(v)}
              style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 15,
                backgroundColor: view === v ? C.accent : 'transparent' }}>
              <Text style={[{ fontSize: 11, color: view === v ? C.bg : C.textSub }, ff.heading]}>
                {v === 'front' ? '▶ Front' : 'Back ◀'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── MAIN BODY — figure left, chips right ── */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 12, gap: 10, height: FIG_H + 20 }}>

        {/* SVG body figure */}
        <View style={{
          backgroundColor: C.card, borderRadius: 20, borderWidth: 1, borderColor: C.border,
          alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
          paddingVertical: 8, paddingHorizontal: 6, width: FIG_W + 22,
        }}>
          <Animated.View key={view} entering={FadeIn.duration(200)}>
            {view === 'front'
              ? <FrontBody selected={selected} onSelect={handleSelect} />
              : <BackBody  selected={selected} onSelect={handleSelect} />
            }
          </Animated.View>
        </View>

        {/* Muscle chips — vertical list, no scroll needed (6 items) */}
        <View style={{ flex: 1, gap: 5, justifyContent: 'center' }}>
          {muscleKeys.map(key => {
            const m         = MUSCLE_EXERCISES[key];
            const active    = selected === key;
            const rec       = getRecovery(key);
            const recInfo   = RECOVERY_STATUS.find(s => s.key === rec);
            const todaySets = muscleStats[key]?.todaySets || 0;
            return (
              <TouchableOpacity key={key} onPressIn={() => handleSelect(key)} activeOpacity={1}
                style={{
                  flex: 1, borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 10, paddingVertical: 0,
                  justifyContent: 'center',
                  borderColor:      active ? m?.color : recInfo ? recInfo.color + '55' : C.border,
                  backgroundColor:  active ? m?.color + '18' : recInfo ? recInfo.color + '0e' : C.card,
                }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: m?.color }} />
                  <Text style={[{ fontSize: 12, color: active ? m?.color : C.text, flex: 1 }, ff.heading]}>{m?.label || key}</Text>
                  {recInfo
                    ? <Text style={{ fontSize: 10 }}>{recInfo.icon}</Text>
                    : todaySets > 0
                      ? <Text style={[{ fontSize: 9, color: m?.color }, ff.body]}>{todaySets}s</Text>
                      : null
                  }
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── BOTTOM PANEL — fixed height, no outer scroll ── */}
      <View style={{ flex: 1, marginTop: 10, marginHorizontal: 12, marginBottom: 8 }}>
        {selectedData ? (
          <Animated.View key={selected} entering={FadeInUp.duration(220)} style={{ flex: 1 }}>

            {/* Title row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: selectedData.color }} />
              <Text style={[{ fontSize: 18, color: selectedData.color }, ff.display]}>{selectedData.label}</Text>
              {selRecInfo && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4,
                  backgroundColor: selRecInfo.color + '20', borderRadius: 8,
                  paddingHorizontal: 8, paddingVertical: 3 }}>
                  <Text style={{ fontSize: 10 }}>{selRecInfo.icon}</Text>
                  <Text style={[{ fontSize: 10, color: selRecInfo.color }, ff.heading]}>{selRecInfo.label}</Text>
                </View>
              )}
              <TouchableOpacity onPress={() => setExModal(true)}
                style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 3,
                  backgroundColor: selectedData.color + '18', borderRadius: 8,
                  paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: selectedData.color + '33' }}>
                <Text style={[{ fontSize: 10, color: selectedData.color }, ff.heading]}>{selectedData.exercises.length} exercises</Text>
                <Ionicons name="chevron-forward" size={10} color={selectedData.color} />
              </TouchableOpacity>
            </View>

            {/* Stats + chart side by side OR stacked */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
              {/* Stat numbers */}
              {[
                { label: 'Today',    val: selectedStats?.todaySets  || 0,  unit: 'sets' },
                { label: 'Week',     val: selectedStats?.totalSets  || 0,  unit: 'sets' },
                { label: 'Sessions', val: selectedStats?.sessions?.filter(Boolean).length || 0, unit: '/wk' },
              ].map(stat => (
                <View key={stat.label} style={{ flex: 1, backgroundColor: C.card, borderRadius: 12, padding: 8,
                  borderWidth: 1, borderColor: C.border, alignItems: 'center' }}>
                  <Text style={[{ fontSize: 22, color: selectedData.color }, ff.display]}>{stat.val}</Text>
                  <Text style={[{ fontSize: 9, color: C.text, opacity: 0.5 }, ff.body]}>{stat.label} {stat.unit}</Text>
                </View>
              ))}
            </View>

            {/* Chart + recovery override row */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
              {/* Bar chart — takes most of the width */}
              <View style={{ flex: 1, backgroundColor: C.card, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: C.border }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={[{ fontSize: 9, color: C.text, opacity: 0.5, letterSpacing: 0.8 }, ff.heading]}>THIS WEEK</Text>
                  <View style={{ flexDirection: 'row', gap: 2 }}>
                    {['sets','sessions'].map(t => (
                      <TouchableOpacity key={t} onPressIn={() => setWeekTab(t)}
                        style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
                          backgroundColor: weekTab === t ? selectedData.color + '30' : 'transparent' }}>
                        <Text style={[{ fontSize: 9, color: weekTab === t ? selectedData.color : C.text, opacity: weekTab === t ? 1 : 0.4 }, ff.heading]}>
                          {t === 'sets' ? 'Sets' : 'Days'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <WeeklyBarChart
                  data={weekTab === 'sets'
                    ? (selectedStats?.sets || [0,0,0,0,0,0,0])
                    : (selectedStats?.sessions || []).map(b => b ? 1 : 0)}
                  color={selectedData.color}
                  maxVal={weekTab === 'sessions' ? 1 : undefined}
                  C={C} ff={ff}
                />
              </View>

              {/* Recovery override — vertical stack of 4 icons */}
              <View style={{ gap: 5 }}>
                {RECOVERY_STATUS.map(s => {
                  const active = manualRecovery[selected] === s.key;
                  return (
                    <TouchableOpacity key={s.key} onPressIn={() => setManual(selected, s.key)} activeOpacity={1}
                      style={{ width: 48, flex: 1, alignItems: 'center', justifyContent: 'center',
                        borderRadius: 10, borderWidth: 1.5,
                        borderColor: active ? s.color : C.border,
                        backgroundColor: active ? s.color + '25' : C.card }}>
                      <Text style={{ fontSize: 14 }}>{s.icon}</Text>
                      <Text style={[{ fontSize: 8, color: active ? s.color : C.text, opacity: active ? 1 : 0.4, marginTop: 2 }, ff.heading]}>{s.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Exercises this week — compact horizontal pills or "no data" */}
            {selectedStats && Object.keys(selectedStats.exercises).length > 0 ? (
              <View style={{ backgroundColor: C.card, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: C.border }}>
                <Text style={[{ fontSize: 9, color: C.text, opacity: 0.5, letterSpacing: 0.8, marginBottom: 8 }, ff.heading]}>EXERCISES THIS WEEK</Text>
                {Object.entries(selectedStats.exercises).slice(0, 4).map(([name, sets]) => {
                  const maxSets = Math.max(...Object.values(selectedStats.exercises));
                  const pct = Math.max(sets / maxSets, 0.08); // min 8% so label is always visible
                  return (
                    <View key={name} style={{ marginBottom: 7 }}>
                      {/* Track */}
                      <View style={{ height: 28, backgroundColor: C.border + '55', borderRadius: 8, overflow: 'hidden' }}>
                        {/* Fill */}
                        <View style={{
                          position: 'absolute', left: 0, top: 0, bottom: 0,
                          width: `${pct * 100}%`,
                          backgroundColor: selectedData.color + 'cc', borderRadius: 8,
                        }} />
                        {/* Label + count inside bar */}
                        <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
                          flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, justifyContent: 'space-between' }}>
                          <Text style={[{ fontSize: 12, color: '#fff', fontWeight: '600' }, ff.body]}
                            numberOfLines={1}>{name}</Text>
                          <Text style={[{ fontSize: 11, color: '#fff', fontWeight: '800' }, ff.heading]}>{sets}s</Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
                {Object.keys(selectedStats.exercises).length > 4 && (
                  <Text style={[{ fontSize: 10, color: selectedData.color, marginTop: 2 }, ff.body]}>+{Object.keys(selectedStats.exercises).length - 4} more</Text>
                )}
              </View>
            ) : !selectedStats ? (
              <View style={{ backgroundColor: C.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: C.border, alignItems: 'center', gap: 4 }}>
                <Text style={{ fontSize: 22 }}>📭</Text>
                <Text style={[{ fontSize: 12, color: C.text }, ff.heading]}>No workouts logged yet</Text>
                <Text style={[{ fontSize: 10, color: C.textSub, textAlign: 'center' }, ff.body]}>Log a workout with {selectedData.label} exercises and it'll show up here.</Text>
              </View>
            ) : null}

          </Animated.View>
        ) : (
          /* ── Overview grid — all muscles, no scroll ── */
          <View style={{ flex: 1 }}>
            <Text style={[{ fontSize: 9, color: C.text, opacity: 0.5, letterSpacing: 1, marginBottom: 8 }, ff.heading]}>THIS WEEK — TAP TO EXPLORE</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
              {allKeys.map(key => {
                const m       = MUSCLE_EXERCISES[key];
                const rec     = getRecovery(key);
                const recInfo = RECOVERY_STATUS.find(s => s.key === rec);
                const stats   = muscleStats[key];
                return (
                  <TouchableOpacity key={key} activeOpacity={1}
                    onPressIn={() => { handleSelect(key); setView(frontKeys.includes(key) ? 'front' : 'back'); }}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6,
                      paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, borderWidth: 1,
                      borderColor: recInfo ? recInfo.color + '55' : C.border,
                      backgroundColor: recInfo ? recInfo.color + '10' : C.card }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: m?.color }} />
                    <View>
                      <Text style={[{ fontSize: 11, color: C.text }, ff.heading]}>{m?.label || key}</Text>
                      {stats?.totalSets > 0 && (
                        <Text style={[{ fontSize: 9, color: recInfo?.color || C.textSub }, ff.body]}>
                          {stats.totalSets}s · {stats.sessions.filter(Boolean).length}x
                        </Text>
                      )}
                    </View>
                    {recInfo && <Text style={{ fontSize: 10 }}>{recInfo.icon}</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </View>

      {/* ── Exercise Modal ── */}
      <Modal visible={exModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setExModal(false)}>
        <View style={{ flex: 1, backgroundColor: C.bg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: C.border }}>
            <View style={{ flex: 1 }}>
              <Text style={[{ fontSize: 20, color: selectedData?.color || C.text }, ff.display]}>{selectedData?.label}</Text>
              <Text style={[{ fontSize: 12, color: C.textSub }, ff.body]}>{selectedData?.exercises.length} exercises</Text>
            </View>
            <TouchableOpacity onPress={() => setExModal(false)}
              style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border }}>
              <Ionicons name="close" size={16} color={C.textSub} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }}>
            {selectedData?.exercises.map((ex, i) => (
              <Animated.View key={ex} entering={FadeInDown.duration(200).delay(i * 25)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.card,
                  borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border,
                  borderLeftWidth: 3, borderLeftColor: selectedData.color }}>
                <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: selectedData.color + '22', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={[{ fontSize: 13, color: selectedData.color }, ff.heading]}>{i+1}</Text>
                </View>
                <Text style={[{ flex: 1, fontSize: 14, color: C.text }, ff.heading]}>{ex}</Text>
                {selectedStats?.exercises[ex] && (
                  <Text style={[{ fontSize: 11, color: selectedData.color }, ff.body]}>{selectedStats.exercises[ex]} sets</Text>
                )}
                <Ionicons name="barbell-outline" size={16} color={C.muted} />
              </Animated.View>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
