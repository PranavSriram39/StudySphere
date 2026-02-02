import { postRequest } from "@/config/axiosInterceptor";
import { AnimatePresence, motion } from "framer-motion";
import { BookMarked } from "lucide-react";
import React from "react";
import { AiOutlineUsergroupAdd } from "react-icons/ai";
import { FaPlus } from "react-icons/fa";
import { MdOutlineLogout } from "react-icons/md";
import { leaveOrg } from "../Constants/apiEndpoints";
import { orgStore } from "@/store/orgStore";
import { deleteCookie, getCookie } from "cookies-next";
import toast from "react-hot-toast";

const MenuPopup = ({ showMenu, setPopup, setShowMenu }) => {
  const orgDetails = orgStore((state) => state.orgDetails);
  const leaveOrganzization = async () => {
    const bodyData = {
      org_code: orgDetails?.org_code,
    };
    try {
      const response = await postRequest({
        url: leaveOrg,
        body: bodyData,
        token: getCookie("token"),
      });
      const data = response.data.data;
      if (data) {
        deleteCookie("org");
        window.location.reload();
        toast.success("Organization leaved successfully");
      }
    } catch (error) {
      toast.error("Unable to leave the organization");
      console.error(error);
    }
  };
  return (
    <AnimatePresence>
      {showMenu && (
        <motion.div
          initial={{ opacity: 0, x: 0, scale: 0 }}
          animate={{ opacity: 1, x: 100, scale: 1 }}
          exit={{
            opacity: 0,
            x: 0,
            scale: 0,
            type: "spring",
          }}
          transition={{
            duration: 0.5,
            type: "spring",
          }}
          className="absolute left-[-3rem] md:right-[-11rem] md:left-[11rem] -top-36 origin-bottom-left grid gap-2 w-max h-fit p-2 bg-white border border-gray-100 shadow-lg"
        >
          <div
            className="flex items-center gap-4 lg:cursor-pointer hover:bg-gray-100 px-2 py-2 transition-all"
            onClick={() => {
              setPopup("create");
              setShowMenu(false);
              window.history.pushState("#", null, null);
            }}
          >
            <FaPlus className="w-4 h-4" />
            <p className="">Create Channel</p>
          </div>
          <div
            className="flex items-center gap-4 lg:cursor-pointer hover:bg-gray-100 px-2 py-2 transition-all"
            onClick={() => {
              setPopup("join");
              setShowMenu(false);
              window.history.pushState("#", null, null);
            }}
          >
            <AiOutlineUsergroupAdd className="w-4 h-4" />
            <p className="">Join Channel</p>
          </div>
          <div
            className="flex items-center gap-4 lg:cursor-pointer hover:bg-gray-100 px-2 py-2 transition-all"
            onClick={() => {
              setPopup("getOrgCode");
              setShowMenu(false);
            }}
          >
            <BookMarked className="w-4 h-4" />
            <p className="">Get Organization Code</p>
          </div>
          <div
            className="flex items-center gap-4 lg:cursor-pointer hover:bg-gray-100 px-2 py-2 text-red-500 transition-all"
            onClick={() => {
              leaveOrganzization();
              setShowMenu(false);
            }}
          >
            <MdOutlineLogout className="w-4 h-4" />
            <p className="">Leave Organization</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MenuPopup;
