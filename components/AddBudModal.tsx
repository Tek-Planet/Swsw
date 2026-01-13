import { firestore } from '@/lib/firebase';
import { Group } from '@/types/group';
import { UserProfile } from '@/types/user';
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  FlatList,
  Alert,
} from 'react-native';

interface AddBudModalProps {
  group: Group;
  visible: boolean;
  onClose: () => void;
}

const AddBudModal: React.FC<AddBudModalProps> = ({ group, visible, onClose }) => {
  const [email, setEmail] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (email.trim() === '') {
      Alert.alert('Validation', 'Please enter an email to search.');
      return;
    }

    setLoading(true);
    try {
      const usersRef = collection(firestore, 'users');
      const q = query(usersRef, where('email', '==', email.trim().toLowerCase()));
      const querySnapshot = await getDocs(q);

      const results: UserProfile[] = [];
      querySnapshot.forEach((doc) => {
        // Ensure we don't add existing members to the search result
        if (!group.members.includes(doc.id)) {
          results.push({ id: doc.id, ...doc.data() } as UserProfile);
        }
      });

      setSearchResults(results);
      if (results.length === 0) {
        Alert.alert('No Results', 'No user found with that email, or the user is already a member.');
      }
    } catch (error) {
      console.error('Error searching for user:', error);
      Alert.alert('Error', 'Something went wrong while searching for the user.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBud = async (user: UserProfile) => {
    try {
      const groupRef = doc(firestore, 'groups', group.id);
      await updateDoc(groupRef, {
        members: arrayUnion(user.id),
      });

      Alert.alert('Success', `${user.displayName || 'User'} has been added to the group.`);
      onClose();
    } catch (error) {
      console.error('Error adding user to group:', error);
      Alert.alert('Error', 'Could not add user to the group.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Add a Bud</Text>

          <TextInput
            style={styles.input}
            placeholder="Search by email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TouchableOpacity style={styles.searchButton} onPress={handleSearch} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? 'Searching...' : 'Search'}</Text>
          </TouchableOpacity>

          {searchResults.length > 0 && (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.resultItem}>
                  <Text style={styles.resultName}>{item.displayName || 'N/A'}</Text>
                  <TouchableOpacity style={styles.addButton} onPress={() => handleAddBud(item)}>
                    <Text style={styles.buttonText}>Add</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          )}

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    backgroundColor: '#3a3a3a',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: '#fff',
    marginBottom: 20,
  },
  searchButton: {
    width: '100%',
    backgroundColor: '#6c63ff',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultItem: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  resultName: {
    fontSize: 18,
    color: '#fff',
  },
  addButton: {
    backgroundColor: '#5cb85c',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  closeButton: {
    marginTop: 10,
    width: '100%',
    backgroundColor: '#d9534f',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
});

export default AddBudModal;
