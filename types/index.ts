
import { Timestamp } from "firebase/firestore";

export type UserProfile = {
  uid: string;
  email: string;
  displayName: string;
  username: string;
  photoUrl?: string;
  bio?: string;
  interests?: string[];
  vibeTags?: string[];
  onboardingCompleted: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

export interface AppUser extends UserProfile {}
