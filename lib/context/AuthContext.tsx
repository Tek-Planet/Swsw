import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { AppUser } from '@/types';
import { signInWithEmail, signUpWithEmail, signOutUser, sendPasswordReset } from '../firebase/authService';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  error: string | null;
  signIn: typeof signInWithEmail;
  signUp: typeof signUpWithEmail;
  signOut: typeof signOutUser;
  sendPasswordReset: typeof sendPasswordReset;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUser({ ...user, ...userDoc.data() } as AppUser);
        }
      }
      else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = {
    user,
    loading,
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
    signUp: async (email: any, password: any, fullName: any, username: any) => {
      try {
        setError(null);
        return await signUpWithEmail(email, password, fullName, username);
      } catch (e: any) {
        setError(e.message);
        throw e;
      }
    },
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
