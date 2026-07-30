import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { syncCartOnLogin, saveUserCartToFirestore } from '../utils/cartSync';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const local = localStorage.getItem('wagh_cart');
      return local ? JSON.parse(local) : [];
    } catch {
      return [];
    }
  });

  const { user } = useAuth();
  const { addToast } = useToast();

  // Save cart to localStorage whenever cartItems change
  useEffect(() => {
    try {
      localStorage.setItem('wagh_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.error('Error saving cart to localStorage:', e);
    }
  }, [cartItems]);

  // Sync guest cart with Firestore on user login
  useEffect(() => {
    if (user?.uid) {
      const performSync = async () => {
        const mergedCart = await syncCartOnLogin(user, cartItems);
        setCartItems(mergedCart);
      };
      performSync();
    }
  }, [user?.uid]);

  // Helper to update state & sync to Firestore if user logged in
  const updateCartAndPersist = (newCartItems) => {
    setCartItems(newCartItems);
    if (user?.uid) {
      saveUserCartToFirestore(user.uid, newCartItems);
    }
  };

  const addToCart = (product, qty = 1) => {
    const pId = product._id || product.id || product;
    let updated;

    setCartItems((prev) => {
      const index = prev.findIndex((item) => {
        const itemId = item.product?._id || item.product?.id || item.product || item.productId;
        return itemId === pId;
      });

      if (index > -1) {
        updated = [...prev];
        updated[index] = {
          ...updated[index],
          qty: updated[index].qty + qty,
        };
      } else {
        updated = [...prev, { product, qty }];
      }

      if (user?.uid) {
        saveUserCartToFirestore(user.uid, updated);
      }
      return updated;
    });

    addToast(`Added "${product.name || 'item'}" to cart`, 'success');
  };

  const updateQty = (productId, newQty) => {
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }

    setCartItems((prev) => {
      const updated = prev.map((item) => {
        const pId = item.product?._id || item.product?.id || item.product || item.productId;
        if (pId === productId) {
          return { ...item, qty: newQty };
        }
        return item;
      });

      if (user?.uid) {
        saveUserCartToFirestore(user.uid, updated);
      }
      return updated;
    });
  };

  const removeFromCart = (productId) => {
    setCartItems((prev) => {
      const updated = prev.filter((item) => {
        const pId = item.product?._id || item.product?.id || item.product || item.productId;
        return pId !== productId;
      });

      if (user?.uid) {
        saveUserCartToFirestore(user.uid, updated);
      }
      return updated;
    });
    addToast('Item removed from cart', 'info');
  };

  const clearCart = () => {
    setCartItems([]);
    if (user?.uid) {
      saveUserCartToFirestore(user.uid, []);
    }
  };

  // Computations
  const totalItemCount = cartItems.reduce((sum, item) => sum + (item.qty || 1), 0);

  const subtotal = cartItems.reduce((sum, item) => {
    const price = item.product?.price || item.price || 0;
    return sum + price * (item.qty || 1);
  }, 0);

  // Free shipping on orders over ₹499
  const shippingFee = subtotal >= 499 || subtotal === 0 ? 0 : 49;
  const grandTotal = subtotal + shippingFee;

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        updateQty,
        removeFromCart,
        clearCart,
        totalItemCount,
        subtotal,
        shippingFee,
        grandTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
