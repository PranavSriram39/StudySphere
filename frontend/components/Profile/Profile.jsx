"use client";
import React, { useMemo, useState } from "react";
import { BsInfoCircle } from "react-icons/bs";
import { MdOutlineLeaderboard, MdOutlineRecentActors } from "react-icons/md";
import { GiProgression } from "react-icons/gi";
import { TbLogout } from "react-icons/tb";
import { motion } from "framer-motion";
import Info from "./Info";
import LeadInfo from "./LeadInfo";
import Schedule from "./Schedule";
import Progressbar from "./Progressbar";
import Image from "next/image";
import { Defaultpic } from "../Constants/imageContants";
import Logout from "./Logout";
import classNames from "classnames";
import { userDetailsStore } from "@/store/userStore";

const Profile = () => {
  const [active, setActive] = useState("Info");
  const userDetails = userDetailsStore((state) => state.userDetails);
  const menuData = useMemo(
    () => [
      {
        label: "Your Info",
        tab: "Info",
        Icon: BsInfoCircle,
      },
      {
        label: "Schedule",
        tab: "Schedule",
        Icon: MdOutlineRecentActors,
      },
      {
        label: "Progress Report",
        tab: "Progressbar",
        Icon: GiProgression,
      },
      {
        label: "Leader board",
        tab: "LeaderInfo",
        Icon: MdOutlineLeaderboard,
      },
      {
        label: "Logout",
        tab: "Logout",
        Icon: TbLogout,
      },
    ],
    []
  );
  return (
    <div className="flex flex-col">
      <div className="flex-[2]">
        <div className="border-4 border-slate-950 bg-cover bg-left bg-[url('../public/Assets/Images/profilebg.jpg')] h-52 w-full px-20 pt-24 lg:px-52 xl:py-28 rounded-b-xl flex">
          <div className="border-2 shadow-2xl w-48 h-48 flex rounded-full">
            <Image
              src={userDetails?.image}
              alt="Default Pic"
              width={150}
              height={150}
              className="w-full h-full rounded-full object-fill bg-center"
            />
          </div>
          <div className="hidden md:h-16 md:w-80 md:bg-gradient-to-r from-blue-400 to-violet-600 md:rounded-lg md:my-20 md:ml-24 md:flex md:justify-center md:items-center md:shadow-2xl">
            <p className="text-white text-2xl font-bold">
              Hey {userDetails?.name}
            </p>
          </div>
        </div>
      </div>
      <div className="flex flex-col lg:flex-row lg:py-24 py-32 lg:mx-40">
        <div className="flex lg:flex-col lg:w-48 flex-row lg:h-96 lg:pt-2 lg:justify-around mx-5 lg:items-start lg:mx-16 lg:border-r-gray-400 gap-4 lg:border-r-2 overflow-x-scroll lg:overflow-hidden scrollbar-none ">
          {menuData.map((item, index) => (
            <div
              key={index}
              className={classNames(
                active == item.tab &&
                  "lg:bg-gradient-to-r text-white lg:bg-transparent bg-gradient-to-r lg:rounded-none rounded-md",
                "hover:lg:text-white shrink-0 px-4 lg:w-11/12 hover:lg:bg-gradient-to-r from-blue-400 to-violet-600 py-3 flex lg:pl-3 justify-center lg:justify-start flex-row items-center lg:rounded-r-3xl lg:rounded-l-none gap-2 cursor-pointer "
              )}
              onClick={() => setActive(item.tab)}
            >
              <item.Icon className="w-5 h-5" />
              <p className="shrink-0 font-semibold">{item.label}</p>
            </div>
          ))}
          {/* <hr className="hidden lg:bg-gray-400 lg:h-[3px] lg:w-60" /> */}
        </div>
        <div className="lg:flex-1 flex h-96  mx-5 lg:ml-4 lg:mr-20 rounded-lg lg:mt-0 mt-6">
          {active === "Info" && (
            <motion.div
              initial={{ opacity: 0, y: -100 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-full w-full"
            >
              <Info />
            </motion.div>
          )}
          {active === "LeaderInfo" && (
            <motion.div
              initial={{ opacity: 0, y: -100 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-full w-full"
            >
              <LeadInfo />
            </motion.div>
          )}
          {active === "Schedule" && (
            <motion.div
              initial={{ opacity: 0, y: -100 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-full w-full"
            >
              <Schedule />
            </motion.div>
          )}
          {active === "Progressbar" && (
            <motion.div
              initial={{ opacity: 0, y: -100 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-full w-full"
            >
              <Progressbar />
            </motion.div>
          )}
          {active === "Logout" && (
            <motion.div className="h-full w-full">
              <Logout />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
