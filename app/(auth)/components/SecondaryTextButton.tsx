
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';

const SecondaryTextButton = ({ text, highlight, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
      <ThemedText style={styles.text}>
        {text}
        <ThemedText style={styles.highlight}> {highlight}</ThemedText>
      </ThemedText>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 16,
  },
  highlight: {
    color: '#FF00A8',
    fontWeight: 'bold',
  },
});

export default SecondaryTextButton;
