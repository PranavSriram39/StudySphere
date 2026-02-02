import {
  MessageCircleMore,
  Mic,
  MicOff,
  Users,
  Video,
  VideoOff,
  X,
} from "lucide-react";
import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import classNames from "classnames";
import { VscSend } from "react-icons/vsc";
import socket from "@/lib/socketInstance";
import { useParams } from "next/navigation";
import { userDetailsStore } from "@/store/userStore";
import ScrollToBottom from "react-scroll-to-bottom";

const UserSideBar = ({
  players,
  setShow,
  show,
  messageDetails,
  setMessageDetails,
}) => {
  const [selectedTab, setSelectedTab] = useState("People");
  const [message, setMessage] = useState("");
  const sendBtn = useRef(null);
  const roomId = useParams().id;
  const userDetails = userDetailsStore((state) => state.userDetails);

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      sendBtn.current.click();
    }
  };
  const headerTabs = [
    {
      name: "People",
      icon: Users,
    },
    {
      name: "Chats",
      icon: MessageCircleMore,
    },
  ];

  const sendMessage = () => {
    if (message) {
      setMessageDetails((prev) => [
        ...prev,
        { name: userDetails?.name, content: message },
      ]);
      setMessage("");
      socket.emit("user-send-message", message, roomId, userDetails?.name);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className={`bg-[#17202F] text-white h-screen w-[20%] shadow-md md:block border border-gray-800  ${
        !show ? "hidden" : "block"
      }`}
    >
      <div className="flex gap-3 p-4">
        {headerTabs.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              className={classNames(
                `flex-1 cursor-pointer flex justify-center items-center gap-2 text-center bg-[#27303F] rounded-lg py-2 text-sm text-white border border-gray-600`,
                selectedTab.includes(item.name) && "bg-blue-500"
              )}
              onClick={() => setSelectedTab(item.name)}
              key={index}
            >
              <Icon size={15} />
              {item.name}
            </div>
          );
        })}
        {/* <div
          className={twMerge(
            `flex-1 cursor-pointer flex justify-center items-center gap-2 text-center bg-[#27303F] rounded-lg py-2 text-sm border border-gray-600`
          )}
          onClick={() => setSelectedTab("Chats")}
        >
          <MessageCircleMore size={15} />
          Chats
        </div> */}
      </div>
      <hr className="border-gray-800 mb-6" />
      {selectedTab === "People" ? (
        <div className="px-5">
          <div className="flex gap-7 items-center ">
            <p className="flex-1 text-lg">People</p>
            {/* <X
            size={20}
            onClick={() => setShow(false)}
            style={{ cursor: "pointer" }}
          /> */}
          </div>
          <div className="my-6 flex flex-col gap-4">
            {Object.keys(players).map((playerId) => {
              const { playing, muted, name, isHost } = players[playerId];
              return (
                <div
                  className="flex gap-2 items-center text-sm justify-center"
                  key={playerId}
                >
                  <p className="w-8 h-8 bg-[#ff6452] rounded-lg flex justify-center items-center text-white">
                    {name && name[0]}
                  </p>
                  <p className="flex-1 truncate">{name}</p>
                  <div>
                    <button
                      className={`text-white rounded-full px-2  cursor-pointer  transition duration-150`}
                    >
                      {muted ? <MicOff size={18} /> : <Mic size={18} />}
                    </button>
                    <button
                      className={`text-white rounded-full px-2  cursor-pointer  transition duration-150`}
                    >
                      {playing ? <Video size={18} /> : <VideoOff size={18} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="">
          <p className="text-lg px-5 py-2">In-call Messages</p>
          <ScrollToBottom className="px-5 h-[calc(100vh-32vh)] overflow-y-scroll scrollbar-none">
            <div className="py-4 grid gap-4">
              {messageDetails?.map((item, index) => {
                return (
                  <div key={index}>
                    <p className="font-semibold text-base">{item?.name}</p>
                    <p className="text-sm break-all">{item?.content}</p>
                  </div>
                );
              })}
            </div>
          </ScrollToBottom>
          <div className="bg-gray-100 flex gap-3 mx-5 lg:px-5 px-2 py-3 rounded-full items-center absolute bottom-10">
            <input
              type="text"
              placeholder="Send a message"
              className="flex-1 lg:w-full w-1/2 bg-transparent focus:outline-none text-gray-500 lg:ml-2 placeholder:text-sm"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
            />
            <button ref={sendBtn} onClick={sendMessage}>
              <VscSend className="text-2xl text-gray-500 cursor-pointer w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default UserSideBar;
