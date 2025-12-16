
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import SwipeableAlbumCarousel from '@/components/gallery/SwipeableAlbumCarousel';
import AlbumPhotoGrid from '@/components/gallery/AlbumPhotoGrid';
import { Album, Photo } from '@/types/gallery';
import { listenEventAlbums, listenAlbumPhotos } from '@/lib/services/galleryService';

const GalleryScreen: React.FC = () => {
  const router = useRouter();
  const { eventId, albumId } = useLocalSearchParams<{ eventId: string, albumId?: string }>();

  const [albums, setAlbums] = useState<Album[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [currentAlbum, setCurrentAlbum] = useState<Album | null>(null);
  const [loadingAlbums, setLoadingAlbums] = useState(true);
  const [loadingPhotos, setLoadingPhotos] = useState(true);

  useEffect(() => {
    if (!eventId) return;

    const unsubscribe = listenEventAlbums(eventId, (fetchedAlbums) => {
      setAlbums(fetchedAlbums);
      if (fetchedAlbums.length > 0) {
        const initialAlbum = albumId ? fetchedAlbums.find(a => a.id === albumId) || fetchedAlbums[0] : fetchedAlbums[0];
        setCurrentAlbum(initialAlbum);
      }
      setLoadingAlbums(false);
    });

    return () => unsubscribe();
  }, [eventId, albumId]);

  useEffect(() => {
    if (!eventId || !currentAlbum) return;

    setLoadingPhotos(true);
    const unsubscribe = listenAlbumPhotos(eventId, currentAlbum.id, (fetchedPhotos) => {
      setPhotos(fetchedPhotos);
      setLoadingPhotos(false);
    });

    return () => unsubscribe();
  }, [eventId, currentAlbum]);

  const initialAlbumIndex = useMemo(() => {
    if (!albumId || albums.length === 0) return 0;
    const index = albums.findIndex(album => album.id === albumId);
    return index !== -1 ? index : 0;
  }, [albumId, albums]);

  const handleAlbumChange = useCallback((album: Album) => {
    setCurrentAlbum(album);
  }, []);

  if (loadingAlbums) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#fff" /></View>;
  }

  if (!eventId) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Event ID is missing.</Text>
      </View>
    );
  }

  if (albums.length === 0) {
    return (
      <View style={styles.container}>
        {router.canGoBack() && (
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
        )}
        <View style={styles.center}>
          <Text style={styles.errorText}>No albums found for this event.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {router.canGoBack() && (
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
      )}
      <SwipeableAlbumCarousel 
        albums={albums} 
        onAlbumChange={handleAlbumChange} 
        initialAlbumIndex={initialAlbumIndex}
      />
      {loadingPhotos ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#fff" /></View>
      ) : (
        <AlbumPhotoGrid key={currentAlbum?.id} photos={photos} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  errorText: {
    color: '#A8A8A8',
    fontSize: 16,
  },
});

export default GalleryScreen;
