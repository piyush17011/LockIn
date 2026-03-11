import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, ScrollView, TouchableOpacity,
  Image, TextInput, Modal, KeyboardAvoidingView,
  Platform, RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { getGlobalFeed, toggleLike, addComment, getComments } from '../../services/socialService';
import { useTheme } from '../../hooks/ThemeContext';
import { formatDistanceToNow } from 'date-fns';
import { formatDurationShort } from '../../constants/calorieCalc';

function timeAgo(ts) {
  if (!ts) return '';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return formatDistanceToNow(date, { addSuffix: true });
}

// ─── Comment Sheet ────────────────────────────────────────────────────────────
function CommentSheet({ visible, postId, onClose, user, userName, C, F }) {
  const [comments, setComments] = useState([]);
  const [text, setText]         = useState('');
  const [loading, setLoading]   = useState(true);
  const [sending, setSending]   = useState(false);

  useEffect(() => {
    if (!visible || !postId) return;
    setLoading(true);
    getComments(postId).then((c) => { setComments(c); setLoading(false); });
  }, [visible, postId]);

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await addComment(postId, user.uid, userName, text.trim());
      setComments((prev) => [...prev, {
        id: Date.now().toString(), userId: user.uid,
        userName, text: text.trim(), createdAt: null,
      }]);
      setText('');
    } finally { setSending(false); }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={[cs.root, { backgroundColor: C.bg }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={[cs.header, { borderColor: C.border }]}>
          <Text style={[cs.title, { color: C.text, fontFamily: F.display }]}>Comments</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={C.textSub} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={C.accent} style={{ marginTop: 40 }} />
        ) : comments.length === 0 ? (
          <View style={cs.empty}>
            <Text style={{ fontSize: 32 }}>💬</Text>
            <Text style={[cs.emptyText, { color: C.textSub, fontFamily: F.body }]}>No comments yet. Be first!</Text>
          </View>
        ) : (
          <FlatList
            data={comments}
            keyExtractor={(c) => c.id}
            contentContainerStyle={{ padding: 20 }}
            renderItem={({ item }) => (
              <View style={cs.commentRow}>
                <View style={[cs.avatar, { backgroundColor: C.accent + '22', borderColor: C.accent + '44' }]}>
                  <Text style={[cs.avatarText, { color: C.accent, fontFamily: F.heading }]}>{item.userName?.[0]?.toUpperCase() || '?'}</Text>
                </View>
                <View style={[cs.commentBubble, { backgroundColor: C.card, borderColor: C.border }]}>
                  <Text style={[cs.commentUser, { color: C.accent, fontFamily: F.heading }]}>{item.userName}</Text>
                  <Text style={[cs.commentText, { color: C.text, fontFamily: F.body }]}>{item.text}</Text>
                </View>
              </View>
            )}
          />
        )}

        <View style={[cs.inputRow, { borderColor: C.border }]}>
          <View style={[cs.avatar, { backgroundColor: C.accent + '22', borderColor: C.accent + '44' }]}>
            <Text style={[cs.avatarText, { color: C.accent, fontFamily: F.heading }]}>{userName?.[0]?.toUpperCase() || '?'}</Text>
          </View>
          <TextInput
            style={[cs.input, { backgroundColor: C.card, borderColor: C.border, color: C.text, fontFamily: F.body }]}
            placeholder="Add a comment..."
            placeholderTextColor={C.textSub}
            value={text}
            onChangeText={setText}
            multiline
          />
          <TouchableOpacity
            style={[cs.sendBtn, { backgroundColor: C.accent }, (!text.trim() || sending) && { opacity: 0.4 }]}
            onPress={handleSend}
            disabled={!text.trim() || sending}
          >
            <Ionicons name="send" size={18} color={C.btnText} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Workout Detail Modal ─────────────────────────────────────────────────────
function WorkoutDetailModal({ visible, post, onClose, C, F }) {
  if (!post) return null;
  const duration = post.durationSeconds ? formatDurationShort(post.durationSeconds) : null;
  const calories = post.caloriesBurned || null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[wd.root, { backgroundColor: C.bg }]}>

        <View style={[wd.header, { borderColor: C.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[wd.workoutType, { color: C.text, fontFamily: F.display }]}>{post.workoutType}</Text>
            <Text style={[wd.userName, { color: C.textSub, fontFamily: F.body }]}>{post.userName} · {post.date}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={[wd.closeBtn, { backgroundColor: C.card, borderColor: C.border }]}>
            <Ionicons name="close" size={20} color={C.textSub} />
          </TouchableOpacity>
        </View>

        {(duration || calories) && (
          <View style={[wd.statsStrip, { backgroundColor: C.card, borderColor: C.border }]}>
            {duration && (
              <View style={wd.statBlock}>
                <Text style={[wd.statValue, { color: C.text, fontFamily: F.display }]}>{duration}</Text>
                <Text style={[wd.statLabel, { color: C.textSub, fontFamily: F.heading }]}>TIME</Text>
              </View>
            )}
            {duration && calories && <View style={[wd.statSep, { backgroundColor: C.border }]} />}
            {calories && (
              <View style={wd.statBlock}>
                <Text style={[wd.statValue, { color: C.text, fontFamily: F.display }]}>{calories}</Text>
                <Text style={[wd.statLabel, { color: C.textSub, fontFamily: F.heading }]}>CAL</Text>
              </View>
            )}
            <View style={[wd.statSep, { backgroundColor: C.border }]} />
            <View style={wd.statBlock}>
              <Text style={[wd.statValue, { color: C.text, fontFamily: F.display }]}>🔥 {post.streak}</Text>
              <Text style={[wd.statLabel, { color: C.textSub, fontFamily: F.heading }]}>STREAK</Text>
            </View>
          </View>
        )}

        {!!post.caption && (
          <View style={[wd.captionWrap, { borderColor: C.border }]}>
            <Text style={[wd.captionText, { color: C.textSub, fontFamily: F.body }]}>"{post.caption}"</Text>
          </View>
        )}

        <ScrollView contentContainerStyle={wd.scroll} showsVerticalScrollIndicator={false}>
          {post.exercises?.length > 0 ? (
            post.exercises.map((ex, i) => {
              const repsArr   = ex.reps   ? ex.reps.toString().split('/')   : [];
              const weightArr = ex.weight ? ex.weight.toString().split('/') : [];
              const setCount  = ex.sets   || repsArr.length || 1;
              return (
                <View key={i} style={[wd.exCard, { backgroundColor: C.card, borderColor: C.border, borderTopWidth: 3, borderTopColor: C.accent }]}>
                  <View style={wd.exHeader}>
                    <Text style={wd.exEmoji}>{ex.emoji || '💪'}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[wd.exName, { color: C.text, fontFamily: F.heading }]}>{ex.name}</Text>
                      {ex.muscle ? <Text style={[wd.exMuscle, { color: C.textSub, fontFamily: F.body }]}>{ex.muscle}</Text> : null}
                    </View>
                    <View style={[wd.setCountBadge, { backgroundColor: C.accent + '18', borderColor: C.accent + '35' }]}>
                      <Text style={[wd.setCountText, { color: C.accent, fontFamily: F.heading }]}>{setCount} sets</Text>
                    </View>
                  </View>
                  {Array.from({ length: setCount }).map((_, si) => (
                    <View key={si} style={wd.setRow}>
                      <View style={[wd.setNum, { backgroundColor: C.surface, borderColor: C.border }]}>
                        <Text style={[wd.setNumText, { color: C.textSub, fontFamily: F.heading }]}>{si + 1}</Text>
                      </View>
                      <View style={[wd.setChip, { backgroundColor: C.bg, borderColor: C.border }]}>
                        <Text style={[wd.setChipLabel, { color: C.textSub, fontFamily: F.heading }]}>WEIGHT</Text>
                        <Text style={[wd.setChipVal, { color: C.text, fontFamily: F.heading }]}>{weightArr[si] || '—'} kg</Text>
                      </View>
                      <View style={[wd.setChip, { backgroundColor: C.bg, borderColor: C.border }]}>
                        <Text style={[wd.setChipLabel, { color: C.textSub, fontFamily: F.heading }]}>REPS</Text>
                        <Text style={[wd.setChipVal, { color: C.text, fontFamily: F.heading }]}>{repsArr[si] || '—'}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              );
            })
          ) : (
            <View style={wd.noEx}>
              <Text style={[wd.noExText, { color: C.textSub, fontFamily: F.body }]}>No exercise details recorded</Text>
            </View>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Stat helper ─────────────────────────────────────────────────────────────
function formatTime(seconds) {
  if (!seconds) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s > 0 ? s + 's' : ''}`.trim();
  return `${s}s`;
}

function formatCal(cal) {
  if (!cal) return null;
  return cal >= 1000 ? `${(cal / 1000).toFixed(1)}k` : `${cal}`;
}

// ─── Post Card ────────────────────────────────────────────────────────────────
function PostCard({ post, currentUserId, onLike, onComment, onShare, onProfile, onImagePress, C, F }) {
  const liked    = (post.likes || []).includes(currentUserId);
  const timeStr  = formatTime(post.durationSeconds);
  const calStr   = formatCal(post.caloriesBurned);
  const exCount  = post.exercises?.length || 0;
  const hasStats = timeStr || calStr || exCount > 0;

  return (
    <Animated.View entering={FadeInDown.duration(400)} style={[pc.card, { backgroundColor: C.card, borderColor: C.border }]}>

      {/* Accent top bar */}
      <View style={[pc.accentBar, { backgroundColor: C.accent }]} />

      {/* ── Header row ── */}
      <TouchableOpacity style={pc.header} onPress={() => onProfile(post.userId)} activeOpacity={0.8}>
        <View style={[pc.avatar, { backgroundColor: C.accent + '20', borderColor: C.accent + '50' }]}>
          <Text style={[pc.avatarText, { color: C.accent, fontFamily: F.heading }]}>
            {post.userName?.[0]?.toUpperCase() || '?'}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[pc.userName, { color: C.text, fontFamily: F.heading }]}>{post.userName}</Text>
          <Text style={[pc.timeAgoText, { color: C.textSub, fontFamily: F.body }]}>{timeAgo(post.createdAt)}</Text>
        </View>
        {/* Streak badge */}
        <View style={[pc.streakBadge, { backgroundColor: '#ff6b2220', borderColor: '#ff6b2240' }]}>
          <Text style={{ fontSize: 13 }}>🔥</Text>
          <Text style={[pc.streakNum, { color: '#ff8c42', fontFamily: F.heading }]}>{post.streak}</Text>
        </View>
      </TouchableOpacity>

      {/* ── Workout title ── */}
      <View style={pc.titleRow}>
        <Text style={[pc.workoutTitle, { color: C.text, fontFamily: F.display }]}>{post.workoutType}</Text>
        <Text style={[pc.dateText, { color: C.textSub, fontFamily: F.body }]}>{post.date}</Text>
      </View>

      {/* ── Caption ── */}
      {!!post.caption && (
        <Text style={[pc.caption, { color: C.textSub, fontFamily: F.body }]}>"{post.caption}"</Text>
      )}

      {/* ── Stats strip ── */}
      {hasStats && (
        <View style={[pc.statsStrip, { backgroundColor: C.bg, borderColor: C.border }]}>
          {timeStr && (
            <View style={pc.statCell}>
              <View style={pc.statIconRow}>
                <Ionicons name="timer-outline" size={13} color={C.accent} />
                <Text style={[pc.statVal, { color: C.text, fontFamily: F.display }]}>{timeStr}</Text>
              </View>
              <Text style={[pc.statLbl, { color: C.textSub, fontFamily: F.heading }]}>DURATION</Text>
            </View>
          )}
          {timeStr && (calStr || exCount > 0) && (
            <View style={[pc.statSep, { backgroundColor: C.border }]} />
          )}
          {calStr && (
            <View style={pc.statCell}>
              <View style={pc.statIconRow}>
                <Ionicons name="flame-outline" size={13} color="#f97316" />
                <Text style={[pc.statVal, { color: C.text, fontFamily: F.display }]}>{calStr}</Text>
              </View>
              <Text style={[pc.statLbl, { color: C.textSub, fontFamily: F.heading }]}>KCAL</Text>
            </View>
          )}
          {calStr && exCount > 0 && (
            <View style={[pc.statSep, { backgroundColor: C.border }]} />
          )}
          {exCount > 0 && (
            <View style={pc.statCell}>
              <View style={pc.statIconRow}>
                <Ionicons name="barbell-outline" size={13} color={C.accent} />
                <Text style={[pc.statVal, { color: C.text, fontFamily: F.display }]}>{exCount}</Text>
              </View>
              <Text style={[pc.statLbl, { color: C.textSub, fontFamily: F.heading }]}>EXERCISES</Text>
            </View>
          )}
        </View>
      )}

      {/* ── Photo / workout placeholder ── */}
      <TouchableOpacity onPress={() => onImagePress(post)} activeOpacity={0.9} style={pc.imageWrap}>
        {post.imageUrl ? (
          <Image source={{ uri: post.imageUrl }} style={pc.image} resizeMode="cover" />
        ) : (
          <View style={[pc.placeholder, { backgroundColor: C.surface }]}>
            <View style={[pc.placeholderIcon, { backgroundColor: C.accent + '18', borderColor: C.accent + '35' }]}>
              <Ionicons name="barbell-outline" size={28} color={C.accent} />
            </View>
            <Text style={[pc.placeholderTitle, { color: C.text, fontFamily: F.display }]}>{post.workoutType}</Text>
            <Text style={[pc.placeholderSub, { color: C.textSub, fontFamily: F.body }]}>Tap to view exercises</Text>
          </View>
        )}
        <View style={pc.viewBadge}>
          <Ionicons name="eye-outline" size={11} color="rgba(255,255,255,0.85)" />
          <Text style={pc.viewBadgeText}>View workout</Text>
        </View>
      </TouchableOpacity>

      {/* ── Actions ── */}
      <View style={[pc.actions, { borderColor: C.border }]}>
        <TouchableOpacity style={pc.action} onPress={() => onLike(post.id)} activeOpacity={0.7}>
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={22} color={liked ? '#f87171' : C.textSub} />
          <Text style={[pc.actionCount, { color: liked ? '#f87171' : C.textSub, fontFamily: F.heading }]}>
            {(post.likes || []).length}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={pc.action} onPress={() => onComment(post.id)} activeOpacity={0.7}>
          <Ionicons name="chatbubble-outline" size={20} color={C.textSub} />
          <Text style={[pc.actionCount, { color: C.textSub, fontFamily: F.heading }]}>{post.commentCount || 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={pc.action} onPress={() => onShare(post)} activeOpacity={0.7}>
          <Ionicons name="arrow-redo-outline" size={20} color={C.textSub} />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <Text style={[pc.commentHint, { color: C.textSub, fontFamily: F.body }]}>
          {post.commentCount > 0 ? `${post.commentCount} comment${post.commentCount > 1 ? 's' : ''}` : 'Be first to comment'}
        </Text>
      </View>

    </Animated.View>
  );
}

// ─── Feed Screen ──────────────────────────────────────────────────────────────
export default function FeedScreen({ navigation }) {
  const { scheme: C, font: F } = useTheme();
  const { user, userData }     = useAuth();

  const [posts, setPosts]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [commentPostId, setCommentPostId] = useState(null);
  const [detailPost, setDetailPost]   = useState(null);
  const [sharePost, setSharePost]     = useState(null);

  const loadFeed = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await getGlobalFeed(30);
      setPosts(data);
    } catch {
      Alert.alert('Error', 'Could not load feed.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadFeed(); }, [loadFeed]);

  useEffect(() => {
    if (!sharePost) return;
    navigation.navigate('WorkoutShare', {
      workout: {
        type:            sharePost.workoutType,
        exercises:       sharePost.exercises || [],
        date:            sharePost.date,
        durationSeconds: sharePost.durationSeconds || 0,
        caloriesBurned:  sharePost.caloriesBurned  || 0,
      },
      photoUri:  sharePost.imageUrl || null,
      streak:    sharePost.streak   || 0,
      userName:  userData?.displayName || user?.displayName || 'Athlete',
      userId:    user?.uid,
    });
    setSharePost(null);
  }, [sharePost]);

  const handleLike = async (postId) => {
    setPosts((prev) => prev.map((p) => {
      if (p.id !== postId) return p;
      const liked = p.likes.includes(user.uid);
      return { ...p, likes: liked ? p.likes.filter((id) => id !== user.uid) : [...p.likes, user.uid] };
    }));
    await toggleLike(postId, user.uid);
  };

  const handleProfile = (userId) => navigation.navigate('UserProfile', { userId });

  if (loading) {
    return (
      <View style={[f.loadingRoot, { backgroundColor: C.bg }]}>
        <ActivityIndicator color={C.accent} size="large" />
        <Text style={[f.loadingText, { color: C.textSub, fontFamily: F.body }]}>Loading feed...</Text>
      </View>
    );
  }

  return (
    <View style={[f.root, { backgroundColor: C.bg }]}>
      <FlatList
        data={posts}
        keyExtractor={(p) => p.id}
        contentContainerStyle={f.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadFeed(true)} tintColor={C.accent} />
        }
        ListHeaderComponent={
          <View style={f.feedHeader}>
            <Text style={[f.feedTitle, { color: C.text, fontFamily: F.display }]}>Community</Text>
            <Text style={[f.feedSub, { color: C.textSub, fontFamily: F.body }]}>See what everyone is grinding 💪</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={f.empty}>
            <Text style={{ fontSize: 48 }}>🏋️</Text>
            <Text style={[f.emptyTitle, { color: C.text, fontFamily: F.heading }]}>No posts yet</Text>
            <Text style={[f.emptySub, { color: C.textSub, fontFamily: F.body }]}>Log a workout and be the first to share!</Text>
          </View>
        }
        renderItem={({ item }) => (
          <PostCard
            post={item}
            currentUserId={user.uid}
            onLike={handleLike}
            onComment={(id) => setCommentPostId(id)}
            onShare={(post) => setSharePost(post)}
            onProfile={handleProfile}
            onImagePress={(post) => setDetailPost(post)}
            C={C} F={F}
          />
        )}
      />

      <CommentSheet
        visible={!!commentPostId}
        postId={commentPostId}
        onClose={() => setCommentPostId(null)}
        user={user}
        userName={userData?.displayName || user?.displayName || 'Athlete'}
        C={C} F={F}
      />
      <WorkoutDetailModal
        visible={!!detailPost}
        post={detailPost}
        onClose={() => setDetailPost(null)}
        C={C} F={F}
      />


    </View>
  );
}

// ─── Styles (layout only — colors applied inline) ─────────────────────────────

const wd = StyleSheet.create({
  root:          { flex: 1 },
  header:        { flexDirection: 'row', alignItems: 'flex-start', padding: 20, paddingTop: 24, borderBottomWidth: 1 },
  workoutType:   { fontSize: 22, fontWeight: '800' },
  userName:      { fontSize: 13, marginTop: 3 },
  closeBtn:      { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  statsStrip:    { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1 },
  statBlock:     { alignItems: 'center', flex: 1 },
  statValue:     { fontSize: 18, fontWeight: '800' },
  statLabel:     { fontSize: 10, fontWeight: '700', letterSpacing: 1, marginTop: 2 },
  statSep:       { width: 1, height: 32 },
  captionWrap:   { paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  captionText:   { fontSize: 15, fontStyle: 'italic', lineHeight: 22 },
  scroll:        { padding: 20 },
  exCard:        { borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1 },
  exHeader:      { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  exEmoji:       { fontSize: 26 },
  exName:        { fontSize: 15, fontWeight: '700' },
  exMuscle:      { fontSize: 12, marginTop: 2 },
  setCountBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1 },
  setCountText:  { fontSize: 12, fontWeight: '700' },
  setRow:        { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  setNum:        { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  setNumText:    { fontSize: 12, fontWeight: '700' },
  setChip:       { flex: 1, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10, borderWidth: 1, alignItems: 'center' },
  setChipLabel:  { fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  setChipVal:    { fontSize: 15, fontWeight: '700', marginTop: 2 },
  noEx:          { alignItems: 'center', paddingVertical: 40 },
  noExText:      { fontSize: 14 },
});

const cs = StyleSheet.create({
  root:          { flex: 1 },
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 20, borderBottomWidth: 1 },
  title:         { fontSize: 18, fontWeight: '800' },
  empty:         { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText:     { marginTop: 8, fontSize: 14 },
  commentRow:    { flexDirection: 'row', gap: 10, marginBottom: 14 },
  avatar:        { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  avatarText:    { fontWeight: '800', fontSize: 15 },
  commentBubble: { flex: 1, borderRadius: 14, padding: 10, borderWidth: 1 },
  commentUser:   { fontWeight: '700', fontSize: 12, marginBottom: 2 },
  commentText:   { fontSize: 14 },
  inputRow:      { flexDirection: 'row', alignItems: 'center', padding: 14, borderTopWidth: 1, gap: 10 },
  input:         { flex: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, fontSize: 14, maxHeight: 80 },
  sendBtn:       { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});

const pc = StyleSheet.create({
  card:             { borderRadius: 18, marginBottom: 12, borderWidth: 1, overflow: 'hidden' },
  accentBar:        { height: 3, width: '100%' },

  // Header
  header:           { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  avatar:           { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  avatarText:       { fontWeight: '800', fontSize: 14 },
  userName:         { fontWeight: '700', fontSize: 13 },
  timeAgoText:      { fontSize: 11, marginTop: 1 },
  streakBadge:      { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1 },
  streakNum:        { fontSize: 13, fontWeight: '800' },

  // Title
  titleRow:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingBottom: 2 },
  workoutTitle:     { fontSize: 17, fontWeight: '800', flex: 1 },
  dateText:         { fontSize: 12 },

  // Caption
  caption:          { fontSize: 12, lineHeight: 17, paddingHorizontal: 12, paddingBottom: 8, fontStyle: 'italic' },

  // Stats strip
  statsStrip:       { flexDirection: 'row', marginHorizontal: 12, marginBottom: 10, borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  statCell:         { flex: 1, alignItems: 'center', paddingVertical: 8, paddingHorizontal: 4 },
  statIconRow:      { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statVal:          { fontSize: 14, fontWeight: '800' },
  statLbl:          { fontSize: 8, fontWeight: '700', letterSpacing: 1, marginTop: 2 },
  statSep:          { width: 1 },

  // Image
  imageWrap:        { marginHorizontal: 0, marginTop: -6, marginBottom: 8, overflow: 'hidden' },
  image:            { width: '100%', aspectRatio: 4/5 },
  placeholder:      { height: 200, alignItems: 'center', justifyContent: 'center', gap: 8 },
  placeholderIcon:  { width: 64, height: 64, borderRadius: 32, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  placeholderTitle: { fontSize: 18, fontWeight: '800', letterSpacing: 1 },
  placeholderSub:   { fontSize: 12 },
  viewBadge:        { position: 'absolute', bottom: 10, right: 10, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4 },
  viewBadgeText:    { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '600' },

  // Actions
  actions:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 9, borderTopWidth: 1, gap: 12 },
  action:           { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionCount:      { fontSize: 14, fontWeight: '700' },
  commentHint:      { fontSize: 12 },
});

const f = StyleSheet.create({
  root:        { flex: 1 },
  loadingRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14 },
  list:        { padding: 20, paddingTop: 60 },
  feedHeader:  { marginBottom: 16 },
  feedTitle:   { fontSize: 28, fontWeight: '800' },
  feedSub:     { fontSize: 14, marginTop: 4 },
  empty:       { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyTitle:  { fontSize: 18, fontWeight: '700' },
  emptySub:    { fontSize: 14, textAlign: 'center' },
});
