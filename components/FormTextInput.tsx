
import React from 'react';
import { View, Text, StyleSheet, TextInputProps } from 'react-native';
import TextInputField from './TextInputField';

interface FormTextInputProps extends TextInputProps {
  label: string;
}

export const FormTextInput: React.FC<FormTextInputProps> = ({ label, ...props }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInputField {...props} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 10,
  },
});
