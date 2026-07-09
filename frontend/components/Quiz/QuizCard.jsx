import { activeOrgChannel } from "@/store/activeOrgChannel";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import React, { useMemo } from "react";

const QuizCard = ({ setQuizId, quiz, isStudent, points, org }) => {
  const urlParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const router = useRouter();

  const parsedQuiz = useMemo(() => {
    try {
      return quiz?.quiz ? (typeof quiz.quiz === "string" ? JSON.parse(quiz.quiz) : quiz.quiz) : {};
    } catch (e) {
      return {};
    }
  }, [quiz?.quiz]);

  const status = useMemo(() => {
    if (!quiz?.startDateTime && !quiz?.endDateTime) return "Active";
    const now = new Date();
    if (quiz.startDateTime && now < new Date(quiz.startDateTime)) return "Upcoming";
    if (quiz.endDateTime && now > new Date(quiz.endDateTime)) return "Expired";
    return "Active";
  }, [quiz?.startDateTime, quiz?.endDateTime]);

  const qCount = parsedQuiz?.questions?.length || parsedQuiz?.totalQuestions || 10;
  const duration = parsedQuiz?.duration || 10;
  const passing = parsedQuiz?.passingMarks || Math.ceil(qCount / 2);

  return (
    <div
      className="border border-slate-700 bg-slate-900/60 p-4 rounded-xl text-slate-100 hover:border-slate-550 transition duration-200 cursor-pointer flex flex-col gap-2.5 h-full relative"
      onClick={() => {
        if (org) {
          router.push(`/quiz/${quiz._id}?org=${org}`);
        } else if (isStudent === "assigned") {
          router.push(
            `/quiz/${quiz._id}?channel_id=${urlParams.get("channel_id")}&org_id=${urlParams.get("org_id")}`
          );
        } else if (isStudent === "done") {
          // View details or review results
        } else {
          setQuizId(quiz._id);
        }
      }}
    >
      <div className="flex justify-between items-start gap-2">
        <h4 className="text-md font-bold text-white line-clamp-1">{quiz?.title}</h4>
        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
          status === "Upcoming" ? "bg-amber-950 text-amber-400 border border-amber-800" :
          status === "Expired" ? "bg-rose-950 text-rose-400 border border-rose-800" :
          "bg-green-950 text-green-400 border border-green-800"
        }`}>
          {status}
        </span>
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-400">
        <span>Topic: <strong className="text-blue-400">{quiz?.subject || "General"}</strong></span>
        <span>|</span>
        <span>Difficulty: <strong className="text-slate-200">{quiz?.difficulty || parsedQuiz?.difficulty || "Medium"}</strong></span>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-800 text-center">
        <div>
          <span className="text-[9px] text-slate-500 uppercase block font-bold">Questions</span>
          <span className="text-xs font-bold text-white">{qCount}</span>
        </div>
        <div>
          <span className="text-[9px] text-slate-500 uppercase block font-bold">Duration</span>
          <span className="text-xs font-bold text-white">{duration}m</span>
        </div>
        <div>
          <span className="text-[9px] text-slate-500 uppercase block font-bold">Passing</span>
          <span className="text-xs font-bold text-white">{passing}</span>
        </div>
      </div>

      {quiz?.startDateTime && (
        <div className="text-[10px] text-slate-550 mt-2 flex flex-col gap-0.5">
          <span>Start: {format(new Date(quiz.startDateTime), "dd MMM yyyy, hh:mm a")}</span>
          {quiz.endDateTime && <span>End: {format(new Date(quiz.endDateTime), "dd MMM yyyy, hh:mm a")}</span>}
        </div>
      )}

      <div className="flex justify-between items-center text-[10px] text-slate-500 mt-auto pt-2 border-t border-slate-800/40">
        <span>Created {format(new Date(quiz?.createdAt), "dd MMM, yyyy")}</span>
        {isStudent === "done" && points !== undefined && (
          <span className="bg-blue-950 text-blue-400 px-1.5 py-0.5 rounded font-bold">Score: {points} / {qCount}</span>
        )}
      </div>
    </div>
  );
};

export default QuizCard;
