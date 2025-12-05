
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface ChipSelectorProps {
  options: string[];
  selectedOptions: string[];
  onSelectionChange: (selected: string[]) => void;
}

const Chip: React.FC<{ label: string; selected: boolean; onPress: () => void; }> = ({ label, selected, onPress }) => (
  <TouchableOpacity
    style={[styles.chip, selected ? styles.selectedChip : {}]}
    onPress={onPress}
  >
    <Text style={[styles.chipText, selected ? styles.selectedChipText : {}]}>{label}</Text>
  </TouchableOpacity>
);

const ChipSelector: React.FC<ChipSelectorProps> = ({ options, selectedOptions, onSelectionChange }) => {
  const toggleSelection = (option: string) => {
    const newSelection = selectedOptions.includes(option)
      ? selectedOptions.filter(item => item !== option)
      : [...selectedOptions, option];
    onSelectionChange(newSelection);
  };

  return (
    <View style={styles.container}>
      {options.map(option => (
        <Chip
          key={option}
          label={option}
          selected={selectedOptions.includes(option)}
          onPress={() => toggleSelection(option)}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 10,
  },
  chip: {
    backgroundColor: '#333',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    margin: 5,
  },
  selectedChip: {
    backgroundColor: '#6c63ff',
  },
  chipText: {
    color: '#fff',
  },
    selectedChipText: {
    color: '#fff',
    fontWeight: 'bold',
    },
});

export default ChipSelector;
