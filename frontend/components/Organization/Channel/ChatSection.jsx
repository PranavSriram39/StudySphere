"use client";
import Chat from "@/components/Chat/Chat";
import ChatInput from "@/components/Chat/ChatInput";
import ChatNavbar from "@/components/Chat/ChatNavbar";
import React, { useEffect, useState } from "react";

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
