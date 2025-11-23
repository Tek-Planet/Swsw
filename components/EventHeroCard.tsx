
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const EventHeroCard = ({ eventName }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.eventName}>{eventName}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
  },
  eventName: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
  },
});

export default EventHeroCard;
