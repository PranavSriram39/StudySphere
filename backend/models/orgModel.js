const mongoose = require("mongoose");
const slug = require('mongoose-slug-generator');
mongoose.plugin(slug);
const orgModel = mongoose.Schema(
  {
    admin_id: {
      type: mongoose.Schema.ObjectId,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    org_code: {
      type: String,
      required: true,
    },
    users: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
    ],
    image: {
      type: String,
      required: true,
    },
    slug:{
      type: String,
      slug:"name"
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Organizations", orgModel);
