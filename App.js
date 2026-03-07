import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { onAuthStateChanged } from 'firebase/auth';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth } from './services/firebase';
import { WorkoutsProvider } from './hooks/WorkoutsContext';
import DashboardScreen from './components/screens/DashboardScreen';
import CalendarScreen from './components/screens/CalendarScreen';
import MeasurementsScreen from './components/screens/MeasurementsScreen';
import CaloriesScreen from './components/screens/CaloriesScreen';
import MuscleMapScreen from './components/screens/MuscleMapScreen';
import LoginScreen from './components/screens/LoginScreen';
import RegisterScreen from './components/screens/RegisterScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabNavigator() {
  const insets = useSafeAreaInsets();
  return (
    <WorkoutsProvider>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#0e1219',
            borderTopColor: '#1e2535',
            borderTopWidth: 1,
            height: 40 + insets.bottom,
            paddingBottom: insets.bottom,
            paddingTop: 5,
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
              <View style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: focused ? 'rgba(0,245,196,0.12)' : 'transparent' }}>
                <Ionicons name={icons[route.name]} size={22} color={focused ? '#00f5c4' : '#6b7a99'} />
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
    </WorkoutsProvider>
  );
}

export default function App() {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return unsub;
  }, []);

  if (user === undefined) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: '#080b10', alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#00f5c4" />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {user ? (
            <Stack.Screen name="Main" component={TabNavigator} />
          ) : (
            <>
              <Stack.Screen name="Login"    component={LoginScreen}    />
              <Stack.Screen name="Register" component={RegisterScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}