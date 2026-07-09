const mongoose = require("mongoose");

const quizModel = mongoose.Schema(
  {
    title: { type: String, required: true },
    subject: { type: String, default: "General" },
    description: { type: String, default: "Generated from uploaded PDF" },
    quiz: { type: String, required: true },
    channel_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Channels",
    },
    org_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organizations",
    },
    is_active: { type: Boolean, required: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    published: { type: Boolean, default: true },
    startDateTime: { type: Date },
    endDateTime: { type: Date },
    negativeMarking: { type: Boolean, default: false },
    maxAttempts: { type: Number, default: 1 },
    instructions: { type: String, default: "" },
    randomizeQuestions: { type: Boolean, default: false },
    randomizeOptions: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

const Quizzes = mongoose.model("Quizzes", quizModel);

module.exports = Quizzes;
