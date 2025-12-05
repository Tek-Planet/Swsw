
import { Stack } from 'expo-router';

const OnboardingLayout = () => {
  return (
    <Stack initialRouteName="welcome">
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
      <Stack.Screen name="profile-basics" options={{ headerShown: false }} />
      <Stack.Screen name="photo-selfie" options={{ headerShown: false }} />
      <Stack.Screen name="interests" options={{ headerShown: false }} />
      <Stack.Screen name="permissions" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding-done" options={{ headerShown: false }} />
    </Stack>
  );
};

export default OnboardingLayout;
