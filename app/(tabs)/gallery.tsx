
import React, { useState, useMemo, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import SwipeableAlbumCarousel from '@/components/gallery/SwipeableAlbumCarousel';
import AlbumPhotoGrid from '@/components/gallery/AlbumPhotoGrid'; 
import { albums as allAlbums, Album } from '@/data/gallery';

const GalleryScreen: React.FC = () => {
  const router = useRouter();
  const { albumId } = useLocalSearchParams();

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
      {router.canGoBack() && (
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
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
