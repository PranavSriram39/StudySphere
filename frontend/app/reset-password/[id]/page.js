import ResetPassword from "@/components/auth/ResetPassword";
import { isLoggedIn } from "@/lib/isLoggedIn";
import React from "react";

const page = () => {
  isLoggedIn();
  return (
    <div className="flex landingHome justify-center items-center">
      <ResetPassword />
    </div>
  );
};

export default page;
