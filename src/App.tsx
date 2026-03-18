/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  ClipboardList, 
  BarChart3, 
  Users, 
  Settings,
  LogOut,
  Search,
  Plus,
  Minus,
  Trash2,
  AlertCircle,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  ChevronRight,
  Filter,
  CheckCircle2,
  X,
  History,
  Tag,
  Shield,
  Database,
  ArrowRightLeft,
  Calendar,
  Clock,
  UserCircle,
  Activity,
  Download,
  Upload,
  RefreshCw,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  AreaChart,
  Area
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
  ActivityLog
} from './types';
import { CATEGORIES, INITIAL_PRODUCTS, INITIAL_USERS, INITIAL_INGREDIENTS, INITIAL_PROMOTIONS } from './constants';
import { cn, formatCurrency, formatDate } from './utils';

// --- Components ---

const SidebarItem = ({ 
  icon: Icon, 
  label, 
  active, 
  onClick 
}: { 
  icon: any, 
  label: string, 
  active: boolean, 
  onClick: () => void 
}) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer",
      active 
        ? "bg-orange-50 text-orange-600 font-medium shadow-sm" 
        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
    )}
  >
    <Icon size={20} />
    <span className="text-sm">{label}</span>
  </button>
);

const StatCard = ({ title, value, icon: Icon, trend, color }: any) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
    <div className="flex justify-between items-start mb-4">
      <div className={cn("p-3 rounded-xl", color)}>
        <Icon size={24} className="text-white" />
      </div>
      {trend !== undefined && (
        <span className={cn(
          "text-xs font-medium px-2 py-1 rounded-full",
          trend > 0 ? "bg-orange-50 text-orange-600" : "bg-rose-50 text-rose-600"
        )}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    <h3 className="text-slate-500 text-sm font-medium">{title}</h3>
    <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
  </div>
);

// --- Main App ---

export default function App() {
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockModalType, setStockModalType] = useState<'in' | 'out' | 'waste'>('in');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState<User | null>(INITIAL_USERS[0]);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [ingredients, setIngredients] = useState<Ingredient[]>(INITIAL_INGREDIENTS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [inventoryLogs, setInventoryLogs] = useState<InventoryLog[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [promotions] = useState<Promotion[]>(INITIAL_PROMOTIONS);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all');
  const [showReceipt, setShowReceipt] = useState<Transaction | null>(null);
  const [appliedPromo, setAppliedPromo] = useState<Promotion | null>(null);
  const [promoInput, setPromoInput] = useState('');
  const [reportRange, setReportRange] = useState('monthly');
  const [reportCategory, setReportCategory] = useState('all');

  // --- Logic ---

  const switchRole = (role: Role) => {
    const user = INITIAL_USERS.find(u => u.role === role) || INITIAL_USERS[0];
    setCurrentUser(user);
    logActivity('Role Switch', `Switched role to ${role}`);
  };

  const logActivity = (action: string, details: string) => {
    if (!currentUser) return;
    const newLog: ActivityLog = {
      id: `ACT-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      action,
      details,
      timestamp: new Date().toISOString()
    };
    setActivityLogs(prev => [newLog, ...prev]);
  };

  const addToCart = (product: Product) => {
    if (!product.available || product.stock <= 0) return;
    
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) } 
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateCartQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(0, item.quantity + delta);
        const product = products.find(p => p.id === productId);
        if (product && newQty > product.stock) return item;
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const cartDiscount = useMemo(() => {
    if (!appliedPromo) return 0;
    if (appliedPromo.discountType === 'percentage') {
      return (cartSubtotal * appliedPromo.value) / 100;
    }
    return appliedPromo.value;
  }, [cartSubtotal, appliedPromo]);

  const cartTotal = Math.max(0, cartSubtotal - cartDiscount);

  const applyPromoCode = () => {
    const promo = promotions.find(p => p.code.toUpperCase() === promoInput.toUpperCase() && p.active);
    if (promo) {
      setAppliedPromo(promo);
      setPromoInput('');
    } else {
      alert('Invalid or inactive promo code');
    }
  };

  const processOrder = (paymentMethod: PaymentMethod) => {
    if (cart.length === 0 || !currentUser) return;

    const newTransaction: Transaction = {
      id: `TX-${Date.now()}`,
      items: [...cart],
      subtotal: cartSubtotal,
      discount: cartDiscount,
      discountCode: appliedPromo?.code,
      total: cartTotal,
      paymentMethod,
      status: 'completed',
      timestamp: new Date().toISOString(),
      cashierId: currentUser.id,
      cashierName: currentUser.name,
    };

    // Update stock and logs
    setProducts(prev => prev.map(p => {
      const cartItem = cart.find(item => item.id === p.id);
      if (cartItem) {
        return { ...p, stock: p.stock - cartItem.quantity };
      }
      return p;
    }));

    const newLogs: InventoryLog[] = cart.map(item => ({
      id: `LOG-${Date.now()}-${item.id}`,
      itemId: item.id,
      itemName: item.name,
      type: 'sale',
      quantity: item.quantity,
      unit: 'pcs',
      timestamp: new Date().toISOString(),
      reason: `Sale ${newTransaction.id}`,
      userId: currentUser.id
    }));

    setInventoryLogs(prev => [...newLogs, ...prev]);
    setTransactions(prev => [newTransaction, ...prev]);
    logActivity('Sale', `Processed order ${newTransaction.id} for ${formatCurrency(newTransaction.total)}`);
    setCart([]);
    setAppliedPromo(null);
    setShowReceipt(newTransaction);
  };

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'manager';

  // --- Views ---

  const renderDashboard = () => {
    const totalSales = transactions.reduce((sum, t) => sum + t.total, 0);
    const dailySales = totalSales * 0.15; // Simulated
    const weeklySales = totalSales * 0.45; // Simulated
    const monthlySales = totalSales;

    const lowStockItems = products.filter(p => p.stock <= p.lowStockThreshold);
    const slowMovingItems = products.filter(p => p.salesVelocity === 'slow');
    
    const chartData = [
      { name: 'Mon', sales: 400, forecast: 420, inventory: 90 },
      { name: 'Tue', sales: 300, forecast: 350, inventory: 85 },
      { name: 'Wed', sales: 600, forecast: 580, inventory: 70 },
      { name: 'Thu', sales: 800, forecast: 850, inventory: 60 },
      { name: 'Fri', sales: 1200, forecast: 1300, inventory: 40 },
      { name: 'Sat', sales: 1500, forecast: 1600, inventory: 20 },
      { name: 'Sun', sales: 1100, forecast: 1050, inventory: 15 },
    ];

    return (
      <div className="space-y-6 animate-in fade-in duration-500 text-slate-900">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Dashboard Overview</h1>
            <p className="text-slate-500">Real-time business performance monitoring</p>
          </div>
          <div className="flex gap-2">
            <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 flex items-center gap-2">
              <Clock size={16} className="text-orange-500" />
              <span className="text-sm font-bold">Peak Hours: 6PM - 8PM</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Daily Sales" 
            value={formatCurrency(dailySales)} 
            icon={DollarSign} 
            trend={5.2}
            color="bg-orange-500"
            tooltip="Total sales recorded in the last 24 hours"
          />
          <StatCard 
            title="Weekly Sales" 
            value={formatCurrency(weeklySales)} 
            icon={TrendingUp} 
            trend={12.8}
            color="bg-blue-500"
            tooltip="Total sales recorded in the current week"
          />
          <StatCard 
            title="Monthly Sales" 
            value={formatCurrency(monthlySales)} 
            icon={BarChart3} 
            trend={18.4}
            color="bg-violet-500"
            tooltip="Total sales recorded in the current month"
          />
          <StatCard 
            title="Transactions" 
            value={transactions.length} 
            icon={ShoppingBag} 
            trend={8.2}
            color="bg-emerald-500"
            tooltip="Number of completed orders in the selected period"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">Sales Trends & Forecast</h3>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                  <span className="text-xs text-slate-500">Actual</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-300" />
                  <span className="text-xs text-slate-500">Forecast</span>
                </div>
              </div>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: '#fff'}}
                  />
                  <Area type="monotone" dataKey="sales" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                  <Area type="monotone" dataKey="forecast" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" fill="transparent" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold mb-6">Inventory Usage Trend</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: '#fff'}}
                  />
                  <Bar dataKey="inventory" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold mb-4">Top vs Slow Moving Items</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Top Selling</p>
                  {products.filter(p => p.salesVelocity === 'fast').slice(0, 3).map(p => (
                    <div key={p.id} className="flex items-center gap-3 p-2 bg-emerald-50 rounded-xl border border-emerald-100">
                      <img src={p.image} className="w-8 h-8 rounded-lg object-cover" />
                      <span className="text-xs font-bold truncate">{p.name}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  <p className="text-xs font-bold text-rose-600 uppercase tracking-wider">Slow Moving</p>
                  {slowMovingItems.map(p => (
                    <div key={p.id} className="flex items-center gap-3 p-2 bg-rose-50 rounded-xl border border-rose-100">
                      <img src={p.image} className="w-8 h-8 rounded-lg object-cover" />
                      <span className="text-xs font-bold truncate">{p.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 text-orange-900 p-6 rounded-2xl border border-orange-100 relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-lg font-bold mb-2">Predictive & Prescriptive Insights</h3>
              <p className="text-orange-800 text-sm mb-6 opacity-80">AI recommendations based on historical data</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-white rounded-xl border border-orange-200">
                  <p className="text-xs font-bold text-orange-600 mb-1">Stock Reorder Alert</p>
                  <p className="text-sm font-bold">Reorder 100kg Potatoes</p>
                  <p className="text-[10px] text-orange-700 opacity-70">Demand predicted to spike by 25% this weekend.</p>
                </div>
                <div className="p-3 bg-white rounded-xl border border-orange-200">
                  <p className="text-xs font-bold text-orange-600 mb-1">Promo Recommendation</p>
                  <p className="text-sm font-bold">Bundle Truffle Fries</p>
                  <p className="text-[10px] text-orange-700 opacity-70">Slow sales detected. Suggest 15% discount bundle.</p>
                </div>
                <div className="p-3 bg-white rounded-xl border border-orange-200">
                  <p className="text-xs font-bold text-orange-600 mb-1">Prep Quantity</p>
                  <p className="text-sm font-bold">Prep 60L Cheese Sauce</p>
                  <p className="text-[10px] text-orange-700 opacity-70">Expected high demand for Cheese Overload.</p>
                </div>
                <div className="p-3 bg-white rounded-xl border border-orange-200">
                  <p className="text-xs font-bold text-orange-600 mb-1">Profit Optimization</p>
                  <p className="text-sm font-bold">Focus on Combos</p>
                  <p className="text-[10px] text-orange-700 opacity-70">Combos have 45% higher margin than single items.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSales = () => {
    const filteredProducts = products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
      return matchesSearch && matchesCategory;
    });

    return (
      <div className="flex h-full gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Product Selection */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex flex-col gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder="Search products..." 
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => setActiveCategory('all')}
                className={cn(
                  "px-6 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all cursor-pointer",
                  activeCategory === 'all' 
                    ? "bg-orange-600 text-white shadow-md shadow-orange-200" 
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                )}
              >
                All Items
              </button>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    "px-6 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer",
                    activeCategory === cat.id 
                      ? "bg-orange-600 text-white shadow-md shadow-orange-200" 
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  )}
                >
                  <span>{cat.icon}</span>
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map(product => (
              <motion.div
                layout
                key={product.id}
                onClick={() => addToCart(product)}
                className={cn(
                  "group bg-white p-3 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-orange-100 transition-all cursor-pointer relative overflow-hidden",
                  (!product.available || product.stock <= 0) && "opacity-60 grayscale cursor-not-allowed"
                )}
              >
                <div className="aspect-square rounded-xl overflow-hidden mb-3">
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                  />
                </div>
                <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{product.name}</h4>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-orange-600 font-bold">{formatCurrency(product.price)}</span>
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-md font-medium",
                    product.stock <= product.lowStockThreshold ? "bg-rose-50 text-rose-600" : "bg-slate-50 text-slate-500"
                  )}>
                    {product.stock} left
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Cart */}
        <div className="w-[380px] flex flex-col bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
          <div className="p-6 border-b border-slate-50">
            <h3 className="text-xl font-bold text-slate-900">Current Order</h3>
            <p className="text-sm text-slate-500">Table #04 • {formatDate(new Date().toISOString())}</p>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <AnimatePresence mode="popLayout">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <ShoppingCart size={32} />
                  </div>
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
                      <p className="text-xs text-orange-600 font-medium">{formatCurrency(item.price)}</p>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-1">
                      <button 
                        onClick={() => updateCartQuantity(item.id, -1)}
                        className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-slate-900 cursor-pointer"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => updateCartQuantity(item.id, 1)}
                        className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-slate-900 cursor-pointer"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="text-slate-300 hover:text-rose-500 transition-colors cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
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
                  onChange={(e) => setPromoInput(e.target.value)}
                />
                <button 
                  onClick={applyPromoCode}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Apply
                </button>
              </div>

              {appliedPromo && (
                <div className="flex justify-between items-center p-2 bg-orange-50 rounded-lg border border-orange-100">
                  <div className="flex items-center gap-2">
                    <Tag size={14} className="text-orange-600" />
                    <span className="text-xs font-bold text-orange-900">{appliedPromo.code}</span>
                  </div>
                  <button onClick={() => setAppliedPromo(null)} className="text-orange-400 hover:text-orange-600">
                    <X size={14} />
                  </button>
                </div>
              )}

              <div className="flex justify-between text-sm text-slate-500 pt-2">
                <span>Subtotal</span>
                <span>{formatCurrency(cartSubtotal)}</span>
              </div>
              {cartDiscount > 0 && (
                <div className="flex justify-between text-sm text-rose-500">
                  <span>Discount</span>
                  <span>-{formatCurrency(cartDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-slate-500">
                <span>Tax (10%)</span>
                <span>{formatCurrency(cartTotal * 0.1)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Total</span>
                <span className="text-orange-600">{formatCurrency(cartTotal * 1.1)}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(['cash', 'card', 'e-wallet'] as PaymentMethod[]).map(method => (
                <button
                  key={method}
                  onClick={() => processOrder(method)}
                  disabled={cart.length === 0}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl border border-slate-200 bg-white hover:border-orange-500 hover:text-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider">{method}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => processOrder('cash')}
              disabled={cart.length === 0}
              className="w-full py-4 bg-orange-600 text-white rounded-2xl font-bold shadow-lg shadow-orange-200 hover:bg-orange-700 transition-all active:scale-95 disabled:opacity-50 disabled:shadow-none cursor-pointer"
            >
              Place Order
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderProducts = () => (
    <div className="space-y-6 animate-in fade-in duration-500 text-slate-900">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Product Management</h1>
          <p className="text-slate-500">Manage your menu, combos, and pricing</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors cursor-pointer">
            <Tag size={18} />
            Manage Promos
          </button>
          <button 
            onClick={() => setShowAddProduct(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-xl text-sm font-medium hover:bg-orange-700 transition-colors cursor-pointer"
          >
            <Plus size={18} />
            Add New Product
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
              <th className="px-6 py-4">Product</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Price</th>
              <th className="px-6 py-4">Stock</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {products.map(product => (
              <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img src={product.image} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    <span className="font-bold">{product.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-slate-500 capitalize">{product.category}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-medium">{formatCurrency(product.price)}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-sm font-medium",
                      product.stock <= product.lowStockThreshold ? "text-rose-600" : ""
                    )}>
                      {product.stock}
                    </span>
                    {product.stock <= product.lowStockThreshold && (
                      <AlertCircle size={14} className="text-rose-500" />
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                    product.available ? "bg-orange-50 text-orange-600" : "bg-slate-100 text-slate-500"
                  )}>
                    {product.available ? 'Active' : 'Hidden'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button className="text-slate-400 hover:text-orange-600 transition-colors p-2 cursor-pointer">
                      <Settings size={18} />
                    </button>
                    <button className="text-slate-400 hover:text-rose-600 transition-colors p-2 cursor-pointer">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderInventory = () => (
    <div className="space-y-6 animate-in fade-in duration-500 text-slate-900">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Inventory Management</h1>
          <p className="text-slate-500">Ingredients, packaging, and usage tracking</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => { setStockModalType('in'); setShowStockModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Plus size={18} className="text-emerald-600" />
            Stock-In
          </button>
          <button 
            onClick={() => { setStockModalType('waste'); setShowStockModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-sm font-medium hover:bg-rose-100 transition-colors cursor-pointer"
          >
            <Trash2 size={18} />
            Report Waste
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center">
              <h3 className="text-lg font-bold">Current Stock</h3>
              <div className="flex gap-2">
                <button className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold">Raw</button>
                <button className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold">Packaging</button>
              </div>
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
                            className={cn(
                              "h-full rounded-full",
                              item.stock <= item.lowStockThreshold ? "bg-rose-500" : "bg-orange-500"
                            )}
                            style={{ width: `${Math.min(100, (item.stock / (item.lowStockThreshold * 5)) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {item.stock <= item.lowStockThreshold ? (
                        <span className="flex items-center gap-1 text-rose-600 text-[10px] font-bold uppercase">
                          <AlertCircle size={12} /> Low Stock
                        </span>
                      ) : (
                        <span className="text-emerald-600 text-[10px] font-bold uppercase">In Stock</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold mb-4">Inventory History</h3>
          <div className="space-y-4">
            {inventoryLogs.slice(0, 10).map(log => (
              <div key={log.id} className="flex gap-3 pb-4 border-b border-slate-50 last:border-0">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                  log.type === 'sale' ? "bg-orange-50 text-orange-600" : 
                  log.type === 'waste' ? "bg-rose-50 text-rose-600" : "bg-blue-50 text-blue-600"
                )}>
                  {log.type === 'sale' ? <TrendingUp size={16} /> : 
                   log.type === 'waste' ? <Trash2 size={16} /> : <Plus size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{log.itemName}</p>
                  <p className="text-[10px] text-slate-500">{log.reason}</p>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "text-sm font-bold",
                    (log.type === 'sale' || log.type === 'waste') ? "text-rose-600" : "text-emerald-600"
                  )}>
                    {(log.type === 'sale' || log.type === 'waste') ? '-' : '+'}{log.quantity}
                  </p>
                  <p className="text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderReports = () => {
    const salesData = [
      { name: 'Week 1', sales: 4000 },
      { name: 'Week 2', sales: 3000 },
      { name: 'Week 3', sales: 6000 },
      { name: 'Week 4', sales: 8000 },
    ];

    const filteredTransactions = transactions.filter(tx => {
      if (reportCategory === 'all') return true;
      return tx.items.some(item => item.category === reportCategory);
    });

    const breakdownData = [
      { type: 'Fries', size: 'Medium', flavor: 'Classic', sales: 120, revenue: 300 },
      { type: 'Fries', size: 'Large', flavor: 'Cheese', sales: 85, revenue: 297.5 },
      { type: 'Drinks', size: 'Medium', flavor: 'None', sales: 45, revenue: 81 },
      { type: 'Add-ons', size: 'None', flavor: 'Cheese', sales: 30, revenue: 15 },
    ];

    return (
      <div className="space-y-6 animate-in fade-in duration-500 text-slate-900">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Reporting & Insights</h1>
            <p className="text-slate-500">Detailed business performance and forecasts</p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors cursor-pointer">
              <Download size={18} />
              Export PDF
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors cursor-pointer">
              <Database size={18} />
              Export Excel
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex flex-wrap gap-4 items-end mb-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase">Date Range</label>
              <select 
                value={reportRange}
                onChange={(e) => setReportRange(e.target.value)}
                className="w-48 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 cursor-pointer"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase">Category</label>
              <select 
                value={reportCategory}
                onChange={(e) => setReportCategory(e.target.value)}
                className="w-48 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 cursor-pointer"
              >
                <option value="all">All Categories</option>
                <option value="fries">Fries</option>
                <option value="drinks">Drinks</option>
                <option value="add-ons">Add-ons</option>
                <option value="combos">Combos</option>
              </select>
            </div>
            <button className="px-6 py-2 bg-orange-600 text-white rounded-xl text-sm font-bold hover:bg-orange-700 transition-all cursor-pointer">
              Generate Report
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <h3 className="text-lg font-bold mb-6">Revenue Breakdown</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: '#fff'}} />
                    <Area type="monotone" dataKey="sales" stroke="#f97316" strokeWidth={3} fill="#fff7ed" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-bold mb-4">Summary</h3>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-slate-500">Refunds & Voids</span>
                  <span className="text-sm font-bold text-rose-500">4 ($12.50)</span>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-slate-500">Discount Usage</span>
                  <span className="text-sm font-bold text-orange-600">12 ($24.00)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Avg. Order Value</span>
                  <span className="text-sm font-bold text-slate-900">$8.45</span>
                </div>
              </div>
              <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
                <p className="text-xs font-bold text-orange-900 mb-1">Profit Margin Analysis</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-orange-600">Overall Margin</span>
                  <span className="text-lg font-black text-orange-600">42%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold mb-6">Detailed Product Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-50">
                  <th className="pb-4">Type</th>
                  <th className="pb-4">Size</th>
                  <th className="pb-4">Flavor</th>
                  <th className="pb-4">Qty Sold</th>
                  <th className="pb-4 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {breakdownData.map((row, i) => (
                  <tr key={i} className="text-sm hover:bg-slate-50 transition-colors">
                    <td className="py-4 font-bold">{row.type}</td>
                    <td className="py-4 text-slate-500">{row.size}</td>
                    <td className="py-4 text-slate-500">{row.flavor}</td>
                    <td className="py-4">{row.sales}</td>
                    <td className="py-4 text-right font-bold text-orange-600">{formatCurrency(row.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderUsers = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management & Security</h1>
          <p className="text-slate-500">Staff accounts, activity logs, and system security</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-xl text-sm font-medium hover:bg-orange-700 transition-colors cursor-pointer">
          <Plus size={18} />
          Add New User
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {INITIAL_USERS.map(user => (
              <div key={user.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <img src={user.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900">{user.name}</h3>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </div>
                  <span className={cn(
                    "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                    user.role === 'admin' ? "bg-violet-50 text-violet-600" : 
                    user.role === 'manager' ? "bg-blue-50 text-blue-600" : "bg-orange-50 text-orange-600"
                  )}>
                    {user.role}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 py-2 bg-slate-50 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer">Edit</button>
                  <button className="flex-1 py-2 bg-slate-50 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer">Reset Pass</button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">System Activity Logs</h3>
              <button className="text-xs font-bold text-orange-600 hover:underline">View All</button>
            </div>
            <div className="p-6 space-y-4">
              {activityLogs.slice(0, 10).map(log => (
                <div key={log.id} className="flex gap-4 pb-4 border-b border-slate-50 last:border-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                    <Activity size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900">{log.action}</p>
                    <p className="text-xs text-slate-500">{log.details}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{log.userName} • {formatDate(log.timestamp)}</p>
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
              <button className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <Database size={20} className="text-orange-500" />
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-900">Backup Records</p>
                    <p className="text-[10px] text-slate-500">Last: 2 hours ago</p>
                  </div>
                </div>
                <RefreshCw size={16} className="text-slate-400" />
              </button>
              <button className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <Upload size={20} className="text-blue-500" />
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-900">Restore System</p>
                    <p className="text-[10px] text-slate-500">From cloud storage</p>
                  </div>
                </div>
                <ArrowRightLeft size={16} className="text-slate-400" />
              </button>
              <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                <div className="flex items-center gap-3 mb-2">
                  <Shield size={20} className="text-rose-500" />
                  <p className="text-sm font-bold text-rose-900">Security Alert</p>
                </div>
                <p className="text-xs text-rose-700">2 failed login attempts detected from IP 192.168.1.45</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

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
          <SidebarItem 
            icon={LayoutDashboard} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <SidebarItem 
            icon={ShoppingCart} 
            label="Sales" 
            active={activeTab === 'sales'} 
            onClick={() => setActiveTab('sales')} 
          />
          <SidebarItem 
            icon={Package} 
            label="Products" 
            active={activeTab === 'products'} 
            onClick={() => setActiveTab('products')} 
          />
          <SidebarItem 
            icon={ClipboardList} 
            label="Inventory" 
            active={activeTab === 'inventory'} 
            onClick={() => setActiveTab('inventory')} 
          />
          <SidebarItem 
            icon={BarChart3} 
            label="Reports" 
            active={activeTab === 'reports'} 
            onClick={() => setActiveTab('reports')} 
          />
          <SidebarItem 
            icon={Users} 
            label="Users & Security" 
            active={activeTab === 'users'} 
            onClick={() => setActiveTab('users')} 
          />
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-50">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-bold overflow-hidden">
              <img src={currentUser?.avatar} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{currentUser?.name}</p>
              <p className="text-xs text-slate-500 capitalize">{currentUser?.role}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
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
            <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors relative cursor-pointer">
              <AlertCircle size={22} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
            </button>
            <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors cursor-pointer">
              <Settings size={22} />
            </button>
            <div className="h-8 w-px bg-slate-100 mx-2" />
            <div className="text-right">
              <p className="text-sm font-bold text-slate-900">{new Date().toLocaleDateString('en-US', { weekday: 'long' })}</p>
              <p className="text-xs text-slate-500">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
        </header>

        {/* View Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'sales' && renderSales()}
          {activeTab === 'products' && renderProducts()}
          {activeTab === 'inventory' && renderInventory()}
          {activeTab === 'reports' && renderReports()}
          {activeTab === 'users' && renderUsers()}
        </div>
      </main>

      {/* Receipt Modal */}
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
                    <span>Subtotal</span>
                    <span>{formatCurrency(showReceipt.subtotal)}</span>
                  </div>
                  {showReceipt.discount > 0 && (
                    <div className="flex justify-between text-sm text-rose-500">
                      <span>Discount ({showReceipt.discountCode})</span>
                      <span>-{formatCurrency(showReceipt.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-slate-500">
                    <span>Tax (10%)</span>
                    <span>{formatCurrency(showReceipt.total * 0.1)}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold text-slate-900 pt-2">
                    <span>Total Paid</span>
                    <span className="text-orange-600">{formatCurrency(showReceipt.total * 1.1)}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowReceipt(null)}
                    className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all cursor-pointer"
                  >
                    Close
                  </button>
                  <button 
                    onClick={() => {
                      window.print();
                      setShowReceipt(null);
                    }}
                    className="flex-1 py-3 bg-orange-600 text-white rounded-xl font-bold shadow-lg shadow-orange-200 hover:bg-orange-700 transition-all cursor-pointer"
                  >
                    Print Receipt
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Product Modal */}
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
                <h3 className="text-xl font-black text-slate-900">Add New Product</h3>
                <button onClick={() => setShowAddProduct(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Product Name</label>
                  <input type="text" placeholder="e.g. Sour Cream Fries" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">Category</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20">
                      <option>Fries</option>
                      <option>Drinks</option>
                      <option>Add-ons</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">Price</label>
                    <input type="number" placeholder="0.00" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">Size</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20">
                      <option>Small</option>
                      <option>Medium</option>
                      <option>Large</option>
                      <option>None</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">Flavor</label>
                    <input type="text" placeholder="e.g. Cheese" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                  </div>
                </div>
              </div>
              <div className="p-6 bg-slate-50 flex gap-3">
                <button onClick={() => setShowAddProduct(false)} className="flex-1 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all cursor-pointer">Cancel</button>
                <button onClick={() => setShowAddProduct(false)} className="flex-1 py-3 bg-orange-600 text-white rounded-xl text-sm font-bold hover:bg-orange-700 shadow-lg shadow-orange-600/20 transition-all cursor-pointer">Save Product</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Stock Transaction Modal */}
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
                <button onClick={() => setShowStockModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Ingredient / Item</label>
                  <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20">
                    {ingredients.map(ing => <option key={ing.id}>{ing.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">Quantity</label>
                    <input type="number" placeholder="0" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">Unit</label>
                    <input type="text" disabled className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-400" value="kg" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Notes / Reason</label>
                  <textarea placeholder="e.g. Monthly restock or Spoiled due to power outage" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 h-24 resize-none"></textarea>
                </div>
              </div>
              <div className="p-6 bg-slate-50 flex gap-3">
                <button onClick={() => setShowStockModal(false)} className="flex-1 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all cursor-pointer">Cancel</button>
                <button 
                  onClick={() => setShowStockModal(false)} 
                  className={cn(
                    "flex-1 py-3 text-white rounded-xl text-sm font-bold shadow-lg transition-all cursor-pointer",
                    stockModalType === 'in' ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20" : "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
                  )}
                >
                  Confirm Transaction
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
