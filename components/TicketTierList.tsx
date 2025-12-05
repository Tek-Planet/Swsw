
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import TicketTier from './TicketTier';

const TicketTierList: React.FC = () => {
  const [tiers, setTiers] = useState<any[]>([]);

  return (
    <View style={styles.container}>
      {tiers.map((tier, index) => (
        <TicketTier key={index} />
      ))}
      <TouchableOpacity style={styles.addButton} onPress={() => setTiers([...tiers, {}])}>
        <Text style={styles.addButtonText}>Add Tier</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
  addButton: {
    backgroundColor: '#6c63ff',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default TicketTierList;
