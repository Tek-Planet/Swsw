
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Expense } from '@/types/expense';

interface ExpenseCardProps {
  expense: Expense;
  paidBy: string;
}

const ExpenseCard: React.FC<ExpenseCardProps> = ({ expense, paidBy }) => {
  return (
    <View style={styles.card}>
      <View style={styles.expenseInfo}>
        <Text style={styles.description}>{expense.description}</Text>
        <Text style={styles.paidBy}>{`Paid by ${paidBy}`}</Text>
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
