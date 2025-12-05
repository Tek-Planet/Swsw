
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface ToggleButtonsProps {
  label: string;
  options: string[];
}

const ToggleButtons: React.FC<ToggleButtonsProps> = ({ label, options }) => {
  const [selected, setSelected] = useState(options[0]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.buttons}>
        {options.map((option) => (
          <TouchableOpacity
            key={option}
            style={[styles.button, selected === option && styles.selectedButton]}
            onPress={() => setSelected(option)}
          >
            <Text style={[styles.buttonText, selected === option && styles.selectedButtonText]}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>
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
  buttons: {
    flexDirection: 'row',
    backgroundColor: '#333',
    borderRadius: 25,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  selectedButton: {
    backgroundColor: '#6c63ff',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  selectedButtonText: {
    color: '#fff',
  },
});

export default ToggleButtons;
