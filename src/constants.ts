import { Category } from './types';

export const CATEGORIES: Category[] = [
  { id: 'food', name: 'Food', icon: 'UtensilsCrossed', color: '#ff706e' },
  { id: 'shopping', name: 'Shopping', icon: 'ShoppingCart', color: '#8ff5ff' },
  { id: 'travel', name: 'Travel', icon: 'Plane', color: '#beee00' },
  { id: 'rent', name: 'Rent', icon: 'Home', color: '#00eefc' },
  { id: 'bills', name: 'Bills', icon: 'CreditCard', color: '#ff9e7d' },
  { id: 'health', name: 'Health', icon: 'Dumbbell', color: '#d4ff5e' },
  { id: 'fun', name: 'Fun', icon: 'Film', color: '#70ffaf' },
  { id: 'other', name: 'Other', icon: 'MoreHorizontal', color: '#ff70d4' },
];

export const MOCK_TRANSACTIONS = [
  {
    id: '1',
    amount: 1299.00,
    type: 'expense' as const,
    category: 'Tech',
    date: '2023-10-24T14:20:00Z',
    description: 'Apple Store Soho',
    icon: 'Laptop',
  },
  {
    id: '2',
    amount: 8420.00,
    type: 'income' as const,
    category: 'Income',
    date: '2023-10-24T09:15:00Z',
    description: 'Stripe Payout',
    icon: 'DollarSign',
  },
  {
    id: '3',
    amount: 84.50,
    type: 'expense' as const,
    category: 'Dining',
    date: '2023-10-23T18:45:00Z',
    description: 'The Alchemist Bar',
    icon: 'UtensilsCrossed',
  },
  {
    id: '4',
    amount: 24.12,
    type: 'expense' as const,
    category: 'Transport',
    date: '2023-10-23T08:10:00Z',
    description: 'Uber Trip',
    icon: 'Car',
  },
];
