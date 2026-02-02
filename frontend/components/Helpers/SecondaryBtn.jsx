import classNames from 'classnames'
import React from 'react'

const SecondaryBtn = ({className="",children,invert}) => {
  return (
    <button className={classNames("bg-[#94f9e5] px-6 py-2 transition-all duration-200 hover:bg-[#a9f7e9]",className)}>
      {children}
    </button>
  )
}

export default SecondaryBtn
