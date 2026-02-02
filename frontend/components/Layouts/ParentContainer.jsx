"use client";
import React, { useEffect, useState } from "react";
import SideBar from "./SideBar";
import { orgStore } from "@/store/orgStore";
import CreateChannel from "../popup/CreateChannel";
import JoinChannel from "../popup/JoinChannel";
import { isEmpty } from "lodash";
import { userDetailsStore } from "@/store/userStore";
import { channelStore } from "@/store/channelStore";
import GetOrgCode from "../popup/GetOrgCodePopup";
import { generalChannelStore } from "@/store/generalChannelStore";

const ParentContainer = ({ children, orgData, channelsData }) => {
  const setOrgDetails = orgStore((state) => state.setOrgDetails);
  const userDetails = userDetailsStore((state) => state.userDetails);
  const getUserDetails = userDetailsStore((state) => state.getUserDetails);
  const isActiveMobile = channelStore((state) => state.isActiveMobile);
  const setActiveMobile = channelStore((state) => state.setActiveMobile);
  const setGeneralChannel = generalChannelStore(
    (state) => state.setGeneralChannel
  );
  const [activeTab, setActiveTab] = useState("General");

  useEffect(() => {
    if (isEmpty(userDetails)) getUserDetails();
  }, [userDetails]);

  const [popup, setPopup] = useState("");

  const generalChannel = channelsData.filter(
    (item) => item?.name === "General" && item?.org_id === orgData.data?._id
  );
  setGeneralChannel(generalChannel[0]);
  setOrgDetails(orgData.data);
  return (
    <div className="grid lg:grid-cols-[280px,1fr] mx-auto bg-main overflow-hidden">
      <SideBar
        channelsData={channelsData}
        setPopup={setPopup}
        setActiveTab={setActiveTab}
        activeTab={activeTab}
        setActiveMobile={setActiveMobile}
        isActiveMobile={isActiveMobile}
      />
      {popup == "create" && (
        <CreateChannel
          orgDetails={orgData.data}
          channelsData={channelsData}
          setPopup={setPopup}
          setActiveTab={setActiveTab}
          activeTab={activeTab}
        />
      )}
      {popup == "join" && (
        <JoinChannel
          orgDetails={orgData.data}
          channelsData={channelsData}
          setPopup={setPopup}
          setActiveTab={setActiveTab}
          activeTab={activeTab}
        />
      )}
      {popup == "getOrgCode" && (
        <GetOrgCode
          orgDetails={orgData.data}
          channelsData={channelsData}
          setPopup={setPopup}
        />
      )}
      {children}
    </div>
  );
};

export default ParentContainer;
