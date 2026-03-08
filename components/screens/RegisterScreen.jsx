import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, ScrollView,
  Platform, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { registerUser } from '../../services/authService';
import { Colors, Spacing, Radius } from '../../constants/theme';

export default function RegisterScreen({ navigation }) {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [confirm, setConfirm]         = useState('');
  const [showPass, setShowPass]       = useState(false);
  const [loading, setLoading]         = useState(false);
  const [emailSent, setEmailSent]     = useState(false); // show success screen

  const handleRegister = async () => {
    if (!displayName || !email || !password || !confirm)
      return Alert.alert('Error', 'Fill in all fields');
    if (password.length < 6)
      return Alert.alert('Weak password', 'Password must be at least 6 characters.');
    if (password !== confirm)
      return Alert.alert('Mismatch', 'Passwords do not match.');

    setLoading(true);
    try {
      await registerUser(email.trim(), password, displayName.trim());
      // Show the "check your email" screen instead of navigating in
      setEmailSent(true);
    } catch (e) {
      Alert.alert('Register Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Email sent confirmation screen ───────────────────────────────────
  if (emailSent) {
    return (
      <View style={styles.root}>
        <LinearGradient colors={['rgba(0,245,196,0.08)', 'transparent']} style={styles.gradTop} />
        <Animated.View entering={FadeInUp.duration(500)} style={styles.confirmedWrap}>
          <View style={styles.confirmedIconWrap}>
            <Text style={styles.confirmedIcon}>📧</Text>
          </View>
          <Text style={styles.confirmedTitle}>Verify your email</Text>
          <Text style={styles.confirmedSub}>
            We sent a verification link to{'\n'}
            <Text style={{ color: Colors.accent, fontWeight: '600' }}>{email}</Text>
            {'\n\n'}Click the link in the email, then come back and sign in.
          </Text>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => navigation.navigate('Login')}
          >
            <LinearGradient
              colors={['#00f5c4', '#00c9a7']}
              style={styles.btnGrad}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              <Text style={styles.btnText}>Go to Sign In →</Text>
            </LinearGradient>
          </TouchableOpacity>
          <Text style={styles.spamNote}>
            Can't find the email? Check your spam folder.
          </Text>
        </Animated.View>
      </View>
    );
  }

  // ── Register form ────────────────────────────────────────────────────
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
            <Text style={styles.heading}>Create account</Text>

            {/* Name */}
            <View style={styles.inputWrap}>
              <Ionicons name="person-outline" size={18} color={Colors.muted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Your name"
                placeholderTextColor={Colors.muted}
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
              />
            </View>

            {/* Email */}
            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={18} color={Colors.muted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={Colors.muted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Password */}
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color={Colors.muted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Password"
                placeholderTextColor={Colors.muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                <Ionicons name={showPass ? 'eye-outline' : 'eye-off-outline'} size={18} color={Colors.muted} />
              </TouchableOpacity>
            </View>

            {/* Confirm Password */}
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color={Colors.muted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirm password"
                placeholderTextColor={Colors.muted}
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry={!showPass}
              />
            </View>

            {/* Register Button */}
            <TouchableOpacity
              style={[styles.btn, loading && { opacity: 0.6 }]}
              onPress={handleRegister}
              disabled={loading}
            >
              <LinearGradient
                colors={['#00f5c4', '#00c9a7']}
                style={styles.btnGrad}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              >
                {loading
                  ? <ActivityIndicator color={Colors.bg} />
                  : <Text style={styles.btnText}>Create Account</Text>
                }
              </LinearGradient>
            </TouchableOpacity>

            {/* Switch to Login */}
            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              style={styles.switchRow}
            >
              <Text style={styles.switchText}>Already have an account? </Text>
              <Text style={[styles.switchText, { color: Colors.accent, fontWeight: '600' }]}>Sign in</Text>
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
  logoBox: {
    width: 72, height: 72, borderRadius: Radius.xl,
    backgroundColor: 'rgba(0,245,196,0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1, borderColor: 'rgba(0,245,196,0.3)',
  },
  logoIcon: { fontSize: 32 },
  appName: { fontSize: 36, fontWeight: '800', color: Colors.text, letterSpacing: 4 },
  accent: { color: Colors.accent },
  tagline: { color: Colors.muted, marginTop: 4, fontSize: 13 },

  card: {
    backgroundColor: Colors.card, borderRadius: Radius.xl,
    padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border,
  },
  heading: { fontSize: 22, fontWeight: '700', color: Colors.text, marginBottom: Spacing.lg },

  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    marginBottom: Spacing.md, paddingHorizontal: Spacing.md, height: 52,
  },
  inputIcon: { marginRight: Spacing.sm },
  input: { flex: 1, color: Colors.text, fontSize: 15 },

  btn: { borderRadius: Radius.md, overflow: 'hidden', marginTop: Spacing.sm },
  btnGrad: { height: 52, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: Colors.bg, fontWeight: '700', fontSize: 16 },

  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.lg },
  switchText: { color: Colors.muted, fontSize: 14 },

  // Email confirmed screen
  confirmedWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl,
  },
  confirmedIconWrap: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: 'rgba(0,245,196,0.1)',
    borderWidth: 1, borderColor: 'rgba(0,245,196,0.3)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  confirmedIcon: { fontSize: 44 },
  confirmedTitle: {
    fontSize: 26, fontWeight: '800', color: Colors.text,
    marginBottom: Spacing.md, textAlign: 'center',
  },
  confirmedSub: {
    fontSize: 15, color: Colors.muted, lineHeight: 24,
    textAlign: 'center', marginBottom: Spacing.xl,
  },
  spamNote: {
    fontSize: 12, color: Colors.muted,
    marginTop: Spacing.lg, textAlign: 'center',
  },
});
