
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface DateTimeCardProps {
  date: string;
  time: string;
}

const DateTimeCard: React.FC<DateTimeCardProps> = ({ date, time }) => {
  return (
    <View style={styles.card}>
      <Icon name="calendar-outline" size={24} color="#fff" />
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
    backgroundColor: '#222',
    padding: 15,
    borderRadius: 10,
  },
  textContainer: {
    marginLeft: 15,
  },
  date: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  time: {
    color: '#ccc',
    marginTop: 5,
  },
});

export default DateTimeCard;
