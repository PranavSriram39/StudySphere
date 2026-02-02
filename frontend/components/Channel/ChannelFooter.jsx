import React from "react";
import { MdOutlineLogout } from "react-icons/md";

const ChannelFooter = () => {
  return (
    <div className="text-sm">
      <div className="flex items-center gap-4 lg:cursor-pointer p-4">
        <MdOutlineLogout className="text-red-600 w-5 h-5" />
        <p className="text-red-600">Leave Channel</p>
      </div>
      <div className="flex items-center gap-4 lg:cursor-pointer p-4">
        <MdOutlineLogout className="text-red-600 w-5 h-5" />
        <p className="text-red-600">Leave Organization</p>
      </div>
    </div>
  );
};

export default ChannelFooter;
