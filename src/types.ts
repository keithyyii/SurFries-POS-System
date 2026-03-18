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
}

export type Category = 'fries' | 'drinks' | 'add-ons' | 'combos';

export interface Product {
  id: string;
  name: string;
  price: number;
  category: Category;
  image: string;
  available: boolean;
  stock: number;
  lowStockThreshold: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export type PaymentMethod = 'cash' | 'card' | 'e-wallet';

export interface Transaction {
  id: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  timestamp: string;
  cashierId: string;
  cashierName: string;
}

export interface InventoryLog {
  id: string;
  productId: string;
  productName: string;
  type: 'in' | 'out' | 'waste' | 'sale';
  quantity: number;
  timestamp: string;
  reason?: string;
}

export interface DailyStats {
  date: string;
  sales: number;
  transactions: number;
}
