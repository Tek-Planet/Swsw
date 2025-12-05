
import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { PrimaryButton, ChipSelector, SecondaryButton } from '@/components';
import OnboardingContainer from '@/components/OnboardingContainer';
import { useAuth } from '@/lib/context/AuthContext';
import { createOrUpdateUserProfile } from '@/lib/firebase/userProfileService';

const interestsList = [
  'Music',
  'Sports',
  'Art',
  'Travel',
  'Food',
  'Movies',
  'Gaming',
  'Reading',
  'Fitness',
  'Fashion',
  'Technology',
  'Outdoors',
];

const InterestsScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSelectionChange = (interests: string[]) => {
    setSelectedInterests(interests);
  };

  const handleNext = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await createOrUpdateUserProfile(user.uid, {
        interests: selectedInterests,
      });
      router.push('/(onboarding)/permissions');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not update interests. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <OnboardingContainer>
      <View style={styles.content}>
        <Text style={styles.title}>What are you into?</Text>
        <Text style={styles.subtitle}>
          Select at least 3 interests so we can match you with the right vibes.
        </Text>
        <ChipSelector
          options={interestsList}
          selectedOptions={selectedInterests}
          onSelectionChange={handleSelectionChange}
        />
      </View>
      <View style={styles.actions}>
        <PrimaryButton
          title="Next"
          onPress={handleNext}
          disabled={loading || selectedInterests.length < 3}
        />
        <SecondaryButton
          title="Skip for now"
          onPress={() => router.push('/(onboarding)/permissions')}
        />
      </View>
    </OnboardingContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#A9A9A9',
    marginBottom: 40,
  },
  actions: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
});

export default InterestsScreen;
