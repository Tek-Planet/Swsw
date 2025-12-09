
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { Event } from '@/types/event'; // Correctly import the Event type

interface EventCardProps {
  event: Event;
}

const EventCard: React.FC<EventCardProps> = ({ event }) => {
  // Default image if coverImageUrl is not provided
  const imageUrl = event.coverImageUrl || 'https://via.placeholder.com/250x120.png?text=Event';

  // Basic date formatting (can be improved with a library like date-fns)
  const eventDate = event.startTime.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
  const eventTime = event.startTime.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <Link href={`/event/${event.id}`} asChild>
      <TouchableOpacity style={styles.card}>
        <Image source={{ uri: imageUrl }} style={styles.image} />
        <View style={styles.content}>
          <Text style={styles.title}>{event.title}</Text>
          <Text style={styles.host}>by {event.hostName}</Text>
          <View style={styles.detailsContainer}>
            <Text style={styles.detailsText}>{eventDate}</Text>
            <Text style={styles.detailsText}>{eventTime}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Link>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    marginRight: 15,
    width: 280, // A bit wider for better content display
    overflow: 'hidden', // Ensures the image corners are rounded
  },
  image: {
    width: '100%',
    height: 140, // Increased height for a better visual
  },
  content: {
    padding: 15,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  host: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 10,
  },
  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopColor: '#333',
    borderTopWidth: 1,
    paddingTop: 10,
  },
  detailsText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default EventCard;
