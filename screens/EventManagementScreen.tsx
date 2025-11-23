
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import MetricCard from '../components/MetricCard';
import PayoutCard from '../components/PayoutCard';
import GuestListItem from '../components/GuestListItem';

const EventManagementScreen: React.FC = () => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Event Management</Text>
      <MetricCard label="Ticket Sales" value="$1,234" />
      <MetricCard label="Revenue" value="$863.80" />
      <PayoutCard amount="$863.80" status="Paid on May 23, 2024" />
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Guest List</Text>
        <GuestListItem name="John Doe" status="Checked In" />
        <GuestListItem name="Jane Smith" status="Not Checked In" />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});

export default EventManagementScreen;
