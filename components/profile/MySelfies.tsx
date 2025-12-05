
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SelfieCard, UploadSelfieButton } from '@/components';
import SectionCard from '@/components/SectionCard';

const MySelfies = () => {
  const selfies = [
    { id: '1', imageUrl: 'https://randomuser.me/api/portraits/men/2.jpg', uploadDate: '2 days ago' },
    { id: '2', imageUrl: 'https://randomuser.me/api/portraits/men/3.jpg', uploadDate: '1 week ago' },
    { id: '3', imageUrl: 'https://randomuser.me/api/portraits/men/4.jpg', uploadDate: '3 weeks ago' },
  ];

  return (
    <SectionCard>
        <Text style={styles.title}>My Selfies</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {selfies.map(selfie => (
          <SelfieCard
            key={selfie.id}
            imageUrl={selfie.imageUrl}
            uploadDate={selfie.uploadDate}
            onDelete={() => {}}
            onReplace={() => {}}
          />
        ))}
      </ScrollView>
      <UploadSelfieButton onPress={() => {}} />
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
});

export default MySelfies;
