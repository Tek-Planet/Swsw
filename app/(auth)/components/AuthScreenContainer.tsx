
import React from 'react';
import { View, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { ThemedView } from '@/components/themed-view';

interface AuthScreenContainerProps {
  children: React.ReactNode;
}

const AuthScreenContainer: React.FC<AuthScreenContainerProps> = ({ children }) => {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ThemedView style={styles.container}>
          {children}
        </ThemedView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
});

export default AuthScreenContainer;
