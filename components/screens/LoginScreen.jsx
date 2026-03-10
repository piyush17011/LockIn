import { useState } from 'react';
import ScreenTransition from './ScreenTransition';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, ScrollView,
  Platform, Alert, Modal, ActivityIndicator,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { loginUser, forgotPassword } from '../../services/authService';
import { useTheme } from '../../hooks/ThemeContext';
import ColorSwitcher from './ColorSwitcher';

export default function LoginScreen({ navigation }) {
  const { scheme: C, font: F } = useTheme();
  const d = makeStyles(F);
  // font helpers — applied inline so they react to font switches
  const ff = {
    display:  { fontFamily: F.display },
    heading:  { fontFamily: F.heading },
    body:     { fontFamily: F.body },
    bodySemi: { fontFamily: F.bodySemi },
  };

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);

  const [forgotVisible, setForgotVisible] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
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
    if (!forgotEmail.trim()) return Alert.alert('Enter email', 'Type your account email.');
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
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Top accent tape */}
      <View style={{ height: 4, backgroundColor: C.accent }} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={d.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ── BRAND ── */}
          <Animated.View entering={FadeInUp.duration(500)} style={d.brand}>
            {/* Stamp + switcher on same row */}
            <View style={d.brandTopRow}>
              <View style={[d.stamp, { backgroundColor: C.accent }]}>
                <Text style={[d.stampText, ff.display, { color: C.bg }]}>★ EST. 2025 ★</Text>
              </View>
              <ColorSwitcher />
            </View>

            {/* Big wordmark */}
            <Text style={[d.wordmark, ff.display, { color: C.text }]}>
              LOCK<Text style={{ color: C.accent }}>/</Text>IN
            </Text>

            {/* Subtitle row */}
            <View style={d.subRow}>
              <View style={[d.subLine, { backgroundColor: C.border }]} />
              <Text style={[d.subText, ff.heading, { color: C.textSub }]}>LOCK IN. LEVEL UP.</Text>
              <View style={[d.subLine, { backgroundColor: C.border }]} />
            </View>
          </Animated.View>

          {/* ── FORM ── */}
          <Animated.View
            entering={FadeInDown.duration(600).delay(100)}
            style={[d.card, { backgroundColor: C.card, borderColor: C.border, borderTopColor: C.accent }]}
          >
            {/* Section header */}
            <View style={d.sectionRow}>
              <Text style={[d.sectionText, ff.heading, { color: C.textSub }]}>SIGN IN</Text>
              <View style={[d.sectionLine, { backgroundColor: C.border }]} />
            </View>

            {/* Email */}
            <Text style={[d.label, ff.heading, { color: C.textSub }]}>EMAIL</Text>
            <View style={[d.inputWrap, { backgroundColor: C.surface, borderColor: C.border, borderLeftColor: C.accent }]}>
              <Ionicons name="mail-outline" size={16} color={C.textSub} style={{ marginRight: 10 }} />
              <TextInput
                style={[d.input, ff.heading, { color: C.text }]}
                placeholder="YOUR@EMAIL.COM"
                placeholderTextColor={C.textSub + '55'}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Password */}
            <Text style={[d.label, ff.heading, { color: C.textSub }]}>PASSWORD</Text>
            <View style={[d.inputWrap, { backgroundColor: C.surface, borderColor: C.border, borderLeftColor: C.accent }]}>
              <Ionicons name="lock-closed-outline" size={16} color={C.textSub} style={{ marginRight: 10 }} />
              <TextInput
                style={[d.input, ff.heading, { flex: 1, color: C.text }]}
                placeholder="••••••••"
                placeholderTextColor={C.textSub + '55'}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name={showPass ? 'eye-outline' : 'eye-off-outline'} size={16} color={C.textSub} />
              </TouchableOpacity>
            </View>

            {/* Forgot */}
            <TouchableOpacity onPress={() => setForgotVisible(true)} style={d.forgotRow}>
              <Text style={[d.forgotText, ff.heading, { color: C.accent }]}>FORGOT PASSWORD?</Text>
            </TouchableOpacity>

            {/* ── BUTTON with hard offset shadow ── */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
              style={[d.btnOuter, loading && { opacity: 0.5 }]}
            >
              {/* Shadow layer */}
              <View style={[d.btnShadow, { backgroundColor: C.accent }]} />
              {/* Face layer */}
              <View style={[d.btnFace, { backgroundColor: C.text }]}>
                {loading
                  ? <ActivityIndicator color={C.bg} />
                  : <Text style={[d.btnText, ff.display, { color: C.bg }]}>SIGN IN →</Text>}
              </View>
            </TouchableOpacity>

            {/* Divider */}
            <View style={d.divider}>
              <View style={[d.divLine, { backgroundColor: C.border }]} />
              <Text style={[d.divLabel, ff.heading, { color: C.textSub }]}>OR</Text>
              <View style={[d.divLine, { backgroundColor: C.border }]} />
            </View>

            {/* Switch */}
            <TouchableOpacity onPress={() => setTransitioning(true)} style={d.switchRow}>
              <Text style={[d.switchText, ff.heading, { color: C.textSub }]}>NO ACCOUNT?  </Text>
              <Text style={[d.switchText, ff.heading, { color: C.accent }]}>CREATE ONE</Text>
            </TouchableOpacity>
          </Animated.View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── TICKER ── */}
      <View style={[d.ticker, { backgroundColor: C.accent }]}>
        <Text style={[d.tickerText, ff.display, { color: C.bg }]} numberOfLines={1}>
          LOCK IN ★ LEVEL UP ★ NO EXCUSES ★ STAY FOCUSED ★ LOCK IN ★ LEVEL UP ★ NO EXCUSES ★ STAY FOCUSED ★
        </Text>
      </View>

      <ScreenTransition
        visible={transitioning}
        destination="JOIN UP"
        onFinish={() => navigation.navigate('Register')}
      />

      
      {/* ── FORGOT MODAL ── */}
      <Modal visible={forgotVisible} transparent animationType="fade" onRequestClose={closeForgotModal}>
        <View style={d.modalOverlay}>
          <Animated.View
            entering={FadeInDown.duration(300)}
            style={[d.modalCard, { backgroundColor: C.card, borderColor: C.border, borderTopColor: C.accent }]}
          >
            {forgotSent ? (
              <>
                <Text style={[d.wordmark, ff.display, { color: C.text, fontSize: 52, marginBottom: 8 }]}>
                  SENT<Text style={{ color: C.accent }}>.</Text>
                </Text>
                <Text style={[d.modalBody, ff.body, { color: C.textSub }]}>
                  Reset link fired to{'\n'}
                  <Text style={{ color: C.accent }}>{forgotEmail}</Text>
                  {'\n\n'}Check your inbox.
                </Text>
                <TouchableOpacity onPress={closeForgotModal} activeOpacity={0.8} style={d.btnOuter}>
                  <View style={[d.btnShadow, { backgroundColor: C.accent }]} />
                  <View style={[d.btnFace, { backgroundColor: C.text }]}>
                    <Text style={[d.btnText, ff.display, { color: C.bg }]}>BACK TO LOGIN →</Text>
                  </View>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity onPress={closeForgotModal} style={d.modalClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="close" size={20} color={C.textSub} />
                </TouchableOpacity>
                <Text style={[d.wordmark, ff.display, { color: C.text, fontSize: 52, marginBottom: 6 }]}>
                  RESET<Text style={{ color: C.accent }}>/</Text>PASS
                </Text>
                <Text style={[d.modalBody, ff.body, { color: C.textSub, marginBottom: 20 }]}>
                  We'll shoot a reset link to your email.
                </Text>
                <Text style={[d.label, ff.heading, { color: C.textSub }]}>EMAIL</Text>
                <View style={[d.inputWrap, { backgroundColor: C.surface, borderColor: C.border, borderLeftColor: C.accent, marginBottom: 24 }]}>
                  <Ionicons name="mail-outline" size={16} color={C.textSub} style={{ marginRight: 10 }} />
                  <TextInput
                    style={[d.input, ff.heading, { color: C.text }]}
                    placeholder="YOUR@EMAIL.COM"
                    placeholderTextColor={C.textSub + '55'}
                    value={forgotEmail}
                    onChangeText={setForgotEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoFocus
                  />
                </View>
                <TouchableOpacity
                  onPress={handleForgotPassword}
                  disabled={forgotLoading}
                  activeOpacity={0.8}
                  style={[d.btnOuter, forgotLoading && { opacity: 0.5 }]}
                >
                  <View style={[d.btnShadow, { backgroundColor: C.accent }]} />
                  <View style={[d.btnFace, { backgroundColor: C.text }]}>
                    {forgotLoading
                      ? <ActivityIndicator color={C.bg} />
                      : <Text style={[d.btnText, ff.display, { color: C.bg }]}>SEND LINK →</Text>}
                  </View>
                </TouchableOpacity>
              </>
            )}
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

// ── Static styles (colors injected inline) ────────────────────
const makeStyles = (F) => StyleSheet.create({

  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 32,
    gap: 16,
  },

  // Brand
  brand:       { marginBottom: 4 },
  brandTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  stamp: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 4,
    marginBottom: 12,
    transform: [{ rotate: '-1.5deg' }],
  },
  stampText:  { fontSize: 10, fontFamily: F.display, letterSpacing: 3 },
  wordmark: {
    fontSize: 76,
    lineHeight: 72,
    letterSpacing: -1,
  },
  subRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  subLine: { flex: 1, height: 1 },
  subText: { fontFamily: F.heading, fontSize: 10, letterSpacing: 3 },

  // Card
  card: {
    borderWidth: 1.5,
    borderTopWidth: 3,
    padding: 24,
  },
  sectionRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  sectionText: { fontFamily: F.heading, fontSize: 10, letterSpacing: 3 },
  sectionLine: { flex: 1, height: 1 },

  // Inputs
  label: { fontFamily: F.heading, fontSize: 10, letterSpacing: 2, marginBottom: 6 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5,
    borderLeftWidth: 3,
    height: 54,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    fontSize: 16,
    letterSpacing: 1,
  },

  forgotRow:  { alignSelf: 'flex-end', marginTop: -8, marginBottom: 24 },
  forgotText: { fontFamily: F.heading, fontSize: 11, letterSpacing: 2 },

  // ── Hard offset button — the key brutalist detail ──
  btnOuter: {
    height: 60,         // total height including shadow
    marginBottom: 4,
  },
  btnShadow: {
    position: 'absolute',
    top: 5, left: 5,    // offset = shadow size
    right: 0, bottom: 0,
  },
  btnFace: {
    position: 'absolute',
    top: 0, left: 0,
    right: 5, bottom: 5, // inverse of shadow offset
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { fontFamily: F.display, fontSize: 18, letterSpacing: 3 },

  // Divider
  divider:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 20 },
  divLine:  { flex: 1, height: 1 },
  divLabel: { fontFamily: F.heading, fontSize: 10, letterSpacing: 2 },

  // Switch
  switchRow:  { flexDirection: 'row', justifyContent: 'center' },
  switchText: { fontFamily: F.heading, fontSize: 14, letterSpacing: 1.5 },

  // Ticker
  ticker:     { paddingVertical: 8 },
  tickerText: { fontFamily: F.display, fontSize: 11, letterSpacing: 3, textAlign: 'center' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', padding: 24 },
  modalCard: {
    borderWidth: 1.5,
    borderTopWidth: 4,
    padding: 28,
  },
  modalClose: { position: 'absolute', top: 16, right: 16, padding: 4 },
  modalBody:  { fontFamily: F.body, fontSize: 14, lineHeight: 22 },
});
