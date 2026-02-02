const mongoose = require("mongoose");
const slug = require("mongoose-slug-generator");
mongoose.plugin(slug);
const chatModel = mongoose.Schema(
  {
    chatName: {
      type: String,
      required: true,
    },
    users: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
    ],
    group_admin: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
    latest_message: {
      type: mongoose.Schema.ObjectId,
      ref: "Messages",
    },
    org: {
      type: String,
      ref: "Organizations",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Chats", chatModel);
