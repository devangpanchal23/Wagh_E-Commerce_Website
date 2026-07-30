import React, { useState } from 'react';
import { X, Mail, Phone, Lock, User, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './auth-modal.css';

export function LoginModal({ isOpen, onClose, onSuccess }) {
  const {
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    loginWithMicrosoft,
    loginWithApple,
    sendPhoneOtp,
    verifyPhoneOtp,
  } = useAuth();

  const [activeTab, setActiveTab] = useState('email'); // 'email' | 'phone'
  const [isSignUp, setIsSignUp] = useState(false);

  // Email form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  // Phone form state
  const [phoneNumber, setPhoneNumber] = useState('+91');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Status & Error handling
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSuccess = () => {
    setError('');
    setLoading(false);
    if (onSuccess) onSuccess();
    if (onClose) onClose();
  };

  // Handle Social Sign-In
  const handleSocialLogin = async (providerFn) => {
    setLoading(true);
    setError('');
    const result = await providerFn();
    setLoading(false);
    if (result.success) {
      handleSuccess();
    } else {
      setError(result.message || 'Authentication failed');
    }
  };

  // Handle Email Submit
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    let result;
    if (isSignUp) {
      result = await registerWithEmail(email, password, displayName);
    } else {
      result = await loginWithEmail(email, password);
    }

    setLoading(false);
    if (result.success) {
      handleSuccess();
    } else {
      setError(result.message || 'Action failed. Please try again.');
    }
  };

  // Handle Phone OTP Request
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Ensure phone number starts with +
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
    const result = await sendPhoneOtp(formattedPhone, 'recaptcha-container');

    setLoading(false);
    if (result.success) {
      setOtpSent(true);
    } else {
      setError(result.message || 'Failed to send OTP code.');
    }
  };

  // Handle Phone OTP Verification
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await verifyPhoneOtp(otp);

    setLoading(false);
    if (result.success) {
      handleSuccess();
    } else {
      setError(result.message || 'Invalid verification code.');
    }
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="font-editorial text-2xl font-bold text-wagh-dark">
              {isSignUp ? 'Create WAGH Account' : 'Welcome Back'}
            </h2>
            <p className="text-xs text-wagh-muted font-sans mt-0.5">
              Sign in to proceed to checkout and track your orders
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[85vh] overflow-y-auto">
          {/* Error Alert */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Social Auth Providers */}
          <div className="space-y-2.5">
            <button
              onClick={() => handleSocialLogin(loginWithGoogle)}
              disabled={loading}
              className="auth-provider-btn disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-wagh-teal border-t-transparent rounded-full animate-spin shrink-0" />
              ) : (
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>{loading ? 'Connecting to Google...' : 'Continue with Google'}</span>
            </button>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => handleSocialLogin(loginWithMicrosoft)}
                disabled={loading}
                className="auth-provider-btn"
              >
                <svg className="w-4 h-4" viewBox="0 0 23 23">
                  <path fill="#f35325" d="M1 1h10v10H1z" />
                  <path fill="#81bc06" d="M12 1h10v10H12z" />
                  <path fill="#05a6f0" d="M1 12h10v10H1z" />
                  <path fill="#ffba08" d="M12 12h10v10H12z" />
                </svg>
                <span>Microsoft</span>
              </button>

              <button
                onClick={() => handleSocialLogin(loginWithApple)}
                disabled={loading}
                className="auth-provider-btn"
              >
                <svg className="w-4 h-4 fill-current text-slate-800" viewBox="0 0 170 170">
                  <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.34.13-9.16-1.9-14.49-6.09-3.26-2.63-7.14-7.25-11.64-13.84-6.3-9.19-11.29-19.64-14.97-31.35-3.69-11.71-5.54-22.9-5.54-33.58 0-14.75 3.73-26.96 11.19-36.63 7.46-9.67 16.89-14.63 28.29-14.88 4.45 0 9.48 1.15 15.08 3.45 5.6 2.3 9.45 3.45 11.55 3.45 1.77 0 5.76-1.22 11.97-3.66 6.21-2.44 11.45-3.53 15.72-3.27 12.24.93 21.84 5.34 28.8 13.23-10.74 6.52-16.03 15.54-15.87 27.06.16 9.07 3.52 16.63 10.08 22.68 6.56 6.05 14.5 9.77 23.82 11.16-2.4 7.02-5.6 14.18-9.6 21.48zM119.22 30.1c0-7.07 2.52-13.9 7.57-20.48 5.05-6.58 11.56-10.51 19.53-11.79.16.94.24 1.77.24 2.49 0 6.94-2.58 13.78-7.75 20.52-5.17 6.74-11.68 10.77-19.53 12.09-.06-.83-.06-1.78-.06-2.83z" />
                </svg>
                <span>Apple</span>
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-gray-200 w-full" />
            <span className="bg-white px-3 text-xs text-wagh-muted font-mono-tag uppercase">
              Or continue with
            </span>
            <div className="border-t border-gray-200 w-full" />
          </div>

          {/* Auth Method Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => {
                setActiveTab('email');
                setError('');
              }}
              className={`auth-tab-button ${activeTab === 'email' ? 'active' : ''}`}
            >
              Email & Password
            </button>
            <button
              onClick={() => {
                setActiveTab('phone');
                setError('');
              }}
              className={`auth-tab-button ${activeTab === 'phone' ? 'active' : ''}`}
            >
              Phone (OTP)
            </button>
          </div>

          {/* TAB 1: EMAIL AUTH */}
          {activeTab === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              {isSignUp && (
                <div>
                  <label className="block text-xs font-bold text-wagh-dark mb-1">
                    Display Name (Username)
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="auth-input-field pl-9"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-wagh-dark mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="auth-input-field pl-9"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-wagh-dark mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="auth-input-field pl-9"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-wagh-teal text-white font-extrabold text-sm hover:bg-wagh-teal-dark transition-all duration-200 shadow-md flex items-center justify-center gap-2"
              >
                <span>{loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Log In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError('');
                  }}
                  className="text-xs text-wagh-teal font-semibold hover:underline"
                >
                  {isSignUp
                    ? 'Already have an account? Log in'
                    : "Don't have an account? Create one"}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: PHONE OTP AUTH */}
          {activeTab === 'phone' && (
            <div className="space-y-4">
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-wagh-dark mb-1">
                      Phone Number (E.164 Format)
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        required
                        placeholder="+919876543210"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="auth-input-field pl-9 font-mono-tag"
                      />
                    </div>
                    <p className="text-[11px] text-wagh-muted mt-1">
                      Include country code (e.g. +91 for India)
                    </p>
                  </div>

                  <div id="recaptcha-container" className="recaptcha-wrapper" />

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-wagh-teal text-white font-extrabold text-sm hover:bg-wagh-teal-dark transition-all duration-200 shadow-md flex items-center justify-center gap-2"
                  >
                    <span>{loading ? 'Sending Code...' : 'Send Verification Code'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-wagh-dark mb-1">
                      Enter 6-Digit OTP Code
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="auth-input-field text-center font-mono-tag text-lg tracking-widest"
                    />
                    <p className="text-[11px] text-wagh-muted mt-1 text-center">
                      Sent to {phoneNumber}
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-wagh-teal text-white font-extrabold text-sm hover:bg-wagh-teal-dark transition-all duration-200 shadow-md flex items-center justify-center gap-2"
                  >
                    <span>{loading ? 'Verifying...' : 'Verify & Sign In'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="text-xs text-wagh-muted hover:text-wagh-teal underline"
                    >
                      Change phone number
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          <div className="pt-2 text-center text-xs text-wagh-muted flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-wagh-teal" />
            <span>Secure authentication powered by Firebase</span>
          </div>
        </div>
      </div>
    </div>
  );
}
