
import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import ActivityCard from './ActivityCard';

interface ActivityFeedProps {
  groupId: string;
}

const activities = [
  { id: '1', user: 'Alice', avatar: 'https://i.pravatar.cc/150?img=4', action: 'added a new expense \'Groceries\'', timestamp: '2 hours ago' },
  { id: '2', user: 'Bob', avatar: 'https://i.pravatar.cc/150?img=5', action: 'updated the event poll', timestamp: 'Yesterday' },
  { id: '3', user: 'Charlie', avatar: 'https://i.pravatar.cc/150?img=6', action: 'joined the group', timestamp: '3 days ago' },
];

const ActivityFeed: React.FC<ActivityFeedProps> = ({ groupId }) => {
  const renderActivity = ({ item }: any) => <ActivityCard activity={item} />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Activity Feed</Text>
      <FlatList
        data={activities}
        renderItem={renderActivity}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#2a2a2a',
    borderRadius: 15,
    marginHorizontal:20
  },
  title: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});

export default ActivityFeed;
