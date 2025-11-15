
import React from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { AppHeader } from '../components/Header';

const EventsScreen = () => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <AppHeader title="Events"/>
      <View style={styles.content}>
        <Text style={styles.text}>Events Screen</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    color: '#fff',
  },
});

export default EventsScreen;
