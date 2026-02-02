"use client";
import React, { useCallback, useEffect, useState } from "react";
import RightContainer from "../../Layouts/RightContainer";
import { BsSearch } from "react-icons/bs";
import { MdDone, MdEdit, MdOutlineLogout } from "react-icons/md";
import { channelProfileStore } from "@/store/channelProfileStore";
import { CgClose } from "react-icons/cg";
import { channelStore } from "@/store/channelStore";
import { format } from "date-fns";
import { debounce, isEmpty } from "lodash";
import {
  getRequest,
  postRequestV2,
  putRequest,
} from "@/config/axiosInterceptor";
import {
  getChannelMembers,
  leaveChannel,
  renameChannel,
} from "@/components/Constants/apiEndpoints";
import { getCookie } from "cookies-next";
import {
  ChannelMemberSkeleton,
  ChannelProfileSkeleton,
} from "@/components/Layouts/Skeleton";
import ChannelMember from "@/components/Channel/ChannelMember";
import { isMobile } from "react-device-detect";
import toast from "react-hot-toast";
import { activeOrgChannel } from "@/store/activeOrgChannel";
import { loadChannelData } from "@/lib/ChannelApi";
import { generalChannelStore } from "@/store/generalChannelStore";

const ChannelProfile = ({ channelsData }) => {
  const [channelMembers, setChannelMembers] = useState([]);
  const [isEditChannel, setIsEditChannel] = useState(false);
  const [searchKey, setSearchKey] = useState("");
  const [newChannelName, setNewChannelName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const token = getCookie("token");

  const showChannelProfile = channelProfileStore(
    (state) => state.showChannelProfile
  );
  const setShowChannelProfile = channelProfileStore(
    (state) => state.setShowChannelProfile
  );
  const channelDetails = channelStore((state) => state.channelDetails);
  const setChannelDetails = channelStore((state) => state.setChannelDetails);

  const setActiveMobile = channelStore((state) => state.setActiveMobile);
  const setOrgChannel = activeOrgChannel((state) => state.setOrgChannel);
  const generalChannel = generalChannelStore((state) => state.generalChannel);

  let createdDate;
  if (!isEmpty(channelDetails)) {
    createdDate = format(
      new Date(channelDetails?.createdAt),
      "dd-MM-yyyy HH:mm aa"
    );
  }
  const fetchChannelMembers = async () => {
    setChannelMembers([]);
    setIsLoading(true);
    const body = {
      channelId: channelDetails?._id,
      searchKey: searchKey,
    };
    try {
      const response = await postRequestV2({
        url: getChannelMembers,
        body: body,
        token: token,
      });
      const data = response.data.data;
      if (response.status) {
        setChannelMembers([]);
        setIsLoading(false);
        setChannelMembers((prev) => [...prev, ...data]);
      }
    } catch (error) {
      toast.error("Something went wrong");
      console.log(error);
    }
  };

  const delayedQuery = useCallback(debounce(fetchChannelMembers, 1000), [
    searchKey,
  ]);

  useEffect(() => {
    if (!isEmpty(channelDetails)) fetchChannelMembers();
  }, [channelDetails]);

  useEffect(() => {
    if (!isEmpty(channelDetails)) delayedQuery();
  }, [searchKey, delayedQuery]);

  useEffect(() => {
    const renameChannelName = async () => {
      const body = {
        channelId: channelDetails?._id,
        name: newChannelName,
      };
      const response = await putRequest({
        url: renameChannel,
        body: body,
        token: token,
      });
      const data = response.data.data;
      if (response.status) {
        setChannelDetails(data);
      }
      setNewChannelName("");
    };
    if (!isEmpty(newChannelName) && !isEditChannel) renameChannelName();
  }, [newChannelName, isEditChannel]);

  useEffect(() => {
    if (isMobile) {
      const handlePopState = function () {
        setActiveMobile(false);
        setShowChannelProfile(false);
      };
      window.addEventListener("popstate", handlePopState);
      return () => {
        window.removeEventListener("popstate", handlePopState);
      };
    }
  }, []);

  const handleLeaveChannel = async () => {
    try {
      const response = await getRequest({
        url: leaveChannel,
        params: channelDetails._id,
        token: token,
      });
      const data = response.data.data;
      if (data) {
        channelsData = channelsData.filter(
          (item) => item?._id !== channelDetails._id
        );
        setShowChannelProfile(false);
        setOrgChannel("General");
        handleChannelClick();
        toast.success("Channel Leaved Successfully");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleChannelClick = async () => {
    // window.history.pushState("#", null, null);
    // setActiveMobile(true);
    const channelData = await loadChannelData(generalChannel?._id);
    setChannelDetails(channelData ? channelData : null);
    // window.history.pushState("#", null, null);
    // setActiveMobile(true);
  };

  return (
    showChannelProfile && (
      <RightContainer>
        {isEmpty(channelDetails) ? (
          <ChannelProfileSkeleton />
        ) : (
          <div>
            <div className="p-5 flex-1 grid place-content-center place-items-center gap-2 relative">
              <div className="gradient-transition px-6 py-4 rounded-full">
                <p className="font-semibold text-4xl text-white">#</p>
              </div>
              {isEditChannel ? (
                <div className="relative">
                  <input
                    type="text"
                    className="h-10 w-full text-gray-600 outline-none border border-gray-200 rounded-xl shadow-sm p-4 pr-12 placeholder:text-sm"
                    placeholder={channelDetails?.name}
                    onChange={(e) => setNewChannelName(e.target.value)}
                  />
                  <MdDone
                    className="w-6 h-6 absolute right-4 top-2 lg:cursor-pointer"
                    onClick={() => setIsEditChannel(false)}
                  />
                </div>
              ) : (
                <div className="flex gap-3 justify-center">
                  <p className="font-semibold text-lg line-clamp-1">
                    {channelDetails.name}
                  </p>
                  <MdEdit
                    className="h-5 w-5 lg:cursor-pointer"
                    onClick={() => setIsEditChannel(!isEditChannel)}
                  />
                </div>
              )}
              <p className="text-sm text-gray-500">
                {channelDetails?.users?.length} participants
              </p>
              <CgClose
                className="w-6 h-6 absolute right-4 top-4 lg:cursor-pointer"
                onClick={() => setShowChannelProfile(false)}
              />
            </div>
            <hr className=" bg-white h-[2px] mx-4" />

            <div className="px-4 py-4 relative">
              <p className="text-sm text-gray-700 break-all line-clamp-3">
                {channelDetails?.description}
              </p>
              <p className="text-gray-600 text-xs mt-2 italic">
                Channel created by {channelDetails?.admin_id?.name}, on{" "}
                {createdDate}
              </p>
            </div>
            <hr className=" bg-white h-[2px] mx-4" />

            <div className="flex flex-col py-2 h-[calc(100vh-55vh)] lg:h-[calc(100vh-50vh)] relative">
              <div className="rounded-full w-full relative p-4 z-50">
                <input
                  type="text"
                  className="h-10 w-full text-gray-600 outline-none border border-gray-200 rounded-xl shadow-sm p-4 pr-12 placeholder:text-sm"
                  placeholder="Search participants"
                  value={searchKey}
                  onChange={(e) => setSearchKey(e.target.value)}
                />
                <BsSearch className="h-6 w-6 absolute right-8 top-6 text-gray-500" />
              </div>
              <div className="p-4 overflow-scroll scrollbar-none">
                {!isLoading && !isEmpty(channelMembers) ? (
                  channelMembers?.map((item, index) => {
                    return <ChannelMember data={item} key={index} />;
                  })
                ) : (
                  <>
                    <ChannelMemberSkeleton />
                    <ChannelMemberSkeleton />
                    <ChannelMemberSkeleton />
                  </>
                )}
              </div>
            </div>
            {channelDetails?.name !== "General" && (
              <>
                <hr className=" bg-white h-[2px] mx-4" />
                <div className="text-sm">
                  <div
                    className="flex items-center gap-4 lg:cursor-pointer p-4"
                    onClick={handleLeaveChannel}
                  >
                    <MdOutlineLogout className="text-red-600 w-5 h-5" />
                    <p className="text-red-600">Leave Channel</p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </RightContainer>
    )
  );
};

export default ChannelProfile;
