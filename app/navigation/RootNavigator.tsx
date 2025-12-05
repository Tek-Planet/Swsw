
import React, { useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { Stack, SplashScreen } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootNavigator() {
  const { user, loading } = useAuth();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {user ? (
        <Stack.Screen name="(tabs)" />
      ) : (
        <Stack.Screen name="(auth)" />
      )}
    </Stack>
  );
}
