"use client";
import React from "react";
import {  motion } from "framer-motion";

const RightContainer = ({ children }) => {
  return (
      <motion.div
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, type: "spring" }}
        exit={{ opacity: 0, x: 100, type: "spring" }}
        className="w-full lg:w-[280px] bg-white h-screen z-[999] shadow-xl"
      >
        {children}
      </motion.div>
  );
};

export default RightContainer;
