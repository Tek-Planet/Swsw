
import React from 'react';
import { TextInput, StyleSheet } from 'react-native';

interface TextInputFieldProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
}

const TextInputField: React.FC<TextInputFieldProps> = (props) => {
  return (
    <TextInput
      style={styles.input}
      placeholderTextColor="#aaa"
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  input: {
    backgroundColor: '#333',
    color: '#fff',
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
    fontSize: 16,
  },
});

export default TextInputField;
