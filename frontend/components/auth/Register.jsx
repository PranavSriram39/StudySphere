import React, { useRef, useState } from "react";
import { BsEmojiSmile } from "react-icons/bs";
import { HiOutlineMicrophone } from "react-icons/hi";
import { IoImageOutline } from "react-icons/io5";
import { VscSend } from "react-icons/vsc";
import EmojiPicker from "emoji-picker-react";
import { postRequest } from "@/config/axiosInterceptor";
import { sendMessage } from "../Constants/apiEndpoints";
import { channelStore } from "@/store/channelStore";
import { getCookie } from "cookies-next";
import toast from "react-hot-toast";
import socket from "@/lib/socketInstance";
import MediaPopup from "../popup/MediaPopup";
import { motion } from "framer-motion";
import "video-react/dist/video-react.css";
import { Player } from "video-react";

const ChatInput = ({ setMessages }) => {
  const [emojiPicker, setEmojiPicker] = useState(false);
  const [mediaPicker, setMediaPicker] = useState(false);
  const channelDetails = channelStore((state) => state.channelDetails);
  const [messageContent, setMessageContent] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [fileType, setFileType] = useState("");
  const [filePreview, setFilePreview] = useState();
  const token = getCookie("token");
  const sendBtn = useRef(null);

  const returnMediaType = () => {
    let mediaType = "";
    switch (fileType) {
      case "image":
        mediaType = "Image";
        break;
      case "video":
        mediaType = "Video";
        break;
      case "document":
        mediaType = "Document";
        break;
      default:
        mediaType = "Unknown";
        break;
    }
    return mediaType;
  };
  const sendMsg = async () => {
    let contentType;
    setMessageContent("");
    setFileContent("");
    setFileType("");

    if (messageContent && fileContent) contentType = "Hybrid";
    else if (messageContent) contentType = "Text";
    else if (fileContent) contentType = "Media";
    else return;

    const body = {
      type: contentType,
      receiver: channelDetails?.users,
      content: messageContent,
      attachments: fileContent,
      channel: channelDetails?._id,
      mediaType: returnMediaType(),
    };
    try {
      const response = await postRequest({
        url: sendMessage,
        body: body,
        token: token,
      });
      const data = response.data.data;
      if (data) {
        setMessages((prev) => [...prev, data]);
        socket.emit("new_message", data, channelDetails?._id);
        setFilePreview(null);
      }
    } catch (error) {
      console.log(error);
      toast.error("Oops!! Can't send message");
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      sendBtn.current.click();
    }
  };

  const handleEmojiInput = (e) => {
    setMessageContent((prev) => prev + e.emoji);
  };
  return (
    <div className="w-full bg-white flex lg:px-4 px-2 py-3 justify-between items-center relative z-50 shadow-sm">
      {emojiPicker && (
        <div className="absolute bottom-20">
          <EmojiPicker
            height={500}
            width={300}
            onEmojiClick={(e) => handleEmojiInput(e)}
          />
        </div>
      )}
      {filePreview && fileType && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 flex justify-center items-center -top-[30rem] bottom-20 shadow-lg bg-black bg-opacity-70"
        >
          {fileType === "image" ? (
            <img
              className="h-96 bg-transparent focus:outline-none text-gray-500 rounded-xl shadow-2xl"
              src={filePreview}
            />
          ) : fileType === "video" ? (
            <Player fluid={false} src={filePreview} aspectRatio="3:2" />
          ) : fileType === "document" ? (
            <iframe
              className="bg-transparent focus:outline-none text-gray-500 rounded-xl shadow-2xl"
              src={`${filePreview}#page=1&w=200&h=300`}
              width={400}
              height={400}
            />
          ) : null}
        </motion.div>
      )}
      <div className="bg-gray-100 flex gap-3 lg:px-5 px-2 py-4 rounded-xl items-center w-full">
        <HiOutlineMicrophone
          className="text-xl cursor-pointer"
          onClick={() => setEmojiPicker(false)}
        />
        <div className="cursor-pointer relative">
          <MediaPopup
            mediaPicker={mediaPicker}
            setFileContent={setFileContent}
            setMediaPicker={setMediaPicker}
            filePreview={filePreview}
            setFilePreview={setFilePreview}
            setFileType={setFileType}
          />
          <IoImageOutline
            className="text-xl"
            onClick={() => setMediaPicker(!mediaPicker)}
          />
        </div>
        <BsEmojiSmile
          className="text-xl cursor-pointer"
          onClick={() => setEmojiPicker(!emojiPicker)}
        />
        <input
          type="text"
          placeholder="Type message"
          className="flex-1 lg:w-full w-1/2 bg-transparent focus:outline-none text-gray-500 lg:ml-2"
          onClick={() => setEmojiPicker(false)}
          value={messageContent}
          onChange={(e) => setMessageContent(e.target.value)}
          onKeyDown={handleKeyPress}
        />
        <button ref={sendBtn} onClick={sendMsg}>
          <VscSend className="text-2xl text-gray-500 cursor-pointer" />
        </button>
      </div>
    </div>
  );
};

export default ChatInput;
