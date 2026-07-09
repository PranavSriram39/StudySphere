"use client"
import React, { useEffect } from 'react'
import Loader from './Loader'
import { useLoader } from '@/store/loaderStore'

const LoaderContainer = ({children}) => {
  const isLoading = useLoader((state) => state.isLoading);

  // Suppress noisy third-party library warnings that cannot be fixed from userland.
  // react-scroll-to-bottom uses deprecated defaultProps on function components.
  // react-lottie uses the deprecated componentWillUpdate lifecycle.
  // Both are dev-only warnings and do NOT affect production or runtime behaviour.
  useEffect(() => {
    const originalError = console.error;
    console.error = (...args) => {
      const msg = args[0];
      if (typeof msg === 'string') {
        if (
          msg.includes('Support for defaultProps will be removed from function components') ||
          msg.includes('componentWillUpdate has been renamed')
        ) {
          return; // Suppress
        }
      }
      originalError(...args);
    };
    return () => {
      console.error = originalError;
    };
  }, []);

  return (
    <div>
        {children}
        {isLoading && <Loader/>}
    </div>
  )
}

export default LoaderContainer