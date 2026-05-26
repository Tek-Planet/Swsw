import { useEffect, useState } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast, Toaster } from 'sonner';
import { Bell } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { motion } from 'framer-motion';

const SettingsPage = () => {
  const { permission, requestPermission, hasPermission } = usePushNotifications();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    const checkPermission = async () => {
      const enabled = await hasPermission();
      setNotificationsEnabled(enabled);
    };
    checkPermission();
  }, [hasPermission]);

  const handleToggleNotifications = async (enabled: boolean) => {
    if (enabled) {
      if (permission === 'denied') {
        toast.error('Notification permission is blocked. Please enable it in your browser settings.');
        return;
      }
      // Request permission
      await requestPermission();
      // Check permission status again after request
      const newPermission = await hasPermission();
      setNotificationsEnabled(newPermission);
      if (newPermission) {
        toast.success('Push notifications have been enabled.');
      } else {
        // This case handles when the user denies the permission prompt
        toast.error('Failed to enable push notifications. You may have denied permission.');
      }
    } else {
      // NOTE: True disabling would require deleting the subscription token from the backend.
      // For now, this just updates the UI state.
      setNotificationsEnabled(false);
      toast.info('Push notifications have been disabled.');
    }
  };

  return (
    <div className="min-h-screen gradient-hero">
      <Navbar />
      <Toaster richColors />
      <div className="pt-28 pb-20 px-4">
        <div className="container mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <header className="mb-8">
              <h1 className="text-3xl font-display font-bold text-foreground">Settings</h1>
              <p className="text-muted-foreground mt-1">Manage your account and notification preferences.</p>
            </header>

            <div className="max-w-2xl">
              <Card className="bg-card border-border">
                <CardHeader className="flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-muted-foreground" />
                    <CardTitle className="text-lg font-semibold">Push Notifications</CardTitle>
                  </div>
                  <Switch
                    checked={notificationsEnabled}
                    onCheckedChange={handleToggleNotifications}
                    aria-label="Toggle push notifications"
                  />
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Enable push notifications to receive real-time updates about your events directly on your device.
                  </p>
                </CardContent>
              </Card>
            </div>

          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
