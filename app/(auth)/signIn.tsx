
import { ThemedText } from '@/components/themed-text';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import AuthButton from './components/AuthButton';
import AuthScreenContainer from './components/AuthScreenContainer';
import AuthTextInput from './components/AuthTextInput';
import SecondaryTextButton from './components/SecondaryTextButton';
import SocialLoginButton from './components/SocialLoginButton';
import { useAuth } from '@/lib/context/AuthContext';

const SignInScreen = () => {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      await signIn(email, password);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreenContainer>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>It's time to dance.</ThemedText>
      </View>

      <View style={styles.formContainer}>
        <AuthTextInput
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoComplete="email"
          autoCapitalize="none"
          error={error}
        />
        <AuthTextInput
          label="Password"
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          error={error}
        />
        <View style={{alignItems: 'flex-end'}}>
          <SecondaryTextButton text="Forgot password?" onPress={() => {}} />
        </View>

        <AuthButton
          title="Sign In"
          onPress={handleSignIn}
          disabled={!email || !password}
          loading={loading}
        />
      </View>

      <View style={styles.socialLoginContainer}>
        <ThemedText style={styles.socialLoginText}>or continue with</ThemedText>
        <SocialLoginButton icon="logo-apple" text="Continue with Apple" onPress={() => {}} />
        <SocialLoginButton icon="logo-google" text="Continue with Google" onPress={() => {}} />
      </View>

      <SecondaryTextButton
        text="New here?"
        highlight="Create an account"
        onPress={() => router.push('/(auth)/signUp')}
      />
    </AuthScreenContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop:10
  },
  title: {
    color: '#fff',
    textAlign: 'center',
  },
  formContainer: {
    marginBottom: 40,
  },
  socialLoginContainer: {
    marginBottom: 20,
  },
  socialLoginText: {
    textAlign: 'center',
    color: '#888',
    marginBottom: 20,
  },
});

export default SignInScreen;
