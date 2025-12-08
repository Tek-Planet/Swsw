
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from './firebaseConfig';

const uploadImageAndGetDownloadURL = async (imageUri: string, userId: string): Promise<string | null> => {
  try {
    console.log(`[uploadImageAndGetDownloadURL] Starting upload for user: ${userId}`);
    
    // 1. Fetch the image data from the local URI
    console.log('[uploadImageAndGetDownloadURL] Fetching image from URI:', imageUri);
    const response = await fetch(imageUri);
    if (!response.ok) {
      throw new Error('Failed to fetch image: ' + response.statusText);
    }
    
    // 2. Convert the image data to a blob
    const blob = await response.blob();
    console.log('[uploadImageAndGetDownloadURL] Image converted to blob.');

    // 3. Create a unique reference in Firebase Storage
    const storageRef = ref(storage, `images/${userId}/${Date.now()}`);
    console.log('[uploadImageAndGetDownloadURL] Created storage reference.', storageRef);

    // 4. Upload the blob to the reference
    console.log('[uploadImageAndGetDownloadURL] Uploading blob to Firebase Storage...');
    const uploadResult = await uploadBytes(storageRef, blob);
    console.log('[uploadImageAndGetDownloadURL] Upload successful.', uploadResult);

    // 5. Get the public download URL
    const downloadURL = await getDownloadURL(storageRef);
    console.log('[uploadImageAndGetDownloadURL] Obtained download URL:', downloadURL);
    
    return downloadURL;
  } catch (error) {
    console.error('some error:', error);
    
    // Returning null signals that the upload failed.
    return null;
  }
};

export { uploadImageAndGetDownloadURL };
