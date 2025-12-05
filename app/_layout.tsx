import { Stack } from 'expo-router';
import { ThemeProvider } from '@react-navigation/native';
import { DarkTheme } from '@react-navigation/native';

export default function RootLayout() {
  return (
    <ThemeProvider value={DarkTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="group/[id]" />
        <Stack.Screen name="event/[id]" />
        <Stack.Screen name="event/create" />
        <Stack.Screen name="enhance-grid-survey" />
        <Stack.Screen name="SurveyQuestionScreen" />
        <Stack.Screen name="SurveyResultsScreen" />
        <Stack.Screen name="photo-viewer" />
      </Stack>
    </ThemeProvider>
  );
}
