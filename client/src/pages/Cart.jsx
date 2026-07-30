import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowRight, ShieldCheck, Zap, Tag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { CheckoutButton } from '../components/CheckoutButton';

export function Cart() {
  const { cartItems, updateQty, removeFromCart, subtotal, shippingFee, grandTotal } = useCart();
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (!coupon.trim()) return;
    if (coupon.toUpperCase() === 'WAGH200' || coupon.toUpperCase() === 'FIRST200') {
      setDiscount(200);
      setCouponApplied(true);
      addToast('Coupon WAGH200 applied! ₹200 discount added.', 'success');
    } else {
      addToast('Invalid coupon code. Try "WAGH200"', 'error');
    }
  };

  const finalTotal = Math.max(0, grandTotal - discount);

  if (cartItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-20 h-20 bg-wagh-teal/10 text-wagh-teal rounded-full flex items-center justify-center mx-auto">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="font-editorial text-3xl font-bold text-wagh-dark">Your Cart is Empty</h2>
        <p className="text-wagh-muted max-w-md mx-auto text-sm">
          Looks like you haven't added any premium WAGH accessories to your cart yet.
        </p>
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-wagh-teal text-white font-extrabold text-sm shadow-md hover:bg-wagh-teal-dark transition-all"
        >
          <span>Explore Collection</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      <div className="border-b border-wagh-border pb-4">
        <h1 className="font-editorial text-3xl font-extrabold text-wagh-dark">
          Shopping Cart ({cartItems.reduce((acc, i) => acc + i.qty, 0)} Items)
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* CART LINE ITEMS */}
        <div className="lg:col-span-8 space-y-4">
          {cartItems.map((item) => {
            const product = item.product;
            const price = product.price || item.price || 0;
            const pId = product._id || product;

            return (
              <div
                key={pId}
                className="bg-white p-4 sm:p-6 rounded-2xl border border-wagh-border shadow-soft flex flex-col sm:flex-row items-center gap-4 sm:gap-6"
              >
                {/* Thumbnail */}
                <Link to={`/product/${pId}`} className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-50 rounded-xl p-2 shrink-0 border border-wagh-border flex items-center justify-center">
                  <img
                    src={product.images && product.images.length > 0 ? product.images[0] : 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600'}
                    alt={product.name}
                    className="max-h-full max-w-full object-contain"
                  />
                </Link>

                {/* Details */}
                <div className="flex-1 min-w-0 text-center sm:text-left space-y-1">
                  <span className="text-[10px] font-mono-tag uppercase text-wagh-muted font-bold">
                    {product.brand || 'WAGH'}
                  </span>
                  <Link to={`/product/${pId}`}>
                    <h3 className="font-bold text-wagh-dark text-base hover:text-wagh-teal transition-colors truncate">
                      {product.name}
                    </h3>
                  </Link>
                  <div className="font-mono-tag text-sm font-bold text-wagh-teal">
                    ₹{price}
                  </div>
                </div>

                {/* Stepper */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-wagh-border rounded-xl bg-white">
                    <button
                      onClick={() => updateQty(pId, item.qty - 1)}
                      className="px-3 py-1 font-bold text-wagh-dark hover:bg-gray-100 rounded-l-xl"
                    >
                      -
                    </button>
                    <span className="px-3 font-mono-tag font-bold text-sm">{item.qty}</span>
                    <button
                      onClick={() => updateQty(pId, item.qty + 1)}
                      className="px-3 py-1 font-bold text-wagh-dark hover:bg-gray-100 rounded-r-xl"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => removeFromCart(pId)}
                    className="p-2 text-wagh-muted hover:text-wagh-error transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ORDER SUMMARY */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-wagh-border shadow-soft space-y-6">
          <h3 className="font-editorial text-xl font-bold text-wagh-dark border-b border-wagh-border pb-3">
            Order Summary
          </h3>

          {/* Coupon Code Input */}
          <form onSubmit={handleApplyCoupon} className="flex gap-2">
            <div className="relative flex-1">
              <Tag className="w-4 h-4 text-wagh-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Coupon (e.g. WAGH200)"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-wagh-border text-xs font-mono-tag uppercase focus:outline-none focus:ring-2 focus:ring-wagh-teal"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-wagh-dark text-white font-mono-tag text-xs font-bold hover:bg-wagh-teal transition-colors shrink-0"
            >
              Apply
            </button>
          </form>

          {couponApplied && (
            <div className="text-xs font-mono-tag text-wagh-success bg-green-50 p-2 rounded-lg border border-green-200">
              ✓ Code WAGH200 Applied (-₹200)
            </div>
          )}

          {/* Pricing Breakdown */}
          <div className="space-y-3 text-sm font-mono-tag text-wagh-dark border-t border-wagh-border pt-4">
            <div className="flex justify-between">
              <span className="text-wagh-muted">Subtotal</span>
              <span>₹{subtotal}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-wagh-muted">Shipping</span>
              <span>
                {shippingFee === 0 ? (
                  <span className="text-wagh-success font-bold">FREE</span>
                ) : (
                  `₹${shippingFee}`
                )}
              </span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between text-wagh-success font-bold">
                <span>Discount</span>
                <span>-₹{discount}</span>
              </div>
            )}

            <div className="flex justify-between text-base font-extrabold text-wagh-teal border-t border-wagh-border pt-3">
              <span>Total</span>
              <span>₹{finalTotal}</span>
            </div>
          </div>

          <CheckoutButton />

          <div className="pt-2 text-center text-xs text-wagh-muted space-y-1">
            <p className="flex items-center justify-center gap-1">
              <ShieldCheck className="w-4 h-4 text-wagh-teal" />
              <span>Safe & Encrypted Checkout</span>
            </p>
            <p>Free shipping applies on orders over ₹499</p>
          </div>
        </div>

      </div>
    </div>
  );
}
