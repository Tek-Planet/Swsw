
import React from 'react';
import { View, StyleSheet } from 'react-native';

const SectionCard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <View style={styles.card}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    padding: 20,
    marginVertical: 10,
    marginHorizontal:15
  },
});

export default SectionCard;
