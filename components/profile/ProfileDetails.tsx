
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TextInputField, ChipSelector, PrimaryButton } from '@/components';
import { HelperText } from '@/components/Validation';
import SectionCard from '@/components/SectionCard';
import { UserProfile } from '@/types';
import { updateUserProfile } from '@/lib/firebase/userProfileService';
import { useAuth } from '@/lib/context/AuthContext';

const interestsOptions = ['Reading', 'Gaming', 'Traveling', 'Cooking', 'Sports', 'Music'];

interface ProfileDetailsProps {
  userProfile: UserProfile;
}

const ProfileDetails: React.FC<ProfileDetailsProps> = ({ userProfile }) => {
  const { user } = useAuth();
  const [bio, setBio] = useState(userProfile.bio || '');
  const [interests, setInterests] = useState<string[]>(userProfile.interests || []);

  const handleSave = async () => {
    if (user) {
      await updateUserProfile(user.uid, { bio, interests });
    }
  };

  return (
    <SectionCard>
      <Text style={styles.title}>My Details</Text>
      <TextInputField
        placeholder="Bio"
        value={bio}
        onChangeText={setBio}
      />
      <HelperText message="Tell us a little about yourself." />
      <ChipSelector
        options={interestsOptions}
        selectedOptions={interests}
        onSelectionChange={setInterests}
      />
      <View style={styles.buttonContainer}>
        <PrimaryButton title="Save Details" onPress={handleSave} />
      </View>
    </SectionCard>
  );
};

const styles = StyleSheet.create({
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  buttonContainer: {
    marginTop: 20,
  },
});

export default ProfileDetails;
