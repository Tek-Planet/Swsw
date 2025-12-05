import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface EnhanceGridButtonProps {
  onPress: () => void;
}

const EnhanceGridButton: React.FC<EnhanceGridButtonProps> = ({ onPress }) => (
  <TouchableOpacity style={styles.button} onPress={onPress}>
    <Text style={styles.text}>Enhance Your Grid</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#333',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  text: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default EnhanceGridButton;
