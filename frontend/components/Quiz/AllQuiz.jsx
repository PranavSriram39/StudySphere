import { getRequest, putRequestV2 } from "@/config/axiosInterceptor";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import React, { useEffect, useState } from "react";
import {
  getAdminQuizzes,
  getQuizDetail,
  stopQuizApi,
} from "../Constants/apiEndpoints";
import { getCookie } from "cookies-next";
import toast from "react-hot-toast";
import Quiz from "./Quiz";
import QuizTable from "./QuizTable";
import QuizCard from "./QuizCard";
import { Box, Tab, Tabs } from "@mui/material";
import { orgStore } from "@/store/orgStore";
import CustomTabPanel from "./CustomeTabPanel";
import AdminQuizList from "./AdminQuizList";

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

const AllQuiz = ({ setCreatePage, quizData }) => {
  const [quiz, setQuiz] = useState(null);
  const [quizId, setQuizId] = useState(null);
  const [value, setValue] = useState(0);
  const [isLoading, setLoading] = useState(0);
  const orgDetails = orgStore((state) => state.orgDetails);

  useEffect(() => {
    setQuiz(quizData);
  }, [quizData]);

  const handleChange = async (event, newValue) => {
    setValue(newValue);
    setLoading(true);
    fetchData(newValue);
  };

  const fetchData = async (newValue) => {
    const urlParams = new URLSearchParams(window.location.search);
    try {
      const response = await getRequest({
        url: getAdminQuizzes,
        params: `?org_id=${urlParams.get(
          "org_id"
        )}&channel_id=${urlParams.get("channel_id")}${
          newValue === 0 ? "&active=true" : ""
        }`,
        token: getCookie("token"),
      });
      const data = response.data.data;
      if (response.status) {
        setQuiz(data);
        setLoading(false);
      }
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  return !quizId ? (
    <>
      <div className="grid gap-3">
        <p className="font-bold">All Quizzes</p>
        <button
          onClick={() => setCreatePage(true)}
          className="bg-blue-500 text-white rounded-md px-4 py-2 w-fit"
        >
          Create new Quiz
        </button>
      </div>

      <div className="flex gap-2">
        <Box sx={{ borderBottom: 1, borderColor: "divider", flex: "1" }}>
          <Tabs
            value={value}
            onChange={handleChange}
            aria-label="basic tabs example"
          >
            <Tab label="Active" {...a11yProps(0)} />
            <Tab label="Past" {...a11yProps(1)} />
          </Tabs>
        </Box>
      </div>

      <CustomTabPanel value={value} index={0}>
        <AdminQuizList
          quizData={quiz}
          isLoading={isLoading}
          setQuizId={setQuizId}
        />
      </CustomTabPanel>
      <CustomTabPanel value={value} index={1}>
        <AdminQuizList
          quizData={quiz}
          isLoading={isLoading}
          setQuizId={setQuizId}
        />
      </CustomTabPanel>
    </>
  ) : (
    <QuizDetails setQuizId={setQuizId} quizId={quizId} />
  );
};

export default AllQuiz;

const QuizDetails = ({ setQuizId, quizId }) => {
  const [data, setData] = useState(null);
  const [quizData, setQuizData] = useState(null);
  const [submissionData, setSubmissionData] = useState(null);
  const [isLoading, setLoading] = useState(null);
  const [submissionsTrue, setSubmissionTrue] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await getRequest({
        url: getQuizDetail,
        params: `?quiz_id=${quizId}`,
        token: getCookie("token"),
      });
      const res = response.data.data;
      if (response.status) {
        setData(JSON.parse(res?.quiz[0]?.quiz));
        setQuizData(res?.quiz[0]);
        setSubmissionData(res?.submissions);
        setLoading(false);
      }
    } catch (error) {
      toast.error("Something went wrong!!");
      setLoading(false);
      console.log(error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [quizId]);

  const stopQuiz = async () => {
    try {
      setLoading(true);
      const response = await putRequestV2({
        url: stopQuizApi,
        params: `?quiz_id=${quizId}`,
        token: getCookie("token"),
      });
      const res = response.data.data;
      if (response.status) {
        window.location.reload();
        setLoading(false);
      }
    } catch (error) {
      toast.error("Something went wrong!!");
      setLoading(false);
      console.log(error);
    }
  };

  return !submissionsTrue ? (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex gap-5 lg:px-10 px-2">
        <button
          onClick={() => setQuizId(null)}
          className="bg-blue-500 text-white rounded-md px-4 py-2  w-fit flex gap-2"
        >
          <ArrowLeft />
          Back
        </button>
        {data && (
          <button
            onClick={() => setSubmissionTrue(true)}
            className="bg-blue-500 text-white rounded-md px-4 py-2  w-fit flex gap-2"
          >
            Check Submissions
          </button>
        )}
        {quizData?.is_active && <button
          onClick={stopQuiz}
          className="bg-red-500 text-white rounded-md px-4 py-2  w-fit flex gap-2"
        >
          Stop Quiz
        </button>}
      </div>
      <div className="flex justify-between lg:px-10 px-2">
        <p className="font-bold">Quiz title : {quizData?.title}</p>
        <p>10 Points</p>
      </div>

      {!isLoading ? (
        <div>
          {data &&
            data.map((quiz, index) => (
              <Quiz key={index} question={quiz} listing={true} />
            ))}
        </div>
      ) : (
        // loader
        <div className="flex justify-center items-center h-full">
          <div class="loader"></div>
        </div>
      )}
    </div>
  ) : (
    <QuizTable
      submissionData={submissionData}
      setSubmissionTrue={setSubmissionTrue}
    />
  );
};
