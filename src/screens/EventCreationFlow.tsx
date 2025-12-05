
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import StepIndicator from '../components/StepIndicator';
import Step1 from './EventCreationFlow/Step1';
import Step2 from './EventCreationFlow/Step2';
import Step3 from './EventCreationFlow/Step3';
import Step4 from './EventCreationFlow/Step4';

const EventCreationFlow: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1 />;
      case 2:
        return <Step2 />;
      case 3:
        return <Step3 />;
      case 4:
        return <Step4 />;
      default:
        return <Step1 />;
    }
  };

  return (
    <View style={styles.container}>
      <StepIndicator currentStep={currentStep} totalSteps={4} />
      {renderStep()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
  },
});

export default EventCreationFlow;
