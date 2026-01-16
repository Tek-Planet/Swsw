
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Debt } from '@/lib/services/debtService';

interface DebtCardProps {
  debt: Debt;
}

const DebtCard: React.FC<DebtCardProps> = ({ debt }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.debtText}>
        <Text style={styles.user}>{debt.from}</Text> owes <Text style={styles.user}>{debt.to}</Text>
      </Text>
      <Text style={styles.amount}>{`$${debt.amount.toFixed(2)}`}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#3a3a3a',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  debtText: {
    color: 'white',
    fontSize: 16,
  },
  user: {
    fontWeight: 'bold',
    color: '#6c63ff',
  },
  amount: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default DebtCard;
