import { AnimatePresence, motion } from "framer-motion";
import React from "react";
import { BiDotsVerticalRounded } from "react-icons/bi";
import { deleteMessage } from "../Constants/apiEndpoints";
import { postRequest } from "@/config/axiosInterceptor";
import { getCookie } from "cookies-next";

const MessageDropdown = ({
  showMenu,
  setIsMenuOpen,
  data,
  setMessages,
  messages,
}) => {
  const token = getCookie("token");
  const deleteMsg = async () => {
    const body = {
      messageId: data?._id,
    };
    try {
      const response = await postRequest({
        url: deleteMessage,
        body: body,
        token: token,
      });
      const data = response.data.data;
      if (response.status) {
        const updatedMessages = messages.filter(
          (message) => message._id !== data?._id
        );
        setMessages(updatedMessages);
        setIsMenuOpen(!showMenu);
      }
    } catch (error) {
      console.log(error);
      // toast.error("There is a problem deleting message");
    }
  };
  return (
    <div className="relative">
      <div className="flex items-center">
        <button onClick={() => setIsMenuOpen(!showMenu)}>
          <BiDotsVerticalRounded className="cursor-pointer" />
        </button>
      </div>
      {showMenu && (
        <motion.div
          initial={{ opacity: 0, x: 0, scale: 0 }}
          animate={{ opacity: 1, x: 100, scale: 1 }}
          exit={{
            opacity: 0,
            x: 0,
            scale: 0,
            type: "spring",
          }}
          transition={{
            duration: 0.5,
            type: "spring",
          }}
          className="absolute top-0 -right-[50px] grid  origin-top-right w-max z-50 h-fit p-2 bg-white border border-gray-100 shadow-lg text-sm rounded-md"
        >
          <div
            className="flex items-center gap-4 lg:cursor-pointer hover:bg-gray-100 px-2 py-2 transition-all"
            onClick={deleteMsg}
          >
            <p className="">Delete message</p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default MessageDropdown;
