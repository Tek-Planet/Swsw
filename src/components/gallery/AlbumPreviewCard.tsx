import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../types';
import { StackNavigationProp } from '@react-navigation/stack';
import { Album } from '../../data/gallery';

interface AlbumPreviewCardProps {
  album: Album;
}

type NavigationProps = StackNavigationProp<RootStackParamList, 'Gallery'>;

const AlbumPreviewCard: React.FC<AlbumPreviewCardProps> = ({ album }) => {
  const navigation = useNavigation<NavigationProps>();

  return (
    <TouchableOpacity onPress={() => navigation.navigate('Gallery', { albumId: album.id })}>
      <View style={styles.card}>
        <Image source={{ uri: album.thumbnail }} style={styles.thumbnail} />
        <View style={styles.textContainer}>
          <Text style={styles.title}>{album.title}</Text>
          <Text style={styles.subtitle}>{`${album.photos.length} photos · ${album.chats} chats`}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 5,
  },
});

export default AlbumPreviewCard;
