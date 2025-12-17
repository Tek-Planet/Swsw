
import {
  collection,
  query,
  where,
  limit,
  getDocs,
  onSnapshot,
  addDoc,
  serverTimestamp,
  orderBy,
  runTransaction,
  doc,
  deleteDoc,
  getDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebaseConfig';
import { Post, FirestorePost } from '@/types/post';

/**
 * Checks if a user has a paid order for a specific event.
 */
export async function userHasEventAccess(
  uid: string,
  eventId: string
): Promise<boolean> {
  if (!uid) return false;
  const ordersRef = collection(db, `users/${uid}/orders`);
  const q = query(
    ordersRef,
    where('eventId', '==', eventId),
    where('status', '==', 'paid'),
    limit(1)
  );
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

/**
 * Listens for real-time updates to event posts.
 */
export function listenEventPosts(
  eventId: string,
  callback: (posts: Post[]) => void,
  limitCount: number = 30
): () => void {
  const postsRef = collection(db, `events/${eventId}/posts`);
  const q = query(postsRef, orderBy('createdAt', 'desc'), limit(limitCount));

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const posts: Post[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data() as FirestorePost;
      if (data.createdAt) { // Check if the server timestamp is available
        posts.push({
          ...data,
          id: doc.id,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as Post);
      }
    });
    callback(posts);
  });

  return unsubscribe;
}

/**
 * Creates a new post for an event.
 */
export async function createEventPost(
  eventId: string,
  text: string,
  author: { uid: string; name: string; avatarUrl?: string }
): Promise<void> {
  const trimmedText = text.trim();
  if (!trimmedText) {
    throw new Error('Post text cannot be empty.');
  }

  const postsRef = collection(db, `events/${eventId}/posts`);
  await addDoc(postsRef, {
    authorId: author.uid,
    authorName: author.name,
    authorAvatarUrl: author.avatarUrl || null,
    text: trimmedText,
    createdAt: serverTimestamp(),
    likeCount: 0,
    commentCount: 0,
    visibility: 'attendees',
  });
}

/**
 * Toggles a like on a post by a user.
 */
export async function togglePostLike(
  eventId: string,
  postId: string,
  uid: string
): Promise<void> {
  const postRef = doc(db, `events/${eventId}/posts`, postId);
  const likeRef = doc(postRef, 'likes', uid);

  try {
    await runTransaction(db, async (transaction) => {
      const likeDoc = await transaction.get(likeRef);
      const postDoc = await transaction.get(postRef);

      if (!postDoc.exists()) {
        throw new Error('Post does not exist!');
      }

      const currentLikeCount = postDoc.data().likeCount || 0;

      if (likeDoc.exists()) {
        // User has liked the post, so unlike it
        transaction.delete(likeRef);
        transaction.update(postRef, { likeCount: currentLikeCount - 1 });
      } else {
        // User has not liked the post, so like it
        transaction.set(likeRef, { userId: uid, createdAt: serverTimestamp() });
        transaction.update(postRef, { likeCount: currentLikeCount + 1 });
      }
    });
  } catch (error) {
    console.error("Transaction failed: ", error);
    throw error;
  }
}

/**
 * Checks if a user has liked a specific post.
 */
export async function getPostLikeStatusForUser(
  eventId: string,
  postId: string,
  uid: string
): Promise<boolean> {
  if (!uid) return false;
  const likeRef = doc(db, `events/${eventId}/posts/${postId}/likes/${uid}`);
  const docSnap = await getDoc(likeRef);
  return docSnap.exists();
}
