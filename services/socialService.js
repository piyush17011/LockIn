import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, getDoc, query, orderBy, limit,
  where, arrayUnion, arrayRemove, serverTimestamp,
  increment, setDoc,
} from 'firebase/firestore';
import { db } from './firebase';

// ── Upload image to Cloudinary ────────────────────────────────────────────────
const CLOUDINARY_CLOUD = 'dkrk88irr';
const CLOUDINARY_PRESET = 'lockin';

export async function uploadPostImage(userId, localUri) {
  const formData = new FormData();
  formData.append('file', { uri: localUri, type: 'image/jpeg', name: `post_${userId}_${Date.now()}.jpg` });
  formData.append('upload_preset', CLOUDINARY_PRESET);
  formData.append('folder', `posts/${userId}`);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`,
    { method: 'POST', body: formData }
  );
  const data = await res.json();
  if (!data.secure_url) throw new Error(data.error?.message || 'Cloudinary upload failed');
  return data.secure_url;
}

// ── Create a post ─────────────────────────────────────────────────────────────
export async function createPost(userId, userName, { imageUri, workoutType, streak, date }) {
  let imageUrl = null;
  if (imageUri) imageUrl = await uploadPostImage(userId, imageUri);
  const ref = await addDoc(collection(db, 'posts'), {
    userId, userName, imageUrl,
    workoutType, streak, date,
    likes: [],
    commentCount: 0,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

// ── Fetch global feed ─────────────────────────────────────────────────────────
export async function getGlobalFeed(limitCount = 20) {
  // orderBy on single field auto-creates index in Firebase — this is safe
  const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(limitCount));
  try {
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch {
    // Fallback: no ordering while index builds
    const snap2 = await getDocs(collection(db, 'posts'));
    return snap2.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))
      .slice(0, limitCount);
  }
}

// ── Like / Unlike ─────────────────────────────────────────────────────────────
export async function toggleLike(postId, userId) {
  const ref = doc(db, 'posts', postId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const liked = (snap.data().likes || []).includes(userId);
  await updateDoc(ref, { likes: liked ? arrayRemove(userId) : arrayUnion(userId) });
  return !liked;
}

// ── Comments ──────────────────────────────────────────────────────────────────
export async function addComment(postId, userId, userName, text) {
  await addDoc(collection(db, 'posts', postId, 'comments'), {
    userId, userName, text, createdAt: serverTimestamp(),
  });
  await updateDoc(doc(db, 'posts', postId), { commentCount: increment(1) });
}

export async function getComments(postId) {
  const q = query(
    collection(db, 'posts', postId, 'comments'),
    orderBy('createdAt', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ── Follow / Unfollow ─────────────────────────────────────────────────────────
export async function followUser(followerId, followingId) {
  const id = `${followerId}_${followingId}`;
  await setDoc(doc(db, 'follows', id), { followerId, followingId, createdAt: serverTimestamp() });
  // Only update own doc (follower count computed dynamically)
  await updateDoc(doc(db, 'users', followerId), { followingCount: increment(1) });
}

export async function unfollowUser(followerId, followingId) {
  await deleteDoc(doc(db, 'follows', `${followerId}_${followingId}`));
  await updateDoc(doc(db, 'users', followerId), { followingCount: increment(-1) });
}

// Get live follower count for a user
export async function getFollowerCount(userId) {
  const q = query(collection(db, 'follows'), where('followingId', '==', userId));
  const snap = await getDocs(q);
  return snap.size;
}

export async function isFollowing(followerId, followingId) {
  const snap = await getDoc(doc(db, 'follows', `${followerId}_${followingId}`));
  return snap.exists();
}

// ── Get user posts ────────────────────────────────────────────────────────────
export async function getUserPosts(userId) {
  const q = query(
    collection(db, 'posts'),
    where('userId', '==', userId)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => {
      const ta = a.createdAt?.toMillis?.() || 0;
      const tb = b.createdAt?.toMillis?.() || 0;
      return tb - ta;
    });
}

// ── Search users ──────────────────────────────────────────────────────────────
export async function searchUsers(queryStr) {
  const snap = await getDocs(collection(db, 'users'));
  const lower = queryStr.toLowerCase();
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((u) => u.displayName?.toLowerCase().includes(lower));
}

// ── Delete a post ─────────────────────────────────────────────────────────────
export async function deletePost(postId) {
  await deleteDoc(doc(db, 'posts', postId));
}

// ── Get followers (people who follow userId) ──────────────────────────────────
export async function getFollowers(userId) {
  const q = query(collection(db, 'follows'), where('followingId', '==', userId));
  const snap = await getDocs(q);
  const followerIds = snap.docs.map((d) => d.data().followerId);
  if (followerIds.length === 0) return [];
  const users = await Promise.all(
    followerIds.map(async (id) => {
      const u = await getDoc(doc(db, 'users', id));
      return u.exists() ? { id: u.id, ...u.data() } : null;
    })
  );
  return users.filter(Boolean);
}

// ── Get following (people userId follows) ─────────────────────────────────────
export async function getFollowing(userId) {
  const q = query(collection(db, 'follows'), where('followerId', '==', userId));
  const snap = await getDocs(q);
  const followingIds = snap.docs.map((d) => d.data().followingId);
  if (followingIds.length === 0) return [];
  const users = await Promise.all(
    followingIds.map(async (id) => {
      const u = await getDoc(doc(db, 'users', id));
      return u.exists() ? { id: u.id, ...u.data() } : null;
    })
  );
  return users.filter(Boolean);
}
