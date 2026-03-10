import { useState } from 'react';
import ScreenTransition from './ScreenTransition';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, ScrollView,
  Platform, Alert, ActivityIndicator,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { registerUser } from '../../services/authService';
import { useTheme } from '../../hooks/ThemeContext';
import ColorSwitcher from './ColorSwitcher';

export default function RegisterScreen({ navigation }) {
  const { scheme: C, font: F } = useTheme();
  const d = makeStyles(F);
  // font helpers — applied inline so they react to font switches
  const ff = {
    display:  { fontFamily: F.display },
    heading:  { fontFamily: F.heading },
    body:     { fontFamily: F.body },
    bodySemi: { fontFamily: F.bodySemi },
  };

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [confirm, setConfirm]         = useState('');
  const [showPass, setShowPass]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  const handleRegister = async () => {
    if (!displayName || !email || !password || !confirm)
      return Alert.alert('Error', 'Fill in all fields');
    if (password.length < 6)
      return Alert.alert('Weak password', 'At least 6 characters required.');
    if (password !== confirm)
      return Alert.alert('Mismatch', 'Passwords do not match.');
    setLoading(true);
    try {
      await registerUser(email.trim(), password, displayName.trim());
    } catch (e) {
      Alert.alert('Register Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  // Strength 0–4
  const strength      = Math.min(4, Math.floor(password.length / 3));
  const strengthLabel = ['', 'WEAK', 'MEH', 'OK', 'STRONG 🔥'][strength];

  const mismatch = confirm.length > 0 && confirm !== password;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
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
            <View style={d.brandTopRow}>
              <View style={[d.stamp, { backgroundColor: C.accent }]}>
                <Text style={[d.stampText, ff.display, { color: C.bg }]}>★ NEW RECRUIT ★</Text>
              </View>
              <ColorSwitcher />
            </View>
            <Text style={[d.wordmark, ff.display, { color: C.text }]}>
              LOCK<Text style={{ color: C.accent }}>/</Text>IN
            </Text>
            <View style={d.subRow}>
              <View style={[d.subLine, { backgroundColor: C.border }]} />
              <Text style={[d.subText, ff.heading, { color: C.textSub }]}>JOIN THE SQUAD.</Text>
              <View style={[d.subLine, { backgroundColor: C.border }]} />
            </View>
          </Animated.View>

          {/* ── FORM ── */}
          <Animated.View
            entering={FadeInDown.duration(600).delay(100)}
            style={[d.card, { backgroundColor: C.card, borderColor: C.border, borderTopColor: C.accent }]}
          >
            <View style={d.sectionRow}>
              <Text style={[d.sectionText, ff.heading, { color: C.textSub }]}>CREATE ACCOUNT</Text>
              <View style={[d.sectionLine, { backgroundColor: C.border }]} />
            </View>

            {/* Name */}
            <Text style={[d.label, ff.heading, { color: C.textSub }]}>YOUR NAME</Text>
            <View style={[d.inputWrap, { backgroundColor: C.surface, borderColor: C.border, borderLeftColor: C.accent }]}>
              <Ionicons name="person-outline" size={16} color={C.textSub} style={{ marginRight: 10 }} />
              <TextInput
                style={[d.input, ff.heading, { color: C.text }]}
                placeholder="DISPLAY NAME"
                placeholderTextColor={C.textSub + '55'}
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
              />
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
                placeholder="MIN. 6 CHARACTERS"
                placeholderTextColor={C.textSub + '55'}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name={showPass ? 'eye-outline' : 'eye-off-outline'} size={16} color={C.textSub} />
              </TouchableOpacity>
            </View>

            {/* Strength meter */}
            {password.length > 0 && (
              <View style={[d.strengthRow, { marginTop: -10, marginBottom: 16 }]}>
                {[1, 2, 3, 4].map(i => (
                  <View
                    key={i}
                    style={[
                      d.strengthBar,
                      { backgroundColor: i <= strength ? C.accent : C.border },
                    ]}
                  />
                ))}
                <Text style={[d.strengthLabel, ff.heading, { color: C.accent }]}>{strengthLabel}</Text>
              </View>
            )}

            {/* Confirm */}
            <Text style={[d.label, ff.heading, { color: C.textSub }]}>CONFIRM PASSWORD</Text>
            <View style={[
              d.inputWrap,
              { backgroundColor: C.surface, borderColor: C.border, borderLeftColor: mismatch ? C.accentAlt : C.accent },
            ]}>
              <Ionicons name="lock-closed-outline" size={16} color={C.textSub} style={{ marginRight: 10 }} />
              <TextInput
                style={[d.input, ff.heading, { flex: 1, color: C.text }]}
                placeholder="REPEAT PASSWORD"
                placeholderTextColor={C.textSub + '55'}
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry={!showConfirm}
              />
              <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name={showConfirm ? 'eye-outline' : 'eye-off-outline'} size={16} color={C.textSub} />
              </TouchableOpacity>
            </View>

            {mismatch && (
              <Text style={[d.label, ff.heading, { color: C.accentAlt, marginTop: -10, marginBottom: 16 }]}>
                ✕ PASSWORDS DON'T MATCH
              </Text>
            )}

            {/* CTA */}
            <TouchableOpacity
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.8}
              style={[d.btnOuter, loading && { opacity: 0.5 }]}
            >
              <View style={[d.btnShadow, { backgroundColor: C.accent }]} />
              <View style={[d.btnFace, { backgroundColor: C.text }]}>
                {loading
                  ? <ActivityIndicator color={C.bg} />
                  : <Text style={[d.btnText, ff.display, { color: C.bg }]}>I'M IN →</Text>}
              </View>
            </TouchableOpacity>

            {/* Divider */}
            <View style={d.divider}>
              <View style={[d.divLine, { backgroundColor: C.border }]} />
              <Text style={[d.divLabel, ff.heading, { color: C.textSub }]}>OR</Text>
              <View style={[d.divLine, { backgroundColor: C.border }]} />
            </View>

            <TouchableOpacity onPress={() => setTransitioning(true)} style={d.switchRow}>
              <Text style={[d.switchText, ff.heading, { color: C.textSub }]}>ALREADY IN?  </Text>
              <Text style={[d.switchText, ff.heading, { color: C.accent }]}>SIGN IN</Text>
            </TouchableOpacity>
          </Animated.View>

        </ScrollView>
      </KeyboardAvoidingView>

      <ScreenTransition
        visible={transitioning}
        destination="SIGN IN"
        onFinish={() => navigation.navigate('Login')}
      />

      <View style={[d.ticker, { backgroundColor: C.accent }]}>
        <Text style={[d.tickerText, ff.display, { color: C.bg }]} numberOfLines={1}>
          LOCK IN ★ LEVEL UP ★ NO EXCUSES ★ STAY FOCUSED ★ LOCK IN ★ LEVEL UP ★ NO EXCUSES ★ STAY FOCUSED ★
        </Text>
      </View>
    </View>
  );
}

const makeStyles = (F) => StyleSheet.create({

  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 32,
    gap: 16,
  },
  brand:       { marginBottom: 4 },
  brandTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  stamp: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 4,
    marginBottom: 12,
    transform: [{ rotate: '-1.5deg' }],
  },
  stampText: { fontSize: 10, fontFamily: F.display, letterSpacing: 3 },
  wordmark: {
    fontSize: 76, lineHeight: 72, letterSpacing: -1,
  },
  subRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  subLine: { flex: 1, height: 1 },
  subText: { fontFamily: F.heading, fontSize: 10, letterSpacing: 3 },

  card:        { borderWidth: 1.5, borderTopWidth: 3, padding: 24 },
  sectionRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  sectionText: { fontFamily: F.heading, fontSize: 10, letterSpacing: 3 },
  sectionLine: { flex: 1, height: 1 },

  label:    { fontFamily: F.heading, fontSize: 10, letterSpacing: 2, marginBottom: 6 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderLeftWidth: 3,
    height: 54, paddingHorizontal: 14, marginBottom: 16,
  },
  input: { flex: 1, fontFamily: F.heading, fontSize: 16, letterSpacing: 1 },

  strengthRow:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  strengthBar:  { flex: 1, height: 3 },
  strengthLabel:{ fontFamily: F.heading, fontSize: 9, letterSpacing: 2, minWidth: 56, textAlign: 'right' },

  btnOuter: { height: 60, marginBottom: 4 },
  btnShadow: { position: 'absolute', top: 5, left: 5, right: 0, bottom: 0 },
  btnFace:   { position: 'absolute', top: 0, left: 0, right: 5, bottom: 5, alignItems: 'center', justifyContent: 'center' },
  btnText:   { fontFamily: F.display, fontSize: 18, letterSpacing: 3 },

  divider:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 20 },
  divLine:  { flex: 1, height: 1 },
  divLabel: { fontFamily: F.heading, fontSize: 10, letterSpacing: 2 },

  switchRow:  { flexDirection: 'row', justifyContent: 'center' },
  switchText: { fontFamily: F.heading, fontSize: 14, letterSpacing: 1.5 },

  ticker:     { paddingVertical: 8 },
  tickerText: { fontFamily: F.display, fontSize: 11, letterSpacing: 3, textAlign: 'center' },
});
