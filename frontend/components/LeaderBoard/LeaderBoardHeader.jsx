import React from "react";
import Title from "../Helpers/Title";

const LeaderBoardHeader = () => {
  return (
    <div className="flex justify-center py-10 px-10">
      <div className="text-2xl font-semibold">
        <span className="text-orange-500">
          Leaderboard Triumph:{" "}
          <span className="text-blue-500">
            Navigate Your Rank in the Leaderboard Arena!!
          </span>
        </span>
      </div>
    </div>
  );
};

export default LeaderBoardHeader;
