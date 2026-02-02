import React from 'react'
import Header from '../Landing/Header'

const ParentLayout = ({activeSection,children}) => {
  return (
    <div>
      <Header activeSection={activeSection}/>
      {children}
    </div>
  )
}

export default ParentLayout
