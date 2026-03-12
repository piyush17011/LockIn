/**
 * MuscleGroupAnimations.jsx  —  STATIC VERSION
 * Drop-in replacement. Same exports: ExerciseFigure, MuscleGroupFigure.
 * All figures are frozen at mid-rep pose. Zero Animated loops, zero JS-thread cost.
 */

import { memo } from 'react';
import Svg, { Circle, Line, Path, G } from 'react-native-svg';

// ─── BENCH PRESS — bar at mid-press, elbows bent ────────────────────────────
const BenchPressFigure = memo(({ size, color }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48">
    <Line x1="4"  y1="38" x2="44" y2="38" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.45"/>
    <Line x1="8"  y1="38" x2="8"  y2="44" stroke={color} strokeWidth="2"   strokeLinecap="round" strokeOpacity="0.45"/>
    <Line x1="40" y1="38" x2="40" y2="44" stroke={color} strokeWidth="2"   strokeLinecap="round" strokeOpacity="0.45"/>
    <Line x1="10" y1="35" x2="34" y2="35" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
    <Circle cx="38" cy="35" r="4" fill="none" stroke={color} strokeWidth="2"/>
    <Line x1="10" y1="35" x2="8"  y2="44" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="14" y1="35" x2="12" y2="44" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    {/* bar at mid-press (halfway up) */}
    <Line x1="6"  y1="25" x2="40" y2="25" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Circle cx="4"  cy="25" r="3" fill="none" stroke={color} strokeWidth="1.5"/>
    <Circle cx="42" cy="25" r="3" fill="none" stroke={color} strokeWidth="1.5"/>
    <Line x1="16" y1="33" x2="14" y2="25" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="28" y1="33" x2="26" y2="25" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
  </Svg>
));

// ─── PUSH-UP — mid push, body elevated ──────────────────────────────────────
const PushUpFigure = memo(({ size, color }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48">
    <Line x1="8"  y1="22" x2="36" y2="22" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
    <Circle cx="41" cy="22" r="4" fill="none" stroke={color} strokeWidth="2"/>
    <Line x1="14" y1="22" x2="10" y2="30" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="10" y1="30" x2="10" y2="38" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="26" y1="22" x2="22" y2="30" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="22" y1="30" x2="22" y2="38" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="8"  y1="30" x2="6"  y2="38" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
  </Svg>
));

// ─── SQUAT — mid descent, thighs parallel ───────────────────────────────────
const SquatFigure = memo(({ size, color }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48">
    {/* barbell */}
    <Line x1="6"  y1="13" x2="42" y2="13" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Circle cx="4"  cy="13" r="3.5" fill="none" stroke={color} strokeWidth="1.5"/>
    <Circle cx="44" cy="13" r="3.5" fill="none" stroke={color} strokeWidth="1.5"/>
    {/* head */}
    <Circle cx="24" cy="6"  r="4"  fill="none" stroke={color} strokeWidth="2"/>
    {/* torso slightly forward */}
    <Line x1="24" y1="10" x2="22" y2="26" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
    {/* arms on bar */}
    <Line x1="24" y1="14" x2="14" y2="16" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <Line x1="24" y1="14" x2="34" y2="16" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    {/* thighs — mid squat spread */}
    <Line x1="22" y1="26" x2="12" y2="36" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="22" y1="26" x2="32" y2="36" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    {/* shins */}
    <Line x1="12" y1="36" x2="10" y2="46" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="32" y1="36" x2="34" y2="46" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
  </Svg>
));

// ─── DEADLIFT — mid-pull, torso 30° from vertical ───────────────────────────
const DeadliftFigure = memo(({ size, color }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48">
    <Line x1="6"  y1="38" x2="42" y2="38" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Circle cx="4"  cy="38" r="3.5" fill="none" stroke={color} strokeWidth="1.5"/>
    <Circle cx="44" cy="38" r="3.5" fill="none" stroke={color} strokeWidth="1.5"/>
    {/* shins */}
    <Line x1="20" y1="34" x2="18" y2="44" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="28" y1="34" x2="30" y2="44" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    {/* torso mid-rise ~30° */}
    <Line x1="24" y1="30" x2="26" y2="14" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
    <Circle cx="27" cy="9"  r="4"  fill="none" stroke={color} strokeWidth="2"/>
    <Line x1="26" y1="18" x2="16" y2="24" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="16" y1="24" x2="14" y2="34" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="26" y1="18" x2="36" y2="24" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="36" y1="24" x2="38" y2="34" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
  </Svg>
));

// ─── PULL-UP — chin just above bar, elbows fully bent ───────────────────────
const PullUpFigure = memo(({ size, color }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48">
    <Line x1="4"  y1="4"  x2="44" y2="4"  stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
    <Circle cx="14" cy="4" r="2.5" fill={color}/>
    <Circle cx="34" cy="4" r="2.5" fill={color}/>
    {/* upper arms angled out */}
    <Line x1="14" y1="4"  x2="17" y2="15" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="34" y1="4"  x2="31" y2="15" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    {/* forearms fully bent — chin above bar */}
    <Line x1="17" y1="15" x2="21" y2="20" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="31" y1="15" x2="27" y2="20" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Circle cx="24" cy="22" r="4.5" fill="none" stroke={color} strokeWidth="2"/>
    <Line x1="24" y1="27" x2="24" y2="40" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="24" y1="38" x2="20" y2="46" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="24" y1="38" x2="28" y2="46" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
  </Svg>
));

// ─── BARBELL ROW — torso 45°, bar at mid-pull ───────────────────────────────
const BarbellRowFigure = memo(({ size, color }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48">
    <Line x1="8"  y1="22" x2="28" y2="15" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
    <Circle cx="32" cy="13" r="4" fill="none" stroke={color} strokeWidth="2"/>
    <Line x1="8"  y1="22" x2="10" y2="36" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="10" y1="36" x2="10" y2="44" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="14" y1="22" x2="18" y2="36" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="18" y1="36" x2="20" y2="44" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    {/* bar pulled to belly */}
    <Line x1="16" y1="20" x2="14" y2="26" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="14" y1="26" x2="12" y2="30" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="5"  y1="28" x2="29" y2="28" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Circle cx="3"  cy="28" r="3"  fill="none" stroke={color} strokeWidth="1.5"/>
    <Circle cx="31" cy="28" r="3"  fill="none" stroke={color} strokeWidth="1.5"/>
  </Svg>
));

// ─── OVERHEAD PRESS — bar at eye level, mid-press ───────────────────────────
const OverheadPressFigure = memo(({ size, color }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48">
    <Circle cx="24" cy="30" r="4" fill="none" stroke={color} strokeWidth="2"/>
    <Line x1="24" y1="34" x2="24" y2="46" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
    <Line x1="24" y1="44" x2="20" y2="48" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="24" y1="44" x2="28" y2="48" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    {/* bar mid-press */}
    <Line x1="4"  y1="19" x2="44" y2="19" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Circle cx="2"  cy="19" r="3.5" fill="none" stroke={color} strokeWidth="1.5"/>
    <Circle cx="46" cy="19" r="3.5" fill="none" stroke={color} strokeWidth="1.5"/>
    <Line x1="24" y1="35" x2="14" y2="28" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="14" y1="28" x2="12" y2="19" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="24" y1="35" x2="34" y2="28" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="34" y1="28" x2="36" y2="19" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
  </Svg>
));

// ─── CURL — forearm at 90°, dumbbell at peak ────────────────────────────────
const CurlFigure = memo(({ size, color }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48">
    <Circle cx="24" cy="6"  r="4"  fill="none" stroke={color} strokeWidth="2"/>
    <Line x1="24" y1="10" x2="24" y2="30" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
    <Line x1="24" y1="28" x2="20" y2="40" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="20" y1="40" x2="19" y2="46" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="24" y1="28" x2="28" y2="40" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="28" y1="40" x2="29" y2="46" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    {/* resting arm */}
    <Line x1="24" y1="17" x2="14" y2="23" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="14" y1="23" x2="12" y2="32" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    {/* upper arm */}
    <Line x1="24" y1="17" x2="36" y2="21" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    {/* forearm at 90° */}
    <Line x1="36" y1="21" x2="30" y2="15" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    {/* dumbbell */}
    <Line x1="26" y1="12" x2="34" y2="12" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
    <Circle cx="25" cy="12" r="2"  fill="none" stroke={color} strokeWidth="1.5"/>
    <Circle cx="35" cy="12" r="2"  fill="none" stroke={color} strokeWidth="1.5"/>
  </Svg>
));

// ─── TRICEP PUSHDOWN — forearms at 90°, elbows at sides ─────────────────────
const TricepPushdownFigure = memo(({ size, color }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48">
    <Line x1="24" y1="2"  x2="24" y2="8"  stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.35"/>
    <Circle cx="24" cy="2"  r="1.5" fill={color} fillOpacity="0.35"/>
    <Circle cx="24" cy="8"  r="4"   fill="none" stroke={color} strokeWidth="2"/>
    <Line x1="24" y1="12" x2="24" y2="30" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
    <Line x1="24" y1="28" x2="20" y2="40" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="20" y1="40" x2="19" y2="46" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="24" y1="28" x2="28" y2="40" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="28" y1="40" x2="29" y2="46" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    {/* upper arms pinned */}
    <Line x1="24" y1="16" x2="13" y2="21" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="24" y1="16" x2="35" y2="21" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    {/* forearms at 90° — mid push */}
    <Line x1="13" y1="21" x2="11" y2="30" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="9"  y1="30" x2="13" y2="30" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
    <Line x1="35" y1="21" x2="37" y2="30" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="35" y1="30" x2="39" y2="30" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
  </Svg>
));

// ─── LATERAL RAISE — arms at T, dumbbells level ─────────────────────────────
const LateralRaiseFigure = memo(({ size, color }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48">
    <Circle cx="24" cy="7"  r="4"  fill="none" stroke={color} strokeWidth="2"/>
    <Line x1="24" y1="11" x2="24" y2="30" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
    <Line x1="24" y1="28" x2="20" y2="40" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="20" y1="40" x2="19" y2="46" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="24" y1="28" x2="28" y2="40" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="28" y1="40" x2="29" y2="46" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    {/* arms raised to T */}
    <Line x1="24" y1="18" x2="8"  y2="18" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="6"  y1="16" x2="6"  y2="20" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
    <Line x1="24" y1="18" x2="40" y2="18" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="42" y1="16" x2="42" y2="20" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
  </Svg>
));

// ─── PLANK — rigid body on forearms ─────────────────────────────────────────
const PlankFigure = memo(({ size, color }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48">
    <Line x1="6"  y1="28" x2="38" y2="28" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
    <Circle cx="43" cy="28" r="4" fill="none" stroke={color} strokeWidth="2"/>
    <Line x1="10" y1="28" x2="8"  y2="36" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="8"  y1="36" x2="4"  y2="36" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="22" y1="28" x2="20" y2="36" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="20" y1="36" x2="16" y2="36" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="6"  y1="28" x2="4"  y2="34" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
  </Svg>
));

// ─── CRUNCH — torso curled ~45° from floor ───────────────────────────────────
const CrunchFigure = memo(({ size, color }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48">
    <Line x1="18" y1="36" x2="34" y2="34" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="34" y1="34" x2="44" y2="36" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    {/* torso at ~45° */}
    <Line x1="18" y1="36" x2="22" y2="22" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
    <Circle cx="23" cy="17" r="4" fill="none" stroke={color} strokeWidth="2"/>
    <Line x1="22" y1="24" x2="12" y2="20" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="12" y1="20" x2="14" y2="14" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="22" y1="24" x2="30" y2="20" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="30" y1="20" x2="28" y2="14" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
  </Svg>
));

// ─── HIP THRUST — hips at top, bar on hips ──────────────────────────────────
const HipThrustFigure = memo(({ size, color }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48">
    {/* bench */}
    <Line x1="4"  y1="28" x2="22" y2="28" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.45"/>
    <Line x1="4"  y1="28" x2="4"  y2="36" stroke={color} strokeWidth="2"   strokeLinecap="round" strokeOpacity="0.4"/>
    <Line x1="20" y1="28" x2="20" y2="36" stroke={color} strokeWidth="2"   strokeLinecap="round" strokeOpacity="0.4"/>
    {/* upper body on bench */}
    <Line x1="8"  y1="28" x2="22" y2="22" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
    <Circle cx="26" cy="20" r="4" fill="none" stroke={color} strokeWidth="2"/>
    {/* hips at top */}
    <Line x1="14" y1="26" x2="42" y2="26" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Circle cx="12" cy="26" r="3"  fill="none" stroke={color} strokeWidth="1.5"/>
    <Circle cx="44" cy="26" r="3"  fill="none" stroke={color} strokeWidth="1.5"/>
    <Line x1="22" y1="26" x2="26" y2="36" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
    <Line x1="26" y1="36" x2="24" y2="46" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="26" y1="36" x2="32" y2="46" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
  </Svg>
));

// ─── LEG CURL — heel curled halfway to glute ────────────────────────────────
const LegCurlFigure = memo(({ size, color }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48">
    <Line x1="6"  y1="26" x2="32" y2="26" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
    <Circle cx="36" cy="26" r="4" fill="none" stroke={color} strokeWidth="2"/>
    <Line x1="16" y1="26" x2="14" y2="32" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="24" y1="26" x2="22" y2="32" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    {/* static leg */}
    <Line x1="6"  y1="26" x2="4"  y2="36" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="4"  y1="36" x2="4"  y2="44" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    {/* curling leg — heel at 45° */}
    <Line x1="10" y1="26" x2="8"  y2="36" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="8"  y1="36" x2="16" y2="30" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
  </Svg>
));

// ─── CALF RAISE — up on toes ────────────────────────────────────────────────
const CalfRaiseFigure = memo(({ size, color }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48">
    <Circle cx="24" cy="6"  r="4"  fill="none" stroke={color} strokeWidth="2"/>
    <Line x1="24" y1="10" x2="24" y2="28" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
    <Line x1="24" y1="16" x2="16" y2="22" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="16" y1="22" x2="14" y2="30" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="24" y1="16" x2="32" y2="22" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="32" y1="22" x2="34" y2="30" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    {/* legs up on toes */}
    <Line x1="24" y1="28" x2="20" y2="36" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="24" y1="28" x2="28" y2="36" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="20" y1="36" x2="19" y2="40" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="19" y1="40" x2="23" y2="42" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <Line x1="28" y1="36" x2="29" y2="40" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="29" y1="40" x2="25" y2="42" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </Svg>
));

// ─── RDL — hinge at ~45°, bar at shin level ─────────────────────────────────
const RDLFigure = memo(({ size, color }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48">
    <Line x1="20" y1="28" x2="18" y2="44" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="28" y1="28" x2="30" y2="44" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    {/* torso hinged ~45° */}
    <Line x1="24" y1="28" x2="30" y2="14" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
    <Circle cx="31" cy="9"  r="4"  fill="none" stroke={color} strokeWidth="2"/>
    <Line x1="30" y1="18" x2="20" y2="22" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="20" y1="22" x2="18" y2="30" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="30" y1="18" x2="38" y2="20" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="38" y1="20" x2="40" y2="28" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    {/* bar mid-shin */}
    <Line x1="10" y1="32" x2="38" y2="32" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Circle cx="8"  cy="32" r="3"  fill="none" stroke={color} strokeWidth="1.5"/>
    <Circle cx="40" cy="32" r="3"  fill="none" stroke={color} strokeWidth="1.5"/>
  </Svg>
));

// ─── RUNNING — mid-stride ────────────────────────────────────────────────────
const RunningFigure = memo(({ size, color }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48">
    <Circle cx="24" cy="7"  r="4"  fill="none" stroke={color} strokeWidth="2"/>
    <Line x1="24" y1="11" x2="22" y2="26" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
    {/* forward arm */}
    <Line x1="22" y1="17" x2="12" y2="22" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="12" y1="22" x2="8"  y2="28" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    {/* back arm */}
    <Line x1="22" y1="17" x2="32" y2="22" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="32" y1="22" x2="36" y2="28" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    {/* forward leg */}
    <Line x1="22" y1="26" x2="16" y2="36" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="16" y1="36" x2="10" y2="42" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    {/* back leg */}
    <Line x1="22" y1="26" x2="28" y2="36" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="28" y1="36" x2="32" y2="42" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
  </Svg>
));

// ─── BURPEE — jump, arms overhead ───────────────────────────────────────────
const BurpeeFigure = memo(({ size, color }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48">
    <Circle cx="24" cy="8"  r="4"  fill="none" stroke={color} strokeWidth="2"/>
    <Line x1="24" y1="12" x2="24" y2="28" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
    {/* arms raised overhead */}
    <Line x1="24" y1="20" x2="12" y2="12" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="12" y1="12" x2="10" y2="6"  stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="24" y1="20" x2="36" y2="12" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="36" y1="12" x2="38" y2="6"  stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    {/* legs slightly spread — jump */}
    <Line x1="24" y1="28" x2="18" y2="38" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="18" y1="38" x2="16" y2="44" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="24" y1="28" x2="30" y2="38" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="30" y1="38" x2="32" y2="44" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
  </Svg>
));

// ─── LUNGE — front knee at 90°, back knee low ───────────────────────────────
const LungeFigure = memo(({ size, color }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48">
    <Circle cx="24" cy="6"  r="4"  fill="none" stroke={color} strokeWidth="2"/>
    <Line x1="24" y1="10" x2="24" y2="26" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
    <Line x1="24" y1="16" x2="14" y2="22" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="14" y1="22" x2="12" y2="30" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="24" y1="16" x2="34" y2="22" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="34" y1="22" x2="36" y2="30" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    {/* front leg */}
    <Line x1="24" y1="26" x2="32" y2="34" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="32" y1="34" x2="36" y2="44" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    {/* back leg — knee near ground */}
    <Line x1="24" y1="26" x2="14" y2="34" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="14" y1="34" x2="12" y2="44" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
  </Svg>
));

// ─── KETTLEBELL SWING — hips extended, arms forward ─────────────────────────
const KettlebellSwingFigure = memo(({ size, color }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48">
    <Line x1="20" y1="30" x2="16" y2="44" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="28" y1="30" x2="32" y2="44" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    {/* torso upright */}
    <Line x1="24" y1="28" x2="24" y2="12" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
    <Circle cx="24" cy="7"  r="4"  fill="none" stroke={color} strokeWidth="2"/>
    {/* arms forward at 45° */}
    <Line x1="24" y1="20" x2="12" y2="14" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="12" y1="14" x2="8"  y2="20" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="24" y1="20" x2="36" y2="14" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="36" y1="14" x2="40" y2="20" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    {/* kettlebell */}
    <Circle cx="24" cy="26" r="4"  fill="none" stroke={color} strokeWidth="2"/>
    <Line x1="20" y1="22" x2="28" y2="22" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </Svg>
));

// ─── LAT PULLDOWN — bar pulled to chin, elbows bent ─────────────────────────
const LatPulldownFigure = memo(({ size, color }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48">
    <Line x1="4"  y1="4"  x2="44" y2="4"  stroke={color} strokeWidth="2"   strokeLinecap="round" strokeOpacity="0.4"/>
    <Line x1="10" y1="4"  x2="10" y2="14" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.35"/>
    <Line x1="38" y1="4"  x2="38" y2="14" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.35"/>
    {/* bar pulled down to chin */}
    <Line x1="8"  y1="20" x2="40" y2="20" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
    {/* elbows bent pulling down */}
    <Line x1="10" y1="14" x2="16" y2="24" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="38" y1="14" x2="32" y2="24" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Circle cx="24" cy="24" r="4"  fill="none" stroke={color} strokeWidth="2"/>
    <Line x1="24" y1="28" x2="24" y2="40" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
    <Line x1="16" y1="40" x2="32" y2="40" stroke={color} strokeWidth="2"   strokeLinecap="round" strokeOpacity="0.4"/>
    <Line x1="24" y1="40" x2="18" y2="46" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="24" y1="40" x2="30" y2="46" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
  </Svg>
));

// ─── LEG PRESS — legs at 45°, mid-push ──────────────────────────────────────
const LegPressFigure = memo(({ size, color }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48">
    <Line x1="4"  y1="38" x2="22" y2="30" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
    <Circle cx="26" cy="28" r="4" fill="none" stroke={color} strokeWidth="2"/>
    <Line x1="4"  y1="28" x2="4"  y2="44" stroke={color} strokeWidth="2"   strokeLinecap="round" strokeOpacity="0.4"/>
    <Line x1="36" y1="10" x2="48" y2="10" stroke={color} strokeWidth="3"   strokeLinecap="round" strokeOpacity="0.55"/>
    {/* legs at 45° mid-press */}
    <Line x1="22" y1="34" x2="32" y2="22" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="32" y1="22" x2="38" y2="14" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="18" y1="36" x2="28" y2="24" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="28" y1="24" x2="34" y2="16" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
  </Svg>
));

// ─── MOBILITY — standing side lean with reach ────────────────────────────────
const MobilityFigure = memo(({ size, color }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48">
    <Circle cx="24" cy="7"  r="4"  fill="none" stroke={color} strokeWidth="2"/>
    {/* torso leaning slightly */}
    <Line x1="24" y1="11" x2="22" y2="30" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
    {/* reach arm up */}
    <Line x1="23" y1="18" x2="36" y2="12" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="36" y1="12" x2="42" y2="6"  stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    {/* other arm down */}
    <Line x1="23" y1="18" x2="14" y2="24" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="14" y1="24" x2="12" y2="32" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="22" y1="30" x2="18" y2="44" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
    <Line x1="22" y1="30" x2="26" y2="44" stroke={color} strokeWidth="2"   strokeLinecap="round"/>
  </Svg>
));

// ─── REGISTRY ────────────────────────────────────────────────────────────────
const FIGURES = {
  Chest:          BenchPressFigure,
  Back:           BarbellRowFigure,
  Shoulders:      OverheadPressFigure,
  Biceps:         CurlFigure,
  Triceps:        TricepPushdownFigure,
  Core:           CrunchFigure,
  Quads:          SquatFigure,
  Hamstrings:     RDLFigure,
  Glutes:         HipThrustFigure,
  Calves:         CalfRaiseFigure,
  'Full Body':    DeadliftFigure,
  Cardio:         RunningFigure,
  HIIT:           BurpeeFigure,
  Mobility:       MobilityFigure,
  Powerlifting:   SquatFigure,
  Calisthenics:   PullUpFigure,
  BenchPress:     BenchPressFigure,
  PushUp:         PushUpFigure,
  Squat:          SquatFigure,
  Deadlift:       DeadliftFigure,
  PullUp:         PullUpFigure,
  BarbellRow:     BarbellRowFigure,
  OHP:            OverheadPressFigure,
  Curl:           CurlFigure,
  TricepPushdown: TricepPushdownFigure,
  LateralRaise:   LateralRaiseFigure,
  Plank:          PlankFigure,
  Crunch:         CrunchFigure,
  HipThrust:      HipThrustFigure,
  LegCurl:        LegCurlFigure,
  CalfRaise:      CalfRaiseFigure,
  RDL:            RDLFigure,
  Running:        RunningFigure,
  Burpee:         BurpeeFigure,
  Lunge:          LungeFigure,
  Kettlebell:     KettlebellSwingFigure,
  LatPulldown:    LatPulldownFigure,
  LegPress:       LegPressFigure,
};

// ─── Exercise name → figure key ──────────────────────────────────────────────
const EXERCISE_NAME_MAP = {
  'Bench Press':                    'BenchPress',
  'Incline Bench Press':            'BenchPress',
  'Decline Bench Press':            'BenchPress',
  'Dumbbell Bench Press':           'BenchPress',
  'Barbell Bench Press':            'BenchPress',
  'Incline Barbell Bench Press':    'BenchPress',
  'Incline Dumbbell Bench Press':   'BenchPress',
  'Decline Barbell Bench Press':    'BenchPress',
  'Decline Dumbbell Bench Press':   'BenchPress',
  'Close-Grip Bench Press':         'BenchPress',
  'Floor Press':                    'BenchPress',
  'Dumbbell Fly':                   'Chest',
  'Incline Dumbbell Fly':           'Chest',
  'Cable Fly':                      'Chest',
  'Cable Crossover':                'Chest',
  'Pec Deck':                       'Chest',
  'Chest Dips':                     'Chest',
  'Dumbbell Pullover':              'Chest',
  'Svend Press':                    'Chest',
  'Landmine Press':                 'Chest',
  'Push-Ups':                       'PushUp',
  'Diamond Push-Ups':               'PushUp',
  'Pike Push-Ups':                  'PushUp',
  'Plyo Push-Ups':                  'PushUp',
  'Pull-Ups':                       'PullUp',
  'Chin-Ups':                       'PullUp',
  'Muscle-Up':                      'PullUp',
  'Ring Rows':                      'PullUp',
  'Front Lever':                    'PullUp',
  'Lat Pulldown':                   'LatPulldown',
  'Straight-Arm Pulldown':          'LatPulldown',
  'Barbell Row':                    'BarbellRow',
  'Dumbbell Row':                   'BarbellRow',
  'Single-Arm Dumbbell Row':        'BarbellRow',
  'Chest-Supported Dumbbell Row':   'BarbellRow',
  'T-Bar Row':                      'BarbellRow',
  'Pendlay Row':                    'BarbellRow',
  'Meadows Row':                    'BarbellRow',
  'Seated Cable Row':               'BarbellRow',
  'Cable Row':                      'BarbellRow',
  'Face Pulls':                     'LateralRaise',
  'Rear Delt Dumbbell Fly':         'LateralRaise',
  'Dumbbell Lateral Raise':         'LateralRaise',
  'Cable Lateral Raise':            'LateralRaise',
  'Dumbbell Front Raise':           'LateralRaise',
  'Plate Front Raise':              'LateralRaise',
  'Lu Raise':                       'LateralRaise',
  'Cable Face Pull':                'LateralRaise',
  'Barbell Upright Row':            'LateralRaise',
  'Barbell Overhead Press':         'OHP',
  'Dumbbell Shoulder Press':        'OHP',
  'Arnold Press':                   'OHP',
  'Machine Shoulder Press':         'OHP',
  'Push Press':                     'OHP',
  'Bradford Press':                 'OHP',
  'Handstand Push-Up':              'OHP',
  'Barbell Curl':                   'Curl',
  'Dumbbell Curl':                  'Curl',
  'Hammer Curl':                    'Curl',
  'Cross-Body Hammer Curl':         'Curl',
  'Incline Dumbbell Curl':          'Curl',
  'Preacher Curl':                  'Curl',
  'Cable Curl':                     'Curl',
  'Concentration Curl':             'Curl',
  'Spider Curl':                    'Curl',
  'Zottman Curl':                   'Curl',
  'EZ Bar Curl':                    'Curl',
  'Reverse Barbell Curl':           'Curl',
  '21s':                            'Curl',
  'Cable Tricep Pushdown':          'TricepPushdown',
  'Rope Pushdown':                  'TricepPushdown',
  'Single-Arm Cable Pushdown':      'TricepPushdown',
  'Cable Overhead Tricep Extension':'TricepPushdown',
  'Dumbbell Overhead Tricep Extension':'TricepPushdown',
  'Barbell Skull Crushers':         'TricepPushdown',
  'Tricep Dips':                    'TricepPushdown',
  'JM Press':                       'TricepPushdown',
  'Tate Press':                     'TricepPushdown',
  'Dumbbell Kickbacks':             'TricepPushdown',
  'Plank':                          'Plank',
  'Side Plank':                     'Plank',
  'Hollow Body Hold':               'Plank',
  'L-Sit':                          'Plank',
  'Dead Bug':                       'Plank',
  'Pallof Press':                   'Plank',
  'Crunches':                       'Crunch',
  'Bicycle Crunches':               'Crunch',
  'Russian Twists':                 'Crunch',
  'Cable Crunches':                 'Crunch',
  'Toe Touches':                    'Crunch',
  'V-Ups':                          'Crunch',
  'Windshield Wipers':              'Crunch',
  'Leg Raises':                     'Crunch',
  'Hanging Knee Raises':            'Crunch',
  'Ab Rollout':                     'Crunch',
  'Dragon Flag':                    'Crunch',
  'Barbell Back Squat':             'Squat',
  'Dumbbell Goblet Squat':          'Squat',
  'Front Squat':                    'Squat',
  'Hack Squat':                     'Squat',
  'Pause Squat':                    'Squat',
  'Barbell Box Squat':              'Squat',
  'Belt Squat':                     'Squat',
  'Sissy Squat':                    'Squat',
  'Cyclist Squat':                  'Squat',
  'Spanish Squat':                  'Squat',
  'Wall Sit':                       'Squat',
  'Bulgarian Split Squat':          'Lunge',
  'Barbell Lunges':                 'Lunge',
  'Dumbbell Lunges':                'Lunge',
  'Step-Ups':                       'Lunge',
  'Pistol Squat':                   'Lunge',
  'Leg Press':                      'LegPress',
  'Leg Extensions':                 'LegPress',
  'Barbell Deadlift':               'Deadlift',
  'Conventional Deadlift':          'Deadlift',
  'Sumo Deadlift':                  'Deadlift',
  'Rack Pull':                      'Deadlift',
  'Snatch-Grip Deadlift':           'Deadlift',
  'Power Clean':                    'Deadlift',
  'Romanian Deadlift':              'RDL',
  'Barbell Romanian Deadlift':      'RDL',
  'Dumbbell Romanian Deadlift':     'RDL',
  'Stiff-Leg Deadlift':             'RDL',
  'Single-Leg RDL':                 'RDL',
  'Good Mornings':                  'RDL',
  'Barbell Hip Thrust':             'HipThrust',
  'Dumbbell Hip Thrust':            'HipThrust',
  'Glute Bridge':                   'HipThrust',
  'Single-Leg Hip Thrust':          'HipThrust',
  'Frog Pump':                      'HipThrust',
  'Cable Kickbacks':                'HipThrust',
  'Donkey Kicks':                   'HipThrust',
  'Clamshells':                     'HipThrust',
  'Abductor Machine':               'HipThrust',
  'Banded Walk':                    'HipThrust',
  'Lying Leg Curl':                 'LegCurl',
  'Seated Leg Curl':                'LegCurl',
  'Nordic Curl':                    'LegCurl',
  'Glute-Ham Raise':                'LegCurl',
  'Standing Calf Raise':            'CalfRaise',
  'Seated Calf Raise':              'CalfRaise',
  'Donkey Calf Raise':              'CalfRaise',
  'Leg Press Calf Raise':           'CalfRaise',
  'Single-Leg Calf Raise':          'CalfRaise',
  'Tibialis Raise':                 'CalfRaise',
  'Loaded Stretch Calf Raise':      'CalfRaise',
  'Kettlebell Swings':              'Kettlebell',
  'Turkish Get-Up':                 'Kettlebell',
  'Farmers Carry':                  'Kettlebell',
  'Treadmill Run':                  'Running',
  'Jump Rope':                      'Running',
  'Sprint Intervals':               'Running',
  'Incline Walk':                   'Running',
  'High Knees':                     'Running',
  'Cycling':                        'Cardio',
  'Stair Climber':                  'Cardio',
  'Elliptical':                     'Cardio',
  'Assault Bike':                   'Cardio',
  'Rowing Machine':                 'BarbellRow',
  'Swimming':                       'Running',
  'Burpees':                        'Burpee',
  'Box Jumps':                      'Burpee',
  'Jump Squats':                    'Burpee',
  'Tuck Jumps':                     'Burpee',
  'Jumping Lunges':                 'Lunge',
  'Assault Bike Sprint':            'Cardio',
  'Sled Push':                      'Deadlift',
  'Battle Ropes':                   'Cardio',
  'Mountain Climbers':              'Crunch',
  'Barbell Shrugs':                 'OHP',
  'Dumbbell Shrugs':                'OHP',
  'Snatch Grip Deadlift':           'Deadlift',
  'Cable Shrug':                    'OHP',
  'Wrist Curl':                     'Curl',
  'Reverse Wrist Curl':             'Curl',
  'Dead Hang':                      'PullUp',
  'Plate Pinch':                    'Curl',
  'Towel Pull-Up':                  'PullUp',
  'Wrist Roller':                   'Curl',
  'Hip Flexor Stretch':             'Mobility',
  'Shoulder Dislocates':            'Mobility',
  'Cat-Cow':                        'Mobility',
  'Pigeon Pose':                    'Mobility',
  'Worlds Greatest Stretch':        'Mobility',
  'Thoracic Rotation':              'Mobility',
  'Deep Squat Hold':                'Mobility',
  'Couch Stretch':                  'Mobility',
  'Downward Dog':                   'Mobility',
  '90/90 Hip Switch':               'Mobility',
  'Wall Slides':                    'Mobility',
  'Jefferson Curl':                 'Mobility',
};

// ─── Muscle string fallback ───────────────────────────────────────────────────
const MUSCLE_STRING_MAP = [
  ['tricep',    'Triceps'],
  ['bicep',     'Biceps'],
  ['chest',     'Chest'],
  ['back',      'Back'],
  ['lat',       'Back'],
  ['delt',      'Shoulders'],
  ['shoulder',  'Shoulders'],
  ['quad',      'Quads'],
  ['hamstring', 'Hamstrings'],
  ['glute',     'Glutes'],
  ['hip',       'Glutes'],
  ['calve',     'Calves'],
  ['calf',      'Calves'],
  ['core',      'Core'],
  ['abs',       'Core'],
  ['cardio',    'Cardio'],
  ['full body', 'Full Body'],
  ['legs',      'Quads'],
];

function muscleStringToFigureKey(muscleStr) {
  if (!muscleStr) return null;
  const lower = muscleStr.toLowerCase();
  for (const [kw, key] of MUSCLE_STRING_MAP) {
    if (lower.includes(kw)) return key;
  }
  return null;
}

// ─── Public exports ───────────────────────────────────────────────────────────
export function MuscleGroupFigure({ muscleKey, size = 40, color = '#ffffff' }) {
  const Figure = FIGURES[muscleKey];
  if (!Figure) return null;
  return <Figure size={size} color={color} />;
}

export function ExerciseFigure({ name, muscle, size = 36, color = '#ffffff' }) {
  const nameKey   = name ? EXERCISE_NAME_MAP[name] : null;
  const muscleKey = nameKey || muscleStringToFigureKey(muscle);
  const Figure    = muscleKey ? FIGURES[muscleKey] : null;
  if (!Figure) return null;
  return <Figure size={size} color={color} />;
}
