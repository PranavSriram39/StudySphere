import RegisterComponent from "@/components/auth/Register";
import { isLoggedIn } from "@/lib/isLoggedIn";
import React from "react";

const Register = () => {
  isLoggedIn();
  return (
    <div className="h-screen landingHome flex bg-register bg-no-repeat md:bg-left bg-right bg-cover ">
      <div className="flex-1 flex justify-center items-center">
        <RegisterComponent />
      </div>
      <div className="flex-1 lg:flex hidden">
      </div>
    </div>
  );
};

export default Register;
