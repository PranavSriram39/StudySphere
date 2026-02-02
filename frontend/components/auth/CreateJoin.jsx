"use client";
import React, { useState } from "react";
import { MainLabel } from "../Constants/labelConstant";
import PrimaryBtn from "../Helpers/PrimaryBtn";
import LottieComponent from "./Lottie";
import { FcApproval } from "react-icons/fc";
import CreateOrgPopup from "../popup/CreateOrgPopup";
import JoinOrgPopup from "../popup/JoinOrgPopup";

const CreateJoin = () => {
  const [createPopup, setCreatePopup] = useState(false);
  const [joinPopup, setJoinPopup] = useState(false);
  return (
    <div
      className="bg-cover bg-center min-h-screen
                    bg-login                    
                    xl:bg-[url('../public/Assets/Images/createbg.jpeg')] flex flex-col justify-center items-center xl:bg-no-repeat"
    >
      <p className="font-bold text-4xl mt-16 py-7 px-7 text-center bg-gradient-to-r from-blue-400 to-violet-600 text-transparent bg-clip-text">
        {MainLabel}
      </p>
      <div className="lg:w-1/4 lg:m-auto w-2/3 m-auto lg:mb-5 mb-6 ">
        <LottieComponent />
      </div>
      <div className="flex lg:flex-row flex-col lg:gap-10 gap-3">
        <div className="max-w-sm mx-auto bg-gradient-to-r from-blue-400 to-violet-600 rounded-md overflow-hidden shadow-2xl flex flex-col items-center mb-10">
          <div className="px-6 py-4 ">
            <div className="font-bold text-xl mb-4 text-white">
              Create Organization
            </div>
            <p className="text-white mb-5">
              <FcApproval style={{ display: "inline" }} />
              Create your own virtual organizations.
            </p>
            <p className="text-white mb-5">
              <FcApproval style={{ display: "inline" }} />
              Create channels for your teams or clubs.
            </p>
            <p className="text-white mb-5">
              <FcApproval style={{ display: "inline" }} />
              One stop solutions for all your needs.
            </p>
            <p className="text-white mb-5">
              <FcApproval style={{ display: "inline" }} />
              Virtual workspace to share resources.
            </p>
            <p className="text-white ">
              <FcApproval style={{ display: "inline" }} />
              Encourage innovation, creativity, and collaboration.
            </p>
          </div>
          <PrimaryBtn
            label="Create Organization"
            link=""
            className="mb-4"
            invert
            clickEvent={() => {
              setCreatePopup(true);
              window.history.pushState("#", null, null);
            }}
          />
        </div>
        <div className="max-w-sm mx-auto bg-gradient-to-r from-violet-600 to-blue-400 rounded-md overflow-hidden shadow-2xl flex flex-col items-center mb-10">
          <div className="px-6 py-4">
            <div className="font-bold text-xl mb-4 text-white">
              Join Organization
            </div>
            <p className="text-white mb-5">
              <FcApproval style={{ display: "inline" }} />
              Get access to organization resouces.
            </p>
            <p className="text-white mb-5">
              <FcApproval style={{ display: "inline" }} />
              Build connections with people sharing similar interests.
            </p>
            <p className="text-white mb-5">
              <FcApproval style={{ display: "inline" }} />
              Make your own channels and develope leadership skills.
            </p>
            <p className="text-white mb-5">
              <FcApproval style={{ display: "inline" }} />
              Compete in a fun way with your friends.
            </p>
            <p className="text-white ">
              <FcApproval style={{ display: "inline" }} />
              Keep track of your progress and improve to your best version.
            </p>
          </div>
          <PrimaryBtn
            label="Join Organization"
            link=""
            className="mb-4"
            invert
            clickEvent={() => {
              setJoinPopup(true);
              window.history.pushState("#", null, null);
            }}
          />
        </div>
      </div>
      {createPopup && <CreateOrgPopup setPopup={setCreatePopup} />}
      {joinPopup && <JoinOrgPopup setPopup={setJoinPopup} />}
    </div>
  );
};

export default CreateJoin;
