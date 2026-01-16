
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ExpenseSummaryProps {
  owedByYou: number;
  owedToYou: number;
}

const ExpenseSummary: React.FC<ExpenseSummaryProps> = ({ owedByYou, owedToYou }) => {
  return (
    <View style={styles.container}>
      <View style={styles.summaryItem}>
        <Text style={styles.summaryLabel}>You are owed</Text>
        <Text style={[styles.summaryValue, styles.positive]}>{`$${owedToYou.toFixed(2)}`}</Text>
      </View>
      <View style={styles.summaryItem}>
        <Text style={styles.summaryLabel}>You owe</Text>
        <Text style={[styles.summaryValue, styles.negative]}>{`$${owedByYou.toFixed(2)}`}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    color: '#aaa',
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  positive: {
    color: '#28a745',
  },
  negative: {
    color: '#dc3545',
  },
});

export default ExpenseSummary;
