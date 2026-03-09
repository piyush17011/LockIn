import { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Share } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '../../constants/theme';
import { format, parseISO } from 'date-fns';

// ─── The shareable card — this gets captured as image ────────────────────────
function WorkoutCard({ cardRef, workout, streak, userName }) {
  const date = workout.date
    ? format(new Date(workout.date + 'T12:00:00'), 'EEEE, MMM d yyyy')
    : format(new Date(), 'EEEE, MMM d yyyy');
  const time = format(new Date(), 'h:mm a');

  return (
    <View ref={cardRef} style={card.root} collapsable={false}>
      {/* Background grid pattern */}
      <View style={card.gridOverlay} />

      {/* Top accent line */}
      <View style={card.accentLine} />

      {/* Header — branding */}
      <View style={card.header}>
        <View style={card.logoWrap}>
          <Text style={card.logoIcon}>🔒</Text>
        </View>
        <View>
          <Text style={card.brandName}>LOCK<Text style={{ color: '#00f5c4' }}>IN</Text></Text>
          <Text style={card.brandTagline}>Lock in. Level up.</Text>
        </View>
        <View style={card.streakBadge}>
          <Text style={card.streakFire}>🔥</Text>
          <Text style={card.streakNum}>{streak}</Text>
          <Text style={card.streakLabel}>streak</Text>
        </View>
      </View>

      {/* Divider */}
      <View style={card.divider} />

      {/* Main content */}
      <View style={card.body}>
        <Text style={card.userName}>{userName}</Text>
        <Text style={card.completedText}>just locked in a</Text>
        <Text style={card.workoutType}>{workout.type}</Text>
        <Text style={card.completedText}>workout 💪</Text>
      </View>

      {/* Date / time row */}
      <View style={card.metaRow}>
        <View style={card.metaChip}>
          <Ionicons name="calendar-outline" size={13} color="#00f5c4" />
          <Text style={card.metaText}>{date}</Text>
        </View>
        <View style={card.metaChip}>
          <Ionicons name="time-outline" size={13} color="#00f5c4" />
          <Text style={card.metaText}>{time}</Text>
        </View>
      </View>

      {/* Bottom watermark */}
      <View style={card.footer}>
        <Text style={card.footerText}>lockin.app  ·  track. grind. grow.</Text>
      </View>

      {/* Corner accent */}
      <View style={card.cornerTL} />
      <View style={card.cornerBR} />
    </View>
  );
}

// ─── Share Sheet Component ────────────────────────────────────────────────────
export default function WorkoutShareSheet({ workout, streak, userName, onClose }) {
  const cardRef = useRef(null);

  const capture = async () => {
    try {
      const uri = await captureRef(cardRef, { format: 'png', quality: 1, result: 'tmpfile' });
      return uri;
    } catch (e) {
      Alert.alert('Error', 'Could not capture card: ' + e.message);
      return null;
    }
  };

  const handleSave = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permission needed', 'Allow media access to save.');
    const uri = await capture();
    if (!uri) return;
    await MediaLibrary.saveToLibraryAsync(uri);
    Alert.alert('Saved! 🎉', 'Your workout card has been saved to your gallery.');
  };

  const handleShare = async () => {
    const uri = await capture();
    if (!uri) return;
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) return Alert.alert('Sharing not available on this device.');
    await Sharing.shareAsync(uri, {
      mimeType: 'image/png',
      dialogTitle: 'Share your workout',
    });
  };

  const handleWhatsApp = async () => {
    const uri = await capture();
    if (!uri) return;
    await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share to WhatsApp' });
  };

  return (
    <View style={styles.root}>
      <View style={styles.handle} />

      <Text style={styles.title}>Share Your Workout</Text>
      <Text style={styles.sub}>Your card is ready to share 🔥</Text>

      {/* Preview card */}
      <View style={styles.cardWrap}>
        <WorkoutCard
          cardRef={cardRef}
          workout={workout}
          streak={streak}
          userName={userName}
        />
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleSave}>
          <View style={[styles.actionIcon, { backgroundColor: 'rgba(0,245,196,0.15)' }]}>
            <Ionicons name="download-outline" size={22} color="#00f5c4" />
          </View>
          <Text style={styles.actionLabel}>Save</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={handleWhatsApp}>
          <View style={[styles.actionIcon, { backgroundColor: 'rgba(37,211,102,0.15)' }]}>
            <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
          </View>
          <Text style={styles.actionLabel}>WhatsApp</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
          <View style={[styles.actionIcon, { backgroundColor: 'rgba(255,159,67,0.15)' }]}>
            <Ionicons name="share-outline" size={22} color="#ff9f43" />
          </View>
          <Text style={styles.actionLabel}>More</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
        <Text style={styles.closeBtnText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Card Styles (fixed pixel sizes for consistent capture) ──────────────────
const card = StyleSheet.create({
  root: {
    width: 360, height: 480,
    backgroundColor: '#080b10',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#1e2535',
    padding: 28,
    overflow: 'hidden',
    position: 'relative',
  },
  gridOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    opacity: 0.04,
    backgroundColor: 'transparent',
  },
  accentLine: {
    position: 'absolute', top: 0, left: 28, right: 28, height: 2,
    backgroundColor: '#00f5c4', borderRadius: 1,
  },
  cornerTL: {
    position: 'absolute', top: 16, left: 16,
    width: 20, height: 20,
    borderTopWidth: 2, borderLeftWidth: 2,
    borderColor: '#00f5c4', borderRadius: 3,
    opacity: 0.5,
  },
  cornerBR: {
    position: 'absolute', bottom: 16, right: 16,
    width: 20, height: 20,
    borderBottomWidth: 2, borderRightWidth: 2,
    borderColor: '#00f5c4', borderRadius: 3,
    opacity: 0.5,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12,
  },
  logoWrap: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: 'rgba(0,245,196,0.12)',
    borderWidth: 1, borderColor: 'rgba(0,245,196,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  logoIcon: { fontSize: 20 },
  brandName: { fontSize: 20, fontWeight: '800', color: '#ffffff', letterSpacing: 3 },
  brandTagline: { color: '#4a5568', fontSize: 10, marginTop: 1 },
  streakBadge: {
    marginLeft: 'auto', alignItems: 'center',
    backgroundColor: 'rgba(0,245,196,0.08)',
    borderWidth: 1, borderColor: 'rgba(0,245,196,0.2)',
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6,
  },
  streakFire: { fontSize: 18 },
  streakNum: { color: '#00f5c4', fontSize: 22, fontWeight: '800', lineHeight: 26 },
  streakLabel: { color: '#4a5568', fontSize: 9, fontWeight: '600', letterSpacing: 1 },
  divider: { height: 1, backgroundColor: '#1e2535', marginVertical: 20 },
  body: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 6 },
  userName: { color: '#ffffff', fontSize: 22, fontWeight: '800', letterSpacing: 0.5 },
  completedText: { color: '#6b7a99', fontSize: 15, fontWeight: '500' },
  workoutType: {
    color: '#00f5c4', fontSize: 42, fontWeight: '800',
    letterSpacing: 1, textTransform: 'uppercase',
    textShadowColor: 'rgba(0,245,196,0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  metaRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  metaChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: '#1e2535',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7,
  },
  metaText: { color: '#8892a4', fontSize: 11, fontWeight: '600', flex: 1 },
  footer: { marginTop: 16, alignItems: 'center' },
  footerText: { color: '#2a3550', fontSize: 10, fontWeight: '600', letterSpacing: 1.5 },
});

// ─── Sheet Styles ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0e1219', padding: 24, paddingTop: 16 },
  handle: { width: 36, height: 4, backgroundColor: '#2a3550', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '800', color: '#ffffff', textAlign: 'center' },
  sub: { color: '#6b7a99', fontSize: 14, textAlign: 'center', marginTop: 4, marginBottom: 24 },
  cardWrap: { alignItems: 'center', marginBottom: 28 },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginBottom: 24 },
  actionBtn: { alignItems: 'center', gap: 8 },
  actionIcon: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { color: '#8892a4', fontSize: 12, fontWeight: '600' },
  closeBtn: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14,
    height: 50, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#1e2535',
  },
  closeBtnText: { color: '#6b7a99', fontWeight: '700', fontSize: 15 },
});
