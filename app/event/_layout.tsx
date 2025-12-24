
import StepIndicator from '@/components/StepIndicator';
import { Slot, usePathname } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

const steps = [
    '/event/create',
    '/event/create/step2',
    '/event/create/step3',
    '/event/create/step4',
];

const EventCreationLayout: React.FC = () => {
    const pathname = usePathname();
    const currentStep = steps.indexOf(pathname) + 1;

  return (
    <View style={styles.container}>
      {pathname.includes('create') && <StepIndicator currentStep={currentStep} totalSteps={4} />}
      <Slot />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 10,
  },
});

export default EventCreationLayout;
