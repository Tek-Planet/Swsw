
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface PayoutCardProps {
  amount: string;
  status: string;
}

const PayoutCard: React.FC<PayoutCardProps> = ({ amount, status }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.amount}>{amount}</Text>
      <Text style={styles.status}>{status}</Text>
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>View Details</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    padding: 20,
    margin: 10,
  },
  amount: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  status: {
    color: '#aaa',
    fontSize: 16,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#6c63ff',
    borderRadius: 5,
    padding: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default PayoutCard;
