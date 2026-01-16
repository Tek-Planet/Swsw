
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Debt } from '@/lib/services/debtService';

interface DebtCardProps {
  debt: Debt;
  fromUser: string;
  toUser: string;
  onSettle: (debt: Debt) => void;
}

const DebtCard: React.FC<DebtCardProps> = ({ debt, fromUser, toUser, onSettle }) => {
  return (
    <View style={styles.card}>
      <View style={styles.debtInfo}>
        <Text style={styles.debtText}>
          <Text style={styles.user}>{fromUser}</Text> owes <Text style={styles.user}>{toUser}</Text>
        </Text>
        <Text style={styles.amount}>{`$${debt.amount.toFixed(2)}`}</Text>
      </View>
      <TouchableOpacity style={styles.settleButton} onPress={() => onSettle(debt)}>
        <Text style={styles.settleButtonText}>Settle up</Text>
      </TouchableOpacity>
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
  debtInfo: {
    flex: 1,
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
    marginTop: 5,
  },
  settleButton: {
    backgroundColor: '#6c63ff',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  settleButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default DebtCard;
