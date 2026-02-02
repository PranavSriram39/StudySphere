const mongoose = require("mongoose");

const channelModel = mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    admin_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    org_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"Organizations",
    }
  },
  {
    timestamps: true,
  }
);

const Channel = mongoose.model("Channels", channelModel);

module.exports = Channel;
