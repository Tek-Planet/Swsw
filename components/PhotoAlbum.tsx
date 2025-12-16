
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  FlatList,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { getAuth } from 'firebase/auth';
import { serverTimestamp } from 'firebase/firestore';

import { getEventPhotoPreview, ensureDefaultAlbum, createPhotoDoc } from '@/lib/services/galleryService';
import { uploadImageAndGetDownloadURL } from '@/lib/firebase/storageService';
import { Photo } from '@/types/gallery';

interface Props {
  eventId: string;
}

const PhotoAlbum: React.FC<Props> = ({ eventId }) => {
  const router = useRouter();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const auth = getAuth();
  const userId = auth.currentUser?.uid;

  const fetchPreview = async () => {
    try {
      setLoading(true);
      const { previewPhotos } = await getEventPhotoPreview(eventId, 6);
      setPhotos(previewPhotos);
    } catch (error) {
      console.error('Failed to fetch photo preview:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreview();
  }, [eventId]);

  const handleImageUpload = async (result: ImagePicker.ImagePickerResult) => {
    if (!userId) {
      Alert.alert('Authentication required', 'You must be logged in to upload photos.');
      return;
    }

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return; // User cancelled the action
    }

    setUploading(true);
    const uri = result.assets[0].uri;

    try {
      const albumId = await ensureDefaultAlbum(eventId);
      const photoId = `${Date.now()}`;
      const storagePath = `events/${eventId}/albums/${albumId}/photos/${photoId}.jpg`;

      const downloadURL = await uploadImageAndGetDownloadURL(uri, storagePath);

      if (!downloadURL) {
        throw new Error('Image upload failed, download URL is null.');
      }

      const photoData: Omit<Photo, 'id'> = {
        url: downloadURL,
        thumbUrl: downloadURL, // For simplicity, using the same URL for thumbnail
        uploadedBy: 'user',
        uploaderId: userId,
        createdAt: serverTimestamp(),
        taggedUserIds: [],
      };

      await createPhotoDoc(eventId, albumId, photoData);
      await fetchPreview(); // Refresh the preview list
    } catch (error) {
      console.error('Upload failed:', error);
      Alert.alert('Upload Failed', 'Could not upload your photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handlePickFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Sorry, we need camera permissions to make this work!');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.7,
    });
    await handleImageUpload(result);
  };

  const handlePickFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.7,
    });
    await handleImageUpload(result);
  };

  const handleViewMore = () => {
    router.push({ pathname: '/(tabs)/gallery', params: { eventId } });
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.title}>Photo Album</Text>
      <View style={styles.iconsContainer}>
        <TouchableOpacity onPress={handlePickFromCamera} disabled={uploading}>
          <Ionicons name="camera-outline" size={28} color="#A855F7" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handlePickFromLibrary} disabled={uploading} style={{ marginLeft: 16 }}>
          <Ionicons name="images-outline" size={28} color="#A855F7" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      {uploading && (
        <View style={styles.uploadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.uploadingText}>Uploading...</Text>
        </View>
      )}
      {photos.length === 0 ? (
        <Text style={styles.emptyText}>No photos yet. Be the first to share!</Text>
      ) : (
        <>
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
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    position: 'relative',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  iconsContainer: {
    flexDirection: 'row',
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
    paddingVertical: 20,
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    zIndex: 1,
  },
  uploadingText: {
    color: 'white',
    marginTop: 10,
    fontSize: 16,
  },
});

export default PhotoAlbum;
