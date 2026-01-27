
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { getFirestore, doc, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';

/**
 * Registers the app for push notifications and returns the Expo push token.
 * Requests permissions if not already granted.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  // Set up a notification channel for Android.
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  // Check for existing permissions.
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // If permissions are not granted, request them.
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  // If permissions are still not granted, exit.
  if (finalStatus !== 'granted') {
    console.log('Failed to get push token for push notification!');
    return null;
  }

  // Get the Expo push token.
  try {
    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('Expo Push Token:', token);
  } catch (error) {
    console.error("Couldn't get Expo push token", error);
  }


  return token;
}

/**
 * Saves the FCM token to the user's document in Firestore.
 * The backend function uses this token to send notifications.
 * @param userId - The ID of the user.
 * @param token - The FCM token to save.
 */
export async function saveTokenToFirestore(userId: string, token: string): Promise<void> {
  if (!userId || !token) return;

  const db = getFirestore();
  // Use the token itself as the document ID for easy lookup and to prevent duplicates.
  const tokenRef = doc(db, `users/${userId}/fcmTokens`, token);

  try {
    await setDoc(tokenRef, {
      token: token,
      createdAt: serverTimestamp(),
      platform: Platform.OS,
    });
    console.log('Successfully saved FCM token for user', userId);
  } catch (error) {
    console.error('Error saving FCM token to Firestore:', error);
  }
}

/**
 * Removes the FCM token from Firestore when the user logs out.
 * @param userId - The ID of the user.
 * @param token - The FCM token to remove.
 */
export async function removeTokenFromFirestore(userId: string, token: string): Promise<void> {
    if (!userId || !token) return;

    const db = getFirestore();
    const tokenRef = doc(db, `users/${userId}/fcmTokens`, token);

    try {
        await deleteDoc(tokenRef);
        console.log('Successfully removed FCM token for user', userId);
    } catch (error) {
        console.error('Error removing FCM token from Firestore:', error);
    }
}
