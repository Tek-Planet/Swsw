
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface UploadSelfieButtonProps {
  onPress: () => void;
}

const UploadSelfieButton: React.FC<UploadSelfieButtonProps> = ({ onPress }) => {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Ionicons name="camera" size={20} color="#fff" />
      <Text style={styles.text}>Upload New Selfie</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6c63ff',
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
    justifyContent: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 10,
  },
});

export default UploadSelfieButton;
