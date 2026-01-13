import { listenToGroupEvents } from '@/lib/services/eventService';
import { Event } from '@/types/event';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

interface GroupEventPlannerProps {
  groupId: string;
}

const GroupEventPlanner: React.FC<GroupEventPlannerProps> = ({ groupId }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = listenToGroupEvents(groupId, (newEvents) => {
      setEvents(newEvents);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [groupId]);

  const renderEvent = ({ item }: { item: Event }) => (
    <View style={styles.eventCard}>
      <Text style={styles.eventTitle}>{item.title}</Text>
      <Text style={styles.eventDate}>_...formatted date..._</Text>
    </View>
  );

  if (loading) {
    return <ActivityIndicator />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upcoming Events</Text>
      {events.length > 0 ? (
        <FlatList
          data={events}
          renderItem={renderEvent}
          keyExtractor={(item) => item.id}
        />
      ) : (
        <Text style={styles.noEventsText}>No upcoming events. Plan one!</Text>
      )}
      <TouchableOpacity style={styles.planButton}>
        <Text style={styles.planButtonText}>Plan an Event</Text>
      </TouchableOpacity>
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
    marginBottom: 20,
  },
  eventCard: {
    backgroundColor: '#3a3a3a',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  eventTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  eventDate: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 5,
  },
  noEventsText: {
    color: '#aaa',
    textAlign: 'center',
    marginVertical: 20,
  },
  planButton: {
    backgroundColor: '#6c63ff',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  planButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default GroupEventPlanner;
