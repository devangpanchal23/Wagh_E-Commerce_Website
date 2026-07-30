import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { ProfileDetailsForm } from '../components/profile/ProfileDetailsForm';
import { AddressBook } from '../components/profile/AddressBook';
import { ShieldCheck, AlertCircle, RefreshCw, LogOut, Package, Heart, User as UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { ProductCard } from '../components/ProductCard';
import { fetchApi } from '../api';

export function ProfilePage() {
  const { user, logout, isAdmin } = useAuth();
  const { wishlist } = useWishlist();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [profile, setProfile] = useState(() => user || null);
  const [loading, setLoading] = useState(() => !user);
  const [fetchError, setFetchError] = useState(null);

  // Tab state: 'profile' | 'orders' | 'wishlist'
  const [activeTab, setActiveTab] = useState('profile');
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Keep profile in sync with AuthContext user data immediately
  useEffect(() => {
    if (user) {
      setProfile((prev) => ({
        ...user,
        ...(prev || {}),
      }));
      setLoading(false);
    }
  }, [user]);

  // Non-blocking background sync for user profile document
  const loadUserProfile = async () => {
    if (!user || !user.uid) return;
    setFetchError(null);

    try {
      const userDocRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userDocRef);

      if (snap.exists()) {
        setProfile((prev) => ({ ...(prev || {}), ...snap.data() }));
      } else {
        // Document does not exist yet (first-time user login) -> create default user document
        const initialDoc = {
          uid: user.uid,
          displayName: user.displayName || user.name || 'WAGH Member',
          email: user.email || '',
          phone: user.phoneNumber || user.phone || '',
          profileImageUrl: user.photoURL || '',
          addresses: [],
          role: 'customer',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await setDoc(userDocRef, initialDoc);
        setProfile(initialDoc);
      }
    } catch (err) {
      console.error('Error loading private user profile:', err);
      if (!profile) {
        setFetchError(err.message || 'Failed to load your profile data.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.uid) {
      loadUserProfile();
    }
  }, [user?.uid]);

  // Load orders when switching to orders tab
  useEffect(() => {
    if (activeTab === 'orders' && user) {
      const loadOrders = async () => {
        setLoadingOrders(true);
        try {
          const res = await fetchApi('/orders/myorders');
          if (res && res.success) {
            setOrders(res.data || []);
          }
        } catch (e) {
          console.error('Error fetching order history:', e);
        } finally {
          setLoadingOrders(false);
        }
      };
      loadOrders();
    }
  }, [activeTab, user]);

  // Handler to update profile details (displayName, phone)
  const handleSaveDetails = async (updatedFields) => {
    if (!user || !user.uid) return { success: false, message: 'Not authenticated' };

    const previousProfile = profile;
    setProfile((prev) => ({ ...prev, ...updatedFields }));

    try {
      const userDocRef = doc(db, 'users', user.uid);
      const payload = {
        ...updatedFields,
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(userDocRef, payload);
      return { success: true };
    } catch (err) {
      console.error('Error saving profile details:', err);
      setProfile(previousProfile);
      return { success: false, message: err.message || 'Failed to update profile.' };
    }
  };

  // Handler to update profile image URL
  const handleUpdateProfileImage = async (imageUrl) => {
    if (!user || !user.uid) return;

    setProfile((prev) => ({ ...prev, profileImageUrl: imageUrl }));

    const userDocRef = doc(db, 'users', user.uid);
    const payload = {
      profileImageUrl: imageUrl,
      updatedAt: new Date().toISOString(),
    };

    await updateDoc(userDocRef, payload);
  };

  // Handler to save updated address array (Optimistic UI update)
  const handleSaveAddresses = async (newAddresses) => {
    if (!user || !user.uid) return { success: false, message: 'Not authenticated' };

    const previousAddresses = profile?.addresses || [];
    // Optimistically update React state immediately
    setProfile((prev) => ({ ...prev, addresses: newAddresses }));

    try {
      const userDocRef = doc(db, 'users', user.uid);
      const payload = {
        addresses: newAddresses,
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(userDocRef, payload);
      return { success: true };
    } catch (err) {
      console.error('Error saving address book:', err);
      // Rollback on failure
      setProfile((prev) => ({ ...prev, addresses: previousAddresses }));
      return { success: false, message: err.message || 'Failed to save address.' };
    }
  };

  // Render Skeleton / Loading state
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-pulse">
        <div className="bg-white p-8 rounded-3xl border border-wagh-border flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-gray-200" />
          <div className="space-y-3 flex-1">
            <div className="h-6 bg-gray-200 rounded w-1/3" />
            <div className="h-4 bg-gray-200 rounded w-1/4" />
          </div>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-wagh-border space-y-6">
          <div className="h-5 bg-gray-200 rounded w-1/4" />
          <div className="grid grid-cols-2 gap-6">
            <div className="h-12 bg-gray-200 rounded-xl" />
            <div className="h-12 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  // Render Error state
  if (fetchError) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="font-editorial text-2xl font-bold text-wagh-dark">Unable to Access Private Workspace</h2>
          <p className="text-sm text-wagh-muted">{fetchError}</p>
        </div>
        <button
          onClick={loadUserProfile}
          className="px-6 py-3 rounded-full bg-wagh-teal text-white text-xs font-bold hover:bg-wagh-teal-dark transition-all inline-flex items-center gap-2 shadow-md"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry Loading Profile</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header Card */}
      <ProfileHeader
        profile={profile}
        user={user}
        onUpdateProfileImage={handleUpdateProfileImage}
      />

      {/* Main Content Tabs & Actions */}
      <div className="bg-white rounded-3xl border border-wagh-border shadow-soft overflow-hidden">
        {/* Tab Navigation */}
        <div className="flex flex-wrap border-b border-wagh-border bg-gray-50/80 px-4 sm:px-6 justify-between items-center">
          <div className="flex">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-4 px-5 font-mono-tag text-xs font-bold uppercase transition-all border-b-2 flex items-center gap-2 ${
                activeTab === 'profile'
                  ? 'border-wagh-teal text-wagh-teal bg-white shadow-xs'
                  : 'border-transparent text-wagh-muted hover:text-wagh-dark'
              }`}
            >
              <UserIcon className="w-4 h-4" />
              <span>Profile & Addresses</span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`py-4 px-5 font-mono-tag text-xs font-bold uppercase transition-all border-b-2 flex items-center gap-2 ${
                activeTab === 'orders'
                  ? 'border-wagh-teal text-wagh-teal bg-white shadow-xs'
                  : 'border-transparent text-wagh-muted hover:text-wagh-dark'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Orders ({orders.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('wishlist')}
              className={`py-4 px-5 font-mono-tag text-xs font-bold uppercase transition-all border-b-2 flex items-center gap-2 ${
                activeTab === 'wishlist'
                  ? 'border-wagh-teal text-wagh-teal bg-white shadow-xs'
                  : 'border-transparent text-wagh-muted hover:text-wagh-dark'
              }`}
            >
              <Heart className="w-4 h-4" />
              <span>Wishlist ({wishlist.length})</span>
            </button>
          </div>

          <div className="py-2 flex items-center gap-3">
            {isAdmin && (
              <button
                onClick={() => navigate('/admin')}
                className="px-3.5 py-1.5 rounded-full bg-wagh-gold/20 text-wagh-teal font-mono-tag text-xs font-bold border border-wagh-gold/40 hover:bg-wagh-gold/30 transition-colors"
              >
                Admin Panel
              </button>
            )}

            <button
              onClick={logout}
              className="px-3.5 py-1.5 rounded-full bg-red-50 text-wagh-error font-mono-tag text-xs font-bold hover:bg-red-100 flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Tab Body */}
        <div className="p-6 sm:p-8 space-y-8">
          {/* TAB 1: Profile Details & Address Book */}
          {activeTab === 'profile' && (
            <div className="space-y-8">
              <ProfileDetailsForm
                profile={profile}
                onSaveDetails={handleSaveDetails}
              />

              <AddressBook
                addresses={profile?.addresses || []}
                onSaveAddresses={handleSaveAddresses}
              />

              {/* Security Privacy Callout */}
              <div className="p-4 rounded-2xl bg-wagh-teal/5 border border-wagh-teal/20 text-xs text-wagh-dark flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-wagh-teal shrink-0" />
                <span>
                  <strong>Data Privacy Guaranteed:</strong> Your profile data and address book are strictly protected by Firebase Security Rules (`request.auth.uid == userId`). No third party or unauthorized visitor can view or modify your data.
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: Order History */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              {loadingOrders ? (
                <p className="text-xs font-mono-tag text-wagh-muted py-8 text-center">Loading your order history...</p>
              ) : orders.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <Package className="w-10 h-10 text-wagh-muted mx-auto" />
                  <p className="text-lg font-semibold text-wagh-dark">No orders placed yet</p>
                  <p className="text-xs text-wagh-muted">Browse our collection of chargers, cables, and power banks.</p>
                  <button
                    onClick={() => navigate('/shop')}
                    className="mt-2 px-6 py-2.5 rounded-full bg-wagh-teal text-white text-xs font-bold shadow-md hover:bg-wagh-teal-dark transition-all"
                  >
                    Explore Shop
                  </button>
                </div>
              ) : (
                orders.map((order) => (
                  <div key={order._id} className="p-6 rounded-2xl border border-wagh-border space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-wagh-border pb-3 gap-2">
                      <div>
                        <span className="font-mono-tag font-bold text-wagh-teal text-sm">{order.orderId}</span>
                        <span className="text-xs text-wagh-muted block font-mono-tag">
                          Placed on {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 rounded-full bg-wagh-teal/10 text-wagh-teal text-xs font-mono-tag font-bold">
                          {order.orderStatus}
                        </span>
                        <span className="font-mono-tag font-extrabold text-wagh-dark">
                          ₹{order.total}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 text-xs">
                          <img src={item.image} alt={item.name} className="w-10 h-10 object-contain rounded bg-gray-50 border p-1" />
                          <div className="flex-1 truncate">
                            <span className="font-bold text-wagh-dark">{item.name}</span>
                            <span className="text-wagh-muted block">Qty: {item.qty} × ₹{item.price}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: Wishlist */}
          {activeTab === 'wishlist' && (
            <div>
              {wishlist.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <Heart className="w-10 h-10 text-wagh-muted mx-auto" />
                  <p className="text-base font-semibold text-wagh-dark">Your wishlist is empty</p>
                  <button
                    onClick={() => navigate('/shop')}
                    className="px-6 py-2.5 rounded-full bg-wagh-teal text-white text-xs font-bold"
                  >
                    Start Saving Items
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {wishlist.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
