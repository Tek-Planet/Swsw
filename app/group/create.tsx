import { AppHeader } from '@/components/Header';
import { useAuth } from '@/lib/context/AuthContext';
import { createGroup } from '@/lib/services/groupService';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const CreateGroupPage: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleCreateGroup = async () => {
    if (user) {
      try {
        await createGroup({ name, description, members: [user.uid], createdBy: user.uid, createdAt: new Date().toISOString() });
        router.back();
      } catch (error) {
        console.error('Error creating group: ', error);
      }
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Create a Group" />
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Group Name"
          placeholderTextColor="#aaa"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Group Description"
          placeholderTextColor="#aaa"
          value={description}
          onChangeText={setDescription}
        />
        <TouchableOpacity style={styles.createButton} onPress={handleCreateGroup}>
          <Text style={styles.createButtonText}>Create Group</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  form: {
    padding: 20,
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    color: 'white',
    fontSize: 16,
    padding: 15,
    marginBottom: 15,
  },
  createButton: {
    backgroundColor: '#6c63ff',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  createButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default CreateGroupPage;
