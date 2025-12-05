
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ToggleButtons from '../../components/ToggleButtons';
import TicketTierList from '../../components/TicketTierList';

const Step4: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tickets & Stripe</Text>
      <ToggleButtons label="" options={['Free Event', 'Paid Event']} />
      <TicketTierList />
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

export default Step4;
