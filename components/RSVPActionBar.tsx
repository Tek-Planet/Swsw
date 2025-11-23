
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const RSVPActionBar = () => {
  const [rsvpStatus, setRsvpStatus] = useState('Going');

  const handleRsvp = () => {
    // In a real app, you'd handle RSVP logic here
    if (rsvpStatus === 'Going') {
      setRsvpStatus('Not Going');
    } else {
      setRsvpStatus('Going');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.rsvpButton} onPress={handleRsvp}>
        <Text style={styles.rsvpButtonText}>🎉 {rsvpStatus}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.notifyButton}>
        <Text style={styles.notifyButtonText}>Notify</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: '#6c63ff',
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
  },
  rsvpButton: {
    flex: 1, // take up available space
  },
  rsvpButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  notifyButton: {},
  notifyButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default RSVPActionBar;
