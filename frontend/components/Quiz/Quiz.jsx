import React from "react";

const Quiz = ({
  question,
  handleAnswer = () => void 0,
  listing = false,
  index,
}) => {
  const options = question?.options || [];
  const correctAnswer = question?.correctAnswer || question?.answer;
  const isSelected = (optId) => {
    return question?.userAnswer === optId;
  };

  return (
    <div className="py-6 lg:px-10 px-4 bg-white">
      <div className="flex justify-between items-start gap-4">
        <p className="text-base font-semibold text-gray-800">
          Question {index}: {question?.question}
        </p>
        {!listing && question?.marks && (
          <span className="text-xs bg-gray-100 border text-gray-600 px-2.5 py-1 rounded-full font-medium shrink-0">
            {question.marks} Point{question.marks > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {!listing && question?.topic && (
        <p className="text-xs text-blue-500 mt-1 font-medium">
          Topic: {question.topic} | Difficulty: {question.difficulty || "Medium"}
        </p>
      )}

      {question?.image && (
        <div className="my-4 relative max-h-[300px] rounded-lg overflow-hidden">
          <img src={`${question.image}`} alt="Quiz illustration" className="max-h-[300px] object-contain rounded-lg" />
        </div>
      )}

      {options.map((option, idx) => {
        const isOptObj = typeof option === "object" && option !== null;
        const optId = isOptObj ? option.id : option;
        const optText = isOptObj ? option.text : option;
        const selected = isSelected(optId);

        return (
          <div
            key={idx}
            onClick={() => !listing && handleAnswer(optId)}
            className={`border rounded-lg mt-4 items-center cursor-pointer transition duration-150 ${
              selected
                ? "bg-blue-50 border-blue-500 text-blue-900 shadow-sm"
                : listing
                ? "border-gray-200 cursor-default bg-gray-50 text-gray-700"
                : "border-gray-300 hover:bg-slate-50 hover:border-gray-400 text-gray-700"
            }`}
          >
            <div className="p-3 flex items-center gap-3">
              {!listing && (
                <input
                  type="radio"
                  checked={selected}
                  readOnly
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
              )}
              <span className="font-bold text-gray-500">{optId}:</span>
              <span className="text-sm font-medium">{optText}</span>
            </div>
          </div>
        );
      })}

      {listing && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-900 flex flex-col gap-2">
          <div>
            <span className="font-bold text-green-800">Correct Answer: </span>
            <span className="font-semibold bg-green-100 px-2 py-0.5 rounded text-green-800">{correctAnswer}</span>
          </div>
          {question?.explanation && (
            <div>
              <span className="font-bold text-green-800">Explanation: </span>
              <span className="text-green-700">{question.explanation}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Quiz;
