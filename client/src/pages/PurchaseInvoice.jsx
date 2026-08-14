import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FileText, Printer, ArrowLeft, Building2, Package, CheckCircle2, ShieldCheck, CreditCard, Receipt } from 'lucide-react';
import { fetchApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function PurchaseInvoice() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  useEffect(() => {
    async function loadInvoice() {
      try {
        setLoading(true);
        const res = await fetchApi(`/orders/${orderId}/receipt/invoice`, { getToken });
        if (res.success && res.data) {
          setData(res.data);
        } else {
          setError(res.message || 'Unable to load tax invoice');
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch tax invoice');
      } finally {
        setLoading(false);
      }
    }
    loadInvoice();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-center items-center p-6">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400 font-medium">Generating official tax invoice...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-center items-center p-6">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-3xl p-8 text-center space-y-4">
          <FileText className="w-16 h-16 text-rose-400 mx-auto" />
          <h2 className="text-xl font-bold text-slate-100">Invoice Not Found</h2>
          <p className="text-sm text-slate-400">{error || 'Could not locate tax invoice details.'}</p>
          <button
            onClick={() => navigate('/orders')}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-all shadow-lg text-sm cursor-pointer"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const { invoiceNumber, invoiceDate, orderId: orderIdStr, paymentMethod, paymentStatus, orderStatus, transactionId, lineItems, summary, shippingAddress, customer, company } = data;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8 print:bg-white print:text-slate-900 print:py-0 print:px-0">
      {/* Header controls (Hidden on print) */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-3">
          <Link
            to={`/orders/${orderId}/receipt/payment`}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            <Receipt className="w-4 h-4 text-emerald-400" />
            <span>View Payment Receipt</span>
          </Link>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Invoice</span>
          </button>
        </div>
      </div>

      {/* Main Invoice Card */}
      <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden print:border-none print:shadow-none print:bg-white print:text-slate-900 print:rounded-none">
        
        {/* Invoice Top Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-8 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 print:border-b-2 print:border-slate-300 print:from-white print:to-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-black text-xl print:bg-slate-100 print:text-slate-900">
              W
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white print:text-slate-900">
                TAX INVOICE
              </h1>
              <p className="text-xs text-slate-400 print:text-slate-600 font-medium">
                {company.name}
              </p>
            </div>
          </div>

          <div className="sm:text-right space-y-1">
            <p className="text-xs font-bold text-amber-400 print:text-slate-800 uppercase tracking-wider">
              Invoice #: <span className="font-mono text-white print:text-slate-900">{invoiceNumber}</span>
            </p>
            <p className="text-xs text-slate-400 print:text-slate-600">
              Date: <span className="font-medium text-slate-200 print:text-slate-800">{new Date(invoiceDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </p>
            <p className="text-xs text-slate-400 print:text-slate-600 font-mono">
              Order ID: <span className="text-amber-400 font-bold print:text-slate-900">{orderIdStr}</span>
            </p>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Seller & Customer Information Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pb-6 border-b border-slate-800 print:border-slate-300">
            {/* Business / Seller */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-amber-400 print:text-slate-900">
                <Building2 className="w-4 h-4" />
                <h3 className="text-xs font-bold uppercase tracking-wider">Seller Details</h3>
              </div>
              <p className="text-sm font-bold text-white print:text-slate-900">{company.name}</p>
              <p className="text-xs text-slate-400 print:text-slate-600">{company.address}</p>
              <p className="text-xs text-slate-400 print:text-slate-600"><span className="font-medium text-slate-300 print:text-slate-700">GSTIN:</span> {company.gstin}</p>
              <p className="text-xs text-slate-400 print:text-slate-600"><span className="font-medium text-slate-300 print:text-slate-700">Support:</span> {company.email}</p>
            </div>

            {/* Buyer / Shipping Address */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-amber-400 print:text-slate-900">
                <Package className="w-4 h-4" />
                <h3 className="text-xs font-bold uppercase tracking-wider">Billed & Shipped To</h3>
              </div>
              <p className="text-sm font-bold text-white print:text-slate-900">{shippingAddress?.name || customer.name}</p>
              {shippingAddress && (
                <p className="text-xs text-slate-400 print:text-slate-600 leading-relaxed">
                  {shippingAddress.street}, {shippingAddress.city}, {shippingAddress.state} - {shippingAddress.pincode}
                </p>
              )}
              <p className="text-xs text-slate-400 print:text-slate-600">Phone: {shippingAddress?.phone || customer.phone}</p>
              {customer.email && <p className="text-xs text-slate-400 print:text-slate-600">Email: {customer.email}</p>}
            </div>
          </div>

          {/* Payment & Order Meta */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800 print:bg-slate-50 print:border-slate-200">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider print:text-slate-500">Payment Mode</p>
              <p className="text-xs font-semibold text-slate-200 uppercase print:text-slate-800">{paymentMethod}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider print:text-slate-500">Payment Status</p>
              <p className="text-xs font-bold text-emerald-400 print:text-emerald-800">{paymentStatus}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider print:text-slate-500">Order Status</p>
              <p className="text-xs font-semibold text-slate-200 print:text-slate-800">{orderStatus}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider print:text-slate-500">Txn Ref</p>
              <p className="text-xs font-mono text-slate-300 truncate print:text-slate-800">{transactionId}</p>
            </div>
          </div>

          {/* Itemized Products Table */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 print:text-slate-700">
              Ordered Line Items
            </h3>
            <div className="rounded-2xl border border-slate-800 overflow-hidden print:border-slate-300">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/60 text-slate-300 print:bg-slate-100 print:text-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-semibold w-12">#</th>
                    <th className="py-3 px-4 font-semibold">Product Description</th>
                    <th className="py-3 px-4 font-semibold text-center w-16">Qty</th>
                    <th className="py-3 px-4 font-semibold text-right w-24">Price (₹)</th>
                    <th className="py-3 px-4 font-semibold text-right w-28">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 print:divide-slate-200">
                  {lineItems.map((item) => (
                    <tr key={item.srNo}>
                      <td className="py-3 px-4 text-slate-400 font-mono print:text-slate-600">{item.srNo}</td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-200 print:text-slate-900">{item.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono print:text-slate-500">SKU: {item.sku}</p>
                      </td>
                      <td className="py-3 px-4 text-center font-medium text-slate-200 print:text-slate-800">{item.qty}</td>
                      <td className="py-3 px-4 text-right text-slate-200 print:text-slate-800">₹{item.unitPrice.toLocaleString('en-IN')}</td>
                      <td className="py-3 px-4 text-right font-medium text-slate-200 print:text-slate-800">₹{item.lineTotal.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals & Tax Summary */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 pt-4">
            <div className="text-xs text-slate-400 max-w-sm space-y-1 print:text-slate-600">
              <p className="font-bold text-slate-300 print:text-slate-800">Terms & Conditions:</p>
              <p>• Goods once sold can be returned per WAGH return policy.</p>
              <p>• Inclusive of 18% Goods and Services Tax (GST).</p>
            </div>

            <div className="w-full sm:w-72 bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs print:bg-slate-50 print:border-slate-300">
              <div className="flex justify-between text-slate-300 print:text-slate-700">
                <span>Subtotal:</span>
                <span className="font-medium">₹{summary.subtotal.toLocaleString('en-IN')}</span>
              </div>

              {summary.discount > 0 && (
                <div className="flex justify-between text-emerald-400 print:text-emerald-700">
                  <span>Coupon Discount {summary.couponCode && `(${summary.couponCode})`}:</span>
                  <span className="font-medium">-₹{summary.discount.toLocaleString('en-IN')}</span>
                </div>
              )}

              {summary.shippingFee > 0 && (
                <div className="flex justify-between text-slate-300 print:text-slate-700">
                  <span>Shipping Fee:</span>
                  <span className="font-medium">₹{summary.shippingFee.toLocaleString('en-IN')}</span>
                </div>
              )}

              {summary.gstAmount > 0 && (
                <>
                  <div className="flex justify-between text-slate-400 text-[11px] print:text-slate-600 pl-3">
                    <span>CGST (9%):</span>
                    <span>₹{(summary.gstBreakdown?.cgst || Math.round(summary.gstAmount / 2)).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-[11px] print:text-slate-600 pl-3">
                    <span>SGST (9%):</span>
                    <span>₹{(summary.gstBreakdown?.sgst || Math.round(summary.gstAmount / 2)).toLocaleString('en-IN')}</span>
                  </div>
                </>
              )}

              <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-sm text-white print:text-slate-900 print:border-slate-300">
                <span>Grand Total:</span>
                <span className="text-amber-400 print:text-slate-900 text-base">₹{summary.grandTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="pt-6 border-t border-slate-800 flex justify-between items-center text-[11px] text-slate-400 print:text-slate-600 print:border-slate-200">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Authorized Tax Invoice • Wagh Mobile Accessories</span>
            </div>
            <p>Page 1 of 1</p>
          </div>

        </div>
      </div>
    </div>
  );
}
