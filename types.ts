
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
  profilePictureS3Key?: string;
  faceId?: string;
  faceIndexedAt?: Timestamp;
}

export type AppUser = FirebaseUser & UserProfile;
