
import React from 'react';
import { View, StyleSheet } from 'react-native';
import TextInput from './TextInput';

const TicketTier: React.FC = () => {
  return (
    <View style={styles.tier}>
      <TextInput label="Tier Name" />
      <TextInput label="Price" />
      <TextInput label="Quantity" />
    </View>
  );
};

const styles = StyleSheet.create({
  tier: {
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
});

export default TicketTier;
