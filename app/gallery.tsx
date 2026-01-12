import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import AlbumPhotoGrid from "@/components/gallery/AlbumPhotoGrid";
import SwipeableEventCarousel from "@/components/gallery/SwipeableEventCarousel";
import {
  ensureDefaultAlbum,
  getEventCoverPhotoUrl,
  getUserAccessibleEvents,
  listenAlbumPhotos,
} from "@/lib/services/galleryService";
import { AccessibleEvent, Photo } from "@/types/gallery";

const GalleryScreen: React.FC = () => {
  const router = useRouter();
  const { eventId: eventIdFromParams } = useLocalSearchParams<{
    eventId?: string;
  }>();
  const auth = getAuth();
  const userId = auth.currentUser?.uid;

  const [events, setEvents] = useState<AccessibleEvent[]>([]);
  const [carouselItems, setCarouselItems] = useState<
    Array<{ id: string; coverUrl: string | null; title?: string }>
  >([]);
  const [focusedEventId, setFocusedEventId] = useState<string | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [isMyPhotosFilterActive, setIsMyPhotosFilterActive] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const initialize = async () => {
      if (!userId) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        if (isMounted) setLoading(true);
        const accessibleEvents = await getUserAccessibleEvents(userId);
        if (!isMounted) return;

        setEvents(accessibleEvents);

        if (accessibleEvents.length > 0) {
          const coverPhotoResults = await Promise.allSettled(
            accessibleEvents.map((event) => getEventCoverPhotoUrl(event.id))
          );
          if (!isMounted) return;

          const items = accessibleEvents.map((event, index) => {
            const result = coverPhotoResults[index];
            return {
              id: event.id,
              title: event.title,
              coverUrl: result.status === "fulfilled" ? result.value : null,
            };
          });
          setCarouselItems(items);

          const initialEventId =
            eventIdFromParams &&
            accessibleEvents.some((e) => e.id === eventIdFromParams)
              ? eventIdFromParams
              : accessibleEvents[0].id;
          setFocusedEventId(initialEventId);
        } else {
          setCarouselItems([]);
          setFocusedEventId(null);
        }
      } catch (error) {
        console.error("Failed to initialize gallery:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initialize();

    return () => {
      isMounted = false;
    };
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
        unsubscribe = listenAlbumPhotos(
          focusedEventId,
          defaultAlbumId,
          (newPhotos: Photo[]) => {
            setPhotos(newPhotos);
            setLoadingPhotos(false);
          }
        );
      } catch (error) {
        console.error(
          `Failed to fetch photos for event ${focusedEventId}:`,
          error
        );
        setLoadingPhotos(false);
      }
    };

    fetchPhotos();

    return () => unsubscribe();
  }, [focusedEventId]);

  const handleFocusChange = useCallback((eventId: string) => {
    setFocusedEventId(eventId);
  }, []);

  const toggleMyPhotosFilter = () => {
    setIsMyPhotosFilterActive((prev) => !prev);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (carouselItems.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          {router.canGoBack() && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.center}>
          <Text style={styles.errorText}>
            No event photos yet. Buy a ticket to unlock photos.
          </Text>
        </View>
      </View>
    );
  }

  const displayedPhotos = isMyPhotosFilterActive
    ? photos.filter((photo) => photo.recognizedUserIds?.includes(userId ?? ""))
    : photos;

  const initialIndex = focusedEventId
    ? carouselItems.findIndex((item) => item.id === focusedEventId)
    : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {router.canGoBack() && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.filterButton}
          onPress={toggleMyPhotosFilter}
        >
          <Ionicons
            name={isMyPhotosFilterActive ? "person" : "person-outline"}
            size={24}
            color="white"
          />
        </TouchableOpacity>
      </View>
      <SwipeableEventCarousel
        items={carouselItems}
        onFocusChange={handleFocusChange}
        initialIndex={initialIndex >= 0 ? initialIndex : 0}
      />
      {loadingPhotos ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      ) : (
        <AlbumPhotoGrid key={focusedEventId} photos={displayedPhotos} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingTop: 30,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 15,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  backButton: {
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    padding: 8,
  },
  filterButton: {
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    padding: 8,
  },
  errorText: {
    color: "#A8A8A8",
    fontSize: 16,
  },
});

export default GalleryScreen;
