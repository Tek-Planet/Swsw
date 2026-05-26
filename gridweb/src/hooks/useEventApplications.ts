import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { EventApplication, ApplicationStatus, GenderCategory, CustomQuestion } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface ApplicationFormData {
  name: string;
  email: string;
  phone: string;
  gender: GenderCategory;
  age: number;
  reason: string;
  tierId: string;
  tierName: string;
  customAnswers?: Record<string, string>;
}

export const useEventApplications = (eventId: string) => {
  const [applications, setApplications] = useState<EventApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const fetchApplications = async () => {
    if (!eventId) return;
    setLoading(true);
    try {
      const ref = collection(db, 'events', eventId, 'applications');
      const q = query(ref, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
      })) as EventApplication[];
      setApplications(data);
    } catch (err) {
      console.error('Error fetching applications:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [eventId]);

  const submitApplication = async (data: ApplicationFormData, userId: string): Promise<boolean> => {
    try {
      const ref = collection(db, 'events', eventId, 'applications');
      await addDoc(ref, {
        ...data,
        eventId,
        userId,
        status: 'pending' as ApplicationStatus,
        createdAt: serverTimestamp(),
      });
      toast({
        title: 'Application submitted',
        description: 'Your application has been submitted for review.',
      });
      return true;
    } catch (err) {
      console.error('Error submitting application:', err);
      toast({
        title: 'Error',
        description: 'Failed to submit application. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const updateApplicationStatus = async (
    applicationId: string,
    status: ApplicationStatus,
    reviewerId: string
  ): Promise<boolean> => {
    try {
      const ref = doc(db, 'events', eventId, 'applications', applicationId);
      await updateDoc(ref, {
        status,
        reviewedBy: reviewerId,
        reviewedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Send in-app notification
      const app = applications.find(a => a.id === applicationId);
      if (app && status === 'approved') {
        // Notify user they've been approved
        const notifRef = collection(db, 'notifications', app.userId, 'user_notifications');
        await addDoc(notifRef, {
          title: `You're on the Grid! 🎉`,
          message: `Congratulations — your application has been approved! Complete your registration to confirm your spot.`,
          type: 'invitation',
          eventId,
          link: `/events/${eventId}`,
          read: false,
          createdAt: serverTimestamp(),
        });
      } else if (app && status === 'rejected') {
        const notifRef = collection(db, 'notifications', app.userId, 'user_notifications');
        await addDoc(notifRef, {
          title: 'Application Update',
          message: 'Unfortunately, your application was not selected this time. We hope to see you at future events!',
          type: 'invitation',
          eventId,
          read: false,
          createdAt: serverTimestamp(),
        });
      }

      setApplications(prev =>
        prev.map(a => (a.id === applicationId ? { ...a, status, reviewedBy: reviewerId } : a))
      );

      toast({
        title: status === 'approved' ? 'Application approved' : 'Application rejected',
        description:
          status === 'approved'
            ? 'Invitation notification sent to the applicant.'
            : 'The applicant has been notified.',
      });
      return true;
    } catch (err) {
      console.error('Error updating application:', err);
      toast({
        title: 'Error',
        description: 'Failed to update application status.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const getUserApplication = async (userId: string): Promise<EventApplication | null> => {
    try {
      const ref = collection(db, 'events', eventId, 'applications');
      const q = query(ref, where('userId', '==', userId));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as EventApplication;
    } catch {
      return null;
    }
  };

  return {
    applications,
    loading,
    error,
    submitApplication,
    updateApplicationStatus,
    getUserApplication,
    refetch: fetchApplications,
  };
};
