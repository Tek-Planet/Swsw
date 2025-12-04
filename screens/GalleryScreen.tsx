
import React, { useState, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

  const initialAlbum = useMemo(() => {
    return albumId ? allAlbums.find(album => album.id === albumId) : allAlbums[0];
  }, [albumId]);

  const [currentAlbum, setCurrentAlbum] = useState<Album | undefined>(initialAlbum);

  const handleAlbumChange = (album: Album) => {
    setCurrentAlbum(album);
  };

  return (
    <View style={styles.container}>
      {navigation.canGoBack() && (
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
      )}
      <SwipeableAlbumCarousel albums={allAlbums} onAlbumChange={handleAlbumChange} />
      {currentAlbum && <AlbumPhotoGrid photos={currentAlbum.photos} />}
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
