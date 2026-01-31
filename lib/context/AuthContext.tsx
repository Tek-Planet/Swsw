
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import { AppUser, UserProfile } from '@/types/user';
import {
  signInWithEmail,
  signUpWithEmail,
  signOutUser,
  sendPasswordReset,
} from '../firebase/authService';
import {
  listenToUserProfile,
  createOrUpdateUserProfile,
} from '@/lib/services/userProfileService';
import {
  registerForPushNotificationsAsync,
  saveTokenToFirestore,
  removeTokenFromFirestore,
} from '@/lib/services/notificationService';
import { Timestamp } from 'firebase/firestore';

interface AuthContextType {
  user: AppUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isOnboardingComplete: boolean;
  error: string | null;
  signIn: typeof signInWithEmail;
  signUp: (email: string, password: string, fullName: string, username: string) => Promise<FirebaseUser>;
  signOut: () => Promise<void>;
  sendPasswordReset: typeof sendPasswordReset;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pushToken, setPushToken] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Handle push notifications
        try {
          const token = await registerForPushNotificationsAsync();
          if (token) {
            setPushToken(token);
            await saveTokenToFirestore(firebaseUser.uid, token);
          }
        } catch (e) {
          console.error("Error during push notification setup:", e);
        }
        
        const unsubscribeProfile = listenToUserProfile(
          firebaseUser.uid,
          (profile: UserProfile | null) => {
            if (profile) {
              const appUser: AppUser = {
                ...firebaseUser,
                ...profile,
              };
              setUser(appUser);
              setUserProfile(profile);
              setIsOnboardingComplete(profile.onboardingCompleted === true);
            } else {
              setUser({ ...firebaseUser } as AppUser);
              setUserProfile(null);
              setIsOnboardingComplete(false);
            }
            setLoading(false);
          }
        );
        return () => unsubscribeProfile();
      } else {
        setUser(null);
        setUserProfile(null);
        setIsOnboardingComplete(false);
        setLoading(false);
        setPushToken(null);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const handleSignUp = async (email: string, password: string, fullName: string, username: string) => {
    try {
      setError(null);
      const firebaseUser = await signUpWithEmail(email, password, fullName, username);
      await createOrUpdateUserProfile(firebaseUser.uid, {
        uid: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName: fullName,
        username: username,
        onboardingCompleted: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return firebaseUser;
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  };

  const handleSignOut = async () => {
    try {
      setError(null);
      if (user && pushToken) {
        await removeTokenFromFirestore(user.uid, pushToken);
      }
      await signOutUser();
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    isOnboardingComplete,
    error,
    signIn: async (email: string, password: string) => {
      try {
        setError(null);
        return await signInWithEmail(email, password);
      } catch (e: any) {
        setError(e.message);
        throw e;
      }
    },
    signUp: handleSignUp,
    signOut: handleSignOut,
    sendPasswordReset: async (email: string) => {
      try {
        setError(null);
        await sendPasswordReset(email);
      } catch (e: any) {
        setError(e.message);
        throw e;
      }
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
