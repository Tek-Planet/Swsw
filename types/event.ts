
import { Timestamp } from 'firebase/firestore';

// New types added from web
export type EventCurrency = 'INR' | 'USD' | 'HKD';

export interface CustomQuestion {
  id: string;
  label: string;
  type: 'text' | 'select';
  options?: string[];
  required?: boolean;
}

export interface MovieDetails {
  title: string;
  durationMins?: number;
  language?: string;
  rating?: string;
  posterUrl?: string;
  synopsis?: string;
}

// Existing types
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

// Updated Event interface
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
  startTime: Date;
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
  currency: EventCurrency; // Changed from string to the new type
  bookingFeePercent: number;

  // --- Fields added for Movie and Invite-Only Support ---
  soldSeatIds?: string[];
  isInviteOnly?: boolean;
  customQuestions?: CustomQuestion[];
  eventType?: 'regular' | 'movie';
  venueId?: string;
  showtime?: Date;
  movie?: MovieDetails;
  // --- End of added fields ---
}


export interface Attendee {
  name: string;
  email: string;
  phone?: string;
}

export type EventAttendeeStatus = 'going' | 'maybe' | 'notGoing';

export interface EventAttendee {
  userId: string;
  userName: string;
  userAvatarUrl?: string;
  rsvpStatus: EventAttendeeStatus;
  createdAt: Date;
}

export type TicketTierType = 'ticket' | 'table' | 'addon';

export interface TicketTier {
  id: string;
  name: string;
  price: number;
  chargeAmount?: number;
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
    chargeAmount?: number;
    createdAt: Timestamp;
    updatedAt: Timestamp;
};

export type FirestoreEvent = Omit<Event, 'id' | 'startTime' | 'endTime' | 'createdAt' | 'updatedAt' | 'showtime'> & {
  startTime: Timestamp;
  endTime: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  showtime?: Timestamp;
};

export interface OrderItem {
  tierId: string;
  name: string;
  type: TicketTierType;
  unitPrice: number;
  quantity: number;
}

export type OrderStatus = 'pending' | 'paid' | 'canceled' | 'failed';

export interface TableContactDetails {
    fullName: string;
    email: string;
    phone: string;
    notes?: string;
}

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
  createdAt: Date;
  updatedAt: Date;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  paymentMethod?: string;
  eventTitle?: string;
  eventDate?: Date;
  promoCode?: string;
  tableContactDetails?: TableContactDetails;
  attendees?: Attendee[];
}

export interface SurveyQuestion {
  id: string;
  order: number;
  type: 'multiple-choice' | 'single-choice' | 'free-text';
  question: string;
  options?: string[];
}
