"use client"
import React from 'react'
import Loader from './Loader'
import { useLoader } from '@/store/loaderStore'

const LoaderContainer = ({children}) => {
    const isLoading = useLoader((state) => state.isLoading);
  return (
    <div>
        {children}
        {isLoading && <Loader/>}
    </div>
  )
}

export default LoaderContainer