"use client";
import React, { useEffect, useState } from "react";
import Quiz from "./Quiz";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { submitQuiz } from "../Constants/apiEndpoints";
import { postRequest } from "@/config/axiosInterceptor";
import { getCookie } from "cookies-next";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { activeOrgChannel } from "@/store/activeOrgChannel";

const QuizLandingPage = ({ quiz, quizData }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [points, setPoints] = useState(0);
  const [isLoading, setLoading] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [urlParams, setUrlParams] = useState(null);

  const params = useParams();
  const router = useRouter();
  const setOrgActiveChannel = activeOrgChannel((state) => state.setOrgChannel);

  const [newQuiz, setNewQuiz] = useState(
    quiz.map((question) => ({
      ...question,
      userAnswer: null,
    }))
  );

  // ✅ Safe access to window
  useEffect(() => {
    if (typeof window !== "undefined") {
      setUrlParams(new URLSearchParams(window.location.search));
    }
  }, []);

  // ⛔ Prevent render until URL params are ready
  if (!urlParams) return null;

  const handleNext = async () => {
    if (currentQuestionIndex < quiz.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      return;
    }

    // Submit on last question
    setLoading(true);
    try {
      await postRequest({
        url: submitQuiz,
        body: {
          quiz_id: params.id,
          answers: JSON.stringify(answers),
          points: points,
        },
        token: getCookie("token"),
      });

      if (urlParams.get("org")) {
        setOrgActiveChannel("Assessments");
        router.push("/");
      } else {
        router.push(
          `/quiz?channel_id=${urlParams.get("channel_id")}&org_id=${urlParams.get("org_id")}`
        );
      }
    } catch (error) {
      toast.error("Something went wrong!!");
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleAnswer = (userAnswer) => {
    const updatedQuiz = [...newQuiz];
    updatedQuiz[currentQuestionIndex].userAnswer = userAnswer;
    setNewQuiz(updatedQuiz);

    if (userAnswer === updatedQuiz[currentQuestionIndex].answer) {
      setPoints((prev) => prev + 1);
    }

    setAnswers((prev) => [...prev, userAnswer]);
  };

  return (
    <div>
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-60 flex justify-center items-center h-full">
          <div className="loader"></div>
        </div>
      )}

      <div className="bg-white rounded-lg pb-4 h-screen">
        <div className="grid md:grid-cols-[156px,1fr,156px] h-full place-content-center md:gap-8 py-5 max-w-maxContainer mx-auto">
          <div></div>

          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-10 pt-8 text-center">
              <p className="text-lg font-bold py-4">{quizData.title}</p>
            </div>

            <Quiz
              question={newQuiz[currentQuestionIndex]}
              index={currentQuestionIndex + 1}
              handleAnswer={handleAnswer}
            />

            <div className="px-10 pb-8 w-full flex justify-between">
              <button
                onClick={handlePrevious}
                className={`text-white flex justify-center px-4 py-2 rounded-md ${
                  currentQuestionIndex === 0 ? "invisible" : "gradient-transition"
                }`}
              >
                <p className="text-lg flex items-center gap-4">
                  <ChevronLeft /> Previous
                </p>
              </button>

              <button
                onClick={handleNext}
                className="gradient-transition text-white flex justify-center px-4 py-2 rounded-md"
              >
                {currentQuestionIndex === newQuiz.length - 1 ? (
                  <p className="text-lg flex items-center gap-4">Finish</p>
                ) : (
                  <p className="text-lg flex items-center gap-4">
                    Next <ChevronRight />
                  </p>
                )}
              </button>
            </div>
          </div>

          <div></div>
        </div>
      </div>
    </div>
  );
};

export default QuizLandingPage;
