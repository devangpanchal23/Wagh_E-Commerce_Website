import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Zap, ShieldCheck, Truck, RefreshCw, Heart, ChevronRight, Star, Check } from 'lucide-react';
import { RatingStars } from '../components/RatingStars';
import { ProductCard } from '../components/ProductCard';
import { fetchApi } from '../api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';

export function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { addToast } = useToast();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState('description'); // description | specs | reviews
  const [loading, setLoading] = useState(true);

  // Review Form state
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const loadProductData = async () => {
      setLoading(true);
      try {
        const res = await fetchApi(`/products/${id}`);
        if (res.success && res.data) {
          setProduct(res.data);
          setSelectedImage(0);

          // Fetch product reviews
          const reviewRes = await fetchApi(`/products/${res.data._id}/reviews`);
          if (reviewRes.success) setReviews(reviewRes.data);

          // Fetch related products in same category
          if (res.data.category?._id) {
            const relRes = await fetchApi(`/products?category=${res.data.category._id}&limit=4`);
            if (relRes.success && relRes.data) {
              setRelatedProducts(relRes.data.products.filter(p => p._id !== res.data._id));
            }
          }
        }
      } catch (err) {
        console.error('Product load error', err);
      } finally {
        setLoading(false);
      }
    };
    loadProductData();
  }, [id]);

  const handleBuyNow = () => {
    if (product) {
      addToCart(product, qty);
      navigate('/cart');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      addToast('Please login to write a review', 'info');
      navigate('/profile');
      return;
    }
    if (!newComment.trim()) return;

    setSubmittingReview(true);
    try {
      const res = await fetchApi(`/products/${product._id}/reviews`, {
        method: 'POST',
        body: JSON.stringify({ rating: newRating, comment: newComment }),
      });
      if (res.success) {
        addToast('Thank you! Review submitted successfully.', 'success');
        setReviews([res.data, ...reviews]);
        setNewComment('');
      }
    } catch (err) {
      addToast(err.message || 'Review failed', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <Zap className="w-10 h-10 text-wagh-teal animate-bounce mx-auto" />
        <p className="text-wagh-muted font-mono-tag">Loading product details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="font-editorial text-3xl font-bold text-wagh-dark">Product Not Found</h2>
        <Link to="/shop" className="inline-block px-6 py-2.5 rounded-full bg-wagh-teal text-white font-bold text-sm">
          Return to Shop
        </Link>
      </div>
    );
  }

  const isLiked = isInWishlist(product._id);
  const discountPercent = product.mrp > product.price 
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs font-mono-tag text-wagh-muted">
        <Link to="/" className="hover:text-wagh-teal">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/shop" className="hover:text-wagh-teal">Shop</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-wagh-teal font-bold truncate max-w-[200px]">{product.name}</span>
      </nav>

      {/* TOP SECTION: Gallery & Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* IMAGE GALLERY (4 images with switcher) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white rounded-3xl border border-wagh-border p-6 aspect-square flex items-center justify-center shadow-soft relative overflow-hidden">
            <img
              src={product.images[selectedImage] || product.images[0]}
              alt={product.name}
              className="max-h-full max-w-full object-contain transition-all duration-300"
            />
            {discountPercent > 0 && (
              <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-wagh-gold text-wagh-dark font-mono-tag font-bold text-xs shadow-md">
                {discountPercent}% OFF
              </span>
            )}
          </div>

          {/* Thumbnail switcher */}
          {product.images && product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`bg-white rounded-xl border-2 p-2 aspect-square flex items-center justify-center transition-all ${
                    selectedImage === idx ? 'border-wagh-teal shadow-md scale-105' : 'border-wagh-border hover:border-gray-300'
                  }`}
                >
                  <img src={img} alt={`Thumbnail ${idx + 1}`} className="max-h-full max-w-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* PRODUCT SUMMARY & BUY ACTIONS */}
        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-2">
            <span className="font-mono-tag text-xs font-bold uppercase tracking-wider text-wagh-teal bg-wagh-teal/10 px-3 py-1 rounded-full">
              {product.brand || 'WAGH'}
            </span>
            <h1 className="font-editorial text-3xl sm:text-4xl font-extrabold text-wagh-dark leading-tight">
              {product.name}
            </h1>
            <RatingStars rating={product.ratingAvg || 4.9} count={product.ratingCount || 24} />
          </div>

          {/* Price Block */}
          <div className="p-4 rounded-2xl bg-white border border-wagh-border flex items-baseline gap-4 shadow-sm">
            <span className="font-mono-tag text-3xl font-extrabold text-wagh-teal">
              ₹{product.price}
            </span>
            {product.mrp > product.price && (
              <span className="font-mono-tag text-base text-wagh-muted line-through">
                MRP ₹{product.mrp}
              </span>
            )}
            <span className="text-xs font-mono-tag text-wagh-success font-bold ml-auto">
              Inclusive of all taxes
            </span>
          </div>

          {/* Quick Spec Highlights */}
          <div className="grid grid-cols-2 gap-3 text-xs font-mono-tag text-wagh-dark">
            <div className="p-3 rounded-xl bg-gray-50 border border-wagh-border/60">
              <span className="text-wagh-muted block text-[10px]">OUTPUT POWER</span>
              <span className="font-bold text-wagh-teal">{product.specs?.outputPower || '45W PPS Super Fast'}</span>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 border border-wagh-border/60">
              <span className="text-wagh-muted block text-[10px]">WARRANTY</span>
              <span className="font-bold text-wagh-teal">{product.specs?.warranty || '24 Months Replacement'}</span>
            </div>
          </div>

          {/* Quantity Stepper */}
          <div className="flex items-center gap-4 pt-2">
            <span className="text-xs font-mono-tag font-bold uppercase text-wagh-muted">Quantity</span>
            <div className="flex items-center border border-wagh-border rounded-xl bg-white">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="px-3.5 py-1.5 text-wagh-dark font-bold hover:bg-gray-100 rounded-l-xl"
              >
                -
              </button>
              <span className="px-4 font-mono-tag font-bold text-sm text-wagh-dark">{qty}</span>
              <button
                onClick={() => setQty(qty + 1)}
                className="px-3.5 py-1.5 text-wagh-dark font-bold hover:bg-gray-100 rounded-r-xl"
              >
                +
              </button>
            </div>

            <button
              onClick={() => toggleWishlist(product)}
              className={`p-3 rounded-xl border transition-colors ${
                isLiked ? 'bg-red-50 border-red-200 text-wagh-error' : 'border-wagh-border text-gray-500 hover:text-wagh-error'
              }`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-wagh-error' : ''}`} />
            </button>
          </div>

          {/* Add to Cart & Buy Now Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <button
              onClick={() => addToCart(product, qty)}
              className="py-4 rounded-full bg-wagh-teal text-white font-extrabold text-sm hover:bg-wagh-teal-dark transition-all duration-200 shadow-md flex items-center justify-center gap-2 active:scale-95"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>Add to Cart</span>
            </button>
            <button
              onClick={handleBuyNow}
              className="py-4 rounded-full bg-wagh-gold text-wagh-dark font-extrabold text-sm hover:bg-wagh-gold-light transition-all duration-200 shadow-md flex items-center justify-center gap-2 active:scale-95"
            >
              <Zap className="w-5 h-5 fill-wagh-dark" />
              <span>Buy Now</span>
            </button>
          </div>

          {/* Trust Guarantees */}
          <div className="space-y-3 pt-4 border-t border-wagh-border text-xs text-wagh-dark">
            <div className="flex items-center gap-3">
              <Truck className="w-4 h-4 text-wagh-teal" />
              <span><strong>Free Express Delivery</strong> on orders over ₹499. Dispatched within 24 hours.</span>
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 text-wagh-teal" />
              <span><strong>24 Months Replacement Warranty</strong> with doorstep pickup support.</span>
            </div>
            <div className="flex items-center gap-3">
              <RefreshCw className="w-4 h-4 text-wagh-teal" />
              <span><strong>7 Days Easy Replacement Policy</strong> if damaged or defective.</span>
            </div>
          </div>

        </div>
      </div>

      {/* TABS SECTION: Description / Specs / Reviews */}
      <div className="bg-white rounded-3xl border border-wagh-border shadow-soft overflow-hidden">
        
        {/* Tab Headers */}
        <div className="flex border-b border-wagh-border bg-gray-50/80 px-6">
          {['description', 'specifications', 'reviews'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-6 font-mono-tag text-xs font-bold uppercase tracking-wider transition-all border-b-2 capitalize ${
                activeTab === tab
                  ? 'border-wagh-teal text-wagh-teal bg-white'
                  : 'border-transparent text-wagh-muted hover:text-wagh-dark'
              }`}
            >
              {tab === 'reviews' ? `Customer Reviews (${reviews.length})` : tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6 sm:p-8">
          {activeTab === 'description' && (
            <div className="prose prose-teal max-w-none text-wagh-dark text-sm sm:text-base leading-relaxed space-y-4">
              <p>{product.description}</p>
              <h4 className="font-editorial text-lg font-bold text-wagh-dark pt-2">Product Highlights</h4>
              <ul className="list-disc pl-5 space-y-1.5 text-sm text-wagh-dark/80">
                <li>Super fast PPS 45W charging output compatible with Samsung SFC 2.0.</li>
                <li>Aerospace-grade thermal heat management reduces heating by 35%.</li>
                <li>10-layer smart safety protection system certified by BIS standards.</li>
                <li>Compact travel-friendly dimensions with durable metallic accents.</li>
              </ul>
            </div>
          )}

          {activeTab === 'specifications' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(product.specs || {}).map(([key, val]) => (
                <div key={key} className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 border border-wagh-border text-xs">
                  <span className="font-mono-tag uppercase text-wagh-muted">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <span className="font-bold text-wagh-dark">{val || 'Standard'}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-8">
              
              {/* Submit Review Form */}
              <div className="bg-wagh-teal/5 p-6 rounded-2xl border border-wagh-teal/20 space-y-4">
                <h4 className="font-editorial text-xl font-bold text-wagh-teal">Write a Customer Review</h4>
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono-tag font-bold text-wagh-dark mb-1">Your Rating</label>
                    <RatingStars rating={newRating} interactive={true} onRatingChange={(r) => setNewRating(r)} />
                  </div>
                  <div>
                    <label className="block text-xs font-mono-tag font-bold text-wagh-dark mb-1">Your Review</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Share your experience with this product..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="w-full p-3 rounded-xl border border-wagh-border text-sm focus:outline-none focus:ring-2 focus:ring-wagh-teal"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="px-6 py-2.5 rounded-full bg-wagh-teal text-white font-bold text-xs hover:bg-wagh-teal-dark transition-colors"
                  >
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              </div>

              {/* Review List */}
              <div className="space-y-4">
                {reviews.length === 0 ? (
                  <p className="text-sm text-wagh-muted">No reviews yet. Be the first to review this product!</p>
                ) : (
                  reviews.map((rev) => (
                    <div key={rev._id} className="p-4 rounded-xl border border-wagh-border space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-wagh-dark">{rev.userName}</span>
                        <span className="text-xs font-mono-tag text-wagh-muted">
                          {new Date(rev.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <RatingStars rating={rev.rating} />
                      <p className="text-sm text-wagh-dark/80 leading-relaxed">{rev.comment}</p>
                    </div>
                  ))
                )}
              </div>

            </div>
          )}
        </div>
      </div>

      {/* RELATED PRODUCTS */}
      {relatedProducts.length > 0 && (
        <section className="space-y-6 pt-4">
          <h2 className="font-editorial text-2xl font-bold text-wagh-dark">Related Accessories</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
