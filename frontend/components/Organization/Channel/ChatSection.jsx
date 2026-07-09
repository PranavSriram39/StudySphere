"use client";
import dynamic from "next/dynamic";
import ChatInput from "@/components/Chat/ChatInput";
import ChatNavbar from "@/components/Chat/ChatNavbar";
import React, { useState } from "react";

// react-scroll-to-bottom generates random CSS class names that differ between
// server and client, causing a hydration className mismatch warning.
// Disabling SSR for the Chat component fixes this.
const Chat = dynamic(() => import("@/components/Chat/Chat"), { ssr: false });

function ChatSection() {
  const [messages, setMessages] = useState([]);

  return (
    <>
      <ChatNavbar />
      <Chat setMessages={setMessages} messages={messages} />
      <ChatInput setMessages={setMessages} />
    </>
  );
}

export default ChatSection;
