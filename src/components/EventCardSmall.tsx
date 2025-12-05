
import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

interface EventCardSmallProps {
  event: {
    thumbnail: string;
    title: string;
    host: string;
    price?: number;
    category: string;
    location: string;
  };
}

const EventCardSmall: React.FC<EventCardSmallProps> = ({ event }) => {
  return (
    <View style={styles.card}>
      <Image source={{ uri: event.thumbnail }} style={styles.thumbnail} />
      <View style={styles.content}>
        <Text style={styles.title}>{event.title}</Text>
        <Text style={styles.host}>{event.host}</Text>
        <Text style={styles.category}>{event.category}</Text>
        <Text style={styles.location}>{event.location}</Text>
        <Text style={styles.price}>{event.price ? `$${event.price}` : 'Free'}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#333',
    borderRadius: 10,
    marginRight: 15,
    width: 200,
  },
  thumbnail: {
    width: '100%',
    height: 100,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  content: {
    padding: 10,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  host: {
    color: '#ccc',
    marginTop: 5,
  },
  category: {
    color: '#ccc',
    marginTop: 5,
  },
  location: {
    color: '#ccc',
    marginTop: 5,
  },
  price: {
    color: '#fff',
    fontWeight: 'bold',
    marginTop: 10,
  },
});

export default EventCardSmall;
