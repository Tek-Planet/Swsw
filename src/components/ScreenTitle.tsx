
import React from 'react';
import { Text, StyleSheet } from 'react-native';

interface ScreenTitleProps {
  title: string;
}

const ScreenTitle: React.FC<ScreenTitleProps> = ({ title }) => {
  return <Text style={styles.title}>{title}</Text>;
};

const styles = StyleSheet.create({
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});

export default ScreenTitle;
