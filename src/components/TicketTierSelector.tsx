
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface TicketTier {
  name: string;
  price: number;
  quantity: number;
}

interface TicketTierSelectorProps {
  tiers: TicketTier[];
  onSelect: (tier: TicketTier) => void;
}

const TicketTierSelector: React.FC<TicketTierSelectorProps> = ({ tiers, onSelect }) => {
  return (
    <View>
      {tiers.map((tier, index) => (
        <TouchableOpacity key={index} style={styles.tier} onPress={() => onSelect(tier)}>
          <Text style={styles.tierName}>{tier.name}</Text>
          <Text style={styles.tierPrice}>${tier.price}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  tier: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#333',
    borderRadius: 10,
    marginBottom: 10,
  },
  tierName: {
    color: '#fff',
    fontWeight: 'bold',
  },
  tierPrice: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default TicketTierSelector;
