
import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SocialLoginButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  onPress: () => void;
}

const SocialLoginButton: React.FC<SocialLoginButtonProps> = ({ icon, text, onPress }) => {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Ionicons name={icon} size={24} color="#fff" style={styles.icon} />
      <Text style={styles.text}>{text}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  icon: {
    marginRight: 16,
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SocialLoginButton;
