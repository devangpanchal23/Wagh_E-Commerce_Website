import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Normalizes a product identifier from item object or string
 */
function getProductId(item) {
  if (!item) return null;
  if (typeof item.product === 'string') return item.product;
  if (item.product && item.product._id) return item.product._id;
  if (item.product && item.product.id) return item.product.id;
  if (item.productId) return item.productId;
  if (item._id) return item._id;
  if (item.id) return item.id;
  return null;
}

/**
 * Merges guest cart items with remote user cart items in Firestore.
 * Ensures no duplicate items and aggregates quantities.
 */
export function mergeCartArrays(guestItems = [], userItems = []) {
  const mergedMap = new Map();

  // Helper to add item to map
  const processItem = (item) => {
    const pId = getProductId(item);
    if (!pId) return;

    if (mergedMap.has(pId)) {
      const existing = mergedMap.get(pId);
      mergedMap.set(pId, {
        ...existing,
        qty: (existing.qty || 1) + (item.qty || 1),
      });
    } else {
      mergedMap.set(pId, {
        product: item.product || item,
        qty: item.qty || 1,
        price: item.price || item.product?.price || 0,
      });
    }
  };

  // Add remote items first, then overlay guest items
  userItems.forEach(processItem);
  guestItems.forEach(processItem);

  return Array.from(mergedMap.values());
}

/**
 * Fetches user's cart from Firestore
 */
export async function getUserCartFromFirestore(uid) {
  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (snap.exists() && snap.data().cart) {
      return snap.data().cart;
    }
  } catch (error) {
    console.error('Error fetching cart from Firestore:', error);
  }
  return [];
}

/**
 * Saves current cart to Firestore for authenticated user
 */
export async function saveUserCartToFirestore(uid, cartItems) {
  if (!uid) return;
  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, { cart: cartItems, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (error) {
    console.error('Error saving cart to Firestore:', error);
  }
}

/**
 * Main sync function called when user completes authentication.
 * Merges guest cart (localStorage) with user's Firestore cart,
 * writes back to Firestore and localStorage, and returns the merged cart.
 */
export async function syncCartOnLogin(user, guestCartItems = []) {
  if (!user || !user.uid) return guestCartItems;

  try {
    const remoteCart = await getUserCartFromFirestore(user.uid);
    const mergedCart = mergeCartArrays(guestCartItems, remoteCart);

    // Save merged cart to Firestore and localStorage
    await saveUserCartToFirestore(user.uid, mergedCart);
    localStorage.setItem('wagh_cart', JSON.stringify(mergedCart));

    return mergedCart;
  } catch (error) {
    console.error('Error syncing cart on login:', error);
    return guestCartItems;
  }
}
