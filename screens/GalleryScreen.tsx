
import React, { useState, useMemo, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import SwipeableAlbumCarousel from '../components/gallery/SwipeableAlbumCarousel';
import AlbumPhotoGrid from '../components/gallery/AlbumPhotoGrid'; 
import { albums as allAlbums, Album } from '../data/gallery';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';

type GalleryScreenRouteProp = RouteProp<RootStackParamList, 'Gallery'>;

const GalleryScreen: React.FC<{ route: GalleryScreenRouteProp }> = ({ route }) => {
  const navigation = useNavigation();
  const { albumId } = route.params || {};

  const { initialAlbum, initialAlbumIndex } = useMemo(() => {
    const albumIndex = albumId ? allAlbums.findIndex(album => album.id === albumId) : 0;
    const album = allAlbums[albumIndex] || allAlbums[0];
    return { initialAlbum: album, initialAlbumIndex: albumIndex };
  }, [albumId]);

  const [currentAlbum, setCurrentAlbum] = useState<Album | undefined>(initialAlbum);

  const handleAlbumChange = useCallback((album: Album) => {
    setCurrentAlbum(album);
  }, []);

  return (
    <View style={styles.container}>
      {navigation.canGoBack() && (
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
      )}
      <SwipeableAlbumCarousel 
        albums={allAlbums} 
        onAlbumChange={handleAlbumChange} 
        initialAlbumIndex={initialAlbumIndex}
      />
      {currentAlbum && <AlbumPhotoGrid key={currentAlbum.id} photos={currentAlbum.photos} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 1,
  },
});

export default GalleryScreen;
