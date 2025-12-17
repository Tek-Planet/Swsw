
import React, { useState } from 'react';
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

type Props = {
  eventId: string;
};

const PostComposer: React.FC<Props> = ({ eventId }) => {
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const auth = getAuth();
  const user = auth.currentUser;

  const handlePost = async () => {
    if (!user || text.trim().length === 0) return;

    setIsSending(true);
    try {
      await createEventPost(eventId, text, {
        uid: user.uid,
        name: user.displayName || 'Anonymous',
        avatarUrl: user.photoURL || undefined,
      });
      setText(''); // Clear input on success
    } catch (error) {
      console.error("Failed to create post:", error);
      Alert.alert('Error', 'Could not post your message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Share something..."
        placeholderTextColor="#A8A8A8"
        value={text}
        onChangeText={setText}
        multiline
      />
      <TouchableOpacity
        style={styles.button}
        onPress={handlePost}
        disabled={isSending || text.trim().length === 0}
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
    backgroundColor: '#007AFF',
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
});

export default PostComposer;
