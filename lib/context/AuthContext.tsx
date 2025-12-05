
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import { AppUser, UserProfile } from '@/types';
import {
  signInWithEmail,
  signUpWithEmail,
  signOutUser,
  sendPasswordReset,
} from '../firebase/authService';
import {
  listenToUserProfile,
  createOrUpdateUserProfile,
} from '../firebase/userProfileService';
import { Timestamp } from 'firebase/firestore';

interface AuthContextType {
  user: AppUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isOnboardingComplete: boolean;
  error: string | null;
  signIn: typeof signInWithEmail;
  signUp: (email: any, password: any, fullName: any, username: any) => Promise<FirebaseUser>;
  signOut: typeof signOutUser;
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

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const unsubscribeProfile = listenToUserProfile(
          firebaseUser.uid,
          (profile) => {
            if (profile) {
              const appUser: AppUser = {
                ...firebaseUser,
                ...profile,
              };
              setUser(appUser);
              setUserProfile(profile);
              setIsOnboardingComplete(profile.onboardingCompleted === true);
            } else {
              // This case might happen if the user doc hasn't been created yet after sign up
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
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const handleSignUp = async (email: any, password: any, fullName: any, username: any) => {
    try {
      setError(null);
      const firebaseUser = await signUpWithEmail(email, password, fullName, username);
      // After sign up, create the initial user profile
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

  const value = {
    user,
    userProfile,
    loading,
    isOnboardingComplete,
    error,
    signIn: async (email: any, password: any) => {
      try {
        setError(null);
        return await signInWithEmail(email, password);
      } catch (e: any) {
        setError(e.message);
        throw e;
      }
    },
    signUp: handleSignUp,
    signOut: async () => {
      try {
        setError(null);
        await signOutUser();
      } catch (e: any) {
        setError(e.message);
        throw e;
      }
    },
    sendPasswordReset: async (email: any) => {
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
