"use client";
import { activeOrgChannel } from "@/store/activeOrgChannel";
import React, { useEffect, useState } from "react";
import ChatSection from "./Channel/ChatSection";
import { channelStore } from "@/store/channelStore";
import { channelProfileStore } from "@/store/channelProfileStore";
import { isMobile } from "react-device-detect";
import classNames from "classnames";
import LeaderBoardSection from "./Channel/LeaderBoardSection";
import StudentAllQuiz from "../Quiz/StudentAllQuiz";

const OrgMainPage = () => {
  const orgActiveChannel = activeOrgChannel((state) => state.orgChannel);
  const isActiveMobile = channelStore((state) => state.isActiveMobile);
  const setActiveMobile = channelStore((state) => state.setActiveMobile);
  const showChannelProfile = channelProfileStore(
    (state) => state.showChannelProfile
  );
  const [show, setShow] = useState("");

  useEffect(() => {
    if (isMobile) {
      const handlePopState = function () {
        setActiveMobile(false);
      };
      window.addEventListener("popstate", handlePopState);
      return () => {
        window.removeEventListener("popstate", handlePopState);
      };
    }
  }, [isMobile, setActiveMobile]);

  useEffect(() => {
    if (showChannelProfile) {
      setShow("md:flex hidden");
    } else if (isActiveMobile) {
      setShow("flex");
    } else {
      setShow("md:flex hidden");
    }
  }, [showChannelProfile, isActiveMobile]);
  return (
    <div
      className={classNames(
        show,
        `flex-1  md:flex flex-col transition h-screen`
      )}
    >
      {orgActiveChannel === "Assessments" ? (
        <StudentAllQuiz org={true}/>
      ) : orgActiveChannel === "Leaderboard" ? (
        <LeaderBoardSection />
      ) : (
        <ChatSection />
      )}
    </div>
  );
};

export default OrgMainPage;
