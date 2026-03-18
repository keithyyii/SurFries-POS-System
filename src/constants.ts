/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product, User, Category } from './types';

export const CATEGORIES: { id: Category; name: string; icon: string }[] = [
  { id: 'fries', name: 'Fries', icon: '🍟' },
  { id: 'drinks', name: 'Drinks', icon: '🥤' },
  { id: 'add-ons', name: 'Add-ons', icon: '🧂' },
  { id: 'combos', name: 'Combos', icon: '🍱' },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Classic Salted Fries',
    price: 2.5,
    category: 'fries',
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=400&fit=crop',
    available: true,
    stock: 50,
    lowStockThreshold: 10,
  },
  {
    id: '2',
    name: 'Cheese Overload Fries',
    price: 3.5,
    category: 'fries',
    image: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?w=400&h=400&fit=crop',
    available: true,
    stock: 30,
    lowStockThreshold: 5,
  },
  {
    id: '3',
    name: 'Spicy BBQ Fries',
    price: 3.2,
    category: 'fries',
    image: 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=400&h=400&fit=crop',
    available: true,
    stock: 40,
    lowStockThreshold: 8,
  },
  {
    id: '4',
    name: 'Truffle Parmesan Fries',
    price: 4.5,
    category: 'fries',
    image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=400&fit=crop',
    available: true,
    stock: 20,
    lowStockThreshold: 5,
  },
  {
    id: '5',
    name: 'Iced Lemon Tea',
    price: 1.8,
    category: 'drinks',
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop',
    available: true,
    stock: 100,
    lowStockThreshold: 20,
  },
  {
    id: '6',
    name: 'Fresh Orange Juice',
    price: 2.2,
    category: 'drinks',
    image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=400&h=400&fit=crop',
    available: true,
    stock: 60,
    lowStockThreshold: 15,
  },
  {
    id: '7',
    name: 'Extra Cheese Sauce',
    price: 0.5,
    category: 'add-ons',
    image: 'https://images.unsplash.com/photo-1528750955925-53f5892bc8b2?w=400&h=400&fit=crop',
    available: true,
    stock: 200,
    lowStockThreshold: 30,
  },
  {
    id: '8',
    name: 'Family Combo',
    price: 12.0,
    category: 'combos',
    image: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=400&h=400&fit=crop',
    available: true,
    stock: 15,
    lowStockThreshold: 3,
  },
];

export const INITIAL_USERS: User[] = [
  { id: '1', name: 'Admin User', email: 'admin@fries.com', role: 'admin' },
  { id: '2', name: 'Manager Mike', email: 'mike@fries.com', role: 'manager' },
  { id: '3', name: 'Cashier Cathy', email: 'cathy@fries.com', role: 'cashier' },
];
