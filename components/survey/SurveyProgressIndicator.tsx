
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SurveyProgressIndicatorProps {
  total: number;
  current: number;
}

const SurveyProgressIndicator: React.FC<SurveyProgressIndicatorProps> = ({ total, current }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{current} / {total}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 80,
    alignSelf: 'center',
  },
  text: {
    color: '#aaa',
    fontSize: 16,
  },
});

export default SurveyProgressIndicator;
