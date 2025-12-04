import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import PhotoTile from './PhotoTile';

interface AlbumPhotosSectionProps {
  photos: string[];
}

const AlbumPhotosSection: React.FC<AlbumPhotosSectionProps> = ({ photos }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Photos</Text>
      <View style={styles.grid}>
        {photos.map((photoUrl, index) => (
          <PhotoTile key={index} photoUrl={photoUrl} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});

export default AlbumPhotosSection;
