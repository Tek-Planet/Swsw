
import React from 'react';
import { Image, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';

interface PhotoTileProps {
  photoUrl: string;
}

const PhotoTile: React.FC<PhotoTileProps> = ({ photoUrl }) => {

  return (
    <TouchableOpacity onPress={() => router.push({ pathname: '/photo-viewer', params: { photoUrl }})}>
      <Image source={{ uri: photoUrl }} style={styles.photo} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  photo: {
    width: 100,
    height: 100,
    margin: 5,
  },
});

export default PhotoTile;
