
import { Timestamp } from 'firebase/firestore';

export interface Expense {
  id: string;
  groupId: string;
  description: string;
  amount: number;
  currency: string;
  paidById: string;
  splitType: 'equal' | 'unequal' | 'percentage' | 'shares';
  participants: Array<{ userId: string; amount: number; }>;
  categoryId?: string;
  receiptImageUrl?: string;
  createdAt: Timestamp;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  icon: string;
}

export interface Debt {
  fromUserId: string;
  toUserId: string;
  amount: number;
  currency: string;
}
