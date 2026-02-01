
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/lib/context/AuthContext';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import AuthButton from './components/AuthButton';
import AuthScreenContainer from './components/AuthScreenContainer';
import AuthTextInput from './components/AuthTextInput';
import SecondaryTextButton from './components/SecondaryTextButton';
import PasswordResetModal from '@/components/PasswordResetModal';

const SignInScreen = () => {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

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

  const openPasswordResetModal = () => {
    setModalVisible(true);
  };

  return (
    <AuthScreenContainer>
      <PasswordResetModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        email={email}
      />

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
          <SecondaryTextButton text="Forgot password?" onPress={openPasswordResetModal} />
        </View>

        <AuthButton
          title="Sign In"
          onPress={handleSignIn}
          disabled={!email || !password}
          loading={loading}
        />
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
});

export default SignInScreen;
