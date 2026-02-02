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
  const [loading, setLoading] = useState(false);

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

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post(
        "http://127.0.0.1:8080/generate-quiz",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      setQuiz(response.data.quiz);

    } catch (error) {
      console.error(error);
      toast.error(
        error?.response?.data?.error ||
        "Backend error. Check backend terminal."
      );
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

          <div className="relative cursor-pointer w-full h-1/2 border-2 border-gray-400 rounded-md border-dashed flex flex-col justify-center items-center gap-3">
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
                  {(file.size / 1048576).toFixed(2)} MB
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
        <DisplayQuiz quiz={quiz} title={title} setQuiz={setQuiz} />
      )}
    </>
  );
};

export default NewQuiz;

const DisplayQuiz = ({ quiz, title, setQuiz }) => {
  const [isLoading, setIsLoading] = useState(false);
  // Ensure this runs only on client side or check nextjs version for searchParams
  // Using window.location inside component might cause hydration mismatch if not careful
  // but keeping your logic for now:
  
  const createQuiz = async () => {
    try {
      setIsLoading(true);
      const urlParams = new URLSearchParams(window.location.search);

      await postRequest({
        url: createNewQuizApi,
        body: {
          title,
          quiz: JSON.stringify(quiz),
          channel_id: urlParams.get("channel_id"),
          org_id: urlParams.get("org_id"),
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
    <div className="h-full w-full">
      <button
        onClick={() => setQuiz(null)}
        className="bg-blue-500 text-white rounded-md px-4 py-2 w-fit flex gap-2"
      >
        <ArrowLeft />
        Back
      </button>

      <p className="font-bold">Quiz title : {title}</p>

      {quiz.map((q, index) => (
        <Quiz key={index} question={q} listing />
      ))}

      <div className="flex justify-end">
        <button
          onClick={createQuiz}
          className="bg-blue-500 text-white rounded-md px-4 py-2 mt-4"
        >
          {isLoading ? "Saving..." : "Create new Quiz"}
        </button>
      </div>

      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
          <div className="loader"></div>
        </div>
      )}
    </div>
  );
};