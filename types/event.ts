import { Timestamp } from 'firebase/firestore';

export type EventVisibility = 'public' | 'private' | 'buds';
export type EventStatus = 'draft' | 'published' | 'cancelled';

export type EventLocation = {
  type: 'physical' | 'online';
  address?: string;
  city?: string;
  lat?: number;
  lng?: number;
  onlineUrl?: string;
};

export interface Event {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  hostId: string;
  hostName: string;
  hostAvatarUrl?: string;
  visibility: EventVisibility;
  status: EventStatus;
  startTime: Date; // Converted from Firestore Timestamp in app code
  endTime: Date;
  timeZone?: string;
  location: EventLocation;
  coverImageUrl?: string;
  tags: string[];
  maxAttendees?: number;
  attendeesCount: number;
  attendeeIds: string[];
  likesCount: number;
  popularityScore: number;
  linkedAlbumId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type EventAttendeeStatus = 'going' | 'maybe' | 'notGoing';

export interface EventAttendee {
  userId: string;
  userName: string;
  userAvatarUrl?: string;
  rsvpStatus: EventAttendeeStatus;
  createdAt: Date;
}

// Firestore-specific types
export type FirestoreEvent = Omit<Event, 'startTime' | 'endTime' | 'createdAt' | 'updatedAt'> & {
  startTime: Timestamp;
  endTime: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};
