export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'MEMBER';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  messId?: string | { id?: string; name?: string; address?: string } | null;
  isActive: boolean;
  createdAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary?: unknown;
  readOnly?: boolean;
  errors?: unknown;
}

export const EXPENSE_CATEGORIES = [
  'Rice',
  'Vegetable',
  'Fish/Meat',
  'Gas',
  'Utility',
  'Salary',
  'Other',
] as const;
