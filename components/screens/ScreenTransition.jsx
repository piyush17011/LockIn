/**
 * ScreenTransition.jsx
 *
 * Full-screen Lottie overlay using your loginRegister.json dumbbell animation.
 *
 * Place loginRegister.json at:
 *   assets/animations/loginRegister.json
 *
 * Usage:
 *   <ScreenTransition
 *     visible={transitioning}
 *     destination="JOIN UP"
 *     onFinish={() => navigation.navigate('Register')}
 *   />
 */

import { useRef, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/ThemeContext';

export default function ScreenTransition({ visible, onFinish, destination }) {
  const { scheme: C, font: F } = useTheme();
  const animRef = useRef(null);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Snap fully opaque so origin screen is covered before animation starts
      opacity.value = withTiming(1, { duration: 80 });
      setTimeout(() => animRef.current?.play(), 60);
    }
  }, [visible]);

  const handleFinish = () => {
    // Step 1 — navigate WHILE overlay is still fully opaque.
    // New screen mounts invisibly behind it.
    runOnJS(onFinish)();

    // Step 2 — wait one frame for new screen to render, THEN fade out.
    // User sees: animation ends → new screen revealed. Zero flicker.
    setTimeout(() => {
      opacity.value = withTiming(0, { duration: 200 });
    }, 50);
  };

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  if (!visible) return null;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.overlay, { backgroundColor: C.bg }, animStyle]}>

      {/* Top accent tape */}
      <View style={[styles.tape, { backgroundColor: C.accent }]} />

      {/* Dumbbell Lottie — recolored to current theme accent */}
      <LottieView
        ref={animRef}
        source={require('../../assets/animations/loginRegister.json')}
        loop={false}
        autoPlay={false}
        style={styles.lottie}
        colorFilters={[
          { keypath: 'Layer 2 Outlines.Group 1.Fill 1', color: C.accent },
          { keypath: 'Layer 3 Outlines.Group 1.Fill 1', color: C.accent },
          { keypath: 'Layer 4 Outlines.Group 1.Fill 1', color: C.accent },
          { keypath: 'Layer 5 Outlines.Group 1.Fill 1', color: C.accent },
          { keypath: 'Layer 6 Outlines.Group 1.Fill 1', color: C.accent },
        ]}
        onAnimationFinish={handleFinish}
      />

      {/* Optional destination label */}
      {destination && (
        <Text style={[styles.destLabel, { color: C.accent, fontFamily: F.display }]}>
          {destination}
        </Text>
      )}

      {/* Bottom accent tape */}
      <View style={[styles.bottomTape, { backgroundColor: C.accent }]} />

    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    zIndex: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tape: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 4,
  },
  bottomTape: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 4,
  },
  lottie: {
    width: 280,
    height: 280,
  },
  destLabel: {
    fontSize: 42,
    letterSpacing: 6,
    marginTop: 12,
  },
});
