
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}

const PrimaryButton: React.FC<ButtonProps> = ({ title, onPress, disabled }) => {
  return (
    <TouchableOpacity style={[styles.button, styles.primary, disabled && styles.disabled]} onPress={onPress} disabled={disabled}>
      <Text style={[styles.text, styles.primaryText]}>{title}</Text>
    </TouchableOpacity>
  );
};

const SecondaryButton: React.FC<ButtonProps> = ({ title, onPress, disabled }) => {
    return (
      <TouchableOpacity style={[styles.button, styles.secondary, disabled && styles.disabled]} onPress={onPress} disabled={disabled}>
        <Text style={[styles.text, styles.secondaryText]}>{title}</Text>
      </TouchableOpacity>
    );
  };

const styles = StyleSheet.create({
  button: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    marginVertical: 10,
  },
  primary: {
    backgroundColor: '#6c63ff',
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#6c63ff',
  },
  disabled: {
    backgroundColor: '#ccc',
    borderColor: '#ccc',
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  primaryText: {
    color: '#fff',
  },
  secondaryText: {
    color: '#6c63ff',
  },
});

export { PrimaryButton, SecondaryButton };
