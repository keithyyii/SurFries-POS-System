/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Role = 'admin' | 'manager' | 'cashier';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  lastLogin?: string;
  avatar?: string;
}

export type Category = 'fries' | 'drinks' | 'add-ons' | 'combos';
export type Size = 'small' | 'medium' | 'large' | 'none';
export type Flavor = 'cheese' | 'barbecue' | 'sour cream' | 'classic' | 'none';

export interface Product {
  id: string;
  name: string;
  price: number;
  cost: number; // For profit margin calculation
  category: Category;
  size: Size;
  flavor: Flavor;
  image: string;
  available: boolean;
  stock: number;
  lowStockThreshold: number;
  ingredients?: { name: string; quantity: number; unit: string }[];
  salesVelocity?: 'fast' | 'normal' | 'slow';
}

export interface Ingredient {
  id: string;
  name: string;
  stock: number;
  unit: string;
  lowStockThreshold: number;
  category: 'raw' | 'packaging' | 'sauce';
}

export interface CartItem extends Product {
  quantity: number;
}

export type PaymentMethod = 'cash' | 'card' | 'e-wallet';
export type TransactionStatus = 'completed' | 'refunded' | 'voided';

export interface Transaction {
  id: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  discountCode?: string;
  total: number;
  paymentMethod: PaymentMethod;
  status: TransactionStatus;
  timestamp: string;
  cashierId: string;
  cashierName: string;
}

export interface InventoryLog {
  id: string;
  itemId: string;
  itemName: string;
  type: 'in' | 'out' | 'waste' | 'sale';
  quantity: number;
  unit: string;
  timestamp: string;
  reason?: string;
  userId: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface DailyStats {
  date: string;
  sales: number;
  transactions: number;
}

export interface Promotion {
  id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  value: number;
  active: boolean;
}
