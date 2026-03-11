import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { onAuthStateChanged } from 'firebase/auth';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';

import { auth } from './services/firebase';
import { WorkoutsProvider } from './hooks/WorkoutsContext';
import { ThemeProvider, useTheme } from './hooks/ThemeContext';

import DashboardScreen      from './components/screens/DashboardScreen';
import CalendarScreen       from './components/screens/CalendarScreen';
import MeasurementsScreen   from './components/screens/MeasurementsScreen';
import CaloriesScreen       from './components/screens/CaloriesScreen';
import MuscleMapScreen      from './components/screens/MuscleMapScreen';
import FeedScreen           from './components/screens/FeedScreen';
import ProfileScreen        from './components/screens/ProfileScreen';
import LoginScreen          from './components/screens/LoginScreen';
import RegisterScreen       from './components/screens/RegisterScreen';
import WorkoutSessionScreen from './components/screens/WorkoutSessionScreen';
import LogWorkoutScreen     from './components/screens/LogWorkoutScreen';
import WorkoutShareScreen   from './components/screens/WorkoutShareScreen';

SplashScreen.preventAutoHideAsync();

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabNavigator() {
  const insets        = useSafeAreaInsets();
  const { scheme: C } = useTheme();

  return (
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: C.surface,
            borderTopColor:  C.border,
            borderTopWidth:  1.5,
            height:          60 + insets.bottom,
            paddingBottom:   insets.bottom,
            paddingTop:      8,
          },
          tabBarShowLabel: false,
          tabBarIcon: ({ focused }) => {
            const icons = {
              Dashboard:    focused ? 'home'     : 'home-outline',
              Calendar:     focused ? 'calendar' : 'calendar-outline',
              Measurements: focused ? 'body'     : 'body-outline',
              Calories:     focused ? 'flame'    : 'flame-outline',
              MuscleMap:    focused ? 'fitness'  : 'fitness-outline',
            };
            return (
              <View style={{
                width: 44, height: 44,
                alignItems: 'center', justifyContent: 'center',
                backgroundColor: focused ? `${C.accent}22` : 'transparent',
              }}>
                <Ionicons name={icons[route.name]} size={22} color={focused ? C.accent : C.textSub} />
                {focused && (
                  <View style={{ width: 4, height: 4, backgroundColor: C.accent, marginTop: 3 }} />
                )}
              </View>
            );
          },
        })}
      >
        <Tab.Screen name="Dashboard"    component={DashboardScreen}    />
        <Tab.Screen name="Calendar"     component={CalendarScreen}     />
        <Tab.Screen name="Measurements" component={MeasurementsScreen} />
        <Tab.Screen name="Calories"     component={CaloriesScreen}     />
        <Tab.Screen name="MuscleMap"    component={MuscleMapScreen}    />
      </Tab.Navigator>
  );
}

function MainStack() {
  return (
    <WorkoutsProvider>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs"           component={TabNavigator}         />
        <Stack.Screen name="Feed"           component={FeedScreen}           />
        <Stack.Screen name="UserProfile"    component={ProfileScreen}        />
        <Stack.Screen name="WorkoutSession" component={WorkoutSessionScreen} options={{ gestureEnabled: false }} />
        <Stack.Screen name="LogWorkout"     component={LogWorkoutScreen}     />
        <Stack.Screen name="WorkoutShare"   component={WorkoutShareScreen}   options={{ gestureEnabled: true, presentation: 'card' }} />
      </Stack.Navigator>
    </WorkoutsProvider>
  );
}

function AppInner() {
  const { scheme: C } = useTheme();
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return unsub;
  }, []);

  if (user === undefined) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={C.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="Main" component={MainStack} />
        ) : (
          <>
            <Stack.Screen name="Login"    component={LoginScreen}    />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    // ── Barlow (default) ────────────────────────────────
    'BarlowCondensed-Black':    require('./assets/fonts/BarlowCondensed-Black.ttf'),
    'BarlowCondensed-Bold':     require('./assets/fonts/BarlowCondensed-Bold.ttf'),
    'Barlow-Regular':           require('./assets/fonts/Barlow-Regular.ttf'),
    'Barlow-SemiBold':          require('./assets/fonts/Barlow-SemiBold.ttf'),
    // ── Nunito (Rounded) ────────────────────────────────
    'Nunito-Regular':           require('./assets/fonts/Nunito-Regular.ttf'),
    'Nunito-Bold':              require('./assets/fonts/Nunito-Bold.ttf'),
    'Nunito-ExtraBold':         require('./assets/fonts/Nunito-ExtraBold.ttf'),
    // ── Playfair Display (Serif) ─────────────────────────
    'PlayfairDisplay-Regular':  require('./assets/fonts/PlayfairDisplay-Regular.ttf'),
    'PlayfairDisplay-Bold':     require('./assets/fonts/PlayfairDisplay-Bold.ttf'),
    'PlayfairDisplay-ExtraBold':require('./assets/fonts/PlayfairDisplay-ExtraBold.ttf'),
    // ── DM Sans (Minimal) ────────────────────────────────
    'DMSans-Regular':           require('./assets/fonts/DMSans-Regular.ttf'),
    'DMSans-Bold':              require('./assets/fonts/DMSans-Bold.ttf'),
    'DMSans-ExtraBold':         require('./assets/fonts/DMSans-ExtraBold.ttf'),
    // ── JetBrains Mono (Mono) ────────────────────────────
    'JetBrainsMono-Regular':    require('./assets/fonts/JetBrainsMono-Regular.ttf'),
    'JetBrainsMono-Bold':       require('./assets/fonts/JetBrainsMono-Bold.ttf'),
    'JetBrainsMono-ExtraBold':  require('./assets/fonts/JetBrainsMono-ExtraBold.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppInner />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
