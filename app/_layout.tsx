import { AuthProvider } from '@/lib/context/AuthContext';
import RootNavigator from './navigation/RootNavigator';
import { ThemeProvider, DarkTheme } from '@react-navigation/native';

export default function RootLayout() {
  return (
    <ThemeProvider value={DarkTheme}>
        <AuthProvider>
            <RootNavigator />
        </AuthProvider>
    </ThemeProvider>

  );
}
