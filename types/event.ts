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

// New TicketTier types
export type TicketTierType = 'ticket' | 'table' | 'addon';

export interface TicketTier {
  id: string;
  name: string;
  price: number;
  currency: string;
  type: TicketTierType;
  description?: string;
  isActive: boolean;
  quantityTotal?: number | null;
  quantitySold: number;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export type FirestoreTicketTier = Omit<TicketTier, 'id' | 'createdAt' | 'updatedAt'> & {
    createdAt: Timestamp;
    updatedAt: Timestamp;
};


// Firestore-specific types
export type FirestoreEvent = Omit<Event, 'id' | 'startTime' | 'endTime' | 'createdAt' | 'updatedAt'> & {
  startTime: Timestamp;
  endTime: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};
