import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WorkoutShareSheet from './WorkoutShareSheet';

/**
 * WorkoutShareScreen
 * A full-screen wrapper around WorkoutShareSheet so it can be navigated to
 * via navigation.replace('WorkoutShare', { workout, streak, userName, userId }).
 *
 * WorkoutShareSheet's onClose → pops back to Dashboard (popToTop).
 */
export default function WorkoutShareScreen({ route, navigation }) {
  const { workout, streak, userName, userId } = route.params;
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <WorkoutShareSheet
        workout={workout}
        streak={streak ?? 0}
        userName={userName ?? 'Athlete'}
        userId={userId}
        navigation={navigation}
        onClose={() => navigation.popToTop()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0e1219' },
});
