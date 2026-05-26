
import { EventCurrency } from "./index";

export interface VenueSeat {
  label: string;
  type: "normal" | "wheelchair" | "blocked" | "aisle";
}

export interface VenueRow {
  label: string;
  price: number;
  seats: VenueSeat[];
}

export interface Venue {
  id: string;
  name: string;
  hallName?: string;
  screenPosition?: "top" | "bottom";
  currency: EventCurrency;
  rows: VenueRow[];
}

export type SeatStatus = "available" | "held" | "sold" | "blocked";

export interface Seat {
  id: string; // e.g., "A-1"
  rowLabel: string;
  seatLabel: string;
  type: "normal" | "wheelchair";
  price: number;
  status: SeatStatus;
  heldBy?: string | null;
  heldUntil?: Date | null;
  orderId?: string | null;
  userId?: string | null;
}

export const MAX_MOVIE_SEATS_PER_ORDER = 10;
export const MOVIE_SEAT_HOLD_TTL_MINUTES = 8;
