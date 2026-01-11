import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  FlatList,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { getAuth } from "firebase/auth";
import { serverTimestamp, Unsubscribe } from "firebase/firestore";

import {
  listenAlbumPhotos,
  ensureDefaultAlbum,
  createPhotoDoc,
} from "@/lib/services/galleryService";
import { uploadEventPhotoAndGetS3Key } from "@/lib/firebase/storageService";
import { Photo } from "@/types/gallery";

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

  useEffect(() => {
    let unsubscribe: Unsubscribe | undefined;
    let isMounted = true;

    const setupListener = async () => {
      try {
        setLoading(true);
        const albumId = await ensureDefaultAlbum(eventId);

        if (isMounted) {
          unsubscribe = listenAlbumPhotos(eventId, albumId, (newPhotos) => {
            setPhotos(newPhotos.slice(0, 6));
            if (loading) setLoading(false);
          });
        }
      } catch (error) {
        console.error("Failed to set up photo listener:", error);
        if (isMounted) setLoading(false);
      }
    };

    setupListener();

    return () => {
      isMounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [eventId]);

  const handleImageUpload = async (result: ImagePicker.ImagePickerResult) => {
    if (!userId) {
      Alert.alert(
        "Authentication required",
        "You must be logged in to upload photos."
      );
      return;
    }

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return;
    }

    setUploading(true);
    const uri = result.assets[0].uri;

    try {
      const s3Key = await uploadEventPhotoAndGetS3Key(uri, eventId);

      if (!s3Key) {
        throw new Error("Image upload failed, S3 key is null.");
      }

      const albumId = await ensureDefaultAlbum(eventId);

      const photoData: Partial<Photo> = {
        s3Key: s3Key,
        uploadedBy: "user",
        uploaderId: userId,
        createdAt: serverTimestamp(),
        recognizedUserIds: [],
      };

      await createPhotoDoc(eventId, albumId, photoData);
    } catch (error) {
      console.error("Upload failed:", error);
      Alert.alert(
        "Upload Failed",
        "Could not upload your photo. Please try again."
      );
    } finally {
      setUploading(false);
    }
  };

  const handlePickFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission required",
        "Sorry, we need camera permissions to make this work!"
      );
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
    if (status !== "granted") {
      Alert.alert(
        "Permission required",
        "Sorry, we need camera roll permissions to make this work!"
      );
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
    router.push({ pathname: "/gallery", params: { eventId } });
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Photo Album</Text>
        <View style={styles.iconsContainer}>
          <TouchableOpacity onPress={handlePickFromCamera} disabled={uploading}>
            <Ionicons name="camera-outline" size={28} color="#A855F7" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handlePickFromLibrary}
            disabled={uploading}
            style={{ marginLeft: 16 }}
          >
            <Ionicons name="images-outline" size={28} color="#A855F7" />
          </TouchableOpacity>
        </View>
      </View>

      {uploading && (
        <View style={styles.uploadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.uploadingText}>Uploading...</Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator color="#fff" style={{ height: 100 }} />
      ) : photos.length === 0 ? (
        <Text style={styles.emptyText}>
          No photos yet. Be the first to share!
        </Text>
      ) : (
        <>
          <FlatList
            data={photos}
            keyExtractor={(item) => item.id}
            numColumns={3}
            renderItem={({ item }) => (
              <View style={styles.photoContainer}>
                <Image
                  source={{ uri: item.thumbUrl || item.url }}
                  style={styles.thumbnail}
                />
                {item.recognizedUserIds &&
                  item.recognizedUserIds.includes(userId ?? "") && (
                    <View style={styles.tagOverlay}>
                      <Text style={styles.tagText}>innit</Text>
                    </View>
                  )}
              </View>
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
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    position: "relative",
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  iconsContainer: {
    flexDirection: "row",
  },
  grid: {
    justifyContent: "center",
  },
  photoContainer: {
    width: 100,
    height: 100,
    borderRadius: 10,
    margin: 4,
    position: "relative",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  tagOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    paddingVertical: 3,
  },
  tagText: {
    color: "white",
    textAlign: "center",
    fontSize: 12,
    fontWeight: "bold",
  },
  viewMore: {
    color: "#A855F7",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 16,
  },
  emptyText: {
    color: "#A8A8A8",
    textAlign: "center",
    fontSize: 16,
    paddingVertical: 20,
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    zIndex: 1,
  },
  uploadingText: {
    color: "white",
    marginTop: 10,
    fontSize: 16,
  },
});

export default PhotoAlbum;
