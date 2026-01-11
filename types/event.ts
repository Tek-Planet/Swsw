
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
  photoCount?: number;
  latestPhotoThumbUrl?: string;
  latestPhotoAt?: any;

  // [NEW] Fields for dynamic currency and booking fee
  currency: string; // e.g., 'INR', 'USD'
  bookingFeePercent: number; // e.g., 10 for 10%
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
  chargeAmount?: number; // Added to match backend logic
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
    chargeAmount?: number; // Added to match backend logic
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

export interface OrderItem {
  tierId: string;
  name: string;
  type: TicketTierType;
  unitPrice: number;
  quantity: number;
}

// Updated OrderStatus to include 'failed'
export type OrderStatus = 'pending' | 'paid' | 'canceled' | 'failed';

// Updated to match web app for table bookings
export interface TableContactDetails {
    fullName: string;
    email: string;
    phone: string;
    notes?: string;
}

// Updated Order type to match web app, using Date for app consistency
export interface Order {
  orderId: string;
  eventId: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  feeBase: number;
  processingFee: number;
  total: number;
  currency: string;
  status: OrderStatus;
  createdAt: Date; // Converted in app code
  updatedAt: Date; // Converted in app code
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  paymentMethod?: string;
  eventTitle?: string;
  eventDate?: Date; // Converted in app code
  promoCode?: string;
  tableContactDetails?: TableContactDetails;
}

export interface SurveyQuestion {
  id: string;
  order: number;
  type: 'multiple-choice' | 'single-choice' | 'free-text';
  question: string;
  options?: string[];
}
