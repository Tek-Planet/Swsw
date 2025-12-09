
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebaseConfig';
import { AppUser } from '@/types';

// Sign Up
export const signUpWithEmail = async (
  email: any,
  password: any,
  fullName: any,
  username: anyca
) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    await updateProfile(user, { displayName: fullName });

    const userProfile = {
      uid: user.uid,
      displayName: fullName,
      username,
      email,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'users', user.uid), userProfile);

    return { ...user, ...userProfile };
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Sign In
export const signInWithEmail = async (email: any, password: any) => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      const userProfile = userDoc.data();
      return { ...user, ...userProfile };
    } else {
      throw new Error('User profile not found.');
    }
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Sign Out
export const signOutUser = async () => {
  try {
    await signOut(auth);
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Password Reset
export const sendPasswordReset = async (email: any) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    throw new Error(error.message);
  }
};
