import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, ScrollView, Platform, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { registerUser } from '../../services/authService';
import { Colors, Spacing, Radius } from '../../constants/theme';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) return Alert.alert('Error', 'Fill in all fields');
    if (password.length < 6) return Alert.alert('Error', 'Password must be 6+ characters');
    setLoading(true);
    try {
      await registerUser(email.trim(), password, name.trim());
    } catch (e) { Alert.alert('Register Failed', e.message); }
    finally { setLoading(false); }
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={['rgba(123,97,255,0.08)', 'transparent']} style={styles.gradTop} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Animated.View entering={FadeInUp.duration(600)} style={styles.logoArea}>
            <View style={styles.logoBox}><Text style={styles.logoIcon}>⚡</Text></View>
            <Text style={styles.appName}>LOCK<Text style={styles.accent}>IN</Text></Text>
            <Text style={styles.tagline}>Start your journey today</Text>
          </Animated.View>
          <Animated.View entering={FadeInDown.duration(700).delay(200)} style={styles.card}>
            <Text style={styles.heading}>Create account</Text>
            {[
              { icon: 'person-outline', placeholder: 'Display Name', value: name, setter: setName, cap: 'words' },
              { icon: 'mail-outline', placeholder: 'Email', value: email, setter: setEmail, kb: 'email-address' },
              { icon: 'lock-closed-outline', placeholder: 'Password (6+ chars)', value: password, setter: setPassword, secure: true },
            ].map((f) => (
              <View key={f.placeholder} style={styles.inputWrap}>
                <Ionicons name={f.icon} size={18} color={Colors.muted} style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder={f.placeholder} placeholderTextColor={Colors.muted} value={f.value} onChangeText={f.setter} keyboardType={f.kb} secureTextEntry={f.secure} autoCapitalize={f.cap || 'none'} />
              </View>
            ))}
            <TouchableOpacity style={[styles.btn, loading && { opacity: 0.6 }]} onPress={handleRegister} disabled={loading}>
              <LinearGradient colors={['#7b61ff', '#5a42e8']} style={styles.btnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={styles.btnText}>{loading ? 'Creating...' : 'Create Account'}</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.switchRow}>
              <Text style={styles.switchText}>Already have an account? </Text>
              <Text style={[styles.switchText, { color: '#7b61ff', fontWeight: '600' }]}>Sign In</Text>
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
  logoBox: { width: 72, height: 72, borderRadius: Radius.xl, backgroundColor: 'rgba(123,97,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md, borderWidth: 1, borderColor: 'rgba(123,97,255,0.3)' },
  logoIcon: { fontSize: 32 },
  appName: { fontSize: 36, fontWeight: '800', color: Colors.text, letterSpacing: 4 },
  accent: { color: Colors.accent },
  tagline: { color: Colors.muted, marginTop: 4, fontSize: 13 },
  card: { backgroundColor: Colors.card, borderRadius: Radius.xl, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  heading: { fontSize: 22, fontWeight: '700', color: Colors.text, marginBottom: Spacing.lg },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md, paddingHorizontal: Spacing.md, height: 52 },
  inputIcon: { marginRight: Spacing.sm },
  input: { flex: 1, color: Colors.text, fontSize: 15 },
  btn: { borderRadius: Radius.md, overflow: 'hidden', marginTop: Spacing.sm },
  btnGrad: { height: 52, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.lg },
  switchText: { color: Colors.muted, fontSize: 14 },
});
