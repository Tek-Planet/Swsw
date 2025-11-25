
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface SurveySingleChoiceProps {
  options: string[];
  onSelect: (selected: string) => void;
  selectedOption?: string | null;
}

const SurveySingleChoice: React.FC<SurveySingleChoiceProps> = ({ options, onSelect, selectedOption }) => {

  const handleSelect = (option: string) => {
    onSelect(option);
  };

  return (
    <View>
      {options.map((option) => (
        <TouchableOpacity
          key={option}
          style={[styles.option, selectedOption === option && styles.selectedOption]}
          onPress={() => handleSelect(option)}
        >
          <Text style={styles.optionText}>{option}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  option: {
    backgroundColor: '#333',
    borderRadius: 10,
    padding: 15,
    marginVertical: 5,
    width: 300,
    alignItems: 'center',
  },
  selectedOption: {
    backgroundColor: '#6c63ff',
  },
  optionText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default SurveySingleChoice;
