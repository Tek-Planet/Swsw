
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TextInputField, ChipSelector, PrimaryButton, SecondaryButton } from '@/components';
import { HelperText } from '@/components/Validation';
import SectionCard from '@/components/SectionCard';

const interestsOptions = ['Reading', 'Gaming', 'Traveling', 'Cooking', 'Sports', 'Music'];

const ProfileDetails = () => {
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState<string[]>([]);

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
      <PrimaryButton title="Save Details" onPress={() => {}} />
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
