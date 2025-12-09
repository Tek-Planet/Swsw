
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface DescriptionBlockProps {
  text: string;
}

const DescriptionBlock: React.FC<DescriptionBlockProps> = ({ text }) => {
  return (
    <View style={styles.container}>
        <Text style={styles.title}>About the event</Text>
        <Text style={styles.text}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  title: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  text: {
    color: '#ccc',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'justify',
  },
});

export default DescriptionBlock;
