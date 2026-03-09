import { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, Image, ScrollView, TextInput,
} from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { createPost } from '../../services/socialService';
import { formatDurationShort } from '../../constants/calorieCalc';

// ─── Minimal frosted pill overlay (photo mode) ───────────────────────────────
function OverlayCard({ workout, streak }) {
  const date = workout.date
    ? format(new Date(workout.date + 'T12:00:00'), 'EEE, MMM d')
    : format(new Date(), 'EEE, MMM d');
  const duration = workout.durationSeconds ? formatDurationShort(workout.durationSeconds) : null;
  const calories = workout.caloriesBurned || null;

  return (
    <View style={overlay.root}>
      {/* Top-left: LOCKIN wordmark only */}
      <View style={overlay.topBar}>
        <Text style={overlay.brand}>LOCK<Text style={overlay.brandAccent}>IN</Text></Text>
        <View style={overlay.streakPill}>
          <Text style={overlay.streakLabel}>⚡</Text>
          <Text style={overlay.streakNum}>{streak}</Text>
          <Text style={overlay.streakLabel}> day streak</Text>
        </View>
      </View>

      {/* Bottom: slim frosted pill — just the essentials */}
      <View style={overlay.pill}>
        <Text style={overlay.workoutType}>{workout.type.toUpperCase()}</Text>
        <View style={overlay.statsRow}>
          {duration && <Text style={overlay.stat}>{duration}</Text>}
          {duration && calories && <Text style={overlay.dot}>·</Text>}
          {calories && <Text style={overlay.stat}>{calories} cal</Text>}
          <Text style={overlay.dot}>·</Text>
          <Text style={overlay.stat}>{date}</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Standalone Card (no photo) ───────────────────────────────────────────────
function StandaloneCard({ cardRef, workout, streak, userName }) {
  const date = workout.date
    ? format(new Date(workout.date + 'T12:00:00'), 'EEE, MMM d yyyy')
    : format(new Date(), 'EEE, MMM d yyyy');
  const duration = workout.durationSeconds ? formatDurationShort(workout.durationSeconds) : null;
  const calories = workout.caloriesBurned || null;

  return (
    <View ref={cardRef} style={card.root} collapsable={false}>
      {/* Top accent bar */}
      <View style={card.accentBar} />

      {/* Header row: LOCKIN + streak */}
      <View style={card.header}>
        <Text style={card.brand}>LOCK<Text style={card.brandAccent}>IN</Text></Text>
        <View style={card.streakPill}>
          <Text style={card.streakNum}>{streak}</Text>
          <Text style={card.streakSuffix}> day streak</Text>
        </View>
      </View>

      {/* Workout name — hero */}
      <Text style={card.workoutType}>{workout.type.toUpperCase()}</Text>
      <Text style={card.userName}>{userName}</Text>

      {/* Divider */}
      <View style={card.divider} />

      {/* Stats row */}
      <View style={card.statsRow}>
        {duration && (
          <View style={card.statBlock}>
            <Text style={card.statValue}>{duration}</Text>
            <Text style={card.statLabel}>TIME</Text>
          </View>
        )}
        {duration && calories && <View style={card.statSep} />}
        {calories && (
          <View style={card.statBlock}>
            <Text style={card.statValue}>{calories}</Text>
            <Text style={card.statLabel}>CAL</Text>
          </View>
        )}
        {(duration || calories) && <View style={card.statSep} />}
        <View style={card.statBlock}>
          <Text style={card.statValue}>{date}</Text>
          <Text style={card.statLabel}>DATE</Text>
        </View>
      </View>

      {/* Footer */}
      <Text style={card.footer}>lockin.app</Text>
    </View>
  );
}

// ─── Photo + Overlay Card ─────────────────────────────────────────────────────
function PhotoCard({ cardRef, photoUri, workout, streak }) {
  return (
    <View ref={cardRef} style={photo.root} collapsable={false}>
      <Image source={{ uri: photoUri }} style={photo.image} resizeMode="cover" />
      <OverlayCard workout={workout} streak={streak} />
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
    const p = await cameraRef.current.takePictureAsync({ quality: 0.85 });
    onCapture(p.uri);
  };

  return (
    <View style={cam.root}>
      <CameraView ref={cameraRef} style={cam.camera} facing={facing}>
        <TouchableOpacity style={cam.closeBtn} onPress={onClose}>
          <Ionicons name="close" size={26} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={cam.flipBtn} onPress={() => setFacing(f => f === 'front' ? 'back' : 'front')}>
          <Ionicons name="camera-reverse-outline" size={26} color="#fff" />
        </TouchableOpacity>
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
  const [caption, setCaption] = useState('');

  const duration = workout.durationSeconds ? formatDurationShort(workout.durationSeconds) : null;
  const calories = workout.caloriesBurned || null;

  const capture = async () => {
    try {
      return await captureRef(cardRef, { format: 'png', quality: 1, result: 'tmpfile' });
    } catch {
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
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false, quality: 0.85,
    });
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
        durationSeconds: workout.durationSeconds || 0,
        caloriesBurned: workout.caloriesBurned || 0,
        caption: caption.trim(),
        exercises: workout.exercises || [],
      });
      Alert.alert('Posted! 🔥', 'Your workout is live on the community feed!', [
        { text: 'View Feed', onPress: () => { onClose(); navigation?.navigate('Feed'); } },
        { text: 'OK', onPress: onClose },
      ]);
    } catch {
      Alert.alert('Error', 'Could not post. Try again.');
    } finally {
      setPosting(false);
    }
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
    <ScrollView style={styles.root} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.handle} />
      <Text style={styles.title}>Share Your Workout</Text>
      <Text style={styles.sub}>Add a photo or share the card directly 🔥</Text>

      {/* Workout stats summary */}
      {(duration || calories) && (
        <View style={styles.statsSummary}>
          <Text style={styles.workoutTypeLabel}>{workout.type}</Text>
          <View style={styles.statsChips}>
            {duration && (
              <View style={styles.statsChip}>
                <Ionicons name="time-outline" size={14} color="#00f5c4" />
                <Text style={styles.statsChipText}>{duration}</Text>
              </View>
            )}
            {calories && (
              <View style={styles.statsChip}>
                <Ionicons name="flame-outline" size={14} color="#ff9f43" />
                <Text style={[styles.statsChipText, { color: '#ff9f43' }]}>{calories} cal</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Card preview */}
      <View style={styles.cardWrap}>
        {photoUri ? (
          <PhotoCard
            cardRef={cardRef}
            photoUri={photoUri}
            workout={workout}
            streak={streak}
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
          <Text style={styles.photoBtnText}>{photoUri ? 'Retake' : 'Selfie'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.photoBtn} onPress={pickFromGallery}>
          <Ionicons name="image-outline" size={18} color="#ff9f43" />
          <Text style={[styles.photoBtnText, { color: '#ff9f43' }]}>{photoUri ? 'Change' : 'Gallery'}</Text>
        </TouchableOpacity>
        {photoUri && (
          <TouchableOpacity style={styles.photoBtn} onPress={() => setPhotoUri(null)}>
            <Ionicons name="close-outline" size={18} color="#ff6b6b" />
            <Text style={[styles.photoBtnText, { color: '#ff6b6b' }]}>Remove</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Caption */}
      <View style={styles.captionWrap}>
        <TextInput
          style={styles.captionInput}
          placeholder="Add a caption... 💪"
          placeholderTextColor="#3a4560"
          value={caption}
          onChangeText={setCaption}
          multiline
          maxLength={200}
        />
        <Text style={styles.captionCount}>{caption.length}/200</Text>
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
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

// ─── Overlay styles ───────────────────────────────────────────────────────────
const overlay = StyleSheet.create({
  root: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'space-between', padding: 16 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { fontSize: 16, fontWeight: '900', color: '#fff', letterSpacing: 4 },
  brandAccent: { color: '#00f5c4' },
  streakPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(0,245,196,0.35)' },
  streakNum: { color: '#00f5c4', fontSize: 13, fontWeight: '800' },
  streakLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600' },
  pill: { backgroundColor: 'rgba(8,11,16,0.55)', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: 'rgba(0,245,196,0.18)' },
  workoutType: { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: 2, marginBottom: 6 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stat: { color: 'rgba(255,255,255,0.82)', fontSize: 13, fontWeight: '700' },
  dot: { color: 'rgba(0,245,196,0.6)', fontSize: 13, fontWeight: '900' },
});

// ─── Standalone card styles ───────────────────────────────────────────────────
const card = StyleSheet.create({
  root: { width: 320, backgroundColor: '#080b10', borderRadius: 24, borderWidth: 1, borderColor: '#1a2235', paddingHorizontal: 24, paddingTop: 0, paddingBottom: 24, overflow: 'hidden' },
  accentBar: { height: 3, backgroundColor: '#00f5c4', marginBottom: 24, borderRadius: 0 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  brand: { fontSize: 17, fontWeight: '900', color: '#fff', letterSpacing: 4 },
  brandAccent: { color: '#00f5c4' },
  streakPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,245,196,0.08)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(0,245,196,0.25)' },
  streakNum: { color: '#00f5c4', fontSize: 13, fontWeight: '800' },
  streakSuffix: { color: '#4a6080', fontSize: 12, fontWeight: '600' },
  workoutType: { color: '#fff', fontSize: 34, fontWeight: '900', letterSpacing: 1.5, lineHeight: 38, marginBottom: 4 },
  userName: { color: '#4a6080', fontSize: 13, fontWeight: '600', marginBottom: 20, letterSpacing: 0.5 },
  divider: { height: 1, backgroundColor: '#1a2235', marginBottom: 20 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 0 },
  statBlock: { flex: 1 },
  statValue: { color: '#fff', fontSize: 20, fontWeight: '800' },
  statLabel: { color: '#3a4560', fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginTop: 3 },
  statSep: { width: 1, height: 36, backgroundColor: '#1a2235', marginHorizontal: 16 },
  footer: { color: '#1e2d45', fontSize: 10, fontWeight: '700', letterSpacing: 2, marginTop: 24, textAlign: 'center' },
});

// ─── Photo card styles ────────────────────────────────────────────────────────
const photo = StyleSheet.create({
  root: { width: 340, height: 540, borderRadius: 24, overflow: 'hidden', position: 'relative' },
  image: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
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
  root: { flex: 1, backgroundColor: '#0e1219' },
  scroll: { padding: 24, paddingTop: 16 },
  handle: { width: 36, height: 4, backgroundColor: '#2a3550', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '800', color: '#fff', textAlign: 'center' },
  sub: { color: '#6b7a99', fontSize: 14, textAlign: 'center', marginTop: 4, marginBottom: 16 },

  statsSummary: { backgroundColor: '#131822', borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#1e2535' },
  workoutTypeLabel: { color: '#fff', fontWeight: '800', fontSize: 16, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  statsChips: { flexDirection: 'row', gap: 10 },
  statsChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,245,196,0.08)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: 'rgba(0,245,196,0.2)' },
  statsChipText: { color: '#00f5c4', fontWeight: '700', fontSize: 14 },

  cardWrap: { alignItems: 'center', marginBottom: 16 },
  photoOptions: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 20 },
  photoBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1, borderColor: '#1e2535' },
  photoBtnText: { color: '#00f5c4', fontWeight: '600', fontSize: 13 },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginBottom: 20 },
  actionBtn: { alignItems: 'center', gap: 8 },
  actionIcon: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { color: '#8892a4', fontSize: 12, fontWeight: '600' },
  postToAppBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(0,245,196,0.12)', borderRadius: 14, height: 52, borderWidth: 1.5, borderColor: '#00f5c4', marginBottom: 12 },
  postToAppIcon: { fontSize: 18 },
  postToAppText: { color: '#00f5c4', fontWeight: '800', fontSize: 15 },
  closeBtn: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, height: 50, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#1e2535' },
  closeBtnText: { color: '#6b7a99', fontWeight: '700', fontSize: 15 },
  captionWrap: { backgroundColor: '#131822', borderRadius: 14, borderWidth: 1, borderColor: '#1e2535', padding: 14, marginBottom: 20 },
  captionInput: { color: '#ffffff', fontSize: 15, fontWeight: '500', minHeight: 60, textAlignVertical: 'top', lineHeight: 22 },
  captionCount: { color: '#3a4560', fontSize: 11, fontWeight: '600', textAlign: 'right', marginTop: 6 },
});
