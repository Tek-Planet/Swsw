
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '@/lib/context/AuthContext';
import { listenToMostRecentEvent } from '@/lib/services/eventService';
import { getAlbum } from '@/lib/services/galleryService';
import { Event, PhotoAlbum } from '@/types';
import { AlbumPreviewCard } from '@/components/event/AlbumPreviewCard';

const RecentAlbum = () => {
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [album, setAlbum] = useState<PhotoAlbum | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const unsubscribe = listenToMostRecentEvent(user.uid, async (mostRecentEvent) => {
        if (mostRecentEvent && mostRecentEvent.defaultPhotoAlbumId) {
          setEvent(mostRecentEvent);
          const fetchedAlbum = await getAlbum(mostRecentEvent.defaultPhotoAlbumId);
          setAlbum(fetchedAlbum);
        }
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, [user]);

  if (loading) {
    return <Text>Loading...</Text>;
  }

  if (!event || !album) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Most Recent Album</Text>
      <AlbumPreviewCard event={event} album={album} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
});

export default RecentAlbum;
