import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Printer, ArrowLeft, CheckCircle2, Clock, Building2, CreditCard, Receipt, FileText, Download } from 'lucide-react';
import { fetchApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function PaymentReceipt() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  useEffect(() => {
    async function loadReceipt() {
      try {
        setLoading(true);
        const res = await fetchApi(`/orders/${orderId}/receipt/payment`, { getToken });
        if (res.success && res.data) {
          setData(res.data);
        } else {
          setError(res.message || 'Unable to load payment receipt');
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch payment receipt');
      } finally {
        setLoading(false);
      }
    }
    loadReceipt();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-center items-center p-6">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400 font-medium">Generating financial payment receipt...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-center items-center p-6">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-3xl p-8 text-center space-y-4">
          <Receipt className="w-16 h-16 text-rose-400 mx-auto" />
          <h2 className="text-xl font-bold text-slate-100">Receipt Not Available</h2>
          <p className="text-sm text-slate-400">{error || 'Could not locate payment receipt details.'}</p>
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

  const { receipt, order, customer, company } = data;
  const isPaid = receipt.paymentStatus === 'Success';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8 print:bg-white print:text-slate-900 print:py-0 print:px-0">
      {/* Header controls (Hidden on print) */}
      <div className="max-w-3xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-3">
          <Link
            to={`/orders/${orderId}/receipt/invoice`}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4 text-amber-400" />
            <span>View Tax Invoice</span>
          </Link>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>

      {/* Main Payment Receipt Container */}
      <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden print:border-none print:shadow-none print:bg-white print:text-slate-900 print:rounded-none">
        
        {/* Receipt Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-8 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:border-b-2 print:border-slate-300 print:from-white print:to-white">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Receipt className="w-7 h-7 text-amber-400 print:text-slate-900" />
              <h1 className="text-2xl font-black tracking-tight text-white print:text-slate-900">
                Payment Receipt
              </h1>
            </div>
            <p className="text-xs text-slate-400 print:text-slate-600">
              Financial Transaction Record • {company.name}
            </p>
          </div>

          <div className="text-right">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
              isPaid
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 print:bg-emerald-100 print:text-emerald-800'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 print:bg-amber-100 print:text-amber-800'
            }`}>
              {isPaid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
              <span>{isPaid ? 'PAYMENT SUCCESSFUL' : 'PAYMENT PENDING'}</span>
            </div>
            <p className="text-[11px] font-mono text-slate-400 mt-1.5 print:text-slate-600">
              Receipt #: <span className="text-slate-200 font-bold print:text-slate-900">{receipt.receiptNumber}</span>
            </p>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Key Transaction Meta */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 print:bg-slate-50 print:border-slate-200">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider print:text-slate-500">Order Ref</p>
              <p className="text-sm font-mono font-bold text-amber-400 print:text-slate-900">{receipt.orderIdString}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider print:text-slate-500">Payment Date</p>
              <p className="text-xs font-medium text-slate-200 print:text-slate-800">
                {new Date(receipt.paymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider print:text-slate-500">Payment Mode</p>
              <p className="text-xs font-medium text-slate-200 uppercase print:text-slate-800">{receipt.paymentMode}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider print:text-slate-500">Txn / Gateway ID</p>
              <p className="text-xs font-mono text-slate-300 truncate print:text-slate-800">{receipt.gatewayTransactionId || 'N/A'}</p>
            </div>
          </div>

          {/* Business & Customer Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 border-b border-slate-800 print:border-slate-200">
            <div className="space-y-1">
              <p className="text-xs font-bold text-amber-400 uppercase tracking-wider print:text-slate-900">Paid To</p>
              <p className="text-sm font-bold text-white print:text-slate-900">{company.name}</p>
              <p className="text-xs text-slate-400 print:text-slate-600">GSTIN: {company.gstin}</p>
              <p className="text-xs text-slate-400 print:text-slate-600">{company.address}</p>
              <p className="text-xs text-slate-400 print:text-slate-600">Email: {company.email}</p>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-bold text-amber-400 uppercase tracking-wider print:text-slate-900">Customer Details</p>
              <p className="text-sm font-bold text-white print:text-slate-900">{customer.name}</p>
              {customer.email && <p className="text-xs text-slate-400 print:text-slate-600">Email: {customer.email}</p>}
              {customer.phone && <p className="text-xs text-slate-400 print:text-slate-600">Phone: {customer.phone}</p>}
            </div>
          </div>

          {/* Financial Breakdown Table */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 print:text-slate-700">
              Financial Breakdown
            </h3>
            <div className="rounded-2xl border border-slate-800 overflow-hidden print:border-slate-300">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/60 text-slate-300 print:bg-slate-100 print:text-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Description</th>
                    <th className="py-3 px-4 font-semibold text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 print:divide-slate-200">
                  <tr>
                    <td className="py-3 px-4 text-slate-200 print:text-slate-800">Item Subtotal</td>
                    <td className="py-3 px-4 text-right font-medium text-slate-200 print:text-slate-800">
                      ₹{receipt.subtotal.toLocaleString('en-IN')}
                    </td>
                  </tr>

                  {receipt.couponDiscountAmount > 0 && (
                    <tr className="text-emerald-400 print:text-emerald-700">
                      <td className="py-3 px-4 font-medium">
                        Coupon Discount {receipt.couponCode && `(${receipt.couponCode})`}
                      </td>
                      <td className="py-3 px-4 text-right font-medium">
                        -₹{receipt.couponDiscountAmount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  )}

                  {receipt.gstAmount > 0 && (
                    <>
                      <tr>
                        <td className="py-2 px-4 text-slate-400 text-[11px] pl-8 print:text-slate-600">
                          CGST (9%)
                        </td>
                        <td className="py-2 px-4 text-right text-slate-400 text-[11px] print:text-slate-600">
                          ₹{(receipt.gstBreakdown?.cgst || Math.round(receipt.gstAmount / 2)).toLocaleString('en-IN')}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-4 text-slate-400 text-[11px] pl-8 print:text-slate-600">
                          SGST (9%)
                        </td>
                        <td className="py-2 px-4 text-right text-slate-400 text-[11px] print:text-slate-600">
                          ₹{(receipt.gstBreakdown?.sgst || Math.round(receipt.gstAmount / 2)).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    </>
                  )}

                  <tr className="bg-slate-800/40 font-bold text-sm print:bg-slate-100">
                    <td className="py-4 px-4 text-white print:text-slate-900">Total Amount Paid</td>
                    <td className="py-4 px-4 text-right text-amber-400 print:text-slate-900 text-base">
                      ₹{receipt.finalAmountPaid.toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Security & Verification Footer */}
          <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] text-slate-400 print:text-slate-600 print:border-slate-200">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Computer-generated official receipt. No physical signature required.</span>
            </div>
            <p>Thank you for shopping with Wagh Mobile!</p>
          </div>

        </div>
      </div>
    </div>
  );
}
