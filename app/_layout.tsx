
import { AuthProvider, useAuth } from '@/lib/context/AuthContext';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { LogBox } from 'react-native';

LogBox.ignoreAllLogs(true);
// This component contains the authentication and navigation logic.
function RootLayoutNav() {
  const { user, loading, isOnboardingComplete } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';

    if (!user) {
      // If the user is not signed in and not in the auth group,
      // redirect them to the sign-in page.
      if (!inAuthGroup) {
        router.replace('/(auth)/signIn');
      }
    } else if (!isOnboardingComplete) {
      // If the user is signed in but not onboarded and not in the onboarding group,
      // redirect them to the welcome page.
      if (!inOnboardingGroup) {
        router.replace('/(onboarding)/welcome');
      }
    } else {
      // If the user is signed in and onboarded and in an auth or onboarding group,
      // redirect them to the main app.
      if (inAuthGroup || inOnboardingGroup) {
        router.replace('/(tabs)');
      }
    }
  }, [user, loading, isOnboardingComplete, segments, router]);

  // The Stack navigator will render the appropriate screen based on the URL.
  // The useEffect above will handle redirecting to the correct URL.
  // All screens have the header hidden by default.
  return (
    <Stack  screenOptions={{ headerShown: false, contentStyle: { paddingTop:10 } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="event/[id]" />
      <Stack.Screen name="gallery/[id]" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider  value={DarkTheme}>
        <AuthProvider>
            <RootLayoutNav />
        </AuthProvider>
    </ThemeProvider>
  );
}
