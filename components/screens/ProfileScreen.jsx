import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, FlatList, ActivityIndicator, Alert, TextInput, Modal, Pressable,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { getUserPosts, searchUsers, followUser, unfollowUser, isFollowing, getFollowers, getFollowing, deletePost, getFollowerCount } from '../../services/socialService';
import { Colors, Spacing, Radius } from '../../constants/theme';

// ─── Followers / Following Modal ─────────────────────────────────────────────
function FollowListModal({ visible, onClose, title, users, currentUserId, onUnfollow, showUnfollow }) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={fl.root}>
        <View style={fl.header}>
          <Text style={fl.title}>{title}</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>
        {users.length === 0 ? (
          <View style={fl.empty}>
            <Text style={{ fontSize: 36 }}>👥</Text>
            <Text style={fl.emptyText}>Nobody here yet</Text>
          </View>
        ) : (
          <FlatList
            data={users}
            keyExtractor={(u) => u.id}
            contentContainerStyle={{ padding: Spacing.lg }}
            renderItem={({ item }) => (
              <View style={fl.userRow}>
                <View style={fl.avatar}>
                  <Text style={fl.avatarText}>{item.displayName?.[0]?.toUpperCase() || '?'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={fl.userName}>{item.displayName || 'Unknown'}</Text>
                  <Text style={fl.userSub}>🔥 {item.streak || 0} streak</Text>
                </View>
                {showUnfollow && item.id !== currentUserId && (
                  <TouchableOpacity
                    style={fl.unfollowBtn}
                    onPress={() => onUnfollow(item.id)}
                  >
                    <Text style={fl.unfollowText}>Unfollow</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          />
        )}
      </View>
    </Modal>
  );
}

// ─── User Search Modal ────────────────────────────────────────────────────────
function SearchModal({ visible, onClose, currentUserId }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [followStates, setFollowStates] = useState({});

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const users = await searchUsers(query.trim());
      const filtered = users.filter((u) => u.id !== currentUserId);
      setResults(filtered);
      const states = {};
      await Promise.all(filtered.map(async (u) => {
        states[u.id] = await isFollowing(currentUserId, u.id);
      }));
      setFollowStates(states);
    } finally { setSearching(false); }
  };

  const handleFollow = async (userId) => {
    const currently = followStates[userId];
    setFollowStates((prev) => ({ ...prev, [userId]: !currently }));
    try {
      if (currently) await unfollowUser(currentUserId, userId);
      else await followUser(currentUserId, userId);
    } catch {
      setFollowStates((prev) => ({ ...prev, [userId]: currently }));
      Alert.alert('Error', 'Could not update follow status.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={sm.root}>
        <View style={sm.header}>
          <Text style={sm.title}>Find People</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>
        <View style={sm.searchRow}>
          <View style={sm.searchWrap}>
            <Ionicons name="search-outline" size={16} color={Colors.muted} style={{ marginRight: 8 }} />
            <TextInput
              style={sm.input}
              placeholder="Search by name..."
              placeholderTextColor={Colors.muted}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              autoFocus
            />
          </View>
          <TouchableOpacity style={sm.searchBtn} onPress={handleSearch}>
            <Text style={sm.searchBtnText}>Search</Text>
          </TouchableOpacity>
        </View>

        {searching ? (
          <ActivityIndicator color={Colors.accent} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={results}
            keyExtractor={(u) => u.id}
            contentContainerStyle={{ padding: Spacing.lg }}
            ListEmptyComponent={
              query ? <Text style={sm.emptyText}>No users found</Text> : null
            }
            renderItem={({ item }) => (
              <View style={sm.userRow}>
                <View style={sm.avatar}>
                  <Text style={sm.avatarText}>{item.displayName?.[0]?.toUpperCase() || '?'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={sm.userName}>{item.displayName}</Text>
                  <Text style={sm.userSub}>🔥 {item.streak || 0} streak</Text>
                </View>
                <TouchableOpacity
                  style={[sm.followBtn, followStates[item.id] && sm.followingBtn]}
                  onPress={() => handleFollow(item.id)}
                >
                  <Text style={[sm.followBtnText, followStates[item.id] && { color: Colors.muted }]}>
                    {followStates[item.id] ? 'Following' : 'Follow'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          />
        )}
      </View>
    </Modal>
  );
}

// ─── Post Grid Item ───────────────────────────────────────────────────────────
function PostGridItem({ post, onDelete }) {
  return (
    <View style={styles.gridItem}>
      {post.imageUrl ? (
        <Image source={{ uri: post.imageUrl }} style={styles.gridImage} resizeMode="cover" />
      ) : (
        <View style={styles.gridPlaceholder}>
          <Text style={styles.gridPlaceholderText}>{post.workoutType}</Text>
        </View>
      )}
      <View style={styles.gridOverlay}>
        <Ionicons name="heart" size={12} color="#fff" />
        <Text style={styles.gridLikes}>{(post.likes || []).length}</Text>
      </View>
      {onDelete && (
        <TouchableOpacity style={styles.gridDeleteBtn} onPress={() => onDelete(post.id)}>
          <Ionicons name="trash-outline" size={13} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Profile Screen ───────────────────────────────────────────────────────────
export default function ProfileScreen({ navigation }) {
  const { user, userData } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchVisible, setSearchVisible] = useState(false);
  const [followersVisible, setFollowersVisible] = useState(false);
  const [followingVisible, setFollowingVisible] = useState(false);
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [listsLoading, setListsLoading] = useState(false);
  const [liveFollowerCount, setLiveFollowerCount] = useState(null);

  const load = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const data = await getUserPosts(user.uid);
      setPosts(data);
    } finally { setLoading(false); }
  }, [user?.uid]);

  useFocusEffect(useCallback(() => {
    if (!user?.uid) return;
    load();
    getFollowerCount(user.uid).then(setLiveFollowerCount).catch(() => {});
  }, [load, user?.uid]));

  const loadFollowersList = async () => {
    setListsLoading(true);
    try {
      const data = await getFollowers(user.uid);
      setFollowersList(data);
      setFollowersVisible(true);
    } finally { setListsLoading(false); }
  };

  const loadFollowingList = async () => {
    setListsLoading(true);
    try {
      const data = await getFollowing(user.uid);
      setFollowingList(data);
      setFollowingVisible(true);
    } finally { setListsLoading(false); }
  };

  const handleUnfollow = async (targetId) => {
    await unfollowUser(user.uid, targetId);
    setFollowingList((prev) => prev.filter((u) => u.id !== targetId));
  };

  // Also update following count locally after unfollow
  const handleUnfollowWithCount = async (targetId) => {
    await handleUnfollow(targetId);
  };

  const handleDeletePost = (postId) => {
    Alert.alert('Delete Post', 'Remove this post from your profile and the community feed?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
        try { await deletePost(postId); } catch { load(); Alert.alert('Error', 'Could not delete post.'); }
      }},
    ]);
  };

  const displayName = userData?.displayName || user?.displayName || 'Athlete';
  const streak = userData?.streak || 0;
  const longestStreak = userData?.longestStreak || 0;
  const followerCount = liveFollowerCount ?? userData?.followerCount ?? 0;
  const followingCount = userData?.followingCount || 0;

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.pageTitle}>Profile</Text>
          <TouchableOpacity style={styles.findBtn} onPress={() => setSearchVisible(true)}>
            <Ionicons name="person-add-outline" size={22} color={Colors.accent} />
          </TouchableOpacity>
        </Animated.View>

        {/* Avatar + Name */}
        <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.profileSection}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>{displayName[0]?.toUpperCase()}</Text>
          </View>
          <Text style={styles.profileName}>{displayName}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
        </Animated.View>

        {/* Stats row */}
        <Animated.View entering={FadeInDown.duration(500).delay(150)} style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{posts.length}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statDivider} />
          <TouchableOpacity style={styles.statItem} onPress={loadFollowersList} disabled={listsLoading}>
            <Text style={styles.statNum}>{followerCount}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <TouchableOpacity style={styles.statItem} onPress={loadFollowingList} disabled={listsLoading}>
            <Text style={styles.statNum}>{followingCount}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Streak cards */}
        <Animated.View entering={FadeInDown.duration(500).delay(200)} style={styles.streakRow}>
          <View style={styles.streakCard}>
            <Text style={styles.streakCardIcon}>🔥</Text>
            <Text style={styles.streakCardNum}>{streak}</Text>
            <Text style={styles.streakCardLabel}>Current Streak</Text>
          </View>
          <View style={styles.streakCard}>
            <Text style={styles.streakCardIcon}>🏆</Text>
            <Text style={styles.streakCardNum}>{longestStreak}</Text>
            <Text style={styles.streakCardLabel}>Best Streak</Text>
          </View>
        </Animated.View>

        {/* Find people button */}
        <Animated.View entering={FadeInDown.duration(500).delay(250)}>
          <TouchableOpacity style={styles.findPeopleBtn} onPress={() => setSearchVisible(true)}>
            <Ionicons name="people-outline" size={20} color={Colors.accent} />
            <Text style={styles.findPeopleBtnText}>Find & Follow People</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.muted} />
          </TouchableOpacity>
        </Animated.View>

        {/* Posts grid */}
        <Animated.View entering={FadeInDown.duration(500).delay(300)}>
          <Text style={styles.sectionTitle}>Your Posts</Text>
          {loading ? (
            <ActivityIndicator color={Colors.accent} style={{ marginTop: 24 }} />
          ) : posts.length === 0 ? (
            <View style={styles.emptyPosts}>
              <Text style={{ fontSize: 40 }}>📸</Text>
              <Text style={styles.emptyPostsText}>No posts yet</Text>
              <Text style={styles.emptyPostsSub}>Share your workouts from the Calendar screen</Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {posts.map((p) => <PostGridItem key={p.id} post={p} onDelete={handleDeletePost} />)}
            </View>
          )}
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <SearchModal
        visible={searchVisible}
        onClose={() => setSearchVisible(false)}
        currentUserId={user?.uid}
      />

      <FollowListModal
        visible={followersVisible}
        onClose={() => setFollowersVisible(false)}
        title="Followers"
        users={followersList}
        currentUserId={user?.uid}
        showUnfollow={false}
      />

      <FollowListModal
        visible={followingVisible}
        onClose={() => setFollowingVisible(false)}
        title="Following"
        users={followingList}
        currentUserId={user?.uid}
        showUnfollow={true}
        onUnfollow={handleUnfollow}
      />
    </View>
  );
}

// ─── Search Modal Styles ──────────────────────────────────────────────────────
const sm = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg, paddingTop: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg, borderBottomWidth: 1, borderColor: Colors.border },
  title: { fontSize: 20, fontWeight: '800', color: Colors.text },
  searchRow: { flexDirection: 'row', padding: Spacing.lg, gap: Spacing.sm },
  searchWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.md, height: 46 },
  input: { flex: 1, color: Colors.text, fontSize: 14 },
  searchBtn: { backgroundColor: Colors.accent, borderRadius: Radius.md, paddingHorizontal: Spacing.lg, alignItems: 'center', justifyContent: 'center', height: 46 },
  searchBtnText: { color: Colors.bg, fontWeight: '800', fontSize: 14 },
  emptyText: { color: Colors.muted, textAlign: 'center', paddingTop: 20 },
  userRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border, gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,245,196,0.12)', borderWidth: 1.5, borderColor: 'rgba(0,245,196,0.3)', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: Colors.accent, fontWeight: '800', fontSize: 18 },
  userName: { color: Colors.text, fontWeight: '700', fontSize: 15 },
  userSub: { color: Colors.muted, fontSize: 12, marginTop: 2 },
  followBtn: { backgroundColor: Colors.accent, borderRadius: Radius.full, paddingHorizontal: 16, paddingVertical: 7 },
  followingBtn: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  followBtnText: { color: Colors.bg, fontWeight: '700', fontSize: 13 },
});

// ─── Main Styles ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.lg, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  findBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,245,196,0.1)', borderWidth: 1, borderColor: 'rgba(0,245,196,0.3)', alignItems: 'center', justifyContent: 'center' },
  pageTitle: { fontSize: 20, fontWeight: '800', color: Colors.text },
  profileSection: { alignItems: 'center', marginBottom: Spacing.lg },
  avatarLarge: { width: 88, height: 88, borderRadius: 44, backgroundColor: 'rgba(0,245,196,0.12)', borderWidth: 2.5, borderColor: 'rgba(0,245,196,0.4)', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  avatarLargeText: { color: Colors.accent, fontSize: 36, fontWeight: '800' },
  profileName: { color: Colors.text, fontSize: 22, fontWeight: '800' },
  profileEmail: { color: Colors.muted, fontSize: 13, marginTop: 4 },
  statsRow: { flexDirection: 'row', backgroundColor: Colors.card, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.lg, paddingVertical: Spacing.md },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { color: Colors.text, fontSize: 22, fontWeight: '800' },
  statLabel: { color: Colors.muted, fontSize: 12, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: Colors.border },
  streakRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg },
  streakCard: { flex: 1, backgroundColor: Colors.card, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, alignItems: 'center', gap: 4 },
  streakCardIcon: { fontSize: 28 },
  streakCardNum: { color: Colors.accent, fontSize: 28, fontWeight: '800' },
  streakCardLabel: { color: Colors.muted, fontSize: 12 },
  findPeopleBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: 'rgba(0,245,196,0.25)', marginBottom: Spacing.lg, gap: Spacing.sm },
  findPeopleBtnText: { flex: 1, color: Colors.text, fontWeight: '600', fontSize: 15 },
  sectionTitle: { color: Colors.text, fontSize: 16, fontWeight: '700', marginBottom: Spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 3 },
  gridItem: { width: '32%', aspectRatio: 1, borderRadius: Radius.sm, overflow: 'hidden', position: 'relative' },
  gridImage: { width: '100%', height: '100%' },
  gridPlaceholder: { width: '100%', height: '100%', backgroundColor: '#0d1117', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.sm },
  gridPlaceholderText: { color: Colors.accent, fontWeight: '800', fontSize: 11 },
  gridOverlay: { position: 'absolute', bottom: 4, right: 6, flexDirection: 'row', alignItems: 'center', gap: 3 },
  gridLikes: { color: '#fff', fontSize: 11, fontWeight: '700' },
  emptyPosts: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyPostsText: { color: Colors.text, fontSize: 16, fontWeight: '700' },
  emptyPostsSub: { color: Colors.muted, fontSize: 13, textAlign: 'center' },
  gridDeleteBtn: { position: 'absolute', top: 6, right: 6, width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center' },
});

const fl = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg, paddingTop: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg, borderBottomWidth: 1, borderColor: Colors.border },
  title: { fontSize: 20, fontWeight: '800', color: Colors.text },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 60 },
  emptyText: { color: Colors.muted, fontSize: 15 },
  userRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border, gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,245,196,0.12)', borderWidth: 1.5, borderColor: 'rgba(0,245,196,0.3)', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: Colors.accent, fontWeight: '800', fontSize: 18 },
  userName: { color: Colors.text, fontWeight: '700', fontSize: 15 },
  userSub: { color: Colors.muted, fontSize: 12, marginTop: 2 },
  unfollowBtn: { backgroundColor: Colors.surface, borderRadius: Radius.full, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, borderColor: Colors.border },
  unfollowText: { color: Colors.muted, fontWeight: '700', fontSize: 13 },
});
