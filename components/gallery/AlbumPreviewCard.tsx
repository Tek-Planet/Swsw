import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { Album } from '@/data/gallery';

interface AlbumPreviewCardProps {
  album: Album;
}

const AlbumPreviewCard: React.FC<AlbumPreviewCardProps> = ({ album }) => {

  return (
    <Link href={{ pathname: '/gallery', params: { albumId: album.id } }} asChild>
      <TouchableOpacity>
        <View style={styles.card}>
          <Image source={{ uri: album.thumbnail }} style={styles.thumbnail} />
          <View style={styles.textContainer}>
            <Text style={styles.title}>{album.title}</Text>
            <Text style={styles.subtitle}>{`${album.photos.length} photos · ${album.chats} chats`}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Link>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
  textContainer: {
    marginLeft: 15,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 5,
  },
});

export default AlbumPreviewCard;
