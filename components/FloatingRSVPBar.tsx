
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const FloatingRSVPBar = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.status}>🎉 Going</Text>
      <Text style={styles.subtext}>Edit your RSVP</Text>
      <TouchableOpacity>
        <Ionicons name="ellipsis-horizontal" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#6c63ff',
    borderRadius: 30,
  },
  status: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  subtext: {
    color: 'white',
    fontSize: 14,
  },
});

export default FloatingRSVPBar;
