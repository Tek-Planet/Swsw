import { Timestamp } from 'firebase/firestore';

export type EventVisibility = 'public' | 'private' | 'unlisted';
export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed';

export interface EventLocation {
  address: string;
  city: string;
  latitude?: number;
  longitude?: number;
}

export type EventCurrency = 'INR' | 'USD' | 'HKD';

export interface CustomQuestion {
  id: string;
  label: string;
  type: 'text' | 'select';
  options?: string[]; // For select type
  required?: boolean;
}

export type GenderCategory = 'male' | 'female' | 'other';

export interface Event {
  soldSeatIds: any[];
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  hostId?: string;
  hostName?: string;
  hostAvatarUrl?: string;
  visibility?: EventVisibility;
  status: EventStatus;
  startTime: Date;
  endTime?: Date;
  timeZone?: string;
  location: EventLocation;
  coverImageUrl?: string;
  tags?: string[];
  maxAttendees?: number;
  attendeesCount?: number;
  attendeeIds?: string[];
  likesCount?: number;
  popularityScore?: number;
  linkedAlbumId?: string;
  currency?: EventCurrency;
  bookingFeePercent?: number;
  isInviteOnly?: boolean;
  customQuestions?: CustomQuestion[];
  // Movie event extensions
  eventType?: 'regular' | 'movie';
  venueId?: string;
  showtime?: Date;
  movie?: MovieDetails;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MovieDetails {
  title: string;
  durationMins?: number;
  language?: string;
  rating?: string;
  posterUrl?: string;
  synopsis?: string;
}

export interface VenueSeat {
  label: string;          // "1", "2", "W1"
  type: 'normal' | 'wheelchair' | 'blocked' | 'aisle';
}

export interface VenueRow {
  label: string;          // "A", "B"
  price: number;          // HKD per seat in this row
  seats: VenueSeat[];     // ordered left-to-right; aisle = gap
}

export interface Venue {
  id: string;
  name: string;
  hallName?: string;
  screenPosition?: 'top' | 'bottom';
  currency: EventCurrency;
  rows: VenueRow[];
}

export type SeatStatus = 'available' | 'held' | 'sold' | 'blocked';

export interface Seat {
  id: string;             // "A-1"
  rowLabel: string;       // "A"
  seatLabel: string;      // "1"
  type: 'normal' | 'wheelchair';
  price: number;
  status: SeatStatus;
  heldBy?: string | null;
  heldUntil?: Date | null;
  orderId?: string | null;
  userId?: string | null;
}

export const MAX_MOVIE_SEATS_PER_ORDER = 10;
export const MOVIE_SEAT_HOLD_TTL_MINUTES = 8;

export interface TicketTier {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  type: 'ticket' | 'addon' | 'table' | 'donation';
  isActive: boolean;
  sortOrder: number;
  quantityTotal?: number;
  quantitySold?: number;
  chargeAmount?: number;
  genderCategory?: GenderCategory; // For gender-based inventory
  genderQuotas?: {
    male: number;
    female: number;
    other: number;
  };
  genderSold?: {
    male: number;
    female: number;
    other: number;
  };
}

export interface OrderItem {
  tierId: string;
  name: string;
  type: 'ticket' | 'addon' | 'table' | 'donation';
  unitPrice: number;
  quantity: number;
  chargeAmount?: number;
}

export interface AttendeeInfo {
  name: string;
  email: string;
  phone: string;
}

export interface TableContactDetails {
  fullName: string;
  phone: string;
  email: string;
  notes?: string;
}

export interface Order {
  orderType: string;
  orderId: string;
  eventId: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  currency: string;
  status: 'pending' | 'paid' | 'canceled' | 'failed';
  stripeSessionId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  eventTitle?: string;
  eventDate?: Timestamp;
  processingFee?: number;
  total?: number;
  promoCode?: string;
  promoCodeId?: string;
  discount?: number;
  tableContactDetails?: TableContactDetails;
  attendees?: AttendeeInfo[];
  donor?: AttendeeInfo;
}

export type ApplicationStatus = 'pending' | 'approved' | 'rejected';

export interface EventApplication {
  id: string;
  eventId: string;
  userId: string;
  tierId: string;
  tierName: string;
  name: string;
  email: string;
  phone: string;
  gender: GenderCategory;
  age: number;
  reason: string;
  customAnswers?: Record<string, string>;
  status: ApplicationStatus;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  reviewedBy?: string;
  reviewedAt?: Timestamp;
}

export type SelectedTiers = Record<string, number>;
