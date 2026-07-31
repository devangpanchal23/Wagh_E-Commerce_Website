import React from 'react';
import { SignUp } from '@clerk/react';

export default function SignUpPage() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center p-6 bg-wagh-bg">
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        fallbackRedirectUrl="/"
      />
    </div>
  );
}
