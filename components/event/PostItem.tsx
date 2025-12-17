
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Post } from '@/types/post';
import { formatDistanceToNow } from 'date-fns';

type Props = {
  post: Post;
  onLikeToggle: (postId: string) => void;
};

const PostItem: React.FC<Props> = ({ post, onLikeToggle }) => {
  return (
    <View style={styles.container}>
      <Image
        source={post.authorAvatarUrl ? { uri: post.authorAvatarUrl } : require('@/assets/images/avatar_placeholder.png')}
        style={styles.avatar}
      />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.authorName}>{post.authorName}</Text>
          <Text style={styles.timeAgo}>
            {formatDistanceToNow(post.createdAt, { addSuffix: true })}
          </Text>
        </View>
        <Text style={styles.text}>{post.text}</Text>
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onLikeToggle(post.id)}
          >
            <Ionicons
              name={post.isLiked ? 'heart' : 'heart-outline'}
              size={20}
              color={post.isLiked ? '#E91E63' : '#A8A8A8'}
            />
            <Text style={[styles.actionText, post.isLiked && styles.likedText]}>
              {post.likeCount > 0 && post.likeCount}
            </Text>
          </TouchableOpacity>
          {/* Comment button can be added here in the future */}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  authorName: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  timeAgo: {
    color: '#A8A8A8',
    fontSize: 12,
  },
  text: {
    color: '#EAEAEA',
    fontSize: 15,
    marginTop: 4,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    color: '#A8A8A8',
    marginLeft: 6,
    fontSize: 14,
  },
  likedText: {
    color: '#E91E63',
  },
});

export default PostItem;
