
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface DropdownSelectProps {
  label: string;
  options: string[];
}

const DropdownSelect: React.FC<DropdownSelectProps> = ({ label, options }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const onSelect = (option: string) => {
    setSelectedOption(option);
    setIsOpen(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.button} onPress={() => setIsOpen(!isOpen)}>
        <Text style={styles.buttonText}>{selectedOption || 'Select an option'}</Text>
      </TouchableOpacity>
      {isOpen && (
        <View style={styles.dropdown}>
          {options.map(option => (
            <TouchableOpacity key={option} style={styles.option} onPress={() => onSelect(option)}>
              <Text style={styles.optionText}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
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
  button: {
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
  },
  dropdown: {
    backgroundColor: '#333',
    borderRadius: 5,
    marginTop: 5,
  },
  option: {
    padding: 15,
  },
  optionText: {
    color: '#fff',
  },
});

export default DropdownSelect;
