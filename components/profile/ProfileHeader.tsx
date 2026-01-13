
import { AppUser, UserProfile } from '@/types';
import React from 'react';
import { Image, StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadProfilePictureAndGetS3Key } from '@/lib/firebase/storageService';
import { updateUserProfile } from '@/lib/firebase/userProfileService';
import { FontAwesome } from '@expo/vector-icons';

interface ProfileHeaderProps {
  userProfile: UserProfile;
  user: AppUser;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ userProfile, user }) => {

  const handleImagePick = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Denied', 'You need to grant permission to access your photos.');
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    });

    if (pickerResult.canceled) {
        return;
      }

      const imageUri = pickerResult.assets?.[0]?.uri;
      if (!imageUri) {
        Alert.alert('Error', 'Could not get the selected image.');
        return;
      }

    try {
      const s3Key = await uploadProfilePictureAndGetS3Key(imageUri, user.uid);
      if (s3Key) {
        await updateUserProfile(user.uid, { photoUrl: s3Key });
        Alert.alert('Success', 'Your profile picture has been updated.');
      } else {
        Alert.alert('Error', 'Could not upload your profile picture.');
      }
    } catch (error) {
      console.error('Error updating profile picture:', error);
      Alert.alert('Error', 'An error occurred while updating your profile picture.');
    }
  };

  return (
    <View style={styles.container}>
        <TouchableOpacity onPress={handleImagePick} style={styles.imageContainer}>
            <Image source={{ uri: userProfile.photoUrl }} style={styles.image} />
            <View style={styles.editIconContainer}>
                <FontAwesome name="pencil" size={20} color="#fff" />
            </View>
        </TouchableOpacity>
      <Text style={styles.name}>{userProfile.displayName}</Text>
      <Text style={styles.email}>{userProfile.email}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: 20,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#333',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
    borderRadius: 15,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 10,
  },
  email: {
    color: '#fff',
    marginTop: 10,
  },
});

export default ProfileHeader;
