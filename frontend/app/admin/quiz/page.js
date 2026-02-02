import ChatNavbar from "@/components/Chat/ChatNavbar";
import QuizDashboard from "@/components/Quiz/QuizDashboard";
import getChannelData from "@/lib/getChannelData";
import getQuizData from "@/lib/getQuizData";
import React from "react";

const page = async (context) => {
  let data = await getChannelData(context);
  let quizData = await getQuizData(context);
  return (
    <div>
      <ChatNavbar data={data} />
      <QuizDashboard quizData={quizData} />
    </div>
  );
};

export default page;
