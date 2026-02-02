import React, { useState } from "react";
import QuizCard from "./QuizCard";
import CustomTabPanel from "./CustomeTabPanel";

const StudentQuizList = ({ quizData, isLoading, selectValue, org }) => {

  return isLoading ? (
    <div className="flex justify-center items-center w-full h-full">
      <div class="loader"></div>
    </div>
  ) : (
    <>
      <div className="flex h-full md:flex-row flex-col">
        {selectValue === "assigned" ? (
          <MapData
            quizData={quizData?.notSubmittedQuizzes}
            selectValue={selectValue}
            org={org}
          />
        ) : (
          <MapData
            quizData={quizData?.userSubmittedQuizzes}
            selectValue={selectValue}
            org={org}
          />
        )}
      </div>
    </>
  );
};

export default StudentQuizList;

const MapData = ({ quizData, selectValue, org }) => {
  return (
    <div
      className={`border border-gray-300 rounded-lg w-full h-full ${
        quizData?.length === 0
          ? "flex"
          : "grid lg:grid-cols-3 grid-cols-1 place-content-start lg:p-5 overflow-scroll"
      } flex-col justify-center items-center gap-3 lg:p-0 p-5 ${
        org && "bg-white"
      }`}
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
              <QuizCard
                org={org}
                key={index}
                quiz={selectValue === "assigned" ? quiz : quiz?.quiz}
                points={quiz?.points}
                isStudent={selectValue === "assigned" ? "assigned" : "done"}
              />
            ))}
        </>
      )}
    </div>
  );
};
