import { useQuery } from '@tanstack/react-query';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

export interface AdminContext {
  isAdmin: boolean;
  isFullAdmin: boolean; // Legacy admin with full access
  isEventAdmin: boolean; // Event-scoped admin
  assignedEventIds: string[]; // Event IDs this user can manage (empty for full admins)
  loading: boolean;
}

/**
 * Hook to get the current user's admin context including:
 * - Whether they are a full admin (legacy custom claim)
 * - Whether they are an event admin (scoped to specific events)
 * - Which event IDs they have access to
 */
export const useAdminContext = (): AdminContext => {
  const { user, loading: authLoading } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['admin_context', user?.uid],
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !authLoading && !!user,
    queryFn: async () => {
      if (!user) {
        return { isFullAdmin: false, isEventAdmin: false, assignedEventIds: [] };
      }

      try {
        // Check legacy admin custom claim first
        const tokenResult = await user.getIdTokenResult();
        if (tokenResult.claims.admin === true) {
          return { isFullAdmin: true, isEventAdmin: false, assignedEventIds: [] };
        }

        // Check for event_admin in custom claims
        if (tokenResult.claims.eventAdmin === true && Array.isArray(tokenResult.claims.eventIds)) {
          return { 
            isFullAdmin: false, 
            isEventAdmin: true, 
            assignedEventIds: tokenResult.claims.eventIds as string[]
          };
        }

        // Fallback: Check Firestore user_roles collection
        const rolesRef = collection(db, 'user_roles');
        const q = query(rolesRef, where('userId', '==', user.uid));
        const snapshot = await getDocs(q);

        for (const doc of snapshot.docs) {
          const data = doc.data();
          if (data.role === 'admin') {
            return { isFullAdmin: true, isEventAdmin: false, assignedEventIds: [] };
          }
          if (data.role === 'event_admin' && Array.isArray(data.eventIds)) {
            return { 
              isFullAdmin: false, 
              isEventAdmin: true, 
              assignedEventIds: data.eventIds 
            };
          }
        }

        return { isFullAdmin: false, isEventAdmin: false, assignedEventIds: [] };
      } catch (error) {
        console.error('Error fetching admin context:', error);
        return { isFullAdmin: false, isEventAdmin: false, assignedEventIds: [] };
      }
    },
  });

  const isFullAdmin = data?.isFullAdmin ?? false;
  const isEventAdmin = data?.isEventAdmin ?? false;
  const assignedEventIds = data?.assignedEventIds ?? [];

  return {
    isAdmin: isFullAdmin || isEventAdmin,
    isFullAdmin,
    isEventAdmin,
    assignedEventIds,
    loading: authLoading || isLoading,
  };
};
