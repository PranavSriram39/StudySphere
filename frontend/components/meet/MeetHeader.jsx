import { Radio, ShieldCheck } from 'lucide-react';
import React from 'react'

const MeetHeader = ({time,toTime}) => {
  return (
    <div className="p-4 bg-[#111B21] flex justify-start items-center shadow-sm border border-gray-800">
      <p className="flex-1">
        <ShieldCheck className="text-green-500" />
      </p>
      <p className="bg-[#27303F] text-white border border-gray-600 p-2 rounded-md shadow-sm flex justify-end items-center gap-2 w-fit text-sm">
        <Radio size={17} className="text-red-500" />
        {toTime(time)}
      </p>
    </div>
  );
}

export default MeetHeader