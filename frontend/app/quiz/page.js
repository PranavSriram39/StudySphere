import ChatNavbar from "@/components/Chat/ChatNavbar";
import StudentAllQuiz from "@/components/Quiz/StudentAllQuiz";
import getChannelData from "@/lib/getChannelData";
import getUserQuizData from "@/lib/getUserQuiz";
import React from "react";

const page = async (context) => {
  let data = await getChannelData(context);
  let quizData = await getUserQuizData(context,true);
  return (
    <div>
      <ChatNavbar data={data} />
      <StudentAllQuiz quizData={quizData}/>
    </div>
  );
};

export default page;
