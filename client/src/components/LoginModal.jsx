import React from 'react';
import { X, ShieldCheck } from 'lucide-react';
import { Show, SignIn, UserButton } from '@clerk/react';
import './auth-modal.css';

export function LoginModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div
        className="auth-modal-container relative flex flex-col items-center justify-center p-6 bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors z-10"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <Show when="signed-out">
          <div className="w-full flex flex-col items-center">
            <SignIn
              routing="hash"
              signUpUrl="/sign-up"
              fallbackRedirectUrl="/"
            />
          </div>
        </Show>

        <Show when="signed-in">
          <div className="w-full flex flex-col items-center text-center p-6 space-y-4">
            <h3 className="font-editorial text-xl font-bold text-wagh-dark">You are signed in</h3>
            <UserButton showName />
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2 bg-wagh-teal text-white font-bold rounded-xl hover:bg-wagh-teal-dark transition-colors text-sm"
            >
              Continue to Shop
            </button>
          </div>
        </Show>

        <div className="mt-4 pt-2 text-center text-xs text-wagh-muted flex items-center justify-center gap-1.5 border-t border-gray-100 w-full">
          <ShieldCheck className="w-4 h-4 text-wagh-teal" />
          <span>Secure authentication powered by Clerk</span>
        </div>
      </div>
    </div>
  );
}

export default LoginModal;
