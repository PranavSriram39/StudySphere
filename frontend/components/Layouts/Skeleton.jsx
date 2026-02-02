import React from "react";

export const ChannelListSkeleton = () => {
  return (
    <div className="grid grid-cols-1 gap-2 ">
      <div className="h-16 bg-gray-400 animate-pulse"></div>
      <div className="h-16 bg-gray-400 animate-pulse"></div>
      <div className="h-16 bg-gray-400 animate-pulse"></div>
      <div className="h-16 bg-gray-400 animate-pulse"></div>
    </div>
  );
};

export const ChannelProfileSkeleton = () => {
  return (
    <div className="grid gap-2">
      <div className="grid gap-2 p-5 place-items-center">
        <div className="rounded-full w-24 h-24 bg-gray-400 animate-pulse" />
        <div className="bg-gray-400 animate-pulse h-5 w-28" />
        <div className="bg-gray-400 animate-pulse h-5 w-28" />
      </div>
      <div className="grid gap-3 p-4">
        <div className="bg-gray-400 animate-pulse h-6 w-full" />
        <div className="bg-gray-400 animate-pulse h-6 w-full" />
      </div>
      <div className="grid gap-4 p-4">
        <div className="bg-gray-400 animate-pulse p-4 rounded-md w-full" />
        <ChannelMemberSkeleton />
        <ChannelMemberSkeleton />
        <ChannelMemberSkeleton />
      </div>
      <div className="grid gap-4 p-4 mt-16">
        <div className="bg-gray-400 animate-pulse p-4 rounded-md w-full" />
        <div className="bg-gray-400 animate-pulse p-4 rounded-md w-full" />
      </div>
    </div>
  );
};

export const ChannelMemberSkeleton = () => {
  return (
    <div className="grid gap-2">
      <div className="flex gap-4 py-2 items-center">
        <div className="rounded-full px-4 py-1 h-full bg-gray-400 animate-pulse" />
        <div className="h-7 w-full bg-gray-400 animate-pulse" />
      </div>
    </div>
  );
};

export const MessageSkeleton = () => {
  return (
    <div className="grid gap-2">
      <div className="flex gap-4 py-2 flex-col">
        <div className="flex justify-end">
          <div className="h-24 w-[30%] bg-gray-400 animate-pulse border rounded-l-2xl rounded-br-2xl " />
        </div>
        <div className="h-24 w-[20%] bg-gray-400 animate-pulse border rounded-r-2xl rounded-bl-2xl " />
        <div className="flex justify-end">
          <div className="h-24 w-[20%] bg-gray-400 animate-pulse border rounded-l-2xl rounded-br-2xl " />
        </div>
        <div className="h-24 w-[50%] bg-gray-400 animate-pulse border rounded-r-2xl rounded-bl-2xl " />
        <div className="flex justify-end">
          <div className="h-14 w-[29%] bg-gray-400 animate-pulse border rounded-l-2xl rounded-br-2xl " />
        </div>
        <div className="h-10 w-[5%] bg-gray-400 animate-pulse border rounded-r-2xl rounded-bl-2xl " />
      </div>
    </div>
  );
};
