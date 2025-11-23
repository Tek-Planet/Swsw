
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';

interface LocationCardProps {
  locationName: string;
  address: string;
}

const LocationCard: React.FC<LocationCardProps> = ({ locationName, address }) => {
  return (
    <TouchableOpacity style={styles.container}>
      <Ionicons name="location-pin" size={24} color="white" />
      <View style={styles.textContainer}>
        <Text style={styles.locationName}>{locationName}</Text>
        <Text style={styles.address}>{address}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#333',
    borderRadius: 8,
    marginVertical: 8,
  },
  textContainer: {
    marginLeft: 16,
  },
  locationName: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  address: {
    color: 'gray',
    fontSize: 14,
  },
});

export default LocationCard;
