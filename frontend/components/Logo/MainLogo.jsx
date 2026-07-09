import Image from "next/image";
import React from "react";
import { StudyLogo } from "../Constants/imageContants";
import { MainLabel } from "../Constants/labelConstant";
import classNames from "classnames";
import { useRouter, usePathname } from "next/navigation";

const MainLogo = ({className}) => {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogoClick = () => {
    if (pathname === "/") {
      const homeElement = document.getElementById("Home");
      if (homeElement) {
        homeElement.scrollIntoView({ behavior: "smooth" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } else {
      router.push("/");
    }
  };

  return (
    <div
      className={classNames(className,"flex gap-4 justify-center items-center lg:cursor-pointer")}
      onClick={handleLogoClick}
    >
      <Image src={StudyLogo} alt="studyNex logo" height={60} width={60} />
      <p className="font-bold text-xl lg:text-3xl">{MainLabel}</p>
    </div>
  );
};

export default MainLogo;
