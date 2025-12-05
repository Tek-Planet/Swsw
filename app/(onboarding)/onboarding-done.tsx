
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { PrimaryButton } from '@/components';
import OnboardingContainer from '@/components/OnboardingContainer';

const OnboardingDoneScreen = () => {
  const router = useRouter();

  return (
    <OnboardingContainer>
      <View style={styles.content}>
        <Text style={styles.title}>You’re all set!</Text>
        <Text style={styles.subtitle}>
          Welcome to the community. Let’s find something to do!
        </Text>
      </View>
      <View style={styles.actions}>
        <PrimaryButton
          title="Let's Go!"
          onPress={() => router.replace('/(tabs)')}
        />
      </View>
    </OnboardingContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#A9A9A9',
    textAlign: 'center',
    marginBottom: 40,
  },
  actions: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
});

export default OnboardingDoneScreen;
