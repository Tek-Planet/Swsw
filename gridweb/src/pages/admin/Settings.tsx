
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const Settings = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const { toast } = useToast();

  const handleSyncTemplates = async () => {
    setIsSyncing(true);
    try {
      const functions = getFunctions();
      const adminUploadEmailTemplates = httpsCallable(functions, 'adminUploadEmailTemplates');
      const result = await adminUploadEmailTemplates();
      const resultData = result.data as { status: string; message: string };

      if (resultData.status === 'success') {
        toast({
          title: "Success",
          description: resultData.message,
        });
      } else {
        throw new Error(resultData.message || "An unknown error occurred.");
      }
    } catch (error: any) {
      console.error("Error syncing email templates:", error);
      toast({
        variant: "destructive",
        title: "Sync Failed",
        description: error.message || "Please check the console for details.",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSeedVenue = async () => {
    setIsSeeding(true);
    try {
      const functions = getFunctions();
      const seedVenueHouse6 = httpsCallable(functions, 'seedVenueHouse6');
      const result = await seedVenueHouse6();
      const resultData = result.data as { status: string; message: string };

      if (resultData.status === 'success') {
        toast({
          title: "Success",
          description: resultData.message,
        });
      } else {
        throw new Error(resultData.message || "An unknown error occurred.");
      }
    } catch (error: any) {
      console.error("Error seeding venue:", error);
      toast({
        variant: "destructive",
        title: "Seed Failed",
        description: error.message || "Please check the console for details.",
      });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your admin preferences and configurations.</p>
      </div>

      {/* General Settings */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">General Settings</CardTitle>
          <CardDescription>Configure general application settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="appName">Application Name</Label>
            <Input
              id="appName"
              defaultValue="Grid"
              className="bg-muted border-border"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="supportEmail">Support Email</Label>
            <Input
              id="supportEmail"
              type="email"
              defaultValue="support@grid.events"
              className="bg-muted border-border"
            />
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Notifications</CardTitle>
          <CardDescription>Configure notification preferences.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email notifications</Label>
              <p className="text-sm text-muted-foreground">Receive email for new bookings</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator className="bg-border" />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Low stock alerts</Label>
              <p className="text-sm text-muted-foreground">Get notified when tickets are running low</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Email Management */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Email Management</CardTitle>
          <CardDescription>Manage and synchronize email templates with the database.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="font-medium text-foreground">Sync Templates</p>
              <p className="text-sm text-muted-foreground">Updates Firestore with the latest versions of email templates from the code.</p>
            </div>
            <Button onClick={handleSyncTemplates} disabled={isSyncing} size="sm">
              {isSyncing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                "Sync Templates"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Venue Seeding */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Venue Seeding</CardTitle>
          <CardDescription>
            Populate the database with predefined venue layouts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="font-medium text-foreground">Seed "House 6"</p>
              <p className="text-sm text-muted-foreground">
                Creates or updates the venue layout for House 6. This is idempotent.
              </p>
            </div>
            <Button onClick={handleSeedVenue} disabled={isSeeding} size="sm">
              {isSeeding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Seeding...
                </>
              ) : (
                "Seed Venue"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="bg-card border-destructive/20">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Irreversible and destructive actions.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="font-medium text-foreground">Delete all events</p>
              <p className="text-sm text-muted-foreground">Permanently delete all events and associated data</p>
            </div>
            <Button variant="destructive" size="sm">
              Delete All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button>Save Changes</Button>
      </div>
    </div>
  );
};

export default Settings;
