
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ExpenseSummary: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.summaryItem}>
        <Text style={styles.summaryLabel}>Total Owed</Text>
        <Text style={styles.summaryValue}>$124</Text>
      </View>
      <View style={styles.summaryItem}>
        <Text style={styles.summaryLabel}>You Owe</Text>
        <Text style={styles.summaryValue}>$18</Text>
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
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default ExpenseSummary;
