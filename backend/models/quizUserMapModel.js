const mongoose = require("mongoose");

const quizUserMapModel = mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    quiz_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quizzes",
      required: true,
    },
    answers: { type: String, required: true },
    points: { type: Number, required: true },
    startTime: { type: Date },
    endTime: { type: Date },
    timeTaken: { type: Number }, // in seconds
    correct: { type: Number, default: 0 },
    wrong: { type: Number, default: 0 },
    skipped: { type: Number, default: 0 },
    totalMarks: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 },
    difficulty: { type: String, default: "Medium" },
    completionStatus: { type: String, default: "Completed" }, // Completed, Timed Out
    attemptNumber: { type: Number, default: 1 },
  },
  {
    timestamps: true,
  }
);

const QuizUserMap = mongoose.model("QuizUserMap", quizUserMapModel);

module.exports = QuizUserMap;
