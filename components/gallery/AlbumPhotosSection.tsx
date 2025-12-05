import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import PhotoTile from './PhotoTile';
import { Photo } from '@/data/gallery';

interface AlbumPhotosSectionProps {
  photos: Photo[];
}

const AlbumPhotosSection: React.FC<AlbumPhotosSectionProps> = ({ photos }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Photos</Text>
      <View style={styles.grid}>
        {photos.map((photo, index) => (
          <PhotoTile key={index} photoUrl={photo.url} />
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
