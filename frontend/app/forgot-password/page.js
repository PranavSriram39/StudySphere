import ForgotPassword from '@/components/auth/ForgotPassword'
import { isLoggedIn } from '@/lib/isLoggedIn';
import React from 'react'

const page = () => {
  isLoggedIn();
  return (
    <div className="flex landingHome justify-center items-center">
      <ForgotPassword />
    </div>
  );
}

export default page