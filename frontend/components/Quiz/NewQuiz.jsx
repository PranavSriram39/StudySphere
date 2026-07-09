
"use client";
import { ArrowLeft, Upload } from "lucide-react";
import Image from "next/image";
import React, { useState } from "react";
import { Pdf } from "../Constants/imageContants";
import Quiz from "./Quiz";
import toast from "react-hot-toast";
import axios from "axios";
import { postRequest } from "@/config/axiosInterceptor";
import { createNewQuizApi } from "../Constants/apiEndpoints";
import { getCookie } from "cookies-next";

const NewQuiz = ({ setCreatePage }) => {
  const [quiz, setQuiz] = useState(null);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("General");
  const [loading, setLoading] = useState(false);

  const [questionOption, setQuestionOption] = useState("10");
  const [numQuestions, setNumQuestions] = useState(10);
  const [difficulty, setDifficulty] = useState("Medium");
  const [duration, setDuration] = useState(10);
  const [customDuration, setCustomDuration] = useState(false);

  const [published, setPublished] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [negativeMarking, setNegativeMarking] = useState(false);
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [instructions, setInstructions] = useState("");
  const [randomizeQuestions, setRandomizeQuestions] = useState(false);
  const [randomizeOptions, setRandomizeOptions] = useState(false);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const generateQuiz = async () => {
    if (!title) {
      toast.error("Please enter a title");
      return;
    }

    if (!file) {
      toast.error("Please select a file");
      return;
    }

    // Validate PDF MIME type
    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are supported");
      return;
    }

    // Validate max file size: 10 MB
    const MAX_SIZE_BYTES = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      toast.error("File too large. Maximum allowed size is 10 MB");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title);
      formData.append("num_questions", numQuestions.toString());
      formData.append("difficulty", difficulty);
      formData.append("duration", duration.toString());

      const pyBackendUrl =
        process.env.NEXT_PUBLIC_APP_ENV === "production"
          ? "https://studysphere-py-backend.onrender.com/generate-quiz"
          : "http://localhost:10000/generate-quiz";

      // ✅ Do NOT set Content-Type manually — Axios will set multipart/form-data
      // with the correct boundary automatically when given a FormData object.
      // Manually setting "Content-Type: multipart/form-data" strips the boundary
      // parameter, causing Flask to fail to parse the uploaded file (400 error).
      const response = await axios.post(pyBackendUrl, formData, {
        timeout: 120000, // 2 minutes — Groq generation can be slow
      });

      if (!response.data?.quiz) {
        throw new Error("Server returned success but no quiz data found");
      }

      setQuiz(response.data.quiz);

    } catch (error) {
      console.error("[generateQuiz] Error:", error);
      const serverMsg =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        "Quiz generation failed. Please try again.";
      toast.error(serverMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!quiz ? (
        <>
          <button
            onClick={() => setCreatePage(false)}
            className="bg-blue-500 text-white rounded-md px-4 py-2 w-fit flex gap-2"
          >
            <ArrowLeft />
            Back
          </button>

          <p className="font-bold">Add new quiz</p>

          <div className="h-14 w-full flex flex-col gap-2">
            <p>Enter Quiz title</p>
            <input
              className="h-full w-full border px-5 py-3 rounded-md"
              type="text"
              placeholder="Quiz Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="h-14 w-full flex flex-col gap-2 mt-4">
            <p>Enter Quiz Topic (e.g. Operating Systems, React)</p>
            <input
              className="h-full w-full border px-5 py-3 rounded-md"
              type="text"
              placeholder="Quiz Topic"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mt-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold">Number of Questions</label>
              <select
                className="border px-4 py-2.5 rounded-md bg-white text-black"
                value={questionOption}
                onChange={(e) => {
                  setQuestionOption(e.target.value);
                  if (e.target.value !== "Custom") {
                    const parsedCount = parseInt(e.target.value);
                    setNumQuestions(parsedCount);
                    if (!customDuration) {
                      setDuration(parsedCount);
                    }
                  }
                }}
              >
                <option value="5">5 Questions</option>
                <option value="10">10 Questions</option>
                <option value="15">15 Questions</option>
                <option value="20">20 Questions</option>
                <option value="25">25 Questions</option>
                <option value="30">30 Questions</option>
                <option value="Custom">Custom Number</option>
              </select>
              {questionOption === "Custom" && (
                <input
                  type="number"
                  min="1"
                  max="50"
                  className="border px-4 py-2 rounded-md mt-2"
                  placeholder="Enter number (1-50)"
                  value={numQuestions}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setNumQuestions(val);
                    if (!customDuration) {
                      setDuration(val);
                    }
                  }}
                />
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold">Difficulty</label>
              <select
                className="border px-4 py-2.5 rounded-md bg-white text-black"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold">Duration (Minutes)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  disabled={!customDuration}
                  className="border px-4 py-2 rounded-md flex-1 bg-gray-50 disabled:bg-gray-200 disabled:text-gray-500"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
                />
                <label className="flex items-center gap-1 text-xs cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={customDuration}
                    onChange={(e) => {
                      setCustomDuration(e.target.checked);
                      if (!e.target.checked) {
                        setDuration(numQuestions);
                      }
                    }}
                  />
                  Custom
                </label>
              </div>
            </div>
          </div>

          {/* Scheduling & Advanced Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mt-4 p-4 border border-gray-200 rounded-md bg-gray-50/50 text-black">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold">Start Date & Time (Optional)</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  className="border px-4 py-2 rounded-md flex-1 text-black bg-white"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <input
                  type="time"
                  className="border px-4 py-2 rounded-md flex-1 text-black bg-white"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold">End Date & Time (Optional)</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  className="border px-4 py-2 rounded-md flex-1 text-black bg-white"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
                <input
                  type="time"
                  className="border px-4 py-2 rounded-md flex-1 text-black bg-white"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold">Maximum Attempts Allowed</label>
              <input
                type="number"
                min="1"
                className="border px-4 py-2 rounded-md text-black bg-white"
                value={maxAttempts}
                onChange={(e) => setMaxAttempts(parseInt(e.target.value) || 1)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold">Instructions (Optional)</label>
              <textarea
                className="border px-4 py-2 rounded-md text-black bg-white h-11 resize-none"
                placeholder="Instructions for the candidates..."
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-4 col-span-1 md:col-span-2 items-center">
              <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={negativeMarking}
                  onChange={(e) => setNegativeMarking(e.target.checked)}
                />
                Negative Marking
              </label>

              <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={randomizeQuestions}
                  onChange={(e) => setRandomizeQuestions(e.target.checked)}
                />
                Randomize Questions
              </label>

              <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={randomizeOptions}
                  onChange={(e) => setRandomizeOptions(e.target.checked)}
                />
                Randomize Options
              </label>

              <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                />
                Publish Directly
              </label>
            </div>
          </div>

          <div className="relative cursor-pointer w-full h-1/2 border-2 border-gray-400 rounded-md border-dashed flex flex-col justify-center items-center gap-3 mt-4">
            <p className="p-4 bg-blue-500 text-white rounded-full">
              <Upload size={30} />
            </p>
            <p className="text-lg text-center">
              Drag & Drop or <span className="text-blue-500">Choose file</span> to
              create Quiz
            </p>
            <p className="text-sm text-gray-500 text-center">
              Supported formats : .pdf
            </p>

            <input
              type="file"
              accept="application/pdf"
              className="opacity-0 absolute cursor-pointer w-full h-full"
              onChange={handleFileChange}
            />
          </div>

          {file && (
            <div className="border px-4 py-3 rounded-md flex gap-3">
              <Image src={Pdf} alt="pdf" className="w-10" />
              <div>
                <p>{file.name}</p>
                <p className="text-gray-400">
                  {Number((file?.size ?? 0) / 1048576).toFixed(2)} MB
                </p>
              </div>
            </div>
          )}

          <button
            onClick={generateQuiz}
            disabled={loading}
            className="bg-blue-500 text-white rounded-md px-4 py-2 w-fit self-end"
          >
            {loading ? "Generating..." : "Create new Quiz"}
          </button>
        </>
      ) : (
        <DisplayQuiz
          quiz={quiz}
          title={title}
          subject={subject}
          setQuiz={setQuiz}
          published={published}
          startDate={startDate}
          startTime={startTime}
          endDate={endDate}
          endTime={endTime}
          negativeMarking={negativeMarking}
          maxAttempts={maxAttempts}
          instructions={instructions}
          randomizeQuestions={randomizeQuestions}
          randomizeOptions={randomizeOptions}
        />
      )}
    </>
  );
};

export default NewQuiz;

const DisplayQuiz = ({
  quiz,
  title,
  subject,
  setQuiz,
  published,
  startDate,
  startTime,
  endDate,
  endTime,
  negativeMarking,
  maxAttempts,
  instructions,
  randomizeQuestions,
  randomizeOptions,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const questionsList = Array.isArray(quiz) ? quiz : (quiz?.questions || []);
  
  const createQuiz = async () => {
    try {
      setIsLoading(true);
      const urlParams = new URLSearchParams(window.location.search);

      let startDateTime;
      if (startDate) {
        const timeStr = startTime || "00:00";
        startDateTime = new Date(`${startDate}T${timeStr}`);
      }
      let endDateTime;
      if (endDate) {
        const timeStr = endTime || "23:59";
        endDateTime = new Date(`${endDate}T${timeStr}`);
      }

      if (startDateTime && endDateTime && startDateTime >= endDateTime) {
        toast.error("End date-time must be after start date-time");
        setIsLoading(false);
        return;
      }

      const startDateTimeStr = startDateTime ? startDateTime.toISOString() : undefined;
      const endDateTimeStr = endDateTime ? endDateTime.toISOString() : undefined;

      await postRequest({
        url: createNewQuizApi,
        body: {
          title,
          subject,
          quiz: JSON.stringify(quiz),
          channel_id: urlParams.get("channel_id"),
          org_id: urlParams.get("org_id"),
          published,
          startDateTime: startDateTimeStr,
          endDateTime: endDateTimeStr,
          negativeMarking,
          maxAttempts,
          instructions,
          randomizeQuestions,
          randomizeOptions
        },
        token: getCookie("token"),
      });

      window.location.reload();
    } catch (error) {
      toast.error("Something went wrong!!");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full w-full bg-slate-900 text-slate-100 p-6 rounded-xl border border-slate-800">
      <button
        onClick={() => setQuiz(null)}
        className="bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md px-4 py-2 w-fit flex gap-2 border border-slate-750 transition"
      >
        <ArrowLeft />
        Back
      </button>

      <p className="font-bold text-lg mt-4 text-white">Quiz title : {title}</p>

      <div className="mt-4 space-y-4">
        {questionsList.map((q, index) => (
          <Quiz key={index} question={q} listing />
        ))}
      </div>

      <div className="flex justify-end">
        <button
          onClick={createQuiz}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-6 py-2.5 mt-6 font-bold shadow-lg transition"
        >
          {isLoading ? "Saving..." : "Create new Quiz"}
        </button>
      </div>

      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="loader"></div>
        </div>
      )}
    </div>
  );
};