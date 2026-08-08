import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingBag, ShieldCheck, CreditCard, CheckCircle2, AlertCircle, ArrowLeft, Lock } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { fetchApi } from '../api';
import { ProductImage } from '../components/ProductImage';

export function Checkout() {
  const { cartItems, subtotal, shippingFee, grandTotal, clearCart } = useCart();
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [address, setAddress] = useState({
    name: user?.name || '',
    phone: '+91 90544 05305',
    street: '42 Speed Avenue, Sector 4',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
  });

  const [paymentMethod, setPaymentMethod] = useState('COD'); // COD | Razorpay
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    if (!user) {
      addToast('Please login to place an order', 'info');
      navigate('/profile');
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedItems = cartItems.map((item) => ({
        product: item.product._id || item.product,
        name: item.product.name,
        image: item.product.images?.[0] || '',
        price: item.product.price || item.price,
        qty: item.qty,
      }));

      const payload = {
        items: formattedItems,
        shippingAddress: address,
        paymentMethod,
        subtotal,
        shippingFee,
        discount: 0,
        total: grandTotal,
      };

      if (paymentMethod === 'Razorpay') {
        const loaded = await loadRazorpayScript();
        if (!loaded || !window.Razorpay) {
          addToast('Failed to load Razorpay payment SDK. Please check your connection.', 'error');
          setIsSubmitting(false);
          return;
        }

        // Step 1: Create Razorpay Order on Backend
        const razorpayOrderRes = await fetchApi('/orders/create-razorpay-order', {
          method: 'POST',
          body: JSON.stringify({
            amount: grandTotal,
            currency: 'INR',
            receipt: `rcpt_${Date.now()}`,
          }),
        });

        if (!razorpayOrderRes || !razorpayOrderRes.order_id) {
          throw new Error('Failed to create Razorpay payment order');
        }

        const razorpayKey = razorpayOrderRes.key || import.meta.env.VITE_RAZORPAY_KEY_ID;

        // Step 2: Open Razorpay Checkout Modal
        const options = {
          key: razorpayKey,
          amount: razorpayOrderRes.amount,
          currency: razorpayOrderRes.currency || 'INR',
          name: 'WAGH Mobile Accessories',
          description: 'Payment for WAGH Accessories Order',
          image: `${window.location.origin}/assets/branding/wagh-logo-2x.png`,
          order_id: razorpayOrderRes.order_id,
          handler: async function (response) {
            // Step 3: Verify Payment Signature on Backend
            try {
              setIsSubmitting(true);
              const verifyRes = await fetchApi('/orders/verify-razorpay-payment', {
                method: 'POST',
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              });

              if (verifyRes && verifyRes.success) {
                // Submit order to database after verified payment
                const res = await fetchApi('/orders', {
                  method: 'POST',
                  body: JSON.stringify({
                    ...payload,
                    paymentMethod: 'Razorpay',
                    paymentStatus: 'Paid',
                    razorpayOrderId: response.razorpay_order_id,
                    razorpayPaymentId: response.razorpay_payment_id,
                  }),
                });

                if (res.success) {
                  setCompletedOrder(res.data);
                  clearCart();
                  addToast('Payment verified & order placed successfully!', 'success');
                }
              }
            } catch (verifyErr) {
              console.error('Signature verification error:', verifyErr);
              addToast(verifyErr.message || 'Payment verification failed.', 'error');
            } finally {
              setIsSubmitting(false);
            }
          },
          prefill: {
            name: address.name || user?.name || user?.displayName || '',
            email: user?.email || '',
            contact: address.phone || '',
          },
          theme: {
            color: '#0D9488',
          },
          modal: {
            ondismiss: function () {
              setIsSubmitting(false);
              addToast('Razorpay payment modal closed', 'info');
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (failureResponse) {
          console.error('Razorpay Payment Failed:', failureResponse.error);
          setIsSubmitting(false);
          addToast(
            `Payment Failed: ${failureResponse.error?.description || 'Transaction was unsuccessful'}`,
            'error'
          );
        });

        rzp.open();
        return;
      }

      // COD Flow
      const res = await fetchApi('/orders', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.success) {
        setCompletedOrder(res.data);
        clearCart();
        addToast('Order placed successfully!', 'success');
      }
    } catch (err) {
      addToast(err.message || 'Order failed to process', 'error');
    } finally {
      if (paymentMethod !== 'Razorpay') {
        setIsSubmitting(false);
      }
    }
  };

  // ORDER CONFIRMATION SCREEN
  // ORDER CONFIRMATION / DETAIL TRANSACTION SCREEN (Matches Reference Mockup)
  if (completedOrder) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center space-y-6">
        {/* Floating Green Success Badge as seen in reference image */}
        <div className="relative inline-block mx-auto">
          <div className="w-24 h-24 bg-emerald-100/70 rounded-full flex items-center justify-center p-2 mx-auto animate-bounce">
            <div className="w-18 h-18 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg">
              <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
            </div>
          </div>
        </div>

        <div>
          <h1 className="font-editorial text-3xl sm:text-4xl font-extrabold text-wagh-dark">
            Payment Successful!
          </h1>
          <p className="text-xs sm:text-sm text-wagh-muted font-sans mt-1.5">
            Successfully authorized order <span className="font-bold text-wagh-teal font-mono-tag">₹{completedOrder.total}</span> to WAGH Store
          </p>
        </div>

        {/* Detail Transaction Card (Matches Reference Image) */}
        <div className="bg-white p-6 rounded-3xl border border-wagh-border shadow-soft text-left space-y-4 font-mono-tag text-xs sm:text-sm">
          <h3 className="font-editorial text-lg font-bold text-wagh-dark border-b border-wagh-border/80 pb-3">
            Detail Transaction
          </h3>

          <div className="flex justify-between items-center text-wagh-muted">
            <span>Transaction ID</span>
            <span className="font-bold text-wagh-dark">{completedOrder.orderId}</span>
          </div>

          <div className="flex justify-between items-center text-wagh-muted">
            <span>Date</span>
            <span className="font-bold text-wagh-dark">
              {new Date(completedOrder.createdAt || Date.now()).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>

          <div className="flex justify-between items-center text-wagh-muted">
            <span>Type of Transaction</span>
            <span className="font-bold text-wagh-dark">{completedOrder.paymentMethod || 'Online Transfer'}</span>
          </div>

          <div className="flex justify-between items-center text-wagh-muted">
            <span>Nominal</span>
            <span className="font-bold text-wagh-dark">₹{completedOrder.subtotal || completedOrder.total}</span>
          </div>

          <div className="flex justify-between items-center text-wagh-muted">
            <span>Shipping Fee</span>
            <span className="font-bold text-wagh-dark">{completedOrder.shippingFee === 0 ? 'FREE' : `₹${completedOrder.shippingFee}`}</span>
          </div>

          <div className="flex justify-between items-center text-wagh-muted">
            <span>Recipient Number</span>
            <span className="font-bold text-wagh-dark">{completedOrder.shippingAddress?.phone || '+91 90544 05305'}</span>
          </div>

          <div className="flex justify-between items-center text-wagh-muted">
            <span>Status</span>
            <span className="font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              {completedOrder.paymentStatus || 'Success'}
            </span>
          </div>

          <div className="flex justify-between items-center text-base font-extrabold text-wagh-dark border-t border-wagh-border pt-3">
            <span>Total</span>
            <span className="text-wagh-teal">₹{completedOrder.total}</span>
          </div>
        </div>

        {/* Full width primary action button */}
        <div className="space-y-3 pt-2">
          <Link
            to="/profile"
            className="w-full py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm shadow-md transition-all block text-center"
          >
            Close & Track Order
          </Link>
          <Link
            to="/shop"
            className="w-full py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-wagh-dark font-bold text-xs transition-all block text-center"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="font-editorial text-2xl font-bold text-wagh-dark">No items to checkout</h2>
        <Link to="/shop" className="inline-block px-6 py-2.5 rounded-full bg-wagh-teal text-white font-bold text-xs">
          Return to Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      <div className="flex items-center gap-4 border-b border-wagh-border pb-4">
        <Link to="/cart" className="p-2 rounded-full hover:bg-gray-100 text-wagh-dark">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-editorial text-3xl font-extrabold text-wagh-dark">Checkout</h1>
      </div>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Shipping & Payment */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Shipping Address Section */}
          <div className="bg-white p-6 rounded-2xl border border-wagh-border shadow-soft space-y-4">
            <h3 className="font-editorial text-xl font-bold text-wagh-dark flex items-center gap-2">
              <Truck className="w-5 h-5 text-wagh-teal" />
              <span>1. Shipping Address</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-medium">
              <div>
                <label className="block text-xs font-mono-tag text-wagh-muted mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={address.name}
                  onChange={(e) => setAddress({ ...address, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-wagh-border focus:outline-none focus:ring-2 focus:ring-wagh-teal"
                />
              </div>

              <div>
                <label className="block text-xs font-mono-tag text-wagh-muted mb-1">Phone Number</label>
                <input
                  type="text"
                  required
                  value={address.phone}
                  onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-wagh-border focus:outline-none focus:ring-2 focus:ring-wagh-teal"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-mono-tag text-wagh-muted mb-1">Street Address</label>
                <input
                  type="text"
                  required
                  value={address.street}
                  onChange={(e) => setAddress({ ...address, street: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-wagh-border focus:outline-none focus:ring-2 focus:ring-wagh-teal"
                />
              </div>

              <div>
                <label className="block text-xs font-mono-tag text-wagh-muted mb-1">City</label>
                <input
                  type="text"
                  required
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-wagh-border focus:outline-none focus:ring-2 focus:ring-wagh-teal"
                />
              </div>

              <div>
                <label className="block text-xs font-mono-tag text-wagh-muted mb-1">State & Pincode</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={address.state}
                    onChange={(e) => setAddress({ ...address, state: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-wagh-border focus:outline-none focus:ring-2 focus:ring-wagh-teal"
                  />
                  <input
                    type="text"
                    required
                    value={address.pincode}
                    onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                    className="w-28 p-2.5 rounded-xl border border-wagh-border font-mono-tag focus:outline-none focus:ring-2 focus:ring-wagh-teal"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Options Section */}
          <div className="bg-white p-6 rounded-2xl border border-wagh-border shadow-soft space-y-4">
            <h3 className="font-editorial text-xl font-bold text-wagh-dark flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-wagh-teal" />
              <span>2. Payment Option</span>
            </h3>

            <div className="space-y-3">
              <label
                onClick={() => setPaymentMethod('COD')}
                className={`p-4 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                  paymentMethod === 'COD' ? 'border-wagh-teal bg-wagh-teal/5' : 'border-wagh-border hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input type="radio" checked={paymentMethod === 'COD'} readOnly className="w-4 h-4 text-wagh-teal" />
                  <div>
                    <div className="font-bold text-sm text-wagh-dark">Cash on Delivery (COD)</div>
                    <div className="text-xs text-wagh-muted">Pay cash directly when order arrives at door</div>
                  </div>
                </div>
                <span className="font-mono-tag text-xs font-bold text-wagh-teal bg-white px-2 py-1 rounded border">Standard</span>
              </label>

              <label
                onClick={() => setPaymentMethod('Razorpay')}
                className={`p-4 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                  paymentMethod === 'Razorpay' ? 'border-wagh-teal bg-wagh-teal/5' : 'border-wagh-border hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input type="radio" checked={paymentMethod === 'Razorpay'} readOnly className="w-4 h-4 text-wagh-teal" />
                  <div>
                    <div className="font-bold text-sm text-wagh-dark">Razorpay (UPI / NetBanking / Cards)</div>
                    <div className="text-xs text-wagh-muted">Instant payment gateway test mode</div>
                  </div>
                </div>
                <span className="font-mono-tag text-xs font-bold text-wagh-gold bg-wagh-dark px-2 py-1 rounded">Fast</span>
              </label>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Order Review & Submit */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-wagh-border shadow-soft space-y-6">
          <h3 className="font-editorial text-xl font-bold text-wagh-dark border-b border-wagh-border pb-3">
            Review Your Items
          </h3>

          <div className="max-h-60 overflow-y-auto space-y-3 pr-2">
            {cartItems.map((item) => (
              <div key={item.product._id || item.product} className="flex items-center gap-3.5 text-xs py-1">
                <ProductImage
                  src={item.product.images}
                  alt={item.product.name}
                  variant="thumbnail"
                  className="w-16 h-16 sm:w-20 sm:h-20 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-wagh-dark text-sm truncate">{item.product.name}</h4>
                  <p className="text-wagh-muted font-mono-tag mt-0.5">Qty: {item.qty} × ₹{item.product.price || item.price}</p>
                </div>
                <span className="font-mono-tag font-extrabold text-wagh-teal text-sm shrink-0">₹{(item.product.price || item.price) * item.qty}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-wagh-border pt-4 space-y-2 font-mono-tag text-xs">
            <div className="flex justify-between text-wagh-muted">
              <span>Subtotal</span>
              <span>₹{subtotal}</span>
            </div>
            <div className="flex justify-between text-wagh-muted">
              <span>Shipping</span>
              <span>{shippingFee === 0 ? 'FREE' : `₹${shippingFee}`}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-wagh-teal pt-2 border-t">
              <span>Total Payable</span>
              <span>₹{grandTotal}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 rounded-full bg-wagh-teal text-white font-extrabold text-sm hover:bg-wagh-teal-dark transition-all duration-200 shadow-md flex items-center justify-center gap-2"
          >
            <Zap className="w-5 h-5 fill-white" />
            <span>{isSubmitting ? 'Processing Order...' : `Place Order — ₹${grandTotal}`}</span>
          </button>
        </div>

      </form>
    </div>
  );
}
