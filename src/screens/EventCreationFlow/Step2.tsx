
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import TextInput from '../../components/TextInput';
import ToggleButtons from '../../components/ToggleButtons';

const Step2: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Time & Place</Text>
      <TextInput label="Date" />
      <TextInput label="Start Time" />
      <TextInput label="End Time" />
      <TextInput label="Venue Address" />
      <ToggleButtons label="" options={['Online']} />
      <TextInput label="Directions Note" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});

export default Step2;
