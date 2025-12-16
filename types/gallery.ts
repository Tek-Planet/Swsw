
import { FieldValue } from 'firebase/firestore';

export type Album = {
  id: string;
  title: string;
  coverPhotoUrl?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt?: Date | FieldValue;
  photoCount?: number;
};

export type Photo = {
  id: string;
  url: string;
  thumbUrl?: string;
  uploadedBy: "host" | "user";
  uploaderId: string;
  createdAt?: Date | FieldValue;
  taggedUserIds?: string[];
};
