import React, { useState, useEffect } from 'react';
import { Tag, Plus, Edit, Trash2, CheckCircle, XCircle, AlertCircle, Calendar, DollarSign, Percent, Lock, Unlock, Search, RefreshCw } from 'lucide-react';
import { fetchAdminApi } from '../../api';
import { useToast } from '../../context/ToastContext';

export function AdminCoupons() {
  const { addToast } = useToast();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: '',
    minCartValue: '0',
    maxDiscountCap: '',
    expiryDate: '',
    usageLimit: '',
  });

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const res = await fetchAdminApi('/admin/coupons');
      if (res.success && Array.isArray(res.data)) {
        setCoupons(res.data);
      }
    } catch (err) {
      addToast(err.message || 'Failed to fetch coupons', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const openCreateModal = () => {
    setEditingCoupon(null);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 30);
    const defaultExpiry = tomorrow.toISOString().split('T')[0];

    setForm({
      code: '',
      discountType: 'percentage',
      discountValue: '',
      minCartValue: '0',
      maxDiscountCap: '',
      expiryDate: defaultExpiry,
      usageLimit: '',
    });
    setShowModal(true);
  };

  const openEditModal = (coupon) => {
    setEditingCoupon(coupon);
    const formattedDate = coupon.expiryDate
      ? new Date(coupon.expiryDate).toISOString().split('T')[0]
      : '';

    setForm({
      code: coupon.code || '',
      discountType: coupon.discountType || 'percentage',
      discountValue: coupon.discountValue !== undefined ? String(coupon.discountValue) : '',
      minCartValue: coupon.minCartValue !== undefined ? String(coupon.minCartValue) : '0',
      maxDiscountCap: coupon.maxDiscountCap ? String(coupon.maxDiscountCap) : '',
      expiryDate: formattedDate,
      usageLimit: coupon.usageLimit ? String(coupon.usageLimit) : '',
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (saving) return;
    if (!form.code.trim() || !form.discountValue || !form.expiryDate) {
      addToast('Please fill in Code, Discount Value, and Expiry Date.', 'error');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        code: form.code.trim().toUpperCase(),
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minCartValue: Number(form.minCartValue || 0),
        maxDiscountCap: form.maxDiscountCap ? Number(form.maxDiscountCap) : null,
        expiryDate: form.expiryDate,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
      };

      if (editingCoupon) {
        const res = await fetchAdminApi(`/admin/coupons/${editingCoupon._id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        if (res.success) {
          addToast(`Coupon '${res.data.code}' updated successfully!`, 'success');
          setShowModal(false);
          loadCoupons();
        }
      } else {
        const res = await fetchAdminApi('/admin/coupons', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (res.success) {
          addToast(`Coupon '${res.data.code}' created as draft!`, 'success');
          setShowModal(false);
          loadCoupons();
        }
      }
    } catch (err) {
      addToast(err.message || 'Error saving coupon', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async (coupon) => {
    try {
      const res = await fetchAdminApi(`/admin/coupons/${coupon._id}/publish`, {
        method: 'PATCH',
      });
      if (res.success) {
        addToast(`Coupon '${coupon.code}' is now published & live!`, 'success');
        loadCoupons();
      }
    } catch (err) {
      addToast(err.message || 'Failed to publish coupon', 'error');
    }
  };

  const handleUnpublish = async (coupon) => {
    try {
      const res = await fetchAdminApi(`/admin/coupons/${coupon._id}/unpublish`, {
        method: 'PATCH',
      });
      if (res.success) {
        addToast(`Coupon '${coupon.code}' reverted to draft!`, 'info');
        loadCoupons();
      }
    } catch (err) {
      addToast(err.message || 'Failed to deactivate coupon', 'error');
    }
  };

  const handleDelete = async (coupon) => {
    if (!window.confirm(`Are you sure you want to delete coupon '${coupon.code}'?`)) return;
    try {
      const res = await fetchAdminApi(`/admin/coupons/${coupon._id}`, {
        method: 'DELETE',
      });
      if (res.success) {
        addToast(`Coupon '${coupon.code}' deleted.`, 'info');
        loadCoupons();
      }
    } catch (err) {
      addToast(err.message || 'Failed to delete coupon', 'error');
    }
  };

  const filteredCoupons = coupons.filter(c =>
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Tag className="w-5 h-5 text-amber-500" />
            <span>Coupon & Promo Management</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Create, publish, and control minimum cart value discount coupons.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search coupon code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-sm flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Coupon</span>
          </button>
        </div>
      </div>

      {/* Coupons Table */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
          <span>Loading coupons...</span>
        </div>
      ) : filteredCoupons.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
          <Tag className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">No Coupons Found</h3>
          <p className="text-xs text-slate-400">Click "Create Coupon" to launch your first promotional discount.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Coupon Code</th>
                  <th className="py-3 px-4">Discount</th>
                  <th className="py-3 px-4">Min. Cart Value</th>
                  <th className="py-3 px-4">Max. Cap</th>
                  <th className="py-3 px-4">Expiry</th>
                  <th className="py-3 px-4">Usage (Used / Limit)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCoupons.map((coupon) => {
                  const isExpired = new Date(coupon.expiryDate) < new Date();
                  const isPublished = coupon.status === 'published';

                  return (
                    <tr key={coupon._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        <span className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg">
                          {coupon.code}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {coupon.discountType === 'percentage'
                          ? `${coupon.discountValue}% OFF`
                          : `₹${coupon.discountValue} FLAT`}
                      </td>

                      <td className="py-3 px-4 text-slate-700 font-medium">
                        ₹{coupon.minCartValue.toLocaleString('en-IN')}
                      </td>

                      <td className="py-3 px-4 text-slate-500">
                        {coupon.maxDiscountCap ? `₹${coupon.maxDiscountCap}` : '—'}
                      </td>

                      <td className="py-3 px-4">
                        <span className={`text-[11px] font-medium ${isExpired ? 'text-rose-600 font-bold' : 'text-slate-600'}`}>
                          {new Date(coupon.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          {isExpired && ' (Expired)'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {coupon.usageCount} / {coupon.usageLimit ? coupon.usageLimit : '∞'}
                      </td>

                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isPublished
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isPublished ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {coupon.status.toUpperCase()}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPublished ? (
                            <button
                              onClick={() => handleUnpublish(coupon)}
                              title="Deactivate Coupon"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                              <Lock className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handlePublish(coupon)}
                              title="Publish Coupon"
                              className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                            >
                              <Unlock className="w-3 h-3" />
                              <span>Publish</span>
                            </button>
                          )}

                          <button
                            onClick={() => openEditModal(coupon)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDelete(coupon)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Tag className="w-5 h-5 text-amber-500" />
                <span>{editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}</span>
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Coupon Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SAVE20"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Discount Type *</label>
                  <select
                    value={form.discountType}
                    onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Discount Value *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder={form.discountType === 'percentage' ? 'e.g. 20' : 'e.g. 200'}
                    value={form.discountValue}
                    onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Min Cart Value (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0 for no minimum"
                    value={form.minCartValue}
                    onChange={(e) => setForm({ ...form, minCartValue: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Unlock rule required for coupon</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Max Discount Cap (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Optional cap for %"
                    value={form.maxDiscountCap}
                    onChange={(e) => setForm({ ...form, maxDiscountCap: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={form.expiryDate}
                    onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Usage Limit</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Leave empty for unlimited"
                    value={form.usageLimit}
                    onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingCoupon ? 'Update Coupon' : 'Save as Draft'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
