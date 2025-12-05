
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebaseConfig';

const uploadImageAndGetDownloadURL = async (imageUri: string, userId: string) => {
  const response = await fetch(imageUri);
  const blob = await response.blob();

  const storageRef = ref(storage, `images/${userId}/${Date.now()}`);
  await uploadBytes(storageRef, blob);

  return await getDownloadURL(storageRef);
};

export { uploadImageAndGetDownloadURL };
