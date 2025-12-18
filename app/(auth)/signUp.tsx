
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/lib/context/AuthContext';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import AuthButton from './components/AuthButton';
import AuthScreenContainer from './components/AuthScreenContainer';
import AuthTextInput from './components/AuthTextInput';
import SecondaryTextButton from './components/SecondaryTextButton';

const SignUpScreen = () => {
  const router = useRouter();
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignUp = async () => {
    setLoading(true);
    setError('');
    try {
      await signUp(email, password, fullName, username);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>Join the party.</ThemedText>
        </View>

        {/* <View style={styles.socialLoginContainer}>
          <SocialLoginButton icon="logo-apple" text="Continue with Apple" onPress={() => {}} />
          <SocialLoginButton icon="logo-google" text="Continue with Google" onPress={() => {}} />
          <ThemedText style={styles.socialLoginText}>or create an account with email</ThemedText>
        </View> */}

        <View style={styles.formContainer}>
          <AuthTextInput
            label="Your name"
            placeholder="John Doe"
            value={fullName}
            onChangeText={setFullName}
          />
          <AuthTextInput
            label="Username"
            placeholder="your_username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
          <AuthTextInput
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoComplete="email"
            autoCapitalize="none"
          />
          <AuthTextInput
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}

          <AuthButton
            title="Create Account"
            onPress={handleSignUp}
            disabled={!fullName || !username || !email || !password}
            loading={loading}
          />
        </View>

        <SecondaryTextButton
          text="Already have an account?"
          highlight="Sign In"
          onPress={() => router.push('/(auth)/signIn')}
        />
      </ScrollView>
    </AuthScreenContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    color: '#fff',
    textAlign: 'center',
  },
  socialLoginContainer: {
    marginBottom: 30,
  },
  socialLoginText: {
    textAlign: 'center',
    color: '#888',
    marginVertical: 20,
  },
  formContainer: {
    marginBottom: 20,
  },
  errorText: {
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 10,
  },
});

export default SignUpScreen;
