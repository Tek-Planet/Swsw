
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { getAuth } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';

import {
  userHasEventAccess,
  listenEventPosts,
  togglePostLike,
  getPostLikeStatusForUser,
} from '@/lib/services/postService';
import { Post } from '@/types/post';
import PostComposer from './PostComposer';
import PostItem from './PostItem';

type Props = {
  eventId: string;
};

const ActivityFeed: React.FC<Props> = ({ eventId }) => {
  const [hasAccess, setHasAccess] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    userHasEventAccess(userId, eventId).then((access) => {
      setHasAccess(access);
      setLoading(false);
    });
  }, [userId, eventId]);

  useEffect(() => {
    if (!hasAccess || !userId) return;

    const unsubscribe = listenEventPosts(eventId, async (newPosts) => {
      // Check if user has liked each post
      const postsWithLikes = await Promise.all(
        newPosts.map(async (post) => ({
          ...post,
          isLiked: await getPostLikeStatusForUser(eventId, post.id, userId),
        }))
      );
      setPosts(postsWithLikes);
    });

    return () => unsubscribe();
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

  if (loading) {
    return (
      <View style={styles.center}><ActivityIndicator size="large" color="#fff" /></View>
    );
  }

  if (!hasAccess) {
    return (
      <View style={styles.lockedContainer}>
        <Ionicons name="lock-closed-outline" size={24} color="#A8A8A8" />
        <Text style={styles.lockedText}>Buy a ticket to join the event feed.</Text>
      </View>
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
