
import React from 'react';
import { View, Text, StyleSheet, StatusBar, FlatList, TouchableOpacity } from 'react-native';
import { AppHeader } from '../components/Header';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

// Mock data for events
const events = [
  { id: '1', title: 'Hangout at the Park', date: 'Saturday, Nov 22' },
  { id: '2', title: 'Beach Bonfire', date: 'Friday, Dec 1' },
  { id: '3', title: 'Study Session', date: 'Sunday, Dec 3' },
  { id: '4', title: 'Movie Night', date: 'Wednesday, Dec 6' },
];

type EventsScreenProps = NativeStackScreenProps<RootStackParamList, 'Events'>;

const EventsScreen: React.FC<EventsScreenProps> = ({ navigation }) => {
  const renderEvent = ({ item }: { item: typeof events[0] }) => (
    <TouchableOpacity 
      style={styles.eventCard}
      onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}
    >
      <Text style={styles.eventTitle}>{item.title}</Text>
      <Text style={styles.eventDate}>{item.date}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <AppHeader title="Events"/>
      <FlatList
        data={events}
        renderItem={renderEvent}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  eventCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  eventDate: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 5,
  },
});

export default EventsScreen;
