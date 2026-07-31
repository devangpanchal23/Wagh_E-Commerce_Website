import React from 'react';
import { SignIn } from '@clerk/react';

export default function SignInPage() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center p-6 bg-wagh-bg">
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        fallbackRedirectUrl="/"
      />
    </div>
  );
}
