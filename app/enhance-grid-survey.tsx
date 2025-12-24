
import { useLocalSearchParams, useRouter, Redirect } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase/firebaseConfig';
import { ThemedView } from '../components/themed-view';
import { SurveyQuestion } from '../types/event';

/**
 * This screen acts as a loading gateway for the event-specific survey.
 * It fetches the necessary survey questions from Firestore before redirecting
 * the user to the actual survey introduction screen.
 */
export default function EnhanceGridSurveyLoaderScreen() {
  const router = useRouter();
  const { eventId } = useLocalSearchParams<{ eventId: string }>();

  const [questions, setQuestions] = useState<SurveyQuestion[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!eventId) {
      setError('No Event ID provided.');
      setLoading(false);
      return;
    }

    const fetchSurveyQuestions = async () => {
      try {
        const questionsRef = collection(db, 'events', eventId, 'survey');
        const snapshot = await getDocs(questionsRef);
        
        if (snapshot.empty) {
          setError('No survey has been set up for this event.');
          setLoading(false);
          return;
        }

        const fetchedQuestions: SurveyQuestion[] = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as SurveyQuestion))
          .sort((a, b) => a.order - b.order); // Ensure questions are ordered correctly

        setQuestions(fetchedQuestions);
      } catch (err) {
        console.error("Failed to fetch survey questions:", err);
        setError('There was an error loading the survey. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchSurveyQuestions();
  }, [eventId]);

  // When data is loaded, redirect to the survey start screen.
  // We pass the eventId to the next screen, which will then handle the survey flow.
  if (!loading && questions && questions.length > 0 && eventId) {
    return <Redirect href={{ pathname: '/survey', params: { eventId } }} />;
  }

  // Render a loading or error state while fetching.
  return (
    <ThemedView style={styles.container}>
      {loading ? (
        <>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.statusText}>Loading Grid Survey...</Text>
        </>
      ) : error ? (
        <Text style={styles.statusText}>{error}</Text>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  statusText: {
    color: '#aaa',
    fontSize: 16,
    marginTop: 15,
  },
});
