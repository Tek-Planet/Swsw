
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import AuthScreenContainer from './components/AuthScreenContainer';
import AuthTextInput from './components/AuthTextInput';
import AuthButton from './components/AuthButton';
import SecondaryTextButton from './components/SecondaryTextButton';
import SocialLoginButton from './components/SocialLoginButton';
import CheckboxRow from './components/CheckboxRow';
import { ThemedText } from '@/components/themed-text';

const SignUpScreen = () => {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isOver18, setIsOver18] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignUp = () => {
    setLoading(true);
    setError('');
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      if (name && email && password && agreedToTerms && isOver18) {
        router.replace('/(tabs)/home');
      } else {
        setError('Please fill all fields and agree to the terms');
      }
    }, 2000);
  };

  return (
    <AuthScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>Join the party.</ThemedText>
        </View>

        <View style={styles.socialLoginContainer}>
          <SocialLoginButton icon="logo-apple" text="Continue with Apple" onPress={() => {}} />
          <SocialLoginButton icon="logo-google" text="Continue with Google" onPress={() => {}} />
          <ThemedText style={styles.socialLoginText}>or create an account with email</ThemedText>
        </View>

        <View style={styles.formContainer}>
          <AuthTextInput
            label="Your name"
            placeholder="John Doe"
            value={name}
            onChangeText={setName}
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

          <CheckboxRow
            value={agreedToTerms}
            onValueChange={setAgreedToTerms}
            text="I agree to the [Terms of Use](https://example.com/terms) and [Privacy Policy](https://example.com/privacy)"
            links={{
              'Terms of Use': () => console.log('Navigate to Terms'),
              'Privacy Policy': () => console.log('Navigate to Privacy'),
            }}
          />

          <CheckboxRow
            value={isOver18}
            onValueChange={setIsOver18}
            text="I am at least 18 years old"
          />

          {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}

          <AuthButton
            title="Create Account"
            onPress={handleSignUp}
            disabled={!name || !email || !password || !agreedToTerms || !isOver18}
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
