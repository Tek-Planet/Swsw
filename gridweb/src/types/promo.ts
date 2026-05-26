
export interface PromoCode {
  id: string;
  code: string;
  eventId: string;
  discountType: 'percent' | 'fixed' | 'free';
  discountValue: number;
  isActive: boolean;
  maxRedemptions?: number;
  currentRedemptions?: number;
  applicableTierIds?: string[];
  createdAt: Date;
  updatedAt: Date;
}
