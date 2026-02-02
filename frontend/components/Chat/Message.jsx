import React, { useEffect, useState } from "react";
import classNames from "classnames";
import ImageViewer from "react-simple-image-viewer";
import MessageDropdown from "../popup/MessageDropdown";
import { nameInitials } from "@/helperFunctions/nameInitials";
import { userDetailsStore } from "@/store/userStore";
import { isEmpty } from "lodash";
import "video-react/dist/video-react.css";
import { Player } from "video-react";
import Head from "next/head";
import Link from "next/link";
import { differenceInHours, format } from "date-fns";

const Message = ({ data, setMessages, messages }) => {
  const userDetails = userDetailsStore((state) => state.userDetails);
  const isSender = data?.sender?._id === userDetails?._id;
  const justifyClass = isSender ? "justify-end" : "";
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [formattedDate, setFormattedDate] = useState("");

  const linkRegex = /(https?:\/\/[^\s]+)/g;
  const partMessage = data?.content.split(linkRegex);

  useEffect(() => {
    setFormattedDate(format(new Date(data?.createdAt), "HH:mm"));
  }, []);

  return (
    <div className={`flex gap-1 ${justifyClass}`}>
      <div className="lg:max-w-[60%] max-w-[80%]">
        {/* message and images */}
        <p
          className={classNames(
            isSender
              ? "bg-nack border rounded-l-2xl rounded-br-2xl "
              : "bg-white border rounded-r-2xl rounded-bl-2xl",
            "text-sm px-4 py-2 shadow-sm w-fit relative"
          )}
        >
          {/* time and name */}
          <div
            className={`flex items-center justify-between pb-2 gap-4 ${justifyClass}`}
          >
            {!isSender && (
              <>
                <div className="flex gap-2 items-center">
                  <div className="gradient-transition text-white font-semibold w-5 h-5  rounded-full">
                    <p className="text-center text-sm">
                      {nameInitials(data?.sender?.name)}
                    </p>
                  </div>
                  <p className="text-xs  font-semibold text-gray-700 ">
                    {data?.sender?.name}
                  </p>
                </div>
                <MessageDropdown
                  data={data}
                  showMenu={isMenuOpen}
                  setIsMenuOpen={setIsMenuOpen}
                  messages={messages}
                  setMessages={setMessages}
                />
              </>
            )}
          </div>
          {!isEmpty(data?.attachments) &&
            (data?.mediaType === "Image" ? (
              <img
                src={data?.attachments}
                className="md:max-w-[400px] max-w-[250px] rounded-md mb-2 cursor-pointer pb-2"
                onClick={() => setIsViewerOpen(true)}
              />
            ) : data?.mediaType === "Video" ? (
              <Player
                fluid={false}
                src={data?.attachments}
                width={250}
                height={250}
              />
            ) : data?.mediaType === "Document" ? (
              <iframe
                className="bg-transparent w-[250px] h-[300px] md:w-[400px] md:h-[400px] focus:outline-none text-gray-500 rounded-xl shadow-lg mb-4"
                src={data?.attachments}
              />
            ) : null)}
          <div className="flex gap-4">
            <div>
              {partMessage.map((message, index) =>
                message.match(linkRegex) ? (
                  <Link
                    href={message.trim()}
                    target="_blank"
                    key={index}
                    className="break-all text-blue-600 pr-4"
                  >
                    {message.trim()}
                  </Link>
                ) : (
                  <p className="break-all text-justify pr-4 py-2" key={index}>
                    {message}
                  </p>
                )
              )}
            </div>
            <p className="text-[8px] flex text-end absolute bottom-2 right-2 pt-1 pl-4 ">
              {formattedDate}
            </p>
          </div>
        </p>
      </div>

      {isViewerOpen && (
        <ImageViewer
          src={[data?.attachments]}
          disableScroll={false}
          closeOnClickOutside={true}
          onClose={() => setIsViewerOpen(false)}
          backgroundStyle={{
            zIndex: "999",
            backdropFilter: "blur(2px)",
            background: "rgb(0,0,0,0.7)",
          }}
        />
      )}
    </div>
  );
};

export default Message;
