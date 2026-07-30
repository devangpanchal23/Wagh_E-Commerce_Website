import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Package, ShoppingBag, Users, DollarSign, Plus, Edit, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { fetchApi } from '../api';

export function Admin() {
  const { user, isAdmin } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard | products | orders
  const [stats, setStats] = useState({ totalRevenue: 0, totalOrders: 0, totalProducts: 0, totalCustomers: 0, pendingOrders: 0 });
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    if (!user || !isAdmin) return;

    const loadAdminData = async () => {
      setLoading(true);
      try {
        const statsRes = await fetchApi('/admin/stats');
        if (statsRes.success) setStats(statsRes.data);

        const prodRes = await fetchApi('/products?limit=50');
        if (prodRes.success && prodRes.data) setProducts(prodRes.data.products);

        const orderRes = await fetchApi('/orders/admin/all');
        if (orderRes.success) setOrders(orderRes.data);

        const catRes = await fetchApi('/categories');
        if (catRes.success) setCategories(catRes.data);
      } catch (err) {
        console.error('Admin data error', err);
      } finally {
        setLoading(false);
      }
    };
    loadAdminData();
  }, [user, isAdmin]);

  if (!user || !isAdmin) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-wagh-error mx-auto" />
        <h2 className="font-editorial text-2xl font-bold text-wagh-dark">Admin Access Restricted</h2>
        <p className="text-sm text-wagh-muted">You must be logged in as an Administrator to view this portal.</p>
        <button
          onClick={() => navigate('/profile')}
          className="px-6 py-2.5 rounded-full bg-wagh-teal text-white font-bold text-xs"
        >
          Go to Sign In
        </button>
      </div>
    );
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
        res = await fetchApi(`/products/${editingProductId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetchApi('/products', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      if (res.success) {
        addToast(editingProductId ? 'Product updated!' : 'Product created successfully!', 'success');
        setShowProductModal(false);
        setEditingProductId(null);
        // Refresh products list
        const updated = await fetchApi('/products?limit=50');
        if (updated.success && updated.data) setProducts(updated.data.products);
      }
    } catch (err) {
      addToast(err.message || 'Save failed', 'error');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await fetchApi(`/products/${id}`, { method: 'DELETE' });
      if (res.success) {
        addToast('Product deleted', 'info');
        setProducts(products.filter(p => p._id !== id));
      }
    } catch (err) {
      addToast(err.message || 'Delete failed', 'error');
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetchApi(`/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ orderStatus: newStatus }),
      });
      if (res.success) {
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
            <span>{user.name}</span>
            <span className="font-mono-tag text-[10px] bg-wagh-teal text-white px-2 py-0.5 rounded-full uppercase tracking-wider">{user.role || 'ADMIN'}</span>
          </div>

          <button
            onClick={openCreateModal}
            className="px-5 py-2.5 rounded-full bg-wagh-teal text-white font-bold text-xs hover:bg-wagh-teal-dark transition-colors flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-wagh-border shadow-soft">
          <span className="text-xs font-mono-tag text-wagh-muted uppercase block">Total Revenue</span>
          <span className="font-mono-tag text-2xl font-extrabold text-wagh-teal">₹{stats.totalRevenue}</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-wagh-border shadow-soft">
          <span className="text-xs font-mono-tag text-wagh-muted uppercase block">Total Orders</span>
          <span className="font-mono-tag text-2xl font-extrabold text-wagh-dark">{stats.totalOrders}</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-wagh-border shadow-soft">
          <span className="text-xs font-mono-tag text-wagh-muted uppercase block">Active Products</span>
          <span className="font-mono-tag text-2xl font-extrabold text-wagh-dark">{products.length}</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-wagh-border shadow-soft">
          <span className="text-xs font-mono-tag text-wagh-muted uppercase block">Total Customers</span>
          <span className="font-mono-tag text-2xl font-extrabold text-wagh-dark">{stats.totalCustomers}</span>
        </div>
      </div>

      {/* TAB NAVIGATION */}
      <div className="bg-white rounded-3xl border border-wagh-border shadow-soft overflow-hidden">
        <div className="flex border-b border-wagh-border bg-gray-50 px-6">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-4 px-6 font-mono-tag text-xs font-bold uppercase ${
              activeTab === 'dashboard' ? 'border-b-2 border-wagh-teal text-wagh-teal bg-white' : 'text-wagh-muted'
            }`}
          >
            Dashboard Overview
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`py-4 px-6 font-mono-tag text-xs font-bold uppercase ${
              activeTab === 'products' ? 'border-b-2 border-wagh-teal text-wagh-teal bg-white' : 'text-wagh-muted'
            }`}
          >
            Products CRUD ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-4 px-6 font-mono-tag text-xs font-bold uppercase ${
              activeTab === 'orders' ? 'border-b-2 border-wagh-teal text-wagh-teal bg-white' : 'text-wagh-muted'
            }`}
          >
            Manage Orders ({orders.length})
          </button>
        </div>

        <div className="p-6">
          
          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <h3 className="font-editorial text-xl font-bold text-wagh-dark">Recent Customer Orders</h3>
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
                    {orders.slice(0, 5).map((o) => (
                      <tr key={o._id}>
                        <td className="p-3 font-bold text-wagh-teal">{o.orderId}</td>
                        <td className="p-3">{o.shippingAddress?.name}</td>
                        <td className="p-3 font-bold">₹{o.total}</td>
                        <td className="p-3">{o.paymentMethod}</td>
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

          {/* PRODUCTS CRUD TAB */}
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

          {/* ORDERS MANAGEMENT TAB */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              {orders.map((o) => (
                <div key={o._id} className="p-4 rounded-xl border border-wagh-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                  <div>
                    <span className="font-mono-tag font-bold text-wagh-teal text-sm">{o.orderId}</span>
                    <p className="text-wagh-dark font-medium">{o.shippingAddress?.name} ({o.shippingAddress?.phone})</p>
                    <p className="text-wagh-muted">Items: {o.items.length} | Total: ₹{o.total}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono-tag text-wagh-muted">Status:</span>
                    <select
                      value={o.orderStatus}
                      onChange={(e) => handleUpdateOrderStatus(o._id, e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-wagh-border font-mono-tag text-xs font-bold text-wagh-dark focus:ring-2 focus:ring-wagh-teal"
                    >
                      <option value="Processing">Processing</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              ))}
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
