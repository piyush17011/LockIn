import { useRef, useState, useCallback, useEffect } from 'react';
import {
  View, Text, TouchableOpacity,
  Alert, TextInput, Dimensions, ScrollView,
  BackHandler, Modal, StatusBar,
} from 'react-native';
import Animated, {
  FadeInDown, FadeInUp, FadeIn,
  useSharedValue, useAnimatedStyle,
  withSpring, withTiming, withSequence, withDelay,
  interpolate, Extrapolation,
} from 'react-native-reanimated';
import { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { createPost } from '../../services/socialService';
import { useTheme } from '../../hooks/ThemeContext';
import {
  PRESETS, PRESET_NAMES,
  FONT_OPTIONS, SIZE_OPTIONS, SPACE_OPTIONS,
  STORY_W, STORY_H, THUMB_H, THUMB_W,
  ACCENT,
  fmtTime, fmtCal,
} from './shareConstants';

const { width: SW, height: SH } = Dimensions.get('window');

// ─── Thumbnail renderer ───────────────────────────────────────────────────────
function PresetCard({ index, photoUri, workout, streak, userName, fontOpts }) {
  const dateStr = workout.date
    ? format(new Date(workout.date + 'T12:00:00'), 'MMM d · yyyy').toUpperCase()
    : format(new Date(), 'MMM d · yyyy').toUpperCase();
  const timeStr = fmtTime(workout.durationSeconds);
  const calStr  = fmtCal(workout.caloriesBurned);
  const exCount = workout.exercises?.length || 0;
  const scale   = THUMB_W / STORY_W;
  const s       = (n) => Math.round(n * scale);
  const Layout  = PRESETS[index];
  return (
    <Layout
      photoUri={photoUri} workout={workout} streak={streak} userName={userName}
      dateStr={dateStr} timeStr={timeStr} calStr={calStr} exCount={exCount}
      w={THUMB_W} h={THUMB_H} s={s}
      fontFamily={fontOpts.family}
      sizeScale={fontOpts.sizeScale} letterMult={fontOpts.letterMult} lineMult={fontOpts.lineMult}
    />
  );
}

// ─── Off-screen capture target ────────────────────────────────────────────────
function StoryCard({ cardRef, photoUri, workout, streak, userName, presetIndex, fontOpts, onImageLoad }) {
  const dateStr = workout.date
    ? format(new Date(workout.date + 'T12:00:00'), 'MMM d · yyyy').toUpperCase()
    : format(new Date(), 'MMM d · yyyy').toUpperCase();
  const timeStr = fmtTime(workout.durationSeconds);
  const calStr  = fmtCal(workout.caloriesBurned);
  const exCount = workout.exercises?.length || 0;
  const Layout  = PRESETS[presetIndex];
  return (
    <View ref={cardRef} collapsable={false} pointerEvents="none"
      style={{ position: 'absolute', top: -STORY_H - 100, left: 0, width: STORY_W, height: STORY_H, overflow: 'hidden' }}>
      <Layout
        photoUri={photoUri} workout={workout} streak={streak} userName={userName}
        dateStr={dateStr} timeStr={timeStr} calStr={calStr} exCount={exCount}
        w={STORY_W} h={STORY_H} s={(n) => n}
        fontFamily={fontOpts.family}
        sizeScale={fontOpts.sizeScale} letterMult={fontOpts.letterMult} lineMult={fontOpts.lineMult}
        onImageLoad={onImageLoad}
      />
    </View>
  );
}

// ─── Camera ───────────────────────────────────────────────────────────────────
function CameraScreen({ onCapture, onClose, C }) {
  const camRef = useRef(null);
  const [facing, setFacing] = useState('front');
  const [perm, requestPerm] = useCameraPermissions();

  if (!perm) return <View style={{ flex: 1, backgroundColor: C.bg }} />;
  if (!perm.granted) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 }}>
        <Ionicons name="camera-outline" size={48} color={C.accent} />
        <Text style={{ color: C.text, fontSize: 16, fontWeight: '600', textAlign: 'center' }}>Camera access needed</Text>
        <TouchableOpacity style={{ backgroundColor: C.accent, borderRadius: 14, paddingHorizontal: 28, paddingVertical: 14 }} onPress={requestPerm}>
          <Text style={{ color: C.btnText, fontWeight: '800', fontSize: 15 }}>Allow Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onClose} style={{ marginTop: 14 }}>
          <Text style={{ color: C.textSub, fontWeight: '600' }}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }
  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView ref={camRef} style={{ flex: 1 }} facing={facing}>
        <TouchableOpacity style={{ position: 'absolute', top: 52, left: 20, width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }} onPress={onClose}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={{ position: 'absolute', top: 52, right: 20, width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }} onPress={() => setFacing(f => f === 'front' ? 'back' : 'front')}>
          <Ionicons name="camera-reverse-outline" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ position: 'absolute', bottom: 52, left: 0, right: 0, alignItems: 'center' }}>
          <TouchableOpacity
            style={{ width: 74, height: 74, borderRadius: 37, borderWidth: 4, borderColor: '#fff', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.12)' }}
            onPress={async () => {
              if (!camRef.current) return;
              const p = await camRef.current.takePictureAsync({ quality: 0.9 });
              onCapture(p.uri);
            }}
          >
            <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: '#fff' }} />
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

// ─── Font Picker Panel ────────────────────────────────────────────────────────
function FontPanel({ fontKey, sizeKey, spaceKey, onFont, onSize, onSpace, C }) {
  return (
    <Animated.View entering={FadeInDown.duration(220)} style={{ backgroundColor: C.surface, borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.border, paddingVertical: 14, paddingHorizontal: 16, gap: 10 }}>
      {/* Style row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Text style={{ fontSize: 10, fontWeight: '900', color: C.muted, letterSpacing: 1.5, textTransform: 'uppercase', width: 54 }}>Style</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
          {FONT_OPTIONS.map(opt => {
            const active = fontKey === opt.key;
            return (
              <TouchableOpacity key={opt.key}
                style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: active ? C.accent + '18' : C.card, borderWidth: 1, borderColor: active ? C.accent + '60' : C.border }}
                onPress={() => onFont(opt.key)}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: active ? C.accent : C.textSub, fontFamily: opt.family }}>{opt.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
      {/* Size row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Text style={{ fontSize: 10, fontWeight: '900', color: C.muted, letterSpacing: 1.5, textTransform: 'uppercase', width: 54 }}>Size</Text>
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
          {SIZE_OPTIONS.map(opt => {
            const active = sizeKey === opt.key;
            return (
              <TouchableOpacity key={opt.key}
                style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: active ? C.accent + '18' : C.card, borderWidth: 1, borderColor: active ? C.accent + '60' : C.border }}
                onPress={() => onSize(opt.key)}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: active ? C.accent : C.textSub }}>{opt.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      {/* Spacing row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Text style={{ fontSize: 10, fontWeight: '900', color: C.muted, letterSpacing: 1.5, textTransform: 'uppercase', width: 54 }}>Spacing</Text>
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
          {SPACE_OPTIONS.map(opt => {
            const active = spaceKey === opt.key;
            return (
              <TouchableOpacity key={opt.key}
                style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: active ? C.accent + '18' : C.card, borderWidth: 1, borderColor: active ? C.accent + '60' : C.border }}
                onPress={() => onSpace(opt.key)}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: active ? C.accent : C.textSub }}>{opt.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Animated action button ───────────────────────────────────────────────────
function ActionBtn({ icon, color, label, onPress, delay = 0 }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View entering={FadeInUp.duration(350).delay(delay)} style={animStyle}>
      <TouchableOpacity
        style={{ alignItems: 'center', gap: 6 }}
        onPress={onPress}
        activeOpacity={0.75}
        onPressIn={() => { scale.value = withSpring(0.88, { damping: 10 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 10 }); }}
      >
        <View style={{ width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: color + '15', borderWidth: 1, borderColor: color + '28' }}>
          <Ionicons name={icon} size={22} color={color} />
        </View>
        <Text style={{ fontSize: 11, fontWeight: '600', color: '#3a4560' }}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function WorkoutShareSheet(props) {
  const { navigation, route, onClose } = props;
  const workout  = props.workout  ?? route?.params?.workout;
  const streak   = props.streak   ?? route?.params?.streak   ?? 0;
  const userName = props.userName ?? route?.params?.userName ?? 'Athlete';
  const userId   = props.userId   ?? route?.params?.userId;
  const handleClose = onClose ?? (() => navigation?.goBack());

  const { scheme: C, font: F } = useTheme();

  const cardRef          = useRef(null);
  const scrollRef        = useRef(null);
  const previewScrollRef = useRef(null);

  const [photoUri,      setPhotoUri]      = useState(null);
  const [camOpen,       setCamOpen]       = useState(false);
  const [posting,       setPosting]       = useState(false);
  const [caption,       setCaption]       = useState('');
  const [imageReady,    setImageReady]    = useState(true);
  const [previewing,    setPreviewing]    = useState(false);
  const [presetIndex,   setPresetIndex]   = useState(0);
  const [hintVisible,   setHintVisible]   = useState(true);
  const [fontKey,       setFontKey]       = useState('condensed');
  const [sizeKey,       setSizeKey]       = useState('lg');
  const [spaceKey,      setSpaceKey]      = useState('wide');
  const [fontPanelOpen, setFontPanelOpen] = useState(false);

  const fontOpt  = FONT_OPTIONS.find(o => o.key === fontKey)   || FONT_OPTIONS[0];
  const sizeOpt  = SIZE_OPTIONS.find(o => o.key === sizeKey)   || SIZE_OPTIONS[2];
  const spaceOpt = SPACE_OPTIONS.find(o => o.key === spaceKey) || SPACE_OPTIONS[0];
  const fontOpts = {
    family:     fontOpt.family,
    sizeScale:  sizeOpt.scale,
    letterMult: spaceOpt.letter / 10,
    lineMult:   spaceOpt.line,
  };

  const timeStr = fmtTime(workout.durationSeconds);
  const calStr  = fmtCal(workout.caloriesBurned);
  const dateStr = workout.date
    ? format(new Date(workout.date + 'T12:00:00'), 'MMM d · yyyy').toUpperCase()
    : format(new Date(), 'MMM d · yyyy').toUpperCase();

  // ── Card thumbnail scale-in on mount ──────────────────────────────────────
  const cardScale   = useSharedValue(0.88);
  const cardOpacity = useSharedValue(0);
  useEffect(() => {
    cardScale.value   = withSpring(1, { damping: 14, stiffness: 120 });
    cardOpacity.value = withTiming(1, { duration: 380 });
  }, []);
  const cardAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    opacity: cardOpacity.value,
  }));

  // ── Card thumbnail bounces when preset changes ─────────────────────────────
  useEffect(() => {
    cardScale.value = withSequence(
      withTiming(0.93, { duration: 80 }),
      withSpring(1, { damping: 12, stiffness: 160 }),
    );
  }, [presetIndex]);

  // ── Dot indicator animated width ──────────────────────────────────────────
  const dotWidths = PRESETS.map((_, i) => useSharedValue(i === 0 ? 16 : 5));
  useEffect(() => {
    PRESETS.forEach((_, i) => {
      dotWidths[i].value = withSpring(i === presetIndex ? 16 : 5, { damping: 14, stiffness: 180 });
    });
  }, [presetIndex]);

  // ── Post button pulse when not posting ────────────────────────────────────
  const postBtnScale = useSharedValue(1);
  useEffect(() => {
    if (!posting) {
      const interval = setInterval(() => {
        postBtnScale.value = withSequence(
          withTiming(1.02, { duration: 700 }),
          withTiming(1,    { duration: 700 }),
        );
      }, 2800);
      return () => clearInterval(interval);
    }
  }, [posting]);
  const postBtnStyle = useAnimatedStyle(() => ({ transform: [{ scale: postBtnScale.value }] }));

  useFocusEffect(useCallback(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (camOpen)    { setCamOpen(false);    return true; }
      if (previewing) { setPreviewing(false); return true; }
      handleClose(); return true;
    });
    return () => sub.remove();
  }, [camOpen, previewing]));

  const capture = async () => {
    if (!imageReady) { Alert.alert('Please wait', 'Photo is still loading.'); return null; }
    try { return await captureRef(cardRef, { format: 'png', quality: 1, result: 'tmpfile' }); }
    catch { Alert.alert('Error', 'Could not capture card.'); return null; }
  };

  const handleSave = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permission needed', 'Allow media access to save.');
    const uri = await capture(); if (!uri) return;
    await MediaLibrary.saveToLibraryAsync(uri);
    Alert.alert('Saved! 🎉', 'Story card saved to your gallery.');
  };

  const handleShare = async () => {
    const uri = await capture(); if (!uri) return;
    if (!(await Sharing.isAvailableAsync())) return Alert.alert('Sharing not available.');
    await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share your workout' });
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permission needed');
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: false, quality: 0.9 });
    if (!result.canceled) {
      setImageReady(false);
      setPhotoUri(result.assets[0].uri);
      setTimeout(() => setImageReady(true), 4000);
    }
  };

  const handlePost = async () => {
    setPosting(true);
    try {
      await createPost(userId, userName, {
        imageUri: photoUri, workoutType: workout.type, streak,
        date: workout.date || format(new Date(), 'yyyy-MM-dd'),
        durationSeconds: workout.durationSeconds || 0,
        caloriesBurned: workout.caloriesBurned || 0,
        caption: caption.trim(), exercises: workout.exercises || [],
      });
      Alert.alert('Posted! 🔥', 'Your workout is live on the community feed!', [
        { text: 'View Feed', onPress: () => navigation?.navigate('Feed') },
        { text: 'Done', style: 'cancel' },
      ]);
    } catch { Alert.alert('Error', 'Could not post. Try again.'); }
    finally { setPosting(false); }
  };

  const goToPreset = (i) => {
    scrollRef.current?.scrollTo({ x: i * SW, animated: true });
    setPresetIndex(i);
    if (hintVisible) setHintVisible(false);
  };

  const onScroll = useCallback((e) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SW);
    if (idx !== presetIndex && idx >= 0 && idx < PRESETS.length) {
      setPresetIndex(idx);
      if (hintVisible) setHintVisible(false);
    }
  }, [presetIndex, hintVisible]);

  const onPreviewScroll = useCallback((e) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SW);
    if (idx >= 0 && idx < PRESETS.length && idx !== presetIndex) {
      setPresetIndex(idx);
      scrollRef.current?.scrollTo({ x: idx * SW, animated: false });
    }
  }, [presetIndex]);

  const openPreview = () => {
    setPreviewing(true);
    setTimeout(() => {
      previewScrollRef.current?.scrollTo({ x: presetIndex * SW, animated: false });
    }, 50);
  };

  if (camOpen) {
    return (
      <CameraScreen
        onCapture={(uri) => {
          setImageReady(false);
          setPhotoUri(uri);
          setCamOpen(false);
          setTimeout(() => setImageReady(true), 4000);
        }}
        onClose={() => setCamOpen(false)}
        C={C}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }} onStartShouldSetResponder={() => { if (fontPanelOpen) { setFontPanelOpen(false); } return false; }}>
      <StoryCard
        cardRef={cardRef} photoUri={photoUri} workout={workout}
        streak={streak} userName={userName} presetIndex={presetIndex} fontOpts={fontOpts}
        onImageLoad={() => setImageReady(true)}
      />

      {/* ─── Full-screen preview modal ─── */}
      <Modal visible={previewing} animationType="fade" statusBarTranslucent onRequestClose={() => setPreviewing(false)}>
        <StatusBar hidden />
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <ScrollView
            ref={previewScrollRef}
            horizontal pagingEnabled
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            bounces={false}
            onMomentumScrollEnd={onPreviewScroll}
            style={{ flex: 1 }}
          >
            {PRESETS.map((_, i) => {
              const Layout = PRESETS[i];
              return (
                <View key={i} style={{ width: SW, height: SH, justifyContent: 'center' }}>
                  <Layout
                    photoUri={photoUri} workout={workout} streak={streak} userName={userName}
                    dateStr={dateStr} timeStr={timeStr} calStr={calStr}
                    exCount={workout.exercises?.length || 0}
                    w={SW} h={SH} s={(n) => n}
                    fontFamily={fontOpts.family}
                    sizeScale={fontOpts.sizeScale} letterMult={fontOpts.letterMult} lineMult={fontOpts.lineMult}
                  />
                </View>
              );
            })}
          </ScrollView>
          <TouchableOpacity
            style={{ position: 'absolute', top: 52, right: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' }}
            onPress={() => setPreviewing(false)}
          >
            <Ionicons name="close" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={{ position: 'absolute', bottom: 48, left: 0, right: 0, alignItems: 'center', pointerEvents: 'none' }}>
            <View style={{ backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 }}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: C.accent, letterSpacing: 1.5 }}>{PRESET_NAMES[presetIndex]}</Text>
            </View>
          </View>
        </View>
      </Modal>


      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled" onScrollBeginDrag={() => setFontPanelOpen(false)}>

        {/* ── HEADER ── */}
        <Animated.View entering={FadeInDown.duration(350)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 16 }}>
          <TouchableOpacity
            onPress={handleClose}
            style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="chevron-back" size={22} color={C.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 24, fontWeight: '900', color: C.text, letterSpacing: -0.5, fontFamily: F.display }}>Share</Text>
            <Text style={{ fontSize: 12, color: C.textSub, fontWeight: '600', marginTop: 1 }}>
              {workout.type}{timeStr ? `  ·  ${timeStr}` : ''}{calStr ? `  ·  ${calStr} kcal` : ''}
            </Text>
          </View>
          {/* Font & Style toggle — top right */}
          <TouchableOpacity
            onPress={() => setFontPanelOpen(o => !o)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: fontPanelOpen ? C.accent + '18' : C.surface, borderWidth: 1, borderColor: fontPanelOpen ? C.accent + '60' : C.border }}
            activeOpacity={0.75}
          >
            <Ionicons name="text-outline" size={15} color={fontPanelOpen ? C.accent : C.textSub} />
            <Text style={{ fontSize: 12, fontWeight: '700', color: fontPanelOpen ? C.accent : C.textSub }}>Style</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* ── CARD CAROUSEL ── */}
        <View style={{ width: SW, paddingBottom: 14, backgroundColor: C.surface }}>
          <ScrollView
            ref={scrollRef}
            horizontal pagingEnabled
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            bounces={false}
            onMomentumScrollEnd={onScroll}
            style={{ width: SW }}
          >
            {PRESETS.map((_, i) => (
              <View key={i} style={{ width: SW, height: THUMB_H, alignItems: 'center', justifyContent: 'center' }}>
                <Animated.View style={i === presetIndex ? cardAnimStyle : undefined}>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={openPreview}
                    style={{ width: THUMB_W, height: THUMB_H, borderRadius: 18, overflow: 'hidden', shadowColor: C.accent, shadowOpacity: i === presetIndex ? 0.25 : 0.1, shadowRadius: 20, elevation: 14 }}
                  >
                    <PresetCard index={i} photoUri={photoUri} workout={workout} streak={streak} userName={userName} fontOpts={fontOpts} />
                  </TouchableOpacity>
                </Animated.View>
              </View>
            ))}
          </ScrollView>

          {/* Swipe hint */}
          {hintVisible && (
            <Animated.View entering={FadeIn.duration(600).delay(400)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, marginTop: 10, alignSelf: 'center' }} pointerEvents="none">
              <Ionicons name="swap-horizontal-outline" size={13} color="rgba(255,255,255,0.55)" />
              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: '600', letterSpacing: 0.3 }}>swipe anywhere to change style</Text>
            </Animated.View>
          )}

          {/* Animated dots */}
          <View style={{ flexDirection: 'row', gap: 4, marginTop: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 }}>
            {PRESETS.map((_, i) => {
              const dotStyle = useAnimatedStyle(() => ({
                width: dotWidths[i].value,
                height: 5, borderRadius: 3,
                backgroundColor: i === presetIndex ? C.accent : C.muted,
              }));
              return (
                <TouchableOpacity key={i} onPress={() => goToPreset(i)}>
                  <Animated.View style={dotStyle} />
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={{ fontSize: 11, fontWeight: '800', color: C.accent, letterSpacing: 1.5, marginTop: 6, textTransform: 'uppercase', textAlign: 'center' }}>
            {PRESET_NAMES[presetIndex]}
          </Text>
          <Text style={{ fontSize: 11, color: C.muted, fontWeight: '600', marginTop: 4, textAlign: 'center' }}>
            <Ionicons name="expand-outline" size={11} color={C.muted} />{'  '}Tap card to preview full story · swipe to change
          </Text>
        </View>

        {/* ── FONT PANEL (drops down from header toggle) ── */}
        {fontPanelOpen && (
          <FontPanel
            fontKey={fontKey} sizeKey={sizeKey} spaceKey={spaceKey}
            onFont={setFontKey} onSize={setSizeKey} onSpace={setSpaceKey}
            C={C}
          />
        )}

        {/* ── PHOTO CONTROLS ── */}
        <Animated.View entering={FadeInDown.duration(350).delay(80)} style={{ flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: C.border, gap: 8 }}>
          {[
            { label: photoUri ? 'Retake' : 'Camera',  icon: 'camera-outline', color: C.accent,    fn: () => setCamOpen(true) },
            { label: photoUri ? 'Change' : 'Gallery', icon: 'image-outline',  color: '#a78bfa',   fn: pickFromGallery },
            ...(photoUri ? [{ label: 'Remove', icon: 'trash-outline', color: '#ff6b6b', fn: () => { setPhotoUri(null); setImageReady(true); } }] : []),
          ].map(({ label, icon, color, fn }) => (
            <TouchableOpacity key={label}
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 10, paddingVertical: 10, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border }}
              onPress={fn}
            >
              <Ionicons name={icon} size={15} color={color} />
              <Text style={{ fontSize: 13, fontWeight: '700', color }}>{label}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* ── CAPTION ── */}
        <Animated.View entering={FadeInDown.duration(350).delay(120)} style={{ marginHorizontal: 16, marginTop: 4, marginBottom: 4, backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, paddingTop: 8, paddingBottom: 4 }}>
          <TextInput
            style={{ fontSize: 14, color: C.text, minHeight: 32, maxHeight: 56, textAlignVertical: 'top', lineHeight: 20, fontFamily: F.body }}
            placeholder="say something… 💪"
            placeholderTextColor={C.muted}
            value={caption}
            onChangeText={setCaption}
            multiline
            maxLength={200}
          />
          <Text style={{ fontSize: 10, fontWeight: '600', color: C.muted, textAlign: 'right', marginTop: 2 }}>{caption.length}/200</Text>
        </Animated.View>

        {/* ── SHARE ACTIONS ── */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 20, paddingHorizontal: 20, paddingVertical: 16 }}>
          {[
            { icon: 'download-outline', color: C.accent,   label: 'Save',      fn: handleSave,  delay: 160 },
            { icon: 'logo-whatsapp',    color: '#25D366',  label: 'WhatsApp',  fn: handleShare, delay: 220 },
            { icon: 'logo-instagram',   color: '#E1306C',  label: 'Instagram', fn: handleShare, delay: 280 },
            { icon: 'share-outline',    color: '#f97316',  label: 'More',      fn: handleShare, delay: 340 },
          ].map(({ icon, color, label, fn, delay }) => (
            <ActionBtn key={label} icon={icon} color={color} label={label} onPress={fn} delay={delay} />
          ))}
        </View>

        {/* ── POST BUTTON ── */}
        <Animated.View entering={FadeInUp.duration(400).delay(200)} style={[postBtnStyle, { marginHorizontal: 20 }]}>
          <TouchableOpacity
            style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 16, height: 52, backgroundColor: C.accent + '12', borderWidth: 1.5, borderColor: C.accent + '40' }, posting && { opacity: 0.5 }]}
            onPress={handlePost}
            disabled={posting}
            activeOpacity={0.85}
          >
            <Text style={{ fontSize: 16 }}>🔒</Text>
            <Text style={{ fontSize: 15, fontWeight: '800', color: C.accent, fontFamily: F.heading }}>{posting ? 'Posting...' : 'Post to LockIn Community'}</Text>
          </TouchableOpacity>
        </Animated.View>

      </ScrollView>
    </View>
  );
}
