
import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { PrimaryButton } from '@/components';
import OnboardingContainer from '@/components/OnboardingContainer';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/lib/context/AuthContext';
import { uploadImageAndGetDownloadURL } from '@/lib/firebase/storageService';
import { createOrUpdateUserProfile } from '@/lib/firebase/userProfileService';

const PhotoSelfieScreen = () => {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleContinue = async () => {
    if (image && user) {
      setLoading(true);
      const photoURL = await uploadImageAndGetDownloadURL(image, user.uid);
      setLoading(false);

      if (photoURL) {
        await createOrUpdateUserProfile(user.uid, { photoUrl: photoURL });
        router.push('/(onboarding)/interests');
      } else {
        Alert.alert(
          'Upload Failed',
          'Sorry, we couldn\'t upload your photo. Please check your connection and try again.'
        );
      }
    }
  };

  return (
    <OnboardingContainer>
      <View style={styles.content}>
        <Text style={styles.title}>Add a Photo</Text>
        <Text style={styles.subtitle}>Let’s see that beautiful smile!</Text>
        <TouchableOpacity onPress={pickImage}>
          {image ? (
            <Image source={{ uri: image }} style={styles.image} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderText}>Select a Photo</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      <View style={styles.actions}>
        <PrimaryButton
          title="Continue"
          onPress={handleContinue}
          disabled={!image || loading}
          loading={loading} 
        />
      </View>
    </OnboardingContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#A9A9A9',
    textAlign: 'center',
    marginBottom: 40,
  },
  actions: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#333',
  },
  imagePlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    color: '#fff',
    fontSize: 18,
  },
});

export default PhotoSelfieScreen;
