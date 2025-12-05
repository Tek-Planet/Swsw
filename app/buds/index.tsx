
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// TODO: This should be a real type
interface Bud {
    id: string;
    name: string;
    members: number;
    nextEvent: string;
    expenses: number;
}

const budsData: Bud[] = [
  {
    id: '1',
    name: 'YOLO crew',
    members: 12,
    nextEvent: 'Bonfire',
    expenses: 18,
  },
  // Add more bud groups here
];

const BudsHomePage: React.FC = () => {
  const router = useRouter();

  const renderGroupCard = ({ item }: { item: Bud }) => (
    <TouchableOpacity onPress={() => router.push(`/group/${item.id}`)}>
        <View style={styles.groupCard}>
            <Text style={styles.groupName}>{item.name}</Text>
            <Text style={styles.groupInfo}>{`${item.members} buds`}</Text>
            <Text style={styles.groupInfo}>{`Next up: ${item.nextEvent}`}</Text>
            <Text style={styles.groupExpenses}>{`$${item.expenses} owed`}</Text>
        </View>
    </TouchableOpacity>
  );

  return (
      <View style={styles.container}>
        <Text style={styles.header}>Your Buds</Text>
        <FlatList
          data={budsData}
          renderItem={renderGroupCard}
          keyExtractor={(item) => item.id}
        />
        <TouchableOpacity style={styles.newGroupButton}>
          <Ionicons name="add" size={30} color="white" />
        </TouchableOpacity>
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
  });
  
  export default BudsHomePage;
