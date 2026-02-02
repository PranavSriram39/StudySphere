import { Image } from "lucide-react";
import React from "react";

const Quiz = ({
  question,
  handleAnswer = () => void 0,
  listing = false,
  index,
}) => {
  return (
    <div className="py-8 lg:px-10 px-2">
      <p className="text-base font-semibold">
        Q {index} : {question?.question}
      </p>
      {question?.image && (
        <div className="p-4 md:max-w-[732px] max-w-[80vw] md:max-h-[420px] max-h-[80vh] relative object-contain aspect-video">
          <Image src={`${question?.image}?format=webp`} alt="" fill />
        </div>
      )}
      {question?.options?.map((option, index) => (
        <div
          key={index}
          onClick={() => handleAnswer(option)}
          className={`border-dashed border rounded-lg border-gray-400 mt-4 items-center cursor-pointer  ${
            question.userAnswer == option
              ? "bg-blue-100"
              : "hover:bg-slate-100"
          }`}
        >
          <div className="p-3 flex justify-between" name={option}>
            <span>{option}</span>
          </div>
        </div>
      ))}
      {listing && (
        <>
          <div
            className={`rounded-lg border-gray-400 mt-4 items-center cursor-pointer`}
          >
            <div className="flex">
              <span className="font-bold">Correct Answer : &nbsp;</span>
              <span>{question.answer}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Quiz;
