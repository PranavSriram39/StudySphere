"use client";
import React, { useState } from "react";
import AllQuiz from "./AllQuiz";
import NewQuiz from "./NewQuiz";

const QuizDashboard = ({ quizData }) => {
  const [createPage, setCreatePage] = useState(false);
  return (
    <div className="lg:mx-[350px] mx-6">
      <div className="py-4 pb-10 flex flex-col gap-10 h-[calc(100vh-72px)] overflow-scroll scrollbar-none">
        {!createPage ? (
          <AllQuiz setCreatePage={setCreatePage} quizData={quizData} />
        ) : (
          <NewQuiz setCreatePage={setCreatePage} />
        )}
      </div>
    </div>
  );
};

export default QuizDashboard;
