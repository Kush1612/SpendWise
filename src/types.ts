export type TransactionType = 'expense' | 'income';

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  description: string;
  icon: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color?: string;
}

export type Screen = 'login' | 'dashboard' | 'analytics' | 'add' | 'history' | 'profile';

export interface RecurringBill {
  id: string;
  uid: string;
  name: string;
  amount: number;
  dueDate: number; // Day of the month (1-31)
  category: string;
  icon: string;
}

export interface UserProfile {
  uid: string;
  name: string | null;
  email: string | null;
  photoURL: string | null;
  theme: 'dark' | 'light';
  currency: string;
  createdAt: any;
  role: 'user' | 'admin';
}
