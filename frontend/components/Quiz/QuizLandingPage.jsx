"use client";
import React, { useEffect, useState, useRef } from "react";
import Quiz from "./Quiz";
import { ChevronLeft, ChevronRight, Bookmark, Clock, Flag, Award, Eye, X } from "lucide-react";
import { submitQuiz } from "../Constants/apiEndpoints";
import { postRequest } from "@/config/axiosInterceptor";
import { getCookie } from "cookies-next";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { activeOrgChannel } from "@/store/activeOrgChannel";
import { userDetailsStore } from "@/store/userStore";

const QuizLandingPage = ({ quiz, quizData }) => {
  const questionsList = Array.isArray(quiz) ? quiz : (quiz?.questions || []);
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isLoading, setLoading] = useState(false);
  const [urlParams, setUrlParams] = useState(null);
  const [showReview, setShowReview] = useState(false);

  // Initialize newQuiz with states: userAnswer, flagged, visited
  const [newQuiz, setNewQuiz] = useState(() =>
    questionsList.map((question) => ({
      ...question,
      userAnswer: null,
      flagged: false,
      visited: false,
    }))
  );

  useEffect(() => {
    if (questionsList.length > 0 && newQuiz.length === 0) {
      setNewQuiz(
        questionsList.map((question) => ({
          ...question,
          userAnswer: null,
          flagged: false,
          visited: false,
        }))
      );
      setTimeLeft((quiz?.duration || questionsList.length || 10) * 60);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionsList]);

  // Keep newQuiz in a ref for safe use in async/timer functions without re-triggering intervals
  const newQuizRef = useRef(newQuiz);
  useEffect(() => {
    newQuizRef.current = newQuiz;
  }, [newQuiz]);

  const [hasStarted, setHasStarted] = useState(false);
  const startTimeRef = useRef(null);
  const handleStartQuiz = () => {
    startTimeRef.current = new Date();
    setHasStarted(true);
  };

  // Set duration: quiz.duration (Cisco style) or default to 1 min per question
  const durationMinutes = quiz?.duration || questionsList.length || 10;
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);

  const params = useParams();
  const router = useRouter();
  const setOrgActiveChannel = activeOrgChannel((state) => state.setOrgChannel);
  const userDetails = userDetailsStore((state) => state.userDetails);

  // ✅ Safe access to window & URL params
  useEffect(() => {
    if (typeof window !== "undefined") {
      setUrlParams(new URLSearchParams(window.location.search));
    }
  }, []);

  // Mark current question as visited
  useEffect(() => {
    if (newQuiz.length > 0) {
      setNewQuiz((prev) => {
        const updated = [...prev];
        if (updated[currentQuestionIndex] && !updated[currentQuestionIndex].visited) {
          updated[currentQuestionIndex].visited = true;
        }
        return updated;
      });
    }
  }, [currentQuestionIndex, newQuiz.length]);

  // Submit handler
  const handleSubmit = async (isTimeout = false) => {
    setLoading(true);
    try {
      const endTime = new Date();
      const timeTaken = startTimeRef.current
        ? Math.floor((endTime - startTimeRef.current) / 1000)
        : durationMinutes * 60;

      let correct = 0;
      let wrong = 0;
      let skipped = 0;

      const submissionAnswers = newQuizRef.current.map((q) => {
        const corrAns = q.correctAnswer || q.answer;
        if (q.userAnswer === null || q.userAnswer === undefined) {
          skipped += 1;
        } else if (q.userAnswer === corrAns) {
          correct += 1;
        } else {
          wrong += 1;
        }
        return q.userAnswer;
      });

      const totalMarks = newQuizRef.current.length;
      const percentage = totalMarks > 0 ? (correct / totalMarks) * 100 : 0;
      const attempted = correct + wrong;
      const accuracy = attempted > 0 ? (correct / attempted) * 100 : 0;

      await postRequest({
        url: submitQuiz,
        body: {
          quiz_id: params.id,
          answers: JSON.stringify(submissionAnswers),
          points: correct,
          startTime: startTimeRef.current || new Date(),
          endTime,
          timeTaken,
          correct,
          wrong,
          skipped,
          totalMarks,
          percentage,
          accuracy,
          difficulty: newQuizRef.current[0]?.difficulty || "Medium",
          completionStatus: isTimeout ? "Timed Out" : "Completed",
          attemptNumber: 1
        },
        token: getCookie("token"),
      });

      toast.success("Quiz submitted successfully!");

      if (urlParams?.get("org")) {
        setOrgActiveChannel("Assessments");
        router.push("/");
      } else {
        router.push(
          `/quiz?channel_id=${urlParams?.get("channel_id")}&org_id=${urlParams?.get("org_id")}`
        );
      }
    } catch (error) {
      toast.error("Something went wrong during submission!");
      console.log(error);
    } finally {
      setLoading(false);
      setShowReview(false);
    }
  };

  const [status, setStatus] = useState("Active");
  const [countdownText, setCountdownText] = useState("");

  useEffect(() => {
    const checkStatus = () => {
      const now = new Date();
      if (quizData?.startDateTime && now < new Date(quizData.startDateTime)) {
        setStatus("Upcoming");
        const diff = new Date(quizData.startDateTime) - now;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setCountdownText(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      } else if (quizData?.endDateTime && now > new Date(quizData.endDateTime)) {
        setStatus("Expired");
        setCountdownText("");
      } else {
        setStatus("Active");
        setCountdownText("");
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizData?.startDateTime, quizData?.endDateTime]);

  // Timer countdown
  useEffect(() => {
    if (!hasStarted) return;
    if (timeLeft === null) return;
    if (timeLeft <= 0) {
      toast.error("Time has expired! Submitting your quiz...");
      handleSubmit(true);
      return;
    }
    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, hasStarted]);

  // Keyboard Shortcuts (Arrow keys)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
        return;
      }
      if (e.key === "ArrowLeft") {
        handlePrevious();
      } else if (e.key === "ArrowRight") {
        handleNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestionIndex, newQuiz.length]);

  if (!urlParams || newQuiz.length === 0) return null;

  const handleNext = () => {
    if (currentQuestionIndex < newQuiz.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setShowReview(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleAnswer = (userAnswer) => {
    setNewQuiz((prev) => {
      const updated = [...prev];
      if (updated[currentQuestionIndex]) {
        updated[currentQuestionIndex].userAnswer = userAnswer;
      }
      return updated;
    });
  };

  const toggleFlag = () => {
    setNewQuiz((prev) => {
      const updated = [...prev];
      if (updated[currentQuestionIndex]) {
        updated[currentQuestionIndex].flagged = !updated[currentQuestionIndex].flagged;
      }
      return updated;
    });
  };

  const clearResponse = () => {
    setNewQuiz((prev) => {
      const updated = [...prev];
      if (updated[currentQuestionIndex]) {
        updated[currentQuestionIndex].userAnswer = null;
      }
      return updated;
    });
  };

  // Format time remaining
  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  // Calculate statistics
  const answeredCount = newQuiz.filter((q) => q.userAnswer !== null).length;
  const flaggedCount = newQuiz.filter((q) => q.flagged).length;
  const visitedCount = newQuiz.filter((q) => q.visited).length;
  const notAnsweredCount = newQuiz.length - answeredCount;
  const notVisitedCount = newQuiz.length - visitedCount;

  // Palette color-coding mapper
  const getPaletteClass = (q, idx) => {
    const isCurrent = idx === currentQuestionIndex;
    const isAnswered = q.userAnswer !== null;
    const isFlagged = q.flagged;
    const isVisited = q.visited;

    let base = "w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm border transition-all cursor-pointer select-none ";
    
    if (isCurrent) {
      base += "ring-2 ring-blue-500 ring-offset-2 scale-105 ";
    }

    if (isAnswered && isFlagged) {
      return base + "bg-purple-600 border-purple-700 text-white";
    } else if (isAnswered) {
      return base + "bg-green-600 border-green-700 text-white";
    } else if (isFlagged) {
      return base + "bg-amber-500 border-amber-600 text-white";
    } else if (isVisited) {
      return base + "bg-gray-200 border-gray-300 text-gray-700";
    } else {
      return base + "bg-white border-gray-300 text-gray-700 hover:bg-gray-50";
    }
  };

  const mySubmissions = quizData?.submissions?.filter(s => s.user?._id?.toString() === userDetails?._id?.toString()) || [];
  const attemptCount = mySubmissions.length;
  const maxAttempts = quizData?.maxAttempts || 1;
  const hasReachedLimit = attemptCount >= maxAttempts;
  const isOrgCreator = quizData?.isOrgCreator;
  const isCreatorProhibited = quizData?.isQuizCreator || quizData?.isChannelCreator;

  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 md:p-8 font-sans">
        <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl p-6 md:p-8 flex flex-col gap-6">
          <div className="border-b border-slate-800 pb-4">
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              status === "Upcoming" ? "bg-amber-950/60 text-amber-400 border border-amber-800" :
              status === "Expired" ? "bg-rose-950/60 text-rose-400 border border-rose-800" :
              "bg-green-950/60 text-green-400 border border-green-800"
            }`}>
              {status}
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-white mt-3">{quizData?.title}</h1>
            <p className="text-xs text-slate-450 mt-1">Topic: <strong className="text-blue-400">{quizData?.subject}</strong> | Difficulty: <strong className="text-slate-200">{quizData?.difficulty || "Medium"}</strong></p>
          </div>

          <div className="text-sm text-slate-300 space-y-4">
            <div>
              <h3 className="font-bold text-white mb-1">Description</h3>
              <p className="text-slate-400 text-xs">{quizData?.description || "No description provided."}</p>
            </div>

            <div>
              <h3 className="font-bold text-white mb-1.5">Instructions</h3>
              <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-line bg-slate-950/40 p-4 rounded-xl border border-slate-800">
                {quizData?.instructions || "Please select the single correct answer for each question. There is a countdown timer for the assessment duration. Do not refresh or exit the page after starting."}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-slate-950/50 border border-slate-800 p-3 rounded-xl text-center">
                <span className="text-slate-500 text-[10px] uppercase font-bold">Questions</span>
                <p className="text-lg font-black text-white">{questionsList.length}</p>
              </div>
              <div className="bg-slate-950/50 border border-slate-800 p-3 rounded-xl text-center">
                <span className="text-slate-500 text-[10px] uppercase font-bold">Duration</span>
                <p className="text-lg font-black text-white">{durationMinutes} Min</p>
              </div>
              <div className="bg-slate-950/50 border border-slate-800 p-3 rounded-xl text-center">
                <span className="text-slate-500 text-[10px] uppercase font-bold">Attempts Used</span>
                <p className="text-lg font-black text-white">{attemptCount} / {maxAttempts}</p>
              </div>
              <div className="bg-slate-950/50 border border-slate-800 p-3 rounded-xl text-center">
                <span className="text-slate-500 text-[10px] uppercase font-bold">Negative Mark</span>
                <p className="text-lg font-black text-rose-450">{quizData?.negativeMarking ? "Yes" : "No"}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col gap-4">
            {isOrgCreator ? (
              <div className="bg-rose-950/30 border border-rose-900 text-rose-450 p-4 rounded-xl text-center text-xs font-semibold">
                You are the Organization Creator. Organization creators cannot attempt assessments.
              </div>
            ) : isCreatorProhibited ? (
              <div className="bg-rose-950/30 border border-rose-900 text-rose-450 p-4 rounded-xl text-center text-xs font-semibold">
                You created this assessment and cannot attempt it.
              </div>
            ) : hasReachedLimit ? (
              <div className="bg-amber-950/30 border border-amber-900 text-amber-450 p-4 rounded-xl text-center text-xs font-semibold">
                You have reached the maximum attempts limit ({maxAttempts}) for this assessment.
              </div>
            ) : status === "Upcoming" ? (
              <div className="flex flex-col gap-2 items-center">
                <div className="bg-amber-950/30 border border-amber-900 text-amber-450 p-3 rounded-xl text-center text-xs font-semibold w-full">
                  This assessment has not started.
                </div>
                <div className="text-lg font-mono font-bold text-white tracking-widest mt-2 flex items-center gap-2">
                  <Clock className="text-amber-400 animate-pulse" size={18} />
                  Countdown: {countdownText}
                </div>
              </div>
            ) : status === "Expired" ? (
              <div className="bg-rose-950/30 border border-rose-900 text-rose-450 p-4 rounded-xl text-center text-xs font-semibold">
                This assessment has ended.
              </div>
            ) : (
              <button
                onClick={handleStartQuiz}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition duration-205 text-sm tracking-wide"
              >
                Start Assessment
              </button>
            )}

            <button
              onClick={() => {
                if (urlParams?.get("org")) {
                  setOrgActiveChannel("Assessments");
                  router.push("/");
                } else {
                  router.push(`/quiz?channel_id=${urlParams?.get("channel_id")}&org_id=${urlParams?.get("org_id")}`);
                }
              }}
              className="w-full border border-slate-800 hover:bg-slate-800 text-slate-300 font-bold py-2.5 px-6 rounded-xl transition text-xs"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex justify-center items-center h-full z-50">
          <div className="loader"></div>
        </div>
      )}

      {/* header */}
      <header className="bg-slate-800 border-b border-slate-700 py-4 px-6 md:px-12 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">{quizData?.title}</h1>
          <p className="text-xs text-slate-400 mt-1">StudySphere Assessment Environment</p>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-slate-900 px-4 py-2 rounded-lg border border-slate-700">
            <Clock size={16} className="text-blue-400 animate-pulse" />
            <span className="font-mono text-lg font-bold text-white tracking-wider">{formatTime(timeLeft)}</span>
          </div>

          <div className="text-right text-xs text-slate-400 hidden sm:block">
            <p className="font-semibold text-slate-200">Question {currentQuestionIndex + 1} of {newQuiz.length}</p>
            <div className="w-32 bg-slate-700 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div
                className="bg-blue-500 h-full transition-all duration-300"
                style={{ width: `${((currentQuestionIndex + 1) / newQuiz.length) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </header>

      {/* Main body */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto p-4 md:p-8 flex flex-col lg:flex-row gap-8 overflow-y-auto">
        
        {/* Left Column: Active Question */}
        <section className="flex-1 bg-white text-slate-900 rounded-xl shadow-lg border border-slate-200 flex flex-col overflow-hidden">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
            <span className="font-bold text-slate-700 tracking-wide text-sm">
              SECTION: GENERAL ASSESSMENT
            </span>
            <span className="text-xs font-semibold text-slate-500">
              Q. Number: {currentQuestionIndex + 1}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto min-h-[300px]">
            <Quiz
              question={newQuiz[currentQuestionIndex]}
              index={currentQuestionIndex + 1}
              handleAnswer={handleAnswer}
            />
          </div>

          <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-wrap justify-between items-center gap-4">
            <div className="flex gap-2">
              <button
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-100 disabled:opacity-50 text-slate-700 rounded-lg flex items-center gap-2 font-medium text-sm transition"
              >
                <ChevronLeft size={16} /> Previous
              </button>

              <button
                onClick={handleNext}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 font-medium text-sm transition"
              >
                {currentQuestionIndex === newQuiz.length - 1 ? "Review & Finish" : "Next"} <ChevronRight size={16} />
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={toggleFlag}
                className={`px-4 py-2 border rounded-lg flex items-center gap-2 font-medium text-sm transition ${
                  newQuiz[currentQuestionIndex]?.flagged
                    ? "bg-amber-100 border-amber-400 text-amber-800"
                    : "border-slate-300 hover:bg-slate-100 text-slate-700"
                }`}
              >
                <Flag size={14} className={newQuiz[currentQuestionIndex]?.flagged ? "fill-amber-600 text-amber-600" : ""} />
                Flag for Review
              </button>

              <button
                onClick={clearResponse}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg font-medium text-sm transition"
              >
                Clear Response
              </button>
            </div>
          </div>
        </section>

        {/* Right Column: Question Palette & Info */}
        <aside className="w-full lg:w-[320px] shrink-0 flex flex-col gap-6">
          {/* Question Navigator */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-md">
            <h3 className="font-bold text-white text-sm tracking-wide mb-4">QUESTION PALETTE</h3>
            
            <div className="grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-5 gap-2 max-h-[220px] overflow-y-auto pr-1">
              {newQuiz.map((q, idx) => (
                <div
                  key={idx}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={getPaletteClass(q, idx)}
                >
                  {idx + 1}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="mt-6 border-t border-slate-700 pt-4 flex flex-col gap-2 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-white border border-slate-400 rounded-sm"></span>
                <span>Not Visited</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-gray-200 border border-gray-300 rounded-sm"></span>
                <span>Visited (Unanswered)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-green-600 border border-green-700 rounded-sm"></span>
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-amber-50 border border-amber-600 rounded-sm"></span>
                <span>Flagged</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-purple-600 border border-purple-700 rounded-sm"></span>
                <span>Answered & Flagged</span>
              </div>
            </div>
          </div>

          {/* Quick Stats Summary */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-md text-xs text-slate-300 flex flex-col gap-3">
            <h3 className="font-bold text-white text-sm tracking-wide">STATUS SUMMARY</h3>
            <div className="flex justify-between">
              <span>Total Questions:</span>
              <span className="font-bold text-white">{newQuiz.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Answered:</span>
              <span className="font-bold text-green-400">{answeredCount}</span>
            </div>
            <div className="flex justify-between">
              <span>Flagged for Review:</span>
              <span className="font-bold text-amber-400">{flaggedCount}</span>
            </div>
            <button
              onClick={() => setShowReview(true)}
              className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-bold transition flex items-center justify-center gap-2 text-sm"
            >
              <Eye size={14} /> Review Assessment
            </button>
          </div>
        </aside>
      </main>

      {/* Review Screen Modal Overlay */}
      {showReview && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-xl rounded-xl shadow-2xl p-6 relative">
            <button
              onClick={() => setShowReview(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <Award className="text-blue-500" /> Review Assessment Summary
            </h2>
            <p className="text-slate-400 text-sm mb-6">Review your progress below before clicking Submit.</p>

            <div className="grid grid-cols-2 gap-4 mb-6 bg-slate-900 p-4 rounded-lg border border-slate-700 text-sm">
              <div className="flex flex-col">
                <span className="text-slate-400">Total Questions</span>
                <span className="text-lg font-bold text-white">{newQuiz.length}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-400">Answered Questions</span>
                <span className="text-lg font-bold text-green-400">{answeredCount}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-400">Unanswered Questions</span>
                <span className="text-lg font-bold text-rose-400">{notAnsweredCount}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-400">Flagged Questions</span>
                <span className="text-lg font-bold text-amber-400">{flaggedCount}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-400">Visited Questions</span>
                <span className="text-lg font-bold text-slate-200">{visitedCount}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-400">Not Visited Questions</span>
                <span className="text-lg font-bold text-slate-500">{notVisitedCount}</span>
              </div>
            </div>

            <p className="text-slate-300 text-xs mb-6">
              You can click on any question number below to jump back to that question directly and adjust your response.
            </p>

            <div className="flex flex-wrap gap-2 mb-6">
              {newQuiz.map((q, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setCurrentQuestionIndex(idx);
                    setShowReview(false);
                  }}
                  className={getPaletteClass(q, idx)}
                >
                  {idx + 1}
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowReview(false)}
                className="px-4 py-2 border border-slate-600 hover:bg-slate-700 text-slate-300 rounded-lg font-medium text-sm transition"
              >
                Back to Test
              </button>
              <button
                onClick={handleSubmit}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-sm transition"
              >
                Submit Assessment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizLandingPage;
