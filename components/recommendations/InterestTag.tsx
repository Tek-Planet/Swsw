import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface InterestTagProps {
  interest: string;
}

const InterestTag: React.FC<InterestTagProps> = ({ interest }) => (
  <View style={styles.tag}>
    <Text style={styles.text}>{interest}</Text>
  </View>
);

const styles = StyleSheet.create({
  tag: {
    backgroundColor: '#333',
    borderRadius: 15,
    paddingVertical: 5,
    paddingHorizontal: 10,
    margin: 5,
  },
  text: {
    color: '#fff',
    fontSize: 12,
  },
});

export default InterestTag;
