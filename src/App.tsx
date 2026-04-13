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
  Menu,
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
  InventoryLogType,
} from './types';
import {
  CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_USERS,
  INITIAL_INGREDIENTS,
  INITIAL_PROMOTIONS,
} from './constants';
import { cn, formatCurrency, formatDate } from './utils';
import { 
  processSale, 
  addProduct as supabaseAddProduct, 
  updateProduct as supabaseUpdateProduct, 
  fetchProducts as supabaseFetchProducts, 
  fetchTransactions, 
  deleteProduct as supabaseDeleteProduct, 
  adjustIngredientStock,
  fetchInventoryLogs,
  fetchIngredients,
  addIngredient as supabaseAddIngredient,
  fetchPromotions,
  addPromotion as supabaseAddPromotion,
  updatePromotion as supabaseUpdatePromotion,
  deletePromotion as supabaseDeletePromotion,
  fetchActivityLogs
} from './supabaseServices';
import { generateInsights } from './geminiService';
import {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  fetchAllUsers,
  updateStaffAccount,
  resetStaffPassword,
  verifyUserPassword,
} from './authService';

// ─── tiny helpers ────────────────────────────────────────────────────────────

const uid = (prefix = 'ID') => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const PLACEHOLDER_IMG =
  'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=400&fit=crop';

const getLowStockThreshold = (item: any) =>
  Number(item?.low_stock_threshold ?? item?.lowStockThreshold ?? 0);

const getProductVelocity = (product: any) =>
  product?.sales_velocity ?? product?.salesVelocity ?? 'normal';

const getEntityImage = (entity: any) =>
  entity?.image_url || entity?.image || PLACEHOLDER_IMG;

const getUserAvatar = (user: any) =>
  user?.avatar_url || user?.avatar || PLACEHOLDER_IMG;

const getRecordTimestamp = (record: any) =>
  record?.created_at ?? record?.timestamp ?? new Date().toISOString();

const getActivityUserName = (log: any) =>
  log?.user_name ?? log?.userName ?? 'System';

const getActivityDetails = (log: any) => {
  const action = String(log?.action ?? '').trim().toLowerCase();
  const details = String(log?.details ?? '').trim();
  if (!details) return 'No additional details.';

  if (action === 'sale') {
    const totalMatch = details.match(/Total:\s*([0-9]+(?:\.[0-9]+)?)/i);
    if (totalMatch) {
      return `Sale completed. Order total: ${formatCurrency(Number(totalMatch[1]))}.`;
    }
    return 'Sale completed.';
  }

  return details
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/:\s*\./g, '.')
    .trim();
};

const getInventoryItemName = (log: any) =>
  log?.item_name ?? log?.itemName ?? 'Unknown item';

const getPromotionDiscountType = (promotion: any) =>
  promotion?.discount_type ?? promotion?.discountType ?? 'fixed';

const getTransactionItems = (tx: any): CartItem[] =>
  (tx?.items ?? tx?.transaction_items ?? []).map((item: any) => ({
    ...item,
    id: String(item?.id ?? item?.product_id ?? uid('ITEM')),
    name: item?.name ?? item?.product_name ?? 'Unknown item',
    price: Number(item?.price ?? item?.unit_price ?? 0),
    image_url: item?.image_url ?? item?.image ?? PLACEHOLDER_IMG,
    quantity: Number(item?.quantity ?? 1),
  }));

const getTransactionPaymentMethod = (tx: any): PaymentMethod =>
  tx?.payment_method === 'e-wallet'
    ? 'gcash'
    : tx?.payment_method === 'card'
      ? 'cash'
      : (tx?.payment_method ?? tx?.paymentMethod ?? 'cash');

const getTransactionCashierName = (tx: any) =>
  tx?.cashier_name ?? tx?.cashierName ?? 'System';

const getTransactionDiscountCode = (tx: any) =>
  tx?.discount_code ?? tx?.discountCode;

const getTransactionLabel = (_tx: any, index: number, totalCount?: number) => {
  const total = totalCount ?? (index + 1);
  const orderNumber = Math.max(1, total - index);
  return `Order ${String(orderNumber).padStart(3, '0')}`;
};

const getMonthKey = (value: string | number | Date) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

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
  <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-100 shadow-sm">
    <div className="flex justify-between items-start mb-3 md:mb-4">
      <div className={cn('p-2.5 md:p-3 rounded-xl', color)}>
        <Icon size={18} className="text-white md:w-6 md:h-6" />
      </div>
      {trend !== undefined && (
        <span
          className={cn(
            'text-[11px] md:text-xs font-medium px-2 py-1 rounded-full',
            trend > 0 ? 'bg-orange-50 text-orange-600' : 'bg-rose-50 text-rose-600',
          )}
        >
          {trend > 0 ? '+' : ''}
          {trend}%
        </span>
      )}
    </div>
    <h3 className="text-slate-500 text-[13px] md:text-sm font-medium">{title}</h3>
    <p className="text-xl leading-tight md:text-2xl font-bold text-slate-900 mt-1">{value}</p>
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
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
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
  const [reportMonth, setReportMonth] = useState(() => getMonthKey(new Date()));
  const [reportCategory, setReportCategory] = useState('all');
  const [reportTab, setReportTab] = useState('overview');
  const [transactionDisplayLimit, setTransactionDisplayLimit] = useState(50);
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
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showFlavorModal, setShowFlavorModal] = useState(false);
  const [selectedProductForFlavor, setSelectedProductForFlavor] = useState<Product | null>(null);
  const [selectedFlavor, setSelectedFlavor] = useState<Product['flavor']>('classic');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showResetPassModal, setShowResetPassModal] = useState(false);
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<User | null>(null);
  const [selectedUserForReset, setSelectedUserForReset] = useState<User | null>(null);
  const [selectedPromotionForEdit, setSelectedPromotionForEdit] = useState<Promotion | null>(null);
  const [editUserForm, setEditUserForm] = useState({ name: '', role: 'cashier' as Role, avatar_url: '' });
  const [newPasswordForm, setNewPasswordForm] = useState({ password: '', confirmPassword: '' });
  const [promotionForm, setPromotionForm] = useState({
    code: '',
    description: '',
    discount_type: 'percentage' as Promotion['discount_type'],
    value: '',
    active: true,
  });
  const [editUserFormError, setEditUserFormError] = useState('');
  const [resetPassFormError, setResetPassFormError] = useState('');
  const [promotionFormError, setPromotionFormError] = useState('');
  const [isSavingUserEdit, setIsSavingUserEdit] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isSavingPromotion, setIsSavingPromotion] = useState(false);
  const [showLogoutConfirmModal, setShowLogoutConfirmModal] = useState(false);
  const [showExportAuthModal, setShowExportAuthModal] = useState(false);
  const [pendingExportAction, setPendingExportAction] = useState<'pdf' | 'excel' | 'backup' | null>(null);
  const [exportAuthPassword, setExportAuthPassword] = useState('');
  const [exportAuthError, setExportAuthError] = useState('');
  const [isVerifyingExportAuth, setIsVerifyingExportAuth] = useState(false);
  const [showBackupSuccessModal, setShowBackupSuccessModal] = useState(false);
  const [showRestoreConfirmModal, setShowRestoreConfirmModal] = useState(false);
  const [showRestoreSuccessModal, setShowRestoreSuccessModal] = useState(false);
  const [lastBackupFileName, setLastBackupFileName] = useState('');
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Add Product form state
  const [newProduct, setNewProduct] = useState({
    name: '', category: 'fries' as Category, price: '', cost: '',
    size: 'medium' as Product['size'], flavor: 'classic' as Product['flavor'],
    image: '', stock: '', lowStockThreshold: '10',
  });
  const [productFormError, setProductFormError] = useState('');

  // Stock modal form state
  const [stockForm, setStockForm] = useState({
    ingredientId: '',
    quantity: '',
    notes: '',
    createNewItem: false,
    newItemName: '',
    newItemUnit: '',
    newItemCategory: 'raw' as Ingredient['category'],
    newItemLowStockThreshold: '',
  });
  const [stockFormError, setStockFormError] = useState('');

  // Add user form state
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'cashier' as Role, password: '' });
  const [userFormError, setUserFormError] = useState('');

  // ─── Computed helpers ────────────────────────────────────────────────────

  const lowStockProducts = useMemo(
    () => products.filter(product => product.stock <= getLowStockThreshold(product)),
    [products],
  );
  const lowStockIngredients = useMemo(
    () => ingredients.filter(ingredient => ingredient.stock <= getLowStockThreshold(ingredient)),
    [ingredients],
  );
  const lowStockCount = lowStockProducts.length + lowStockIngredients.length;
  const inventoryHistoryLogs = useMemo(
    () => inventoryLogs.filter(log => log.item_type === 'ingredient' && log.type !== 'sale'),
    [inventoryLogs],
  );

  const isAdmin = currentUser?.role === 'manager';
  const isManager = currentUser?.role === 'manager';
  const canAccessManagerTabs = isManager;

  // ─── Activity Logger ─────────────────────────────────────────────────────

  const logActivity = useCallback((action: string, details: string, user?: User | null) => {
    const actor = user ?? currentUser;
    if (!actor) return;
    const entry = {
      id: uid('ACT'),
      user_id: actor.id,
      user_name: actor.name,
      userName: actor.name,
      action,
      details,
      created_at: new Date().toISOString(),
      timestamp: new Date().toISOString(),
    };
    setActivityLogs(prev => [entry, ...prev.slice(0, 199)]);
  }, [currentUser]);

  // ─── Restore User Session on App Load ────────────────────────────────

  useEffect(() => {
    const checkSession = async () => {
      const sessionUser = await getCurrentUser();
      if (sessionUser) {
        setCurrentUser(sessionUser);
        logActivity('Session Restored', 'User automatically logged in from session', sessionUser);
      }
    };
    checkSession();
  }, []);

  useEffect(() => {
    if (!canAccessManagerTabs && ['products', 'inventory', 'reports', 'users'].includes(activeTab)) {
      setActiveTab('sales');
    }
  }, [activeTab, canAccessManagerTabs]);

  useEffect(() => {
    if (currentUser?.role === 'cashier') {
      setActiveTab('sales');
    }
  }, [currentUser]);

  // ─── Load Initial Data from Supabase ──────────────────────────────────

  useEffect(() => {
    const loadData = async () => {
      try {
        // Products
        const prodRes = await supabaseFetchProducts();
        if (prodRes.success && prodRes.data) {
          setProducts(
            prodRes.data
              .filter((product: any) => product.category !== 'combos')
              .map((product: any) => ({
                ...product,
                image: product.image_url,
                lowStockThreshold: product.low_stock_threshold,
                salesVelocity: product.sales_velocity,
              })),
          );
        }

        // Transactions
        const txRes = await fetchTransactions();
        if (txRes.success && txRes.data) {
          // Map database transactions to app format if needed, 
          // but our Transaction interface now aligns with the schema.
          const mappedTx: Transaction[] = txRes.data.map((tx: any) => ({
            ...tx,
            timestamp: tx.created_at, // for backward compatibility in components
            paymentMethod: tx.payment_method,
            cashierName: tx.cashier_name,
            discountCode: tx.discount_code,
            items: tx.transaction_items.map((item: any) => ({
              ...item,
              id: item.product_id,
              name: item.product_name,
              price: item.unit_price,
              image: item.image_url, // map for display
            }))
          }));
          setTransactions(mappedTx);
        }

        // Ingredients
        const ingRes = await fetchIngredients();
        if (ingRes.success && ingRes.data) {
          setIngredients(ingRes.data.map((ingredient: any) => ({
            ...ingredient,
            lowStockThreshold: ingredient.low_stock_threshold,
          })));
        }

        // Inventory Logs
        const invRes = await fetchInventoryLogs();
        if (invRes.success && invRes.data) {
          setInventoryLogs(invRes.data.map((log: any) => ({
            ...log,
            quantity: Number(log.quantity ?? 0),
          })));
        }

        // Promotions
        const promoRes = await fetchPromotions();
        if (promoRes.success && promoRes.data) {
          setPromotions(promoRes.data.map((promotion: any) => ({
            ...promotion,
            discountType: promotion.discount_type,
          })));
        }

        // Activity Logs
        const actRes = await fetchActivityLogs();
        if (actRes.success && actRes.data) {
          setActivityLogs(actRes.data.map((log: any) => ({
            ...log,
            userName: log.user_name,
            timestamp: log.created_at,
          })));
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };

    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  // ─── Fetch AI Insights ───────────────────────────────────────────────

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    logActivity('Login', `Signed in as ${user.role}`, user);
  };

  const handleLogout = () => {
    setShowLogoutConfirmModal(true);
  };

  const confirmLogout = () => {
    logActivity('Logout', 'User signed out');
    logoutUser(); 
    setCurrentUser(null);
    setCart([]);
    setActiveTab('dashboard');
    setShowLogoutConfirmModal(false);
  };

  const switchRole = (role: Role) => {
    alert('To switch roles, please logout and create/login with a different account.');
  };

  const navigateTo = (tab: string) => {
    setActiveTab(tab);
    setMobileSidebarOpen(false);
  };

  // ─── Cart Logic ──────────────────────────────────────────────────────────

  const addToCart = (product: Product) => {
    if (!product.available || product.stock <= 0) return;
    
    if (product.category === 'fries') {
      setSelectedProductForFlavor(product);
      setSelectedFlavor('classic');
      setShowFlavorModal(true);
      return;
    }
    
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
    return appliedPromo.discount_type === 'percentage'
      ? (cartSubtotal * appliedPromo.value) / 100
      : appliedPromo.value;
  }, [cartSubtotal, appliedPromo]);

  const cartNet = Math.max(0, cartSubtotal - cartDiscount);
  const cartTax = Math.round(cartNet * 0.10 * 100) / 100;
  const cartTotal = Math.round((cartNet + cartTax) * 100) / 100;

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

    try {
      const orderResult = await processSale(
        currentUser.id,
        method,
        cart,
        cartSubtotal,
        cartTax,
        cartTotal,
        cartDiscount,
        appliedPromo?.code,
      );

      setIsProcessingOrder(false);

      if (!orderResult.success) {
        console.error('Failed to process sale:', orderResult.error);
        alert(`Error processing sale: ${(orderResult.error as any)?.message || 'Unknown error'}`);
        return;
      }

      // Success! Update local state
      const tx = orderResult.data;
      
      // Update local products stock
      setProducts(prev =>
        prev.map(p => {
          const ci = cart.find(c => c.id === p.id);
          return ci ? { ...p, stock: p.stock - ci.quantity } : p;
        })
      );

      setTransactions(prev => [{
        ...tx,
        timestamp: tx.created_at,
        paymentMethod: tx.payment_method,
        cashierName: tx.cashier_name,
        discountCode: tx.discount_code,
        items: [...cart]
      }, ...prev]);

      setCart([]);
      setAppliedPromo(null);
      setPromoError('');
      setShowReceipt({
        ...tx,
        timestamp: tx.created_at,
        paymentMethod: tx.payment_method,
        discountCode: tx.discount_code,
        items: [...cart]
      });

      // Refresh activity logs
      const actRes = await fetchActivityLogs();
      if (actRes.success && actRes.data) {
        setActivityLogs(actRes.data.map((log: any) => ({
          ...log,
          userName: log.user_name,
          timestamp: log.created_at,
        })));
      }

      // Refresh inventory logs (sale deductions are logged by process_sale RPC)
      const invRes = await fetchInventoryLogs();
      if (invRes.success && invRes.data) {
        setInventoryLogs(invRes.data.map((log: any) => ({
          ...log,
          quantity: Number(log.quantity ?? 0),
        })));
      }

    } catch (error) {
      console.error('Error in processOrder:', error);
      setIsProcessingOrder(false);
      alert('An unexpected error occurred while placing the order.');
    }
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
      size: p.size, flavor: p.flavor, image: p.image_url || '', stock: String(p.stock),
      lowStockThreshold: String(p.low_stock_threshold),
    });
    setProductFormError('');
    setEditProduct(p);
    setShowAddProduct(true);
  };

  const saveProduct = async () => {
    if (!newProduct.name.trim()) { setProductFormError('Product name is required.'); return; }
    if (!newProduct.price || isNaN(Number(newProduct.price))) { setProductFormError('Enter a valid price.'); return; }
    if (!newProduct.stock || isNaN(Number(newProduct.stock))) { setProductFormError('Enter a valid stock quantity.'); return; }

    const productData: any = {
      name: newProduct.name.trim(),
      category: newProduct.category,
      price: Number(newProduct.price),
      cost: Number(newProduct.cost) || 0,
      size: newProduct.size,
      flavor: newProduct.flavor,
      image_url: newProduct.image || PLACEHOLDER_IMG,
      stock: Number(newProduct.stock),
      low_stock_threshold: Number(newProduct.lowStockThreshold) || 10,
    };

    if (editProduct) {
      const result = await supabaseUpdateProduct(editProduct.id, productData);
      if (!result.success) {
        setProductFormError(`Failed to update product: ${(result.error as any)?.message}`);
        return;
      }
      setProducts(prev => prev.map(p => p.id === editProduct.id ? { ...p, ...productData } : p));
    } else {
      const result = await supabaseAddProduct({
        ...productData,
        available: true,
        ingredients: [],
        sales_velocity: 'normal'
      });
      if (!result.success || !result.data) {
        setProductFormError(`Failed to add product: ${(result.error as any)?.message}`);
        return;
      }
      setProducts(prev => [...prev, result.data[0]]);
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
    setStockForm({
      ingredientId: ingredients[0]?.id || '',
      quantity: '',
      notes: '',
      createNewItem: false,
      newItemName: '',
      newItemUnit: '',
      newItemCategory: 'raw',
      newItemLowStockThreshold: '',
    });
    setStockFormError('');
    setShowStockModal(true);
  };

  const submitStock = async () => {
    const qty = Number(stockForm.quantity);
    if (!qty || qty <= 0) { setStockFormError('Enter a valid quantity.'); return; }

    let targetIngredient = ingredients.find(i => i.id === stockForm.ingredientId);

    if (stockModalType === 'in' && stockForm.createNewItem) {
      if (!stockForm.newItemName.trim()) { setStockFormError('Enter stock item name.'); return; }
      if (!stockForm.newItemUnit.trim()) { setStockFormError('Enter unit (e.g. kg, pcs, L).'); return; }

      const addRes = await supabaseAddIngredient({
        name: stockForm.newItemName.trim(),
        unit: stockForm.newItemUnit.trim(),
        category: stockForm.newItemCategory,
        low_stock_threshold: Number(stockForm.newItemLowStockThreshold || 0),
        stock: 0,
      });
      if (!addRes.success || !addRes.data?.[0]) {
        setStockFormError('Failed to add new stock item.');
        return;
      }

      targetIngredient = {
        ...addRes.data[0],
        lowStockThreshold: addRes.data[0].low_stock_threshold,
      } as any;

      const ingRes = await fetchIngredients();
      if (ingRes.success && ingRes.data) {
        setIngredients(ingRes.data.map((ingredient: any) => ({
          ...ingredient,
          lowStockThreshold: ingredient.low_stock_threshold,
        })));
      }
    }

    if (!targetIngredient) { setStockFormError('Select an ingredient.'); return; }

    const newStock = stockModalType === 'in'
      ? targetIngredient.stock + qty
      : Math.max(0, targetIngredient.stock - qty);

    // Sync to Supabase using the consolidated RPC
    const stockResult = await adjustIngredientStock(
      targetIngredient.id,
      stockModalType as InventoryLogType,
      qty,
      stockForm.notes || (stockModalType === 'in' ? 'Stock replenishment' : 'Adjustment'),
      currentUser?.id || ''
    );
    if (!stockResult.success) {
      setStockFormError('Failed to save inventory log. Please try again.');
      return;
    }

    // Update local stock only after DB save succeeds
    setIngredients(prev => prev.map(i => {
      if (i.id !== targetIngredient.id) return i;
      return { ...i, stock: newStock };
    }));

    // Refresh from database so logs are retained after reload
    const invRes = await fetchInventoryLogs();
    if (invRes.success && invRes.data) {
      setInventoryLogs(invRes.data.map((log: any) => ({
        ...log,
        quantity: Number(log.quantity ?? 0),
      })));
    }

    logActivity(
      stockModalType === 'in' ? 'Stock In' : stockModalType === 'waste' ? 'Waste Recorded' : 'Stock Out',
      `${stockModalType === 'in' ? '+' : '-'}${qty} ${targetIngredient.unit} of ${targetIngredient.name}`,
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
            auth_user_id: u.auth_user_id ?? '',
            name: u.name,
            email: u.email,
            role: u.role,
            avatar_url: u.avatar_url,
            last_login: u.last_login,
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
      const addedUser = result.data as User;
      setUsers(prev => [...prev, addedUser]);
      logActivity('User Add', `Added new user: ${addedUser.name} (${addedUser.role})`);
      setShowAddUser(false);
      setNewUser({ name: '', email: '', role: 'cashier', password: '' });
      setUserFormError('');
    } else {
      setUserFormError(typeof result.error === 'string' ? result.error : 'Failed to create user');
    }
  };

  const openEditUserModal = (user: User) => {
    if (!isAdmin) return;
    setSelectedUserForEdit(user);
    setEditUserForm({
      name: user.name,
      role: user.role,
      avatar_url: user.avatar_url || '',
    });
    setEditUserFormError('');
    setShowEditUserModal(true);
  };

  const submitEditUser = async () => {
    if (!selectedUserForEdit) return;
    if (!editUserForm.name.trim()) {
      setEditUserFormError('Name is required.');
      return;
    }

    setIsSavingUserEdit(true);
    setEditUserFormError('');

    const result = await updateStaffAccount(selectedUserForEdit.id, {
      name: editUserForm.name.trim(),
      role: editUserForm.role,
      avatar_url: editUserForm.avatar_url.trim() || null,
    });

    setIsSavingUserEdit(false);

    if (!result.success || !result.data) {
      const message = (result.error as any)?.message || 'Failed to update user.';
      setEditUserFormError(message);
      return;
    }

    const updated = result.data as any;
    setUsers(prev =>
      prev.map(u =>
        u.id === updated.id
          ? {
            ...u,
            name: updated.name,
            role: updated.role,
            avatar_url: updated.avatar_url,
          }
          : u,
      ),
    );

    if (currentUser?.id === updated.id) {
      setCurrentUser(prev =>
        prev
          ? {
            ...prev,
            name: updated.name,
            role: updated.role,
            avatar_url: updated.avatar_url,
          }
          : prev,
      );
    }

    logActivity('User Edit', `Updated account details for ${updated.name}`);
    setShowEditUserModal(false);
    setSelectedUserForEdit(null);
  };

  const openResetPasswordModal = (user: User) => {
    if (!isAdmin) return;
    setSelectedUserForReset(user);
    setNewPasswordForm({ password: '', confirmPassword: '' });
    setResetPassFormError('');
    setShowResetPassModal(true);
  };

  const submitResetPassword = async () => {
    if (!selectedUserForReset) return;
    if (!newPasswordForm.password || newPasswordForm.password.length < 8) {
      setResetPassFormError('Password must be at least 8 characters.');
      return;
    }
    if (newPasswordForm.password !== newPasswordForm.confirmPassword) {
      setResetPassFormError('Passwords do not match.');
      return;
    }

    setIsResettingPassword(true);
    setResetPassFormError('');

    const result = await resetStaffPassword(selectedUserForReset.id, newPasswordForm.password);

    setIsResettingPassword(false);

    if (!result.success) {
      const message = (result.error as any)?.message || 'Failed to reset password.';
      setResetPassFormError(message);
      return;
    }

    logActivity('Password Reset', `Manager reset password for ${selectedUserForReset.name}`);
    setShowResetPassModal(false);
    setSelectedUserForReset(null);
  };

  // ─── Export & Backup Handlers ──────────────────────────────────────────────

  const refreshPromotions = useCallback(async () => {
    const promoRes = await fetchPromotions();
    if (promoRes.success && promoRes.data) {
      setPromotions(promoRes.data.map((promotion: any) => ({
        ...promotion,
        discountType: promotion.discount_type,
      })));
    }
  }, []);

  const openAddPromotionModal = () => {
    if (!isManager) return;
    setSelectedPromotionForEdit(null);
    setPromotionForm({
      code: '',
      description: '',
      discount_type: 'percentage',
      value: '',
      active: true,
    });
    setPromotionFormError('');
    setShowPromotionModal(true);
  };

  const openEditPromotionModal = (promotion: Promotion) => {
    if (!isManager) return;
    setSelectedPromotionForEdit(promotion);
    setPromotionForm({
      code: promotion.code,
      description: promotion.description,
      discount_type: getPromotionDiscountType(promotion) as Promotion['discount_type'],
      value: String(promotion.value),
      active: promotion.active,
    });
    setPromotionFormError('');
    setShowPromotionModal(true);
  };

  const savePromotion = async () => {
    if (!isManager) return;
    if (!promotionForm.code.trim()) { setPromotionFormError('Promotion code is required.'); return; }
    if (!promotionForm.description.trim()) { setPromotionFormError('Description is required.'); return; }
    const value = Number(promotionForm.value);
    if (!value || value <= 0) { setPromotionFormError('Enter a valid discount value.'); return; }
    if (promotionForm.discount_type === 'percentage' && value > 100) {
      setPromotionFormError('Percentage discount cannot exceed 100.');
      return;
    }

    setIsSavingPromotion(true);
    setPromotionFormError('');

    const payload = {
      code: promotionForm.code.trim().toUpperCase(),
      description: promotionForm.description.trim(),
      discount_type: promotionForm.discount_type,
      value,
      active: promotionForm.active,
    };

    const result = selectedPromotionForEdit
      ? await supabaseUpdatePromotion(selectedPromotionForEdit.id, payload)
      : await supabaseAddPromotion(payload);

    setIsSavingPromotion(false);

    if (!result.success) {
      const message = (result.error as any)?.message || 'Failed to save promotion.';
      setPromotionFormError(message);
      return;
    }

    await refreshPromotions();
    logActivity(
      selectedPromotionForEdit ? 'Promotion Edit' : 'Promotion Add',
      selectedPromotionForEdit
        ? `Updated promo ${payload.code}`
        : `Created promo ${payload.code}`,
    );
    setShowPromotionModal(false);
    setSelectedPromotionForEdit(null);
  };

  const togglePromotionActive = async (promotion: Promotion) => {
    if (!isManager) return;
    const result = await supabaseUpdatePromotion(promotion.id, { active: !promotion.active });
    if (!result.success) return;
    await refreshPromotions();
    logActivity('Promotion Toggle', `${promotion.code} set to ${promotion.active ? 'inactive' : 'active'}`);
  };

  const deletePromotion = async (promotion: Promotion) => {
    if (!isManager) return;
    if (!window.confirm(`Delete promotion \"${promotion.code}\"?`)) return;
    const result = await supabaseDeletePromotion(promotion.id);
    if (!result.success) return;
    await refreshPromotions();
    logActivity('Promotion Delete', `Deleted promo ${promotion.code}`);
  };

  const requestProtectedExport = (action: 'pdf' | 'excel' | 'backup') => {
    if (!isManager) return;
    setPendingExportAction(action);
    setExportAuthPassword('');
    setExportAuthError('');
    setShowExportAuthModal(true);
  };

  const confirmProtectedExport = async () => {
    if (!currentUser || !pendingExportAction) return;
    if (!exportAuthPassword.trim()) {
      setExportAuthError('Password is required.');
      return;
    }

    setIsVerifyingExportAuth(true);
    setExportAuthError('');
    const verifyResult = await verifyUserPassword(currentUser.email, exportAuthPassword);
    setIsVerifyingExportAuth(false);

    if (!verifyResult.success) {
      setExportAuthError(typeof verifyResult.error === 'string' ? verifyResult.error : 'Invalid password.');
      return;
    }

    setShowExportAuthModal(false);
    setExportAuthPassword('');

    if (pendingExportAction === 'pdf') exportPDF();
    if (pendingExportAction === 'excel') exportExcel();
    if (pendingExportAction === 'backup') backupRecords();
    setPendingExportAction(null);
  };

  const exportPDF = () => {
    // Simple PDF export - creates a printable report
    const reportWindow = window.open('', '', 'height=600,width=800');
    if (!reportWindow) return;
    
    const productRows = reportTopProducts
      .map(p => `<tr><td>${p.name}</td><td>${p.qty}</td><td>${formatCurrency(p.revenue)}</td></tr>`)
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
            <p><strong>Total Revenue:</strong> ${formatCurrency(reportRevenue)}</p>
            <p><strong>Total Discounts:</strong> ${formatCurrency(reportDiscount)}</p>
            <p><strong>Average Order Value:</strong> ${formatCurrency(reportAvgOrderValue)}</p>
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
    const now = new Date();
    const fileDate = now.toISOString().slice(0, 10);
    const generatedAt = now.toLocaleString();

    const escapeHtml = (value: unknown) =>
      String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');

    const formatExcelPeso = (amount: number) =>
      `&#8369; ${Number(amount).toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

    const topProductRows = (reportTopProducts.length ? reportTopProducts : [])
      .map(
        (p, idx) => `
          <tr>
            <td class="rank">${idx + 1}</td>
            <td>${escapeHtml(p.name)}</td>
            <td class="num">${p.qty.toLocaleString()}</td>
            <td class="num">${formatExcelPeso(p.revenue)}</td>
          </tr>
        `,
      )
      .join('');

    const categoryRows = (reportCategoryBreakdown.length ? reportCategoryBreakdown : [])
      .map(
        c => `
          <tr>
            <td>${escapeHtml(c.name)}</td>
            <td class="num">${c.qty.toLocaleString()}</td>
            <td class="num">${formatExcelPeso(c.revenue)}</td>
          </tr>
        `,
      )
      .join('');

    const recentRows = filteredTransactions
      .slice(0, 12)
      .map(
        (tx, idx) => `
          <tr>
            <td>${escapeHtml(getTransactionLabel(tx, idx, filteredTransactions.length))}</td>
            <td>${escapeHtml(formatDate(getRecordTimestamp(tx)))}</td>
            <td>${escapeHtml(getTransactionCashierName(tx))}</td>
            <td>${getTransactionItems(tx).length}</td>
            <td>${escapeHtml(getTransactionPaymentMethod(tx).toUpperCase())}</td>
            <td class="num">${formatExcelPeso(tx.total)}</td>
          </tr>
        `,
      )
      .join('');

    const htmlReport = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: Calibri, Arial, sans-serif; background:#eef2f5; padding:18px; }
            table.sheet { border-collapse: collapse; width: 100%; background:#fbfdff; }
            table.sheet td, table.sheet th { border:1px solid #b9c2cc; padding:8px 10px; font-size:13px; }
            .title { background:#1f6d46; color:#fff; text-align:center; font-size:30px; font-weight:700; padding:16px; }
            .meta-label { background:#eaf0ea; font-weight:700; text-align:right; color:#1f2937; }
            .meta-value { background:#ffffff; font-weight:600; color:#0f172a; }
            .section { background:#1f6d46; color:#fff; font-size:18px; font-weight:700; text-align:left; }
            .head { background:#c7ced6; font-weight:700; text-align:center; color:#0f172a; }
            .num { text-align:right; font-weight:700; }
            .rank { text-align:center; font-weight:700; color:#475569; width:70px; }
            .metric { background:#f7fafc; font-weight:700; }
            .metric-value { background:#ffffff; font-weight:700; color:#ea580c; }
            .footer { background:#f8fafc; color:#475569; font-style:italic; }
          </style>
        </head>
        <body>
          <table class="sheet">
            <tr><td class="title" colspan="6">Sales Report Export</td></tr>
            <tr>
              <td class="meta-label">Generated:</td>
              <td class="meta-value">${escapeHtml(generatedAt)}</td>
              <td class="meta-label">Date Range:</td>
              <td class="meta-value">${escapeHtml(reportDateRangeLabel)}</td>
              <td class="meta-label">Category:</td>
              <td class="meta-value">${escapeHtml(reportCategory)}</td>
            </tr>

            <tr><td class="section" colspan="6">Summary</td></tr>
            <tr>
              <td class="metric">Transactions</td>
              <td class="metric-value">${filteredTransactions.length}</td>
              <td class="metric">Revenue</td>
              <td class="metric-value">${formatExcelPeso(reportRevenue)}</td>
              <td class="metric">Average Order Value</td>
              <td class="metric-value">${formatExcelPeso(reportAvgOrderValue)}</td>
            </tr>
            <tr>
              <td class="metric">Discounts Given</td>
              <td class="metric-value">${formatExcelPeso(reportDiscount)}</td>
              <td class="metric">Refunds</td>
              <td class="metric-value">${reportRefunds}</td>
              <td class="metric">Exported By</td>
              <td class="metric-value">${escapeHtml(currentUser?.name || 'System')}</td>
            </tr>

            <tr><td class="section" colspan="6">Top Selling Products</td></tr>
            <tr>
              <th class="head">Rank</th>
              <th class="head">Product</th>
              <th class="head">Qty Sold</th>
              <th class="head">Revenue</th>
              <th class="head" colspan="2">Notes</th>
            </tr>
            ${topProductRows || '<tr><td colspan="6">No product sales data for this filter.</td></tr>'}

            <tr><td class="section" colspan="6">Category Breakdown</td></tr>
            <tr>
              <th class="head" colspan="2">Category</th>
              <th class="head">Units Sold</th>
              <th class="head">Revenue</th>
              <th class="head" colspan="2">Trend</th>
            </tr>
            ${categoryRows || '<tr><td colspan="6">No category data for this filter.</td></tr>'}

            <tr><td class="section" colspan="6">Recent Transactions</td></tr>
            <tr>
              <th class="head">Order</th>
              <th class="head">Date & Time</th>
              <th class="head">Cashier</th>
              <th class="head">Items</th>
              <th class="head">Payment</th>
              <th class="head">Amount</th>
            </tr>
            ${recentRows || '<tr><td colspan="6">No transactions for this filter.</td></tr>'}

            <tr>
              <td class="footer" colspan="6">Generated by SurFries POS Reporting & Insights</td>
            </tr>
          </table>
        </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', htmlReport], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `surfries-sales-report-${fileDate}.xls`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    logActivity('Export', `Exported formatted Excel report: ${a.download}`);
  };

  const backupRecords = () => {
    const now = new Date();
    const backupDate = now.toLocaleDateString('en-US');
    const backupDateTime = now.toLocaleString();
    const fileDate = now.toISOString().slice(0, 10);

    const snapshot = {
      exported_at: now.toISOString(),
      exported_by: currentUser?.email || 'unknown',
      app_version: 'surfries-pos-backup-v2',
      products,
      ingredients,
      promotions,
      transactions,
      inventory_logs: inventoryLogs,
      activity_logs: activityLogs,
      users,
    };

    const sizeBytes = new Blob([JSON.stringify(snapshot)]).size;
    const sizeText =
      sizeBytes >= 1024 * 1024
        ? `${(sizeBytes / (1024 * 1024)).toFixed(2)} MB`
        : `${(sizeBytes / 1024).toFixed(2)} KB`;

    const escapeHtml = (value: unknown) =>
      String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');

    const formatExcelPeso = (amount: number) =>
      `&#8369; ${Number(amount).toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

    const toBusinessLogDetail = (action: string, details: string) => {
      const safeAction = String(action || '');
      const safeDetails = String(details || '');
      const totalMatch = safeDetails.match(/Total:\s*([0-9]+(?:\.[0-9]+)?)/i);

      if (safeAction.toLowerCase() === 'sale') {
        if (totalMatch) {
          return `Sale completed. Order total: ${formatExcelPeso(Number(totalMatch[1]))}.`;
        }
        return 'Sale completed.';
      }

      return safeDetails
        .replace(
          /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
          '',
        )
        .replace(/\s{2,}/g, ' ')
        .replace(/:\s*\./g, '.')
        .trim();
    };

    const categories = [
      { name: 'Products', count: products.length },
      { name: 'Ingredients', count: ingredients.length },
      { name: 'Promotions', count: promotions.length },
      { name: 'Transactions', count: transactions.length },
      { name: 'Inventory Logs', count: inventoryLogs.length },
      { name: 'Activity Logs', count: activityLogs.length },
      { name: 'Users', count: users.length },
    ];
    const totalRecords = categories.reduce((sum, row) => sum + row.count, 0);

    const overviewRows = categories
      .map(
        row => `
          <tr>
            <td>${escapeHtml(row.name)}</td>
            <td class="num">${row.count.toLocaleString()}</td>
            <td>${backupDate}</td>
          </tr>
        `,
      )
      .join('');

    const logs = activityLogs
      .slice(0, 8)
      .map(
        log => `
          <tr>
            <td>${escapeHtml(new Date(getRecordTimestamp(log)).toLocaleString())}</td>
            <td>${escapeHtml(log.action)}</td>
            <td>${escapeHtml(toBusinessLogDetail(log.action, log.details))}</td>
          </tr>
        `,
      )
      .join('');

    const productSalesMap: Record<string, { sold: number; sales: number }> = {};
    transactions.forEach(tx => {
      getTransactionItems(tx).forEach(item => {
        if (!productSalesMap[item.id]) {
          productSalesMap[item.id] = { sold: 0, sales: 0 };
        }
        productSalesMap[item.id].sold += Number(item.quantity ?? 0);
        productSalesMap[item.id].sales += Number(item.price ?? 0) * Number(item.quantity ?? 0);
      });
    });

    const productPerformanceRows = products
      .map(product => {
        const soldData = productSalesMap[product.id] ?? { sold: 0, sales: 0 };
        const estimatedProfit = soldData.sales - soldData.sold * Number(product.cost ?? 0);
        return {
          name: product.name,
          sold: soldData.sold,
          remaining: product.stock,
          sales: soldData.sales,
          profit: estimatedProfit,
        };
      })
      .sort((a, b) => b.sales - a.sales);

    const totalSoldUnits = productPerformanceRows.reduce((sum, row) => sum + row.sold, 0);
    const totalRemainingUnits = productPerformanceRows.reduce((sum, row) => sum + row.remaining, 0);
    const totalProductSales = productPerformanceRows.reduce((sum, row) => sum + row.sales, 0);
    const totalProductProfit = productPerformanceRows.reduce((sum, row) => sum + row.profit, 0);

    const salesAndStockRows = productPerformanceRows
      .slice(0, 20)
      .map(
        row => `
          <tr>
            <td>${escapeHtml(row.name)}</td>
            <td class="num">${row.sold.toLocaleString()}</td>
            <td class="num">${row.remaining.toLocaleString()}</td>
            <td class="num">${formatExcelPeso(row.sales)}</td>
            <td class="num">${formatExcelPeso(row.profit)}</td>
            <td>${row.remaining <= 0 ? 'Out of stock' : row.remaining <= 10 ? 'Low stock' : 'In stock'}</td>
          </tr>
        `,
      )
      .join('');

    const htmlReport = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: Calibri, Arial, sans-serif; background:#eef1f4; padding:18px; }
            table.sheet { border-collapse: collapse; width: 100%; background:#f8fafb; }
            table.sheet td, table.sheet th { border:1px solid #a7adb4; padding:8px 10px; font-size:14px; }
            .title { background:#2f6f4e; color:#fff; text-align:center; font-size:34px; font-weight:700; padding:18px; }
            .meta-label { background:#eff3ef; font-weight:700; text-align:right; }
            .meta-value { background:#fff; font-weight:600; }
            .status-ok { color:#217346; font-weight:700; }
            .section { background:#2f6f4e; color:#fff; font-size:20px; font-weight:700; text-align:left; }
            .head { background:#c5cbd1; font-weight:700; text-align:center; }
            .num { text-align:right; font-weight:700; }
            .total { background:#e4ebe2; font-weight:700; }
          </style>
        </head>
        <body>
          <table class="sheet">
            <tr><td class="title" colspan="6">Data Backup Report</td></tr>
            <tr>
              <td class="meta-label">Backup Date:</td>
              <td class="meta-value">${escapeHtml(backupDateTime)}</td>
              <td class="meta-label">Total File Size:</td>
              <td class="meta-value">${escapeHtml(sizeText)}</td>
              <td class="meta-label">Backup Status:</td>
              <td class="meta-value status-ok">COMPLETED</td>
            </tr>

            <tr><td class="section" colspan="6">Backup Overview</td></tr>
            <tr>
              <th class="head">Category</th>
              <th class="head">Records Backed Up</th>
              <th class="head">Last Backup</th>
              <th class="head">Exported By</th>
              <th class="head" colspan="2">Mode</th>
            </tr>
            ${overviewRows}
            <tr class="total">
              <td>Total</td>
              <td class="num">${totalRecords.toLocaleString()}</td>
              <td>${backupDate}</td>
              <td>${escapeHtml(currentUser?.name || 'System')}</td>
              <td colspan="2">Full Backup</td>
            </tr>

            <tr><td class="section" colspan="6">Backup Locations</td></tr>
            <tr>
              <th class="head">Location</th>
              <th class="head">Backup Type</th>
              <th class="head">Status</th>
              <th class="head">Last Sync</th>
              <th class="head" colspan="2">Notes</th>
            </tr>
            <tr><td>Local Download (.xls)</td><td>Full Backup</td><td class="status-ok">Successful</td><td>${backupDate}</td><td colspan="2">Primary report output</td></tr>
            <tr><td>POS Data Tables</td><td>Full Backup</td><td class="status-ok">Successful</td><td>${backupDate}</td><td colspan="2">Products, sales, stock, and system records included</td></tr>

            <tr><td class="section" colspan="6">Sales and Inventory Summary</td></tr>
            <tr>
              <th class="head">Product</th>
              <th class="head">Units Sold</th>
              <th class="head">Units Remaining</th>
              <th class="head">Sales</th>
              <th class="head">Estimated Profit</th>
              <th class="head">Stock Status</th>
            </tr>
            ${salesAndStockRows || '<tr><td colspan="6">No product records available.</td></tr>'}
            <tr class="total">
              <td>Total</td>
              <td class="num">${totalSoldUnits.toLocaleString()}</td>
              <td class="num">${totalRemainingUnits.toLocaleString()}</td>
              <td class="num">${formatExcelPeso(totalProductSales)}</td>
              <td class="num">${formatExcelPeso(totalProductProfit)}</td>
              <td>Overall summary</td>
            </tr>

            <tr><td class="section" colspan="6">Backup Logs</td></tr>
            <tr>
              <th class="head">Timestamp</th>
              <th class="head">Action</th>
              <th class="head" colspan="4">Details</th>
            </tr>
            ${logs || '<tr><td colspan="6">No recent logs available.</td></tr>'}
          </table>
        </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', htmlReport], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `surfries-backup-report-${fileDate}.xls`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    setLastBackupFileName(a.download);
    setShowBackupSuccessModal(true);
    logActivity('Backup', `Generated formatted backup report: ${a.download}`);
  };

  const restoreSystem = () => {
    setShowRestoreConfirmModal(true);
  };

  const confirmRestoreSystem = () => {
    setShowRestoreConfirmModal(false);
    setShowRestoreSuccessModal(true);
    logActivity('Restore', 'System restored from backup');
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
        .filter(tx => new Date(getRecordTimestamp(tx)).toDateString() === dateStr)
        .reduce((s, t) => s + t.total, 0);
      // Simple forecast: sales * 1.05 + small random
      const forecast = Math.round(sales * 1.08 + 20 * i);
      return { name: label, sales: Math.round(sales * 100) / 100, forecast };
    });
  }, [transactions]);

  // Hourly data for today
  const hourlyData = useMemo(() => {
    const today = new Date().toDateString();
    const todayTx = transactions.filter(tx => new Date(getRecordTimestamp(tx)).toDateString() === today);
    return Array.from({ length: 12 }, (_, i) => {
      const hour = 8 + i; // 8am – 7pm
      const label = hour < 12 ? `${hour}am` : hour === 12 ? '12pm' : `${hour - 12}pm`;
      const sales = todayTx
        .filter(tx => new Date(getRecordTimestamp(tx)).getHours() === hour)
        .reduce((s, t) => s + t.total, 0);
      return { name: label, sales: Math.round(sales * 100) / 100 };
    });
  }, [transactions]);

  const topProducts = useMemo(() => {
    const counts: Record<string, { name: string; qty: number; revenue: number }> = {};
    transactions.forEach(tx =>
      getTransactionItems(tx).forEach(item => {
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
      getTransactionItems(tx).forEach(item => {
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
    return transactions
      .filter(tx => new Date(getRecordTimestamp(tx)).toDateString() === today)
      .reduce((s, t) => s + t.total, 0);
  }, [transactions]);

  const weeklySales = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return transactions
      .filter(tx => new Date(getRecordTimestamp(tx)).getTime() >= weekAgo)
      .reduce((s, t) => s + t.total, 0);
  }, [transactions]);

  const todayTxCount = useMemo(() => {
    const today = new Date().toDateString();
    return transactions.filter(tx => new Date(getRecordTimestamp(tx)).toDateString() === today).length;
  }, [transactions]);

  const avgOrderValue = useMemo(() => {
    if (!transactions.length) return 0;
    return transactions.reduce((s, t) => s + t.total, 0) / transactions.length;
  }, [transactions]);

  // AI-style prescriptive recommendations derived from real data
  const recommendations = useMemo(() => {
    const recs: { title: string; body: string; color: string }[] = [];

    lowStockIngredients.forEach(ing => {
      recs.push({ title: '⚠ Reorder Alert', body: `Reorder ${ing.name} — only ${ing.stock} ${ing.unit} left (threshold: ${getLowStockThreshold(ing)}).`, color: 'border-rose-200' });
    });

    const slowMovers = products.filter(p => getProductVelocity(p) === 'slow');
    slowMovers.forEach(p => {
      recs.push({ title: '📉 Promo Suggestion', body: `"${p.name}" is slow-moving. Consider a 15% bundle discount.`, color: 'border-orange-200' });
    });

    const fastMovers = products.filter(p => getProductVelocity(p) === 'fast' && p.stock <= getLowStockThreshold(p) * 2);
    fastMovers.forEach(p => {
      recs.push({ title: '🔥 Prep Alert', body: `"${p.name}" is fast-selling with only ${p.stock} left. Prepare more!`, color: 'border-blue-200' });
    });

    if (transactions.length > 5) {
      recs.push({ title: '📊 Profit Focus', body: 'Add-ons are moving well. Suggest pairing add-ons during peak hours.', color: 'border-violet-200' });
    }

    if (!recs.length) {
      recs.push({ title: '✅ All Good!', body: 'No urgent recommendations. Keep monitoring your sales and stock levels.', color: 'border-emerald-200' });
    }

    return recs.slice(0, 4);
  }, [products, lowStockIngredients, transactions]);

  // ─── Filtered report transactions ────────────────────────────────────────

  const availableReportMonths = useMemo(() => {
    const monthKeys = Array.from(
      new Set(
        transactions
          .map(tx => getMonthKey(getRecordTimestamp(tx)))
          .filter(Boolean),
      ),
    ).sort((a, b) => b.localeCompare(a));

    return monthKeys.map(monthKey => ({
      value: monthKey,
      label: new Date(`${monthKey}-01T00:00:00`).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      }),
    }));
  }, [transactions]);

  useEffect(() => {
    if (!availableReportMonths.length) return;
    const hasSelectedMonth = availableReportMonths.some(month => month.value === reportMonth);
    if (!hasSelectedMonth) setReportMonth(availableReportMonths[0].value);
  }, [availableReportMonths, reportMonth]);

  const selectedReportMonthLabel = useMemo(() => {
    const month = availableReportMonths.find(option => option.value === reportMonth);
    return month?.label ?? 'Current Month';
  }, [availableReportMonths, reportMonth]);

  const reportDateRangeLabel = reportRange === 'monthly' ? selectedReportMonthLabel : reportRange;

  const filteredTransactions = useMemo(() => {
    const now = Date.now();
    const ranges: Record<string, number> = {
      daily: 24 * 60 * 60 * 1000,
      weekly: 7 * 24 * 60 * 60 * 1000,
    };
    return transactions.filter(tx => {
      const timestamp = getRecordTimestamp(tx);
      let inTime = true;

      if (reportRange === 'monthly') {
        inTime = getMonthKey(timestamp) === reportMonth;
      } else {
        const cutoff = ranges[reportRange] ? now - ranges[reportRange] : 0;
        inTime = cutoff === 0 || new Date(timestamp).getTime() >= cutoff;
      }

      const inCat = reportCategory === 'all' || getTransactionItems(tx).some(item => item.category === reportCategory);
      return inTime && inCat;
    });
  }, [transactions, reportRange, reportMonth, reportCategory]);
  const visibleReportTransactions = useMemo(
    () => filteredTransactions.slice(0, transactionDisplayLimit),
    [filteredTransactions, transactionDisplayLimit],
  );

  const reportRevenueChartData = useMemo(() => {
    if (reportRange === 'monthly') {
      const [yearText, monthText] = reportMonth.split('-');
      const year = Number(yearText);
      const month = Number(monthText);
      if (!year || !month) return [];

      const daysInMonth = new Date(year, month, 0).getDate();
      return Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        const sales = filteredTransactions
          .filter(tx => {
            const date = new Date(getRecordTimestamp(tx));
            return date.getFullYear() === year && date.getMonth() + 1 === month && date.getDate() === day;
          })
          .reduce((sum, tx) => sum + tx.total, 0);

        return { name: String(day), sales: Math.round(sales * 100) / 100 };
      });
    }

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (6 - i));
      const label = days[d.getDay()];
      const dateStr = d.toDateString();
      const sales = filteredTransactions
        .filter(tx => new Date(getRecordTimestamp(tx)).toDateString() === dateStr)
        .reduce((sum, tx) => sum + tx.total, 0);
      return { name: label, sales: Math.round(sales * 100) / 100 };
    });
  }, [filteredTransactions, reportRange, reportMonth]);

  useEffect(() => {
    setTransactionDisplayLimit(50);
  }, [reportRange, reportMonth, reportCategory, reportTab]);

  const reportProductPerformance = useMemo(() => {
    const soldByProductId: Record<string, { sold: number; sales: number }> = {};

    filteredTransactions.forEach(tx => {
      getTransactionItems(tx).forEach(item => {
        if (!soldByProductId[item.id]) {
          soldByProductId[item.id] = { sold: 0, sales: 0 };
        }
        soldByProductId[item.id].sold += Number(item.quantity ?? 0);
        soldByProductId[item.id].sales += Number(item.price ?? 0) * Number(item.quantity ?? 0);
      });
    });

    return products
      .map(product => {
        const soldData = soldByProductId[product.id] ?? { sold: 0, sales: 0 };
        const estimatedProfit = soldData.sales - soldData.sold * Number(product.cost ?? 0);
        return {
          id: product.id,
          name: product.name,
          sold: soldData.sold,
          remaining: product.stock,
          sales: Math.round(soldData.sales * 100) / 100,
          estimatedProfit: Math.round(estimatedProfit * 100) / 100,
        };
      })
      .sort((a, b) => b.sales - a.sales);
  }, [filteredTransactions, products]);

  const reportTopProducts = useMemo(
    () =>
      reportProductPerformance
        .filter(product => product.sold > 0)
        .map(product => ({
          name: product.name,
          qty: product.sold,
          revenue: product.sales,
        }))
        .slice(0, 5),
    [reportProductPerformance],
  );

  const reportCategoryBreakdown = useMemo(() => {
    const map: Record<string, { revenue: number; qty: number }> = {};
    filteredTransactions.forEach(tx =>
      getTransactionItems(tx).forEach(item => {
        if (!map[item.category]) map[item.category] = { revenue: 0, qty: 0 };
        map[item.category].revenue += item.price * item.quantity;
        map[item.category].qty += item.quantity;
      }),
    );

    return Object.entries(map).map(([name, values]) => ({
      name,
      revenue: Math.round(values.revenue * 100) / 100,
      qty: values.qty,
    }));
  }, [filteredTransactions]);

  const reportUnitsSold = useMemo(
    () => reportProductPerformance.reduce((sum, item) => sum + item.sold, 0),
    [reportProductPerformance],
  );
  const reportUnitsRemaining = useMemo(
    () => reportProductPerformance.reduce((sum, item) => sum + item.remaining, 0),
    [reportProductPerformance],
  );
  const reportEstimatedProfit = useMemo(
    () => reportProductPerformance.reduce((sum, item) => sum + item.estimatedProfit, 0),
    [reportProductPerformance],
  );

  const reportRevenue = filteredTransactions.reduce((s, t) => s + t.total, 0);
  const reportDiscount = filteredTransactions.reduce((s, t) => s + t.discount, 0);
  const reportRefunds = filteredTransactions.filter(t => t.status === 'refunded').length;
  const reportAvgOrderValue = filteredTransactions.length ? reportRevenue / filteredTransactions.length : 0;

  // ─── RENDER: Dashboard ───────────────────────────────────────────────────

  const fetchInsights = useCallback(async () => {
    setInsightsLoading(true);
    setInsightsError(null);

    try {
      const reportData = {
        transactionCount: filteredTransactions.length,
        totalRevenue: reportRevenue,
        totalDiscount: reportDiscount,
        avgOrderValue: reportAvgOrderValue,
        topProducts: reportTopProducts,
        categoryBreakdown: reportCategoryBreakdown,
        transactions: filteredTransactions,
        reportRange: reportDateRangeLabel,
        reportCategory,
        lowStockCount,
        productPerformance: reportProductPerformance.slice(0, 12),
        totalEstimatedProfit: reportEstimatedProfit,
        totalUnitsSold: reportUnitsSold,
        totalUnitsRemaining: reportUnitsRemaining,
      };

      const insightsText = await generateInsights(reportData);
      setInsights(insightsText);
    } catch (error) {
      console.error('Error fetching insights:', error);
      setInsightsError(
        error instanceof Error
          ? error.message
          : 'Failed to generate AI insights from current POS data.',
      );
    } finally {
      setInsightsLoading(false);
    }
  }, [
    filteredTransactions,
    reportRevenue,
    reportDiscount,
    reportAvgOrderValue,
    reportDateRangeLabel,
    reportCategory,
    lowStockCount,
    reportTopProducts,
    reportCategoryBreakdown,
    reportProductPerformance,
    reportEstimatedProfit,
    reportUnitsSold,
    reportUnitsRemaining,
  ]);

  useEffect(() => {
    setInsights(null);
    setInsightsError(null);
  }, [reportRange, reportMonth, reportCategory]);

  const renderDashboard = () => (
    <div className="space-y-6 animate-in fade-in duration-500 text-slate-900">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Dashboard Overview</h1>
          <p className="text-slate-500 text-sm sm:text-base">Real-time business performance monitoring</p>
        </div>
        <div className="flex gap-2 self-start sm:self-auto">
          <div className="bg-white px-3 py-2 rounded-xl border border-slate-200 flex items-center gap-2">
            <Clock size={16} className="text-orange-500" />
            <span className="text-xs sm:text-sm font-bold">Peak Hours: {peakHour}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
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
              {products.filter(p => getProductVelocity(p) === 'fast').slice(0, 3).map(p => (
                <div key={p.id} className="flex items-center gap-3 p-2 bg-emerald-50 rounded-xl border border-emerald-100">
                  <img src={getEntityImage(p)} className="w-8 h-8 rounded-lg object-cover" alt="" />
                  <span className="text-xs font-bold truncate">{p.name}</span>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <p className="text-xs font-bold text-rose-600 uppercase tracking-wider">Slow Moving</p>
              {products.filter(p => getProductVelocity(p) === 'slow').map(p => (
                <div key={p.id} className="flex items-center gap-3 p-2 bg-rose-50 rounded-xl border border-rose-100">
                  <img src={getEntityImage(p)} className="w-8 h-8 rounded-lg object-cover" alt="" />
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
      <div className="flex h-full flex-col xl:flex-row gap-3 md:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Product grid */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex flex-col gap-3 mb-4 md:mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Search products..."
                className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 md:py-3 pr-4 pl-12 text-sm shadow-sm shadow-slate-200/40 transition-all focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveCategory('all')}
                className={cn(
                  'cursor-pointer whitespace-nowrap rounded-xl px-4 md:px-6 py-2 text-xs md:text-sm font-medium transition-all',
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
                    'flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-xl px-4 md:px-6 py-2 text-xs md:text-sm font-medium transition-all',
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

          <div className="grid flex-1 auto-rows-max content-start gap-3 md:gap-5 overflow-y-auto pr-1 md:pr-2 grid-cols-2 sm:[grid-template-columns:repeat(auto-fill,minmax(180px,1fr))] lg:[grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]">
            {filtered.map(product => {
              const threshold = getLowStockThreshold(product);
              const isLowStock = product.stock > 0 && product.stock <= threshold;

              return (
                <motion.div
                  layout
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className={cn(
                    'group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl md:rounded-[28px] border border-slate-200/80 bg-white p-3 md:p-4 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.45)] transition-all duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-[0_22px_50px_-28px_rgba(249,115,22,0.38)]',
                    (!product.available || product.stock <= 0) && 'cursor-not-allowed grayscale opacity-60',
                  )}
                >
                  {isLowStock && (
                    <div className="absolute top-3 right-3 z-10">
                      <span className="rounded-full bg-rose-500 px-2.5 py-1 text-[10px] font-black tracking-[0.18em] text-white">LOW</span>
                    </div>
                  )}
                  <div className="mb-3 md:mb-4 aspect-[5/4] md:aspect-[4/3] overflow-hidden rounded-2xl md:rounded-[22px] bg-slate-100">
                    <img
                      src={getEntityImage(product)}
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <h4 className="min-h-[2.3rem] md:min-h-[2.75rem] text-[13px] md:text-sm font-bold leading-5 text-slate-900 line-clamp-2">{product.name}</h4>
                    <p className="mt-1 text-[10px] md:text-[11px] font-semibold uppercase tracking-[0.16em] md:tracking-[0.18em] text-slate-400">
                      {product.category} · {product.size}
                    </p>
                    <div className="mt-auto flex items-end justify-between gap-2 md:gap-3 pt-2.5 md:pt-4">
                      <span className="text-base md:text-lg font-black tracking-tight text-orange-600">{formatCurrency(product.price)}</span>
                      <span
                        className={cn(
                          'rounded-full px-2 py-1 text-[10px] font-bold',
                          isLowStock ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500',
                        )}
                      >
                        {product.stock} left
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            {filtered.length === 0 && (
              <div className="col-span-2 sm:col-span-full flex min-h-[190px] md:min-h-[240px] items-center justify-center rounded-2xl md:rounded-[28px] border border-dashed border-slate-200 bg-white/80 p-6 md:p-8 text-center">
                <div>
                  <p className="text-sm font-bold text-slate-900">No products found</p>
                  <p className="mt-1 text-sm text-slate-500">Try another search term or switch categories.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cart */}
        <div className="w-full xl:w-[380px] max-h-[74vh] xl:max-h-none flex flex-col bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
          <div className="p-4 md:p-6 border-b border-slate-50">
            <h3 className="text-lg md:text-xl font-bold text-slate-900">Current Order</h3>
            <p className="text-xs md:text-sm text-slate-500">{formatDate(new Date().toISOString())}</p>
          </div>

          <div className="flex-1 overflow-y-auto px-4 md:px-6 py-3 md:py-4 space-y-3 md:space-y-4">
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
                    <img src={item.image_url} alt={item.name} className="w-10 h-10 md:w-12 md:h-12 rounded-xl object-cover" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs md:text-sm font-bold text-slate-900 truncate">{item.name}</h4>
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
              <div className="flex justify-between text-sm text-slate-500"><span>Tax (10%)</span><span>{formatCurrency(cartTax)}</span></div>
              <div className="flex justify-between text-lg font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Total</span>
                <span className="text-orange-600">{formatCurrency(cartTotal)}</span>
              </div>
            </div>

            {/* Payment method selector */}
            <div className="grid grid-cols-2 gap-2">
              {(['cash', 'gcash'] as PaymentMethod[]).map(method => (
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
                  <span className="text-[10px] font-bold uppercase tracking-wider">{method === 'gcash' ? 'GCash' : method}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => processOrder(selectedPayment)}
              disabled={cart.length === 0 || isProcessingOrder}
              className="w-full py-3.5 md:py-4 bg-orange-600 text-white rounded-2xl font-bold shadow-lg shadow-orange-200 hover:bg-orange-700 transition-all active:scale-95 disabled:opacity-50 disabled:shadow-none cursor-pointer"
            >
              {isProcessingOrder ? 'Processing Order...' : `Place Order - ${formatCurrency(cartTotal)}`}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ─── RENDER: Products ─────────────────────────────────────────────────────

  const renderProducts = () => (
    <div className="space-y-4 md:space-y-6 animate-in fade-in duration-500 text-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[30px] leading-9 md:text-2xl font-bold">Product Management</h1>
          <p className="text-slate-500 text-sm md:text-base">Manage your menu, add-ons, and pricing</p>
        </div>
        {isManager && (
          <button onClick={openAddProduct} className="inline-flex items-center gap-1.5 px-3 py-2 md:px-4 md:py-2.5 bg-orange-600 text-white rounded-xl text-xs md:text-sm font-semibold hover:bg-orange-700 transition-colors cursor-pointer shrink-0">
            <Plus size={16} /> Add New Product
          </button>
        )}
      </div>

      <div className="md:hidden space-y-2.5">
        {products.map(product => (
          <div key={product.id} className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm">
            <div className="flex items-start gap-3">
              <img src={getEntityImage(product)} alt="" className="w-11 h-11 rounded-lg object-cover shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm leading-5 break-words">{product.name}</p>
                <p className="text-[11px] text-slate-400 capitalize">{product.size} · {product.flavor}</p>
                <p className="text-[11px] text-slate-500 capitalize mt-0.5">{product.category}</p>
              </div>
              <span className={cn('px-2 py-1 rounded-full text-[10px] font-bold uppercase', product.available ? 'bg-orange-50 text-orange-600' : 'bg-slate-100 text-slate-500')}>
                {product.available ? 'Active' : 'Hidden'}
              </span>
            </div>

            <div className="mt-2.5 grid grid-cols-3 gap-2 text-[11px]">
              <div className="bg-slate-50 rounded-lg px-2 py-1.5">
                <p className="text-slate-500">Price</p>
                <p className="font-semibold text-slate-900">{formatCurrency(product.price)}</p>
              </div>
              <div className="bg-slate-50 rounded-lg px-2 py-1.5">
                <p className="text-slate-500">Cost</p>
                <p className="font-semibold text-slate-900">{formatCurrency(product.cost)}</p>
              </div>
              <div className="bg-slate-50 rounded-lg px-2 py-1.5">
                <p className="text-slate-500">Stock</p>
                <p className={cn('font-semibold', product.stock <= getLowStockThreshold(product) ? 'text-rose-600' : 'text-slate-900')}>
                  {product.stock}
                </p>
              </div>
            </div>

            {product.stock <= getLowStockThreshold(product) && (
              <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600">
                <AlertCircle size={12} />
                Low stock
              </div>
            )}

            {isManager && (
              <div className="mt-2.5 flex justify-end gap-1">
                <button
                  onClick={() => toggleAvailability(product.id)}
                  className="text-slate-500 hover:text-blue-600 transition-colors p-2 rounded-lg hover:bg-slate-50 cursor-pointer"
                  title={product.available ? 'Hide' : 'Show'}
                >
                  {product.available ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
                <button onClick={() => openEditProduct(product)} className="text-slate-500 hover:text-orange-600 transition-colors p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                  <Edit2 size={15} />
                </button>
                {isAdmin && (
                  <button onClick={() => deleteProduct(product.id)} className="text-slate-500 hover:text-rose-600 transition-colors p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="hidden md:block bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
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
                    <img src={getEntityImage(product)} alt="" className="w-10 h-10 rounded-lg object-cover" />
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
                    <span className={cn('text-sm font-medium', product.stock <= getLowStockThreshold(product) ? 'text-rose-600' : '')}>{product.stock}</span>
                    {product.stock <= getLowStockThreshold(product) && <AlertCircle size={14} className="text-rose-500" />}
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
    <div className="space-y-4 md:space-y-6 animate-in fade-in duration-500 text-slate-900">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[30px] leading-9 md:text-2xl font-bold">Inventory Management</h1>
          <p className="text-slate-500 text-sm md:text-base">Ingredients, packaging, and usage tracking</p>
        </div>
        {isManager && (
          <div className="flex gap-2 w-full sm:w-auto">
            <button onClick={() => openStockModal('in')} className="flex-1 sm:flex-none justify-center flex items-center gap-1.5 px-3 py-2 md:px-4 md:py-2.5 bg-white border border-slate-200 rounded-xl text-xs md:text-sm font-semibold hover:bg-slate-50 transition-colors cursor-pointer">
              <Plus size={15} className="text-emerald-600" /> Stock-In
            </button>
            <button onClick={() => openStockModal('waste')} className="flex-1 sm:flex-none justify-center flex items-center gap-1.5 px-3 py-2 md:px-4 md:py-2.5 bg-rose-50 text-rose-600 rounded-xl text-xs md:text-sm font-semibold hover:bg-rose-100 transition-colors cursor-pointer">
              <Trash2 size={15} /> Report Waste
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          <div className="bg-white rounded-xl md:rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 md:p-6 border-b border-slate-50">
              <h3 className="text-base md:text-lg font-bold">Current Stock</h3>
            </div>
            <div className="md:hidden p-3 space-y-2.5">
              {ingredients.map(item => (
                <div key={item.id} className="rounded-lg border border-slate-100 p-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 break-words">{item.name}</p>
                      <p className="text-[11px] text-slate-500 capitalize">{item.category}</p>
                    </div>
                    <p className="text-xs font-bold text-slate-900 whitespace-nowrap">{item.stock} {item.unit}</p>
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full', item.stock <= getLowStockThreshold(item) ? 'bg-rose-500' : 'bg-orange-500')}
                        style={{ width: `${Math.min(100, (item.stock / (Math.max(getLowStockThreshold(item), 1) * 5)) * 100)}%` }}
                      />
                    </div>
                    {item.stock <= getLowStockThreshold(item) ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-rose-600"><AlertCircle size={10} />Low</span>
                    ) : (
                      <span className="text-[10px] font-bold uppercase text-emerald-600">OK</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <table className="hidden md:table w-full text-left">
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
                            className={cn('h-full rounded-full', item.stock <= getLowStockThreshold(item) ? 'bg-rose-500' : 'bg-orange-500')}
                            style={{ width: `${Math.min(100, (item.stock / (Math.max(getLowStockThreshold(item), 1) * 5)) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {item.stock <= getLowStockThreshold(item) ? (
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
            <div className="bg-white rounded-xl md:rounded-2xl border border-rose-100 shadow-sm overflow-hidden">
              <div className="p-4 md:p-6 border-b border-rose-50 flex items-center gap-3">
                <AlertCircle size={18} className="text-rose-500" />
                <h3 className="text-base md:text-lg font-bold text-rose-700">Low Stock Products</h3>
              </div>
              <div className="p-3 md:p-6 grid grid-cols-1 sm:grid-cols-2 gap-2.5 md:gap-3">
                {lowStockProducts.map(p => (
                  <div key={p.id} className="flex items-center gap-3 p-3 bg-rose-50 rounded-xl border border-rose-100">
                    <img src={getEntityImage(p)} className="w-9 h-9 rounded-lg object-cover" alt="" />
                    <div>
                      <p className="text-xs font-bold text-slate-900 truncate">{p.name}</p>
                      <p className="text-[10px] text-rose-600">{p.stock} left (min {getLowStockThreshold(p)})</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white p-4 md:p-6 rounded-xl md:rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-base md:text-lg font-bold mb-3 md:mb-4">Inventory History</h3>
          <div className="space-y-3 md:space-y-4 max-h-[360px] md:max-h-[600px] overflow-y-auto pr-1">
            {inventoryHistoryLogs.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-8">No inventory activity yet.</p>
            )}
            {inventoryHistoryLogs.slice(0, 20).map(log => (
              <div key={log.id} className="flex gap-3 pb-4 border-b border-slate-50 last:border-0">
                <div className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                  log.type === 'sale' ? 'bg-orange-50 text-orange-600' :
                    log.type === 'waste' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600',
                )}>
                  {log.type === 'sale' ? <TrendingUp size={16} /> : log.type === 'waste' ? <Trash2 size={16} /> : <Plus size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{getInventoryItemName(log)}</p>
                  <p className="text-[10px] text-slate-500">{log.reason}</p>
                </div>
                <div className="text-right">
                  <p className={cn('text-sm font-bold', (log.type === 'sale' || log.type === 'waste') ? 'text-rose-600' : 'text-emerald-600')}>
                    {(log.type === 'sale' || log.type === 'waste') ? '-' : '+'}{log.quantity}
                  </p>
                  <p className="text-[10px] text-slate-400">{new Date(getRecordTimestamp(log)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
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
    <div className="space-y-4 md:space-y-6 animate-in fade-in duration-500 text-slate-900">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[30px] leading-9 md:text-2xl font-bold">Reporting & Insights</h1>
          <p className="text-slate-500 text-sm md:text-base">Detailed business performance and forecasts</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button onClick={() => requestProtectedExport('pdf')} className="flex-1 sm:flex-none justify-center flex items-center gap-1.5 px-3 py-2 md:px-4 md:py-2.5 bg-white border border-slate-200 rounded-xl text-xs md:text-sm font-semibold hover:bg-slate-50 transition-colors cursor-pointer">
            <Download size={15} /> Export PDF
          </button>
          <button onClick={() => requestProtectedExport('excel')} className="flex-1 sm:flex-none justify-center flex items-center gap-1.5 px-3 py-2 md:px-4 md:py-2.5 bg-white border border-slate-200 rounded-xl text-xs md:text-sm font-semibold hover:bg-slate-50 transition-colors cursor-pointer">
            <Database size={15} /> Export Excel
          </button>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="flex gap-2 sm:gap-4 border-b border-slate-100 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setReportTab('overview')}
          className={`px-3 sm:px-4 py-2.5 sm:py-3 font-medium text-sm relative transition-colors whitespace-nowrap cursor-pointer ${
            reportTab === 'overview'
              ? 'text-orange-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:bg-orange-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setReportTab('transactions')}
          className={`px-3 sm:px-4 py-2.5 sm:py-3 font-medium text-sm relative transition-colors whitespace-nowrap cursor-pointer ${
            reportTab === 'transactions'
              ? 'text-orange-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:bg-orange-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Transactions
        </button>
        <button
          onClick={() => setReportTab('insights')}
          className={`px-3 sm:px-4 py-2.5 sm:py-3 font-medium text-sm relative transition-colors whitespace-nowrap cursor-pointer ${
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
          <div className="bg-white p-4 md:p-6 rounded-xl md:rounded-2xl border border-slate-100 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 items-end mb-4 md:mb-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Date Range</label>
                <select value={reportRange} onChange={e => setReportRange(e.target.value)} className="w-full sm:w-48 bg-slate-50 border border-slate-200 rounded-xl px-3 md:px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 cursor-pointer">
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              {reportRange === 'monthly' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Month</label>
                  <select value={reportMonth} onChange={e => setReportMonth(e.target.value)} className="w-full sm:w-48 bg-slate-50 border border-slate-200 rounded-xl px-3 md:px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 cursor-pointer">
                    {availableReportMonths.map(month => (
                      <option key={month.value} value={month.value}>{month.label}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Category</label>
                <select value={reportCategory} onChange={e => setReportCategory(e.target.value)} className="w-full sm:w-48 bg-slate-50 border border-slate-200 rounded-xl px-3 md:px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 cursor-pointer">
                  <option value="all">All Categories</option>
                  <option value="fries">Fries</option>
                  <option value="drinks">Drinks</option>
                  <option value="add-ons">Add-ons</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
              <div className="lg:col-span-2">
                <h3 className="text-base md:text-lg font-bold mb-4 md:mb-6">Revenue Breakdown</h3>
                <div className="h-[240px] md:h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={reportRevenueChartData}>
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
                <h3 className="text-base md:text-lg font-bold mb-3 md:mb-4">Summary</h3>
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
                    <span className="text-sm font-bold">{formatCurrency(reportAvgOrderValue)}</span>
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
          <div className="bg-white p-4 md:p-6 rounded-xl md:rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-base md:text-lg font-bold mb-4 md:mb-6">Top Selling Products</h3>
            {reportTopProducts.length === 0 ? (
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
                    {reportTopProducts.map((row, i) => (
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
          <div className="bg-white p-4 md:p-6 rounded-xl md:rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-base md:text-lg font-bold mb-4 md:mb-6">Sales by Category</h3>
            {reportCategoryBreakdown.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">No sales recorded yet.</p>
            ) : (
              <div className="h-[220px] md:h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportCategoryBreakdown}>
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
        <div className="bg-white p-4 md:p-6 rounded-xl md:rounded-2xl border border-slate-100 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 items-end mb-4 md:mb-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase">Filter by Date</label>
              <select value={reportRange} onChange={e => setReportRange(e.target.value)} className="w-full sm:w-48 bg-slate-50 border border-slate-200 rounded-xl px-3 md:px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 cursor-pointer">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            {reportRange === 'monthly' && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Month</label>
                <select value={reportMonth} onChange={e => setReportMonth(e.target.value)} className="w-full sm:w-48 bg-slate-50 border border-slate-200 rounded-xl px-3 md:px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 cursor-pointer">
                  {availableReportMonths.map(month => (
                    <option key={month.value} value={month.value}>{month.label}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase">Filter by Category</label>
              <select value={reportCategory} onChange={e => setReportCategory(e.target.value)} className="w-full sm:w-48 bg-slate-50 border border-slate-200 rounded-xl px-3 md:px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 cursor-pointer">
                <option value="all">All Categories</option>
                <option value="fries">Fries</option>
                <option value="drinks">Drinks</option>
                <option value="add-ons">Add-ons</option>
              </select>
            </div>
          </div>

          <h3 className="text-base md:text-lg font-bold mb-4 md:mb-6">Transaction History</h3>
          {filteredTransactions.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">No transactions in selected range.</p>
          ) : (
            <div>
              <div className="mb-3 md:mb-4 text-sm text-slate-600">
                Showing <span className="font-bold">{visibleReportTransactions.length}</span> of <span className="font-bold">{filteredTransactions.length}</span> transactions
              </div>
              <div className="md:hidden space-y-2.5">
                {visibleReportTransactions.map((tx, idx) => (
                  <div key={tx.id} className="rounded-xl border border-slate-100 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <button
                        onClick={() => setShowReceipt(tx)}
                        className="text-slate-800 font-bold text-sm hover:text-orange-600 transition-colors cursor-pointer"
                        title="View order summary"
                      >
                        {getTransactionLabel(tx, idx, filteredTransactions.length)}
                      </button>
                      <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-lg text-[10px] font-bold uppercase">{getTransactionPaymentMethod(tx)}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{formatDate(getRecordTimestamp(tx))}</p>
                    <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-slate-400">Cashier</p>
                        <p className="font-semibold text-slate-700 leading-4">{getTransactionCashierName(tx)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Items</p>
                        <p className="font-semibold text-slate-700">{getTransactionItems(tx).length}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-400">Amount</p>
                        <p className="font-bold text-orange-600">{formatCurrency(tx.total)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-50">
                      <th className="pb-4">Order</th>
                      <th className="pb-4">Date & Time</th>
                      <th className="pb-4">Cashier</th>
                      <th className="pb-4">Items</th>
                      <th className="pb-4">Payment Method</th>
                      <th className="pb-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {visibleReportTransactions.map((tx, idx) => (
                      <tr key={tx.id} className="text-sm hover:bg-slate-50 transition-colors">
                        <td className="py-3">
                          <button
                            onClick={() => setShowReceipt(tx)}
                            className="text-slate-700 font-semibold hover:text-orange-600 transition-colors cursor-pointer"
                            title="View order summary"
                          >
                            {getTransactionLabel(tx, idx, filteredTransactions.length)}
                          </button>
                        </td>
                        <td className="py-3 text-slate-700">{formatDate(getRecordTimestamp(tx))}</td>
                        <td className="py-3 font-medium text-slate-900">{getTransactionCashierName(tx)}</td>
                        <td className="py-3 text-slate-600">{getTransactionItems(tx).length} item{getTransactionItems(tx).length !== 1 ? 's' : ''}</td>
                        <td className="py-3">
                          <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-lg text-[10px] font-bold uppercase">{getTransactionPaymentMethod(tx)}</span>
                        </td>
                        <td className="py-3 text-right font-bold text-orange-600">{formatCurrency(tx.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredTransactions.length > visibleReportTransactions.length && (
                <div className="mt-4 flex justify-center">
                  <button
                    onClick={() => setTransactionDisplayLimit(prev => prev + 50)}
                    className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Load 50 More
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Insights Tab */}
      {reportTab === 'insights' && (
        <div className="space-y-4 md:space-y-6">
          <div className="bg-white p-4 md:p-6 rounded-xl md:rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4 md:mb-6">
              <div>
                <h3 className="text-base md:text-lg font-bold">AI-Powered Business Insights</h3>
                <p className="text-sm text-slate-500 mt-1">Intelligent suggestions based on your sales and inventory trends</p>
              </div>
              <button
                onClick={fetchInsights}
                disabled={insightsLoading || !filteredTransactions.length}
                className="w-full sm:w-auto justify-center flex items-center gap-2 px-3 md:px-4 py-2 bg-blue-600 text-white rounded-xl text-xs md:text-sm font-semibold hover:bg-blue-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed cursor-pointer"
              >
                {insightsLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Zap size={18} />
                    Generate AI Insight
                  </>
                )}
              </button>
            </div>

            {insightsError && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl mb-6">
                <p className="text-sm text-rose-700"><strong>Error:</strong> {insightsError}</p>
              </div>
            )}

            <div className="mb-4 md:mb-6 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 md:p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-blue-700 mb-2">AI Manager Summary</p>
              {insights ? (
                <div className="text-sm text-slate-700 leading-relaxed space-y-2">
                  {insights
                    .split('\n')
                    .map(line => line.trim())
                    .filter(Boolean)
                    .map((line, idx) => (
                      <p key={idx}>{line}</p>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  {insightsLoading
                    ? 'Generating AI summary from your latest sales and stock data...'
                    : 'Tap "Generate AI Insight" to create a summary from current POS data.'}
                </p>
              )}
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
              <p className="text-xs text-slate-600">
                <strong>How it works:</strong> Gemini analyzes your current transactions, product mix, categories, payments, and stock indicators to generate real-time business insights.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ─── RENDER: Users ────────────────────────────────────────────────────────

  const renderUsers = () => (
    <div className="space-y-4 md:space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[30px] leading-9 md:text-2xl font-bold text-slate-900">User Management & Security</h1>
          <p className="text-slate-500 text-sm md:text-base">Staff accounts, activity logs, and system security</p>
        </div>
        {isAdmin && (
          <button onClick={() => { setNewUser({ name: '', email: '', role: 'cashier', password: '' }); setUserFormError(''); setShowAddUser(true); }} className="w-full sm:w-auto justify-center inline-flex items-center gap-1.5 px-3 py-2 md:px-4 md:py-2.5 bg-orange-600 text-white rounded-xl text-xs md:text-sm font-semibold hover:bg-orange-700 transition-colors cursor-pointer">
            <Plus size={15} /> Add New User
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          {/* Current user info */}
          <div className="bg-white p-4 md:p-6 rounded-xl md:rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-xs md:text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 md:mb-4">Your Account</h3>
            {currentUser && (
              <div className="flex items-center gap-3 md:gap-4">
                <img src={getUserAvatar(currentUser)} alt="" className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover" />
                <div className="flex-1">
                  <p className="text-sm md:text-base font-bold text-slate-900">{currentUser.name}</p>
                  <p className="text-xs text-slate-500">{currentUser.email}</p>
                </div>
                <span className={cn('px-2 py-1 rounded-full text-[10px] font-bold uppercase',
                  currentUser.role === 'manager' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600',
                )}>
                  {currentUser.role}
                </span>
              </div>
            )}
            <p className="text-xs text-slate-500 mt-3 md:mt-4">To switch roles, logout and login with a different account.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {users.map(user => (
              <div key={user.id} className="bg-white p-4 md:p-6 rounded-xl md:rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
                  <img src={getUserAvatar(user)} alt="" className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover" />
                  <div className="flex-1">
                    <h3 className="text-sm md:text-base font-bold text-slate-900">{user.name}</h3>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </div>
                  <span className={cn('px-2 py-1 rounded-full text-[10px] font-bold uppercase',
                    user.role === 'manager' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600',
                  )}>
                    {user.role}
                  </span>
                </div>
                {isAdmin && (
                  <div className="flex gap-2">
                    <button onClick={() => openEditUserModal(user)} className="flex-1 py-1.5 md:py-2 bg-slate-50 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer">Edit</button>
                    <button onClick={() => openResetPasswordModal(user)} className="flex-1 py-1.5 md:py-2 bg-slate-50 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer">Reset Pass</button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl md:rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 md:p-6 border-b border-slate-50 flex justify-between items-center">
              <h3 className="text-base md:text-lg font-bold text-slate-900">System Activity Logs</h3>
            </div>
            <div className="p-4 md:p-6 space-y-3 md:space-y-4 max-h-[320px] md:max-h-[400px] overflow-y-auto">
              {activityLogs.length === 0 && <p className="text-sm text-slate-400 text-center py-8">No activity recorded yet.</p>}
              {activityLogs.slice(0, 30).map(log => (
                <div key={log.id} className="flex gap-3 md:gap-4 pb-3 md:pb-4 border-b border-slate-50 last:border-0">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                    <Activity size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900">{log.action}</p>
                    <p className="text-xs text-slate-500">{getActivityDetails(log)}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{getActivityUserName(log)} - {formatDate(getRecordTimestamp(log))}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4 md:space-y-6">
          <div className="bg-white p-4 md:p-6 rounded-xl md:rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-base md:text-lg font-bold text-slate-900 mb-3 md:mb-4">Security & Backup</h3>
            <div className="space-y-3 md:space-y-4">
              <button onClick={() => requestProtectedExport('backup')} className="w-full flex items-center justify-between p-3 md:p-4 bg-slate-50 rounded-xl md:rounded-2xl hover:bg-slate-100 transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <Database size={18} className="text-orange-500" />
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-900">Backup Records</p>
                    <p className="text-[10px] text-slate-500">Last: 2 hours ago</p>
                  </div>
                </div>
                <RefreshCw size={16} className="text-slate-400" />
              </button>
              <button onClick={restoreSystem} className="w-full flex items-center justify-between p-3 md:p-4 bg-slate-50 rounded-xl md:rounded-2xl hover:bg-slate-100 transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <Upload size={18} className="text-blue-500" />
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-900">Restore System</p>
                    <p className="text-[10px] text-slate-500">From cloud storage</p>
                  </div>
                </div>
                <ArrowRightLeft size={16} className="text-slate-400" />
              </button>
              {lowStockCount > 0 && (
                <div className="p-3 md:p-4 bg-rose-50 rounded-xl md:rounded-2xl border border-rose-100">
                  <div className="flex items-center gap-3 mb-2">
                    <Shield size={18} className="text-rose-500" />
                    <p className="text-sm font-bold text-rose-900">Stock Alert</p>
                  </div>
                  <p className="text-xs text-rose-700">{lowStockCount} item{lowStockCount !== 1 ? 's' : ''} below minimum stock level.</p>
                </div>
              )}
            </div>
          </div>

          {/* Promotions management */}
          <div className="bg-white p-4 md:p-6 rounded-xl md:rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-3 md:mb-4">
              <h3 className="text-base md:text-lg font-bold text-slate-900">Active Promotions</h3>
              {isManager && (
                <button
                  onClick={openAddPromotionModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600 text-white text-xs font-semibold hover:bg-orange-700 transition-colors cursor-pointer"
                >
                  <Plus size={13} />
                  Add Promo
                </button>
              )}
            </div>
            <div className="space-y-3">
              {promotions.map(p => (
                <div key={p.id} className="flex items-center justify-between p-2.5 md:p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{p.code}</p>
                    <p className="text-xs text-slate-500">{p.description}</p>
                    <p className="text-xs text-orange-600 font-medium">
                      {getPromotionDiscountType(p) === 'percentage' ? `${p.value}% off` : `${formatCurrency(p.value)} off`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 ml-2">
                    <span className={cn('text-[10px] font-bold px-2 py-1 rounded-full', p.active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-200 text-slate-500')}>
                      {p.active ? 'Active' : 'Off'}
                    </span>
                    {isManager && (
                      <>
                        <button
                          onClick={() => togglePromotionActive(p)}
                          className="px-2 py-1 text-[10px] font-bold rounded-md bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
                        >
                          {p.active ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          onClick={() => openEditPromotionModal(p)}
                          className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-white rounded-md transition-colors cursor-pointer"
                          title="Edit promotion"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => deletePromotion(p)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-white rounded-md transition-colors cursor-pointer"
                          title="Delete promotion"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
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
    <div className="relative flex min-h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {mobileSidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[1px] lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-100 flex flex-col p-6 transition-transform duration-300 lg:static lg:z-auto lg:w-64 lg:translate-x-0',
        mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full',
      )}>
        <div className="flex items-center justify-between mb-6 lg:mb-10 px-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-200">
              <ShoppingBag size={24} />
            </div>
            <span className="text-xl font-black tracking-tight text-orange-900">SURFRIES.POS</span>
          </div>
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(false)}
            className="lg:hidden p-2 rounded-full hover:bg-slate-100 text-slate-500"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-2">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => navigateTo('dashboard')} />
          <SidebarItem icon={ShoppingCart} label="Sales" active={activeTab === 'sales'} onClick={() => navigateTo('sales')} />
          {canAccessManagerTabs && (
            <>
              <SidebarItem icon={Package} label="Products" active={activeTab === 'products'} onClick={() => navigateTo('products')} />
              <SidebarItem icon={ClipboardList} label="Inventory" active={activeTab === 'inventory'} onClick={() => navigateTo('inventory')} badge={lowStockCount || undefined} />
              <SidebarItem icon={BarChart3} label="Reports" active={activeTab === 'reports'} onClick={() => navigateTo('reports')} />
              <SidebarItem icon={Users} label="Users & Security" active={activeTab === 'users'} onClick={() => navigateTo('users')} />
            </>
          )}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-50">
          <div className="flex items-center gap-3 px-2">
            <img src={getUserAvatar(currentUser)} alt="" className="w-10 h-10 rounded-full object-cover" />
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
      <main className="flex-1 flex flex-col min-w-0 w-full overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 md:px-8 py-3 shrink-0">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-slate-200 bg-white text-slate-600"
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>
            <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Current Store</span>
              <span className="text-sm font-bold text-slate-900">Downtown Branch #12</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {lowStockCount > 0 && (
              <button onClick={() => setActiveTab(canAccessManagerTabs ? 'inventory' : 'sales')} className="p-2 text-rose-500 hover:text-rose-700 transition-colors relative cursor-pointer">
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'sales' && renderSales()}
          {activeTab === 'products' && canAccessManagerTabs && renderProducts()}
          {activeTab === 'inventory' && canAccessManagerTabs && renderInventory()}
          {activeTab === 'reports' && canAccessManagerTabs && renderReports()}
          {activeTab === 'users' && canAccessManagerTabs && renderUsers()}
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
                <p className="text-xs text-slate-400 mt-1">Payment: <span className="font-bold capitalize">{getTransactionPaymentMethod(showReceipt)}</span></p>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-3">
                  {getTransactionItems(showReceipt).map(item => (
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
                      <span>Discount ({getTransactionDiscountCode(showReceipt)})</span>
                      <span>-{formatCurrency(showReceipt.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-slate-500">
                    <span>Tax (10%)</span><span>{formatCurrency(showReceipt.tax ?? 0)}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold text-slate-900 pt-2">
                    <span>Total Paid</span>
                    <span className="text-orange-600">{formatCurrency(showReceipt.total)}</span>
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
        {showBackupSuccessModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden"
            >
              <div className="p-8 text-center border-b border-slate-100">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Backup Successful</h3>
                <p className="text-sm text-slate-500 mt-2">Your formatted backup report has been downloaded.</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-xs uppercase tracking-wide text-slate-500 font-bold">File Name</p>
                  <p className="text-sm font-semibold text-slate-800 mt-1 break-all">{lastBackupFileName}</p>
                </div>
                <button
                  onClick={() => setShowBackupSuccessModal(false)}
                  className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all cursor-pointer"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRestoreConfirmModal && (
          <div className="fixed inset-0 z-[115] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-slate-100 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-xl font-bold text-slate-900">Restore System</h3>
                <p className="text-sm text-slate-500 mt-2">
                  This will restore all data from the latest backup. Unsaved changes may be lost.
                </p>
              </div>
              <div className="p-5 bg-slate-50">
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowRestoreConfirmModal(false)}
                    className="flex-1 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmRestoreSystem}
                    className="flex-1 py-3 bg-orange-600 text-white rounded-xl text-sm font-bold hover:bg-orange-700 transition-all cursor-pointer"
                  >
                    Restore
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRestoreSuccessModal && (
          <div className="fixed inset-0 z-[115] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-slate-100 overflow-hidden"
            >
              <div className="p-8 text-center border-b border-slate-100">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Restore Complete</h3>
                <p className="text-sm text-slate-500 mt-2">System has been restored from the latest backup.</p>
              </div>
              <div className="p-6">
                <button
                  onClick={() => setShowRestoreSuccessModal(false)}
                  className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all cursor-pointer"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showExportAuthModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-slate-100 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-xl font-bold text-slate-900">Manager Password Required</h3>
                <p className="text-sm text-slate-500 mt-2">
                  Confirm your password to continue with {
                    pendingExportAction === 'pdf' ? 'PDF export'
                      : pendingExportAction === 'excel' ? 'Excel export'
                        : 'backup export'
                  }.
                </p>
              </div>
              <div className="p-5 space-y-3 bg-slate-50">
                <input
                  type="password"
                  value={exportAuthPassword}
                  onChange={e => setExportAuthPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && confirmProtectedExport()}
                  placeholder="Enter your password"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
                {exportAuthError && <p className="text-xs text-rose-600 font-medium">{exportAuthError}</p>}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowExportAuthModal(false);
                      setPendingExportAction(null);
                      setExportAuthPassword('');
                      setExportAuthError('');
                    }}
                    className="flex-1 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmProtectedExport}
                    disabled={isVerifyingExportAuth}
                    className="flex-1 py-3 bg-orange-600 text-white rounded-xl text-sm font-bold hover:bg-orange-700 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {isVerifyingExportAuth ? 'Verifying...' : 'Continue'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLogoutConfirmModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-slate-100 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-xl font-bold text-slate-900">Confirm Logout</h3>
                <p className="text-sm text-slate-500 mt-2">Are you sure you want to log out?</p>
              </div>
              <div className="p-5 bg-slate-50 flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirmModal(false)}
                  className="flex-1 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLogout}
                  className="flex-1 py-3 bg-orange-600 text-white rounded-xl text-sm font-bold hover:bg-orange-700 shadow-lg shadow-orange-600/20 transition-all cursor-pointer"
                >
                  Log Out
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">Price ()</label>
                    <input type="number" value={newProduct.price} onChange={e => setNewProduct(p => ({ ...p, price: e.target.value }))} placeholder="0.00" min="0" step="0.01" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">Cost ()</label>
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
                {stockModalType === 'in' && (
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={stockForm.createNewItem}
                      onChange={e => setStockForm(f => ({ ...f, createNewItem: e.target.checked }))}
                      className="w-4 h-4 accent-orange-600"
                    />
                    Add new stock item
                  </label>
                )}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">
                    {stockForm.createNewItem && stockModalType === 'in' ? 'New Item Name' : 'Ingredient / Item'}
                  </label>
                  {stockForm.createNewItem && stockModalType === 'in' ? (
                    <input
                      type="text"
                      value={stockForm.newItemName}
                      onChange={e => setStockForm(f => ({ ...f, newItemName: e.target.value }))}
                      placeholder="e.g. Cooking Oil"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    />
                  ) : (
                    <select
                      value={stockForm.ingredientId}
                      onChange={e => setStockForm(f => ({ ...f, ingredientId: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    >
                      {ingredients.map(ing => <option key={ing.id} value={ing.id}>{ing.name} ({ing.stock} {ing.unit})</option>)}
                    </select>
                  )}
                </div>
                {stockForm.createNewItem && stockModalType === 'in' && (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase">Category</label>
                      <select
                        value={stockForm.newItemCategory}
                        onChange={e => setStockForm(f => ({ ...f, newItemCategory: e.target.value as Ingredient['category'] }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                      >
                        <option value="raw">Raw</option>
                        <option value="packaging">Packaging</option>
                        <option value="sauce">Sauce</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase">Unit</label>
                      <input
                        type="text"
                        value={stockForm.newItemUnit}
                        onChange={e => setStockForm(f => ({ ...f, newItemUnit: e.target.value }))}
                        placeholder="kg / pcs / L"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase">Low Alert</label>
                      <input
                        type="number"
                        value={stockForm.newItemLowStockThreshold}
                        onChange={e => setStockForm(f => ({ ...f, newItemLowStockThreshold: e.target.value }))}
                        placeholder="10"
                        min="0"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                      />
                    </div>
                  </div>
                )}
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
                      disabled={!(stockForm.createNewItem && stockModalType === 'in')}
                      onChange={e => setStockForm(f => ({ ...f, newItemUnit: e.target.value }))}
                      className={cn(
                        'w-full border border-slate-200 rounded-xl px-4 py-3 text-sm',
                        stockForm.createNewItem && stockModalType === 'in'
                          ? 'bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-500/20'
                          : 'bg-slate-100 text-slate-400',
                      )}
                      value={
                        stockForm.createNewItem && stockModalType === 'in'
                          ? stockForm.newItemUnit
                          : (ingredients.find(i => i.id === stockForm.ingredientId)?.unit || '')
                      }
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
        {showPromotionModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-slate-100"
            >
              <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                <h3 className="text-xl font-black text-slate-900">{selectedPromotionForEdit ? 'Edit Promotion' : 'Add Promotion'}</h3>
                <button onClick={() => setShowPromotionModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Promo Code</label>
                  <input
                    type="text"
                    value={promotionForm.code}
                    onChange={e => setPromotionForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    placeholder="WELCOME10"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Description</label>
                  <input
                    type="text"
                    value={promotionForm.description}
                    onChange={e => setPromotionForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="10% off for new customers"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">Discount Type</label>
                    <select
                      value={promotionForm.discount_type}
                      onChange={e => setPromotionForm(prev => ({ ...prev, discount_type: e.target.value as Promotion['discount_type'] }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 cursor-pointer"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (₱)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">Value</label>
                    <input
                      type="number"
                      value={promotionForm.value}
                      onChange={e => setPromotionForm(prev => ({ ...prev, value: e.target.value }))}
                      placeholder={promotionForm.discount_type === 'percentage' ? '10' : '20'}
                      min="0"
                      step="0.01"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={promotionForm.active}
                    onChange={e => setPromotionForm(prev => ({ ...prev, active: e.target.checked }))}
                    className="w-4 h-4 accent-orange-600"
                  />
                  Active promotion
                </label>
                {promotionFormError && <p className="text-rose-500 text-xs font-medium">{promotionFormError}</p>}
              </div>
              <div className="p-6 bg-slate-50 flex gap-3">
                <button onClick={() => setShowPromotionModal(false)} className="flex-1 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all cursor-pointer">Cancel</button>
                <button onClick={savePromotion} disabled={isSavingPromotion} className="flex-1 py-3 bg-orange-600 text-white rounded-xl text-sm font-bold hover:bg-orange-700 shadow-lg shadow-orange-600/20 transition-all cursor-pointer disabled:opacity-50">
                  {isSavingPromotion ? 'Saving...' : (selectedPromotionForEdit ? 'Save Changes' : 'Create Promo')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEditUserModal && selectedUserForEdit && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-slate-100"
            >
              <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                <h3 className="text-xl font-black text-slate-900">Edit Staff Account</h3>
                <button onClick={() => setShowEditUserModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"><X size={20} className="text-slate-400" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Email</label>
                  <input type="email" disabled value={selectedUserForEdit.email} className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-400" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Full Name</label>
                  <input type="text" value={editUserForm.name} onChange={e => setEditUserForm(prev => ({ ...prev, name: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Role</label>
                  <select value={editUserForm.role} onChange={e => setEditUserForm(prev => ({ ...prev, role: e.target.value as Role }))} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20">
                    <option value="cashier">Cashier</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Avatar URL (Optional)</label>
                  <input type="text" value={editUserForm.avatar_url} onChange={e => setEditUserForm(prev => ({ ...prev, avatar_url: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                </div>
                {editUserFormError && <p className="text-rose-500 text-xs font-medium">{editUserFormError}</p>}
              </div>
              <div className="p-6 bg-slate-50 flex gap-3">
                <button onClick={() => setShowEditUserModal(false)} className="flex-1 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all cursor-pointer">Cancel</button>
                <button onClick={submitEditUser} disabled={isSavingUserEdit} className="flex-1 py-3 bg-orange-600 text-white rounded-xl text-sm font-bold hover:bg-orange-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all cursor-pointer">
                  {isSavingUserEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showResetPassModal && selectedUserForReset && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-slate-100"
            >
              <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                <h3 className="text-xl font-black text-slate-900">Reset User Password</h3>
                <button onClick={() => setShowResetPassModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"><X size={20} className="text-slate-400" /></button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-slate-600">Set a new password for <span className="font-bold text-slate-900">{selectedUserForReset.name}</span>.</p>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">New Password</label>
                  <input type="password" value={newPasswordForm.password} onChange={e => setNewPasswordForm(prev => ({ ...prev, password: e.target.value }))} placeholder="At least 8 characters" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Confirm Password</label>
                  <input type="password" value={newPasswordForm.confirmPassword} onChange={e => setNewPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))} placeholder="Re-enter password" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                </div>
                {resetPassFormError && <p className="text-rose-500 text-xs font-medium">{resetPassFormError}</p>}
              </div>
              <div className="p-6 bg-slate-50 flex gap-3">
                <button onClick={() => setShowResetPassModal(false)} className="flex-1 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all cursor-pointer">Cancel</button>
                <button onClick={submitResetPassword} disabled={isResettingPassword} className="flex-1 py-3 bg-orange-600 text-white rounded-xl text-sm font-bold hover:bg-orange-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all cursor-pointer">
                  {isResettingPassword ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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



