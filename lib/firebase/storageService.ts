
import { getFunctions, httpsCallable } from 'firebase/functions';
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

/**
 * Uploads an image for a user's profile to a secure S3 bucket and returns the S3 key.
 */
const uploadImageAndGetS3Key = async (imageUri: string): Promise<string | null> => {
  return _uploadToS3(imageUri, {});
};

/**
 * [NEW] Uploads an image for a specific event to a secure S3 bucket and returns the S3 key.
 */
const uploadEventPhotoAndGetS3Key = async (imageUri: string, eventId: string): Promise<string | null> => {
  return _uploadToS3(imageUri, { eventId });
};

const uploadProfilePictureAndGetS3Key = async (imageUri: string, userId: string): Promise<string | null> => {
    return _uploadToS3(imageUri, { isProfilePic: true, userId });
  };

/**
 * [PRIVATE] Generic S3 upload handler that calls a backend function for a pre-signed URL.
 */
const _uploadToS3 = async (imageUri: string, payload: { eventId?: string, isProfilePic?: boolean, userId?: string }): Promise<string | null> => {
  console.log(`[_uploadToS3] Starting S3 upload process with payload:`, payload);

  try {
    const functions = getFunctions();
    const generateS3UploadUrl = httpsCallable(functions, 'generateS3UploadUrl');

    const response = await fetch(imageUri);
    if (!response.ok) {
      throw new Error('Failed to fetch image: ' + response.statusText);
    }
    const imageBlob = await response.blob();
    const fileType = imageBlob.type;

    const result: any = await generateS3UploadUrl({
      fileName: imageUri.split('/').pop() || 'unknown-file',
      fileType: fileType,
      ...payload,
    });

    const { uploadUrl, s3Key } = result.data as { uploadUrl: string; s3Key: string };
    if (!uploadUrl || !s3Key) {
      throw new Error('Backend did not return a valid uploadUrl and s3Key.');
    }

    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: imageBlob,
      headers: {
        'Content-Type': fileType,
      },
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('S3 upload failed with status:', uploadResponse.status);
      console.error('S3 error response:', errorText);
      return null;
    }

    console.log('[_uploadToS3] S3 upload successful.');
    return s3Key;

  } catch (error) {
    console.error('Error in S3 upload process:', error);
    return null;
  }
};

export { uploadImageAndGetDownloadURL, uploadImageAndGetS3Key, uploadEventPhotoAndGetS3Key, uploadProfilePictureAndGetS3Key };
