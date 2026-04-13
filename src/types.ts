/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Role = 'manager' | 'cashier';

export interface User {
  id: string;
  auth_user_id: string;
  name: string;
  email: string;
  role: Role;
  last_login?: string;
  avatar_url?: string;
  created_at?: string;
}

export type Category = 'fries' | 'drinks' | 'add-ons' | 'combos';
export type Size = 'small' | 'medium' | 'large' | 'none';
export type Flavor = 'cheese' | 'barbecue' | 'sour cream' | 'classic' | 'none';
export type SalesVelocity = 'fast' | 'normal' | 'slow';

export interface Product {
  id: string;
  name: string;
  price: number;
  cost: number;
  category: Category;
  size: Size;
  flavor: Flavor;
  image_url: string;
  available: boolean;
  stock: number;
  low_stock_threshold: number;
  ingredients: { name: string; quantity: number; unit: string }[];
  sales_velocity: SalesVelocity;
  created_at?: string;
  updated_at?: string;
}

export interface Ingredient {
  id: string;
  name: string;
  stock: number;
  unit: string;
  low_stock_threshold: number;
  category: 'raw' | 'packaging' | 'sauce';
  created_at?: string;
  updated_at?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export type PaymentMethod = 'cash' | 'gcash' | 'card' | 'e-wallet';
export type TransactionStatus = 'completed' | 'refunded' | 'voided';

export interface Transaction {
  id: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  discount_code?: string;
  payment_method: PaymentMethod;
  status: TransactionStatus;
  cashier_id: string;
  cashier_name: string;
  created_at: string;
}

export interface TransactionItem {
  id: string;
  transaction_id: string;
  product_id: string | null;
  product_name: string;
  category: Category;
  size: Size;
  flavor: Flavor;
  image_url?: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  created_at: string;
}

export type InventoryLogType = 'in' | 'out' | 'waste' | 'sale';

export interface InventoryLog {
  id: string;
  item_id: string;
  item_name: string;
  item_type: 'product' | 'ingredient';
  type: InventoryLogType;
  quantity: number;
  unit: string;
  reason?: string;
  user_id: string | null;
  user_name: string | null;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string | null;
  user_name: string;
  action: string;
  details: string;
  created_at: string;
}

export interface Promotion {
  id: string;
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  value: number;
  active: boolean;
}

export interface DailyStats {
  date: string;
  sales: number;
  transactions: number;
}
