
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { getEventPhotoPreview } from '@/lib/services/galleryService';
import { Photo } from '@/types/gallery';

interface Props {
  eventId: string;
}

const PhotoAlbum: React.FC<Props> = ({ eventId }) => {
  const router = useRouter();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        const { previewPhotos } = await getEventPhotoPreview(eventId, 6);
        setPhotos(previewPhotos);
      } catch (error) {
        console.error("Failed to fetch photo preview:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();
  }, [eventId]);

  const handleViewMore = () => {
    router.push({ pathname: '/gallery', params: { eventId } });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (photos.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Photo Album</Text>
        <Text style={styles.emptyText}>No photos yet.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Photo Album</Text>
      <FlatList
        data={photos}
        keyExtractor={(item) => item.id}
        numColumns={3}
        renderItem={({ item }) => (
          <Image source={{ uri: item.thumbUrl || item.url }} style={styles.thumbnail} />
        )}
        contentContainerStyle={styles.grid}
      />
      <TouchableOpacity onPress={handleViewMore}>
        <Text style={styles.viewMore}>View more</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  grid: {
    justifyContent: 'center',
  },
  thumbnail: {
    width: 100,
    height: 100,
    borderRadius: 10,
    margin: 4,
  },
  viewMore: {
    color: '#A855F7',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyText: {
    color: '#A8A8A8',
    textAlign: 'center',
    fontSize: 16,
  },
});

export default PhotoAlbum;
