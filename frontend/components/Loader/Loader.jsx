import React from 'react'

const Loader = () => {
  return (
    <div className='absolute inset-0 flex justify-center items-center h-screen bg-black bg-opacity-50 z-[1999]'>
      <div className="loader"></div>
    </div>
  );
}

export default Loader