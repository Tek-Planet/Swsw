import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import app, { db } from './firebase';

// Detect Instagram / Facebook in-app browser
const isMetaWebView = () => {
  const ua = navigator.userAgent || navigator.vendor || "";
  return /FBAN|FBAV|Instagram/.test(ua);
};

// Messaging instance (only created if supported)
let messaging: any = null;

if (!isMetaWebView()) {
  try {
    messaging = getMessaging(app);
  } catch (e) {
    console.error("Firebase Messaging init failed:", e);
  }
}

/**
 * Requests permission to show notifications and retrieves the FCM token.
 * @param userId The ID of the current user.
 * @returns The FCM token if permission is granted, otherwise null.
 */
export const requestNotificationPermission = async (
  userId: string
): Promise<string | null> => {

  // Skip entirely in Instagram / Facebook WebView
  if (isMetaWebView()) {
    console.log("Skipping FCM: Meta WebView does not support Firebase Messaging.");
    return null;
  }

  try {
    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      console.log("Notification permission not granted.");
      return null;
    }

    if (!messaging) {
      console.log("Messaging not initialized.");
      return null;
    }

    const fcmToken = await getToken(messaging, {
      vapidKey: "BPy6AGmzvdMCJbsoW_CGwn9ENDsxba9w0PMZE_5f586m8edUCkryiejiRsUKNchhgbUvaX-FFD0qPFVe2sBVpwI",
    });

    if (fcmToken) {
      console.log("FCM Token:", fcmToken);
      await saveTokenToFirestore(userId, fcmToken);
      return fcmToken;
    }

    console.log("No registration token available.");
    return null;

  } catch (error) {
    console.error("Error requesting notification permission:", error);
    return null;
  }
};

/**
 * Saves the FCM token to the user's document in Firestore.
 */
const saveTokenToFirestore = async (userId: string, token: string) => {
  if (!userId || !token) return;

  const tokenRef = doc(db, `users/${userId}/fcmTokens/${token}`);

  try {
    await setDoc(tokenRef, {
      token,
      createdAt: serverTimestamp(),
      platform: "web",
    });

    console.log("FCM token saved to Firestore.");
  } catch (error) {
    console.error("Error saving FCM token:", error);
  }
};

/**
 * Listens for incoming messages when the app is in the foreground.
 */
export const onForegroundMessage = () => {
  if (!messaging) {
    console.log("Messaging not initialized; skipping foreground listener.");
    return;
  }

  onMessage(messaging, (payload) => {
    console.log("Message received in foreground:", payload);
    alert(
      `New Notification: ${payload.notification?.title}\n${payload.notification?.body}`
    );
  });
};

/**
 * Checks if the user has already granted notification permissions.
 */
export const hasNotificationPermission = async (): Promise<boolean> => {
  if (typeof window !== "undefined" && "Notification" in window) {
    return Notification.permission === "granted";
  }
  return false;
};
