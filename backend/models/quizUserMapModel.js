const mongoose = require("mongoose");

const quizUserMapModel = mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    quiz_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quizzes",
    },
    answers: { type: String, required: true },
    points: { type: Number, required: true },
  },
  {
    timestamps: true,
  }
);

const QuizUserMap = mongoose.model("QuizUserMap", quizUserMapModel);

module.exports = QuizUserMap;
