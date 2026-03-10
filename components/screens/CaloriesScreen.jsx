import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, Alert,
} from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../hooks/useAuth';
import { saveCalorieProfile, getCalorieProfile } from '../../services/workoutService';
import { useTheme } from '../../hooks/ThemeContext';

const getStorageKey = (uid) => `lockin_calories_${uid}`;

const ACTIVITY = [
  { key: 1.2,   label: 'Sedentary',   desc: 'Desk job, no exercise',  icon: '🛋️' },
  { key: 1.375, label: 'Light',       desc: '1–3x/week exercise',     icon: '🚶' },
  { key: 1.55,  label: 'Moderate',    desc: '3–5x/week exercise',     icon: '🏃' },
  { key: 1.725, label: 'Active',      desc: '6–7x/week hard training', icon: '💪' },
  { key: 1.9,   label: 'Very Active', desc: 'Athlete / physical job',  icon: '🔥' },
];

const GOALS = [
  { key: 'cut',      label: 'Cut',      desc: 'Lose fat',      icon: '📉', adjust: -300 },
  { key: 'maintain', label: 'Maintain', desc: 'Stay lean',     icon: '⚖️', adjust: 0    },
  { key: 'bulk',     label: 'Bulk',     desc: 'Build muscle',  icon: '📈', adjust: 200  },
];

// ── Indian nutrition standards (ICMR / NIN guidelines) ─────────────────────
// Protein: 0.8–1g/kg bodyweight (ICMR RDA)
// Carbs: 55–65% of calories (rice/roti staple diet)
// Fat: 20–25% of calories
// Cut: smaller deficit (−300) — aggressive cuts backfire on Indian metabolism
// Bulk: smaller surplus (+200) — lean bulk suits Indian body composition
function getMacros(calories, goal, weightKg) {
  // Protein: ICMR RDA ~0.8g/kg, bump to 1–1.1g/kg for active individuals
  // Protein: 1.5g/kg maintain · 1.8g/kg cut (muscle preservation) · 2.3g/kg bulk (mid of 2.1–2.5)
  const proteinPerKg = goal === 'bulk' ? 2.3 : goal === 'cut' ? 1.8 : 1.5;
  const proteinG     = Math.round(weightKg * proteinPerKg);
  const proteinCals  = proteinG * 4;

  // Fat: 20–25% of total calories
  const fatPct  = goal === 'cut' ? 0.22 : goal === 'bulk' ? 0.20 : 0.22;
  const fatG    = Math.round((calories * fatPct) / 9);
  const fatCals = fatG * 9;

  // Carbs: remainder — typically 55–65%
  const carbsCals = calories - proteinCals - fatCals;
  const carbsG    = Math.round(carbsCals / 4);

  return { protein: proteinG, carbs: carbsG, fat: fatG };
}

function getBMI(weight, height) {
  const h = height / 100;
  const bmi = weight / (h * h);
  // Asian BMI cutoffs (WHO Asia-Pacific — lower than Western standards)
  let label, color;
  if      (bmi < 18.5) { label = 'Underweight'; color = '#54a0ff'; }
  else if (bmi < 23)   { label = 'Normal';       color = '#00c896'; }  // Asian normal: 18.5–23
  else if (bmi < 27.5) { label = 'Overweight';   color = '#ff9f43'; }  // Asian overweight: 23–27.5
  else                  { label = 'Obese';        color = '#ff6b6b'; }
  return { value: bmi.toFixed(1), label, color };
}

const shadow = (color = '#000', opacity = 0.08, radius = 10, y = 3) => ({
  shadowColor: color,
  shadowOffset: { width: 0, height: y },
  shadowOpacity: opacity,
  shadowRadius: radius,
  elevation: Math.round(radius / 2),
});

// ── Result card shown once calculated ──────────────────────────────────────
function ResultCard({ result, weight, C, ff, onEdit }) {
  const goalData  = GOALS.find(g => g.key === result.goal);
  const macros    = getMacros(result.targetCals, result.goal, weight);
  const macroList = [
    { label: 'Protein', val: macros.protein, unit: 'g', color: '#00c896', icon: '🥩', note: 'dal · eggs · paneer' },
    { label: 'Carbs',   val: macros.carbs,   unit: 'g', color: '#ff9f43', icon: '🍚', note: 'rice · roti · oats'  },
    { label: 'Fat',     val: macros.fat,     unit: 'g', color: '#7b61ff', icon: '🥜', note: 'nuts · ghee · oil'   },
  ];

  return (
    <Animated.View entering={FadeIn.duration(350)}>
      {/* ── Target calories hero ── */}
      <View style={{
        backgroundColor: C.card, borderRadius: 22,
        overflow: 'hidden', marginBottom: 12,
        borderWidth: 1, borderColor: C.border,
        borderTopWidth: 3, borderTopColor: C.accent,
        ...shadow(C.accent, 0.12, 14, 4),
      }}>
        <View style={{ padding: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <View>
              <Text style={[{ fontSize: 11, color: C.textSub, letterSpacing: 1, marginBottom: 4 }, ff.heading]}>
                DAILY TARGET
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 5 }}>
                <Text style={[{ fontSize: 52, color: C.accent, lineHeight: 56, letterSpacing: -1 }, ff.display]}>
                  {result.targetCals}
                </Text>
                <Text style={[{ fontSize: 14, color: C.textSub }, ff.body]}>kcal</Text>
              </View>
              <Text style={[{ fontSize: 12, color: C.textSub, marginTop: 2 }, ff.body]}>
                TDEE {result.tdee} · {goalData?.label}  {goalData?.icon}
              </Text>
            </View>

            {/* BMI chip */}
            <View style={{
              backgroundColor: result.bmi.color + '18',
              borderRadius: 16, padding: 14, alignItems: 'center',
              borderWidth: 1.5, borderColor: result.bmi.color + '40',
              minWidth: 80,
            }}>
              <Text style={[{ fontSize: 22, color: result.bmi.color, letterSpacing: -0.5 }, ff.display]}>
                {result.bmi.value}
              </Text>
              <Text style={[{ fontSize: 10, color: result.bmi.color, marginTop: 2 }, ff.heading]}>
                {result.bmi.label}
              </Text>
              <Text style={[{ fontSize: 9, color: C.textSub, marginTop: 2 }, ff.body]}>BMI (Asian)</Text>
            </View>
          </View>
        </View>

        {/* Macro row */}
        <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: C.border }}>
          {macroList.map((m, i) => (
            <View
              key={m.label}
              style={{
                flex: 1, alignItems: 'center', paddingVertical: 14,
                borderRightWidth: i < 2 ? 1 : 0,
                borderRightColor: C.border,
              }}
            >
              <Text style={{ fontSize: 16 }}>{m.icon}</Text>
              <Text style={[{ fontSize: 20, color: m.color, marginTop: 4 }, ff.display]}>
                {m.val}<Text style={[{ fontSize: 11, color: C.textSub }, ff.body]}>{m.unit}</Text>
              </Text>
              <Text style={[{ fontSize: 10, color: C.textSub, marginTop: 1 }, ff.heading]}>
                {m.label.toUpperCase()}
              </Text>
              <Text style={[{ fontSize: 9, color: C.textSub, marginTop: 2, textAlign: 'center', paddingHorizontal: 4 }, ff.body]}>
                {m.note}
              </Text>
            </View>
          ))}
        </View>

        {/* Edit button */}
        <TouchableOpacity
          onPress={onEdit}
          style={{
            borderTopWidth: 1, borderTopColor: C.border,
            paddingVertical: 12, alignItems: 'center',
            flexDirection: 'row', justifyContent: 'center', gap: 6,
          }}
        >
          <Text style={{ fontSize: 13 }}>✏️</Text>
          <Text style={[{ fontSize: 13, color: C.textSub }, ff.body]}>Edit inputs</Text>
        </TouchableOpacity>
      </View>

      {/* ── All 3 targets ── */}
      <Text style={[{ fontSize: 11, color: C.textSub, letterSpacing: 1, marginBottom: 10, marginTop: 6 }, ff.heading]}>
        ALL TARGETS
      </Text>
      {[
        { label: 'Cut',      cal: result.deficit,  desc: '−300 kcal deficit', color: '#00c896', icon: '📉', goalKey: 'cut'      },
        { label: 'Maintain', cal: result.tdee,     desc: 'TDEE baseline',     color: '#54a0ff', icon: '⚖️', goalKey: 'maintain' },
        { label: 'Bulk',     cal: result.surplus,  desc: '+200 kcal surplus', color: '#7b61ff', icon: '📈', goalKey: 'bulk'     },
      ].map(r => {
        const isActive = result.goal === r.goalKey;
        return (
          <View key={r.label} style={{
            flexDirection: 'row', alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: isActive ? r.color + '12' : C.card,
            borderRadius: 16, padding: 16, marginBottom: 8,
            borderWidth: isActive ? 1.5 : 1,
            borderColor: isActive ? r.color + '60' : C.border,
            borderLeftWidth: 3, borderLeftColor: r.color,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Text style={{ fontSize: 20 }}>{r.icon}</Text>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={[{ fontSize: 14, color: C.text }, ff.heading]}>{r.label}</Text>
                  {isActive && (
                    <View style={{ backgroundColor: r.color + '25', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 }}>
                      <Text style={[{ fontSize: 10, color: r.color }, ff.heading]}>Your goal</Text>
                    </View>
                  )}
                </View>
                <Text style={[{ fontSize: 11, color: C.textSub, marginTop: 2 }, ff.body]}>{r.desc}</Text>
              </View>
            </View>
            <Text style={[{ fontSize: 22, color: r.color }, ff.display]}>
              {r.cal}<Text style={[{ fontSize: 11, color: C.textSub }, ff.body]}> kcal</Text>
            </Text>
          </View>
        );
      })}

      <Text style={[{ fontSize: 11, color: C.textSub, textAlign: 'center', marginTop: 8, fontStyle: 'italic', lineHeight: 17 }, ff.body]}>
        Based on Mifflin-St Jeor + ICMR/NIN Indian dietary guidelines.{'\n'}
        Asian BMI cutoffs applied. Adjust ±100 kcal per weekly progress.
      </Text>
    </Animated.View>
  );
}

// ── Main screen ─────────────────────────────────────────────────────────────
export default function CaloriesScreen() {
  const { scheme: C, font: F } = useTheme();
  const ff = {
    display:  { fontFamily: F.display },
    heading:  { fontFamily: F.heading },
    body:     { fontFamily: F.body },
    bodySemi: { fontFamily: F.bodySemi },
  };

  const { user } = useAuth();
  const [age,       setAge]      = useState('');
  const [weight,    setWeight]   = useState('');
  const [height,    setHeight]   = useState('');
  const [gender,    setGender]   = useState('male');
  const [activity,  setActivity] = useState(1.55);
  const [goal,      setGoal]     = useState('maintain');
  const [result,    setResult]   = useState(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setAge(''); setWeight(''); setHeight('');
    setGender('male'); setActivity(1.55); setGoal('maintain');
    setResult(null); setCollapsed(false);

    AsyncStorage.getItem(getStorageKey(user?.uid || 'guest')).then(raw => {
      if (raw) { try { applyProfile(JSON.parse(raw)); } catch (_) {} }
    });
    if (user?.uid) {
      getCalorieProfile(user.uid).then(profile => {
        if (profile) {
          applyProfile(profile);
          AsyncStorage.setItem(getStorageKey(user.uid), JSON.stringify(profile));
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
    if (!a || !w || !h) return Alert.alert('Missing info', 'Please fill in age, weight and height.');
    // Mifflin-St Jeor BMR
    const bmr = gender === 'male'
      ? 10 * w + 6.25 * h - 5 * a + 5
      : 10 * w + 6.25 * h - 5 * a - 161;
    const tdee        = Math.round(bmr * activity);
    const targetCals  = tdee + GOALS.find(g => g.key === goal).adjust;
    const bmi         = getBMI(w, h);
    const newResult   = { tdee, deficit: tdee - 300, surplus: tdee + 200, targetCals, bmi, goal };
    setResult(newResult);
    setCollapsed(true);
    const profile = { age, weight, height, gender, activity, goal, result: newResult };
    AsyncStorage.setItem(getStorageKey(user?.uid || 'guest'), JSON.stringify(profile));
    if (user?.uid) saveCalorieProfile(user.uid, profile).catch(() => {});
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 64, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── HEADER ── */}
        <Animated.View entering={FadeInDown.duration(400)} style={{ marginBottom: 24 }}>
          <Text style={[{ fontSize: 26, color: C.text, letterSpacing: -0.5 }, ff.display]}>
            Calorie Calculator
          </Text>
          <Text style={[{ fontSize: 13, color: C.textSub, marginTop: 3 }, ff.body]}>
            Indian dietary guidelines · ICMR/NIN standards
          </Text>
        </Animated.View>

        {/* ── RESULT ── */}
        {result && (
          <ResultCard
            result={result}
            weight={parseFloat(weight)}
            C={C} ff={ff}
            onEdit={() => setCollapsed(false)}
          />
        )}

        {/* ── INPUTS ── */}
        {collapsed && result ? (
          <TouchableOpacity
            onPress={() => setCollapsed(false)}
            style={{
              flexDirection: 'row', alignItems: 'center',
              backgroundColor: C.card, borderRadius: 16,
              padding: 14, borderWidth: 1, borderColor: C.border,
              marginTop: 12,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={[{ fontSize: 10, color: C.textSub, letterSpacing: 1, marginBottom: 3 }, ff.heading]}>
                CURRENT INPUTS
              </Text>
              <Text style={[{ fontSize: 13, color: C.text }, ff.body]}>
                {gender === 'male' ? '♂️' : '♀️'} {age} yrs · {weight} kg · {height} cm · {ACTIVITY.find(a => a.key === activity)?.label}
              </Text>
            </View>
            <Text style={[{ fontSize: 22, color: C.textSub }, ff.body]}>›</Text>
          </TouchableOpacity>
        ) : (
          <Animated.View entering={FadeInDown.duration(380)}>

            {/* Gender */}
            <Text style={[{ fontSize: 11, color: C.textSub, letterSpacing: 1, marginBottom: 10, marginTop: result ? 16 : 0 }, ff.heading]}>
              GENDER
            </Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
              {['male', 'female'].map(g => (
                <TouchableOpacity
                  key={g}
                  onPress={() => setGender(g)}
                  activeOpacity={0.8}
                  style={{
                    flex: 1, flexDirection: 'row', alignItems: 'center',
                    justifyContent: 'center', gap: 8,
                    backgroundColor: gender === g ? C.accent + '18' : C.card,
                    borderRadius: 14, padding: 14,
                    borderWidth: 1.5,
                    borderColor: gender === g ? C.accent + '80' : C.border,
                  }}
                >
                  <Text style={{ fontSize: 20 }}>{g === 'male' ? '♂️' : '♀️'}</Text>
                  <Text style={[{ fontSize: 14, color: gender === g ? C.accent : C.textSub }, ff.heading]}>
                    {g === 'male' ? 'Male' : 'Female'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Stats */}
            <Text style={[{ fontSize: 11, color: C.textSub, letterSpacing: 1, marginBottom: 10 }, ff.heading]}>
              YOUR STATS
            </Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
              {[
                { label: 'Age',    value: age,    setter: setAge,    unit: 'yrs' },
                { label: 'Weight', value: weight, setter: setWeight, unit: 'kg'  },
                { label: 'Height', value: height, setter: setHeight, unit: 'cm'  },
              ].map(f => (
                <View key={f.label} style={{
                  flex: 1, backgroundColor: C.card,
                  borderRadius: 14, padding: 14,
                  borderWidth: 1, borderColor: C.border,
                }}>
                  <Text style={[{ fontSize: 10, color: C.textSub, letterSpacing: 0.5, marginBottom: 6 }, ff.heading]}>
                    {f.label.toUpperCase()}
                  </Text>
                  <TextInput
                    style={[{ fontSize: 26, color: C.text }, ff.display]}
                    placeholder="0"
                    placeholderTextColor={C.border}
                    value={f.value}
                    onChangeText={f.setter}
                    keyboardType="decimal-pad"
                  />
                  <Text style={[{ fontSize: 11, color: C.textSub }, ff.body]}>{f.unit}</Text>
                </View>
              ))}
            </View>

            {/* Goal */}
            <Text style={[{ fontSize: 11, color: C.textSub, letterSpacing: 1, marginBottom: 10 }, ff.heading]}>
              GOAL
            </Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
              {GOALS.map(g => {
                const gColor = g.key === 'cut' ? '#00c896' : g.key === 'maintain' ? '#54a0ff' : '#7b61ff';
                return (
                  <TouchableOpacity
                    key={g.key}
                    onPress={() => setGoal(g.key)}
                    activeOpacity={0.8}
                    style={{
                      flex: 1, alignItems: 'center', gap: 4,
                      backgroundColor: goal === g.key ? gColor + '18' : C.card,
                      borderRadius: 14, padding: 14,
                      borderWidth: 1.5,
                      borderColor: goal === g.key ? gColor + '80' : C.border,
                    }}
                  >
                    <Text style={{ fontSize: 22 }}>{g.icon}</Text>
                    <Text style={[{ fontSize: 13, color: goal === g.key ? gColor : C.text }, ff.heading]}>
                      {g.label}
                    </Text>
                    <Text style={[{ fontSize: 10, color: C.textSub }, ff.body]}>{g.desc}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Activity */}
            <Text style={[{ fontSize: 11, color: C.textSub, letterSpacing: 1, marginBottom: 10 }, ff.heading]}>
              ACTIVITY LEVEL
            </Text>
            <View style={{ gap: 8, marginBottom: 24 }}>
              {ACTIVITY.map(a => (
                <TouchableOpacity
                  key={a.key}
                  onPress={() => setActivity(a.key)}
                  activeOpacity={0.8}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 14,
                    backgroundColor: activity === a.key ? C.accent + '12' : C.card,
                    borderRadius: 14, padding: 14,
                    borderWidth: 1.5,
                    borderColor: activity === a.key ? C.accent + '70' : C.border,
                    borderLeftWidth: 3,
                    borderLeftColor: activity === a.key ? C.accent : C.border,
                  }}
                >
                  <Text style={{ fontSize: 22 }}>{a.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[{ fontSize: 14, color: activity === a.key ? C.accent : C.text }, ff.heading]}>
                      {a.label}
                    </Text>
                    <Text style={[{ fontSize: 11, color: C.textSub, marginTop: 2 }, ff.body]}>
                      {a.desc}
                    </Text>
                  </View>
                  {activity === a.key && (
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: C.accent }} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Calculate button */}
            <TouchableOpacity
              onPress={calculate}
              activeOpacity={0.85}
              style={{
                height: 56, borderRadius: 18,
                backgroundColor: C.accent,
                alignItems: 'center', justifyContent: 'center',
                ...shadow(C.accent, 0.3, 14, 5),
              }}
            >
              <Text style={[{ color: C.bg, fontSize: 17 }, ff.heading]}>
                {result ? 'Recalculate 🔄' : 'Calculate 🔥'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}

      </ScrollView>
    </View>
  );
}
