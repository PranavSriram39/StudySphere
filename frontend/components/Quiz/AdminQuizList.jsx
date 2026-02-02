import React, { useState } from "react";
import QuizCard from "./QuizCard";
import CustomTabPanel from "./CustomeTabPanel";

const AdminQuizList = ({ quizData, isLoading, setQuizId }) => {
  return isLoading ? (
    <div className="flex justify-center items-center w-full h-full">
      <div class="loader"></div>
    </div>
  ) : (
    <>
      <div className="flex h-full md:flex-row flex-col">
        <MapData quizData={quizData} setQuizId={setQuizId} />
      </div>
    </>
  );
};

export default AdminQuizList;

const MapData = ({ quizData, setQuizId }) => {
  return (
    <div
      className={`border border-gray-300 rounded-lg w-full h-full ${
        quizData?.length === 0
          ? "flex"
          : "grid lg:grid-cols-3 grid-cols-1 place-content-start lg:p-5 overflow-scroll"
      } flex-col justify-center items-center gap-3 lg:p-0 p-5`}
    >
      {quizData?.length === 0 ? (
        <>
          <p className="text-lg">No quizzes added for students</p>
          <p className="text-sm text-gray-500 text-center">
            Your teacher hasn&apos;t assigned any quizzes for you. For the main
            time,
            <br />
            chill with your friends.
          </p>
        </>
      ) : (
        <>
          {quizData?.length !== 0 &&
            quizData?.map((quiz, index) => (
              <QuizCard key={index} quiz={quiz} setQuizId={setQuizId} />
            ))}
        </>
      )}
    </div>
  );
};
