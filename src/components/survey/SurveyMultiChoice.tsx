
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface SurveyMultiChoiceProps {
  options: string[];
  onSelect: (selected: string[]) => void;
  selectedOptions?: string[];
}

const SurveyMultiChoice: React.FC<SurveyMultiChoiceProps> = ({ options, onSelect, selectedOptions = [] }) => {

  const handleSelect = (option: string) => {
    const newSelected = selectedOptions.includes(option)
      ? selectedOptions.filter((item) => item !== option)
      : [...selectedOptions, option];
    onSelect(newSelected);
  };

  return (
    <View>
      {options.map((option) => (
        <TouchableOpacity
          key={option}
          style={[styles.option, selectedOptions.includes(option) && styles.selectedOption]}
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

export default SurveyMultiChoice;
