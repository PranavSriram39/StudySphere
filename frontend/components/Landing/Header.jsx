"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { FaBars, FaTimes } from "react-icons/fa";
import { Link } from "react-scroll";
import classNames from "classnames";
import PrimaryBtn from "../Helpers/PrimaryBtn";
import { motion } from "framer-motion";
import MainLogo from "../Logo/MainLogo";

const Header = ({ activeSection }) => {
  const [clicked, setClicked] = useState("Home");
  const navRef = useRef();
  const navBarValues = useMemo(
    () => [
      {
        label: "Home",
        link: "/Home",
      },
      {
        label: "About",
        link: "About",
      },
      {
        label: "Contact",
        link: "Contact",
      },
    ],
    []
  );

  const showNavbar = () => {
    navRef.current.classList.toggle("translate-y-0");
  };

  useEffect(() => {
    setClicked(activeSection);
  }, [activeSection]);

  return (
    <motion.header
      className="flex sticky top-0 z-[999] items-center w-screen lg:px-32 justify-between py-2 h-[80px] lg:h-auto  bg-main"
      initial={{ opacity: 0, y: -100 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <MainLogo />
        <nav
          ref={navRef}
          className="fixed top-0 lg:h-auto h-screen w-screen lg:w-auto text-[20px] bg-[rgba(177,145,245,0.9)] lg:bg-transparent flex items-center justify-center flex-col gap-6 transition duration-[1s] -translate-y-[100vh] lg:translate-y-0 lg:relative lg:flex-row lg:justify-center"
        >
          {navBarValues.map((item, index) => (
            <Link
              activeClass="active"
              spy={true}
              smooth={true}
              offset={-80}
              duration={500}
              to={item.link}
              className={classNames(
                'mx-[2rem] lg:cursor-pointer relative before:content-[""] before:absolute before:left-0 before:bottom-0 before:w-full before:bg-black before:scale-x-0 before:origin-center before:transform before:duration-[0.3s] before:ease-in-out before:hover:scale-x-[1]',
                activeSection == item?.link || item?.label == clicked
                  ? "border-b-2 transition-all"
                  : "before:h-[2px]"
              )}
              key={index}
              onClick={() => {
                setClicked(item?.label);
                showNavbar(false);
              }}
            >
              {item?.label}
            </Link>
          ))}

          <div
            className="absolute top-8 right-8  lg:p-[5px] lg:hidden"
            onClick={showNavbar}
          >
            <FaTimes />
          </div>
          <div className="hidden lg:flex gap-4 items-center">
            <PrimaryBtn label="Login" invert link="/login" className="text-sm" />
            <PrimaryBtn label="Sign Up" link="/register" className="text-sm" />
          </div>
        </nav>
      <div className="p-5 lg:hidden" onClick={showNavbar}>
        <FaBars />
      </div>
    </motion.header>
  );
};

export default Header;
