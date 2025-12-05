
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const PollWidget: React.FC = () => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const pollOptions = [
    { id: '1', text: 'Friday Night' },
    { id: '2', text: 'Saturday Afternoon' },
    { id: '3', text: 'Sunday Brunch' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>When are you free?</Text>
      {pollOptions.map((option) => (
        <TouchableOpacity
          key={option.id}
          style={[
            styles.option,
            selectedOption === option.id && styles.selectedOption,
          ]}
          onPress={() => setSelectedOption(option.id)}
        >
          <Text style={styles.optionText}>{option.text}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  option: {
    backgroundColor: '#3a3a3a',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  selectedOption: {
    backgroundColor: '#6c63ff',
  },
  optionText: {
    color: 'white',
    fontSize: 16,
  },
});

export default PollWidget;
