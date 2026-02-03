import React from "react";
import MainLogo from "../Logo/MainLogo";
import { MainLabel } from "../Constants/labelConstant";

const Footer = () => {
  return (
    <div
      id="Contact"
      className=" bg-gradient-to-r from-purple-700  to-blue-500 grid gap-8 place-content-center place-items-center py-14"
    >
      <div className="flex flex-col md:flex-row  gap-4 justify-center items-center">
        <MainLogo className="text-white justify-start" />
        <div className="hidden md:block border-white border-l-2 h-10" />
        <p className="text-orange-200 text-lg md:text-xl font-semibold">
          Virtual Group Study Platform
        </p>
      </div>
      <p className="text-orange-200 md:text-xl font-semibold">
        Made by students for the students
      </p>
      <p className="text-white">&copy; 2026 {MainLabel} Inc.</p>
    </div>
  );
};

export default Footer;
