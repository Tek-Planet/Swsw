
import React, { useState, useEffect } from 'react';
import { Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase/firebaseConfig';
import { auth } from '../lib/firebase/firebaseConfig';

import SurveyContainer from '../components/survey/SurveyContainer';
import RecommendationList from '../components/recommendations/RecommendationList';
import CTAButton from '../components/recommendations/CTAButton';
import { UserProfile } from '../types/user';

interface Match {
  userId: string;
  compatibilityScore: number;
}

const SurveyResultsScreen: React.FC = () => {
  const router = useRouter();
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const userId = auth.currentUser?.uid;

  const [matches, setMatches] = useState<(UserProfile & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!eventId || !userId) {
      setError("Missing user or event information.");
      setLoading(false);
      return;
    }

    const gridRef = doc(db, `event_grids/${eventId}/grids/${userId}`);

    // Listen for real-time updates on the user's grid.
    const unsubscribe = onSnapshot(gridRef, async (snapshot) => {
      if (!snapshot.exists()) {
        // The grid document might not be created instantly. 
        // We can keep loading or assume no matches yet.
        setLoading(true); // Keep loading until the doc is created
        return;
      }

      const gridData = snapshot.data();
      const matchIds = gridData.matches.map((m: Match) => m.userId);

      if (matchIds.length === 0) {
        setMatches([]);
        setLoading(false);
        return;
      }

      // Fetch the full profiles of the matched users.
      try {
        const userDocs = await Promise.all(
          matchIds.map((id: string) => getDoc(doc(db, 'users', id)))
        );
        
        const fetchedProfiles = userDocs
          .filter(docSnap => docSnap.exists())
          .map(docSnap => ({ ...(docSnap.data() as UserProfile), id: docSnap.id }));
          
        setMatches(fetchedProfiles);
      } catch (err) {
        console.error("Error fetching matched profiles:", err);
        setError("Could not load your matches. Please try again.");
      } finally {
        setLoading(false);
      }
    }, (err) => {
        console.error("Snapshot listener error:", err);
        setError("There was a network error fetching your results.");
        setLoading(false);
    });

    return () => unsubscribe(); // Cleanup listener on unmount
  }, [eventId, userId]);

  return (
    <SurveyContainer>
      <Text style={styles.title}>Your Event Grid</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#fff" style={{ marginVertical: 40 }}/>
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : matches.length > 0 ? (
        <RecommendationList recommendations={matches.map(p => ({ 
            id: p.id, 
            name: p.displayName, 
            avatar: p.photoUrl || 'https://placekitten.com/200/200', //TODO: Fallback avatar
            descriptor: `Compatibility: ${Math.round(Math.random()*20+80)}%`, // Placeholder score 
        }))} />
      ) : (
        <View style={styles.noMatchesContainer}>
            <Text style={styles.noMatchesText}>No matches found yet!</Text>
            <Text style={styles.noMatchesSubText}>Check back later as more people take the survey.</Text>
        </View>
      )}
      <CTAButton title="Explore More People" onPress={() => router.replace('/(tabs)/buds')} />
    </SurveyContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
  },
  errorText: {
    color: '#d9534f',
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 40,
  },
  noMatchesContainer: {
      alignItems: 'center',
      marginVertical: 40,
      paddingHorizontal: 20,
  },
  noMatchesText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: '600',
  },
  noMatchesSubText: {
      color: '#aaa',
      fontSize: 14,
      textAlign: 'center',
      marginTop: 10,
  }
});

export default SurveyResultsScreen;
