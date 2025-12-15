import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

const PurchaseConfirmationScreen = () => {
  const { sessionId } = useLocalSearchParams();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>You\'re in! 🎉</Text>
      <Text style={styles.subtitle}>Your ticket purchase was successful.</Text>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryText}>Session ID: {sessionId || 'N/A'}</Text>
        {/* You can add more ticket summary details here */}
      </View>
      <Text style={styles.emailText}>A confirmation email has been sent to your address.</Text>
      <TouchableOpacity style={styles.ctaButton} onPress={() => router.push('/(tabs)/events')}>
        <Text style={styles.ctaButtonText}>View ticket details</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
    padding: 20,
  },
  title: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    color: '#aaa',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
  },
  summaryCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 20,
    width: '100%',
    marginBottom: 30,
  },
  summaryText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 10,
  },
  emailText: {
    color: '#aaa',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 30,
  },
  ctaButton: {
    backgroundColor: '#4a90e2',
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 30,
  },
  ctaButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default PurchaseConfirmationScreen;
