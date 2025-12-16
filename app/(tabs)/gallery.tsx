
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getAuth } from 'firebase/auth';

import SwipeableEventCarousel from '@/components/gallery/SwipeableEventCarousel';
import AlbumPhotoGrid from '@/components/gallery/AlbumPhotoGrid';
import { Photo } from '@/types/gallery';
import {
  listenAlbumPhotos,
  getUserAccessibleEventIds,
  getEventCoverPhotoUrl,
  ensureDefaultAlbum,
} from '@/lib/services/galleryService';

const GalleryScreen: React.FC = () => {
  const router = useRouter();
  const { eventId: eventIdFromParams } = useLocalSearchParams<{ eventId?: string }>();
  const auth = getAuth();
  const userId = auth.currentUser?.uid;

  const [accessibleEventIds, setAccessibleEventIds] = useState<string[]>([]);
  const [carouselItems, setCarouselItems] = useState<Array<{ id: string; coverUrl: string | null; title?: string }>>([]);
  const [focusedEventId, setFocusedEventId] = useState<string | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPhotos, setLoadingPhotos] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const eventIds = await getUserAccessibleEventIds(userId);
        setAccessibleEventIds(eventIds);

        if (eventIds.length > 0) {
          const coverPhotos = await Promise.all(eventIds.map(id => getEventCoverPhotoUrl(id)));
          const items = eventIds.map((id, index) => ({
            id,
            coverUrl: coverPhotos[index],
            // You can add event titles here if you have a way to fetch them
          }));
          setCarouselItems(items);

          const initialEventId =
            eventIdFromParams && eventIds.includes(eventIdFromParams)
              ? eventIdFromParams
              : eventIds[0];
          setFocusedEventId(initialEventId);
        } else {
          setCarouselItems([]);
          setFocusedEventId(null);
        }
      } catch (error) {
        console.error("Failed to initialize gallery:", error);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [userId, eventIdFromParams]);

  useEffect(() => {
    let unsubscribe: () => void = () => {};

    const fetchPhotos = async () => {
      if (!focusedEventId) {
        setPhotos([]);
        return;
      }

      try {
        setLoadingPhotos(true);
        const defaultAlbumId = await ensureDefaultAlbum(focusedEventId);
        unsubscribe = listenAlbumPhotos(focusedEventId, defaultAlbumId, (newPhotos) => {
          setPhotos(newPhotos);
          setLoadingPhotos(false);
        });
      } catch (error) {
        console.error(`Failed to fetch photos for event ${focusedEventId}:`, error);
        setLoadingPhotos(false);
      }
    };

    fetchPhotos();

    return () => unsubscribe();
  }, [focusedEventId]);

  const handleFocusChange = useCallback((eventId: string) => {
    setFocusedEventId(eventId);
  }, []);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#fff" /></View>;
  }

  if (carouselItems.length === 0) {
    return (
      <View style={styles.container}>
        {router.canGoBack() && (
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
        )}
        <View style={styles.center}>
          <Text style={styles.errorText}>No event photos yet. Buy a ticket to unlock photos.</Text>
        </View>
      </View>
    );
  }

  const initialIndex = focusedEventId ? carouselItems.findIndex(item => item.id === focusedEventId) : 0;

  return (
    <View style={styles.container}>
      {router.canGoBack() && (
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
      )}
      <SwipeableEventCarousel
        items={carouselItems}
        onFocusChange={handleFocusChange}
        initialIndex={initialIndex >= 0 ? initialIndex : 0}
      />
      {loadingPhotos ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#fff" /></View>
      ) : (
        <AlbumPhotoGrid key={focusedEventId} photos={photos} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: 50,
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
