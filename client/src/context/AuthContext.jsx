import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useUser, useClerk, useAuth as useClerkAuth } from '@clerk/react';
import { useToast } from './ToastContext';
import { fetchApi } from '../api';

const AuthContext = createContext();

const normalizeBirthdate = (value) => {
  if (!value) return '';
  const str = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const parsed = new Date(str);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().slice(0, 10);
};

const mapMongoProfile = (baseProfile, data = {}) => ({
  ...baseProfile,
  email: data.email || baseProfile.email,
  emailVerified: data.emailVerified !== undefined ? !!data.emailVerified : (baseProfile.emailVerified || false),
  emailVerifiedAt: data.emailVerifiedAt || null,
  displayName: data.name || baseProfile.displayName,
  name: data.name || baseProfile.displayName,
  phone: data.mobileNumber || data.phone || '',
  phoneNumber: data.mobileNumber || data.phone || '',
  mobileNumber: data.mobileNumber || data.phone || '',
  phoneVerified: data.phoneVerified !== undefined ? !!data.phoneVerified : (baseProfile.phoneVerified || false),
  birthdate: normalizeBirthdate(data.birthdate),
  age: data.age !== undefined && data.age !== null ? data.age : null,
  gender: data.gender || 'prefer_not_to_say',
  addresses: Array.isArray(data.addresses) ? data.addresses : [],
  profileLoaded: true,
});

export function AuthProvider({ children }) {
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();
  const { signOut: clerkSignOut, openSignIn, openSignUp } = useClerk();
  const { getToken } = useClerkAuth();
  const { addToast } = useToast();
  const [userProfile, setUserProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const profileRequestRef = useRef(0);
  const loadedUidRef = useRef(null);

  const buildBaseProfile = useCallback((clerk) => {
    const email = clerk.primaryEmailAddress?.emailAddress || '';
    const displayName =
      clerk.fullName ||
      clerk.firstName ||
      clerk.username ||
      email.split('@')[0] ||
      'WAGH Customer';

    return {
      uid: clerk.id,
      id: clerk.id,
      clerkId: clerk.id,
      email,
      displayName,
      phoneNumber: clerk.primaryPhoneNumber?.phoneNumber || '',
      photoURL: clerk.imageUrl || '',
      emailVerified: clerk.primaryEmailAddress?.verification?.status === 'verified',
      role: 'customer',
      profileLoaded: false,
    };
  }, []);

  const loadMongoProfile = useCallback(
    async (baseProfile, requestId) => {
      const res = await fetchApi('/auth/profile', { getToken });
      if (requestId !== profileRequestRef.current) return null;
      if (!res?.success || !res.data) return mapMongoProfile(baseProfile, {});

      return mapMongoProfile(baseProfile, res.data);
    },
    [getToken]
  );

  const refreshProfile = useCallback(async () => {
    if (!clerkUser) return { success: false };
    const baseProfile = buildBaseProfile(clerkUser);
    const requestId = ++profileRequestRef.current;

    localStorage.setItem('wagh_clerk_uid', baseProfile.uid);
    localStorage.setItem('wagh_clerk_email', baseProfile.email);
    localStorage.setItem('wagh_clerk_name', baseProfile.displayName);

    try {
      const profile = await loadMongoProfile(baseProfile, requestId);
      if (profile && requestId === profileRequestRef.current) {
        setUserProfile(profile);
        setProfileError(null);
        loadedUidRef.current = baseProfile.uid;
      }
      return { success: true, data: profile };
    } catch (err) {
      if (requestId === profileRequestRef.current) {
        setProfileError(err.message || 'Failed to load your profile data.');
      }
      return { success: false, message: err.message };
    }
  }, [clerkUser, buildBaseProfile, loadMongoProfile]);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn || !clerkUser) {
      profileRequestRef.current += 1;
      loadedUidRef.current = null;
      setUserProfile(null);
      setProfileLoading(false);
      setProfileError(null);
      localStorage.removeItem('wagh_token');
      localStorage.removeItem('wagh_clerk_uid');
      localStorage.removeItem('wagh_clerk_email');
      localStorage.removeItem('wagh_clerk_name');
      return;
    }

    const uid = clerkUser.id;
    const baseProfile = buildBaseProfile(clerkUser);
    const requestId = ++profileRequestRef.current;
    const isSameUser = loadedUidRef.current === uid;

    localStorage.setItem('wagh_clerk_uid', uid);
    localStorage.setItem('wagh_clerk_email', baseProfile.email);
    localStorage.setItem('wagh_clerk_name', baseProfile.displayName);

    if (!isSameUser) {
      setUserProfile(baseProfile);
    }
    setProfileLoading(true);
    setProfileError(null);

    (async () => {
      try {
        const token = await getToken();
        if (token && requestId === profileRequestRef.current) {
          localStorage.setItem('wagh_token', token);
        }

        const profile = await loadMongoProfile(baseProfile, requestId);
        if (profile && requestId === profileRequestRef.current) {
          setUserProfile(profile);
          loadedUidRef.current = uid;
        }
      } catch (err) {
        console.warn('Backend user profile fetch notice:', err.message);
        if (requestId === profileRequestRef.current) {
          setProfileError(err.message || 'Failed to load your profile data.');
        }
      } finally {
        if (requestId === profileRequestRef.current) {
          setProfileLoading(false);
        }
      }
    })();
  }, [isLoaded, isSignedIn, clerkUser?.id, buildBaseProfile, getToken, loadMongoProfile]);

  const logout = async () => {
    try {
      await clerkSignOut();
      localStorage.removeItem('wagh_token');
      localStorage.removeItem('wagh_clerk_uid');
      localStorage.removeItem('wagh_clerk_email');
      localStorage.removeItem('wagh_clerk_name');
      loadedUidRef.current = null;
      setUserProfile(null);
      addToast('Logged out successfully', 'info');
    } catch (err) {
      addToast('Error logging out', 'error');
    }
  };

  const updateUserProfile = async (updatedData) => {
    if (!clerkUser) return { success: false, message: 'Not authenticated' };
    try {
      if (updatedData.displayName || updatedData.name) {
        const nameStr = updatedData.displayName || updatedData.name;
        const parts = nameStr.trim().split(' ');
        const firstName = parts[0] || '';
        const lastName = parts.slice(1).join(' ') || '';
        await clerkUser.update({ firstName, lastName }).catch(() => {});
      }

      const res = await fetchApi('/auth/profile', {
        method: 'PUT',
        getToken,
        body: JSON.stringify({
          name: updatedData.displayName || updatedData.name,
          email: updatedData.email,
          mobileNumber: updatedData.phone || updatedData.mobileNumber || updatedData.phoneNumber,
          birthdate: updatedData.birthdate,
          age: updatedData.age,
          gender: updatedData.gender,
          addresses: updatedData.addresses,
          profileImageUrl: updatedData.profileImageUrl,
        }),
      });

      if (res && res.success && res.data) {
        setUserProfile((prev) => mapMongoProfile({ ...prev, ...updatedData }, res.data));
      }

      return { success: true, data: res?.data };
    } catch (err) {
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

  const sendPhoneOtp = async (phoneNum) => {
    try {
      const res = await fetchApi('/auth/phone/send-otp', {
        method: 'POST',
        getToken,
        body: JSON.stringify({ phone: phoneNum }),
      });
      return res;
    } catch (err) {
      return { success: false, message: err.message || 'Failed to send OTP' };
    }
  };

  const verifyPhoneOtp = async (otpCode) => {
    try {
      const res = await fetchApi('/auth/phone/verify-otp', {
        method: 'POST',
        getToken,
        body: JSON.stringify({ otp: otpCode }),
      });
      if (res && res.success) {
        setUserProfile((prev) => ({
          ...prev,
          phoneVerified: true,
        }));
      }
      return res;
    } catch (err) {
      return { success: false, message: err.message || 'Failed to verify OTP' };
    }
  };

  const sendEmailOtp = async (targetEmail) => {
    try {
      const res = await fetchApi('/auth/email/send-otp', {
        method: 'POST',
        getToken,
        body: JSON.stringify({ email: targetEmail }),
      });
      return res;
    } catch (err) {
      return { success: false, message: err.message || 'Failed to send OTP email' };
    }
  };

  const verifyEmailOtp = async (otpCode) => {
    try {
      const res = await fetchApi('/auth/email/verify-otp', {
        method: 'POST',
        getToken,
        body: JSON.stringify({ otp: otpCode }),
      });
      if (res && res.success) {
        setUserProfile((prev) => ({
          ...prev,
          emailVerified: true,
          emailVerifiedAt: res.data?.emailVerifiedAt || new Date().toISOString(),
        }));
      }
      return res;
    } catch (err) {
      return { success: false, message: err.message || 'Failed to verify email OTP' };
    }
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
        profileLoading,
        profileError,
        refreshProfile,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        loginWithMicrosoft,
        loginWithApple,
        sendPhoneOtp,
        verifyPhoneOtp,
        sendEmailOtp,
        verifyEmailOtp,
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
