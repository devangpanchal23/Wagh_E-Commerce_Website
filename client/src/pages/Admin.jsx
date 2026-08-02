import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert, ShieldCheck, Lock, Key, Package, ShoppingBag, Users, DollarSign,
  Plus, Edit, Trash2, CheckCircle2, AlertCircle, LogOut, Calendar, Filter,
  Clock, TrendingUp, Search, ChevronDown, ChevronRight, CheckCircle
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { fetchAdminApi } from '../api';
import { AdminLoginForm } from '../components/AdminLoginForm';

export function Admin() {

  const { addToast } = useToast();
  const navigate = useNavigate();

  // Standalone Admin token & auth state (completely isolated from customer auth)
  const [adminAuthenticated, setAdminAuthenticated] = useState(
    () => !!(localStorage.getItem('wagh_admin_token') || sessionStorage.getItem('wagh_admin_token'))
  );

  const [activeTab, setActiveTab] = useState('orders'); // orders | dashboard | products
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
    pendingOrders: 0,
    completedOrders: 0,
    lastYearRevenue: 0,
    lastYearTotalOrders: 0,
    lastYearCompletedOrders: 0,
  });
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState(null);

  // Date Filtering & Categorization State
  const [dateFilter, setDateFilter] = useState('all'); // 'all' | 'today' | 'week' | 'month' | 'year' | 'last_year' | 'selected_day'
  const [selectedDate, setSelectedDate] = useState(''); // 'YYYY-MM-DD'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled'
  const [searchQuery, setSearchQuery] = useState('');

  // Product Form Modal state
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    mrp: '',
    category: '',
    brand: 'WAGH',
    stock: 100,
    img1: '',
    img2: '',
    img3: '',
    img4: '',
    outputPower: '45W PPS',
    warranty: '24 Months Replacement',
    isFeatured: false,
    isNewArrival: false,
    isBestSeller: false,
  });

  const loadAdminData = async () => {
    setLoading(true);
    setDataError(null);
    try {
      const [statsRes, prodRes, orderRes, catRes] = await Promise.all([
        fetchAdminApi('/admin/stats'),
        fetchAdminApi('/admin/products'),
        fetchAdminApi('/admin/orders'),
        fetchAdminApi('/admin/categories'),
      ]);

      if (statsRes && statsRes.success) setStats(statsRes.data);
      if (prodRes && prodRes.success) setProducts(prodRes.data);
      if (orderRes && orderRes.success) setOrders(orderRes.data);
      if (catRes && catRes.success) setCategories(catRes.data);
    } catch (err) {
      console.error('Admin data fetch error:', err);
      setDataError(err.message || 'Failed to fetch admin dashboard data');
      if (err.message?.includes('token') || err.message?.includes('authorization') || err.message?.includes('expired')) {
        handleLockAdminSession();
      }
    } finally {
      setLoading(false);
    }
  };

  // Verify token & initial fetch
  useEffect(() => {
    const checkAdminSession = async () => {
      const token = localStorage.getItem('wagh_admin_token') || sessionStorage.getItem('wagh_admin_token');
      if (!token) {
        setAdminAuthenticated(false);
        setLoading(false);
        return;
      }

      try {
        const verifyRes = await fetchAdminApi('/admin/verify');
        if (verifyRes && verifyRes.success) {
          setAdminAuthenticated(true);
          await loadAdminData();
        } else {
          handleLockAdminSession();
        }
      } catch (err) {
        handleLockAdminSession();
      }
    };

    checkAdminSession();
  }, []);

  const handleLockAdminSession = async () => {
    try {
      await fetchAdminApi('/admin/logout', { method: 'POST' }).catch(() => {});
    } catch (err) {
      // Ignore network error on logout
    }
    localStorage.removeItem('wagh_admin_token');
    sessionStorage.removeItem('wagh_admin_token');
    setAdminAuthenticated(false);
    setUsernameInput('');
    setPasswordInput('');
    addToast('Admin portal session locked', 'info');
  };

  // Filter Orders Logic
  const filteredOrders = orders.filter((order) => {
    const orderDate = new Date(order.createdAt);
    const now = new Date();

    // 1. Date Period Filter
    if (dateFilter === 'today') {
      const isToday =
        orderDate.getDate() === now.getDate() &&
        orderDate.getMonth() === now.getMonth() &&
        orderDate.getFullYear() === now.getFullYear();
      if (!isToday) return false;
    } else if (dateFilter === 'week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      if (orderDate < oneWeekAgo) return false;
    } else if (dateFilter === 'month') {
      const isThisMonth =
        orderDate.getMonth() === now.getMonth() &&
        orderDate.getFullYear() === now.getFullYear();
      if (!isThisMonth) return false;
    } else if (dateFilter === 'year') {
      if (orderDate.getFullYear() !== now.getFullYear()) return false;
    } else if (dateFilter === 'last_year') {
      if (orderDate.getFullYear() !== now.getFullYear() - 1) return false;
    } else if (dateFilter === 'selected_day' && selectedDate) {
      const formattedOrderDay = orderDate.toISOString().split('T')[0];
      if (formattedOrderDay !== selectedDate) return false;
    }

    // 2. Order Status Filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'Delivered' && !['Delivered', 'Completed'].includes(order.orderStatus)) return false;
      if (statusFilter !== 'Delivered' && order.orderStatus !== statusFilter) return false;
    }

    // 3. Search Query Filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchId = order.orderId?.toLowerCase().includes(query);
      const matchName = order.shippingAddress?.name?.toLowerCase().includes(query);
      const matchPhone = order.shippingAddress?.phone?.toLowerCase().includes(query);
      if (!matchId && !matchName && !matchPhone) return false;
    }

    return true;
  });

  // Categorize Orders by Date Group
  const categorizedOrders = filteredOrders.reduce((acc, order) => {
    const d = new Date(order.createdAt);
    const dateKey = d.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    if (!acc[dateKey]) {
      acc[dateKey] = {
        dateString: dateKey,
        rawDate: d,
        totalSales: 0,
        completedCount: 0,
        orders: [],
      };
    }

    acc[dateKey].orders.push(order);
    acc[dateKey].totalSales += order.total || 0;
    if (['Delivered', 'Completed'].includes(order.orderStatus)) {
      acc[dateKey].completedCount += 1;
    }
    return acc;
  }, {});

  const dateGroups = Object.values(categorizedOrders).sort((a, b) => b.rawDate - a.rawDate);

  const filterPeriodSales = filteredOrders.reduce((acc, o) => acc + (o.total || 0), 0);
  const filterPeriodCompleted = filteredOrders.filter((o) => ['Delivered', 'Completed'].includes(o.orderStatus)).length;

  const handleLoginSuccess = async () => {
    setAdminAuthenticated(true);
    await loadAdminData();
  };

  if (!adminAuthenticated) {
    return <AdminLoginForm onLoginSuccess={handleLoginSuccess} />;
  }


  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      const images = [productForm.img1, productForm.img2, productForm.img3, productForm.img4].filter(Boolean);
      
      const payload = {
        name: productForm.name,
        description: productForm.description,
        price: Number(productForm.price),
        mrp: Number(productForm.mrp),
        category: productForm.category || categories[0]?._id,
        brand: productForm.brand,
        stock: Number(productForm.stock),
        images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600'],
        specs: {
          outputPower: productForm.outputPower,
          warranty: productForm.warranty,
        },
        isFeatured: productForm.isFeatured,
        isNewArrival: productForm.isNewArrival,
        isBestSeller: productForm.isBestSeller,
      };

      let res;
      if (editingProductId) {
        res = await fetchAdminApi(`/admin/products/${editingProductId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetchAdminApi('/admin/products', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      if (res && res.success) {
        addToast(editingProductId ? 'Product updated!' : 'Product created successfully!', 'success');
        setShowProductModal(false);
        setEditingProductId(null);
        // Refresh products list via admin API
        const updated = await fetchAdminApi('/admin/products');
        if (updated && updated.success) setProducts(updated.data);
      }
    } catch (err) {
      addToast(err.message || 'Save failed', 'error');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await fetchAdminApi(`/admin/products/${id}`, { method: 'DELETE' });
      if (res && res.success) {
        addToast('Product deleted', 'info');
        setProducts(products.filter(p => p._id !== id));
      }
    } catch (err) {
      addToast(err.message || 'Delete failed', 'error');
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetchAdminApi(`/admin/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ orderStatus: newStatus }),
      });
      if (res && res.success) {
        addToast(`Order status updated to ${newStatus}`, 'success');
        setOrders(orders.map(o => o._id === orderId ? { ...o, orderStatus: newStatus } : o));
      }
    } catch (err) {
      addToast(err.message || 'Status update failed', 'error');
    }
  };


  const openCreateModal = () => {
    setEditingProductId(null);
    setProductForm({
      name: '',
      description: '',
      price: '',
      mrp: '',
      category: categories[0]?._id || '',
      brand: 'WAGH',
      stock: 100,
      img1: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800',
      img2: 'https://images.unsplash.com/photo-1622445268465-843dcb642733?w=800',
      img3: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800',
      img4: 'https://images.unsplash.com/photo-1609592424074-67d7162629b3?w=800',
      outputPower: '45W PPS Super Fast',
      warranty: '24 Months Replacement',
      isFeatured: true,
      isNewArrival: true,
      isBestSeller: false,
    });
    setShowProductModal(true);
  };

  const openEditModal = (p) => {
    setEditingProductId(p._id);
    setProductForm({
      name: p.name,
      description: p.description,
      price: p.price,
      mrp: p.mrp,
      category: p.category?._id || p.category,
      brand: p.brand || 'WAGH',
      stock: p.stock || 100,
      img1: p.images?.[0] || '',
      img2: p.images?.[1] || '',
      img3: p.images?.[2] || '',
      img4: p.images?.[3] || '',
      outputPower: p.specs?.outputPower || '',
      warranty: p.specs?.warranty || '',
      isFeatured: !!p.isFeatured,
      isNewArrival: !!p.isNewArrival,
      isBestSeller: !!p.isBestSeller,
    });
    setShowProductModal(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-wagh-border pb-4">
        <div>
          <h1 className="font-editorial text-3xl font-extrabold text-wagh-dark">WAGH Admin Dashboard</h1>
          <p className="text-xs font-mono-tag text-wagh-muted">Manage Products, Customer Orders & Catalog Inventory</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 bg-wagh-teal/10 rounded-full border border-wagh-teal/20 text-xs font-semibold text-wagh-teal">
            <span className="w-2 h-2 rounded-full bg-wagh-teal animate-pulse" />
            <span>Administrator</span>
            <span className="font-mono-tag text-[10px] bg-wagh-teal text-white px-2 py-0.5 rounded-full uppercase tracking-wider">ADMIN</span>
          </div>

          <button
            onClick={openCreateModal}
            className="px-5 py-2.5 rounded-full bg-wagh-teal text-white font-bold text-xs hover:bg-wagh-teal-dark transition-colors flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>

          <button
            onClick={handleLockAdminSession}
            className="px-4 py-2.5 rounded-full bg-red-50 text-wagh-error font-bold text-xs hover:bg-red-100 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Lock Admin Session</span>
          </button>
        </div>
      </div>

      {/* STATS OVERVIEW & LAST YEAR SALES ANALYTICS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-wagh-border shadow-soft space-y-1">
          <span className="text-[11px] font-mono-tag text-wagh-muted uppercase block">Total Revenue</span>
          <span className="font-mono-tag text-2xl font-extrabold text-wagh-teal">₹{stats.totalRevenue}</span>
          <span className="text-[10px] text-wagh-muted block font-mono-tag">All-time store sales</span>
        </div>
        
        <div className="bg-white p-5 rounded-2xl border border-wagh-border shadow-soft space-y-1">
          <span className="text-[11px] font-mono-tag text-wagh-muted uppercase block">Total Orders</span>
          <div className="flex items-baseline gap-2">
            <span className="font-mono-tag text-2xl font-extrabold text-wagh-dark">{stats.totalOrders}</span>
            <span className="text-[11px] text-emerald-600 font-bold font-mono-tag">({stats.completedOrders} Delivered)</span>
          </div>
          <span className="text-[10px] text-wagh-muted block font-mono-tag">All customer orders</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-wagh-border shadow-soft space-y-1 bg-gradient-to-br from-white to-wagh-gold/10">
          <span className="text-[11px] font-mono-tag text-wagh-teal uppercase font-bold block flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Last Year's Sales</span>
          </span>
          <span className="font-mono-tag text-2xl font-extrabold text-wagh-dark">₹{stats.lastYearRevenue}</span>
          <span className="text-[10px] text-wagh-muted block font-mono-tag">
            {stats.lastYearCompletedOrders} completed of {stats.lastYearTotalOrders} orders
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-wagh-border shadow-soft space-y-1">
          <span className="text-[11px] font-mono-tag text-wagh-muted uppercase block">Active Catalog</span>
          <span className="font-mono-tag text-2xl font-extrabold text-wagh-dark">{products.length} Products</span>
          <span className="text-[10px] text-wagh-muted block font-mono-tag">{stats.totalCustomers} Customers</span>
        </div>
      </div>

      {/* TAB NAVIGATION */}
      <div className="bg-white rounded-3xl border border-wagh-border shadow-soft overflow-hidden">
        <div className="flex border-b border-wagh-border bg-gray-50 px-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-4 px-6 font-mono-tag text-xs font-bold uppercase transition-all flex items-center gap-2 ${
              activeTab === 'orders' ? 'border-b-2 border-wagh-teal text-wagh-teal bg-white shadow-xs' : 'text-wagh-muted hover:text-wagh-dark'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Order Timeline & Tracking ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-4 px-6 font-mono-tag text-xs font-bold uppercase transition-all flex items-center gap-2 ${
              activeTab === 'dashboard' ? 'border-b-2 border-wagh-teal text-wagh-teal bg-white shadow-xs' : 'text-wagh-muted hover:text-wagh-dark'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Overview & Recent Activity</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`py-4 px-6 font-mono-tag text-xs font-bold uppercase transition-all flex items-center gap-2 ${
              activeTab === 'products' ? 'border-b-2 border-wagh-teal text-wagh-teal bg-white shadow-xs' : 'text-wagh-muted hover:text-wagh-dark'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Products Catalog ({products.length})</span>
          </button>
        </div>

        <div className="p-6">
          
          {/* TAB 1: ORDER TIMELINE & CATEGORIZED TRACKING VIEW */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              
              {/* TIMELINE FILTERS TOOLBAR */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-wagh-border space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs font-mono-tag font-bold text-wagh-dark">
                    <Filter className="w-4 h-4 text-wagh-teal" />
                    <span>TIMELINE & DATE FILTERS:</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {/* Period Selector */}
                    <div className="relative">
                      <select
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="px-3.5 py-2 rounded-xl border border-wagh-border text-xs font-mono-tag font-bold bg-white focus:outline-none focus:ring-2 focus:ring-wagh-teal cursor-pointer"
                      >
                        <option value="all">All Time Timeline</option>
                        <option value="today">Today (Day)</option>
                        <option value="week">This Week (Weekly)</option>
                        <option value="month">This Month (Monthly)</option>
                        <option value="year">Whole Year (This Year)</option>
                        <option value="last_year">Last Year Sales</option>
                        <option value="selected_day">Selected Day (Date Picker)</option>
                      </select>
                    </div>

                    {/* Selected Day Date Picker */}
                    {dateFilter === 'selected_day' && (
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="px-3.5 py-1.5 rounded-xl border border-wagh-border text-xs font-mono-tag bg-white focus:outline-none focus:ring-2 focus:ring-wagh-teal"
                      />
                    )}

                    {/* Status Filter */}
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3.5 py-2 rounded-xl border border-wagh-border text-xs font-mono-tag bg-white focus:outline-none focus:ring-2 focus:ring-wagh-teal cursor-pointer"
                    >
                      <option value="all">All Statuses</option>
                      <option value="Processing">Processing</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered / Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                {/* Search Box */}
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search orders by Order ID (e.g. WAGH-12345), customer name, or mobile number..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-wagh-border text-xs font-mono-tag bg-white focus:outline-none focus:ring-2 focus:ring-wagh-teal"
                  />
                </div>
              </div>

              {/* TIMELINE PERIOD METRICS SUMMARY BAR */}
              <div className="p-4 rounded-2xl bg-wagh-teal/5 border border-wagh-teal/20 flex flex-wrap items-center justify-between gap-4 text-xs font-mono-tag">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-wagh-teal" />
                  <span className="font-bold text-wagh-dark">
                    Showing {filteredOrders.length} Order(s) for Selected Filter
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <span>Period Sales: <strong className="text-wagh-teal font-extrabold text-sm">₹{filterPeriodSales}</strong></span>
                  <span>Completed: <strong className="text-emerald-700 font-extrabold">{filterPeriodCompleted}</strong></span>
                </div>
              </div>

              {/* CATEGORIZED ORDER TIMELINE GROUPS */}
              {dateGroups.length === 0 ? (
                <div className="text-center py-16 space-y-3 bg-gray-50/50 rounded-2xl border border-dashed border-wagh-border">
                  <Clock className="w-10 h-10 text-wagh-muted mx-auto" />
                  <p className="text-base font-semibold text-wagh-dark">No orders matching the selected timeline filters</p>
                  <p className="text-xs text-wagh-muted">Try selecting a different date range, status, or clearing your search term.</p>
                  <button
                    onClick={() => {
                      setDateFilter('all');
                      setStatusFilter('all');
                      setSearchQuery('');
                      setSelectedDate('');
                    }}
                    className="px-5 py-2 rounded-full bg-wagh-teal text-white text-xs font-bold shadow-xs hover:bg-wagh-teal-dark transition-all"
                  >
                    Reset Timeline Filters
                  </button>
                </div>
              ) : (
                <div className="space-y-8">
                  {dateGroups.map((group) => (
                    <div key={group.dateString} className="space-y-4">
                      {/* DATE GROUP HEADER */}
                      <div className="flex items-center justify-between border-b border-wagh-teal/30 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-wagh-teal" />
                          <h4 className="font-mono-tag font-extrabold text-wagh-dark text-sm uppercase tracking-wider">
                            {group.dateString}
                          </h4>
                          <span className="px-2.5 py-0.5 rounded-full bg-wagh-teal/10 text-wagh-teal font-mono-tag text-[11px] font-bold">
                            {group.orders.length} Order(s)
                          </span>
                        </div>

                        <span className="font-mono-tag text-xs font-extrabold text-wagh-teal">
                          Day Sales Total: ₹{group.totalSales}
                        </span>
                      </div>

                      {/* DATE GROUP ORDERS LIST */}
                      <div className="space-y-4">
                        {group.orders.map((o) => (
                          <div
                            key={o._id}
                            className="bg-white p-5 rounded-2xl border border-wagh-border shadow-soft space-y-4 hover:border-wagh-teal/40 transition-all"
                          >
                            {/* Order Card Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-wagh-border pb-3 gap-2 text-xs">
                              <div className="flex items-center gap-3">
                                <span className="font-mono-tag font-extrabold text-wagh-teal text-base">{o.orderId}</span>
                                <span className="text-[11px] text-wagh-muted font-mono-tag flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>

                              <div className="flex items-center gap-3">
                                <span className="px-3 py-1 rounded-full bg-gray-100 font-mono-tag font-bold text-wagh-dark">
                                  {o.paymentMethod || 'COD'} ({o.paymentStatus || 'Pending'})
                                </span>

                                <span className="font-mono-tag font-extrabold text-wagh-dark text-base">
                                  ₹{o.total}
                                </span>
                              </div>
                            </div>

                            {/* Customer & Status Controls */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono-tag">
                              <div>
                                <span className="text-wagh-muted block font-bold">Customer Details:</span>
                                <span className="font-bold text-wagh-dark text-sm block">{o.shippingAddress?.name || 'Customer'}</span>
                                <span className="text-wagh-muted block">{o.shippingAddress?.phone}</span>
                                <span className="text-wagh-muted block">{o.shippingAddress?.street}, {o.shippingAddress?.city}, {o.shippingAddress?.state} - {o.shippingAddress?.pincode}</span>
                              </div>

                              <div className="flex flex-col justify-center sm:items-end gap-2">
                                <label className="text-wagh-muted font-bold text-[11px]">Update Order Status:</label>
                                <select
                                  value={o.orderStatus}
                                  onChange={(e) => handleUpdateOrderStatus(o._id, e.target.value)}
                                  className={`px-3 py-2 rounded-xl border font-mono-tag text-xs font-extrabold focus:ring-2 focus:ring-wagh-teal transition-all cursor-pointer ${
                                    o.orderStatus === 'Delivered'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                      : o.orderStatus === 'Shipped'
                                      ? 'bg-blue-50 text-blue-700 border-blue-300'
                                      : o.orderStatus === 'Cancelled'
                                      ? 'bg-red-50 text-red-700 border-red-300'
                                      : 'bg-amber-50 text-amber-800 border-amber-300'
                                  }`}
                                >
                                  <option value="Processing">Processing</option>
                                  <option value="Shipped">Shipped</option>
                                  <option value="Delivered">Delivered (Completed)</option>
                                  <option value="Cancelled">Cancelled</option>
                                </select>
                              </div>
                            </div>

                            {/* Ordered Items List */}
                            <div className="border-t border-wagh-border/60 pt-3 space-y-2">
                              <span className="text-[11px] font-mono-tag font-bold text-wagh-muted uppercase block">
                                Order Items ({o.items?.length || 0}):
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {o.items?.map((item, idx) => (
                                  <div key={idx} className="flex items-center gap-3 p-2 rounded-xl bg-gray-50 border border-wagh-border text-xs">
                                    <img src={item.image} alt={item.name} className="w-9 h-9 object-contain bg-white rounded border p-0.5 shrink-0" />
                                    <div className="truncate flex-1">
                                      <span className="font-bold text-wagh-dark block truncate">{item.name}</span>
                                      <span className="text-[11px] text-wagh-muted block font-mono-tag">
                                        Qty: {item.qty} × ₹{item.price}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

          {/* TAB 2: OVERVIEW & RECENT ACTIVITY */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <h3 className="font-editorial text-xl font-bold text-wagh-dark">Recent Customer Orders Activity</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono-tag">
                  <thead className="bg-gray-100 uppercase text-wagh-muted">
                    <tr>
                      <th className="p-3">Order ID</th>
                      <th className="p-3">Customer</th>
                      <th className="p-3">Total</th>
                      <th className="p-3">Payment</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-wagh-border">
                    {orders.slice(0, 10).map((o) => (
                      <tr key={o._id} className="hover:bg-gray-50">
                        <td className="p-3 font-bold text-wagh-teal">{o.orderId}</td>
                        <td className="p-3 font-medium text-wagh-dark">{o.shippingAddress?.name || 'Customer'}</td>
                        <td className="p-3 font-bold">₹{o.total}</td>
                        <td className="p-3">{o.paymentMethod} ({o.paymentStatus})</td>
                        <td className="p-3">
                          <span className="px-2.5 py-1 rounded-full bg-wagh-teal/10 text-wagh-teal font-bold">
                            {o.orderStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: PRODUCTS CATALOG CRUD */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-100 font-mono-tag uppercase text-wagh-muted">
                    <tr>
                      <th className="p-3">Image</th>
                      <th className="p-3">Product Name</th>
                      <th className="p-3">Price</th>
                      <th className="p-3">MRP</th>
                      <th className="p-3">Stock</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-wagh-border">
                    {products.map((p) => (
                      <tr key={p._id} className="hover:bg-gray-50">
                        <td className="p-3">
                          <img src={p.images?.[0]} alt={p.name} className="w-10 h-10 object-contain bg-gray-50 border rounded p-1" />
                        </td>
                        <td className="p-3 font-bold text-wagh-dark">{p.name}</td>
                        <td className="p-3 font-mono-tag font-bold text-wagh-teal">₹{p.price}</td>
                        <td className="p-3 font-mono-tag text-wagh-muted line-through">₹{p.mrp}</td>
                        <td className="p-3 font-mono-tag">{p.stock}</td>
                        <td className="p-3 space-x-2">
                          <button onClick={() => openEditModal(p)} className="p-1.5 rounded bg-gray-100 text-wagh-teal hover:bg-wagh-teal hover:text-white">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteProduct(p._id)} className="p-1.5 rounded bg-red-50 text-wagh-error hover:bg-red-500 hover:text-white">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* PRODUCT EDIT / CREATE MODAL */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-wagh-dark/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-3xl p-6 space-y-4 border border-wagh-border">
            <h3 className="font-editorial text-2xl font-bold text-wagh-dark">
              {editingProductId ? 'Edit Product' : 'Create New Product'}
            </h3>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs font-medium">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-wagh-muted mb-1">Product Name</label>
                  <input
                    type="text"
                    required
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border"
                  />
                </div>
                <div>
                  <label className="block text-wagh-muted mb-1">Brand</label>
                  <input
                    type="text"
                    value={productForm.brand}
                    onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                    className="w-full p-2.5 rounded-xl border"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-wagh-muted mb-1">Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className="w-full p-2.5 rounded-xl border font-mono-tag"
                  />
                </div>
                <div>
                  <label className="block text-wagh-muted mb-1">MRP (₹)</label>
                  <input
                    type="number"
                    required
                    value={productForm.mrp}
                    onChange={(e) => setProductForm({ ...productForm, mrp: e.target.value })}
                    className="w-full p-2.5 rounded-xl border font-mono-tag"
                  />
                </div>
                <div>
                  <label className="block text-wagh-muted mb-1">Stock Qty</label>
                  <input
                    type="number"
                    required
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    className="w-full p-2.5 rounded-xl border font-mono-tag"
                  />
                </div>
              </div>

              <div>
                <label className="block text-wagh-muted mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl border"
                />
              </div>

              {/* 4 Image URLs */}
              <div className="space-y-2">
                <label className="block text-wagh-muted">4 Image URLs (Gallery)</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Image 1 URL"
                    value={productForm.img1}
                    onChange={(e) => setProductForm({ ...productForm, img1: e.target.value })}
                    className="p-2 rounded-xl border text-[11px]"
                  />
                  <input
                    type="text"
                    placeholder="Image 2 URL"
                    value={productForm.img2}
                    onChange={(e) => setProductForm({ ...productForm, img2: e.target.value })}
                    className="p-2 rounded-xl border text-[11px]"
                  />
                  <input
                    type="text"
                    placeholder="Image 3 URL"
                    value={productForm.img3}
                    onChange={(e) => setProductForm({ ...productForm, img3: e.target.value })}
                    className="p-2 rounded-xl border text-[11px]"
                  />
                  <input
                    type="text"
                    placeholder="Image 4 URL"
                    value={productForm.img4}
                    onChange={(e) => setProductForm({ ...productForm, img4: e.target.value })}
                    className="p-2 rounded-xl border text-[11px]"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.isFeatured}
                    onChange={(e) => setProductForm({ ...productForm, isFeatured: e.target.checked })}
                    className="w-4 h-4 text-wagh-teal"
                  />
                  <span>Featured</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.isNewArrival}
                    onChange={(e) => setProductForm({ ...productForm, isNewArrival: e.target.checked })}
                    className="w-4 h-4 text-wagh-teal"
                  />
                  <span>New Arrival</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.isBestSeller}
                    onChange={(e) => setProductForm({ ...productForm, isBestSeller: e.target.checked })}
                    className="w-4 h-4 text-wagh-teal"
                  />
                  <span>Best Seller</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-5 py-2 rounded-full border text-wagh-dark font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-wagh-teal text-white font-bold"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
