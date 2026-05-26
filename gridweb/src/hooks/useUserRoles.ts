import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  collection, 
  query, 
  getDocs, 
  deleteDoc, 
  doc, 
  Timestamp 
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '@/lib/firebase';
import { UserRole, UserRoleAssignment, UserWithRole } from '@/types/roles';
import { toast } from 'sonner';

// Fetch all user roles
const fetchUserRoles = async (): Promise<UserRoleAssignment[]> => {
  const rolesRef = collection(db, 'user_roles');
  const snapshot = await getDocs(rolesRef);
  
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      userId: data.userId,
      role: data.role as UserRole,
      eventIds: data.eventIds || [],
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
      createdBy: data.createdBy,
    };
  });
};

// Fetch all users from the users collection
const fetchUsers = async (): Promise<UserWithRole[]> => {
  const usersRef = collection(db, 'users');
  const snapshot = await getDocs(usersRef);
  
  const users: UserWithRole[] = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      uid: doc.id,
      email: data.email || null,
      displayName: data.displayName || null,
      photoURL: data.photoURL || null,
      roles: [], // Will be populated later
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : undefined,
    };
  });
  
  return users;
};

// Hook for managing user roles
export const useUserRoles = () => {
  const queryClient = useQueryClient();

  const { 
    data: roles = [], 
    isLoading: rolesLoading, 
    error: rolesError 
  } = useQuery({
    queryKey: ['user_roles'],
    queryFn: fetchUserRoles,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { 
    data: users = [], 
    isLoading: usersLoading, 
    error: usersError 
  } = useQuery({
    queryKey: ['all_users'],
    queryFn: fetchUsers,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Add role mutation
  const addRoleMutation = useMutation({
    mutationFn: async ({ userId, role, eventIds }: { userId: string; role: UserRole; eventIds?: string[] }) => {
      const existingRole = roles.find(r => r.userId === userId && r.role === role);
      if (existingRole) {
        throw new Error('User already has this role');
      }
      const setAdminStatus = httpsCallable(functions, 'setAdminStatus');
      await setAdminStatus({ uid: userId, role, isActive: true, eventIds: role === 'event_admin' ? eventIds : undefined });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_roles'] });
      toast.success('Role added successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add role');
    },
  });

  // Update event assignments mutation
  const updateEventsMutation = useMutation({
    mutationFn: async ({ roleId, eventIds, userId }: { roleId: string; eventIds: string[]; userId: string; }) => {
      const setAdminStatus = httpsCallable(functions, 'setAdminStatus');
      await setAdminStatus({ uid: userId, role: 'event_admin', isActive: true, eventIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_roles'] });
      toast.success('Event assignments updated');
    },
    onError: () => {
      toast.error('Failed to update event assignments');
    },
  });

  // Remove role mutation
  const removeRoleMutation = useMutation({
    mutationFn: async ({ roleId, userId, role }: { roleId: string; userId: string; role: UserRole }) => {
      const setAdminStatus = httpsCallable(functions, 'setAdminStatus');
      await setAdminStatus({ uid: userId, role, isActive: false });
      const roleRef = doc(db, 'user_roles', roleId);
      await deleteDoc(roleRef).catch(() => {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_roles'] });
      toast.success('Role removed successfully');
    },
    onError: () => {
      toast.error('Failed to remove role');
    },
  });

  return {
    users,
    roles,
    usersLoading,
    rolesLoading,
    error: usersError || rolesError,
    addRole: addRoleMutation.mutate,
    updateEvents: updateEventsMutation.mutate,
    removeRole: removeRoleMutation.mutate,
    isAdding: addRoleMutation.isPending,
    isRemoving: removeRoleMutation.isPending,
  };
};
