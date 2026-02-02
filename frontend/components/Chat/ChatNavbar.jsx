"use client";
import Image from "next/image";
import React from "react";
import { QuizIcon, QuizLogo } from "../Constants/imageContants";
import ChannelMenuPopup from "../popup/ChannelMenuDropdown";
import { channelProfileStore } from "@/store/channelProfileStore";
import { channelStore } from "@/store/channelStore";
import quiz from "../../quiz.json";
import Link from "next/link";
import { userDetailsStore } from "@/store/userStore";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { orgStore } from "@/store/orgStore";

const ChatNavbar = ({ data = null }) => {
  const setShowChannelProfile = channelProfileStore(
    (state) => state.setShowChannelProfile
  );
  const channelDetails = channelStore((state) => state.channelDetails);
  const userDetails = userDetailsStore((state) => state.userDetails);
  const orgDetails = orgStore((state) => state.orgDetails);
  const router = useRouter();

  return (
    <div className="w-full bg-white flex px-4 py-3 justify-between items-center z-50 shadow-sm">
      <div
        className="flex gap-3 items-center cursor-pointer"
        onClick={() => {
          if (!data) {
            window.history.pushState("#", null, null);
            setShowChannelProfile(true);
          }
        }}
      >
        {data && (
          <div>
            <ArrowLeft onClick={() => router.push(`/`)} />
          </div>
        )}
        <Image src={QuizLogo} alt="" className="w-12 h-12 rounded-full" />
        <div>
          <p>{data ? data.name : channelDetails?.name}</p>
          <p className="text-gray-500 text-xs line-clamp-1">
            {data ? data.description : channelDetails?.description}
          </p>
        </div>
      </div>
      {!data && (
        <div className="flex gap-3 text-2xl items-center">
          {channelDetails?.admin_id?._id !== userDetails?._id && (
            <Link href={`/quiz?channel_id=${channelDetails?._id}&org_id=${orgDetails?._id}`}>
              <Image
                src={QuizIcon}
                alt=""
                className="w-10 h-10 rounded-full cursor-pointer"
              />
            </Link>
          )}
          <ChannelMenuPopup data={channelDetails} />
        </div>
      )}
    </div>
  );
};

export default ChatNavbar;
