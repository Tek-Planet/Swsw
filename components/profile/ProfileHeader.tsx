import { UserProfile } from "@/types";
import React, { useState } from "react";
import {
  Image,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "@/lib/context/AuthContext";
import { uploadImageAndGetDownloadURL } from "@/lib/firebase/storageService";
import { createOrUpdateUserProfile } from "@/lib/firebase/userProfileService";

interface ProfileHeaderProps {
  userProfile: UserProfile;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ userProfile }) => {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setImage(uri);
      handleImageUpload(uri);
    }
  };

  const handleImageUpload = async (uri: string) => {
    if (uri && user) {
      setLoading(true);
      const downloadURL = await uploadImageAndGetDownloadURL(uri, user.uid);
      setLoading(false);

      if (downloadURL) {
        await createOrUpdateUserProfile(user.uid, { photoUrl: downloadURL });
      } else {
        Alert.alert(
          "Upload Failed",
          "Sorry, we couldn't upload your photo. Please check your connection and try again."
        );
      }
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={pickImage}>
        <Image
          source={{ uri: image || userProfile.photoUrl }}
          style={styles.image}
        />
      </TouchableOpacity>
      <Text style={styles.name}>{userProfile.displayName}</Text>
      <Text style={styles.email}>{userProfile.email}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingTop: 20,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#333",
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 10,
  },
  email: {
    color: "#fff",
    marginTop: 10,
  },
});

export default ProfileHeader;
