
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  requestNotificationPermission,
  hasNotificationPermission as checkHasPermission,
} from '../lib/firebase-messaging';

export const usePushNotifications = () => {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!user) {
      setError(new Error('User not authenticated.'));
      return;
    }
    try {
      const newPermission = await requestNotificationPermission(user.uid);
      if (newPermission) {
        setPermission('granted');
      }
    } catch (err) {
      setError(err as Error);
    }
  }, [user]);

  const hasPermission = useCallback(async () => {
    if (!user) return false;
    return await checkHasPermission();
  }, [user]);

  return { permission, requestPermission, hasPermission, error };
};
