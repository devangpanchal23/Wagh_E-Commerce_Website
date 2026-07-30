import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, ShieldCheck, CreditCard, Truck, ArrowLeft, Zap } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { fetchApi } from '../api';

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
      setIsSubmitting(false);
    }
  };

  // ORDER CONFIRMATION SCREEN
  if (completedOrder) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-20 h-20 bg-wagh-success/10 text-wagh-success rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-12 h-12" />
        </div>

        <span className="font-mono-tag text-xs font-bold uppercase tracking-widest text-wagh-teal bg-wagh-teal/10 px-4 py-1.5 rounded-full border border-wagh-teal/20">
          Order Confirmed
        </span>

        <h1 className="font-editorial text-4xl font-extrabold text-wagh-dark">
          Thank You For Your Order!
        </h1>

        <div className="bg-white p-6 rounded-2xl border border-wagh-border shadow-soft text-left space-y-4 font-mono-tag text-sm">
          <div className="flex justify-between border-b border-wagh-border pb-3">
            <span className="text-wagh-muted">Order ID:</span>
            <span className="font-bold text-wagh-teal">{completedOrder.orderId}</span>
          </div>

          <div className="flex justify-between border-b border-wagh-border pb-3">
            <span className="text-wagh-muted">Total Amount:</span>
            <span className="font-bold text-wagh-dark">₹{completedOrder.total}</span>
          </div>

          <div className="flex justify-between border-b border-wagh-border pb-3">
            <span className="text-wagh-muted">Payment Mode:</span>
            <span className="font-bold text-wagh-dark">{completedOrder.paymentMethod} ({completedOrder.paymentStatus})</span>
          </div>

          <div className="space-y-1 pt-1">
            <span className="text-wagh-muted text-xs block">SHIPPING ADDRESS</span>
            <p className="font-sans font-medium text-wagh-dark">
              {completedOrder.shippingAddress.name} ({completedOrder.shippingAddress.phone})
              <br />
              {completedOrder.shippingAddress.street}, {completedOrder.shippingAddress.city}, {completedOrder.shippingAddress.state} - {completedOrder.shippingAddress.pincode}
            </p>
          </div>
        </div>

        <p className="text-xs text-wagh-muted font-sans">
          A confirmation SMS and email have been dispatched. Estimated delivery within 48 hours.
        </p>

        <div className="pt-4 flex justify-center gap-4">
          <Link
            to="/profile"
            className="px-6 py-3 rounded-full bg-wagh-teal text-white font-bold text-sm shadow-md"
          >
            Track in My Account
          </Link>
          <Link
            to="/shop"
            className="px-6 py-3 rounded-full bg-white text-wagh-dark border border-wagh-border font-bold text-sm"
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
              <div key={item.product._id || item.product} className="flex items-center gap-3 text-xs">
                <img
                  src={item.product.images?.[0] || 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600'}
                  alt={item.product.name}
                  className="w-12 h-12 object-contain rounded bg-gray-50 border p-1"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-wagh-dark truncate">{item.product.name}</h4>
                  <p className="text-wagh-muted">Qty: {item.qty}</p>
                </div>
                <span className="font-mono-tag font-bold text-wagh-teal">₹{(item.product.price || item.price) * item.qty}</span>
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
