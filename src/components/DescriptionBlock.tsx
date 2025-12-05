
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface DescriptionBlockProps {
  text: string;
}

const DescriptionBlock: React.FC<DescriptionBlockProps> = ({ text }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  text: {
    color: 'white',
    fontSize: 16,
    lineHeight: 24,
  },
});

export default DescriptionBlock;
