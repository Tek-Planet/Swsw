import React from 'react';
import { View, StyleSheet } from 'react-native';

const SurveyContainer: React.FC<{children: React.ReactNode}> = ({ children }) => {
  return <View style={styles.container}>{children}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
    padding: 20,
    justifyContent: 'space-between',
  },
});

export default SurveyContainer;
