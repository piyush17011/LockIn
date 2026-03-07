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
