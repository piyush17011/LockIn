const fs = require('fs');
const path = require('path');

function write(filePath, content) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content.trimStart());
  console.log('✓', filePath);
}

// ─── constants/theme.js ──────────────────────────────────────────────────────
write('constants/theme.js', `
export const Colors = {
  bg: '#080b10',
  surface: '#0e1219',
  card: '#131822',
  border: '#1e2535',
  accent: '#00f5c4',
  accentDim: 'rgba(0,245,196,0.15)',
  accentDim2: 'rgba(0,245,196,0.08)',
  purple: '#7b61ff',
  purpleDim: 'rgba(123,97,255,0.15)',
  red: '#ff6b6b',
  orange: '#ff9f43',
  blue: '#54a0ff',
  text: '#e8edf5',
  textSub: '#a0aec0',
  muted: '#6b7a99',
  white: '#ffffff',
};
export const Spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
export const Radius = { sm: 8, md: 12, lg: 16, xl: 24, full: 999 };
`);

// ─── constants/exercises.js ──────────────────────────────────────────────────
write('constants/exercises.js', `
export const MUSCLE_EXERCISES = {
  chest: { label: 'Chest', color: '#ff6b6b', exercises: ['Bench Press','Incline Bench Press','Decline Bench Press','Cable Fly','Dumbbell Fly','Push-Ups','Chest Dips'] },
  back: { label: 'Back', color: '#54a0ff', exercises: ['Pull-Ups','Barbell Rows','Seated Cable Rows','Lat Pulldown','Deadlifts','T-Bar Rows','Face Pulls'] },
  shoulders: { label: 'Shoulders', color: '#7b61ff', exercises: ['Overhead Press','Lateral Raises','Front Raises','Arnold Press','Rear Delt Fly','Upright Rows'] },
  biceps: { label: 'Biceps', color: '#00f5c4', exercises: ['Barbell Curl','Dumbbell Curl','Hammer Curl','Preacher Curl','Concentration Curl','Cable Curl'] },
  triceps: { label: 'Triceps', color: '#ff9f43', exercises: ['Tricep Pushdown','Skull Crushers','Overhead Extension','Close-Grip Bench','Tricep Dips','Kickbacks'] },
  abs: { label: 'Abs', color: '#00f5c4', exercises: ['Crunches','Leg Raises','Planks','Russian Twists','Cable Crunches','Hanging Knee Raises','Ab Rollouts'] },
  quads: { label: 'Quads', color: '#ff6b6b', exercises: ['Squats','Leg Press','Lunges','Leg Extensions','Bulgarian Split Squat','Hack Squat','Step-Ups'] },
  hamstrings: { label: 'Hamstrings', color: '#54a0ff', exercises: ['Romanian Deadlift','Leg Curl','Good Mornings','Glute-Ham Raises','Sumo Deadlift','Nordic Curl'] },
  glutes: { label: 'Glutes', color: '#7b61ff', exercises: ['Hip Thrust','Glute Bridge','Cable Kickbacks','Sumo Squat','Donkey Kicks','Step-Ups'] },
  calves: { label: 'Calves', color: '#ff9f43', exercises: ['Standing Calf Raise','Seated Calf Raise','Donkey Calf Raise','Jump Rope','Leg Press Calf Raise'] },
};

export const WORKOUT_TYPES = ['Push','Pull','Legs','Upper Body','Lower Body','Full Body','Cardio','HIIT','Mobility','Custom'];

export const QUOTES = [
  { text: 'Lock in. No excuses.', author: 'LockIn' },
  { text: 'The pain you feel today is the strength you feel tomorrow.', author: 'Unknown' },
  { text: 'Discipline is the bridge between goals and accomplishment.', author: 'Jim Rohn' },
  { text: "Don't limit your challenges. Challenge your limits.", author: 'Unknown' },
  { text: 'The only bad workout is the one that did not happen.', author: 'Unknown' },
];
`);

// ─── services/firebase.js ────────────────────────────────────────────────────
write('services/firebase.js', `
import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 🔑 Replace with your Firebase config
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_AUTH_DOMAIN',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_STORAGE_BUCKET',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let auth;
try {
  auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
} catch {
  auth = getAuth(app);
}

const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
`);

// ─── services/authService.js ─────────────────────────────────────────────────
write('services/authService.js', `
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

export const registerUser = async (email, password, displayName) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName });
  await setDoc(doc(db, 'users', cred.user.uid), {
    uid: cred.user.uid, email, displayName,
    createdAt: serverTimestamp(), streak: 0, longestStreak: 0, lastWorkoutDate: null,
  });
  return cred.user;
};

export const loginUser = (email, password) => signInWithEmailAndPassword(auth, email, password);
export const logoutUser = () => signOut(auth);
`);

// ─── services/workoutService.js ──────────────────────────────────────────────
write('services/workoutService.js', `
import { collection, doc, addDoc, updateDoc, getDocs, getDoc, query, where, orderBy, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import { format } from 'date-fns';

export const logWorkout = async (userId, workoutData) => {
  const ref = await addDoc(collection(db, 'workouts'), {
    userId, ...workoutData,
    date: workoutData.date || format(new Date(), 'yyyy-MM-dd'),
    createdAt: serverTimestamp(),
  });
  await updateStreak(userId);
  return ref.id;
};

export const getUserWorkouts = async (userId) => {
  const q = query(collection(db, 'workouts'), where('userId', '==', userId), orderBy('date', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getWorkoutByDate = async (userId, date) => {
  const q = query(collection(db, 'workouts'), where('userId', '==', userId), where('date', '==', date));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const deleteWorkout = async (workoutId) => deleteDoc(doc(db, 'workouts', workoutId));

export const updateStreak = async (userId) => {
  const userRef = doc(db, 'users', userId);
  const snap = await getDoc(userRef);
  const data = snap.data();
  const today = format(new Date(), 'yyyy-MM-dd');
  if (data.lastWorkoutDate === today) return;
  const yesterday = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');
  const streak = data.lastWorkoutDate === yesterday ? (data.streak || 0) + 1 : 1;
  const longestStreak = Math.max(streak, data.longestStreak || 0);
  await updateDoc(userRef, { streak, longestStreak, lastWorkoutDate: today });
};
`);

// ─── services/measurementService.js ─────────────────────────────────────────
write('services/measurementService.js', `
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export const addMeasurement = (userId, data) =>
  addDoc(collection(db, 'measurements'), { userId, ...data, createdAt: serverTimestamp() });

export const getMeasurements = async (userId) => {
  const q = query(collection(db, 'measurements'), where('userId', '==', userId), orderBy('createdAt', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};
`);

// ─── hooks/useAuth.js ────────────────────────────────────────────────────────
write('hooks/useAuth.js', `
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) { setUserData(null); setLoading(false); return; }
      const ref = doc(db, 'users', firebaseUser.uid);
      const unsubDoc = onSnapshot(ref, (snap) => { setUserData(snap.data()); setLoading(false); });
      return unsubDoc;
    });
    return unsub;
  }, []);

  return { user, userData, loading };
};
`);

// ─── hooks/useWorkouts.js ────────────────────────────────────────────────────
write('hooks/useWorkouts.js', `
import { useState, useEffect } from 'react';
import { getUserWorkouts } from '../services/workoutService';

export const useWorkouts = (userId) => {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!userId) return;
    setLoading(true);
    try { const data = await getUserWorkouts(userId); setWorkouts(data); }
    finally { setLoading(false); }
  };

  useEffect(() => { refresh(); }, [userId]);
  return { workouts, loading, refresh };
};
`);

// ─── app/_layout.tsx ─────────────────────────────────────────────────────────
write('app/_layout.tsx', `
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => { SplashScreen.hideAsync(); }, []);
  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="light" backgroundColor="#080b10" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#080b10' } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </GestureHandlerRootView>
  );
}
const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: '#080b10' } });
`);

// ─── app/index.jsx ───────────────────────────────────────────────────────────
write('app/index.jsx', `
import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';

export default function Index() {
  const router = useRouter();
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) router.replace('/(tabs)/dashboard');
      else router.replace('/(auth)/login');
    });
    return unsub;
  }, []);
  return <View style={styles.container}><ActivityIndicator size="large" color="#00f5c4" /></View>;
}
const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#080b10', alignItems: 'center', justifyContent: 'center' } });
`);

// ─── app/(auth)/_layout.tsx ──────────────────────────────────────────────────
write('app/(auth)/_layout.tsx', `
import { Stack } from 'expo-router';
export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#080b10' } }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
`);

write('app/(auth)/login.jsx', `import LoginScreen from '../../components/screens/LoginScreen';\nexport default LoginScreen;\n`);
write('app/(auth)/register.jsx', `import RegisterScreen from '../../components/screens/RegisterScreen';\nexport default RegisterScreen;\n`);

// ─── app/(tabs)/_layout.tsx ──────────────────────────────────────────────────
write('app/(tabs)/_layout.tsx', `
import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

function TabIcon({ name, focused }) {
  return (
    <View style={[styles.iconWrap, focused && styles.active]}>
      <Ionicons name={name} size={22} color={focused ? '#00f5c4' : '#6b7a99'} />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarStyle: styles.tabBar, tabBarShowLabel: false }}>
      <Tabs.Screen name="dashboard"    options={{ tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'home' : 'home-outline'} focused={focused} /> }} />
      <Tabs.Screen name="calendar"     options={{ tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'calendar' : 'calendar-outline'} focused={focused} /> }} />
      <Tabs.Screen name="measurements" options={{ tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'body' : 'body-outline'} focused={focused} /> }} />
      <Tabs.Screen name="calories"     options={{ tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'flame' : 'flame-outline'} focused={focused} /> }} />
      <Tabs.Screen name="musclemap"    options={{ tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'fitness' : 'fitness-outline'} focused={focused} /> }} />
    </Tabs>
  );
}
const styles = StyleSheet.create({
  tabBar: { backgroundColor: '#0e1219', borderTopColor: '#1e2535', borderTopWidth: 1, height: 72, paddingBottom: 12, paddingTop: 8 },
  iconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  active: { backgroundColor: 'rgba(0,245,196,0.12)' },
});
`);

write('app/(tabs)/dashboard.jsx',    `import DashboardScreen from '../../components/screens/DashboardScreen';\nexport default DashboardScreen;\n`);
write('app/(tabs)/calendar.jsx',     `import CalendarScreen from '../../components/screens/CalendarScreen';\nexport default CalendarScreen;\n`);
write('app/(tabs)/measurements.jsx', `import MeasurementsScreen from '../../components/screens/MeasurementsScreen';\nexport default MeasurementsScreen;\n`);
write('app/(tabs)/calories.jsx',     `import CaloriesScreen from '../../components/screens/CaloriesScreen';\nexport default CaloriesScreen;\n`);
write('app/(tabs)/musclemap.jsx',    `import MuscleMapScreen from '../../components/screens/MuscleMapScreen';\nexport default MuscleMapScreen;\n`);

// ─── components/screens/LoginScreen.jsx ─────────────────────────────────────
write('components/screens/LoginScreen.jsx', `
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, ScrollView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { loginUser } from '../../services/authService';
import { Colors, Spacing, Radius } from '../../constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Error', 'Fill in all fields');
    setLoading(true);
    try {
      await loginUser(email.trim(), password);
      router.replace('/(tabs)/dashboard');
    } catch (e) { Alert.alert('Login Failed', e.message); }
    finally { setLoading(false); }
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={['rgba(0,245,196,0.08)', 'transparent']} style={styles.gradTop} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Animated.View entering={FadeInUp.duration(600)} style={styles.logoArea}>
            <View style={styles.logoBox}><Text style={styles.logoIcon}>🔒</Text></View>
            <Text style={styles.appName}>LOCK<Text style={styles.accent}>IN</Text></Text>
            <Text style={styles.tagline}>Lock in. Level up.</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(700).delay(200)} style={styles.card}>
            <Text style={styles.heading}>Welcome back</Text>

            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={18} color={Colors.muted} style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="Email" placeholderTextColor={Colors.muted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            </View>

            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color={Colors.muted} style={styles.inputIcon} />
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="Password" placeholderTextColor={Colors.muted} value={password} onChangeText={setPassword} secureTextEntry={!showPass} />
              <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                <Ionicons name={showPass ? 'eye-outline' : 'eye-off-outline'} size={18} color={Colors.muted} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={[styles.btn, loading && { opacity: 0.6 }]} onPress={handleLogin} disabled={loading}>
              <LinearGradient colors={['#00f5c4', '#00c9a7']} style={styles.btnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={styles.btnText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/(auth)/register')} style={styles.switchRow}>
              <Text style={styles.switchText}>No account? </Text>
              <Text style={[styles.switchText, { color: Colors.accent, fontWeight: '600' }]}>Create one</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  gradTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 300 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: Spacing.lg },
  logoArea: { alignItems: 'center', marginBottom: Spacing.xl },
  logoBox: { width: 72, height: 72, borderRadius: Radius.xl, backgroundColor: 'rgba(0,245,196,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md, borderWidth: 1, borderColor: 'rgba(0,245,196,0.3)' },
  logoIcon: { fontSize: 32 },
  appName: { fontSize: 36, fontWeight: '800', color: Colors.text, letterSpacing: 4 },
  accent: { color: Colors.accent },
  tagline: { color: Colors.muted, marginTop: 4, fontSize: 13 },
  card: { backgroundColor: Colors.card, borderRadius: Radius.xl, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  heading: { fontSize: 22, fontWeight: '700', color: Colors.text, marginBottom: Spacing.lg },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md, paddingHorizontal: Spacing.md, height: 52 },
  inputIcon: { marginRight: Spacing.sm },
  input: { flex: 1, color: Colors.text, fontSize: 15 },
  btn: { borderRadius: Radius.md, overflow: 'hidden', marginTop: Spacing.sm },
  btnGrad: { height: 52, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: Colors.bg, fontWeight: '700', fontSize: 16 },
  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.lg },
  switchText: { color: Colors.muted, fontSize: 14 },
});
`);

// ─── components/screens/RegisterScreen.jsx ───────────────────────────────────
write('components/screens/RegisterScreen.jsx', `
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, ScrollView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { registerUser } from '../../services/authService';
import { Colors, Spacing, Radius } from '../../constants/theme';

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) return Alert.alert('Error', 'Fill in all fields');
    if (password.length < 6) return Alert.alert('Error', 'Password must be 6+ characters');
    setLoading(true);
    try {
      await registerUser(email.trim(), password, name.trim());
      router.replace('/(tabs)/dashboard');
    } catch (e) { Alert.alert('Register Failed', e.message); }
    finally { setLoading(false); }
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={['rgba(123,97,255,0.08)', 'transparent']} style={styles.gradTop} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Animated.View entering={FadeInUp.duration(600)} style={styles.logoArea}>
            <View style={styles.logoBox}><Text style={styles.logoIcon}>⚡</Text></View>
            <Text style={styles.appName}>LOCK<Text style={styles.accent}>IN</Text></Text>
            <Text style={styles.tagline}>Start your journey today</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(700).delay(200)} style={styles.card}>
            <Text style={styles.heading}>Create account</Text>
            {[
              { icon: 'person-outline', placeholder: 'Display Name', value: name, setter: setName, cap: 'words' },
              { icon: 'mail-outline', placeholder: 'Email', value: email, setter: setEmail, kb: 'email-address' },
              { icon: 'lock-closed-outline', placeholder: 'Password (6+ chars)', value: password, setter: setPassword, secure: true },
            ].map((f) => (
              <View key={f.placeholder} style={styles.inputWrap}>
                <Ionicons name={f.icon} size={18} color={Colors.muted} style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder={f.placeholder} placeholderTextColor={Colors.muted} value={f.value} onChangeText={f.setter} keyboardType={f.kb} secureTextEntry={f.secure} autoCapitalize={f.cap || 'none'} />
              </View>
            ))}
            <TouchableOpacity style={[styles.btn, loading && { opacity: 0.6 }]} onPress={handleRegister} disabled={loading}>
              <LinearGradient colors={['#7b61ff', '#5a42e8']} style={styles.btnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={styles.btnText}>{loading ? 'Creating...' : 'Create Account'}</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.back()} style={styles.switchRow}>
              <Text style={styles.switchText}>Already have an account? </Text>
              <Text style={[styles.switchText, { color: '#7b61ff', fontWeight: '600' }]}>Sign In</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  gradTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 300 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: Spacing.lg },
  logoArea: { alignItems: 'center', marginBottom: Spacing.xl },
  logoBox: { width: 72, height: 72, borderRadius: Radius.xl, backgroundColor: 'rgba(123,97,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md, borderWidth: 1, borderColor: 'rgba(123,97,255,0.3)' },
  logoIcon: { fontSize: 32 },
  appName: { fontSize: 36, fontWeight: '800', color: Colors.text, letterSpacing: 4 },
  accent: { color: Colors.accent },
  tagline: { color: Colors.muted, marginTop: 4, fontSize: 13 },
  card: { backgroundColor: Colors.card, borderRadius: Radius.xl, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  heading: { fontSize: 22, fontWeight: '700', color: Colors.text, marginBottom: Spacing.lg },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md, paddingHorizontal: Spacing.md, height: 52 },
  inputIcon: { marginRight: Spacing.sm },
  input: { flex: 1, color: Colors.text, fontSize: 15 },
  btn: { borderRadius: Radius.md, overflow: 'hidden', marginTop: Spacing.sm },
  btnGrad: { height: 52, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.lg },
  switchText: { color: Colors.muted, fontSize: 14 },
});
`);

// ─── components/screens/DashboardScreen.jsx ──────────────────────────────────
write('components/screens/DashboardScreen.jsx', `
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInRight, useSharedValue, useAnimatedStyle, withSpring, withRepeat, withSequence } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useWorkouts } from '../../hooks/useWorkouts';
import { logoutUser } from '../../services/authService';
import { QUOTES } from '../../constants/exercises';
import { Colors, Spacing, Radius } from '../../constants/theme';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';

const WEEK_DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

export default function DashboardScreen() {
  const { user, userData } = useAuth();
  const { workouts } = useWorkouts(user?.uid);
  const router = useRouter();
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  const streakScale = useSharedValue(1);

  useEffect(() => {
    streakScale.value = withRepeat(withSequence(withSpring(1.06), withSpring(1)), -1, true);
  }, []);

  const streakStyle = useAnimatedStyle(() => ({ transform: [{ scale: streakScale.value }] }));

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), i));
  const workedOutDates = new Set(workouts.map((w) => w.date));
  const streak = userData?.streak || 0;
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const workedOutToday = workedOutDates.has(todayStr);
  const weekCount = weekDays.filter((d) => workedOutDates.has(format(d, 'yyyy-MM-dd'))).length;

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
          <LinearGradient colors={['rgba(0,245,196,0.1)', 'transparent']} style={styles.headerGrad} />
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>Good {getTimeOfDay()},</Text>
              <Text style={styles.name}>{userData?.displayName || 'Athlete'} 👋</Text>
            </View>
            <TouchableOpacity onPress={() => logoutUser()} style={styles.logoutBtn}>
              <Ionicons name="log-out-outline" size={22} color={Colors.muted} />
            </TouchableOpacity>
          </View>
          <View style={styles.quoteCard}>
            <Text style={styles.quoteText}>"{quote.text}"</Text>
            <Text style={styles.quoteAuthor}>— {quote.author}</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.statRow}>
          <Animated.View style={[styles.streakCard, streakStyle]}>
            <LinearGradient colors={['rgba(0,245,196,0.2)', 'rgba(0,245,196,0.05)']} style={styles.streakGrad}>
              <Text style={styles.streakFire}>🔥</Text>
              <Text style={styles.streakNum}>{streak}</Text>
              <Text style={styles.streakLabel}>Day Streak</Text>
              <Text style={styles.streakSub}>Best: {userData?.longestStreak || 0}</Text>
            </LinearGradient>
          </Animated.View>
          <View style={styles.statRight}>
            <View style={[styles.statSmall, workedOutToday && styles.statSmallActive]}>
              <Ionicons name={workedOutToday ? 'checkmark-circle' : 'ellipse-outline'} size={28} color={workedOutToday ? Colors.accent : Colors.muted} />
              <Text style={styles.statSmallLabel}>{workedOutToday ? 'Today: Done ✓' : 'Today: Rest'}</Text>
            </View>
            <View style={styles.statSmall}>
              <Text style={styles.weekNum}>{weekCount}<Text style={{ fontSize: 18, color: Colors.muted }}>/7</Text></Text>
              <Text style={styles.statSmallLabel}>This Week</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(200)} style={styles.weekCard}>
          <Text style={styles.sectionTitle}>Weekly Overview</Text>
          <View style={styles.weekRow}>
            {weekDays.map((day, i) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const isToday = isSameDay(day, new Date());
              const worked = workedOutDates.has(dateStr);
              return (
                <View key={i} style={styles.dayCol}>
                  <Text style={[styles.dayLabel, isToday && { color: Colors.accent }]}>{WEEK_DAYS[i]}</Text>
                  <View style={[styles.dayDot, worked && styles.dayDotFilled, isToday && { borderColor: Colors.accent }]}>
                    {worked && <Ionicons name="checkmark" size={12} color={Colors.bg} />}
                  </View>
                  <Text style={styles.dayDate}>{format(day, 'd')}</Text>
                </View>
              );
            })}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(300)}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            {[
              { label: 'Log Workout', icon: 'barbell-outline', color: Colors.accent, tab: '/(tabs)/calendar' },
              { label: 'Measurements', icon: 'body-outline', color: Colors.purple, tab: '/(tabs)/measurements' },
              { label: 'Calories', icon: 'flame-outline', color: Colors.orange, tab: '/(tabs)/calories' },
              { label: 'Muscle Map', icon: 'fitness-outline', color: Colors.blue, tab: '/(tabs)/musclemap' },
            ].map((action, i) => (
              <Animated.View key={action.label} entering={FadeInRight.duration(400).delay(350 + i * 60)}>
                <TouchableOpacity style={styles.actionCard} onPress={() => router.push(action.tab)}>
                  <View style={[styles.actionIcon, { backgroundColor: action.color + '22' }]}>
                    <Ionicons name={action.icon} size={24} color={action.color} />
                  </View>
                  <Text style={styles.actionLabel}>{action.label}</Text>
                  <Ionicons name="chevron-forward" size={16} color={Colors.muted} />
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {workouts.length > 0 && (
          <Animated.View entering={FadeInDown.duration(500).delay(400)}>
            <Text style={styles.sectionTitle}>Recent Workouts</Text>
            {workouts.slice(0, 3).map((w) => (
              <View key={w.id} style={styles.recentCard}>
                <View>
                  <Text style={styles.recentType}>{w.type || 'Workout'}</Text>
                  <Text style={styles.recentDate}>{w.date}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  {w.exercises?.length > 0 && <Text style={styles.recentExCount}>{w.exercises.length} exercises</Text>}
                  <Ionicons name="checkmark-circle" size={20} color={Colors.accent} />
                </View>
              </View>
            ))}
          </Animated.View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.lg, paddingTop: 60 },
  header: { marginBottom: Spacing.lg },
  headerGrad: { position: 'absolute', top: -60, left: -20, right: -20, height: 250 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.md },
  greeting: { color: Colors.muted, fontSize: 14 },
  name: { color: Colors.text, fontSize: 24, fontWeight: '800', marginTop: 2 },
  logoutBtn: { padding: 8, backgroundColor: Colors.surface, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border },
  quoteCard: { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, borderLeftWidth: 3, borderLeftColor: Colors.accent },
  quoteText: { color: Colors.textSub, fontSize: 13, fontStyle: 'italic', lineHeight: 20 },
  quoteAuthor: { color: Colors.muted, fontSize: 12, marginTop: 6 },
  statRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg },
  streakCard: { flex: 1, borderRadius: Radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(0,245,196,0.3)' },
  streakGrad: { padding: Spacing.md, alignItems: 'center', justifyContent: 'center', minHeight: 140 },
  streakFire: { fontSize: 32 },
  streakNum: { fontSize: 48, fontWeight: '800', color: Colors.accent, lineHeight: 56 },
  streakLabel: { color: Colors.text, fontWeight: '600', fontSize: 13 },
  streakSub: { color: Colors.muted, fontSize: 12, marginTop: 2 },
  statRight: { flex: 1, gap: Spacing.md },
  statSmall: { flex: 1, backgroundColor: Colors.card, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  statSmallActive: { borderColor: 'rgba(0,245,196,0.3)', backgroundColor: 'rgba(0,245,196,0.08)' },
  statSmallLabel: { color: Colors.muted, fontSize: 12, marginTop: 4, textAlign: 'center' },
  weekNum: { fontSize: 32, fontWeight: '800', color: Colors.text },
  weekCard: { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.md },
  dayCol: { alignItems: 'center', gap: 4 },
  dayLabel: { color: Colors.muted, fontSize: 12, fontWeight: '600' },
  dayDot: { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  dayDotFilled: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  dayDate: { color: Colors.muted, fontSize: 11 },
  sectionTitle: { color: Colors.text, fontSize: 16, fontWeight: '700', marginBottom: Spacing.md },
  actionGrid: { gap: Spacing.sm, marginBottom: Spacing.lg },
  actionCard: { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  actionIcon: { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  actionLabel: { flex: 1, color: Colors.text, fontWeight: '600', fontSize: 15 },
  recentCard: { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  recentType: { color: Colors.text, fontWeight: '600', fontSize: 15 },
  recentDate: { color: Colors.muted, fontSize: 12, marginTop: 2 },
  recentExCount: { color: Colors.muted, fontSize: 12 },
});
`);

// ─── components/screens/CalendarScreen.jsx ───────────────────────────────────
write('components/screens/CalendarScreen.jsx', `
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { Calendar } from 'react-native-calendars';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { logWorkout, getWorkoutByDate, deleteWorkout } from '../../services/workoutService';
import { WORKOUT_TYPES } from '../../constants/exercises';
import { Colors, Spacing, Radius } from '../../constants/theme';
import { format } from 'date-fns';

export default function CalendarScreen() {
  const { user } = useAuth();
  const [selected, setSelected] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [markedDates, setMarkedDates] = useState({});
  const [dayWorkouts, setDayWorkouts] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [workoutType, setWorkoutType] = useState('Push');
  const [notes, setNotes] = useState('');
  const [exercises, setExercises] = useState([{ name: '', sets: '', reps: '', weight: '' }]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadDayWorkouts(selected); }, [selected]);

  const loadDayWorkouts = async (date) => {
    if (!user) return;
    const data = await getWorkoutByDate(user.uid, date);
    setDayWorkouts(data);
    if (data.length > 0) setMarkedDates((prev) => ({ ...prev, [date]: { marked: true, dotColor: Colors.accent } }));
  };

  const handleSave = async () => {
    if (!exercises[0].name) return Alert.alert('Error', 'Add at least one exercise');
    setLoading(true);
    try {
      await logWorkout(user.uid, { type: workoutType, exercises, notes, date: selected });
      setModalVisible(false);
      setExercises([{ name: '', sets: '', reps: '', weight: '' }]);
      setNotes('');
      await loadDayWorkouts(selected);
      Alert.alert('🔥 Logged!', 'Workout saved. Keep grinding!');
    } catch (e) { Alert.alert('Error', e.message); }
    finally { setLoading(false); }
  };

  const handleDelete = (id) => Alert.alert('Delete', 'Are you sure?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: async () => { await deleteWorkout(id); await loadDayWorkouts(selected); } },
  ]);

  const updateExercise = (idx, field, val) => {
    const updated = [...exercises];
    updated[idx][field] = val;
    setExercises(updated);
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(500)}>
          <Text style={styles.pageTitle}>Workout Calendar</Text>
          <Text style={styles.pageSub}>Tap a date to log workouts</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.calWrap}>
          <Calendar
            onDayPress={(day) => setSelected(day.dateString)}
            markedDates={{ ...markedDates, [selected]: { ...(markedDates[selected] || {}), selected: true, selectedColor: Colors.accent } }}
            theme={{ backgroundColor: Colors.card, calendarBackground: Colors.card, dayTextColor: Colors.text, textDisabledColor: Colors.muted, monthTextColor: Colors.text, arrowColor: Colors.accent, selectedDayBackgroundColor: Colors.accent, selectedDayTextColor: Colors.bg, todayTextColor: Colors.accent, dotColor: Colors.accent, textMonthFontSize: 16, textMonthFontWeight: '700' }}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(200)}>
          <View style={styles.dayHeader}>
            <Text style={styles.dayTitle}>{format(new Date(selected + 'T12:00:00'), 'EEEE, MMM d')}</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
              <Ionicons name="add" size={20} color={Colors.bg} />
              <Text style={styles.addBtnText}>Log</Text>
            </TouchableOpacity>
          </View>

          {dayWorkouts.length === 0 ? (
            <View style={styles.emptyDay}>
              <Text style={{ fontSize: 40 }}>😴</Text>
              <Text style={styles.emptyText}>No workouts logged</Text>
              <Text style={styles.emptySub}>Tap Log to add one</Text>
            </View>
          ) : dayWorkouts.map((w) => (
            <Animated.View key={w.id} entering={FadeIn.duration(300)} style={styles.workoutCard}>
              <View style={styles.workoutCardHeader}>
                <View style={styles.typeBadge}><Text style={styles.typeBadgeText}>{w.type}</Text></View>
                <TouchableOpacity onPress={() => handleDelete(w.id)}><Ionicons name="trash-outline" size={18} color={Colors.red} /></TouchableOpacity>
              </View>
              {w.exercises?.map((ex, i) => (
                <View key={i} style={styles.exRow}>
                  <Text style={styles.exName}>{ex.name}</Text>
                  <Text style={styles.exDetail}>{ex.sets}x{ex.reps} @ {ex.weight}kg</Text>
                </View>
              ))}
              {w.notes ? <Text style={styles.workoutNote}>📝 {w.notes}</Text> : null}
            </Animated.View>
          ))}
        </Animated.View>
        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Log Workout</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={24} color={Colors.text} /></TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.fieldLabel}>Workout Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
              {WORKOUT_TYPES.map((t) => (
                <TouchableOpacity key={t} style={[styles.typeChip, workoutType === t && styles.typeChipActive]} onPress={() => setWorkoutType(t)}>
                  <Text style={[styles.typeChipText, workoutType === t && { color: Colors.accent }]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.fieldLabel}>Exercises</Text>
            {exercises.map((ex, i) => (
              <View key={i} style={styles.exInputCard}>
                <TextInput style={styles.exInputFull} placeholder="Exercise name" placeholderTextColor={Colors.muted} value={ex.name} onChangeText={(v) => updateExercise(i, 'name', v)} />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {['sets', 'reps', 'weight'].map((f) => (
                    <TextInput key={f} style={styles.exInputSmall} placeholder={f} placeholderTextColor={Colors.muted} value={ex[f]} onChangeText={(v) => updateExercise(i, f, v)} keyboardType="numeric" />
                  ))}
                </View>
              </View>
            ))}
            <TouchableOpacity style={styles.addExBtn} onPress={() => setExercises([...exercises, { name: '', sets: '', reps: '', weight: '' }])}>
              <Ionicons name="add-circle-outline" size={18} color={Colors.accent} />
              <Text style={{ color: Colors.accent, fontWeight: '600', marginLeft: 6 }}>Add Exercise</Text>
            </TouchableOpacity>
            <Text style={styles.fieldLabel}>Notes</Text>
            <TextInput style={styles.notesInput} placeholder="How did it go?" placeholderTextColor={Colors.muted} value={notes} onChangeText={setNotes} multiline numberOfLines={3} />
            <TouchableOpacity style={[styles.saveBtn, loading && { opacity: 0.6 }]} onPress={handleSave} disabled={loading}>
              <Text style={styles.saveBtnText}>{loading ? 'Saving...' : '🔥 Save Workout'}</Text>
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
  pageTitle: { fontSize: 28, fontWeight: '800', color: Colors.text },
  pageSub: { color: Colors.muted, fontSize: 14, marginBottom: Spacing.lg, marginTop: 4 },
  calWrap: { borderRadius: Radius.xl, overflow: 'hidden', marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  dayTitle: { color: Colors.text, fontSize: 18, fontWeight: '700' },
  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.accent, borderRadius: Radius.full, paddingHorizontal: 16, paddingVertical: 8, gap: 4 },
  addBtnText: { color: Colors.bg, fontWeight: '700', fontSize: 14 },
  emptyDay: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: Colors.text, fontSize: 16, fontWeight: '600', marginTop: 8 },
  emptySub: { color: Colors.muted, fontSize: 14, marginTop: 4 },
  workoutCard: { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  workoutCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  typeBadge: { backgroundColor: 'rgba(0,245,196,0.15)', borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 4 },
  typeBadgeText: { color: Colors.accent, fontWeight: '700', fontSize: 12 },
  exRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  exName: { color: Colors.text, fontSize: 14 },
  exDetail: { color: Colors.muted, fontSize: 13 },
  workoutNote: { color: Colors.muted, fontSize: 13, marginTop: Spacing.sm, fontStyle: 'italic' },
  modal: { flex: 1, backgroundColor: Colors.bg, padding: Spacing.lg, paddingTop: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  modalTitle: { fontSize: 22, fontWeight: '800', color: Colors.text },
  fieldLabel: { color: Colors.muted, fontSize: 13, fontWeight: '600', marginBottom: Spacing.sm, marginTop: Spacing.md, textTransform: 'uppercase', letterSpacing: 1 },
  typeChip: { borderRadius: Radius.full, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: Colors.border, marginRight: Spacing.sm, backgroundColor: Colors.card },
  typeChipActive: { backgroundColor: 'rgba(0,245,196,0.15)', borderColor: Colors.accent },
  typeChipText: { color: Colors.muted, fontWeight: '600', fontSize: 13 },
  exInputCard: { backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  exInputFull: { color: Colors.text, fontSize: 15, borderBottomWidth: 1, borderColor: Colors.border, paddingBottom: 8, marginBottom: 8 },
  exInputSmall: { flex: 1, color: Colors.text, backgroundColor: Colors.surface, borderRadius: Radius.sm, padding: Spacing.sm, textAlign: 'center', fontSize: 14 },
  addExBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm },
  notesInput: { backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md, color: Colors.text, borderWidth: 1, borderColor: Colors.border, textAlignVertical: 'top', minHeight: 80 },
  saveBtn: { backgroundColor: Colors.accent, borderRadius: Radius.lg, height: 54, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.lg },
  saveBtnText: { color: Colors.bg, fontWeight: '800', fontSize: 16 },
});
`);

// ─── components/screens/MeasurementsScreen.jsx ───────────────────────────────
write('components/screens/MeasurementsScreen.jsx', `
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
  { key: 'weight', label: 'Weight', unit: 'kg', icon: '⚖️', color: Colors.accent },
  { key: 'arm', label: 'Arm', unit: 'cm', icon: '💪', color: Colors.purple },
  { key: 'chest', label: 'Chest', unit: 'cm', icon: '🫀', color: Colors.red },
  { key: 'waist', label: 'Waist', unit: 'cm', icon: '📏', color: Colors.orange },
  { key: 'quads', label: 'Quads', unit: 'cm', icon: '🦵', color: Colors.blue },
  { key: 'calves', label: 'Calves', unit: 'cm', icon: '🦶', color: Colors.accent },
  { key: 'bodyFat', label: 'Body Fat', unit: '%', icon: '📊', color: Colors.purple },
];

export default function MeasurementsScreen() {
  const { user } = useAuth();
  const [measurements, setMeasurements] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [activeMetric, setActiveMetric] = useState('weight');
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadMeasurements(); }, []);

  const loadMeasurements = async () => {
    if (!user) return;
    const data = await getMeasurements(user.uid);
    setMeasurements(data);
  };

  const handleSave = async () => {
    if (!Object.values(form).some((v) => v !== '')) return Alert.alert('Error', 'Enter at least one measurement');
    setLoading(true);
    try {
      const entry = {};
      METRICS.forEach(({ key }) => { if (form[key]) entry[key] = parseFloat(form[key]); });
      await addMeasurement(user.uid, entry);
      setModalVisible(false); setForm({});
      await loadMeasurements();
    } catch (e) { Alert.alert('Error', e.message); }
    finally { setLoading(false); }
  };

  const getHistory = (key) => measurements.filter((m) => m[key] !== undefined).map((m) => m[key]);
  const getLatest = (key) => { const v = getHistory(key); return v.length > 0 ? v[v.length - 1] : null; };
  const getChange = (key) => { const v = getHistory(key); return v.length < 2 ? null : (v[v.length - 1] - v[0]).toFixed(1); };

  const activeHistory = getHistory(activeMetric);
  const activeM = METRICS.find((m) => m.key === activeMetric);

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(500)}>
          <View style={styles.pageHeader}>
            <View><Text style={styles.pageTitle}>Measurements</Text><Text style={styles.pageSub}>Track your body progress</Text></View>
            <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
              <Ionicons name="add" size={22} color={Colors.bg} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        <View style={styles.metricsGrid}>
          {METRICS.map((m) => {
            const latest = getLatest(m.key);
            const change = getChange(m.key);
            return (
              <TouchableOpacity key={m.key} style={[styles.metricCard, activeMetric === m.key && { borderColor: m.color }]} onPress={() => setActiveMetric(m.key)}>
                <Text style={styles.metricIcon}>{m.icon}</Text>
                <Text style={styles.metricLabel}>{m.label}</Text>
                <Text style={[styles.metricVal, { color: m.color }]}>{latest !== null ? latest + m.unit : '–'}</Text>
                {change !== null && <Text style={{ fontSize: 12, fontWeight: '600', color: parseFloat(change) < 0 ? Colors.accent : Colors.red }}>{parseFloat(change) >= 0 ? '+' : ''}{change}</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        {activeHistory.length >= 2 && (
          <Animated.View entering={FadeInDown.duration(500).delay(200)} style={styles.chartCard}>
            <Text style={styles.chartTitle}>{activeM?.label} Progress</Text>
            <LineChart
              data={{ labels: activeHistory.map((_, i) => '#' + (i + 1)), datasets: [{ data: activeHistory, color: () => activeM?.color || Colors.accent, strokeWidth: 2 }] }}
              width={width - Spacing.lg * 2 - Spacing.md * 2}
              height={180}
              chartConfig={{ backgroundColor: Colors.card, backgroundGradientFrom: Colors.card, backgroundGradientTo: Colors.card, decimalPlaces: 1, color: () => activeM?.color || Colors.accent, labelColor: () => Colors.muted, propsForDots: { r: '4', strokeWidth: '2', stroke: activeM?.color }, propsForBackgroundLines: { stroke: Colors.border } }}
              bezier style={{ borderRadius: Radius.md }}
            />
          </Animated.View>
        )}

        {measurements.length === 0 && (
          <View style={styles.empty}>
            <Text style={{ fontSize: 48 }}>📏</Text>
            <Text style={styles.emptyText}>No measurements yet</Text>
            <Text style={styles.emptySub}>Tap + to log your first entry</Text>
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Measurements</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={24} color={Colors.text} /></TouchableOpacity>
          </View>
          <ScrollView>
            {METRICS.map((m) => (
              <View key={m.key} style={styles.formRow}>
                <Text style={styles.formIcon}>{m.icon}</Text>
                <Text style={styles.formLabel}>{m.label} ({m.unit})</Text>
                <TextInput style={styles.formInput} placeholder="–" placeholderTextColor={Colors.muted} value={form[m.key] || ''} onChangeText={(v) => setForm({ ...form, [m.key]: v })} keyboardType="decimal-pad" />
              </View>
            ))}
            <TouchableOpacity style={[styles.saveBtn, loading && { opacity: 0.6 }]} onPress={handleSave} disabled={loading}>
              <Text style={styles.saveBtnText}>{loading ? 'Saving...' : 'Save Measurements'}</Text>
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
  chartCard: { backgroundColor: Colors.card, borderRadius: Radius.xl, padding: Spacing.md, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  chartTitle: { color: Colors.text, fontSize: 16, fontWeight: '700', marginBottom: Spacing.md },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { color: Colors.text, fontSize: 18, fontWeight: '700', marginTop: 12 },
  emptySub: { color: Colors.muted, fontSize: 14, marginTop: 4 },
  modal: { flex: 1, backgroundColor: Colors.bg, padding: Spacing.lg, paddingTop: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  modalTitle: { fontSize: 22, fontWeight: '800', color: Colors.text },
  formRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  formIcon: { fontSize: 20, marginRight: Spacing.sm },
  formLabel: { flex: 1, color: Colors.text, fontSize: 15 },
  formInput: { color: Colors.accent, fontWeight: '700', fontSize: 16, textAlign: 'right', minWidth: 60 },
  saveBtn: { backgroundColor: Colors.accent, borderRadius: Radius.lg, height: 54, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.lg },
  saveBtnText: { color: Colors.bg, fontWeight: '800', fontSize: 16 },
});
`);

// ─── components/screens/CaloriesScreen.jsx ───────────────────────────────────
write('components/screens/CaloriesScreen.jsx', `
import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Radius } from '../../constants/theme';

const ACTIVITY = [
  { key: 1.2, label: 'Sedentary', desc: 'Little/no exercise', icon: '🛋️' },
  { key: 1.375, label: 'Light', desc: '1–3x/week', icon: '🚶' },
  { key: 1.55, label: 'Moderate', desc: '3–5x/week', icon: '🏃' },
  { key: 1.725, label: 'Active', desc: '6–7x/week', icon: '💪' },
  { key: 1.9, label: 'Very Active', desc: 'Athlete level', icon: '🔥' },
];

export default function CaloriesScreen() {
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [gender, setGender] = useState('male');
  const [activity, setActivity] = useState(1.55);
  const [result, setResult] = useState(null);

  const calculate = () => {
    const a = parseInt(age), w = parseFloat(weight), h = parseFloat(height);
    if (!a || !w || !h) return;
    const bmr = gender === 'male' ? 10 * w + 6.25 * h - 5 * a + 5 : 10 * w + 6.25 * h - 5 * a - 161;
    const tdee = Math.round(bmr * activity);
    setResult({ tdee, deficit: tdee - 500, surplus: tdee + 300 });
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(500)}>
          <Text style={styles.pageTitle}>Calorie Calculator</Text>
          <Text style={styles.pageSub}>Find your daily calorie target</Text>
        </Animated.View>

        <Text style={styles.sectionLabel}>Gender</Text>
        <View style={styles.genderRow}>
          {['male', 'female'].map((g) => (
            <TouchableOpacity key={g} style={[styles.genderBtn, gender === g && styles.genderBtnActive]} onPress={() => setGender(g)}>
              <Text style={styles.genderIcon}>{g === 'male' ? '♂️' : '♀️'}</Text>
              <Text style={[styles.genderText, gender === g && { color: Colors.accent }]}>{g.charAt(0).toUpperCase() + g.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Your Stats</Text>
        <View style={styles.inputGrid}>
          {[
            { label: 'Age', value: age, setter: setAge, suffix: 'yrs' },
            { label: 'Weight', value: weight, setter: setWeight, suffix: 'kg' },
            { label: 'Height', value: height, setter: setHeight, suffix: 'cm' },
          ].map((f) => (
            <View key={f.label} style={styles.inputCard}>
              <Text style={styles.inputLabel}>{f.label}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                <TextInput style={styles.input} placeholder="0" placeholderTextColor={Colors.muted} value={f.value} onChangeText={f.setter} keyboardType="decimal-pad" />
                <Text style={styles.inputSuffix}>{f.suffix}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Activity Level</Text>
        {ACTIVITY.map((a) => (
          <TouchableOpacity key={a.key} style={[styles.activityCard, activity === a.key && styles.activityCardActive]} onPress={() => setActivity(a.key)}>
            <Text style={{ fontSize: 24 }}>{a.icon}</Text>
            <View style={{ flex: 1, marginLeft: Spacing.md }}>
              <Text style={[styles.activityLabel, activity === a.key && { color: Colors.accent }]}>{a.label}</Text>
              <Text style={styles.activityDesc}>{a.desc}</Text>
            </View>
            {activity === a.key && <View style={styles.activeDot} />}
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.calcBtn} onPress={calculate}>
          <LinearGradient colors={['#00f5c4', '#00c9a7']} style={styles.calcBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.calcBtnText}>Calculate 🔥</Text>
          </LinearGradient>
        </TouchableOpacity>

        {result && (
          <Animated.View entering={FadeInDown.duration(600)} style={{ gap: Spacing.sm }}>
            <Text style={[styles.sectionLabel, { marginTop: 0 }]}>Your Results</Text>
            {[
              { label: 'Calorie Deficit', cal: result.deficit, desc: 'For fat loss', color: Colors.accent, icon: '📉' },
              { label: 'Maintenance', cal: result.tdee, desc: 'Your TDEE baseline', color: Colors.blue, icon: '⚖️' },
              { label: 'Calorie Surplus', cal: result.surplus, desc: 'For muscle gain', color: Colors.purple, icon: '📈' },
            ].map((r) => (
              <View key={r.label} style={[styles.resultCard, { borderColor: r.color + '40' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                  <Text style={{ fontSize: 24 }}>{r.icon}</Text>
                  <View><Text style={styles.resultLabel}>{r.label}</Text><Text style={styles.resultDesc}>{r.desc}</Text></View>
                </View>
                <Text style={[styles.resultCal, { color: r.color }]}>{r.cal}<Text style={{ fontSize: 12, color: Colors.muted }}> kcal</Text></Text>
              </View>
            ))}
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
  pageSub: { color: Colors.muted, fontSize: 14, marginBottom: Spacing.lg, marginTop: 4 },
  sectionLabel: { color: Colors.muted, fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.sm, marginTop: Spacing.lg },
  genderRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.sm },
  genderBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  genderBtnActive: { borderColor: Colors.accent, backgroundColor: 'rgba(0,245,196,0.1)' },
  genderIcon: { fontSize: 20 },
  genderText: { color: Colors.muted, fontWeight: '600', fontSize: 15 },
  inputGrid: { flexDirection: 'row', gap: Spacing.sm },
  inputCard: { flex: 1, backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  inputLabel: { color: Colors.muted, fontSize: 12, fontWeight: '600', marginBottom: 6 },
  input: { flex: 1, color: Colors.text, fontSize: 22, fontWeight: '800' },
  inputSuffix: { color: Colors.muted, fontSize: 12 },
  activityCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  activityCardActive: { borderColor: Colors.accent, backgroundColor: 'rgba(0,245,196,0.08)' },
  activityLabel: { color: Colors.textSub, fontWeight: '600', fontSize: 14 },
  activityDesc: { color: Colors.muted, fontSize: 12, marginTop: 2 },
  activeDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.accent },
  calcBtn: { borderRadius: Radius.lg, overflow: 'hidden', marginTop: Spacing.lg, marginBottom: Spacing.lg },
  calcBtnGrad: { height: 56, alignItems: 'center', justifyContent: 'center' },
  calcBtnText: { color: Colors.bg, fontWeight: '800', fontSize: 18 },
  resultCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1 },
  resultLabel: { color: Colors.text, fontWeight: '700', fontSize: 14 },
  resultDesc: { color: Colors.muted, fontSize: 12, marginTop: 2 },
  resultCal: { fontSize: 24, fontWeight: '800' },
});
`);

// ─── components/screens/MuscleMapScreen.jsx ──────────────────────────────────
write('components/screens/MuscleMapScreen.jsx', `
import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import Svg, { Ellipse, Path } from 'react-native-svg';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { MUSCLE_EXERCISES } from '../../constants/exercises';
import { Colors, Spacing, Radius } from '../../constants/theme';

const { width } = Dimensions.get('window');
const SVG_W = width - Spacing.lg * 2 - Spacing.md * 2;
const SVG_H = SVG_W * 1.4;

const FRONT_REGIONS = [
  { key: 'chest', cx: 100, cy: 110, rx: 32, ry: 22 },
  { key: 'shoulders', cx: 58, cy: 85, rx: 18, ry: 14 },
  { key: 'shoulders', cx: 142, cy: 85, rx: 18, ry: 14 },
  { key: 'biceps', cx: 46, cy: 128, rx: 12, ry: 20 },
  { key: 'biceps', cx: 154, cy: 128, rx: 12, ry: 20 },
  { key: 'abs', cx: 100, cy: 162, rx: 22, ry: 28 },
  { key: 'quads', cx: 80, cy: 238, rx: 20, ry: 34 },
  { key: 'quads', cx: 120, cy: 238, rx: 20, ry: 34 },
  { key: 'calves', cx: 80, cy: 318, rx: 12, ry: 22 },
  { key: 'calves', cx: 120, cy: 318, rx: 12, ry: 22 },
];

const BACK_REGIONS = [
  { key: 'back', cx: 100, cy: 108, rx: 32, ry: 38 },
  { key: 'triceps', cx: 46, cy: 128, rx: 12, ry: 20 },
  { key: 'triceps', cx: 154, cy: 128, rx: 12, ry: 20 },
  { key: 'glutes', cx: 100, cy: 194, rx: 30, ry: 22 },
  { key: 'hamstrings', cx: 80, cy: 248, rx: 18, ry: 32 },
  { key: 'hamstrings', cx: 120, cy: 248, rx: 18, ry: 32 },
  { key: 'calves', cx: 80, cy: 318, rx: 12, ry: 22 },
  { key: 'calves', cx: 120, cy: 318, rx: 12, ry: 22 },
];

function BodySVG({ regions, selected, onSelect }) {
  return (
    <Svg width={SVG_W} height={SVG_H} viewBox="0 0 200 370">
      <Ellipse cx="100" cy="35" rx="22" ry="28" fill="#1e2535" stroke="#252f42" strokeWidth="1.5" />
      <Path d="M65 65 Q55 70 45 75 L38 200 L55 200 L60 155 L60 280 L75 280 L78 200 L100 200 L122 200 L125 280 L140 280 L140 155 L145 200 L162 200 L155 75 Q145 70 135 65 Q120 58 100 58 Q80 58 65 65Z" fill="#1e2535" stroke="#252f42" strokeWidth="1.5" />
      <Path d="M60 280 L55 345 L65 345 L72 300 L75 345 L85 345 L88 280Z" fill="#1e2535" stroke="#252f42" strokeWidth="1.5" />
      <Path d="M140 280 L145 345 L135 345 L128 300 L125 345 L115 345 L112 280Z" fill="#1e2535" stroke="#252f42" strokeWidth="1.5" />
      {regions.map((r, i) => {
        const m = MUSCLE_EXERCISES[r.key];
        const isSelected = selected === r.key;
        return (
          <Ellipse key={i} cx={r.cx} cy={r.cy} rx={r.rx} ry={r.ry}
            fill={isSelected ? (m?.color || Colors.accent) : (m?.color + '33')}
            stroke={isSelected ? (m?.color || Colors.accent) : (m?.color + '66')}
            strokeWidth={isSelected ? 2 : 1}
            onPress={() => onSelect(r.key)}
          />
        );
      })}
    </Svg>
  );
}

export default function MuscleMapScreen() {
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState('front');
  const regions = view === 'front' ? FRONT_REGIONS : BACK_REGIONS;
  const selectedData = selected ? MUSCLE_EXERCISES[selected] : null;
  const uniqueKeys = [...new Set(regions.map((r) => r.key))];

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(500)}>
          <Text style={styles.pageTitle}>Muscle Map</Text>
          <Text style={styles.pageSub}>Tap a muscle to see exercises</Text>
        </Animated.View>

        <View style={styles.toggle}>
          {['front', 'back'].map((v) => (
            <TouchableOpacity key={v} style={[styles.toggleBtn, view === v && styles.toggleBtnActive]} onPress={() => { setView(v); setSelected(null); }}>
              <Text style={[styles.toggleText, view === v && styles.toggleTextActive]}>{v === 'front' ? 'Front' : 'Back'}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.svgWrap}>
          <BodySVG regions={regions} selected={selected} onSelect={(key) => setSelected(selected === key ? null : key)} />
        </View>

        <View style={styles.chipsRow}>
          {uniqueKeys.map((key) => {
            const m = MUSCLE_EXERCISES[key];
            return (
              <TouchableOpacity key={key} style={[styles.chip, selected === key && { backgroundColor: m?.color + '33', borderColor: m?.color }]} onPress={() => setSelected(selected === key ? null : key)}>
                <Text style={[styles.chipText, selected === key && { color: m?.color }]}>{m?.label || key}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {selectedData && (
          <Animated.View entering={FadeIn.duration(400)} style={[styles.exercisePanel, { borderColor: selectedData.color + '40' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm }}>
              <View style={[styles.muscleDot, { backgroundColor: selectedData.color }]} />
              <Text style={[styles.muscleTitle, { color: selectedData.color }]}>{selectedData.label}</Text>
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
  toggleTextActive: { color: Colors.bg },
  svgWrap: { alignItems: 'center', backgroundColor: Colors.card, borderRadius: Radius.xl, padding: Spacing.md, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  chip: { borderRadius: Radius.full, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.card },
  chipText: { color: Colors.muted, fontWeight: '600', fontSize: 13 },
  exercisePanel: { backgroundColor: Colors.card, borderRadius: Radius.xl, padding: Spacing.lg, borderWidth: 1, marginBottom: Spacing.lg },
  muscleDot: { width: 12, height: 12, borderRadius: 6 },
  muscleTitle: { fontSize: 20, fontWeight: '800' },
  exerciseSub: { color: Colors.muted, fontSize: 13, marginBottom: Spacing.md },
  exRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderColor: Colors.border, gap: Spacing.md },
  exNum: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  exNumText: { fontWeight: '700', fontSize: 13 },
  exName: { flex: 1, color: Colors.text, fontSize: 15 },
  hint: { alignItems: 'center', paddingVertical: Spacing.xl },
  hintText: { color: Colors.muted, fontSize: 14, textAlign: 'center' },
});
`);

console.log('\n✅ All files generated successfully!');
console.log('👉 Now add your Firebase config in services/firebase.js');
console.log('👉 Then run: npx expo start --clear');