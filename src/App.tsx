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
  X
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
  Pie
} from 'recharts';
import { 
  Product, 
  CartItem, 
  Transaction, 
  Category, 
  User, 
  InventoryLog,
  PaymentMethod
} from './types';
import { CATEGORIES, INITIAL_PRODUCTS, INITIAL_USERS } from './constants';
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
      {trend && (
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
  const [activeTab, setActiveTab] = useState('sales');
  const [currentUser] = useState<User>(INITIAL_USERS[0]);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [inventoryLogs, setInventoryLogs] = useState<InventoryLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all');
  const [showReceipt, setShowReceipt] = useState<Transaction | null>(null);

  // --- Logic ---

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

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const processOrder = (paymentMethod: PaymentMethod) => {
    if (cart.length === 0) return;

    const newTransaction: Transaction = {
      id: `TX-${Date.now()}`,
      items: [...cart],
      subtotal: cartTotal,
      discount: 0,
      total: cartTotal,
      paymentMethod,
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
      productId: item.id,
      productName: item.name,
      type: 'sale',
      quantity: item.quantity,
      timestamp: new Date().toISOString(),
      reason: `Sale ${newTransaction.id}`
    }));

    setInventoryLogs(prev => [...newLogs, ...prev]);
    setTransactions(prev => [newTransaction, ...prev]);
    setCart([]);
    setShowReceipt(newTransaction);
  };

  // --- Views ---

  const renderDashboard = () => {
    const totalSales = transactions.reduce((sum, t) => sum + t.total, 0);
    const lowStockItems = products.filter(p => p.stock <= p.lowStockThreshold);
    
    const chartData = [
      { name: 'Mon', sales: 400 },
      { name: 'Tue', sales: 300 },
      { name: 'Wed', sales: 600 },
      { name: 'Thu', sales: 800 },
      { name: 'Fri', sales: 1200 },
      { name: 'Sat', sales: 1500 },
      { name: 'Sun', sales: 1100 },
    ];

    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Business Overview</h1>
            <p className="text-slate-500">Welcome back, {currentUser.name}</p>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer">
              Export Report
            </button>
            <button className="px-4 py-2 bg-orange-600 text-white rounded-xl text-sm font-medium hover:bg-orange-700 transition-colors cursor-pointer">
              View Analytics
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Total Sales" 
            value={formatCurrency(totalSales)} 
            icon={DollarSign} 
            trend={12.5}
            color="bg-orange-500"
          />
          <StatCard 
            title="Transactions" 
            value={transactions.length} 
            icon={ShoppingBag} 
            trend={8.2}
            color="bg-blue-500"
          />
          <StatCard 
            title="Avg. Order Value" 
            value={formatCurrency(transactions.length ? totalSales / transactions.length : 0)} 
            icon={TrendingUp} 
            trend={-2.4}
            color="bg-violet-500"
          />
          <StatCard 
            title="Low Stock Alerts" 
            value={lowStockItems.length} 
            icon={AlertCircle} 
            color={lowStockItems.length > 0 ? "bg-rose-500" : "bg-slate-400"}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Sales Performance</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                  />
                  <Line type="monotone" dataKey="sales" stroke="#f97316" strokeWidth={3} dot={{r: 4, fill: '#f97316'}} activeDot={{r: 6}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Top Selling Items</h3>
            <div className="space-y-4">
              {products.slice(0, 4).map((p, i) => (
                <div key={p.id} className="flex items-center gap-4">
                  <img src={p.image} alt={p.name} className="w-12 h-12 rounded-xl object-cover" />
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-slate-900">{p.name}</h4>
                    <p className="text-xs text-slate-500">{p.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">{Math.floor(Math.random() * 100) + 50} sold</p>
                    <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                      <div 
                        className="h-full bg-orange-500 rounded-full" 
                        style={{ width: `${80 - i * 15}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
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
                {(!product.available || product.stock <= 0) && (
                  <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                    <span className="bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                      Out of Stock
                    </span>
                  </div>
                )}
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
              <div className="flex justify-between text-sm text-slate-500">
                <span>Subtotal</span>
                <span>{formatCurrency(cartTotal)}</span>
              </div>
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
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Product Management</h1>
          <p className="text-slate-500">Manage your menu and pricing</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-xl text-sm font-medium hover:bg-orange-700 transition-colors cursor-pointer">
          <Plus size={18} />
          Add New Product
        </button>
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
                    <span className="font-bold text-slate-900">{product.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-slate-600 capitalize">{product.category}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-medium text-slate-900">{formatCurrency(product.price)}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-sm font-medium",
                      product.stock <= product.lowStockThreshold ? "text-rose-600" : "text-slate-900"
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
                  <button className="text-slate-400 hover:text-orange-600 transition-colors p-2 cursor-pointer">
                    <Settings size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderInventory = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory Tracking</h1>
          <p className="text-slate-500">Monitor stock levels and movements</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer">
            Stock-In
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-sm font-medium hover:bg-rose-100 transition-colors cursor-pointer">
            Report Waste
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Stock Levels</h3>
            <div className="space-y-4">
              {products.map(p => (
                <div key={p.id} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-700">{p.name}</span>
                    <span className="text-slate-500">{p.stock} units</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        p.stock <= p.lowStockThreshold ? "bg-rose-500" : "bg-orange-500"
                      )}
                      style={{ width: `${Math.min(100, (p.stock / 100) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {inventoryLogs.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No recent activity</p>
            ) : (
              inventoryLogs.slice(0, 8).map(log => (
                <div key={log.id} className="flex gap-3 pb-4 border-b border-slate-50 last:border-0">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                    log.type === 'sale' ? "bg-orange-50 text-orange-600" : "bg-blue-50 text-blue-600"
                  )}>
                    {log.type === 'sale' ? <TrendingUp size={16} /> : <Plus size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{log.productName}</p>
                    <p className="text-xs text-slate-500">{log.reason}</p>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "text-sm font-bold",
                      log.type === 'sale' ? "text-rose-600" : "text-orange-600"
                    )}>
                      {log.type === 'sale' ? '-' : '+'}{log.quantity}
                    </p>
                    <p className="text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderReports = () => {
    const data = [
      { name: '10am', value: 20 },
      { name: '12pm', value: 85 },
      { name: '2pm', value: 45 },
      { name: '4pm', value: 60 },
      { name: '6pm', value: 120 },
      { name: '8pm', value: 90 },
      { name: '10pm', value: 30 },
    ];

    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Analytics & Insights</h1>
            <p className="text-slate-500">Predictive data for your business</p>
          </div>
          <div className="flex gap-2">
            <select className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 cursor-pointer">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>This Month</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900">Peak Hours Forecast</h3>
              <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-full">AI Predicted</span>
            </div>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                  <Bar dataKey="value" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-4 text-sm text-slate-500">
              <TrendingUp size={14} className="inline mr-1 text-orange-500" />
              Expect a <span className="font-bold text-slate-900">25% increase</span> in traffic between 6pm and 8pm today.
            </p>
          </div>

          <div className="bg-orange-900 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-lg font-bold mb-2">Actionable Recommendations</h3>
              <p className="text-orange-100 text-sm mb-6 opacity-80">Based on your recent sales and inventory patterns</p>
              
              <div className="space-y-4">
                <div className="flex gap-3 p-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
                  <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center shrink-0">
                    <Package size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Restock Classic Fries</p>
                    <p className="text-xs text-orange-200">Sales are trending up. Current stock will last only 2 more days.</p>
                  </div>
                </div>
                <div className="flex gap-3 p-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
                  <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center shrink-0">
                    <TrendingUp size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-bold">New Combo Suggestion</p>
                    <p className="text-xs text-orange-200">Customers often buy BBQ Fries with Orange Juice. Create a bundle!</p>
                  </div>
                </div>
                <div className="flex gap-3 p-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
                  <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
                    <Users size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Staffing Alert</p>
                    <p className="text-xs text-orange-200">Friday peak hours (6pm-9pm) need an extra cashier based on history.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-orange-500/20 rounded-full blur-3xl" />
          </div>
        </div>
      </div>
    );
  };

  const renderUsers = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-500">Manage staff roles and access</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-xl text-sm font-medium hover:bg-orange-700 transition-colors cursor-pointer">
          <Plus size={18} />
          Add New User
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {INITIAL_USERS.map(user => (
          <div key={user.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-lg">
                {user.name.charAt(0)}
              </div>
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
            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Last Login</span>
                <span className="text-slate-900 font-medium">Today, 08:45 AM</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Transactions Today</span>
                <span className="text-slate-900 font-medium">24</span>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-slate-50 flex gap-2">
              <button className="flex-1 py-2 bg-slate-50 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer">
                Edit Profile
              </button>
              <button className="flex-1 py-2 bg-slate-50 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer">
                View Logs
              </button>
            </div>
          </div>
        ))}
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
          <span className="text-xl font-black tracking-tight text-orange-900">FRIES.POS</span>
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
            label="Users" 
            active={activeTab === 'users'} 
            onClick={() => setActiveTab('users')} 
          />
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-50">
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-bold">
              {currentUser.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{currentUser.name}</p>
              <p className="text-xs text-slate-500 capitalize">{currentUser.role}</p>
            </div>
          </div>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-500 hover:bg-rose-50 transition-all cursor-pointer">
            <LogOut size={20} />
            <span className="text-sm font-medium">Logout</span>
          </button>
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
              <ClipboardList size={22} />
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
                  <div className="flex justify-between text-sm text-slate-500">
                    <span>Tax (10%)</span>
                    <span>{formatCurrency(showReceipt.subtotal * 0.1)}</span>
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
    </div>
  );
}
