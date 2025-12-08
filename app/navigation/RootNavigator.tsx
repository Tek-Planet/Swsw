
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
    const inOnboardingGroup = segments[0] === '(onboarding)';
    const inTabsGroup = segments[0] === '(tabs)';

    if (user) {
      if (isOnboardingComplete) {
        // User is fully onboarded. They should be in the main app.
        // If they are not in the (tabs) group, redirect them.
        if (!inTabsGroup) {
          router.replace('/(tabs)');
        }
      } else {
        // User is not onboarded. They should be in the onboarding flow.
        // If they are not in the (onboarding) group, redirect them.
        if (!inOnboardingGroup) {
          router.replace('/(onboarding)/welcome');
        }
      }
    } else {
      // User is not logged in. They should be in the auth flow.
      // If they are not in the (auth) group, redirect them.
      if (!inAuthGroup) {
        router.replace('/(auth)/signIn');
      }
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
