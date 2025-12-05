import React, { useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { Stack, useRouter, useSegments } from 'expo-router';

export default function RootNavigator() {
  const { user, loading, isOnboardingComplete } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (user && !isOnboardingComplete) {
      router.replace('/(onboarding)/welcome');
    } else if (user && isOnboardingComplete) {
      router.replace('/(tabs)');
    } else if (!user && !inAuthGroup) {
      router.replace('/(auth)/signIn');
    }
  }, [user, isOnboardingComplete, loading, segments, router]);

  if (loading) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
