import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Show } from '@clerk/react';
import { useAuth } from '../context/AuthContext';
import { Zap } from 'lucide-react';

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-wagh-teal border-t-transparent animate-spin flex items-center justify-center">
          <Zap className="w-5 h-5 text-wagh-gold animate-bounce" />
        </div>
        <p className="font-mono-tag text-xs text-wagh-muted uppercase tracking-wider">
          Verifying WAGH Account Security...
        </p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" state={{ from: location, openLogin: true }} replace />;
  }

  return <Show when="signed-in">{children}</Show>;
}

export default ProtectedRoute;
