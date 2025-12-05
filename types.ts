
import { User as FirebaseUser } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  username: string;
  displayName?: string | null;
  email: string;
  photoUrl?: string;
  onboardingCompleted: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  interests?: string[];
  bio?: string;
}

export type AppUser = FirebaseUser & UserProfile;
