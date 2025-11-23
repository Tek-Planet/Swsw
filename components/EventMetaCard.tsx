
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons as Icon } from "@react-native-vector-icons/ionicons";

const EventMetaCard = ({ date, time, icon }) => {
  return (
    <View style={styles.card}>
      <Icon name={icon} size={24} color="#fff" />
      <View style={styles.textContainer}>
        <Text style={styles.date}>{date}</Text>
        <Text style={styles.time}>{time}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 15,
    padding: 15,
    marginHorizontal: 20,
    marginTop: 20,
  },
  textContainer: {
    marginLeft: 15,
  },
  date: {
    color: '#fff',
    fontSize: 16,
  },
  time: {
    color: '#aaa',
    fontSize: 14,
  },
});

export default EventMetaCard;
