
import React from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { Stack, SplashScreen } from 'expo-router';

export default function RootNavigator() {
  const { user, loading, isOnboardingComplete } = useAuth();

  if (loading) {
    return null; // Or a custom loading component
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {user ? (
        isOnboardingComplete ? (
          <Stack.Screen name="(tabs)" />
        ) : (
          <Stack.Screen name="(onboarding)" />
        )
      ) : (
        <Stack.Screen name="(auth)" />
      )}
    </Stack>
  );
}
