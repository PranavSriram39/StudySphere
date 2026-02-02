import React, { useEffect, useState } from "react";
import Message from "./Message";
import ScrollToBottom from "react-scroll-to-bottom";
import { getCookie } from "cookies-next";
import { isEmpty } from "lodash";
import { userDetailsStore } from "@/store/userStore";
import { getRequest } from "@/config/axiosInterceptor";
import { fetchMessages } from "../Constants/apiEndpoints";
import toast from "react-hot-toast";
import socket from "@/lib/socketInstance";
import { MessageSkeleton } from "../Layouts/Skeleton";
import { format, isToday, isYesterday } from "date-fns";
import * as animationData from "../../public/Assets/Lotties/MessageLottie.json";
import Lottie from "react-lottie";
import { channelStore } from "@/store/channelStore";

const Chat = ({ messages, setMessages }) => {
  const [isLoading, setIsLoading] = useState(false);
  const userDetails = userDetailsStore((state) => state.userDetails);
  const [connectionStatus, setConnectionStatus] = useState(false);
  const token = getCookie("token");
  const channelDetails = channelStore((state) => state.channelDetails);
  // const currentDate = new Date();
  let lastFormattedDate;
  let dateHeading;

  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: animationData,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };

  // Establishing connection
  useEffect(() => {
    socket.emit("setup", userDetails);
    socket.on("connection", () => {
      setConnectionStatus(!connectionStatus);
      // console.log("Connected to socket");
    });
  }, []);

  useEffect(() => {
    const fetchMsg = async () => {
      setIsLoading(true);
      setMessages([]);
      try {
        const response = await getRequest({
          url: fetchMessages,
          params: `/${channelDetails?._id}`,
          token: token,
        });
        const data = response.data.data;
        if (response.status) {
          if (isEmpty(response.data.data)) setIsLoading(false);
          else {
            setIsLoading(false);
            setMessages(data);
            socket.emit("join chat", channelDetails?._id);
          }
        }
      } catch (error) {
        setIsLoading(false);
        console.log(error);
        toast.error("There is a problem fetching messages");
      }
    };
    if (!isEmpty(channelDetails)) fetchMsg();
  }, [channelDetails]);

  useEffect(() => {
    const handleReceivedMessage = (newMessage) => {
      // console.log("socket message received: " + newMessage);
      if (isEmpty(messages)) setMessages((prev) => [...prev, newMessage]);
      else if (!isEmpty(messages)) {
        const lastMessage = messages[messages.length - 1];
        if (!lastMessage || lastMessage._id !== newMessage._id) {
          setMessages((prev) => [...prev, newMessage]);
        }
      }
    };

    const handleError = (error) => {
      console.error("Socket error:", error);
    };

    socket.on("new_message", handleReceivedMessage);
    socket.on("error", handleError);
    return () => {
      socket.off("new_message", handleReceivedMessage);
      socket.off("error", handleError);
    };
  }, [messages]);

  const checkDateHeader = (postedDate) => {
    lastFormattedDate = dateHeading;
    if (isToday(postedDate)) {
      dateHeading = "Today";
    } else if (isYesterday(postedDate)) dateHeading = "Yesterday";
    else {
      dateHeading = format(postedDate, "dd/MM/yyyy");
    }

    return lastFormattedDate !== dateHeading ? dateHeading : null;
  };

  return (
    <ScrollToBottom className="h-[calc(100vh-76px-72px)] relative w-full flex-1 bg-slate-100 overflow-y-scroll scrollbar-none">
      <div className="p-4 overflow-x-hidden flex flex-col gap-2">
        {!isLoading && !isEmpty(messages) ? (
          messages.map((data, index) => (
            <React.Fragment key={index}>
              <div>
                <p className="text-center text-xs text-gray-500 my-2">
                  {checkDateHeader(new Date(data?.createdAt))}
                </p>
              </div>
              <Message
                key={index}
                data={data}
                messages={messages}
                setMessages={setMessages}
              />
            </React.Fragment>
          ))
        ) : !isLoading ? (
          <div className="md:w-[50%] md:m-auto md:p-20">
            <Lottie options={defaultOptions} />
            <p className="text-center text-lg">No messages to display</p>
          </div>
        ) : (
          <MessageSkeleton />
        )}
      </div>
    </ScrollToBottom>
  );
};

export default Chat;
