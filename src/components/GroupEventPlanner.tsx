
import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import PollWidget from './PollWidget';

interface GroupEventPlannerProps {
  groupId: string;
}

const suggestedEvents = [
  { id: '1', name: 'Beach Day' },
  { id: '2', name: 'Movie Night' },
  { id: '3', name: 'Escape Room' },
];

const GroupEventPlanner: React.FC<GroupEventPlannerProps> = ({ groupId }) => {
  const renderSuggestedEvent = ({ item }: any) => (
    <TouchableOpacity style={styles.suggestedEventCard}>
      <Text style={styles.suggestedEventName}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Event Planner</Text>
      <Text style={styles.subtitle}>Suggested for you</Text>
      <FlatList
        data={suggestedEvents}
        renderItem={renderSuggestedEvent}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
      />
      <PollWidget />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#2a2a2a',
    borderRadius: 15,
    margin:20
  },
  title: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    color: '#aaa',
    fontSize: 16,
    marginBottom: 10,
  },
  suggestedEventCard: {
    backgroundColor: '#3a3a3a',
    borderRadius: 10,
    padding: 15,
    marginRight: 10,
  },
  suggestedEventName: {
    color: 'white',
    fontSize: 16,
  },
});

export default GroupEventPlanner;
