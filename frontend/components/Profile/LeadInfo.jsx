import React from "react";
import IconTriangleUpTwentyFour from "../Constants/Icons/Rankup";
import IconTriangleDownTwentyFour from "../Constants/Icons/Rankdown";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope } from "@fortawesome/free-solid-svg-icons";
import { faMedal } from "@fortawesome/free-solid-svg-icons";

const LeadInfo = () => {
  return (
    <div className="bg-gray-100 h-3/4 lg:h-full w-full rounded-lg flex flex-col justify-around lg:px-10  text-sm lg:text-lg font-bold">
      <div className="flex w-full border-b-2 border-gray-300">
        <div className="flex flex-col flex-1 lg:border-r-2 border-gray-300 items-center justify-center ">
          <div className="text-blue-500">Current Rank</div>
          <div className="pb-4">
            8
            <IconTriangleUpTwentyFour style={{ display: "inline" }} />
          </div>
        </div>
        <div className="flex flex-col flex-1  items-center justify-center">
          <div className="text-blue-500">Current Score</div>
          <div className="pb-4">
            50
            <IconTriangleDownTwentyFour style={{ display: "inline" }} />
          </div>
        </div>
      </div>
      <div className="flex w-full border-b-2 border-gray-300">
        <div className="flex flex-col flex-1  items-center justify-center lg:border-r-2 border-gray-300">
          <div className="text-blue-500">Highest Rank</div>
          <div className="pb-4">
            2<FontAwesomeIcon icon={faMedal} style={{ color: "#ffdc5c" }} />
          </div>
        </div>
        <div className="flex flex-col flex-1  items-center justify-center">
          <div className="text-blue-500">Highest Score</div>
          <div className="pb-4">120</div>
        </div>
      </div>
      <div className="flex flex-col  items-center justify-center">
        <div className="text-blue-500 px-10 text-lg">
          Increase/Decrease in Point from last week
        </div>
        <div>
          65
          <IconTriangleDownTwentyFour style={{ display: "inline" }} />
        </div>
      </div>
    </div>
  );
};

export default LeadInfo;
