
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, totalSteps }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.stepText}>{`Step ${currentStep} of ${totalSteps}`}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    alignItems: 'center',
  },
  stepText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default StepIndicator;
