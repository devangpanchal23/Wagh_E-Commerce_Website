import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser, useClerk, useAuth as useClerkAuth } from '@clerk/react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useToast } from './ToastContext';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();
  const { signOut: clerkSignOut, openSignIn, openSignUp } = useClerk();
  const { getToken } = useClerkAuth();
  const { addToast } = useToast();
  const [userProfile, setUserProfile] = useState(null);

  // Sync Clerk state and Firestore user document
  useEffect(() => {
    if (isLoaded && isSignedIn && clerkUser) {
      const email = clerkUser.primaryEmailAddress?.emailAddress || '';
      const displayName =
        clerkUser.fullName ||
        clerkUser.firstName ||
        clerkUser.username ||
        email.split('@')[0] ||
        'WAGH Customer';
      const role = (clerkUser.publicMetadata && clerkUser.publicMetadata.role) || 'customer';
      const uid = clerkUser.id;

      const profile = {
        uid,
        id: uid,
        email,
        displayName,
        phoneNumber: clerkUser.primaryPhoneNumber?.phoneNumber || '',
        photoURL: clerkUser.imageUrl || '',
        emailVerified: clerkUser.primaryEmailAddress?.verification?.status === 'verified',
        role,
      };
      setUserProfile(profile);

      // Non-blocking Firestore user profile sync for compatibility with Firestore features
      const userRef = doc(db, 'users', uid);
      setDoc(
        userRef,
        {
          uid,
          email,
          displayName,
          role,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      ).catch((err) => console.error('Error syncing Firestore profile:', err));
    } else {
      setUserProfile(null);
    }
  }, [isLoaded, isSignedIn, clerkUser]);

  const logout = async () => {
    try {
      await clerkSignOut();
      localStorage.removeItem('wagh_token');
      setUserProfile(null);
      addToast('Logged out successfully', 'info');
    } catch (err) {
      addToast('Error logging out', 'error');
    }
  };

  const updateUserProfile = async (updatedData) => {
    if (!clerkUser) return { success: false, message: 'Not authenticated' };
    try {
      if (updatedData.displayName) {
        const parts = updatedData.displayName.trim().split(' ');
        const firstName = parts[0] || '';
        const lastName = parts.slice(1).join(' ') || '';
        await clerkUser.update({ firstName, lastName });
      }
      const uid = clerkUser.id;
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, { ...updatedData, updatedAt: new Date().toISOString() }, { merge: true });

      setUserProfile((prev) => ({ ...prev, ...updatedData }));
      addToast('Profile updated successfully', 'success');
      return { success: true };
    } catch (err) {
      addToast(err.message || 'Profile update failed', 'error');
      return { success: false, message: err.message };
    }
  };

  const loginWithEmail = () => {
    openSignIn();
    return Promise.resolve({ success: true });
  };

  const registerWithEmail = () => {
    openSignUp();
    return Promise.resolve({ success: true });
  };

  const loginWithGoogle = () => {
    openSignIn();
    return Promise.resolve({ success: true });
  };

  const loginWithMicrosoft = () => {
    openSignIn();
    return Promise.resolve({ success: true });
  };

  const loginWithApple = () => {
    openSignIn();
    return Promise.resolve({ success: true });
  };

  const sendPhoneOtp = () => {
    openSignIn();
    return Promise.resolve({ success: true });
  };

  const verifyPhoneOtp = () => {
    openSignIn();
    return Promise.resolve({ success: true });
  };

  const resendEmailVerification = () => {
    addToast('Verification email can be managed through Clerk account settings.', 'info');
  };

  return (
    <AuthContext.Provider
      value={{
        user: userProfile,
        role: userProfile?.role || 'customer',
        isAuthenticated: !!userProfile,
        isAdmin: userProfile?.role === 'admin',
        loading: !isLoaded,
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
        getToken,
        clerkUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
