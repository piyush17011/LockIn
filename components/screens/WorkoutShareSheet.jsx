import { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, Image, Modal, Pressable,
} from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { createPost } from '../../services/socialService';

// ─── Overlay Card (rendered on top of photo) ─────────────────────────────────
function OverlayCard({ workout, streak, userName }) {
  const date = workout.date
    ? format(new Date(workout.date + 'T12:00:00'), 'EEE, MMM d yyyy')
    : format(new Date(), 'EEE, MMM d yyyy');
  const time = format(new Date(), 'h:mm a');

  return (
    <View style={overlay.root}>
      {/* Top bar */}
      <View style={overlay.topBar}>
        <View style={overlay.logoRow}>
          <Text style={overlay.logoIcon}>🔒</Text>
          <Text style={overlay.brandName}>LOCK<Text style={{ color: '#00f5c4' }}>IN</Text></Text>
        </View>
        <View style={overlay.streakBadge}>
          <Text style={overlay.streakFire}>🔥</Text>
          <Text style={overlay.streakNum}>{streak}</Text>
        </View>
      </View>

      {/* Bottom bar */}
      <View style={overlay.bottomBar}>
        <Text style={overlay.workoutType}>{workout.type}</Text>
        <Text style={overlay.userName}>{userName}</Text>
        <View style={overlay.metaRow}>
          <Text style={overlay.metaText}>📅 {date}</Text>
          <Text style={overlay.metaDot}>·</Text>
          <Text style={overlay.metaText}>⏱ {time}</Text>
        </View>
        <Text style={overlay.watermark}>lockin.app</Text>
      </View>
    </View>
  );
}

// ─── Capture Card (full card without photo — fallback) ────────────────────────
function StandaloneCard({ cardRef, workout, streak, userName }) {
  const date = workout.date
    ? format(new Date(workout.date + 'T12:00:00'), 'EEEE, MMM d yyyy')
    : format(new Date(), 'EEEE, MMM d yyyy');
  const time = format(new Date(), 'h:mm a');

  return (
    <View ref={cardRef} style={card.root} collapsable={false}>
      <View style={card.accentLine} />
      <View style={card.cornerTL} />
      <View style={card.cornerBR} />

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

      <View style={card.divider} />

      <View style={card.body}>
        <Text style={card.userName}>{userName}</Text>
        <Text style={card.completedText}>just locked in a</Text>
        <Text style={card.workoutType}>{workout.type}</Text>
        <Text style={card.completedText}>workout 💪</Text>
      </View>

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

      <View style={card.footer}>
        <Text style={card.footerText}>lockin.app  ·  track. grind. grow.</Text>
      </View>
    </View>
  );
}

// ─── Photo + Overlay Card (captured as one image) ────────────────────────────
function PhotoCard({ cardRef, photoUri, workout, streak, userName }) {
  return (
    <View ref={cardRef} style={photo.root} collapsable={false}>
      <Image source={{ uri: photoUri }} style={photo.image} resizeMode="cover" />
      {/* Dark gradient at top and bottom */}
      <View style={photo.gradTop} />
      <View style={photo.gradBottom} />
      <OverlayCard workout={workout} streak={streak} userName={userName} />
    </View>
  );
}

// ─── Camera Screen ────────────────────────────────────────────────────────────
function CameraScreen({ onCapture, onClose }) {
  const cameraRef = useRef(null);
  const [facing, setFacing] = useState('front');
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) return <View style={cam.root} />;

  if (!permission.granted) {
    return (
      <View style={cam.permRoot}>
        <Text style={cam.permText}>Camera access needed for selfies</Text>
        <TouchableOpacity style={cam.permBtn} onPress={requestPermission}>
          <Text style={cam.permBtnText}>Allow Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onClose} style={{ marginTop: 16 }}>
          <Text style={{ color: '#6b7a99', fontWeight: '600' }}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePicture = async () => {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
    onCapture(photo.uri);
  };

  return (
    <View style={cam.root}>
      <CameraView ref={cameraRef} style={cam.camera} facing={facing}>
        {/* Close */}
        <TouchableOpacity style={cam.closeBtn} onPress={onClose}>
          <Ionicons name="close" size={26} color="#fff" />
        </TouchableOpacity>
        {/* Flip */}
        <TouchableOpacity style={cam.flipBtn} onPress={() => setFacing(f => f === 'front' ? 'back' : 'front')}>
          <Ionicons name="camera-reverse-outline" size={26} color="#fff" />
        </TouchableOpacity>
        {/* Capture */}
        <View style={cam.captureWrap}>
          <TouchableOpacity style={cam.captureBtn} onPress={takePicture}>
            <View style={cam.captureInner} />
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

// ─── Main Share Sheet ─────────────────────────────────────────────────────────
export default function WorkoutShareSheet({ workout, streak, userName, userId, onClose, navigation }) {
  const cardRef = useRef(null);
  const [photoUri, setPhotoUri] = useState(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [posting, setPosting] = useState(false);

  const capture = async () => {
    try {
      return await captureRef(cardRef, { format: 'png', quality: 1, result: 'tmpfile' });
    } catch (e) {
      Alert.alert('Error', 'Could not capture card.');
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
    if (!(await Sharing.isAvailableAsync())) return Alert.alert('Sharing not available.');
    await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share your workout' });
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permission needed');
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.85 });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  const handlePost = async () => {
    setPosting(true);
    try {
      await createPost(userId, userName, {
        imageUri: photoUri,
        workoutType: workout.type,
        streak,
        date: workout.date || format(new Date(), 'yyyy-MM-dd'),
      });
      Alert.alert('Posted! 🔥', 'Your workout is live on the community feed!', [
        { text: 'View Feed', onPress: () => { onClose(); navigation?.navigate('Feed'); } },
        { text: 'OK', onPress: onClose },
      ]);
    } catch (e) {
      Alert.alert('Error', 'Could not post. Try again.');
    } finally { setPosting(false); }
  };

  if (cameraOpen) {
    return (
      <CameraScreen
        onCapture={(uri) => { setPhotoUri(uri); setCameraOpen(false); }}
        onClose={() => setCameraOpen(false)}
      />
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.handle} />
      <Text style={styles.title}>Share Your Workout</Text>
      <Text style={styles.sub}>Add a photo or share the card directly 🔥</Text>

      {/* Card preview */}
      <View style={styles.cardWrap}>
        {photoUri ? (
          <PhotoCard
            cardRef={cardRef}
            photoUri={photoUri}
            workout={workout}
            streak={streak}
            userName={userName}
          />
        ) : (
          <StandaloneCard
            cardRef={cardRef}
            workout={workout}
            streak={streak}
            userName={userName}
          />
        )}
      </View>

      {/* Photo options */}
      <View style={styles.photoOptions}>
        <TouchableOpacity style={styles.photoBtn} onPress={() => setCameraOpen(true)}>
          <Ionicons name="camera-outline" size={18} color="#00f5c4" />
          <Text style={styles.photoBtnText}>{photoUri ? 'Retake Selfie' : 'Take Selfie'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.photoBtn} onPress={pickFromGallery}>
          <Ionicons name="image-outline" size={18} color="#ff9f43" />
          <Text style={[styles.photoBtnText, { color: '#ff9f43' }]}>{photoUri ? 'Change Photo' : 'Pick Photo'}</Text>
        </TouchableOpacity>
        {photoUri && (
          <TouchableOpacity style={styles.photoBtn} onPress={() => setPhotoUri(null)}>
            <Ionicons name="close-outline" size={18} color="#ff6b6b" />
            <Text style={[styles.photoBtnText, { color: '#ff6b6b' }]}>Remove</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Share actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleSave}>
          <View style={[styles.actionIcon, { backgroundColor: 'rgba(0,245,196,0.15)' }]}>
            <Ionicons name="download-outline" size={22} color="#00f5c4" />
          </View>
          <Text style={styles.actionLabel}>Save</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
          <View style={[styles.actionIcon, { backgroundColor: 'rgba(37,211,102,0.15)' }]}>
            <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
          </View>
          <Text style={styles.actionLabel}>WhatsApp</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
          <View style={[styles.actionIcon, { backgroundColor: 'rgba(225,48,108,0.15)' }]}>
            <Ionicons name="logo-instagram" size={22} color="#E1306C" />
          </View>
          <Text style={styles.actionLabel}>Instagram</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
          <View style={[styles.actionIcon, { backgroundColor: 'rgba(255,159,67,0.15)' }]}>
            <Ionicons name="share-outline" size={22} color="#ff9f43" />
          </View>
          <Text style={styles.actionLabel}>More</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.postToAppBtn, posting && { opacity: 0.6 }]}
        onPress={handlePost}
        disabled={posting}
      >
        <Text style={styles.postToAppIcon}>🔒</Text>
        <Text style={styles.postToAppText}>{posting ? 'Posting...' : 'Post to LockIn Community'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
        <Text style={styles.closeBtnText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Overlay styles ───────────────────────────────────────────────────────────
const overlay = StyleSheet.create({
  root: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'space-between' },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, paddingTop: 20,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoIcon: { fontSize: 22 },
  brandName: { fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: 3 },
  streakBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: 'rgba(0,245,196,0.4)',
  },
  streakFire: { fontSize: 16 },
  streakNum: { color: '#00f5c4', fontSize: 18, fontWeight: '800' },
  bottomBar: {
    padding: 20, paddingBottom: 24,
    backgroundColor: 'rgba(0,0,0,0.72)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,245,196,0.15)',
  },
  workoutType: {
    color: '#00f5c4', fontSize: 36, fontWeight: '800',
    letterSpacing: 1, textTransform: 'uppercase',
  },
  userName: { color: '#fff', fontSize: 16, fontWeight: '700', marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  metaText: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '600' },
  metaDot: { color: 'rgba(255,255,255,0.4)', fontSize: 11 },
  watermark: { color: 'rgba(255,255,255,0.3)', fontSize: 10, marginTop: 6, letterSpacing: 1.5 },
});

// ─── Standalone card styles ───────────────────────────────────────────────────
const card = StyleSheet.create({
  root: {
    width: 320, height: 420,
    backgroundColor: '#080b10',
    borderRadius: 20, borderWidth: 1.5, borderColor: '#1e2535',
    padding: 24, overflow: 'hidden', position: 'relative',
  },
  accentLine: { position: 'absolute', top: 0, left: 24, right: 24, height: 2, backgroundColor: '#00f5c4', borderRadius: 1 },
  cornerTL: { position: 'absolute', top: 14, left: 14, width: 18, height: 18, borderTopWidth: 2, borderLeftWidth: 2, borderColor: '#00f5c4', borderRadius: 3, opacity: 0.5 },
  cornerBR: { position: 'absolute', bottom: 14, right: 14, width: 18, height: 18, borderBottomWidth: 2, borderRightWidth: 2, borderColor: '#00f5c4', borderRadius: 3, opacity: 0.5 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  logoWrap: { width: 36, height: 36, borderRadius: 9, backgroundColor: 'rgba(0,245,196,0.12)', borderWidth: 1, borderColor: 'rgba(0,245,196,0.3)', alignItems: 'center', justifyContent: 'center' },
  logoIcon: { fontSize: 18 },
  brandName: { fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: 3 },
  brandTagline: { color: '#4a5568', fontSize: 10, marginTop: 1 },
  streakBadge: { marginLeft: 'auto', alignItems: 'center', backgroundColor: 'rgba(0,245,196,0.08)', borderWidth: 1, borderColor: 'rgba(0,245,196,0.2)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  streakFire: { fontSize: 16 },
  streakNum: { color: '#00f5c4', fontSize: 20, fontWeight: '800', lineHeight: 24 },
  streakLabel: { color: '#4a5568', fontSize: 9, fontWeight: '600', letterSpacing: 1 },
  divider: { height: 1, backgroundColor: '#1e2535', marginVertical: 16 },
  body: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 4 },
  userName: { color: '#fff', fontSize: 18, fontWeight: '800' },
  completedText: { color: '#6b7a99', fontSize: 13 },
  workoutType: { color: '#00f5c4', fontSize: 38, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  metaRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  metaChip: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: '#1e2535', borderRadius: 7, paddingHorizontal: 8, paddingVertical: 6 },
  metaText: { color: '#8892a4', fontSize: 10, fontWeight: '600', flex: 1 },
  footer: { marginTop: 12, alignItems: 'center' },
  footerText: { color: '#2a3550', fontSize: 9, fontWeight: '600', letterSpacing: 1.5 },
});

// ─── Photo card styles ────────────────────────────────────────────────────────
const photo = StyleSheet.create({
  root: { width: 360, height: 580, borderRadius: 20, overflow: 'hidden', position: 'relative' },
  image: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
  gradTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 120, backgroundColor: 'transparent', backgroundImage: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)' },
  gradBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 160, backgroundColor: 'rgba(0,0,0,0.55)' },
});

// ─── Camera styles ────────────────────────────────────────────────────────────
const cam = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  closeBtn: { position: 'absolute', top: 50, left: 20, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  flipBtn: { position: 'absolute', top: 50, right: 20, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  captureWrap: { position: 'absolute', bottom: 50, left: 0, right: 0, alignItems: 'center' },
  captureBtn: { width: 76, height: 76, borderRadius: 38, borderWidth: 4, borderColor: '#fff', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)' },
  captureInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff' },
  permRoot: { flex: 1, backgroundColor: '#080b10', alignItems: 'center', justifyContent: 'center', padding: 32 },
  permText: { color: '#fff', fontSize: 16, fontWeight: '600', textAlign: 'center', marginBottom: 24 },
  permBtn: { backgroundColor: '#00f5c4', borderRadius: 12, paddingHorizontal: 28, paddingVertical: 14 },
  permBtnText: { color: '#080b10', fontWeight: '800', fontSize: 15 },
});

// ─── Sheet styles ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0e1219', padding: 24, paddingTop: 16 },
  handle: { width: 36, height: 4, backgroundColor: '#2a3550', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '800', color: '#fff', textAlign: 'center' },
  sub: { color: '#6b7a99', fontSize: 14, textAlign: 'center', marginTop: 4, marginBottom: 20 },
  cardWrap: { alignItems: 'center', marginBottom: 16 },
  photoOptions: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 20 },
  photoBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1, borderColor: '#1e2535' },
  photoBtnText: { color: '#00f5c4', fontWeight: '600', fontSize: 13 },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginBottom: 20 },
  actionBtn: { alignItems: 'center', gap: 8 },
  actionIcon: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { color: '#8892a4', fontSize: 12, fontWeight: '600' },
  closeBtn: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, height: 50, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#1e2535' },
  closeBtnText: { color: '#6b7a99', fontWeight: '700', fontSize: 15 },
  postToAppBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(0,245,196,0.12)', borderRadius: 14, height: 52, borderWidth: 1.5, borderColor: '#00f5c4', marginBottom: 12 },
  postToAppIcon: { fontSize: 18 },
  postToAppText: { color: '#00f5c4', fontWeight: '800', fontSize: 15 },
});
