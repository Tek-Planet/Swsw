
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface SurveyNavigationBarProps {
  onNext: () => void;
  onBack: () => void;
  isNextDisabled?: boolean;
}

const SurveyNavigationBar: React.FC<SurveyNavigationBarProps> = ({ onNext, onBack, isNextDisabled }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={onBack}>
        <Text style={styles.buttonText}>Back</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, styles.primaryButton, isNextDisabled && styles.disabledButton]}
        onPress={onNext}
        disabled={isNextDisabled}
      >
        <Text style={styles.buttonText}>Next</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    position: 'absolute',
    bottom: 50,
  },
  button: {
    backgroundColor: '#333',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 30,
  },
  primaryButton: {
    backgroundColor: '#6c63ff',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default SurveyNavigationBar;
