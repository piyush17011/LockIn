import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, ScrollView,
  Platform, Alert, Modal, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { loginUser, forgotPassword } from '../../services/authService';
import { Colors, Spacing, Radius } from '../../constants/theme';

export default function LoginScreen({ navigation }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);

  const [forgotVisible, setForgotVisible] = useState(false);
  const [forgotEmail, setForgotEmail]     = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent]       = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Error', 'Fill in all fields');
    setLoading(true);
    try {
      await loginUser(email.trim(), password);
    } catch (e) {
      Alert.alert('Login Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail.trim()) return Alert.alert('Enter email', 'Type the email on your account.');
    setForgotLoading(true);
    try {
      await forgotPassword(forgotEmail.trim());
      setForgotSent(true);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setForgotLoading(false);
    }
  };

  const closeForgotModal = () => {
    setForgotVisible(false);
    setForgotEmail('');
    setForgotSent(false);
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={['rgba(0,245,196,0.08)', 'transparent']} style={styles.gradTop} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          <Animated.View entering={FadeInUp.duration(600)} style={styles.logoArea}>
            <View style={styles.logoBox}>
              <Text style={styles.logoIcon}>🔒</Text>
            </View>
            <Text style={styles.appName}>LOCK<Text style={styles.accent}>IN</Text></Text>
            <Text style={styles.tagline}>Lock in. Level up.</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(700).delay(200)} style={styles.card}>
            <Text style={styles.heading}>Welcome back</Text>

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

            <TouchableOpacity onPress={() => setForgotVisible(true)} style={styles.forgotRow}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.btn, loading && { opacity: 0.6 }]} onPress={handleLogin} disabled={loading}>
              <LinearGradient colors={['#00f5c4', '#00c9a7']} style={styles.btnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                {loading ? <ActivityIndicator color={Colors.bg} /> : <Text style={styles.btnText}>Sign In</Text>}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.switchRow}>
              <Text style={styles.switchText}>No account? </Text>
              <Text style={[styles.switchText, { color: Colors.accent, fontWeight: '600' }]}>Create one</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={forgotVisible} transparent animationType="fade" onRequestClose={closeForgotModal}>
        <View style={styles.modalOverlay}>
          <Animated.View entering={FadeInDown.duration(300)} style={styles.modalCard}>
            {forgotSent ? (
              <>
                <Text style={styles.modalEmoji}>✅</Text>
                <Text style={styles.modalTitle}>Reset link sent!</Text>
                <Text style={styles.modalSub}>
                  Check your inbox at{'\n'}
                  <Text style={{ color: Colors.accent, fontWeight: '600' }}>{forgotEmail}</Text>
                  {'\n\n'}Click the link to set a new password.
                </Text>
                <TouchableOpacity style={styles.modalBtn} onPress={closeForgotModal}>
                  <LinearGradient colors={['#00f5c4', '#00c9a7']} style={styles.btnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Text style={styles.btnText}>Back to Login</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity onPress={closeForgotModal} style={styles.modalClose}>
                  <Ionicons name="close" size={22} color={Colors.muted} />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Reset Password</Text>
                <Text style={styles.modalSub}>We'll send a reset link to your email.</Text>
                <View style={[styles.inputWrap, { marginBottom: Spacing.lg }]}>
                  <Ionicons name="mail-outline" size={18} color={Colors.muted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Your email"
                    placeholderTextColor={Colors.muted}
                    value={forgotEmail}
                    onChangeText={setForgotEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoFocus
                  />
                </View>
                <TouchableOpacity style={[styles.modalBtn, forgotLoading && { opacity: 0.6 }]} onPress={handleForgotPassword} disabled={forgotLoading}>
                  <LinearGradient colors={['#00f5c4', '#00c9a7']} style={styles.btnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    {forgotLoading ? <ActivityIndicator color={Colors.bg} /> : <Text style={styles.btnText}>Send Reset Link</Text>}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: Colors.bg },
  gradTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 300 },
  scroll:  { flexGrow: 1, justifyContent: 'center', padding: Spacing.lg },
  logoArea: { alignItems: 'center', marginBottom: Spacing.xl },
  logoBox: {
    width: 72, height: 72, borderRadius: Radius.xl,
    backgroundColor: 'rgba(0,245,196,0.15)', alignItems: 'center',
    justifyContent: 'center', marginBottom: Spacing.md,
    borderWidth: 1, borderColor: 'rgba(0,245,196,0.3)',
  },
  logoIcon: { fontSize: 32 },
  appName:  { fontSize: 36, fontWeight: '800', color: Colors.text, letterSpacing: 4 },
  accent:   { color: Colors.accent },
  tagline:  { color: Colors.muted, marginTop: 4, fontSize: 13 },
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
  input:     { flex: 1, color: Colors.text, fontSize: 15 },
  forgotRow:  { alignSelf: 'flex-end', marginBottom: Spacing.md, marginTop: -4 },
  forgotText: { color: Colors.accent, fontSize: 13, fontWeight: '500' },
  btn:     { borderRadius: Radius.md, overflow: 'hidden', marginTop: Spacing.sm },
  btnGrad: { height: 52, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: Colors.bg, fontWeight: '700', fontSize: 16 },
  switchRow:  { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.lg },
  switchText: { color: Colors.muted, fontSize: 14 },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center', justifyContent: 'center', padding: Spacing.lg,
  },
  modalCard: {
    backgroundColor: Colors.card, borderRadius: Radius.xl,
    padding: Spacing.xl, borderWidth: 1, borderColor: Colors.border, width: '100%',
  },
  modalClose: { position: 'absolute', top: 16, right: 16, padding: 4 },
  modalEmoji: { fontSize: 40, textAlign: 'center', marginBottom: Spacing.md },
  modalTitle: { fontSize: 20, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm, textAlign: 'center' },
  modalSub:   { fontSize: 14, color: Colors.muted, lineHeight: 22, textAlign: 'center', marginBottom: Spacing.lg },
  modalBtn:   { borderRadius: Radius.md, overflow: 'hidden' },
});
