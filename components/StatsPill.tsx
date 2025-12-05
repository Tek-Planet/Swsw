
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StatsPillProps {
  label: string;
  value: string;
}

const StatsPill: React.FC<StatsPillProps> = ({ label, value }) => {
  return (
    <View style={styles.pill}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    backgroundColor: '#333',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    alignItems: 'center',
  },
  value: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  label: {
    color: '#aaa',
    fontSize: 12,
  },
});

export default StatsPill;
