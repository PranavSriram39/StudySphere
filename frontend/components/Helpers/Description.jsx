import classNames from 'classnames'
import React from 'react'

const Description = ({className,children}) => {
  return (
    <div
      className={classNames(
        className,
        "text-xs text-[#838186] text-center mb-6"
      )}
    >
      {children}
    </div>
  );
}

export default Description