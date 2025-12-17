
import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { getAuth } from 'firebase/auth';
import { createEventPost } from '@/lib/services/postService';
import { getUserProfile } from '@/lib/firebase/userProfileService';
import { UserProfile } from '@/types';

type Props = {
  eventId: string;
};

const PostComposer: React.FC<Props> = ({ eventId }) => {
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [authorProfile, setAuthorProfile] = useState<UserProfile | null>(null);
  const auth = getAuth();
  const currentUser = auth.currentUser;

  useEffect(() => {
    // Fetch the user's profile from Firestore when the component mounts
    if (currentUser) {
      getUserProfile(currentUser.uid).then(setAuthorProfile);
    }
  }, [currentUser]); // Re-run if the user changes

  const handlePost = async () => {
    if (!currentUser || !authorProfile || text.trim().length === 0) return;

    setIsSending(true);
    try {
      // Use the profile from Firestore as the source of truth
      await createEventPost(eventId, text, {
        uid: currentUser.uid,
        name: authorProfile.displayName || 'Anonymous',
        avatarUrl: authorProfile.photoURL || undefined,
      });
      setText(''); // Clear input on success
    } catch (error) {
      console.error("Failed to create post:", error);
      Alert.alert('Error', 'Could not post your message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  // Determine if the post button should be enabled
  const canPost = !isSending && text.trim().length > 0 && !!authorProfile;

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder={authorProfile ? "Share something..." : "Authenticating..."}
        placeholderTextColor="#A8A8A8"
        value={text}
        onChangeText={setText}
        multiline
        editable={!!authorProfile} // Disable input while profile is loading
      />
      <TouchableOpacity
        style={[styles.button, !canPost && styles.buttonDisabled]}
        onPress={handlePost}
        disabled={!canPost}
      >
        {isSending ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Post</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    marginBottom: 20,
  },
  input: {
    color: '#fff',
    fontSize: 16,
    minHeight: 40,
    maxHeight: 120,
  },
  button: {
    backgroundColor: '#6c63ff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignSelf: 'flex-end',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  buttonDisabled: {
    backgroundColor: '#5a5a5a',
    opacity: 0.7,
  },
});

export default PostComposer;
