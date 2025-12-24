
import React from 'react';
import { TextInput, StyleSheet, StyleProp, ViewStyle, TextInputProps } from 'react-native';

// We can extend the base TextInputProps from React Native to inherit all its properties,
// including 'multiline' and 'numberOfLines', and then add our own custom ones if needed.
interface TextInputFieldProps extends TextInputProps {
  // You can add any custom props specific to your component here
  // For now, we just want to ensure all standard TextInput props are accepted.
}

const TextInputField: React.FC<TextInputFieldProps> = ({ style, ...rest }) => {
  return (
    <TextInput
      // Combine the default styles with any custom styles passed in via props
      style={[styles.input, style]}
      placeholderTextColor="#aaa"
      {...rest} // Pass all other props down to the TextInput
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
