const mongoose = require("mongoose");

const quizModel = mongoose.Schema(
  {
    title: { type: String, required: true },
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
  },
  {
    timestamps: true,
  }
);

const Quizzes = mongoose.model("Quizzes", quizModel);

module.exports = Quizzes;
