
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';

const AuthTextInput = ({ label, placeholder, value, onChangeText, secureTextEntry, error, helperText, onBlur, onFocus, keyboardType, autoComplete, autoCapitalize }) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <View style={styles.container}>
      <ThemedText type="defaultSemiBold" style={styles.label}>{label}</ThemedText>
      <View style={[styles.inputContainer, isFocused ? styles.focused : {}]}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#888"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          onBlur={() => setIsFocused(false)}
          onFocus={() => setIsFocused(true)}
          keyboardType={keyboardType}
          autoComplete={autoComplete}
          autoCapitalize={autoCapitalize}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={togglePasswordVisibility} style={styles.icon}>
            <Ionicons name={isPasswordVisible ? 'eye-off' : 'eye'} size={24} color="#888" />
          </TouchableOpacity>
        )}
      </View>
      {error && <ThemedText style={styles.errorText}>{error}</ThemedText>}
      {helperText && !error && <ThemedText style={styles.helperText}>{helperText}</ThemedText>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 8,
    color: '#fff',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  focused: {
    borderColor: '#FF00A8',
  },
  input: {
    flex: 1,
    padding: 16,
    color: '#fff',
    fontSize: 16,
  },
  icon: {
    padding: 16,
  },
  errorText: {
    color: '#FF3B30',
    marginTop: 4,
  },
  helperText: {
    color: '#888',
    marginTop: 4,
  },
});

export default AuthTextInput;
