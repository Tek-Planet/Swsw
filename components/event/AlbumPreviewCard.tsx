
import { Event } from '@/types/event';
import { Album } from '@/types/gallery';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface AlbumPreviewCardProps {
  event: Event;
  album: Album;
}

export const AlbumPreviewCard = ({ event, album }: AlbumPreviewCardProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{event.title}</Text>
      <Text style={styles.subtitle}>{album.title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: '#222',
    borderRadius: 8,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#aaa',
    fontSize: 14,
  },
});
