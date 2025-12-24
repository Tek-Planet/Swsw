
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View, TextInput, TouchableOpacity } from 'react-native';

import { ChipSelector, PrimaryButton, SecondaryButton } from '@/components';
import OnboardingContainer from '@/components/OnboardingContainer';
import { useAuth } from '@/lib/context/AuthContext';
import { createOrUpdateUserProfile } from '@/lib/firebase/userProfileService';

// Initial list of interests
const initialInterests = [
  'Music',
  'Art',
  'Photography',
  'Sports',
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
  
  // State for the list of available interest options
  const [interestsOptions, setInterestsOptions] = useState(initialInterests);
  // State for the user's selected interests
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  // State for the text input for custom interests
  const [customInterest, setCustomInterest] = useState('');
  
  const [loading, setLoading] = useState(false);

  const handleSelectionChange = (interests: string[]) => {
    setSelectedInterests(interests);
  };

  const handleAddInterest = () => {
    const newInterest = customInterest.trim();
    // Only add if it's not empty and not already selected
    if (newInterest && !selectedInterests.includes(newInterest)) {
      // Add to the list of selected interests
      setSelectedInterests([...selectedInterests, newInterest]);
      // If it's a brand new interest, add it to the available options
      if (!interestsOptions.includes(newInterest)) {
        setInterestsOptions([...interestsOptions, newInterest]);
      }
      // Clear the input field
      setCustomInterest('');
    }
  };

  const handleNext = async () => {
    if (!user) return;
    if (selectedInterests.length < 3) {
      Alert.alert('Select at least 3 interests', 'Please select at least 3 interests to continue.');
      return;
    }
    setLoading(true);
    try {
      await createOrUpdateUserProfile(user.uid, {
        interests: selectedInterests,
      });
      router.push('/(onboarding)/onboarding-done');
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
          Select some interests or add your own.
        </Text>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type an interest & press Add"
            placeholderTextColor="#A9A9A9"
            value={customInterest}
            onChangeText={setCustomInterest}
            onSubmitEditing={handleAddInterest} // Allows adding via keyboard 'return' key
          />
          <TouchableOpacity style={styles.addButton} onPress={handleAddInterest}>
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>

        <ChipSelector
          options={interestsOptions}
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
          onPress={() => router.push('/(onboarding)/onboarding-done')}
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
    marginBottom: 20, // Reduced margin to make space for input
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#1C1C1E',
    color: '#fff',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    marginRight: 10,
  },
  addButton: {
    backgroundColor: '#343437',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  actions: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
});

export default InterestsScreen;
