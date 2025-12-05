
import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { PrimaryButton } from '@/components';
import OnboardingContainer from '@/components/OnboardingContainer';
import { FormTextInput } from '@/components/FormTextInput';
import { useAuth } from '@/lib/context/AuthContext';
import { createOrUpdateUserProfile } from '@/lib/firebase/userProfileService';

const ProfileBasicsScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    if (!user) return;
    if (!fullName || !username) {
      Alert.alert('Hold up!', 'Please fill in your name and username.');
      return;
    }
    setLoading(true);
    try {
      await createOrUpdateUserProfile(user.uid, {
        displayName: fullName,
        username: username,
        bio: bio,
      });
      router.push('/(onboarding)/photo-selfie');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <OnboardingContainer>
      <View style={styles.content}>
        <Text style={styles.title}>The Basics</Text>
        <Text style={styles.subtitle}>Let’s get to know you.</Text>
        <FormTextInput
          label="Full Name"
          placeholder="Your full name"
          value={fullName}
          onChangeText={setFullName}
        />
        <FormTextInput
          label="Username"
          placeholder="Your unique username"
          value={username}
          onChangeText={setUsername}
        />
        <FormTextInput
          label="Bio"
          placeholder="Tell us about yourself (optional)"
          value={bio}
          onChangeText={setBio}
          multiline
        />
      </View>
      <View style={styles.actions}>
        <PrimaryButton
          title="Next"
          onPress={handleNext}
          disabled={loading || !fullName || !username}
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

export default ProfileBasicsScreen;
