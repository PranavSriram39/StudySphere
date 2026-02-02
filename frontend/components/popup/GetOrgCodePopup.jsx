import React, { useEffect, useMemo, useState } from "react";
import PopupContainer from "../Layouts/PopupContainer";
import Title from "../Helpers/Title";
import Description from "../Helpers/Description";
import toast from "react-hot-toast";
import { Copy } from "lucide-react";
import CopyToClipboard from "react-copy-to-clipboard";

const GetOrgCode = ({ orgDetails, setPopup }) => {
  return (
    <PopupContainer setPopup={setPopup} closeBtn>
      <div className="bg-white w-[90vw] md:w-[30vw] h-max rounded-md shadow-md py-10 lg:px-10 px-4 flex flex-col gap-3">
        <Title>Share your organization</Title>
        <Description>
          Share this code with to the members you want to join this organization
        </Description>
        {/* <div className="flex justify-between p-4 border-2 rounded-2xl">
          <p className="text-gray-600">{orgDetails?.org_code}</p>
          <Copy className="w-4 h-4 md:cursor-pointer" onClick={copyCode} />
        </div> */}

        <CopyToClipboard
          text={orgDetails?.org_code}
          onCopy={() => {
            toast.success("Organization code copied");
            setPopup(false);
          }}
        >
          <p className="flex justify-between items-center p-4 border-2 rounded-2xl">
            {orgDetails?.org_code}{" "}
            <Copy className="w-4 h-4 md:cursor-pointer" />
          </p>
        </CopyToClipboard>
      </div>
    </PopupContainer>
  );
};

export default GetOrgCode;
