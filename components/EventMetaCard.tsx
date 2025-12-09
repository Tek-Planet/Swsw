
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';

interface EventMetaCardProps {
  date: string;
  time: string;
  location: string;
  address?: string;
}

const EventMetaCard: React.FC<EventMetaCardProps> = ({ date, time, location, address }) => {
  return (
    <View style={styles.container}>
      <View style={styles.cardSection}>
        <Icon name="calendar-outline" size={28} color="#A855F7" />
        <View style={styles.textContainer}>
          <Text style={styles.title}>{date}</Text>
          <Text style={styles.subtitle}>{time}</Text>
        </View>
      </View>
      <View style={styles.divider} />
      <View style={styles.cardSection}>
        <Icon name="location-outline" size={28} color="#A855F7" />
        <View style={styles.textContainer}>
          <Text style={styles.title}>{location}</Text>
          {address && <Text style={styles.subtitle}>{address}</Text>}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop:10,
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginBottom: 20,
  },
  cardSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
  },
  textContainer: {
    marginLeft: 20,
    flex: 1,
  },
  title: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 10,
  },
});

export default EventMetaCard;
