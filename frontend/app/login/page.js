import LoginComponent from '@/components/auth/Login';
import React from 'react'
import { isLoggedIn } from '@/lib/isLoggedIn';

const Login = () => {
  isLoggedIn();
  return (
    <div className="h-screen landingHome flex bg-login bg-no-repeat bg-cover bg-left">
      <div className="flex-1 lg:flex hidden  "></div>
      <div className="flex-1 flex justify-center items-center">
        <LoginComponent />
      </div>
    </div>
  );
}

export default Login