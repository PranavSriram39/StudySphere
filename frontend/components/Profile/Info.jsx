import { userDetailsStore } from "@/store/userStore";
import React from "react";

const Info = () => {
  const userDetails = userDetailsStore((state) => state.userDetails);
  return (
    <div className="bg-gray-100 h-full w-full rounded-lg flex flex-col justify-around lg:px-10 px-5 lg:text-base font-bold">
      <div className="flex flex-1 border-b-2 border-gray-300 items-center">
        <div className="lg:w-1/5 w-1/2">Name</div>
        <div className="text-blue-500 w-1/2">{userDetails?.name}</div>
      </div>
      <div className="flex flex-1 border-b-2 border-gray-300 items-center">
        <div className="lg:w-1/5 w-1/2">Phone</div>
        <div className="text-blue-500 w-1/2">{userDetails?.mobile_number}</div>
      </div>
      <div className="flex flex-1 border-b-2 border-gray-300 items-center">
        <div className="lg:w-1/5 w-1/2">E-mail</div>
        <div className="text-blue-500 w-1/2 lg:text-lg text-sm break-all">
          {userDetails?.email}
        </div>
      </div>
      <div className="flex flex-1 items-center">
        <div className="lg:w-1/5 w-1/2">Organization</div>
        <div className="text-blue-500 w-1/2 uppercase">
          {userDetails?.org_joined}
        </div>
      </div>
    </div>
  );
};

export default Info;
