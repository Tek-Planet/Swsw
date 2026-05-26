/* eslint-disable no-restricted-globals */

// This service worker can be customized!
// See https://developers.google.com/web/tools/workbox/modules
// for documentation on Workbox modules.

import { clientsClaim } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate } from 'workbox-strategies';

// These imports are essential for Firebase.
import { initializeApp } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw';

// This is the Firebase config object from your main app.
const firebaseConfig = JSON.parse(new URL(location).searchParams.get("firebaseConfig"));

// Initialize the Firebase app in the service worker.
initializeApp(firebaseConfig);
const messaging = getMessaging();

clientsClaim();

precacheAndRoute(self.__WB_MANIFEST);

const fileExtensionRegexp = new RegExp('/[^/?]+\.[^/]+$');
registerRoute(
  ({ request, url }) => {
    if (request.mode !== 'navigate') {
      return false;
    }
    if (url.pathname.startsWith('/_')) {
      return false;
    }
    if (url.pathname.match(fileExtensionRegexp)) {
      return false;
    }
    return true;
  },
  createHandlerBoundToURL(process.env.PUBLIC_URL + '/index.html')
);

registerRoute(
  ({ url }) => url.origin === self.location.origin && url.pathname.endsWith('.png'),
  new StaleWhileRevalidate({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({ maxEntries: 50 }),
    ],
  })
);

// --- Click Handler for Notifications ---
// This listener is fired when a user clicks on a notification.
self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const relativeLink = notification.data?.link; // e.g., '/events/some-id'

  // Close the notification.
  notification.close();

  // If there's a relative link, construct the full URL and open it.
  if (relativeLink) {
    const fullUrl = new URL(relativeLink, self.location.origin).href;
    event.waitUntil(clients.openWindow(fullUrl));
  } else {
    // Otherwise, focus the last active window or open a new one.
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
        if (windowClients.length > 0) {
          return windowClients[0].focus();
        } else {
          return clients.openWindow('/');
        }
      })
    );
  }
});

// --- Background Message Handler ---
// This is fired when the service worker receives a push message while the app is in the background.
onBackgroundMessage(messaging, (payload) => {
  console.log('[firebase-messaging-sw.js] Received background message: ', payload);

  const notificationTitle = payload.notification?.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/logo192.png', // Always use a local, reliable icon.
    data: { 
      link: payload.data?.link // Pass the relative link to the notification data
    } 
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
