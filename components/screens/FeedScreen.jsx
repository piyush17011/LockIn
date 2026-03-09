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
import { Colors, Spacing, Radius } from '../../constants/theme';
import { formatDistanceToNow } from 'date-fns';
import { formatDurationShort } from '../../constants/calorieCalc';

function timeAgo(ts) {
  if (!ts) return '';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return formatDistanceToNow(date, { addSuffix: true });
}

// ─── Comment Sheet ────────────────────────────────────────────────────────────
function CommentSheet({ visible, postId, onClose, user, userName }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

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
      <KeyboardAvoidingView style={cs.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={cs.header}>
          <Text style={cs.title}>Comments</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>
        {loading ? (
          <ActivityIndicator color={Colors.accent} style={{ marginTop: 40 }} />
        ) : comments.length === 0 ? (
          <View style={cs.empty}>
            <Text style={{ fontSize: 32 }}>💬</Text>
            <Text style={cs.emptyText}>No comments yet. Be first!</Text>
          </View>
        ) : (
          <FlatList
            data={comments}
            keyExtractor={(c) => c.id}
            contentContainerStyle={{ padding: Spacing.lg }}
            renderItem={({ item }) => (
              <View style={cs.commentRow}>
                <View style={cs.avatar}>
                  <Text style={cs.avatarText}>{item.userName?.[0]?.toUpperCase() || '?'}</Text>
                </View>
                <View style={cs.commentBubble}>
                  <Text style={cs.commentUser}>{item.userName}</Text>
                  <Text style={cs.commentText}>{item.text}</Text>
                </View>
              </View>
            )}
          />
        )}
        <View style={cs.inputRow}>
          <View style={cs.avatar}>
            <Text style={cs.avatarText}>{userName?.[0]?.toUpperCase() || '?'}</Text>
          </View>
          <TextInput
            style={cs.input} placeholder="Add a comment..."
            placeholderTextColor={Colors.muted} value={text}
            onChangeText={setText} multiline
          />
          <TouchableOpacity
            style={[cs.sendBtn, (!text.trim() || sending) && { opacity: 0.4 }]}
            onPress={handleSend} disabled={!text.trim() || sending}
          >
            <Ionicons name="send" size={18} color={Colors.bg} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Workout Detail Modal ─────────────────────────────────────────────────────
function WorkoutDetailModal({ visible, post, onClose }) {
  if (!post) return null;
  const duration = post.durationSeconds ? formatDurationShort(post.durationSeconds) : null;
  const calories = post.caloriesBurned || null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={wd.root}>
        {/* Header */}
        <View style={wd.header}>
          <View style={{ flex: 1 }}>
            <Text style={wd.workoutType}>{post.workoutType}</Text>
            <Text style={wd.userName}>{post.userName} · {post.date}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={wd.closeBtn}>
            <Ionicons name="close" size={20} color={Colors.muted} />
          </TouchableOpacity>
        </View>

        {/* Stats strip */}
        {(duration || calories) && (
          <View style={wd.statsStrip}>
            {duration && (
              <View style={wd.statBlock}>
                <Text style={wd.statValue}>{duration}</Text>
                <Text style={wd.statLabel}>TIME</Text>
              </View>
            )}
            {duration && calories && <View style={wd.statSep} />}
            {calories && (
              <View style={wd.statBlock}>
                <Text style={wd.statValue}>{calories}</Text>
                <Text style={wd.statLabel}>CAL</Text>
              </View>
            )}
            <View style={wd.statSep} />
            <View style={wd.statBlock}>
              <Text style={wd.statValue}>🔥 {post.streak}</Text>
              <Text style={wd.statLabel}>STREAK</Text>
            </View>
          </View>
        )}

        {/* Caption */}
        {!!post.caption && (
          <View style={wd.captionWrap}>
            <Text style={wd.captionText}>"{post.caption}"</Text>
          </View>
        )}

        {/* Exercise list */}
        <ScrollView contentContainerStyle={wd.scroll} showsVerticalScrollIndicator={false}>
          {post.exercises?.length > 0 ? (
            post.exercises.map((ex, i) => {
              const repsArr = ex.reps ? ex.reps.toString().split('/') : [];
              const weightArr = ex.weight ? ex.weight.toString().split('/') : [];
              const setCount = ex.sets || repsArr.length || 1;
              return (
                <View key={i} style={wd.exCard}>
                  <View style={wd.exHeader}>
                    <Text style={wd.exEmoji}>{ex.emoji || '💪'}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={wd.exName}>{ex.name}</Text>
                      {ex.muscle ? <Text style={wd.exMuscle}>{ex.muscle}</Text> : null}
                    </View>
                    <View style={wd.setCountBadge}>
                      <Text style={wd.setCountText}>{setCount} sets</Text>
                    </View>
                  </View>
                  {Array.from({ length: setCount }).map((_, si) => (
                    <View key={si} style={wd.setRow}>
                      <View style={wd.setNum}>
                        <Text style={wd.setNumText}>{si + 1}</Text>
                      </View>
                      <View style={wd.setChip}>
                        <Text style={wd.setChipLabel}>WEIGHT</Text>
                        <Text style={wd.setChipVal}>{weightArr[si] || '—'} kg</Text>
                      </View>
                      <View style={wd.setChip}>
                        <Text style={wd.setChipLabel}>REPS</Text>
                        <Text style={wd.setChipVal}>{repsArr[si] || '—'}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              );
            })
          ) : (
            <View style={wd.noEx}>
              <Text style={wd.noExText}>No exercise details recorded</Text>
            </View>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Post Card — Strava-style ─────────────────────────────────────────────────
function PostCard({ post, currentUserId, onLike, onComment, onProfile, onImagePress }) {
  const liked = (post.likes || []).includes(currentUserId);
  const duration = post.durationSeconds ? formatDurationShort(post.durationSeconds) : null;
  const calories = post.caloriesBurned || null;
  const hasStats = duration || calories;

  return (
    <Animated.View entering={FadeInDown.duration(400)} style={styles.postCard}>

      {/* Header: avatar + name + time */}
      <TouchableOpacity style={styles.postHeader} onPress={() => onProfile(post.userId)}>
        <View style={styles.postAvatar}>
          <Text style={styles.postAvatarText}>{post.userName?.[0]?.toUpperCase() || '?'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.postUserName}>{post.userName}</Text>
          <Text style={styles.postTime}>{timeAgo(post.createdAt)}</Text>
        </View>
      </TouchableOpacity>

      {/* Workout type — big like Strava activity name */}
      <View style={styles.workoutNameRow}>
        <Text style={styles.workoutName}>{post.workoutType}</Text>
        <View style={styles.streakPill}>
          <Text style={styles.streakPillText}>🔥 {post.streak}</Text>
        </View>
      </View>

      {/* Stats row — like Strava: Distance / Time / Cal */}
      {hasStats && (
        <View style={styles.statsRow}>
          {duration && (
            <View style={styles.statBlock}>
              <Text style={styles.statValue}>{duration}</Text>
              <Text style={styles.statLabel}>Time</Text>
            </View>
          )}
          {duration && calories && <View style={styles.statDivider} />}
          {calories && (
            <View style={styles.statBlock}>
              <Text style={styles.statValue}>{calories}</Text>
              <Text style={styles.statLabel}>Cal</Text>
            </View>
          )}
        </View>
      )}

      {/* Caption */}
      {!!post.caption && (
        <Text style={styles.captionText}>{post.caption}</Text>
      )}

      {/* Photo — tap to see workout detail */}
      <TouchableOpacity onPress={() => onImagePress(post)} activeOpacity={0.92}>
        {post.imageUrl ? (
          <Image source={{ uri: post.imageUrl }} style={styles.postImage} resizeMode="cover" />
        ) : (
          <View style={styles.postImagePlaceholder}>
            <Text style={styles.postImagePlaceholderType}>{post.workoutType}</Text>
            <Text style={styles.postImagePlaceholderSub}>Tap to see workout 💪</Text>
          </View>
        )}
        <View style={styles.tapHint}>
          <Ionicons name="barbell-outline" size={12} color="rgba(255,255,255,0.7)" />
          <Text style={styles.tapHintText}>View workout</Text>
        </View>
      </TouchableOpacity>

      {/* Date */}
      <Text style={styles.postDate}>{post.date}</Text>

      {/* Actions */}
      <View style={styles.postActions}>
        <TouchableOpacity style={styles.postAction} onPress={() => onLike(post.id)}>
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={22}
            color={liked ? '#ff6b6b' : Colors.muted}
          />
          <Text style={[styles.postActionCount, liked && { color: '#ff6b6b' }]}>
            {(post.likes || []).length}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.postAction} onPress={() => onComment(post.id)}>
          <Ionicons name="chatbubble-outline" size={20} color={Colors.muted} />
          <Text style={styles.postActionCount}>{post.commentCount || 0}</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

// ─── Feed Screen ──────────────────────────────────────────────────────────────
export default function FeedScreen({ navigation }) {
  const { user, userData } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [commentPostId, setCommentPostId] = useState(null);
  const [detailPost, setDetailPost] = useState(null);

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
      <View style={styles.loadingRoot}>
        <ActivityIndicator color={Colors.accent} size="large" />
        <Text style={styles.loadingText}>Loading feed...</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <FlatList
        data={posts}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadFeed(true)}
            tintColor={Colors.accent}
          />
        }
        ListHeaderComponent={
          <View style={styles.feedHeader}>
            <Text style={styles.feedTitle}>Community</Text>
            <Text style={styles.feedSub}>See what everyone is grinding 💪</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 48 }}>🏋️</Text>
            <Text style={styles.emptyTitle}>No posts yet</Text>
            <Text style={styles.emptySub}>Log a workout and be the first to share!</Text>
          </View>
        }
        renderItem={({ item }) => (
          <PostCard
            post={item}
            currentUserId={user.uid}
            onLike={handleLike}
            onComment={(id) => setCommentPostId(id)}
            onProfile={handleProfile}
            onImagePress={(post) => setDetailPost(post)}
          />
        )}
      />
      <CommentSheet
        visible={!!commentPostId}
        postId={commentPostId}
        onClose={() => setCommentPostId(null)}
        user={user}
        userName={userData?.displayName || user?.displayName || 'Athlete'}
      />
      <WorkoutDetailModal
        visible={!!detailPost}
        post={detailPost}
        onClose={() => setDetailPost(null)}
      />
    </View>
  );
}

// ─── Workout Detail Modal Styles ─────────────────────────────────────────────
const wd = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'flex-start', padding: 20, paddingTop: 24, borderBottomWidth: 1, borderColor: Colors.border },
  workoutType: { color: Colors.text, fontSize: 22, fontWeight: '800' },
  userName: { color: Colors.muted, fontSize: 13, marginTop: 3 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  statsStrip: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderColor: Colors.border },
  statBlock: { alignItems: 'center', flex: 1 },
  statValue: { color: Colors.text, fontSize: 18, fontWeight: '800' },
  statLabel: { color: Colors.muted, fontSize: 10, fontWeight: '700', letterSpacing: 1, marginTop: 2 },
  statSep: { width: 1, height: 32, backgroundColor: Colors.border },
  captionWrap: { paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderColor: Colors.border },
  captionText: { color: Colors.textSub, fontSize: 15, fontStyle: 'italic', lineHeight: 22 },
  scroll: { padding: 20 },
  exCard: { backgroundColor: Colors.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  exHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  exEmoji: { fontSize: 26 },
  exName: { color: Colors.text, fontSize: 15, fontWeight: '700' },
  exMuscle: { color: Colors.muted, fontSize: 12, marginTop: 2 },
  setCountBadge: { backgroundColor: 'rgba(0,245,196,0.1)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(0,245,196,0.2)' },
  setCountText: { color: Colors.accent, fontSize: 12, fontWeight: '700' },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  setNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.surface || '#0e1219', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  setNumText: { color: Colors.muted, fontSize: 12, fontWeight: '700' },
  setChip: { flex: 1, backgroundColor: Colors.bg, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  setChipLabel: { color: Colors.muted, fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  setChipVal: { color: Colors.text, fontSize: 15, fontWeight: '700', marginTop: 2 },
  noEx: { alignItems: 'center', paddingVertical: 40 },
  noExText: { color: Colors.muted, fontSize: 14 },
});

// ─── Comment Sheet Styles ─────────────────────────────────────────────────────
const cs = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg, paddingTop: 20, borderBottomWidth: 1, borderColor: Colors.border },
  title: { fontSize: 18, fontWeight: '800', color: Colors.text },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { color: Colors.muted, marginTop: 8, fontSize: 14 },
  commentRow: { flexDirection: 'row', gap: 10, marginBottom: Spacing.md },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,245,196,0.15)', borderWidth: 1, borderColor: 'rgba(0,245,196,0.3)', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: Colors.accent, fontWeight: '800', fontSize: 15 },
  commentBubble: { flex: 1, backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  commentUser: { color: Colors.accent, fontWeight: '700', fontSize: 12, marginBottom: 2 },
  commentText: { color: Colors.text, fontSize: 14 },
  inputRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderTopWidth: 1, borderColor: Colors.border, gap: 10 },
  input: { flex: 1, backgroundColor: Colors.card, borderRadius: Radius.lg, paddingHorizontal: Spacing.md, paddingVertical: 10, color: Colors.text, borderWidth: 1, borderColor: Colors.border, fontSize: 14, maxHeight: 80 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' },
});

// ─── Main Styles ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  loadingRoot: { flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: Colors.muted, fontSize: 14 },
  list: { padding: Spacing.lg, paddingTop: 60 },
  feedHeader: { marginBottom: Spacing.lg },
  feedTitle: { fontSize: 28, fontWeight: '800', color: Colors.text },
  feedSub: { color: Colors.muted, fontSize: 14, marginTop: 4 },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyTitle: { color: Colors.text, fontSize: 18, fontWeight: '700' },
  emptySub: { color: Colors.muted, fontSize: 14, textAlign: 'center' },

  postCard: { backgroundColor: Colors.card, borderRadius: Radius.xl, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },

  // Header
  postHeader: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: 10 },
  postAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(0,245,196,0.15)', borderWidth: 1.5, borderColor: 'rgba(0,245,196,0.3)', alignItems: 'center', justifyContent: 'center' },
  postAvatarText: { color: Colors.accent, fontWeight: '800', fontSize: 18 },
  postUserName: { color: Colors.text, fontWeight: '700', fontSize: 15 },
  postTime: { color: Colors.muted, fontSize: 12, marginTop: 1 },

  // Workout name + streak — like Strava activity title
  workoutNameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm },
  workoutName: { color: Colors.text, fontWeight: '800', fontSize: 20, flex: 1 },
  streakPill: { backgroundColor: 'rgba(0,245,196,0.08)', borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(0,245,196,0.2)' },
  streakPillText: { color: Colors.accent, fontSize: 12, fontWeight: '700' },

  // Stats row — like Strava
  statsRow: { flexDirection: 'row', paddingHorizontal: Spacing.md, paddingBottom: Spacing.md, gap: 24 },
  statBlock: { alignItems: 'flex-start' },
  statValue: { color: Colors.text, fontWeight: '800', fontSize: 20 },
  statLabel: { color: Colors.muted, fontSize: 12, fontWeight: '600', marginTop: 1 },
  statDivider: { width: 1, height: 32, backgroundColor: Colors.border, alignSelf: 'center' },

  // Photo
  postImage: { width: '100%', height: 300 },
  postImagePlaceholder: { height: 180, backgroundColor: '#0d1117', alignItems: 'center', justifyContent: 'center', borderTopWidth: 1, borderBottomWidth: 1, borderColor: Colors.border },
  postImagePlaceholderType: { color: Colors.accent, fontSize: 28, fontWeight: '800', letterSpacing: 2 },
  postImagePlaceholderSub: { color: Colors.muted, fontSize: 14, marginTop: 4 },

  // Date + actions
  postDate: { color: Colors.muted, fontSize: 12, paddingHorizontal: Spacing.md, paddingTop: Spacing.sm },
  postActions: { flexDirection: 'row', padding: Spacing.md, gap: Spacing.lg, borderTopWidth: 1, borderColor: Colors.border, marginTop: Spacing.sm },
  postAction: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  postActionCount: { color: Colors.muted, fontSize: 14, fontWeight: '600' },
  captionText: { color: Colors.text, fontSize: 14, lineHeight: 20, paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm },
  tapHint: { position: 'absolute', bottom: 8, right: 10, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4 },
  tapHintText: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '600' },
});
