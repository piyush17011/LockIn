import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, ScrollView, TouchableOpacity,
  Image, FlatList, ActivityIndicator, Alert, TextInput, Modal,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import {
  getUserPosts, searchUsers, followUser, unfollowUser,
  isFollowing, getFollowers, getFollowing, deletePost, getFollowerCount,
} from '../../services/socialService';
import { useTheme } from '../../hooks/ThemeContext';

const shadow = (color = '#000', opacity = 0.07, radius = 10, y = 3) => ({
  shadowColor: color, shadowOffset: { width: 0, height: y },
  shadowOpacity: opacity, shadowRadius: radius, elevation: Math.round(radius / 2),
});

// ── Followers / Following Modal ───────────────────────────────────────────────
function FollowListModal({ visible, onClose, title, users, currentUserId, onUnfollow, showUnfollow, C, ff }) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <View style={{
          flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
          paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16,
          borderBottomWidth: 1, borderBottomColor: C.border,
        }}>
          <Text style={[{ fontSize: 20, color: C.text }, ff.display]}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={{
            width: 34, height: 34, borderRadius: 17,
            backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center',
          }}>
            <Ionicons name="close" size={18} color={C.textSub} />
          </TouchableOpacity>
        </View>

        {users.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <Text style={{ fontSize: 36 }}>👥</Text>
            <Text style={[{ fontSize: 15, color: C.textSub }, ff.body]}>Nobody here yet</Text>
          </View>
        ) : (
          <FlatList
            data={users}
            keyExtractor={u => u.id}
            contentContainerStyle={{ padding: 20, gap: 10 }}
            renderItem={({ item }) => (
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 12,
                backgroundColor: C.card, borderRadius: 16,
                padding: 14, borderWidth: 1, borderColor: C.border,
              }}>
                <View style={{
                  width: 46, height: 46, borderRadius: 23,
                  backgroundColor: C.accent + '18',
                  borderWidth: 1.5, borderColor: C.accent + '40',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={[{ color: C.accent, fontSize: 18 }, ff.display]}>
                    {item.displayName?.[0]?.toUpperCase() || '?'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[{ fontSize: 15, color: C.text }, ff.heading]}>{item.displayName || 'Unknown'}</Text>
                  <Text style={[{ fontSize: 12, color: C.textSub, marginTop: 2 }, ff.body]}>🔥 {item.streak || 0} day streak</Text>
                </View>
                {showUnfollow && item.id !== currentUserId && (
                  <TouchableOpacity
                    onPress={() => onUnfollow(item.id)}
                    style={{
                      backgroundColor: C.surface, borderRadius: 20,
                      paddingHorizontal: 14, paddingVertical: 7,
                      borderWidth: 1, borderColor: C.border,
                    }}
                  >
                    <Text style={[{ fontSize: 13, color: C.textSub }, ff.heading]}>Unfollow</Text>
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

// ── Search Modal ──────────────────────────────────────────────────────────────
function SearchModal({ visible, onClose, currentUserId, C, ff }) {
  const [query,        setQuery]        = useState('');
  const [results,      setResults]      = useState([]);
  const [searching,    setSearching]    = useState(false);
  const [followStates, setFollowStates] = useState({});

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const users    = await searchUsers(query.trim());
      const filtered = users.filter(u => u.id !== currentUserId);
      setResults(filtered);
      const states = {};
      await Promise.all(filtered.map(async u => { states[u.id] = await isFollowing(currentUserId, u.id); }));
      setFollowStates(states);
    } finally { setSearching(false); }
  };

  const handleFollow = async (userId) => {
    const currently = followStates[userId];
    setFollowStates(prev => ({ ...prev, [userId]: !currently }));
    try {
      if (currently) await unfollowUser(currentUserId, userId);
      else await followUser(currentUserId, userId);
    } catch {
      setFollowStates(prev => ({ ...prev, [userId]: currently }));
      Alert.alert('Error', 'Could not update follow status.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <View style={{
          flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
          paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16,
          borderBottomWidth: 1, borderBottomColor: C.border,
        }}>
          <Text style={[{ fontSize: 20, color: C.text }, ff.display]}>Find People</Text>
          <TouchableOpacity onPress={onClose} style={{
            width: 34, height: 34, borderRadius: 17,
            backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center',
          }}>
            <Ionicons name="close" size={18} color={C.textSub} />
          </TouchableOpacity>
        </View>

        {/* Search bar */}
        <View style={{ flexDirection: 'row', padding: 20, gap: 10 }}>
          <View style={{
            flex: 1, flexDirection: 'row', alignItems: 'center',
            backgroundColor: C.card, borderRadius: 14,
            borderWidth: 1, borderColor: C.border,
            paddingHorizontal: 14, height: 48,
          }}>
            <Ionicons name="search-outline" size={16} color={C.textSub} style={{ marginRight: 8 }} />
            <TextInput
              style={[{ flex: 1, color: C.text, fontSize: 15 }, ff.body]}
              placeholder="Search by name..."
              placeholderTextColor={C.textSub}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              autoFocus
            />
          </View>
          <TouchableOpacity
            onPress={handleSearch}
            style={{
              backgroundColor: C.accent, borderRadius: 14,
              paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', height: 48,
            }}
          >
            <Text style={[{ color: C.bg, fontSize: 14 }, ff.heading]}>Search</Text>
          </TouchableOpacity>
        </View>

        {searching ? (
          <ActivityIndicator color={C.accent} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={results}
            keyExtractor={u => u.id}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
            ListEmptyComponent={query ? (
              <Text style={[{ color: C.textSub, textAlign: 'center', paddingTop: 30 }, ff.body]}>No users found</Text>
            ) : null}
            renderItem={({ item }) => (
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 12,
                backgroundColor: C.card, borderRadius: 16,
                padding: 14, borderWidth: 1, borderColor: C.border,
              }}>
                <View style={{
                  width: 46, height: 46, borderRadius: 23,
                  backgroundColor: C.accent + '18',
                  borderWidth: 1.5, borderColor: C.accent + '40',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={[{ color: C.accent, fontSize: 18 }, ff.display]}>
                    {item.displayName?.[0]?.toUpperCase() || '?'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[{ fontSize: 15, color: C.text }, ff.heading]}>{item.displayName}</Text>
                  <Text style={[{ fontSize: 12, color: C.textSub, marginTop: 2 }, ff.body]}>🔥 {item.streak || 0} day streak</Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleFollow(item.id)}
                  style={{
                    backgroundColor: followStates[item.id] ? C.surface : C.accent,
                    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8,
                    borderWidth: followStates[item.id] ? 1 : 0,
                    borderColor: C.border,
                  }}
                >
                  <Text style={[{
                    fontSize: 13,
                    color: followStates[item.id] ? C.textSub : C.bg,
                  }, ff.heading]}>
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

// ── Post Grid Item ────────────────────────────────────────────────────────────
function PostGridItem({ post, onDelete, C, ff, size }) {
  return (
    <View style={{ width: size, height: size, borderRadius: 14, overflow: 'hidden', position: 'relative' }}>
      {post.imageUrl ? (
        <Image source={{ uri: post.imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
      ) : (
        <View style={{
          width: '100%', height: '100%',
          backgroundColor: C.card,
          alignItems: 'center', justifyContent: 'center',
          borderWidth: 1, borderColor: C.border,
        }}>
          <Text style={{ fontSize: 20 }}>🏋️</Text>
          <Text style={[{ fontSize: 10, color: C.accent, marginTop: 4, textAlign: 'center', paddingHorizontal: 4 }, ff.heading]}>
            {post.workoutType}
          </Text>
        </View>
      )}
      {/* likes badge */}
      <View style={{
        position: 'absolute', bottom: 6, right: 6,
        flexDirection: 'row', alignItems: 'center', gap: 3,
        backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 8,
        paddingHorizontal: 6, paddingVertical: 3,
      }}>
        <Ionicons name="heart" size={10} color="#fff" />
        <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{(post.likes || []).length}</Text>
      </View>
      {onDelete && (
        <TouchableOpacity
          onPress={() => onDelete(post.id)}
          style={{
            position: 'absolute', top: 6, right: 6,
            width: 26, height: 26, borderRadius: 13,
            backgroundColor: 'rgba(0,0,0,0.6)',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Ionicons name="trash-outline" size={12} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function ProfileScreen({ navigation }) {
  const { scheme: C, font: F } = useTheme();
  const ff = {
    display:  { fontFamily: F.display },
    heading:  { fontFamily: F.heading },
    body:     { fontFamily: F.body },
  };

  const { user, userData } = useAuth();
  const [posts,            setPosts]            = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [searchVisible,    setSearchVisible]    = useState(false);
  const [followersVisible, setFollowersVisible] = useState(false);
  const [followingVisible, setFollowingVisible] = useState(false);
  const [followersList,    setFollowersList]    = useState([]);
  const [followingList,    setFollowingList]    = useState([]);
  const [listsLoading,     setListsLoading]     = useState(false);
  const [liveFollowers,    setLiveFollowers]    = useState(null);

  const load = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
    try { setPosts(await getUserPosts(user.uid)); }
    finally { setLoading(false); }
  }, [user?.uid]);

  useFocusEffect(useCallback(() => {
    if (!user?.uid) return;
    load();
    getFollowerCount(user.uid).then(setLiveFollowers).catch(() => {});
  }, [load, user?.uid]));

  const loadFollowers = async () => {
    setListsLoading(true);
    try { setFollowersList(await getFollowers(user.uid)); setFollowersVisible(true); }
    finally { setListsLoading(false); }
  };

  const loadFollowing = async () => {
    setListsLoading(true);
    try { setFollowingList(await getFollowing(user.uid)); setFollowingVisible(true); }
    finally { setListsLoading(false); }
  };

  const handleUnfollow = async (targetId) => {
    await unfollowUser(user.uid, targetId);
    setFollowingList(prev => prev.filter(u => u.id !== targetId));
  };

  const handleDeletePost = (postId) => {
    Alert.alert('Delete Post', 'Remove this post from your profile and the feed?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        setPosts(prev => prev.filter(p => p.id !== postId));
        try { await deletePost(postId); } catch { load(); Alert.alert('Error', 'Could not delete post.'); }
      }},
    ]);
  };

  const displayName    = userData?.displayName || user?.displayName || 'Athlete';
  const streak         = userData?.streak || 0;
  const longestStreak  = userData?.longestStreak || 0;
  const followerCount  = liveFollowers ?? userData?.followerCount ?? 0;
  const followingCount = userData?.followingCount || 0;

  // grid item size: 3 per row with 8px gaps
  const GRID_GAP  = 8;
  const GRID_COLS = 3;
  const ITEM_SIZE = (require('react-native').Dimensions.get('window').width - 40 - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS;

  const STATS = [
    { label: 'Posts',     value: posts.length,    onPress: null },
    { label: 'Followers', value: followerCount,    onPress: loadFollowers },
    { label: 'Following', value: followingCount,   onPress: loadFollowing },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 56, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >

        {/* ── HEADER ── */}
        <Animated.View entering={FadeInDown.duration(350)} style={{
          flexDirection: 'row', alignItems: 'center',
          justifyContent: 'space-between', marginBottom: 28,
        }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              width: 38, height: 38, borderRadius: 19,
              backgroundColor: C.card,
              borderWidth: 1, borderColor: C.border,
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Ionicons name="arrow-back" size={20} color={C.text} />
          </TouchableOpacity>

          <Text style={[{ fontSize: 18, color: C.text }, ff.display]}>Profile</Text>

          <TouchableOpacity
            onPress={() => setSearchVisible(true)}
            style={{
              width: 38, height: 38, borderRadius: 19,
              backgroundColor: C.accent + '18',
              borderWidth: 1, borderColor: C.accent + '40',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Ionicons name="person-add-outline" size={18} color={C.accent} />
          </TouchableOpacity>
        </Animated.View>

        {/* ── AVATAR + NAME ── */}
        <Animated.View entering={FadeInDown.duration(350).delay(60)} style={{ alignItems: 'center', marginBottom: 24 }}>
          {/* Avatar ring */}
          <View style={{
            width: 96, height: 96, borderRadius: 48,
            backgroundColor: C.accent + '18',
            borderWidth: 2.5, borderColor: C.accent + '50',
            alignItems: 'center', justifyContent: 'center',
            marginBottom: 14,
            ...shadow(C.accent, 0.2, 16, 4),
          }}>
            <Text style={[{ fontSize: 40, color: C.accent }, ff.display]}>
              {displayName[0]?.toUpperCase()}
            </Text>
          </View>
          <Text style={[{ fontSize: 24, color: C.text, letterSpacing: -0.3 }, ff.display]}>
            {displayName}
          </Text>
          <Text style={[{ fontSize: 13, color: C.textSub, marginTop: 4 }, ff.body]}>
            {user?.email}
          </Text>
        </Animated.View>

        {/* ── STATS ROW ── */}
        <Animated.View entering={FadeInDown.duration(350).delay(100)} style={{
          flexDirection: 'row',
          backgroundColor: C.card,
          borderRadius: 20, borderWidth: 1, borderColor: C.border,
          marginBottom: 16, overflow: 'hidden',
          borderTopWidth: 3, borderTopColor: C.accent,
        }}>
          {STATS.map((s, i) => (
            <TouchableOpacity
              key={s.label}
              onPress={s.onPress}
              disabled={!s.onPress || listsLoading}
              activeOpacity={s.onPress ? 0.7 : 1}
              style={{
                flex: 1, alignItems: 'center', paddingVertical: 16,
                borderRightWidth: i < 2 ? 1 : 0,
                borderRightColor: C.border,
              }}
            >
              <Text style={[{ fontSize: 24, color: C.text, letterSpacing: -0.5 }, ff.display]}>
                {s.value}
              </Text>
              <Text style={[{ fontSize: 11, color: C.textSub, marginTop: 3, letterSpacing: 0.3 }, ff.heading]}>
                {s.label.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* ── STREAK CARDS ── */}
        <Animated.View entering={FadeInDown.duration(350).delay(140)} style={{
          flexDirection: 'row', gap: 10, marginBottom: 16,
        }}>
          {[
            { icon: '🔥', value: streak,        label: 'Current Streak', color: '#ff9f43' },
            { icon: '🏆', value: longestStreak,  label: 'Best Streak',    color: '#ffd700' },
          ].map(card => (
            <View key={card.label} style={{
              flex: 1, backgroundColor: C.card,
              borderRadius: 18, padding: 16,
              borderWidth: 1, borderColor: C.border,
              borderTopWidth: 3, borderTopColor: card.color,
              alignItems: 'center', gap: 4,
            }}>
              <Text style={{ fontSize: 28 }}>{card.icon}</Text>
              <Text style={[{ fontSize: 28, color: card.color, letterSpacing: -0.5 }, ff.display]}>
                {card.value}
              </Text>
              <Text style={[{ fontSize: 11, color: C.textSub, letterSpacing: 0.3 }, ff.heading]}>
                {card.label.toUpperCase()}
              </Text>
            </View>
          ))}
        </Animated.View>

        {/* ── FIND PEOPLE ── */}
        <Animated.View entering={FadeInDown.duration(350).delay(180)}>
          <TouchableOpacity
            onPress={() => setSearchVisible(true)}
            activeOpacity={0.85}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 12,
              backgroundColor: C.card, borderRadius: 16, padding: 16,
              borderWidth: 1, borderColor: C.accent + '30',
              marginBottom: 24,
            }}
          >
            <View style={{
              width: 36, height: 36, borderRadius: 18,
              backgroundColor: C.accent + '18',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Ionicons name="people-outline" size={18} color={C.accent} />
            </View>
            <Text style={[{ flex: 1, fontSize: 15, color: C.text }, ff.heading]}>
              Find & Follow People
            </Text>
            <Ionicons name="chevron-forward" size={16} color={C.textSub} />
          </TouchableOpacity>
        </Animated.View>

        {/* ── POSTS GRID ── */}
        <Animated.View entering={FadeInDown.duration(350).delay(220)}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <Text style={[{ fontSize: 14, color: C.textSub, letterSpacing: 1 }, ff.heading]}>
              YOUR POSTS
            </Text>
            <Text style={[{ fontSize: 12, color: C.textSub }, ff.body]}>
              {posts.length} {posts.length === 1 ? 'post' : 'posts'}
            </Text>
          </View>

          {loading ? (
            <ActivityIndicator color={C.accent} style={{ marginTop: 30 }} />
          ) : posts.length === 0 ? (
            <View style={{
              alignItems: 'center', paddingVertical: 48,
              backgroundColor: C.card, borderRadius: 20,
              borderWidth: 1, borderColor: C.border,
            }}>
              <Text style={{ fontSize: 40 }}>📸</Text>
              <Text style={[{ fontSize: 16, color: C.text, marginTop: 10 }, ff.heading]}>
                No posts yet
              </Text>
              <Text style={[{ fontSize: 13, color: C.textSub, marginTop: 4, textAlign: 'center', paddingHorizontal: 20 }, ff.body]}>
                Share your workouts from the Calendar screen
              </Text>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP }}>
              {posts.map((p, i) => (
                <Animated.View key={p.id} entering={FadeIn.duration(300).delay(i * 30)}>
                  <PostGridItem
                    post={p}
                    onDelete={handleDeletePost}
                    C={C} ff={ff}
                    size={ITEM_SIZE}
                  />
                </Animated.View>
              ))}
            </View>
          )}
        </Animated.View>

      </ScrollView>

      <SearchModal
        visible={searchVisible}
        onClose={() => setSearchVisible(false)}
        currentUserId={user?.uid}
        C={C} ff={ff}
      />
      <FollowListModal
        visible={followersVisible}
        onClose={() => setFollowersVisible(false)}
        title="Followers"
        users={followersList}
        currentUserId={user?.uid}
        showUnfollow={false}
        C={C} ff={ff}
      />
      <FollowListModal
        visible={followingVisible}
        onClose={() => setFollowingVisible(false)}
        title="Following"
        users={followingList}
        currentUserId={user?.uid}
        showUnfollow
        onUnfollow={handleUnfollow}
        C={C} ff={ff}
      />
    </View>
  );
}
