
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ToggleButtons from '@/components/ToggleButtons';
import TicketTierList from '@/components/TicketTierList';
import { useRouter } from 'expo-router';
import { PrimaryButton, SecondaryButton } from '@/components/Button';

const Step4: React.FC = () => {
    const router = useRouter();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tickets & Stripe</Text>
      <ToggleButtons label="" options={['Free Event', 'Paid Event']} />
      <TicketTierList />
      <View style={styles.buttonContainer}>
        <SecondaryButton title="Previous" onPress={() => router.back()} />
        <PrimaryButton title="Finish" onPress={() => router.replace('/(tabs)/events')} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
});

export default Step4;
