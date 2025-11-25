
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {Ionicons as Icon} from '@react-native-vector-icons/ionicons';
interface LocationCardProps {
  location: string;
  address: string;
}

const LocationCard: React.FC<LocationCardProps> = ({ location, address }) => {
  return (
    <View style={styles.card}>
      <Icon name="location-outline" size={24} color="#fff" />
      <View style={styles.textContainer}>
        <Text style={styles.location}>{location}</Text>
        <Text style={styles.address}>{address}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    padding: 15,
    borderRadius: 10,
  },
  textContainer: {
    marginLeft: 15,
  },
  location: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  address: {
    color: '#ccc',
    marginTop: 5,
  },
});

export default LocationCard;
