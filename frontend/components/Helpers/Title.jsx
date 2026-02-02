import classNames from "classnames";
import React from "react";
import { twMerge } from "tailwind-merge";

const Title = ({ children, className }) => {
  return (
    <div
      className={twMerge(
        "text-xl font-extrabold pt-4 text-center",
        className
      )}
    >
      {children}
    </div>
  );
};

export default Title;
