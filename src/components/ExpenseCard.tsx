
import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

interface ExpenseCardProps {
  expense: {
    id: string;
    description: string;
    amount: number;
    paidBy: string;
    avatar: string;
  };
}

const ExpenseCard: React.FC<ExpenseCardProps> = ({ expense }) => {
  return (
    <View style={styles.card}>
      <Image source={{ uri: expense.avatar }} style={styles.avatar} />
      <View style={styles.expenseInfo}>
        <Text style={styles.description}>{expense.description}</Text>
        <Text style={styles.paidBy}>{`Paid by ${expense.paidBy}`}</Text>
      </View>
      <Text style={styles.amount}>{`$${expense.amount.toFixed(2)}`}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3a3a3a',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 15,
  },
  expenseInfo: {
    flex: 1,
  },
  description: {
    color: 'white',
    fontSize: 16,
  },
  paidBy: {
    color: '#aaa',
    fontSize: 14,
  },
  amount: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ExpenseCard;
