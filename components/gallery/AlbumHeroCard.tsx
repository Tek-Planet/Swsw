import React from 'react';
import { View, Text, StyleSheet, ImageBackground } from 'react-native';
import { Album } from '../../data/gallery';

interface AlbumHeroCardProps {
  album: Album;
}

const AlbumHeroCard: React.FC<AlbumHeroCardProps> = ({ album }) => {
  return (
    <ImageBackground source={{ uri: album.coverPhoto }} style={styles.heroCard}>
      <View style={styles.overlay} />
      <Text style={styles.title}>{album.title}</Text>
      <Text style={styles.description}>{album.description}</Text>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  heroCard: {
    height: 250,
    justifyContent: 'flex-end',
    padding: 20,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  description: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
  },
});

export default AlbumHeroCard;
