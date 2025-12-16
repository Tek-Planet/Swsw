
import React from 'react';
import { View, Text, Image, StyleSheet, Animated } from 'react-native';
import { Album } from '@/types/gallery';

interface AlbumHeroCardProps {
  album: Album;
  scale: Animated.AnimatedInterpolation<number>;
}

const AlbumHeroCard: React.FC<AlbumHeroCardProps> = ({ album, scale }) => {
  return (
    <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
      <Image source={{ uri: album.coverPhotoUrl }} style={styles.image} />
      <View style={styles.overlay} />
      <View style={styles.textContainer}>
        <Text style={styles.title}>{album.title}</Text>
        {album.photoCount !== undefined && (
          <Text style={styles.metrics}>{`${album.photoCount} photos`}</Text>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 300,
    height: 200,
    borderRadius: 20,
    overflow: 'hidden',
    marginHorizontal: 10,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  textContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  metrics: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
  },
});

export default AlbumHeroCard;
