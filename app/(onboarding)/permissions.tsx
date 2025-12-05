
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { PrimaryButton } from '@/components';
import OnboardingContainer from '@/components/OnboardingContainer';

const PermissionsScreen = () => {
  const router = useRouter();

  return (
    <OnboardingContainer>
      <View style={styles.content}>
        <Text style={styles.title}>Enable Permissions</Text>
        <Text style={styles.subtitle}>
          To get the most out of Vibe, please enable notifications and location services.
        </Text>
      </View>
      <View style={styles.actions}>
        <PrimaryButton
          title="Enable Permissions"
          onPress={() => router.push('/(onboarding)/onboarding-done')}
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

export default PermissionsScreen;
