/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product, User, Category, Ingredient, Promotion, Role } from './types';

export const CATEGORIES: { id: Category; name: string; icon: string }[] = [
  { id: 'fries', name: 'Fries', icon: '🍟' },
  { id: 'drinks', name: 'Drinks', icon: '🥤' },
  { id: 'add-ons', name: 'Add-ons', icon: '🧂' },
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
    image_url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=400&fit=crop',
    available: true,
    stock: 50,
    low_stock_threshold: 10,
    sales_velocity: 'fast',
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
    image_url: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?w=400&h=400&fit=crop',
    available: true,
    stock: 30,
    low_stock_threshold: 5,
    sales_velocity: 'fast',
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
    image_url: 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=400&h=400&fit=crop',
    available: true,
    stock: 40,
    low_stock_threshold: 8,
    sales_velocity: 'normal',
    ingredients: []
  },
  {
    id: '4',
    name: 'Truffle Parmesan Fries (L)',
    price: 4.5,
    cost: 2.0,
    category: 'fries',
    size: 'large',
    flavor: 'classic',
    image_url: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=400&fit=crop',
    available: true,
    stock: 20,
    low_stock_threshold: 5,
    sales_velocity: 'slow',
    ingredients: []
  },
  {
    id: '5',
    name: 'Iced Lemon Tea',
    price: 35,
    cost: 0.5,
    category: 'drinks',
    size: 'medium',
    flavor: 'none',
    image_url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop',
    available: true,
    stock: 100,
    low_stock_threshold: 20,
    sales_velocity: 'fast',
    ingredients: []
  },
  {
    id: '6',
    name: 'Fresh Orange Juice',
    price: 30,
    cost: 0.8,
    category: 'drinks',
    size: 'medium',
    flavor: 'none',
    image_url: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=400&h=400&fit=crop',
    available: true,
    stock: 60,
    low_stock_threshold: 15,
    sales_velocity: 'normal',
    ingredients: []
  },
  {
    id: '8',
    name: 'Hashbrown',
    price: 1.5,
    cost: 0.6,
    category: 'add-ons',
    size: 'none',
    flavor: 'none',
    image_url: 'https://images.unsplash.com/photo-1518013431117-eb1465fa5752?w=400&h=400&fit=crop',
    available: true,
    stock: 80,
    low_stock_threshold: 15,
    sales_velocity: 'normal',
    ingredients: []
  },
  {
    id: '9',
    name: 'Chicken Poppers',
    price: 2.8,
    cost: 1.2,
    category: 'add-ons',
    size: 'none',
    flavor: 'none',
    image_url: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&h=400&fit=crop',
    available: true,
    stock: 60,
    low_stock_threshold: 12,
    sales_velocity: 'fast',
    ingredients: []
  },
];

export const INITIAL_INGREDIENTS: Ingredient[] = [
  { id: 'i1', name: 'Potatoes', stock: 500, unit: 'kg', low_stock_threshold: 50, category: 'raw' },
  { id: 'i2', name: 'Salt', stock: 20, unit: 'kg', low_stock_threshold: 5, category: 'raw' },
  { id: 'i3', name: 'Cheese Sauce', stock: 10, unit: 'L', low_stock_threshold: 2, category: 'sauce' },
  { id: 'i4', name: 'BBQ Sauce', stock: 8, unit: 'L', low_stock_threshold: 2, category: 'sauce' },
  { id: 'i5', name: 'Paper Box', stock: 1000, unit: 'pcs', low_stock_threshold: 100, category: 'packaging' },
  { id: 'i6', name: 'Paper Cup', stock: 800, unit: 'pcs', low_stock_threshold: 100, category: 'packaging' },
];

export const INITIAL_USERS: User[] = [
  { id: '1', auth_user_id: '', name: 'Admin User', email: 'admin@fries.com', role: 'manager' as Role, avatar_url: 'https://i.pravatar.cc/150?u=admin' },
  { id: '2', auth_user_id: '', name: 'Manager Mike', email: 'mike@fries.com', role: 'manager', avatar_url: 'https://i.pravatar.cc/150?u=mike' },
  { id: '3', auth_user_id: '', name: 'Cashier Cathy', email: 'cathy@fries.com', role: 'cashier', avatar_url: 'https://i.pravatar.cc/150?u=cathy' },
];

export const INITIAL_PROMOTIONS: Promotion[] = [
  { id: 'p1', code: 'WELCOME10', description: '10% off for new customers', discount_type: 'percentage', value: 10, active: true },
  { id: 'p2', code: 'FRIESDAY', description: '₱2 off on Fridays', discount_type: 'fixed', value: 2, active: true },
];

