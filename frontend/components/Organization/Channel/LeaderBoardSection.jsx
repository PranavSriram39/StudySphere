import { getUserProgress } from "@/components/Constants/apiEndpoints";
import LeaderBoardHeader from "@/components/LeaderBoard/LeaderBoardHeader";
import LeaderTable from "@/components/LeaderBoard/LeaderTable";
import { getRequest } from "@/config/axiosInterceptor";
import { getCookie } from "cookies-next";
import { isEmpty } from "lodash";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

const LeaderBoardSection = () => {
  const [usersData, setUsersData] = useState([]);
  const getUsersData = async () => {
    try {
      const response = await getRequest({
        params: `/${getCookie("org")}`,
        url: getUserProgress,
        token: getCookie("token"),
      });
      const data = response.data.data;
      if (data) {
        setUsersData(data);
      }
    } catch (error) {
      toast.error("Unable to fetch users progress");
      console.error(error);
    }
  };

  useEffect(() => {
    getUsersData();
  }, []);

  return (
    <>
      {!isEmpty(usersData) ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <LeaderBoardHeader />
          <LeaderTable data={usersData} />
        </motion.div>
      ) : (
        <div className="flex h-screen items-center justify-center">
          <p className="text-2xl">
            None of the users have participated in quizzes....
          </p>
        </div>
      )}
    </>
  );
};

export default LeaderBoardSection;
