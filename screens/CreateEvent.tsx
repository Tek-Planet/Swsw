
import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import ScreenTitle from '../components/ScreenTitle';
import TextInput from '../components/TextInput';
import ToggleButtons from '../components/ToggleButtons';
import DateTimePicker from '../components/DateTimePicker';
import TicketTierList from '../components/TicketTierList';
import Button from '../components/Button';

const CreateEvent: React.FC = () => {
  return (
    <ScrollView style={styles.container}>
      <ScreenTitle title="Create Event" />
      <TextInput label="Event Title" />
      <TextInput label="Event Description" multiline />
      <ToggleButtons label="Event Type" options={['Public', 'Private']} />
      <DateTimePicker label="Start Date & Time" />
      <DateTimePicker label="End Date & Time" />
      <TicketTierList />
      <Button title="Create Event" onPress={() => {}} style={{ marginTop: 20 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
    padding: 20,
  },
});

export default CreateEvent;
