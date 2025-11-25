
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {Ionicons } from '@react-native-vector-icons/ionicons';

const AvailabilityCheckBadge: React.FC<{ status: 'checking' | 'available' | 'unavailable' }> = ({ status }) => {
  let icon, text, color;

  switch (status) {
    case 'checking':
      icon = 'hourglass-outline';
      text = 'Checking...';
      color = '#aaa';
      break;
    case 'available':
      icon = 'checkmark-circle-outline';
      text = 'Available';
      color = '#2ecc71';
      break;
    case 'unavailable':
      icon = 'close-circle-outline';
      text = 'Unavailable';
      color = '#e74c3c';
      break;
  }

  return (
    <View style={styles.badgeContainer}>
      <Ionicons name={icon} size={16} color={color} />
      <Text style={{ color, marginLeft: 5 }}>{text}</Text>
    </View>
  );
};

const ErrorText: React.FC<{ message: string }> = ({ message }) => (
  <Text style={styles.errorText}>{message}</Text>
);

const HelperText: React.FC<{ message: string }> = ({ message }) => (
  <Text style={styles.helperText}>{message}</Text>
);

const styles = StyleSheet.create({
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  errorText: {
    color: '#e74c3c',
    marginTop: 5,
  },
  helperText: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 5,
  },
});

export { AvailabilityCheckBadge, ErrorText, HelperText };
