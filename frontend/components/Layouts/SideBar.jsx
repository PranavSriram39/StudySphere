"use client";
import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";
import classNames from "classnames";
import { MdGroups2, MdOutlineQuiz } from "react-icons/md";
import { motion } from "framer-motion";
import { CgMenuGridR } from "react-icons/cg";
import { orgStore } from "@/store/orgStore";
import { channelStore } from "@/store/channelStore";
import { userDetailsStore } from "@/store/userStore";
import { nameInitials } from "@/helperFunctions/nameInitials";
import MenuPopup from "../popup/MenuPopup";
import { OrgChannels, UserChannels } from "../Organization/Channel/Channels";
import { useRouter } from "next/navigation";
import { generalChannelStore } from "@/store/generalChannelStore";
import { isEmpty } from "lodash";
import { loadChannelData } from "@/lib/ChannelApi";
import { BarChart3 } from "lucide-react";

const SideBar = ({
  channelsData,
  setPopup,
  activeTab,
  setActiveMobile,
  isActiveMobile,
}) => {
  const orgDetails = orgStore((state) => state.orgDetails);
  const setChannelDetails = channelStore((state) => state.setChannelDetails);
  const userDetails = userDetailsStore((state) => state.userDetails);
  const [showMenu, setShowMenu] = useState(false);
  const router = useRouter();
  const generalChannel = generalChannelStore((state) => state.generalChannel);
  const commonTabs = useMemo(
    () => [
      {
        name: "General",
        icon: MdGroups2,
      },
      {
        name: "Assessments",
        icon: MdOutlineQuiz,
      },
      {
        name: "Leaderboard",
        icon: BarChart3,
      },
    ],
    []
  );

  useEffect(() => {
    const getGenaralChannel = async () => {
      const channelData = await loadChannelData(generalChannel?._id);
      setChannelDetails(channelData ? channelData : null);
    };
    setTimeout(() => {
      if (!isEmpty(generalChannel)) {
        getGenaralChannel();
      }
    }, 500);
  }, [generalChannel]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -100 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className={classNames(
        isActiveMobile ? "md:flex hidden" : "flex",
        `relative top-0 left-0 flex flex-col  w-full h-screen  px-5 py-2 z-[51] bg-white shadow-xl`
      )}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex gap-4 items-center relative py-3 md:cursor-pointer"
        onClick={() => window.location.reload()}
      >
        <Image
          src={orgDetails?.image}
          alt="org logo"
          width="50"
          height="50"
          className="rounded-full h-12 w-12  object-cover"
        />
        <h1 className="text-md font-bold line-clamp-2">{orgDetails?.name}</h1>
      </motion.div>
      <hr className="bg-white h-[2px]" />

      {/* Common Section */}
      <ul className="grid gap-2 py-5">
        {commonTabs.map((item, index) => {
          return (
            <OrgChannels
              key={index}
              data={item}
              index={index}
              channelsData={channelsData}
              setActiveMobile={setActiveMobile}
            />
          );
        })}
      </ul>
      <hr className="bg-white h-[2px]" />

      {/* Custom Section */}
      <ul className="flex-1 flex flex-col gap-2 mt-6 relative h-[calc(100vh-370px)] overflow-scroll scrollbar-none">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex justify-between items-center sticky top-0 z-50 bg-white"
        >
          <div className="absolute border-2 top-10 border-r-gray-300 border-l-0 h-[calc(100vh-360px)]" />
          <p className="font-semibold text-lg">Your Channels</p>
        </motion.div>

        {channelsData?.map((item, index) => {
          return (
            <UserChannels
              index={index}
              data={item}
              key={index}
              activeTab={activeTab}
              setActiveMobile={setActiveMobile}
            />
          );
        })}
      </ul>

      {/* Profile Section */}
      <motion.div
        className="grid"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <hr className="w-full h-[2px]" />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className=" flex-row-reverse flex md:flex-row gap-3 items-center justify-between relative py-2"
        >
          <MenuPopup
            showMenu={showMenu}
            setPopup={setPopup}
            setShowMenu={setShowMenu}
          />
          <div
            className="flex gap-4 items-center md:cursor-pointer"
            onClick={() => router.push("/Profile")}
          >
            {userDetails.image ? (
              <Image
                src={userDetails?.image}
                alt="org logo"
                width="50"
                height="50"
                className="rounded-full h-12 w-12 object-cover"
              />
            ) : (
              <div className="bg-nack flex justify-center items-center h-12 w-12 rounded-full">
                <p className="text-lg text-center">
                  {nameInitials(userDetails.name)}
                </p>
              </div>
            )}
            <div className="line-clamp-2 flex flex-col items-end md:block text-left flex-1">
              <p className="text-md font-bold">{userDetails.name}</p>
              <p className="text-xs text-gray-400">{userDetails.username}</p>
            </div>
          </div>
          <div
            className="w-fit h-fit gradient-transition text-white transition-all duration-200 p-2 rounded-full lg:cursor-pointer relative"
            onClick={() => setShowMenu(!showMenu)}
          >
            <CgMenuGridR
              className={classNames(
                "h-5 w-5 transition-all duration-200",
                showMenu && "rotate-45"
              )}
            />
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default SideBar;
