import { AppHeader } from '@/components/Header';
import { useAuth } from '@/lib/context/AuthContext';
import { listenToUserGroups } from '@/lib/services/groupService';
import { Group } from '@/types/group';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const BudsHomePage: React.FC = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);

  useEffect(() => {
    if (user) {
      const unsubscribe = listenToUserGroups(user.uid, (newGroups: Group[]) => {
        setGroups(newGroups);
      });

      return () => unsubscribe();
    }
  }, [user]);

  const renderGroupCard = ({ item }: { item: Group }) => (
    <Link href={{ pathname: `/group/${item.id}` as any}} asChild>
      <TouchableOpacity>
        <View style={styles.groupCard}>
          <Text style={styles.groupName}>{item.name}</Text>
          <Text style={styles.groupInfo}>{`${item.members.length} buds`}</Text>
        </View>
      </TouchableOpacity>
    </Link>
  );

  return (
    <View style={styles.container}>
      <AppHeader title="Buds" />

      {groups.length > 0 ? (
        <FlatList
        data={groups}
        renderItem={renderGroupCard}
        keyExtractor={(item) => item.id}
      />
      ) : (
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderText}>No groups yet. Create one!</Text>
        </View>
      )}
      <Link href="/group/create" asChild>
        <TouchableOpacity style={styles.newGroupButton}>
          <Ionicons name="add" size={30} color="white" />
        </TouchableOpacity>
      </Link>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  },
  groupCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
  },
  groupName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  groupInfo: {
    fontSize: 16,
    color: '#aaa',
    marginTop: 5,
  },
  groupExpenses: {
    fontSize: 16,
    color: '#6c63ff',
    marginTop: 10,
    fontWeight: 'bold',
  },
  newGroupButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: '#6c63ff',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  placeholderContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    marginHorizontal: 20,
  },
  placeholderText: {
    color: '#999',
    fontSize: 22,
  },
});

export default BudsHomePage;
