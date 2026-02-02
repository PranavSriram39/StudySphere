import { activeOrgChannel } from "@/store/activeOrgChannel";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import React from "react";

const QuizCard = ({ setQuizId, quiz, isStudent, points, org }) => {
  const urlParams = new URLSearchParams(window.location.search);
  const router = useRouter();
  return (
    <div
      className="border border-gray-300 w-full p-3 rounded-md text-blue-500 cursor-pointer "
      onClick={() => {
        if(org){
          router.push(
            `/quiz/${quiz._id}?org=${org}`
          );
        }
        else if (isStudent === "assigned") {
          router.push(
            `/quiz/${quiz._id}?channel_id=${urlParams.get(
              "channel_id"
            )}&org_id=${urlParams.get("org_id")}`
          );
        } else if (isStudent === "done") {
        } else {
          setQuizId(quiz._id);
        }
      }}
    >
      <p className="text-xl">{quiz.title}</p>
      <div className="flex gap-7">
        <p className="text-gray-500">10 Questions</p>
        <p className="text-gray-500">
          {isStudent === "done" && points + "/"}10 Points
        </p>
      </div>
      <p>{format(new Date(quiz?.createdAt), "dd MMM, yyyy")}</p>
    </div>
  );
};

export default QuizCard;
