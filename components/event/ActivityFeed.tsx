
import { Ionicons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View
} from 'react-native';

import {
  getPostLikeStatusForUser,
  listenEventPosts,
  togglePostLike,
} from '@/lib/services/postService';
import { Post } from '@/types/post';
import PostComposer from './PostComposer';
import PostItem from './PostItem';

type Props = {
  eventId: string;
  hasAccess: boolean;
};

const ActivityFeed: React.FC<Props> = ({ eventId, hasAccess }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!hasAccess || !userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = listenEventPosts(eventId, async (newPosts) => {
      const postsWithLikes = await Promise.all(
        newPosts.map(async (post) => ({
          ...post,
          isLiked: await getPostLikeStatusForUser(eventId, post.id, userId),
        }))
      );
      setPosts(postsWithLikes);
      setLoading(false);
    });

    return () => {
      unsubscribe();
      setLoading(false);
    }
  }, [hasAccess, eventId, userId]);

  const handleLikeToggle = useCallback(
    async (postId: string) => {
      if (!userId) return;
      try {
        await togglePostLike(eventId, postId, userId);
      } catch (error) {
        console.error('Failed to toggle like:', error);
      }
    },
    [eventId, userId]
  );

  if (!hasAccess) {
    return (
      <View style={styles.lockedContainer}>
        <Ionicons name="lock-closed-outline" size={24} color="#A8A8A8" />
        <Text style={styles.lockedText}>Buy a ticket to join the event feed.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}><ActivityIndicator size="large" color="#fff" /></View>
    );
  }

  return (
    <View style={styles.container}>
      <PostComposer eventId={eventId} />
      {posts.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No posts yet. Be the first!</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          renderItem={({ item }) => (
            <PostItem post={item} onLikeToggle={handleLikeToggle} />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  lockedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#1C1C1E',
    borderRadius: 10,
    margin: 16,
  },
  lockedText: {
    color: '#A8A8A8',
    fontSize: 16,
    marginLeft: 10,
  },
  emptyText: {
    color: '#A8A8A8',
    fontSize: 16,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
});

export default ActivityFeed;
