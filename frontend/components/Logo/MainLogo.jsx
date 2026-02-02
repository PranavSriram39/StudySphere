import Image from "next/image";
import React from "react";
import { StudyLogo } from "../Constants/imageContants";
import { MainLabel } from "../Constants/labelConstant";
import classNames from "classnames";

const MainLogo = ({className}) => {
  return (
    <div
      className={classNames(className,"flex gap-4 justify-center items-center lg:cursor-pointer")}
      onClick={() => {
        window.location.reload();
      }}
    >
      <Image src={StudyLogo} alt="studyNex logo" height={60} width={60} />
      <p className="font-bold text-xl lg:text-3xl">{MainLabel}</p>
    </div>
  );
};

export default MainLogo;
