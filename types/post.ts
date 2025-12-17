
import { Timestamp } from 'firebase/firestore';

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string;
  text: string;
  createdAt: Date;
  updatedAt?: Date;
  likeCount: number;
  commentCount: number;
  visibility: 'attendees';
  isLiked?: boolean; // Client-side state
}

export interface FirestorePost {
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string;
  text: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  likeCount: number;
  commentCount: number;
  visibility: 'attendees';
}
