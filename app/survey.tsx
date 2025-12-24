
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ThemedView } from '../components/themed-view';
import { Ionicons } from '@expo/vector-icons';

/**
 * This screen serves as the landing page for the "Enhance Your Grid" survey.
 * It gives the user a brief introduction and a clear call-to-action to start.
 */
export default function SurveyStartScreen() {
  const router = useRouter();
  const { eventId } = useLocalSearchParams<{ eventId: string }>();

  const handleStartSurvey = () => {
    if (!eventId) {
        // This case should ideally not happen if the loader screen works correctly
        alert('Could not find event information. Please go back and try again.');
        return;
    }
    // Navigate to the first question of the survey, passing the eventId.
    // The question screen will handle the logic of which question to display.
    router.push({ 
        pathname: '/SurveyQuestionScreen', 
        params: { eventId, questionIndex: 0 }
    });
  };

  return (
    <ThemedView style={styles.container}>
        <View style={styles.content}>
            <Ionicons name="sparkles" size={80} color="#6C63FF" />
            <Text style={styles.title}>Enhance Your Grid</Text>
            <Text style={styles.description}>
                Ready to connect? Answer a few quick questions to get matched with three other attendees who share your vibe for this event.
            </Text>
            <TouchableOpacity style={styles.startButton} onPress={handleStartSurvey}>
                <Text style={styles.startButtonText}>Let's Go!</Text>
            </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
            <Ionicons name="close" size={24} color="#aaa" />
        </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 15,
  },
  description: {
    fontSize: 18,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 40,
  },
  startButton: {
    backgroundColor: '#6C63FF',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 30,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
  },
});
