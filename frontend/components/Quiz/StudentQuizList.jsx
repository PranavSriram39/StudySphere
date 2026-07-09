"use client";
import React, { useState } from "react";
import QuizCard from "./QuizCard";
import CustomTabPanel from "./CustomeTabPanel";

const StudentQuizList = ({ quizData, isLoading, selectValue, org }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center w-full h-full py-12">
        <div className="loader"></div>
      </div>
    );
  }

  if (selectValue === "done") {
    return (
      <div className="border border-slate-700 bg-slate-900 rounded-lg w-full p-4 overflow-x-auto text-slate-200 shadow-xl">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-700 text-slate-400 font-bold uppercase bg-slate-800/40">
              <th className="py-3 px-3">Assessment Name</th>
              <th className="py-3 px-3">Topic</th>
              <th className="py-3 px-3">Assigned Date</th>
              <th className="py-3 px-3">Completed Date</th>
              <th className="py-3 px-3 text-right">Time Taken</th>
              <th className="py-3 px-3 text-right">Score</th>
              <th className="py-3 px-3 text-right">Correct</th>
              <th className="py-3 px-3 text-right">Wrong</th>
              <th className="py-3 px-3 text-right">Skipped</th>
              <th className="py-3 px-3 text-right">Percentage</th>
              <th className="py-3 px-3 text-center">Result</th>
              <th className="py-3 px-3 text-center">Attempt</th>
              <th className="py-3 px-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {quizData?.userSubmittedQuizzes?.map((item, idx) => {
              const qObj = item.quiz || {};
              const questionsCount = qObj.quiz ? (JSON.parse(qObj.quiz).questions?.length || 10) : 10;
              const correct = item.correct ?? item.points ?? 0;
              const total = item.totalMarks || questionsCount;
              const percentage = item.percentage ?? (total > 0 ? (correct / total) * 100 : 0);
              const passed = percentage >= 50;

              return (
                <tr key={idx} className="hover:bg-slate-800/40 text-slate-300 transition">
                  <td className="py-3 px-3 font-bold text-white">{qObj.title || "Assessment"}</td>
                  <td className="py-3 px-3 text-slate-400">{qObj.subject || "General"}</td>
                  <td className="py-3 px-3">{new Date(qObj.createdAt).toLocaleDateString()}</td>
                  <td className="py-3 px-3">{new Date(item.createdAt).toLocaleDateString()}</td>
                  <td className="py-3 px-3 text-right font-mono">{Math.floor((item.timeTaken ?? 0) / 60)}m {(item.timeTaken ?? 0) % 60}s</td>
                  <td className="py-3 px-3 text-right font-mono font-semibold text-white">{correct} / {total}</td>
                  <td className="py-3 px-3 text-right font-mono text-green-400">{correct}</td>
                  <td className="py-3 px-3 text-right font-mono text-rose-400">{item.wrong ?? 0}</td>
                  <td className="py-3 px-3 text-right font-mono text-slate-500">{item.skipped ?? 0}</td>
                  <td className="py-3 px-3 text-right font-mono font-semibold text-blue-400">{Number(percentage).toFixed(0)}%</td>
                  <td className="py-3 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      passed ? "bg-green-950 text-green-400 border border-green-800" : "bg-rose-950 text-rose-400 border border-rose-800"
                    }`}>
                      {passed ? "Pass" : "Fail"}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center font-mono">{item.attemptNumber ?? 1}</td>
                  <td className="py-3 px-3 text-center">
                    <span className="text-blue-400 font-bold uppercase text-[10px]">Review</span>
                  </td>
                </tr>
              );
            })}
            {(!quizData?.userSubmittedQuizzes || quizData.userSubmittedQuizzes.length === 0) && (
              <tr>
                <td colSpan="13" className="py-12 text-center text-slate-500 font-medium">No completed assessments found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <>
      <div className="flex h-full md:flex-row flex-col">
        <MapData
          quizData={quizData?.notSubmittedQuizzes}
          selectValue={selectValue}
          org={org}
        />
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
