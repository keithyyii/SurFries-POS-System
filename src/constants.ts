/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product, User, Category, Ingredient, Promotion } from './types';

export const CATEGORIES: { id: Category; name: string; icon: string }[] = [
  { id: 'fries', name: 'Fries', icon: '🍟' },
  { id: 'drinks', name: 'Drinks', icon: '🥤' },
  { id: 'add-ons', name: 'Add-ons', icon: '🧂' },
  { id: 'combos', name: 'Combos', icon: '🍱' },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Classic Salted Fries (M)',
    price: 2.5,
    cost: 1.0,
    category: 'fries',
    size: 'medium',
    flavor: 'classic',
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=400&fit=crop',
    available: true,
    stock: 50,
    lowStockThreshold: 10,
    salesVelocity: 'fast',
    ingredients: [
      { name: 'Potatoes', quantity: 1, unit: 'bag' },
      { name: 'Salt', quantity: 0.01, unit: 'kg' },
      { name: 'Paper Box', quantity: 1, unit: 'pcs' }
    ]
  },
  {
    id: '2',
    name: 'Cheese Overload Fries (L)',
    price: 3.5,
    cost: 1.5,
    category: 'fries',
    size: 'large',
    flavor: 'cheese',
    image: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?w=400&h=400&fit=crop',
    available: true,
    stock: 30,
    lowStockThreshold: 5,
    salesVelocity: 'fast',
    ingredients: [
      { name: 'Potatoes', quantity: 1, unit: 'bag' },
      { name: 'Cheese Sauce', quantity: 0.1, unit: 'L' },
      { name: 'Paper Box', quantity: 1, unit: 'pcs' }
    ]
  },
  {
    id: '3',
    name: 'Spicy BBQ Fries (S)',
    price: 3.2,
    cost: 1.2,
    category: 'fries',
    size: 'small',
    flavor: 'barbecue',
    image: 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=400&h=400&fit=crop',
    available: true,
    stock: 40,
    lowStockThreshold: 8,
    salesVelocity: 'normal',
  },
  {
    id: '4',
    name: 'Truffle Parmesan Fries (L)',
    price: 4.5,
    cost: 2.0,
    category: 'fries',
    size: 'large',
    flavor: 'classic',
    image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=400&fit=crop',
    available: true,
    stock: 20,
    lowStockThreshold: 5,
    salesVelocity: 'slow',
  },
  {
    id: '5',
    name: 'Iced Lemon Tea',
    price: 1.8,
    cost: 0.5,
    category: 'drinks',
    size: 'medium',
    flavor: 'none',
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop',
    available: true,
    stock: 100,
    lowStockThreshold: 20,
    salesVelocity: 'fast',
  },
  {
    id: '6',
    name: 'Fresh Orange Juice',
    price: 2.2,
    cost: 0.8,
    category: 'drinks',
    size: 'medium',
    flavor: 'none',
    image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=400&h=400&fit=crop',
    available: true,
    stock: 60,
    lowStockThreshold: 15,
    salesVelocity: 'normal',
  },
  {
    id: '7',
    name: 'Extra Cheese Sauce',
    price: 0.5,
    cost: 0.1,
    category: 'add-ons',
    size: 'none',
    flavor: 'cheese',
    image: 'https://images.unsplash.com/photo-1528750955925-53f5892bc8b2?w=400&h=400&fit=crop',
    available: true,
    stock: 200,
    lowStockThreshold: 30,
    salesVelocity: 'fast',
  },
  {
    id: '8',
    name: 'Family Combo',
    price: 12.0,
    cost: 5.0,
    category: 'combos',
    size: 'large',
    flavor: 'none',
    image: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=400&h=400&fit=crop',
    available: true,
    stock: 15,
    lowStockThreshold: 3,
    salesVelocity: 'normal',
  },
];

export const INITIAL_INGREDIENTS: Ingredient[] = [
  { id: 'i1', name: 'Potatoes', stock: 500, unit: 'kg', lowStockThreshold: 50, category: 'raw' },
  { id: 'i2', name: 'Salt', stock: 20, unit: 'kg', lowStockThreshold: 5, category: 'raw' },
  { id: 'i3', name: 'Cheese Sauce', stock: 10, unit: 'L', lowStockThreshold: 2, category: 'sauce' },
  { id: 'i4', name: 'BBQ Sauce', stock: 8, unit: 'L', lowStockThreshold: 2, category: 'sauce' },
  { id: 'i5', name: 'Paper Box', stock: 1000, unit: 'pcs', lowStockThreshold: 100, category: 'packaging' },
  { id: 'i6', name: 'Paper Cup', stock: 800, unit: 'pcs', lowStockThreshold: 100, category: 'packaging' },
];

export const INITIAL_USERS: User[] = [
  { id: '1', name: 'Admin User', email: 'admin@fries.com', role: 'admin', avatar: 'https://i.pravatar.cc/150?u=admin' },
  { id: '2', name: 'Manager Mike', email: 'mike@fries.com', role: 'manager', avatar: 'https://i.pravatar.cc/150?u=mike' },
  { id: '3', name: 'Cashier Cathy', email: 'cathy@fries.com', role: 'cashier', avatar: 'https://i.pravatar.cc/150?u=cathy' },
];

export const INITIAL_PROMOTIONS: Promotion[] = [
  { id: 'p1', code: 'WELCOME10', description: '10% off for new customers', discountType: 'percentage', value: 10, active: true },
  { id: 'p2', code: 'FRIESDAY', description: '$2 off on Fridays', discountType: 'fixed', value: 2, active: true },
];
