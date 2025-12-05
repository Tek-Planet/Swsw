
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MediaUploader from '@/components/MediaUploader';
import TextInput from '@/components/TextInput';
import { useRouter } from 'expo-router';
import { PrimaryButton, SecondaryButton } from '@/components/Button';

const Step3: React.FC = () => {
    const router = useRouter();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Media + Description</Text>
      <MediaUploader label="Cover Image" />
      <MediaUploader label="Gallery" />
      <TextInput label="Long Description" multiline />
      <TextInput label="Rules / Notes" multiline />
        <View style={styles.buttonContainer}>
            <SecondaryButton title="Previous" onPress={() => router.back()} />
            <PrimaryButton title="Next" onPress={() => router.push('/event/create/step4')} />
        </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
});

export default Step3;
