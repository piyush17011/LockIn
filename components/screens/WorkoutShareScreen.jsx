import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WorkoutShareSheet from './WorkoutShareSheet';

/**
 * WorkoutShareScreen — full-screen stack screen (NOT a modal).
 * Register in App.js with:
 *   <Stack.Screen
 *     name="WorkoutShare"
 *     component={WorkoutShareScreen}
 *     options={{ headerShown: false, gestureEnabled: true, presentation: 'card' }}
 *   />
 *
 * Navigate via: navigation.navigate('WorkoutShare', { workout, streak, userName, userId })
 * onClose → navigation.goBack()
 */
export default function WorkoutShareScreen({ route, navigation }) {
  const { workout, streak, userName, userId } = route.params;
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: '#080b10', paddingTop: 0 }}>
      <WorkoutShareSheet
        workout={workout}
        streak={streak ?? 0}
        userName={userName ?? 'Athlete'}
        userId={userId}
        navigation={navigation}
        onClose={() => {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Main', params: { screen: 'Tabs', params: { screen: 'Dashboard' } } }],
          });
        }}
      />
    </View>
  );
}
