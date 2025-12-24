
import { ChipSelector, PrimaryButton, TextInputField } from '@/components';
import SectionCard from '@/components/SectionCard';
import { HelperText } from '@/components/Validation';
import { useAuth } from '@/lib/context/AuthContext';
import { updateUserProfile } from '@/lib/firebase/userProfileService';
import { UserProfile } from '@/types';
import React, { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

const baseInterests = ['Fashion', 'Technology', 'Outdoors'];

interface ProfileDetailsProps {
  userProfile: UserProfile;
}

const ProfileDetails: React.FC<ProfileDetailsProps> = ({ userProfile }) => {
  const { user } = useAuth();
  const [bio, setBio] = useState(userProfile.bio || '');
  const [interests, setInterests] = useState<string[]>(userProfile.interests || []);
  const [loading, setLoading] = useState(false);

  const interestsOptions = useMemo(() => {
    const userSpecificInterests = userProfile.interests?.filter(interest => !baseInterests.includes(interest)) || [];
    return [...baseInterests, ...userSpecificInterests];
  }, [userProfile.interests]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await updateUserProfile(user.uid, { bio, interests });
      Alert.alert('Profile Updated', 'Your details have been saved successfully.');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not update your profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionCard>
      <Text style={styles.title}>My Details</Text>
      <View style={styles.formContainer}>
        <Text style={styles.label}>About Me</Text>
        <TextInputField
          placeholder="Tell us a little about yourself"
          value={bio}
          onChangeText={setBio}
          multiline
          numberOfLines={4} // Set the desired number of lines
          style={styles.bioInput} // Apply custom styles for height
        />
        <HelperText message="This is a great way for others to get to know you." />

        <Text style={styles.label}>My Interests</Text>
        <ChipSelector
          options={interestsOptions}
          selectedOptions={interests}
          onSelectionChange={setInterests}
        />
        <HelperText message="Select the topics that you are passionate about." />

        <View style={styles.saveButtonContainer}>
          <PrimaryButton title="Save Details" onPress={handleSave} disabled={loading} />
        </View>
      </View>
    </SectionCard>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  formContainer: {
    paddingHorizontal: 5,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 15,
    marginBottom: 10,
  },
  bioInput: {
    height: 120, // Give the multiline input a larger height
    textAlignVertical: 'top', // Start text from the top
  },
  saveButtonContainer: {
    marginTop: 20,
  },
});

export default ProfileDetails;
