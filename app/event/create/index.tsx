
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import TextInput from '@/components/TextInput';
import DropdownSelect from '@/components/DropdownSelect';
import ToggleButtons from '@/components/ToggleButtons';
import { useRouter } from 'expo-router';
import { PrimaryButton } from '@/components/Button';

const Step1: React.FC = () => {
    const router = useRouter();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Basic Info</Text>
      <TextInput label="Event Title" />
      <TextInput label="Subtitle" />
      <DropdownSelect label="Event Category" options={['Music', 'Art', 'Food', 'Sports']} />
      <ToggleButtons label="Event Type" options={['Public', 'Private', 'Buds group']} />
        <PrimaryButton title="Next" onPress={() => router.push('/event/create/step2')} />
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
});

export default Step1;
