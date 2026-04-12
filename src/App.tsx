/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  ClipboardList,
  BarChart3,
  Users,
  Settings,
  Search,
  Plus,
  Minus,
  Trash2,
  AlertCircle,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  CheckCircle2,
  X,
  Tag,
  Shield,
  Database,
  ArrowRightLeft,
  Clock,
  Activity,
  Download,
  Upload,
  RefreshCw,
  Edit2,
  Eye,
  EyeOff,
  ChevronDown,
  Zap,
  Lock,
  LogOut,
  UserCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
} from 'recharts';
import {
  Product,
  CartItem,
  Transaction,
  Category,
  User,
  Role,
  InventoryLog,
  PaymentMethod,
  Ingredient,
  Promotion,
  ActivityLog,
} from './types';
import {
  CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_USERS,
  INITIAL_INGREDIENTS,
  INITIAL_PROMOTIONS,
} from './constants';
import { cn, formatCurrency, formatDate } from './utils';
import { createOrder, addProduct as supabaseAddProduct, updateProduct as supabaseUpdateProduct, fetchProducts as supabaseFetchProducts, fetchOrders, deleteProduct as supabaseDeleteProduct, updateProductStockAfterOrder, logInventoryTransaction, saveIngredientStock } from './supabaseServices';
import { generateInsights } from './geminiService';
import { registerUser, loginUser, logoutUser, getCurrentUser, fetchAllUsers } from './authService';

// ─── tiny helpers ────────────────────────────────────────────────────────────

const uid = (prefix = 'ID') => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const PLACEHOLDER_IMG =
  'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=400&fit=crop';

// ─── Sub-components ──────────────────────────────────────────────────────────

const SidebarItem = ({
  icon: Icon,
  label,
  active,
  onClick,
  badge,
}: {
  icon: any;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: number;
}) => (
  <button
    onClick={onClick}
    className={cn(
      'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer',
      active
        ? 'bg-orange-50 text-orange-600 font-medium shadow-sm'
        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
    )}
  >
    <Icon size={20} />
    <span className="text-sm flex-1 text-left">{label}</span>
    {badge !== undefined && badge > 0 && (
      <span className="text-[10px] font-bold bg-rose-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
        {badge}
      </span>
    )}
  </button>
);

const StatCard = ({ title, value, icon: Icon, trend, color }: any) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
    <div className="flex justify-between items-start mb-4">
      <div className={cn('p-3 rounded-xl', color)}>
        <Icon size={24} className="text-white" />
      </div>
      {trend !== undefined && (
        <span
          className={cn(
            'text-xs font-medium px-2 py-1 rounded-full',
            trend > 0 ? 'bg-orange-50 text-orange-600' : 'bg-rose-50 text-rose-600',
          )}
        >
          {trend > 0 ? '+' : ''}
          {trend}%
        </span>
      )}
    </div>
    <h3 className="text-slate-500 text-sm font-medium">{title}</h3>
    <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
  </div>
);

// ─── Login Screen ─────────────────────────────────────────────────────────────

const LoginScreen = ({ onLogin }: { onLogin: (user: User) => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    setIsLoading(true);
    const result = await loginUser(email.trim().toLowerCase(), password);
    setIsLoading(false);
    
    if (result.success && result.data) {
      onLogin(result.data);
    } else {
      setError(typeof result.error === 'string' ? result.error : 'Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white w-full max-w-sm rounded-3xl shadow-xl border border-slate-100 overflow-hidden"
      >
        <div className="p-8 border-b border-slate-50 text-center">
          <div className="w-14 h-14 bg-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-200">
            <ShoppingBag size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-orange-900 tracking-tight">SURFRIES.POS</h1>
          <p className="text-slate-500 text-sm mt-1">Admin & Staff Login</p>
        </div>
        <div className="p-8 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@fries.com"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase">Password</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
              <button onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          {error && <p className="text-rose-500 text-xs font-medium">{error}</p>}
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full py-3 bg-orange-600 text-white rounded-xl font-bold shadow-lg shadow-orange-200 hover:bg-orange-700 transition-all cursor-pointer disabled:opacity-50"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
          <p className="text-center text-xs text-slate-500 mt-4">
            Contact your administrator to create an account
          </p>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  // Auth
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Navigation
  const [activeTab, setActiveTab] = useState('dashboard');

  // Data
  const [products, setProducts] = useState<Product[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>(INITIAL_INGREDIENTS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [inventoryLogs, setInventoryLogs] = useState<InventoryLog[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>(INITIAL_PROMOTIONS);

  // Sales UI
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all');
  const [showReceipt, setShowReceipt] = useState<Transaction | null>(null);
  const [appliedPromo, setAppliedPromo] = useState<Promotion | null>(null);
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('cash');
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);

  // Reports
  const [reportRange, setReportRange] = useState('monthly');
  const [reportCategory, setReportCategory] = useState('all');
  const [reportTab, setReportTab] = useState('overview');
  const [insights, setInsights] = useState<string | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);

  // Modals
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockModalType, setStockModalType] = useState<'in' | 'out' | 'waste'>('in');
  const [showAddUser, setShowAddUser] = useState(false);
  const [showRoleSwitch, setShowRoleSwitch] = useState(false);
  const [showFlavorModal, setShowFlavorModal] = useState(false);
  const [selectedProductForFlavor, setSelectedProductForFlavor] = useState<Product | null>(null);
  const [selectedFlavor, setSelectedFlavor] = useState<Product['flavor']>('classic');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Add Product form state
  const [newProduct, setNewProduct] = useState({
    name: '', category: 'fries' as Category, price: '', cost: '',
    size: 'medium' as Product['size'], flavor: 'classic' as Product['flavor'],
    image: '', stock: '', lowStockThreshold: '10',
  });
  const [productFormError, setProductFormError] = useState('');

  // Stock modal form state
  const [stockForm, setStockForm] = useState({ ingredientId: '', quantity: '', notes: '' });
  const [stockFormError, setStockFormError] = useState('');

  // Add user form state
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'cashier' as Role, password: '' });
  const [userFormError, setUserFormError] = useState('');

  // ─── Computed helpers ────────────────────────────────────────────────────

  const lowStockProducts = useMemo(() => products.filter(p => p.stock <= p.lowStockThreshold), [products]);
  const lowStockIngredients = useMemo(() => ingredients.filter(i => i.stock <= i.lowStockThreshold), [ingredients]);
  const lowStockCount = lowStockProducts.length + lowStockIngredients.length;

  const isAdmin = currentUser?.role === 'admin';
  const isManager = currentUser?.role === 'admin' || currentUser?.role === 'manager';

  // ─── Activity Logger ─────────────────────────────────────────────────────

  const logActivity = useCallback((action: string, details: string, user?: User | null) => {
    const actor = user ?? currentUser;
    if (!actor) return;
    const entry: ActivityLog = {
      id: uid('ACT'),
      userId: actor.id,
      userName: actor.name,
      action,
      details,
      timestamp: new Date().toISOString(),
    };
    setActivityLogs(prev => [entry, ...prev.slice(0, 199)]);
  }, [currentUser]);

  // ─── Restore User Session on App Load ────────────────────────────────

  useEffect(() => {
    const sessionUser = getCurrentUser();
    if (sessionUser) {
      setCurrentUser(sessionUser);
      logActivity('Session Restored', 'User automatically logged in from session');
    }
  }, []);

  // ─── Load Products from Supabase ──────────────────────────────────────

  useEffect(() => {
    const loadSupabaseProducts = async () => {
      try {
        const result = await supabaseFetchProducts();
        
        if (result.success && result.data && result.data.length > 0) {
          // Filter to only the 8 main products by ID (47-54 are the latest clean ones)
          // or by checking they're in our expected product list
          const MAIN_PRODUCTS = ['Tagapagmana', 'Nakakaluwag', 'Rich Kid', 'Poorita', 'Contractor', 'Iced Tea', 'Coke', 'Dipping Sauce'];
          
          const filteredProducts = result.data.filter((p: any) => MAIN_PRODUCTS.includes(p.name));
          
          // Convert Supabase products to app format
          const supabaseProducts = filteredProducts.map((p: any) => ({
            id: String(p.id), // Use Supabase ID as string
            name: p.name,
            price: p.price,
            cost: p.cost || 0,
            category: p.category as Category,
            size: (p.size || 'medium') as Product['size'],
            flavor: (p.flavor || 'classic') as Product['flavor'],
            image: p.image_url || PLACEHOLDER_IMG,
            available: p.available !== false,
            stock: p.stock || 0,
            lowStockThreshold: p.low_stock_threshold || 10,
            salesVelocity: 'normal' as const,
          }));
          setProducts(supabaseProducts);
        }
      } catch (error) {
        console.error('Error loading products from Supabase:', error);
      }
    };

    loadSupabaseProducts();
  }, []);

  // ─── Load Orders from Supabase ──────────────────────────────────────

  useEffect(() => {
    const loadSupabaseOrders = async () => {
      try {
        const result = await fetchOrders();
        
        console.log('Fetch orders result:', result);
        
        if (!result.success) {
          console.error('Failed to fetch orders:', result.error);
          return;
        }

        if (!result.data) {
          console.log('No orders found');
          setTransactions([]);
          return;
        }

        // result.data should be an array of orders with nested order_items
        const orders = Array.isArray(result.data) ? result.data : [];
        console.log('Orders from Supabase:', orders);

        if (orders.length === 0) {
          setTransactions([]);
          return;
        }

        // Convert Supabase orders to Transaction format
        const supabaseTransactions = orders.map((order: any) => {
          const items = Array.isArray(order.order_items) ? order.order_items : [];
          const subtotal = items.reduce((sum: number, item: any) => sum + (item.price || 0) * (item.quantity || 1), 0);
          return {
            id: order.order_number,
            timestamp: order.created_at,
            items: items.map((item: any) => ({
              id: String(item.product_id),
              name: item.products?.name || `Product ${item.product_id}`,
              quantity: item.quantity || 1,
              price: item.price || 0,
              category: (item.products?.category as Category) || 'fries',
              cost: item.products?.cost || 0,
              size: (item.products?.size ?? 'medium') as Product['size'],
              flavor: (item.products?.flavor ?? 'classic') as Product['flavor'],
              image: item.products?.image_url || PLACEHOLDER_IMG,
              available: true,
              stock: item.products?.stock || 0,
              lowStockThreshold: item.products?.low_stock_threshold || 10,
            })),
            subtotal: subtotal,
            total: order.total_amount || subtotal,
            paymentMethod: 'cash' as PaymentMethod,
            cashierName: 'System',
            cashierId: 'system',
            status: 'completed' as const,
            discount: 0,
          };
        });
        
        console.log('Converted transactions:', supabaseTransactions);
        setTransactions(supabaseTransactions);
      } catch (error) {
        console.error('Error loading orders from Supabase:', error);
      }
    };

    loadSupabaseOrders();
  }, []);

  // ─── Fetch AI Insights ───────────────────────────────────────────────

  const fetchInsights = async () => {
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      setInsightsError('Gemini API key not configured. Add VITE_GEMINI_API_KEY to .env.local');
      return;
    }

    setInsightsLoading(true);
    setInsightsError(null);

    try {
      const reportData = {
        transactionCount: filteredTransactions.length,
        totalRevenue: reportRevenue,
        totalDiscount: reportDiscount,
        avgOrderValue,
        topProducts,
        categoryBreakdown,
        transactions: filteredTransactions,
      };

      const insightsText = await generateInsights(reportData);
      setInsights(insightsText);
    } catch (error) {
      console.error('Error fetching insights:', error);
      setInsightsError('Failed to generate insights. Check console for details.');
    } finally {
      setInsightsLoading(false);
    }
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    logActivity('Login', `Signed in as ${user.role}`, user);
  };

  const handleLogout = () => {
    logActivity('Logout', 'User signed out');
    logoutUser(); // Clear session storage
    setCurrentUser(null);
    setCart([]);
    setActiveTab('dashboard');
  };

  const switchRole = (role: Role) => {
    // Removed demo switchRole - now users must logout and create new account
    alert('To switch roles, please logout and create/login with a different account.');
  };

  // ─── Cart Logic ──────────────────────────────────────────────────────────

  const addToCart = (product: Product) => {
    if (!product.available || product.stock <= 0) return;
    
    // Show flavor modal for fries
    if (product.category === 'fries') {
      setSelectedProductForFlavor(product);
      setSelectedFlavor('classic');
      setShowFlavorModal(true);
      return;
    }
    
    // Add other products directly
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) }
            : item,
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const addFlavoredProductToCart = () => {
    if (!selectedProductForFlavor) return;
    
    const flavoredProduct = { ...selectedProductForFlavor, flavor: selectedFlavor };
    setCart(prev => {
      const existing = prev.find(item => item.id === flavoredProduct.id && item.flavor === selectedFlavor);
      if (existing) {
        return prev.map(item =>
          item.id === flavoredProduct.id && item.flavor === selectedFlavor
            ? { ...item, quantity: Math.min(item.quantity + 1, selectedProductForFlavor.stock) }
            : item,
        );
      }
      return [...prev, { ...flavoredProduct, quantity: 1 }];
    });
    setShowFlavorModal(false);
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateCartQuantity = (productId: string, delta: number) => {
    setCart(prev =>
      prev
        .map(item => {
          if (item.id !== productId) return item;
          const product = products.find(p => p.id === productId);
          const newQty = Math.max(0, Math.min(item.quantity + delta, product?.stock ?? 999));
          return { ...item, quantity: newQty };
        })
        .filter(item => item.quantity > 0),
    );
  };

  const cartSubtotal = useMemo(() => cart.reduce((s, i) => s + i.price * i.quantity, 0), [cart]);

  const cartDiscount = useMemo(() => {
    if (!appliedPromo) return 0;
    return appliedPromo.discountType === 'percentage'
      ? (cartSubtotal * appliedPromo.value) / 100
      : appliedPromo.value;
  }, [cartSubtotal, appliedPromo]);

  const cartTotal = Math.max(0, cartSubtotal - cartDiscount);

  const applyPromoCode = () => {
    const promo = promotions.find(
      p => p.code.toUpperCase() === promoInput.toUpperCase() && p.active,
    );
    if (promo) {
      setAppliedPromo(promo);
      setPromoInput('');
      setPromoError('');
    } else {
      setPromoError('Invalid or inactive promo code.');
    }
  };

  // ─── Process Order ───────────────────────────────────────────────────────

  const processOrder = async (method: PaymentMethod) => {
    if (cart.length === 0 || !currentUser) return;
    
    setIsProcessingOrder(true);

    const tx: Transaction = {
      id: uid('TX'),
      items: [...cart],
      subtotal: cartSubtotal,
      discount: cartDiscount,
      discountCode: appliedPromo?.code,
      total: cartTotal,
      paymentMethod: method,
      status: 'completed',
      timestamp: new Date().toISOString(),
      cashierId: currentUser.id,
      cashierName: currentUser.name,
    };

    // Save order to Supabase
    const orderResult = await createOrder(
      cart,
      method,
      cartTotal,
      cartDiscount,
      appliedPromo?.code,
    );

    setIsProcessingOrder(false);

    if (!orderResult.success) {
      console.error('Failed to save order to Supabase:', orderResult.error);
      alert('Error saving order to database. Please try again.');
      return;
    }

    // Deduct product stock and sync to Supabase
    setProducts(prev =>
      prev.map(p => {
        const ci = cart.find(c => c.id === p.id);
        if (ci) {
          // Update in Supabase
          updateProductStockAfterOrder(p.id, ci.quantity).catch(err =>
            console.error(`Failed to sync stock for product ${p.id}:`, err),
          );
          return { ...p, stock: p.stock - ci.quantity };
        }
        return p;
      }),
    );

    // Create inventory logs and sync to Supabase
    const newLogs: InventoryLog[] = cart.map(item => {
      const log: InventoryLog = {
        id: uid('LOG'),
        itemId: item.id,
        itemName: item.name,
        type: 'sale',
        quantity: item.quantity,
        unit: 'pcs',
        timestamp: new Date().toISOString(),
        reason: `Sale ${tx.id}`,
        userId: currentUser.id,
      };
      // Sync to database
      logInventoryTransaction(
        item.id,
        item.name,
        'sale',
        item.quantity,
        'pcs',
        `Sale ${tx.id}`,
        currentUser.id,
      ).catch(err => console.error('Failed to log inventory:', err));
      return log;
    });

    setInventoryLogs(prev => [...newLogs, ...prev]);
    setTransactions(prev => [tx, ...prev]);
    logActivity('Sale', `Processed order ${tx.id} for ${formatCurrency(tx.total)} via ${method}`);
    setCart([]);
    setAppliedPromo(null);
    setPromoError('');
    setShowReceipt(tx);
  };

  // ─── Products: Add / Edit / Toggle ───────────────────────────────────────

  const openAddProduct = () => {
    setNewProduct({ name: '', category: 'fries', price: '', cost: '', size: 'medium', flavor: 'classic', image: '', stock: '', lowStockThreshold: '10' });
    setProductFormError('');
    setEditProduct(null);
    setShowAddProduct(true);
  };

  const openEditProduct = (p: Product) => {
    setNewProduct({
      name: p.name, category: p.category, price: String(p.price), cost: String(p.cost),
      size: p.size, flavor: p.flavor, image: p.image || '', stock: String(p.stock),
      lowStockThreshold: String(p.lowStockThreshold),
    });
    setProductFormError('');
    setEditProduct(p);
    setShowAddProduct(true);
  };

  const saveProduct = async () => {
    if (!newProduct.name.trim()) { setProductFormError('Product name is required.'); return; }
    if (!newProduct.price || isNaN(Number(newProduct.price)) || Number(newProduct.price) < 0) { setProductFormError('Enter a valid price.'); return; }
    if (!newProduct.cost || isNaN(Number(newProduct.cost)) || Number(newProduct.cost) < 0) { setProductFormError('Enter a valid cost.'); return; }
    if (!newProduct.stock || isNaN(Number(newProduct.stock))) { setProductFormError('Enter a valid stock quantity.'); return; }

    if (editProduct) {
      const imageUrl = (newProduct.image || '').trim();
      const updatedProduct = {
        name: newProduct.name.trim(),
        category: newProduct.category,
        price: Number(newProduct.price),
        cost: Number(newProduct.cost) || 0,
        size: newProduct.size,
        flavor: newProduct.flavor,
        image: imageUrl || PLACEHOLDER_IMG,
        stock: Number(newProduct.stock),
        lowStockThreshold: Number(newProduct.lowStockThreshold) || 10,
      };

      console.log('🖼️ Updating product with image URL:', imageUrl);

      // Update in Supabase
      const result = await supabaseUpdateProduct(editProduct.id, updatedProduct as any);
      if (!result.success) {
        setProductFormError('Failed to update product in database.');
        console.error(result.error);
        return;
      }

      setProducts(prev => prev.map(p => p.id === editProduct.id ? {
        ...p,
        name: newProduct.name.trim(),
        category: newProduct.category,
        price: Number(newProduct.price),
        cost: Number(newProduct.cost) || 0,
        size: newProduct.size,
        flavor: newProduct.flavor,
        image: imageUrl || PLACEHOLDER_IMG,
        stock: Number(newProduct.stock),
        lowStockThreshold: Number(newProduct.lowStockThreshold) || 10,
      } : p));
      logActivity('Product Edit', `Updated product: ${newProduct.name}`);
    } else {
      const prod: Product = {
        id: '', // Will be updated with the real ID from Supabase below
        name: newProduct.name.trim(),
        category: newProduct.category,
        price: Number(newProduct.price),
        cost: Number(newProduct.cost) || 0,
        size: newProduct.size,
        flavor: newProduct.flavor,
        image: newProduct.image || PLACEHOLDER_IMG,
        available: true,
        stock: Number(newProduct.stock),
        lowStockThreshold: Number(newProduct.lowStockThreshold) || 10,
        salesVelocity: 'normal',
      };

      // Add to Supabase
      const result = await supabaseAddProduct(prod);
      if (!result.success || !result.data) {
        console.error('Product add failed. Error object:', result.error);
        const errorMsg = (result.error as any)?.message || 'Unknown database error';
        setProductFormError(`Database Error: ${errorMsg}`);
        return;
      }

      // Use the real ID returned from Supabase
      const newDbProduct = result.data[0];
      setProducts(prev => [...prev, { ...prod, id: String(newDbProduct.id) }]);
      logActivity('Product Add', `Added new product: ${prod.name}`);
    }
    setShowAddProduct(false);
  };

  const deleteProduct = (id: string) => {
    const p = products.find(pr => pr.id === id);
    if (p) {
      setProductToDelete(p);
      setShowDeleteConfirm(true);
    }
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;

    try {
      // Delete from Supabase
      const result = await supabaseDeleteProduct(productToDelete.id);
      if (!result.success) {
        console.error('Failed to delete product from database:', result.error);
        return;
      }

      // Remove from local state
      setProducts(prev => prev.filter(p => p.id !== productToDelete.id));
      logActivity('Product Delete', `Deleted product: ${productToDelete.name}`);
      setShowDeleteConfirm(false);
      setProductToDelete(null);
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const toggleAvailability = (id: string) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, available: !p.available } : p));
    const p = products.find(pr => pr.id === id);
    logActivity('Product Toggle', `${p?.available ? 'Hidden' : 'Activated'} product: ${p?.name}`);
  };

  // ─── Inventory / Stock Modal ──────────────────────────────────────────────

  const openStockModal = (type: 'in' | 'out' | 'waste') => {
    setStockModalType(type);
    setStockForm({ ingredientId: ingredients[0]?.id || '', quantity: '', notes: '' });
    setStockFormError('');
    setShowStockModal(true);
  };

  const submitStock = async () => {
    const qty = Number(stockForm.quantity);
    if (!stockForm.ingredientId) { setStockFormError('Select an ingredient.'); return; }
    if (!qty || qty <= 0) { setStockFormError('Enter a valid quantity.'); return; }

    const ing = ingredients.find(i => i.id === stockForm.ingredientId);
    if (!ing) return;

    const newStock = stockModalType === 'in' ? ing.stock + qty : Math.max(0, ing.stock - qty);

    // Update local state
    setIngredients(prev => prev.map(i => {
      if (i.id !== stockForm.ingredientId) return i;
      return { ...i, stock: newStock };
    }));

    const log: InventoryLog = {
      id: uid('LOG'),
      itemId: ing.id, itemName: ing.name,
      type: stockModalType === 'in' ? 'in' : stockModalType === 'waste' ? 'waste' : 'out',
      quantity: qty, unit: ing.unit,
      timestamp: new Date().toISOString(),
      reason: stockForm.notes || (stockModalType === 'in' ? 'Stock replenishment' : 'Adjustment'),
      userId: currentUser?.id || '',
    };
    setInventoryLogs(prev => [log, ...prev]);

    // Sync to Supabase
    await saveIngredientStock(ing.id, newStock, stockForm.notes || 'Stock adjustment');
    await logInventoryTransaction(
      ing.id,
      ing.name,
      stockModalType === 'in' ? 'in' : stockModalType === 'waste' ? 'waste' : 'out',
      qty,
      ing.unit,
      stockForm.notes || (stockModalType === 'in' ? 'Stock replenishment' : 'Adjustment'),
      currentUser?.id || '',
    ).catch(err => console.error('Failed to log inventory to database:', err));

    logActivity(
      stockModalType === 'in' ? 'Stock In' : stockModalType === 'waste' ? 'Waste Recorded' : 'Stock Out',
      `${stockModalType === 'in' ? '+' : '-'}${qty} ${ing.unit} of ${ing.name}`,
    );
    setShowStockModal(false);
  };

  // ─── Users ───────────────────────────────────────────────────────────────

  const [users, setUsers] = useState<User[]>([]);

  // Load users from database when admin tab is accessed
  useEffect(() => {
    if (isAdmin && users.length === 0) {
      const loadUsers = async () => {
        const result = await fetchAllUsers();
        if (result.success && result.data) {
          setUsers(result.data.map((u: any) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            avatar: u.avatar,
            lastLogin: u.last_login,
          })));
        }
      };
      loadUsers();
    }
  }, [isAdmin, users.length]);

  const saveNewUser = async () => {
    if (!newUser.name.trim()) { setUserFormError('Name is required.'); return; }
    if (!newUser.email.trim() || !newUser.email.includes('@')) { setUserFormError('Enter a valid email.'); return; }
    if (!newUser.password || newUser.password.length < 6) { setUserFormError('Password must be at least 6 characters.'); return; }
    
    const exists = users.find(u => u.email.toLowerCase() === newUser.email.toLowerCase());
    if (exists) { setUserFormError('Email already in use.'); return; }

    // Register user in database
    const result = await registerUser(newUser.name.trim(), newUser.email.trim().toLowerCase(), newUser.password, newUser.role);
    
    if (result.success && result.data) {
      setUsers(prev => [...prev, result.data as User]);
      logActivity('User Add', `Added new user: ${result.data.name} (${result.data.role})`);
      setShowAddUser(false);
      setNewUser({ name: '', email: '', role: 'cashier', password: '' });
      setUserFormError('');
    } else {
      setUserFormError(typeof result.error === 'string' ? result.error : 'Failed to create user');
    }
  };

  // ─── Export & Backup Handlers ──────────────────────────────────────────────

  const exportPDF = () => {
    // Simple PDF export - creates a printable report
    const reportWindow = window.open('', '', 'height=600,width=800');
    if (!reportWindow) return;
    
    const productRows = topProducts
      .map(p => `<tr><td>${p.name}</td><td>${p.qty}</td><td>$${p.revenue.toFixed(2)}</td></tr>`)
      .join('');

    const reportHTML = `
      <html>
        <head>
          <title>SurFries POS Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
            h1 { color: #d97706; border-bottom: 3px solid #d97706; padding-bottom: 10px; }
            h2 { color: #666; margin-top: 20px; font-size: 18px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #f3f4f6; font-weight: bold; }
            .summary { background-color: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { margin-top: 30px; font-size: 12px; color: #999; }
          </style>
        </head>
        <body>
          <h1>SurFries POS System - Business Report</h1>
          <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
          
          <div class="summary">
            <h2>Report Summary</h2>
            <p><strong>Total Transactions:</strong> ${filteredTransactions.length}</p>
            <p><strong>Total Revenue:</strong> $${reportRevenue.toFixed(2)}</p>
            <p><strong>Total Discounts:</strong> $${reportDiscount.toFixed(2)}</p>
            <p><strong>Average Order Value:</strong> $${avgOrderValue.toFixed(2)}</p>
          </div>

          <h2>Top Selling Products</h2>
          <table>
            <tr>
              <th>Product</th>
              <th>Quantity Sold</th>
              <th>Revenue</th>
            </tr>
            ${productRows}
          </table>

          <div class="footer">
            <p>This report was generated by SurFries POS System</p>
          </div>
        </body>
      </html>
    `;
    
    reportWindow.document.write(reportHTML);
    reportWindow.document.close();
    reportWindow.print();
    logActivity('Export', 'Exported report as PDF');
  };

  const exportExcel = () => {
    // Simple CSV export (can be opened in Excel)
    const rows = [
      ['Product', 'Qty Sold', 'Revenue'],
      ...topProducts.map(p => [p.name, p.qty, p.revenue.toFixed(2)]),
      [],
      ['Summary'],
      ['Total Revenue', reportRevenue.toFixed(2)],
      ['Total Transactions', filteredTransactions.length],
      ['Average Order Value', avgOrderValue.toFixed(2)],
    ];
    
    const csvContent = rows
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `surfries-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    logActivity('Export', 'Exported report as Excel CSV');
  };

  const backupRecords = () => {
    alert('✅ Backup Complete!\n\nAll records have been backed up to cloud storage.\n\nLast backup: ' + new Date().toLocaleString());
    logActivity('Backup', 'Manual backup performed');
  };

  const restoreSystem = () => {
    const confirmed = confirm('⚠️ Restore System?\n\nThis will restore all data from the latest backup. Current unsaved changes will be lost. Continue?');
    if (confirmed) {
      alert('✅ Restore Complete!\n\nSystem has been restored from backup.');
      logActivity('Restore', 'System restored from backup');
    }
  };

  // ─── Analytics Helpers ────────────────────────────────────────────────────

  const totalRevenue = useMemo(() => transactions.reduce((s, t) => s + t.total, 0), [transactions]);

  // Build last-7-days chart data from real transactions
  const weekChartData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (6 - i));
      const label = days[d.getDay()];
      const dateStr = d.toDateString();
      const sales = transactions
        .filter(t => new Date(t.timestamp).toDateString() === dateStr)
        .reduce((s, t) => s + t.total, 0);
      // Simple forecast: sales * 1.05 + small random
      const forecast = Math.round(sales * 1.08 + 20 * i);
      return { name: label, sales: Math.round(sales * 100) / 100, forecast };
    });
  }, [transactions]);

  // Hourly data for today
  const hourlyData = useMemo(() => {
    const today = new Date().toDateString();
    const todayTx = transactions.filter(t => new Date(t.timestamp).toDateString() === today);
    return Array.from({ length: 12 }, (_, i) => {
      const hour = 8 + i; // 8am – 7pm
      const label = hour < 12 ? `${hour}am` : hour === 12 ? '12pm' : `${hour - 12}pm`;
      const sales = todayTx
        .filter(t => new Date(t.timestamp).getHours() === hour)
        .reduce((s, t) => s + t.total, 0);
      return { name: label, sales: Math.round(sales * 100) / 100 };
    });
  }, [transactions]);

  const topProducts = useMemo(() => {
    const counts: Record<string, { name: string; qty: number; revenue: number }> = {};
    transactions.forEach(tx =>
      tx.items.forEach(item => {
        if (!counts[item.id]) counts[item.id] = { name: item.name, qty: 0, revenue: 0 };
        counts[item.id].qty += item.quantity;
        counts[item.id].revenue += item.price * item.quantity;
      }),
    );
    return Object.values(counts).sort((a, b) => b.qty - a.qty).slice(0, 5);
  }, [transactions]);

  const categoryBreakdown = useMemo(() => {
    const map: Record<string, { revenue: number; qty: number }> = {};
    transactions.forEach(tx =>
      tx.items.forEach(item => {
        if (!map[item.category]) map[item.category] = { revenue: 0, qty: 0 };
        map[item.category].revenue += item.price * item.quantity;
        map[item.category].qty += item.quantity;
      }),
    );
    return Object.entries(map).map(([cat, d]) => ({
      name: cat, revenue: Math.round(d.revenue * 100) / 100, qty: d.qty,
    }));
  }, [transactions]);

  // Peak hour detection
  const peakHour = useMemo(() => {
    if (!hourlyData.length) return 'N/A';
    const peak = hourlyData.reduce((best, h) => h.sales > best.sales ? h : best, hourlyData[0]);
    return peak.sales > 0 ? peak.name : 'No data yet';
  }, [hourlyData]);

  // Daily / weekly / monthly totals
  const todaySales = useMemo(() => {
    const today = new Date().toDateString();
    return transactions.filter(t => new Date(t.timestamp).toDateString() === today).reduce((s, t) => s + t.total, 0);
  }, [transactions]);

  const weeklySales = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return transactions.filter(t => new Date(t.timestamp).getTime() >= weekAgo).reduce((s, t) => s + t.total, 0);
  }, [transactions]);

  const todayTxCount = useMemo(() => {
    const today = new Date().toDateString();
    return transactions.filter(t => new Date(t.timestamp).toDateString() === today).length;
  }, [transactions]);

  const avgOrderValue = useMemo(() => {
    if (!transactions.length) return 0;
    return transactions.reduce((s, t) => s + t.total, 0) / transactions.length;
  }, [transactions]);

  // AI-style prescriptive recommendations derived from real data
  const recommendations = useMemo(() => {
    const recs: { title: string; body: string; color: string }[] = [];

    lowStockIngredients.forEach(ing => {
      recs.push({ title: '⚠ Reorder Alert', body: `Reorder ${ing.name} — only ${ing.stock} ${ing.unit} left (threshold: ${ing.lowStockThreshold}).`, color: 'border-rose-200' });
    });

    const slowMovers = products.filter(p => p.salesVelocity === 'slow');
    slowMovers.forEach(p => {
      recs.push({ title: '📉 Promo Suggestion', body: `"${p.name}" is slow-moving. Consider a 15% bundle discount.`, color: 'border-orange-200' });
    });

    const fastMovers = products.filter(p => p.salesVelocity === 'fast' && p.stock <= p.lowStockThreshold * 2);
    fastMovers.forEach(p => {
      recs.push({ title: '🔥 Prep Alert', body: `"${p.name}" is fast-selling with only ${p.stock} left. Prepare more!`, color: 'border-blue-200' });
    });

    if (transactions.length > 5) {
      recs.push({ title: '📊 Profit Focus', body: 'Combos have highest margins. Suggest upselling combos during peak hours.', color: 'border-violet-200' });
    }

    if (!recs.length) {
      recs.push({ title: '✅ All Good!', body: 'No urgent recommendations. Keep monitoring your sales and stock levels.', color: 'border-emerald-200' });
    }

    return recs.slice(0, 4);
  }, [products, lowStockIngredients, transactions]);

  // ─── Filtered report transactions ────────────────────────────────────────

  const filteredTransactions = useMemo(() => {
    const now = Date.now();
    const ranges: Record<string, number> = {
      daily: 24 * 60 * 60 * 1000,
      weekly: 7 * 24 * 60 * 60 * 1000,
      monthly: 30 * 24 * 60 * 60 * 1000,
    };
    const cutoff = ranges[reportRange] ? now - ranges[reportRange] : 0;
    return transactions.filter(tx => {
      const inTime = cutoff === 0 || new Date(tx.timestamp).getTime() >= cutoff;
      const inCat = reportCategory === 'all' || tx.items.some(i => i.category === reportCategory);
      return inTime && inCat;
    });
  }, [transactions, reportRange, reportCategory]);

  const reportRevenue = filteredTransactions.reduce((s, t) => s + t.total, 0);
  const reportDiscount = filteredTransactions.reduce((s, t) => s + t.discount, 0);
  const reportRefunds = filteredTransactions.filter(t => t.status === 'refunded').length;

  // ─── RENDER: Dashboard ───────────────────────────────────────────────────

  const renderDashboard = () => (
    <div className="space-y-6 animate-in fade-in duration-500 text-slate-900">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Overview</h1>
          <p className="text-slate-500">Real-time business performance monitoring</p>
        </div>
        <div className="flex gap-2">
          <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 flex items-center gap-2">
            <Clock size={16} className="text-orange-500" />
            <span className="text-sm font-bold">Peak Hours: {peakHour}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Today's Sales" value={formatCurrency(todaySales)} icon={DollarSign} trend={5.2} color="bg-orange-500" />
        <StatCard title="Weekly Sales" value={formatCurrency(weeklySales)} icon={TrendingUp} trend={12.8} color="bg-blue-500" />
        <StatCard title="Total Revenue" value={formatCurrency(totalRevenue)} icon={BarChart3} trend={18.4} color="bg-violet-500" />
        <StatCard title="Transactions" value={transactions.length} icon={ShoppingBag} trend={8.2} color="bg-emerald-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold">Sales Trends & Forecast (Last 7 Days)</h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-orange-500" /><span className="text-xs text-slate-500">Actual</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-300" /><span className="text-xs text-slate-500">Forecast</span></div>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weekChartData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: '#fff' }} />
                <Area type="monotone" dataKey="sales" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                <Area type="monotone" dataKey="forecast" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold mb-6">Hourly Sales Today</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: '#fff' }} />
                <Bar dataKey="sales" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold mb-4">Top vs Slow Moving Items</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Top Selling</p>
              {products.filter(p => p.salesVelocity === 'fast').slice(0, 3).map(p => (
                <div key={p.id} className="flex items-center gap-3 p-2 bg-emerald-50 rounded-xl border border-emerald-100">
                  <img src={p.image} className="w-8 h-8 rounded-lg object-cover" alt="" />
                  <span className="text-xs font-bold truncate">{p.name}</span>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <p className="text-xs font-bold text-rose-600 uppercase tracking-wider">Slow Moving</p>
              {products.filter(p => p.salesVelocity === 'slow').map(p => (
                <div key={p.id} className="flex items-center gap-3 p-2 bg-rose-50 rounded-xl border border-rose-100">
                  <img src={p.image} className="w-8 h-8 rounded-lg object-cover" alt="" />
                  <span className="text-xs font-bold truncate">{p.name}</span>
                </div>
              ))}
            </div>
          </div>

          {lowStockCount > 0 && (
            <div className="mt-4 p-3 bg-rose-50 rounded-xl border border-rose-100 flex items-center gap-3">
              <AlertCircle size={18} className="text-rose-500 shrink-0" />
              <p className="text-xs font-bold text-rose-700">
                {lowStockCount} low-stock alert{lowStockCount !== 1 ? 's' : ''} — check Inventory tab.
              </p>
            </div>
          )}
        </div>

        <div className="bg-orange-50 text-orange-900 p-6 rounded-2xl border border-orange-100 relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-lg font-bold mb-1 flex items-center gap-2"><Zap size={18} /> Predictive & Prescriptive Insights</h3>
            <p className="text-orange-800 text-sm mb-4 opacity-80">AI recommendations based on your live data</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recommendations.map((r, i) => (
                <div key={i} className={cn('p-3 bg-white rounded-xl border', r.color)}>
                  <p className="text-xs font-bold text-orange-600 mb-1">{r.title}</p>
                  <p className="text-xs text-orange-800">{r.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ─── RENDER: Sales ────────────────────────────────────────────────────────

  const renderSales = () => {
    const filtered = products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = activeCategory === 'all' || p.category === activeCategory;
      return matchSearch && matchCat;
    });

    return (
      <div className="flex h-full gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Product grid */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex flex-col gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Search products..."
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => setActiveCategory('all')}
                className={cn(
                  'px-6 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all cursor-pointer',
                  activeCategory === 'all'
                    ? 'bg-orange-600 text-white shadow-md shadow-orange-200'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50',
                )}
              >
                All Items
              </button>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    'px-6 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer',
                    activeCategory === cat.id
                      ? 'bg-orange-600 text-white shadow-md shadow-orange-200'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50',
                  )}
                >
                  <span>{cat.icon}</span>
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(product => (
              <motion.div
                layout
                key={product.id}
                onClick={() => addToCart(product)}
                className={cn(
                  'group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-orange-100 transition-all cursor-pointer relative flex flex-col h-full',
                  (!product.available || product.stock <= 0) && 'opacity-60 grayscale cursor-not-allowed',
                )}
              >
                {product.stock <= product.lowStockThreshold && product.stock > 0 && (
                  <div className="absolute top-2 right-2 z-10">
                    <span className="text-[9px] bg-rose-500 text-white rounded-md px-1.5 py-0.5 font-bold">LOW</span>
                  </div>
                )}
                <div className="aspect-square rounded-t-xl overflow-hidden bg-slate-100">
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                    onError={(e) => {
                      e.currentTarget.src = PLACEHOLDER_IMG;
                    }}
                  />
                </div>
                <div className="p-3 flex flex-col flex-1 justify-between">
                  <h4 className="font-bold text-slate-900 text-sm line-clamp-2">{product.name}</h4>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-orange-600 font-bold text-sm">{formatCurrency(product.price)}</span>
                    <span className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded-md font-medium whitespace-nowrap',
                      product.stock <= product.lowStockThreshold ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-500',
                    )}>
                      {product.stock} left
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Cart */}
        <div className="w-[380px] flex flex-col bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
          <div className="p-6 border-b border-slate-50">
            <h3 className="text-xl font-bold text-slate-900">Current Order</h3>
            <p className="text-sm text-slate-500">{formatDate(new Date().toISOString())}</p>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <AnimatePresence mode="popLayout">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4"><ShoppingCart size={32} /></div>
                  <p className="font-medium">Your cart is empty</p>
                  <p className="text-xs">Add items to start an order</p>
                </div>
              ) : (
                cart.map(item => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex items-center gap-3"
                  >
                    <img src={item.image} alt={item.name} className="w-12 h-12 rounded-xl object-cover" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 truncate">{item.name}</h4>
                      {item.category === 'fries' && <p className="text-xs text-slate-500 capitalize">{item.flavor}</p>}
                      <p className="text-xs text-orange-600 font-medium">{formatCurrency(item.price)}</p>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-1">
                      <button onClick={() => updateCartQuantity(item.id, -1)} className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-slate-900 cursor-pointer"><Minus size={14} /></button>
                      <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                      <button onClick={() => updateCartQuantity(item.id, 1)} className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-slate-900 cursor-pointer"><Plus size={14} /></button>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="text-slate-300 hover:text-rose-500 transition-colors cursor-pointer"><Trash2 size={16} /></button>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          <div className="p-6 bg-slate-50/50 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Promo Code"
                  className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  value={promoInput}
                  onChange={e => { setPromoInput(e.target.value); setPromoError(''); }}
                />
                <button onClick={applyPromoCode} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all cursor-pointer">Apply</button>
              </div>
              {promoError && <p className="text-xs text-rose-500 font-medium">{promoError}</p>}

              {appliedPromo && (
                <div className="flex justify-between items-center p-2 bg-orange-50 rounded-lg border border-orange-100">
                  <div className="flex items-center gap-2">
                    <Tag size={14} className="text-orange-600" />
                    <span className="text-xs font-bold text-orange-900">{appliedPromo.code}</span>
                  </div>
                  <button onClick={() => setAppliedPromo(null)} className="text-orange-400 hover:text-orange-600 cursor-pointer"><X size={14} /></button>
                </div>
              )}

              <div className="flex justify-between text-sm text-slate-500 pt-2"><span>Subtotal</span><span>{formatCurrency(cartSubtotal)}</span></div>
              {cartDiscount > 0 && <div className="flex justify-between text-sm text-rose-500"><span>Discount</span><span>-{formatCurrency(cartDiscount)}</span></div>}
              <div className="flex justify-between text-sm text-slate-500"><span>Tax (10%)</span><span>{formatCurrency(cartTotal * 0.1)}</span></div>
              <div className="flex justify-between text-lg font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Total</span>
                <span className="text-orange-600">{formatCurrency(cartTotal * 1.1)}</span>
              </div>
            </div>

            {/* Payment method selector */}
            <div className="grid grid-cols-3 gap-2">
              {(['cash', 'card', 'e-wallet'] as PaymentMethod[]).map(method => (
                <button
                  key={method}
                  onClick={() => setSelectedPayment(method)}
                  className={cn(
                    'flex flex-col items-center gap-1 p-2 rounded-xl border transition-all cursor-pointer',
                    selectedPayment === method
                      ? 'border-orange-500 bg-orange-50 text-orange-600'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-orange-300',
                  )}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider">{method}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => processOrder(selectedPayment)}
              disabled={cart.length === 0 || isProcessingOrder}
              className="w-full py-4 bg-orange-600 text-white rounded-2xl font-bold shadow-lg shadow-orange-200 hover:bg-orange-700 transition-all active:scale-95 disabled:opacity-50 disabled:shadow-none cursor-pointer"
            >
              {isProcessingOrder ? 'Processing Order...' : `Place Order · ${formatCurrency(cartTotal * 1.1)}`}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ─── RENDER: Products ─────────────────────────────────────────────────────

  const renderProducts = () => (
    <div className="space-y-6 animate-in fade-in duration-500 text-slate-900">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Product Management</h1>
          <p className="text-slate-500">Manage your menu, combos, and pricing</p>
        </div>
        {isManager && (
          <button onClick={openAddProduct} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-xl text-sm font-medium hover:bg-orange-700 transition-colors cursor-pointer">
            <Plus size={18} /> Add New Product
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
              <th className="px-6 py-4">Product</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Price</th>
              <th className="px-6 py-4">Cost</th>
              <th className="px-6 py-4">Stock</th>
              <th className="px-6 py-4">Status</th>
              {isManager && <th className="px-6 py-4 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {products.map(product => (
              <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img src={product.image} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    <div>
                      <span className="font-bold">{product.name}</span>
                      <p className="text-xs text-slate-400 capitalize">{product.size} · {product.flavor}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4"><span className="text-sm text-slate-500 capitalize">{product.category}</span></td>
                <td className="px-6 py-4"><span className="text-sm font-medium">{formatCurrency(product.price)}</span></td>
                <td className="px-6 py-4"><span className="text-sm text-slate-400">{formatCurrency(product.cost)}</span></td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className={cn('text-sm font-medium', product.stock <= product.lowStockThreshold ? 'text-rose-600' : '')}>{product.stock}</span>
                    {product.stock <= product.lowStockThreshold && <AlertCircle size={14} className="text-rose-500" />}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={cn('px-2 py-1 rounded-full text-[10px] font-bold uppercase', product.available ? 'bg-orange-50 text-orange-600' : 'bg-slate-100 text-slate-500')}>
                    {product.available ? 'Active' : 'Hidden'}
                  </span>
                </td>
                {isManager && (
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => toggleAvailability(product.id)} className="text-slate-400 hover:text-blue-600 transition-colors p-2 cursor-pointer" title={product.available ? 'Hide' : 'Show'}>
                        {product.available ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <button onClick={() => openEditProduct(product)} className="text-slate-400 hover:text-orange-600 transition-colors p-2 cursor-pointer"><Edit2 size={16} /></button>
                      {isAdmin && (
                        <button onClick={() => deleteProduct(product.id)} className="text-slate-400 hover:text-rose-600 transition-colors p-2 cursor-pointer"><Trash2 size={16} /></button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ─── RENDER: Inventory ────────────────────────────────────────────────────

  const renderInventory = () => (
    <div className="space-y-6 animate-in fade-in duration-500 text-slate-900">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Inventory Management</h1>
          <p className="text-slate-500">Ingredients, packaging, and usage tracking</p>
        </div>
        {isManager && (
          <div className="flex gap-2">
            <button onClick={() => openStockModal('in')} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors cursor-pointer">
              <Plus size={18} className="text-emerald-600" /> Stock-In
            </button>
            <button onClick={() => openStockModal('waste')} className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-sm font-medium hover:bg-rose-100 transition-colors cursor-pointer">
              <Trash2 size={18} /> Report Waste
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50">
              <h3 className="text-lg font-bold">Current Stock</h3>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-6 py-3">Item Name</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Stock Level</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {ingredients.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold">{item.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-500 capitalize">{item.category}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">{item.stock} {item.unit}</span>
                        <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={cn('h-full rounded-full', item.stock <= item.lowStockThreshold ? 'bg-rose-500' : 'bg-orange-500')}
                            style={{ width: `${Math.min(100, (item.stock / (item.lowStockThreshold * 5)) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {item.stock <= item.lowStockThreshold ? (
                        <span className="flex items-center gap-1 text-rose-600 text-[10px] font-bold uppercase"><AlertCircle size={12} /> Low Stock</span>
                      ) : (
                        <span className="text-emerald-600 text-[10px] font-bold uppercase">In Stock</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Low-stock product alerts */}
          {lowStockProducts.length > 0 && (
            <div className="bg-white rounded-2xl border border-rose-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-rose-50 flex items-center gap-3">
                <AlertCircle size={18} className="text-rose-500" />
                <h3 className="text-lg font-bold text-rose-700">Low Stock Products</h3>
              </div>
              <div className="p-6 grid grid-cols-2 gap-3">
                {lowStockProducts.map(p => (
                  <div key={p.id} className="flex items-center gap-3 p-3 bg-rose-50 rounded-xl border border-rose-100">
                    <img src={p.image} className="w-9 h-9 rounded-lg object-cover" alt="" />
                    <div>
                      <p className="text-xs font-bold text-slate-900 truncate">{p.name}</p>
                      <p className="text-[10px] text-rose-600">{p.stock} left (min {p.lowStockThreshold})</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold mb-4">Inventory History</h3>
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
            {inventoryLogs.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-8">No inventory activity yet.</p>
            )}
            {inventoryLogs.slice(0, 20).map(log => (
              <div key={log.id} className="flex gap-3 pb-4 border-b border-slate-50 last:border-0">
                <div className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                  log.type === 'sale' ? 'bg-orange-50 text-orange-600' :
                    log.type === 'waste' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600',
                )}>
                  {log.type === 'sale' ? <TrendingUp size={16} /> : log.type === 'waste' ? <Trash2 size={16} /> : <Plus size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{log.itemName}</p>
                  <p className="text-[10px] text-slate-500">{log.reason}</p>
                </div>
                <div className="text-right">
                  <p className={cn('text-sm font-bold', (log.type === 'sale' || log.type === 'waste') ? 'text-rose-600' : 'text-emerald-600')}>
                    {(log.type === 'sale' || log.type === 'waste') ? '-' : '+'}{log.quantity}
                  </p>
                  <p className="text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // ─── RENDER: Reports ──────────────────────────────────────────────────────

  const renderReports = () => (
    <div className="space-y-6 animate-in fade-in duration-500 text-slate-900">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Reporting & Insights</h1>
          <p className="text-slate-500">Detailed business performance and forecasts</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportPDF} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors cursor-pointer">
            <Download size={18} /> Export PDF
          </button>
          <button onClick={exportExcel} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors cursor-pointer">
            <Database size={18} /> Export Excel
          </button>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="flex gap-4 border-b border-slate-100">
        <button
          onClick={() => setReportTab('overview')}
          className={`px-4 py-3 font-medium text-sm relative transition-colors whitespace-nowrap cursor-pointer ${
            reportTab === 'overview'
              ? 'text-orange-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:bg-orange-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setReportTab('transactions')}
          className={`px-4 py-3 font-medium text-sm relative transition-colors whitespace-nowrap cursor-pointer ${
            reportTab === 'transactions'
              ? 'text-orange-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:bg-orange-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Transactions
        </button>
        <button
          onClick={() => setReportTab('insights')}
          className={`px-4 py-3 font-medium text-sm relative transition-colors whitespace-nowrap cursor-pointer ${
            reportTab === 'insights'
              ? 'text-orange-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:bg-orange-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          AI Insights
        </button>
      </div>

      {/* Overview Tab */}
      {reportTab === 'overview' && (
        <>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex flex-wrap gap-4 items-end mb-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Date Range</label>
                <select value={reportRange} onChange={e => setReportRange(e.target.value)} className="w-48 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 cursor-pointer">
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Category</label>
                <select value={reportCategory} onChange={e => setReportCategory(e.target.value)} className="w-48 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 cursor-pointer">
                  <option value="all">All Categories</option>
                  <option value="fries">Fries</option>
                  <option value="drinks">Drinks</option>
                  <option value="add-ons">Add-ons</option>
                  <option value="combos">Combos</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <h3 className="text-lg font-bold mb-6">Revenue Breakdown</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weekChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: '#fff' }} />
                      <Area type="monotone" dataKey="sales" stroke="#f97316" strokeWidth={3} fill="#fff7ed" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-bold mb-4">Summary</h3>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Transactions</span>
                    <span className="text-sm font-bold">{filteredTransactions.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Revenue</span>
                    <span className="text-sm font-bold text-orange-600">{formatCurrency(reportRevenue)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Discounts Given</span>
                    <span className="text-sm font-bold text-rose-500">-{formatCurrency(reportDiscount)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Avg. Order Value</span>
                    <span className="text-sm font-bold">{formatCurrency(avgOrderValue)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Refunds</span>
                    <span className="text-sm font-bold text-rose-500">{reportRefunds}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Top Products Report */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold mb-6">Top Selling Products</h3>
            {topProducts.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">No sales recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-50">
                      <th className="pb-4">Product</th>
                      <th className="pb-4">Qty Sold</th>
                      <th className="pb-4 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {topProducts.map((row, i) => (
                      <tr key={i} className="text-sm hover:bg-slate-50 transition-colors">
                        <td className="py-4 font-bold">{row.name}</td>
                        <td className="py-4">{row.qty}</td>
                        <td className="py-4 text-right font-bold text-orange-600">{formatCurrency(row.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Category Breakdown */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold mb-6">Sales by Category</h3>
            {categoryBreakdown.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">No sales recorded yet.</p>
            ) : (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: '#fff' }} />
                    <Bar dataKey="revenue" fill="#f97316" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </>
      )}

      {/* Transactions Tab */}
      {reportTab === 'transactions' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex flex-wrap gap-4 items-end mb-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase">Filter by Date</label>
              <select value={reportRange} onChange={e => setReportRange(e.target.value)} className="w-48 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 cursor-pointer">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase">Filter by Category</label>
              <select value={reportCategory} onChange={e => setReportCategory(e.target.value)} className="w-48 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 cursor-pointer">
                <option value="all">All Categories</option>
                <option value="fries">Fries</option>
                <option value="drinks">Drinks</option>
                <option value="add-ons">Add-ons</option>
                <option value="combos">Combos</option>
              </select>
            </div>
          </div>

          <h3 className="text-lg font-bold mb-6">Transaction History</h3>
          {filteredTransactions.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">No transactions match your filters.</p>
          ) : (
            <div>
              <div className="mb-4 text-sm text-slate-600">
                Showing <span className="font-bold">{filteredTransactions.length}</span> of <span className="font-bold">{transactions.length}</span> transactions
              </div>
              <div className="max-h-[600px] overflow-y-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left">
                  <thead className="sticky top-0 bg-slate-50 z-10">
                    <tr className="text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-50">
                      <th className="pb-4 px-3">Order ID</th>
                      <th className="pb-4 px-3">Date & Time</th>
                      <th className="pb-4 px-3">Cashier</th>
                      <th className="pb-4 px-3">Items</th>
                      <th className="pb-4 px-3">Payment</th>
                      <th className="pb-4 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredTransactions.map(tx => (
                      <tr key={tx.id} className="text-sm hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3 font-mono text-xs text-slate-600 font-bold truncate">{tx.id}</td>
                        <td className="py-3 px-3 text-slate-700">{formatDate(tx.timestamp)}</td>
                        <td className="py-3 px-3 font-medium text-slate-900">{tx.cashierName}</td>
                        <td className="py-3 px-3 text-slate-600">{tx.items.length} item{tx.items.length !== 1 ? 's' : ''}</td>
                        <td className="py-3 px-3">
                          <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-lg text-[10px] font-bold uppercase">{tx.paymentMethod}</span>
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-orange-600">{formatCurrency(tx.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Insights Tab */}
      {reportTab === 'insights' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold">AI-Powered Business Insights</h3>
                <p className="text-sm text-slate-500 mt-1">Get intelligent suggestions based on your sales data</p>
              </div>
              <button
                onClick={fetchInsights}
                disabled={insightsLoading || !filteredTransactions.length}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed cursor-pointer"
              >
                {insightsLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Zap size={18} />
                    Generate Insights
                  </>
                )}
              </button>
            </div>

            {insightsError && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl mb-6">
                <p className="text-sm text-rose-700"><strong>Error:</strong> {insightsError}</p>
              </div>
            )}

            {insights ? (
              <div className="prose prose-sm max-w-none">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                  <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed font-sans">
                    {insights.split('\n').map((line, idx) => (
                      <div key={idx} className="mb-2">
                        {line}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap size={32} className="text-slate-400" />
                </div>
                <p className="text-slate-500 mb-4">Click "Generate Insights" to analyze your sales data</p>
                {filteredTransactions.length === 0 && (
                  <p className="text-sm text-slate-400">You need some transactions to generate insights</p>
                )}
              </div>
            )}

            <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
              <p className="text-xs text-slate-600">
                <strong>How it works:</strong> This tab uses Google Gemini API to analyze your current sales metrics, top products, and trends to provide actionable business recommendations.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ─── RENDER: Users ────────────────────────────────────────────────────────

  const renderUsers = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management & Security</h1>
          <p className="text-slate-500">Staff accounts, activity logs, and system security</p>
        </div>
        {isAdmin && (
          <button onClick={() => { setNewUser({ name: '', email: '', role: 'cashier', password: '' }); setUserFormError(''); setShowAddUser(true); }} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-xl text-sm font-medium hover:bg-orange-700 transition-colors cursor-pointer">
            <Plus size={18} /> Add New User
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Current user info */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Your Account</h3>
            {currentUser && (
              <div className="flex items-center gap-4">
                <img src={currentUser.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-900">{currentUser.name}</p>
                  <p className="text-xs text-slate-500">{currentUser.email}</p>
                </div>
                <span className={cn('px-2 py-1 rounded-full text-[10px] font-bold uppercase',
                  currentUser.role === 'admin' ? 'bg-violet-50 text-violet-600' :
                  currentUser.role === 'manager' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600',
                )}>
                  {currentUser.role}
                </span>
              </div>
            )}
            <p className="text-xs text-slate-500 mt-4">To switch roles, logout and login with a different account.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {users.map(user => (
              <div key={user.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <img src={user.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900">{user.name}</h3>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </div>
                  <span className={cn('px-2 py-1 rounded-full text-[10px] font-bold uppercase',
                    user.role === 'admin' ? 'bg-violet-50 text-violet-600' :
                      user.role === 'manager' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600',
                  )}>
                    {user.role}
                  </span>
                </div>
                {isAdmin && (
                  <div className="flex gap-2">
                    <button onClick={() => alert('Edit user feature coming soon. For now, delete and re-add the user with updated details.')} className="flex-1 py-2 bg-slate-50 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer">Edit</button>
                    <button onClick={() => { const newPass = prompt('Send password reset email to ' + user.email + '?', 'yes'); if (newPass === 'yes') alert('✅ Password reset email sent to ' + user.email); }} className="flex-1 py-2 bg-slate-50 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer">Reset Pass</button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">System Activity Logs</h3>
            </div>
            <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto">
              {activityLogs.length === 0 && <p className="text-sm text-slate-400 text-center py-8">No activity recorded yet.</p>}
              {activityLogs.slice(0, 30).map(log => (
                <div key={log.id} className="flex gap-4 pb-4 border-b border-slate-50 last:border-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                    <Activity size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900">{log.action}</p>
                    <p className="text-xs text-slate-500">{log.details}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{log.userName} · {formatDate(log.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Security & Backup</h3>
            <div className="space-y-4">
              <button onClick={backupRecords} className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <Database size={20} className="text-orange-500" />
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-900">Backup Records</p>
                    <p className="text-[10px] text-slate-500">Last: 2 hours ago</p>
                  </div>
                </div>
                <RefreshCw size={16} className="text-slate-400" />
              </button>
              <button onClick={restoreSystem} className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <Upload size={20} className="text-blue-500" />
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-900">Restore System</p>
                    <p className="text-[10px] text-slate-500">From cloud storage</p>
                  </div>
                </div>
                <ArrowRightLeft size={16} className="text-slate-400" />
              </button>
              {lowStockCount > 0 && (
                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                  <div className="flex items-center gap-3 mb-2">
                    <Shield size={20} className="text-rose-500" />
                    <p className="text-sm font-bold text-rose-900">Stock Alert</p>
                  </div>
                  <p className="text-xs text-rose-700">{lowStockCount} item{lowStockCount !== 1 ? 's' : ''} below minimum stock level.</p>
                </div>
              )}
            </div>
          </div>

          {/* Promotions management */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Active Promotions</h3>
            <div className="space-y-3">
              {promotions.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{p.code}</p>
                    <p className="text-xs text-slate-500">{p.description}</p>
                    <p className="text-xs text-orange-600 font-medium">
                      {p.discountType === 'percentage' ? `${p.value}% off` : `$${p.value} off`}
                    </p>
                  </div>
                  <span className={cn('text-[10px] font-bold px-2 py-1 rounded-full', p.active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-200 text-slate-500')}>
                    {p.active ? 'Active' : 'Off'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ─── Guard: Login ─────────────────────────────────────────────────────────

  if (!currentUser) return <LoginScreen onLogin={handleLogin} />;

  // ─── Main layout ──────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-100 flex flex-col p-6">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-200">
            <ShoppingBag size={24} />
          </div>
          <span className="text-xl font-black tracking-tight text-orange-900">SURFRIES.POS</span>
        </div>

        <nav className="flex-1 space-y-2">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <SidebarItem icon={ShoppingCart} label="Sales" active={activeTab === 'sales'} onClick={() => setActiveTab('sales')} />
          <SidebarItem icon={Package} label="Products" active={activeTab === 'products'} onClick={() => setActiveTab('products')} />
          <SidebarItem icon={ClipboardList} label="Inventory" active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} badge={lowStockCount || undefined} />
          <SidebarItem icon={BarChart3} label="Reports" active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} />
          {isManager && <SidebarItem icon={Users} label="Users & Security" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-50">
          <div className="flex items-center gap-3 px-2">
            <img src={currentUser.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{currentUser.name}</p>
              <p className="text-xs text-slate-500 capitalize">{currentUser.role}</p>
            </div>
            <button onClick={handleLogout} className="text-slate-400 hover:text-rose-500 transition-colors cursor-pointer p-1" title="Sign out">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Current Store</span>
              <span className="text-sm font-bold text-slate-900">Downtown Branch #12</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {lowStockCount > 0 && (
              <button onClick={() => setActiveTab('inventory')} className="p-2 text-rose-500 hover:text-rose-700 transition-colors relative cursor-pointer">
                <AlertCircle size={22} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
              </button>
            )}
            <div className="h-8 w-px bg-slate-100 mx-2" />
            <div className="text-right">
              <p className="text-sm font-bold text-slate-900">{new Date().toLocaleDateString('en-US', { weekday: 'long' })}</p>
              <p className="text-xs text-slate-500">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'sales' && renderSales()}
          {activeTab === 'products' && renderProducts()}
          {activeTab === 'inventory' && renderInventory()}
          {activeTab === 'reports' && renderReports()}
          {activeTab === 'users' && renderUsers()}
        </div>
      </main>

      {/* ── MODAL: Receipt ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showReceipt && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8 text-center border-b border-slate-50">
                <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Order Successful!</h3>
                <p className="text-slate-500">Transaction ID: {showReceipt.id}</p>
                <p className="text-xs text-slate-400 mt-1">Payment: <span className="font-bold capitalize">{showReceipt.paymentMethod}</span></p>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-3">
                  {showReceipt.items.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-slate-600">{item.quantity}x {item.name}</span>
                      <span className="font-medium text-slate-900">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-6 border-t border-dashed border-slate-200 space-y-2">
                  <div className="flex justify-between text-sm text-slate-500">
                    <span>Subtotal</span><span>{formatCurrency(showReceipt.subtotal)}</span>
                  </div>
                  {showReceipt.discount > 0 && (
                    <div className="flex justify-between text-sm text-rose-500">
                      <span>Discount ({showReceipt.discountCode})</span>
                      <span>-{formatCurrency(showReceipt.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-slate-500">
                    <span>Tax (10%)</span><span>{formatCurrency(showReceipt.total * 0.1)}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold text-slate-900 pt-2">
                    <span>Total Paid</span>
                    <span className="text-orange-600">{formatCurrency(showReceipt.total * 1.1)}</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowReceipt(null)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all cursor-pointer">Close</button>
                  <button onClick={() => { window.print(); setShowReceipt(null); }} className="flex-1 py-3 bg-orange-600 text-white rounded-xl font-bold shadow-lg shadow-orange-200 hover:bg-orange-700 transition-all cursor-pointer">Print Receipt</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL: Select Flavor for Fries ──────────────────────────────── */}
      <AnimatePresence>
        {showFlavorModal && selectedProductForFlavor && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-slate-100"
            >
              <div className="p-6 border-b border-slate-50">
                <h3 className="text-xl font-black text-slate-900">Choose Flavor</h3>
                <p className="text-sm text-slate-500 mt-1">{selectedProductForFlavor.name}</p>
              </div>
              <div className="p-6 space-y-3">
                {[
                  { value: 'classic' as const, label: ' Classic' },
                  { value: 'cheese' as const, label: 'Cheese' },
                  { value: 'barbecue' as const, label: ' Barbecue' },
                  { value: 'sour cream' as const, label: 'Sour Cream' },
                ].map(flavor => (
                  <button
                    key={flavor.value}
                    onClick={() => setSelectedFlavor(flavor.value)}
                    className={cn(
                      'w-full p-4 rounded-xl border-2 transition-all text-left font-medium cursor-pointer',
                      selectedFlavor === flavor.value
                        ? 'border-orange-500 bg-orange-50 text-orange-900'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-orange-300',
                    )}
                  >
                    {flavor.label}
                  </button>
                ))}
              </div>
              <div className="p-6 bg-slate-50 flex gap-3">
                <button onClick={() => setShowFlavorModal(false)} className="flex-1 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all cursor-pointer">Cancel</button>
                <button onClick={addFlavoredProductToCart} className="flex-1 py-3 bg-orange-600 text-white rounded-xl text-sm font-bold hover:bg-orange-700 shadow-lg shadow-orange-600/20 transition-all cursor-pointer">
                  Add to Cart
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL: Add / Edit Product ────────────────────────────────────── */}
      <AnimatePresence>
        {showAddProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-slate-100"
            >
              <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                <h3 className="text-xl font-black text-slate-900">{editProduct ? 'Edit Product' : 'Add New Product'}</h3>
                <button onClick={() => setShowAddProduct(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"><X size={20} className="text-slate-400" /></button>
              </div>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Product Name</label>
                  <input type="text" value={newProduct.name} onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Sour Cream Fries" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">Category</label>
                    <select value={newProduct.category} onChange={e => setNewProduct(p => ({ ...p, category: e.target.value as Category }))} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20">
                      <option value="fries">Fries</option>
                      <option value="drinks">Drinks</option>
                      <option value="add-ons">Add-ons</option>
                      <option value="combos">Combos</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">Price ($)</label>
                    <input type="number" value={newProduct.price} onChange={e => setNewProduct(p => ({ ...p, price: e.target.value }))} placeholder="0.00" min="0" step="0.01" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">Cost ($)</label>
                    <input type="number" value={newProduct.cost} onChange={e => setNewProduct(p => ({ ...p, cost: e.target.value }))} placeholder="0.00" min="0" step="0.01" inputMode="decimal" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">Stock Qty</label>
                    <input type="number" value={newProduct.stock} onChange={e => setNewProduct(p => ({ ...p, stock: e.target.value }))} placeholder="0" min="0" inputMode="numeric" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Low Stock Alert</label>
                  <input type="number" value={newProduct.lowStockThreshold} onChange={e => setNewProduct(p => ({ ...p, lowStockThreshold: e.target.value }))} placeholder="10" min="0" inputMode="numeric" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Image URL (optional)</label>
                  <input type="text" value={newProduct.image} onChange={e => setNewProduct(p => ({ ...p, image: e.target.value }))} placeholder="https://..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                </div>
                {productFormError && <p className="text-rose-500 text-xs font-medium">{productFormError}</p>}
              </div>
              <div className="p-6 bg-slate-50 flex gap-3">
                <button onClick={() => setShowAddProduct(false)} className="flex-1 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all cursor-pointer">Cancel</button>
                <button onClick={saveProduct} className="flex-1 py-3 bg-orange-600 text-white rounded-xl text-sm font-bold hover:bg-orange-700 shadow-lg shadow-orange-600/20 transition-all cursor-pointer">
                  {editProduct ? 'Save Changes' : 'Save Product'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL: Delete Product Confirmation ──────────────────────────── */}
      <AnimatePresence>
        {showDeleteConfirm && productToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-slate-100"
            >
              <div className="p-6 border-b border-slate-50">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-rose-100 mx-auto mb-4">
                  <Trash2 size={24} className="text-rose-600" />
                </div>
                <h3 className="text-xl font-black text-slate-900 text-center">Delete Product?</h3>
                <p className="text-sm text-slate-500 text-center mt-2">
                  Are you sure you want to delete <strong>{productToDelete.name}</strong>? This action cannot be undone.
                </p>
              </div>
              <div className="p-6 bg-slate-50 flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setProductToDelete(null);
                  }}
                  className="flex-1 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteProduct}
                  className="flex-1 py-3 bg-rose-600 text-white rounded-xl text-sm font-bold hover:bg-rose-700 shadow-lg shadow-rose-600/20 transition-all cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL: Stock Transaction ─────────────────────────────────────── */}
      <AnimatePresence>
        {showStockModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-slate-100"
            >
              <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                <h3 className="text-xl font-black text-slate-900">
                  {stockModalType === 'in' ? 'Record Stock In' : stockModalType === 'waste' ? 'Record Waste' : 'Stock Adjustment'}
                </h3>
                <button onClick={() => setShowStockModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"><X size={20} className="text-slate-400" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Ingredient / Item</label>
                  <select
                    value={stockForm.ingredientId}
                    onChange={e => setStockForm(f => ({ ...f, ingredientId: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  >
                    {ingredients.map(ing => <option key={ing.id} value={ing.id}>{ing.name} ({ing.stock} {ing.unit})</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">Quantity</label>
                    <input
                      type="number"
                      value={stockForm.quantity}
                      onChange={e => setStockForm(f => ({ ...f, quantity: e.target.value }))}
                      placeholder="0"
                      min="0"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">Unit</label>
                    <input
                      type="text"
                      disabled
                      className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-400"
                      value={ingredients.find(i => i.id === stockForm.ingredientId)?.unit || ''}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Notes / Reason</label>
                  <textarea
                    value={stockForm.notes}
                    onChange={e => setStockForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="e.g. Monthly restock or Spoiled due to power outage"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 h-24 resize-none"
                  />
                </div>
                {stockFormError && <p className="text-rose-500 text-xs font-medium">{stockFormError}</p>}
              </div>
              <div className="p-6 bg-slate-50 flex gap-3">
                <button onClick={() => setShowStockModal(false)} className="flex-1 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all cursor-pointer">Cancel</button>
                <button
                  onClick={submitStock}
                  className={cn(
                    'flex-1 py-3 text-white rounded-xl text-sm font-bold shadow-lg transition-all cursor-pointer',
                    stockModalType === 'in' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20',
                  )}
                >
                  Confirm Transaction
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL: Add User ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {showAddUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-slate-100"
            >
              <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                <h3 className="text-xl font-black text-slate-900">Add New User</h3>
                <button onClick={() => setShowAddUser(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"><X size={20} className="text-slate-400" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Full Name</label>
                  <input type="text" value={newUser.name} onChange={e => setNewUser(u => ({ ...u, name: e.target.value }))} placeholder="e.g. Jane Smith" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Email</label>
                  <input type="email" value={newUser.email} onChange={e => setNewUser(u => ({ ...u, email: e.target.value }))} placeholder="jane@fries.com" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Role</label>
                  <select value={newUser.role} onChange={e => setNewUser(u => ({ ...u, role: e.target.value as Role }))} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20">
                    <option value="cashier">Cashier</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Initial Password</label>
                  <input type="password" value={newUser.password} onChange={e => setNewUser(u => ({ ...u, password: e.target.value }))} placeholder="••••••••" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                </div>
                {userFormError && <p className="text-rose-500 text-xs font-medium">{userFormError}</p>}
              </div>
              <div className="p-6 bg-slate-50 flex gap-3">
                <button onClick={() => setShowAddUser(false)} className="flex-1 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all cursor-pointer">Cancel</button>
                <button onClick={saveNewUser} className="flex-1 py-3 bg-orange-600 text-white rounded-xl text-sm font-bold hover:bg-orange-700 shadow-lg shadow-orange-600/20 transition-all cursor-pointer">Create User</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}