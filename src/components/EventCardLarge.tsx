
import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

interface EventCardLargeProps {
  event: {
    title: string;
    time: string;
    coverImage: string;
    location: string;
    ticketsSold: number;
    revenue?: number;
  };
}

const EventCardLarge: React.FC<EventCardLargeProps> = ({ event }) => {
  return (
    <View style={styles.card}>
      <Image source={{ uri: event.coverImage }} style={styles.image} />
      <View style={styles.content}>
        <Text style={styles.title}>{event.title}</Text>
        <Text style={styles.time}>{event.time}</Text>
        <Text style={styles.location}>{event.location}</Text>
        <View style={styles.stats}>
          <Text style={styles.stat}>{event.ticketsSold} tickets sold</Text>
          {event.revenue && <Text style={styles.stat}>${event.revenue} revenue</Text>}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#333',
    borderRadius: 10,
    marginBottom: 20,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 150,
  },
  content: {
    padding: 15,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  time: {
    color: '#ccc',
    marginTop: 5,
  },
  location: {
    color: '#ccc',
    marginTop: 5,
  },
  stats: {
    flexDirection: 'row',
    marginTop: 10,
  },
  stat: {
    color: '#fff',
    marginRight: 15,
  },
});

export default EventCardLarge;
