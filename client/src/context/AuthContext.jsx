import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  microsoftProvider,
  appleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  updateProfile as firebaseUpdateProfile,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from '../firebase';
import { useToast } from './ToastContext';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  // Helper to ensure user document exists in Firestore (non-blocking merge)
  const syncFirestoreUserProfile = async (firebaseUser, extraData = {}) => {
    if (!firebaseUser) return null;
    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      const profileData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: extraData.displayName || firebaseUser.displayName || '',
        phoneNumber: firebaseUser.phoneNumber || '',
        role: 'customer',
        updatedAt: new Date().toISOString(),
        ...extraData,
      };

      await setDoc(userRef, profileData, { merge: true });
      return profileData;
    } catch (err) {
      console.error('Error syncing Firestore user profile:', err);
      return null;
    }
  };

  // Firebase auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser((prev) => ({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || 'WAGH Customer',
          phoneNumber: firebaseUser.phoneNumber,
          emailVerified: firebaseUser.emailVerified,
          photoURL: firebaseUser.photoURL,
          role: 'customer',
          ...(prev || {}),
        }));

        // Fire profile sync in background
        syncFirestoreUserProfile(firebaseUser).then((profileData) => {
          if (profileData) {
            setUser((prev) => ({ ...prev, ...profileData }));
          }
        }).catch((err) => console.error('Background profile sync error:', err));
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Email + Password Login
  const loginWithEmail = async (email, password) => {
    try {
      const res = await signInWithEmailAndPassword(auth, email, password);
      syncFirestoreUserProfile(res.user).catch((e) => console.error(e));
      addToast(`Welcome back, ${res.user.displayName || res.user.email}!`, 'success');
      return { success: true, user: res.user };
    } catch (err) {
      addToast(err.message || 'Login failed', 'error');
      return { success: false, message: err.message };
    }
  };

  // Email + Password Registration
  const registerWithEmail = async (email, password, displayName = '') => {
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName && auth.currentUser) {
        firebaseUpdateProfile(auth.currentUser, { displayName }).catch((e) => console.error(e));
      }

      sendEmailVerification(res.user).then(() => {
        addToast('Verification email sent! Please check your inbox.', 'info');
      }).catch((verr) => console.error('Email verification error:', verr));

      syncFirestoreUserProfile(res.user, { displayName }).catch((e) => console.error(e));
      addToast(`Account created! Welcome to WAGH store.`, 'success');
      return { success: true, user: res.user };
    } catch (err) {
      addToast(err.message || 'Registration failed', 'error');
      return { success: false, message: err.message };
    }
  };

  // Google OAuth Login (Instant response, non-blocking background sync)
  const loginWithGoogle = async () => {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      setUser((prev) => ({
        uid: res.user.uid,
        email: res.user.email,
        displayName: res.user.displayName || 'WAGH Customer',
        phoneNumber: res.user.phoneNumber,
        emailVerified: res.user.emailVerified,
        photoURL: res.user.photoURL,
        role: 'customer',
        ...(prev || {}),
      }));

      // Fire Firestore document sync in background asynchronously
      syncFirestoreUserProfile(res.user).catch((err) =>
        console.error('Background user doc sync failed:', err)
      );

      addToast(`Logged in with Google as ${res.user.displayName || res.user.email}`, 'success');
      return { success: true, user: res.user };
    } catch (err) {
      console.error('Google sign-in error:', err.code, err.message);
      let errorMsg = err.message || 'Google sign in failed';
      if (err.code === 'auth/popup-blocked') {
        errorMsg = 'Pop-up blocked by browser. Please allow pop-ups for this site and try again.';
      } else if (err.code === 'auth/popup-closed-by-user') {
        errorMsg = 'Sign-in pop-up was closed before completion.';
      }
      addToast(errorMsg, 'error');
      return { success: false, message: errorMsg, code: err.code };
    }
  };

  // Microsoft OAuth Login
  const loginWithMicrosoft = async () => {
    try {
      const res = await signInWithPopup(auth, microsoftProvider);
      syncFirestoreUserProfile(res.user).catch((e) => console.error(e));
      addToast(`Logged in with Microsoft as ${res.user.displayName || res.user.email}`, 'success');
      return { success: true, user: res.user };
    } catch (err) {
      addToast(err.message || 'Microsoft sign in failed', 'error');
      return { success: false, message: err.message };
    }
  };

  // Apple OAuth Login
  const loginWithApple = async () => {
    try {
      const res = await signInWithPopup(auth, appleProvider);
      syncFirestoreUserProfile(res.user).catch((e) => console.error(e));
      addToast(`Logged in with Apple as ${res.user.displayName || res.user.email}`, 'success');
      return { success: true, user: res.user };
    } catch (err) {
      addToast(err.message || 'Apple sign in failed', 'error');
      return { success: false, message: err.message };
    }
  };

  // Phone OTP Flow - Step 1: Send OTP
  const setupRecaptcha = (containerId = 'recaptcha-container') => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        size: 'invisible',
        callback: () => {},
      });
    }
    return window.recaptchaVerifier;
  };

  const sendPhoneOtp = async (phoneNumber, containerId = 'recaptcha-container') => {
    try {
      const appVerifier = setupRecaptcha(containerId);
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      window.confirmationResult = confirmationResult;
      addToast('OTP sent to your phone number!', 'success');
      return { success: true, confirmationResult };
    } catch (err) {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
      addToast(err.message || 'Failed to send OTP', 'error');
      return { success: false, message: err.message };
    }
  };

  // Phone OTP Flow - Step 2: Confirm OTP
  const verifyPhoneOtp = async (otp) => {
    try {
      if (!window.confirmationResult) {
        throw new Error('No pending OTP request. Please request OTP again.');
      }
      const res = await window.confirmationResult.confirm(otp);
      await syncFirestoreUserProfile(res.user);
      addToast('Phone number verified successfully!', 'success');
      return { success: true, user: res.user };
    } catch (err) {
      addToast(err.message || 'Invalid OTP', 'error');
      return { success: false, message: err.message };
    }
  };

  // Logout
  const logout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('wagh_token');
      setUser(null);
      addToast('Logged out successfully', 'info');
    } catch (err) {
      addToast('Error logging out', 'error');
    }
  };

  // Resend Email Verification link
  const resendEmailVerification = async () => {
    if (auth.currentUser) {
      try {
        await sendEmailVerification(auth.currentUser);
        addToast('Verification link sent to your email address.', 'success');
      } catch (err) {
        addToast(err.message || 'Failed to send verification email.', 'error');
      }
    }
  };

  // Update Profile document in Firestore and Firebase Auth
  const updateUserProfile = async (updatedData) => {
    if (!user || !user.uid) return { success: false, message: 'Not authenticated' };
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { ...updatedData, updatedAt: new Date().toISOString() }, { merge: true });

      if (updatedData.displayName && auth.currentUser) {
        await firebaseUpdateProfile(auth.currentUser, { displayName: updatedData.displayName });
      }

      setUser((prev) => ({ ...prev, ...updatedData }));
      addToast('Profile updated successfully', 'success');
      return { success: true };
    } catch (err) {
      addToast(err.message || 'Profile update failed', 'error');
      return { success: false, message: err.message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'customer',
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        loading,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        loginWithMicrosoft,
        loginWithApple,
        sendPhoneOtp,
        verifyPhoneOtp,
        logout,
        resendEmailVerification,
        updateUserProfile,
        login: loginWithEmail,
        register: registerWithEmail,
        updateProfile: updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
