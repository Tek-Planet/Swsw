
import React from 'react';
import { TextInput as RNTextInput, StyleSheet, Text, View } from 'react-native';

interface TextInputProps {
  label: string;
  multiline?: boolean;
}

const TextInput: React.FC<TextInputProps> = ({ label, multiline }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <RNTextInput style={[styles.input, multiline && styles.multiline]} multiline={multiline} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    color: '#ccc',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#333',
    color: '#fff',
    padding: 15,
    borderRadius: 10,
  },
  multiline: {
    height: 100,
    textAlignVertical: 'top',
  },
});

export default TextInput;
