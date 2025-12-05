import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import EnhanceGridButton from './EnhanceGridButton';

// TODO: This should be a real type
interface EventCardProps {
  event: any;
}

const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const router = useRouter();

  const handleEnhanceGridPress = () => {
    router.push('/enhance-grid-survey');
  };

  const renderEventContent = () => {
    if (event.time) { // Upcoming Event
      return (
        <View style={styles.recommendedEventCard}>
          <Image source={{ uri: event.image }} style={styles.recommendedEventImage} />
          <Text style={styles.recommendedEventTitle}>{event.name}</Text>
          <Text style={styles.recommendedEventHost}>{event.host}</Text>
          <View style={styles.upcomingEventDetails}>
            <Text style={styles.eventTime}>{event.time}</Text>
            <Text style={styles.goingStatus}>✓ GOING</Text>
          </View>
          <View style={styles.divider} />
          <EnhanceGridButton onPress={handleEnhanceGridPress} />
          <Text style={styles.helperText}>Find new people to meet at this event.</Text>
        </View>
      );
    } else if (event.status) { // Recommended Event
      return (
        <View style={styles.recommendedEventCard}>
          <Image source={{ uri: event.image }} style={styles.recommendedEventImage} />
          <Text style={styles.recommendedEventTitle}>{event.title}</Text>
          <Text style={styles.recommendedEventHost}>{event.host}</Text>
          <Text style={styles.status}>{event.status}</Text>
          <View style={styles.divider} />
          <EnhanceGridButton onPress={handleEnhanceGridPress} />
          <Text style={styles.helperText}>Find new people to meet at this event.</Text>
        </View>
      );
    } else { // Trending Event
      return (
        <View style={styles.trendingEventCard}>
          <View style={styles.trendingEventHeader}>
            <Text style={styles.trendingEventTitle}>{event.title}</Text>
            <TouchableOpacity>
              <Text style={styles.joinButton}>Join</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.trendingEventSubtitle}>{event.subtitle}</Text>
          <Image source={{ uri: event.image }} style={styles.trendingEventImage} />
          <View style={styles.attendees}>
            <Text style={styles.attendeeText}>{event.attendees}</Text>
          </View>
          <View style={styles.divider} />
          <EnhanceGridButton onPress={handleEnhanceGridPress} />
          <Text style={styles.helperText}>Find new people to meet at this event.</Text>
        </View>
      );
    }
  };

  return (
    <TouchableOpacity onPress={() => router.push(`/event/${event.id}`)}>
      {renderEventContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
    divider: {
        height: 1,
        backgroundColor: '#444',
        marginVertical: 15,
      },
    helperText: {
        color: '#aaa',
        fontSize: 12,
        textAlign: 'center',
        marginTop: 5,
    },
    eventTime: {
        color: '#aaa',
        fontSize: 14,
    },
    goingStatus: {
        color: '#28a745',
        fontWeight: 'bold',
        fontSize: 16,
    },
    upcomingEventDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
    },
    recommendedEventCard: {
        backgroundColor: '#1a1a1a',
        borderRadius: 15,
        padding: 15,
        marginRight: 15,
        width: 250,
    },
    recommendedEventImage: {
        width: '100%',
        height: 120,
        borderRadius: 10,
    },
    recommendedEventTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 10,
    },
    recommendedEventHost: {
        color: '#aaa',
        fontSize: 14,
        marginTop: 5,
    },
    status: {
        color: '#6c63ff',
        fontSize: 14,
        marginTop: 10,
    },
    trendingEventCard: {
        backgroundColor: '#1a1a1a',
        borderRadius: 15,
        padding: 20,
        shadowColor: '#fff',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
    },
    trendingEventHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    trendingEventTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    joinButton: {
        color: '#6c63ff',
        fontWeight: 'bold',
    },
    trendingEventSubtitle: {
        color: '#aaa',
        fontSize: 14,
        marginVertical: 10,
    },
    trendingEventImage: {
        width: '100%',
        height: 150,
        borderRadius: 10,
    },
    attendees: {
        marginTop: 10,
    },
    attendeeText: {
        color: '#fff',
    },
});

export default EventCard;
