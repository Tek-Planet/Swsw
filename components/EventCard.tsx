import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { StackNavigationProp } from '@react-navigation/stack';
import EnhanceGridButton from './EnhanceGridButton';

interface EventCardProps {
  event: any;
}

type NavigationProps = StackNavigationProp<RootStackParamList, 'EventDetail'>;

const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const navigation = useNavigation<NavigationProps>();

  const handleEnhanceGridPress = () => {
    navigation.navigate('EnhanceGridSurveyScreen');
  };

  const renderEventContent = () => {
    if (event.time) { // Upcoming Event
      return (
        <View style={styles.eventCard}>
          <Image source={{ uri: event.image }} style={styles.upcomingEventImage} />
          <View style={styles.eventDetails}>
            <Text style={styles.eventTime}>{event.time}</Text>
            <Text style={styles.eventName}>{event.name}</Text>
            <Text style={styles.eventHost}>{event.host}</Text>
          </View>
          <TouchableOpacity style={styles.goingButton}>
            <Text style={styles.goingButtonText}>GOING</Text>
          </TouchableOpacity>
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
    <TouchableOpacity onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}>
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
    eventCard: {
        backgroundColor: '#1a1a1a',
        borderRadius: 15,
        padding: 20,
        shadowColor: '#fff',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
      },
      upcomingEventImage: {
        width: '100%',
        height: 150,
        borderRadius: 10,
        marginBottom: 15,
    },
      eventDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      },
      eventTime: {
        color: '#aaa',
        fontSize: 14,
      },
      eventName: {
        color: '#fff',
        fontSize: 22,
        fontWeight: 'bold',
        marginVertical: 5,
      },
      eventHost: {
        color: '#aaa',
        fontSize: 14,
      },
      goingButton: {
        backgroundColor: '#6c63ff',
        borderRadius: 20,
        paddingVertical: 10,
        paddingHorizontal: 20,
      },
      goingButtonText: {
        color: '#fff',
        fontWeight: 'bold',
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
