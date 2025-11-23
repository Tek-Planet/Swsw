
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MediaUploader from '../../components/MediaUploader';
import TextInput from '../../components/TextInput';

const Step3: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Media + Description</Text>
      <MediaUploader label="Cover Image" />
      <MediaUploader label="Gallery" />
      <TextInput label="Long Description" multiline />
      <TextInput label="Rules / Notes" multiline />
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

export default Step3;
