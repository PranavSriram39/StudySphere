const asyncHandler = require("express-async-handler");
const Org = require("../models/orgModel");
const randomstring = require("randomstring");
const User = require("../models/userModel");
const { errorResponse } = require("../helpers/apiResponse");
const Channel = require("../models/channelModel");

const fetch = async (req, res) => {
  const { query } = req;
  const org = await Org.findOne({ slug: query.org });
  if (org) {
    await org.populate("users", "-password");
    await org.populate("admin_id", "-password");
  }
  return org;
};

const create = async (req, res) => {
  try {
    const { name, image } = req.body;

    if (!name || !image) {
      errorResponse({ res, message: "Please fill required fields!" });
    }
    const orgExists = await Org.findOne({ name });

    if (orgExists) {
      return errorResponse({
        res,
        message: "Organization with same name already exists!",
      });
    }

    const org = await Org.create({
      admin_id: req.user._id,
      name,
      org_code: randomstring.generate(7),
      image,
    });

    if (org) {
      const data = {
        _id: org._id,
        admin_id: org.admin_id,
        name: org.name,
        org_code: org.org_code,
        image: org.image,
        slug: org.slug,
      };

      //Linking user with org
      const user = await User.findOne({ _id: req.user._id });
      user.org_joined = org.slug;
      await user.save();

      return data;
    }
  } catch (error) {
    console.log(error);
    errorResponse({ res, message: "Something went wrong!" });
  }
};

const join = async (req, res) => {
  try {
    const { org_code } = req.body;

    if (!org_code) {
      errorResponse({ res, message: "Please fill required fields!" });
    }

    const org = await Org.findOne({ org_code: org_code });
    const channel = await Channel.findOne({
      $and: [{ name: "General" }, { org_id: org?._id }],
    });

    //By default storing user to general channel
    if (channel) {
      channel.users.push(req.user._id);
      await channel.save();
    }

    if (org) {
      //Storing id of the user to Org collection
      org.users.push(req.user._id);
      await org.save(); // updating document

      //Linking user with org
      const user = await User.findOne({ _id: req.user._id });
      user.org_joined = org.slug;
      await user.save();

      const userData = await org.populate("users", "-password"); // retrieving respective users data using populate
      return userData;
    }
  } catch (error) {
    console.log(error);
    errorResponse({ res, message: "Something went wrong!" });
  }
};

const leave = async (req, res) => {
  try {
    const { org_code } = req.body;

    if (!org_code) {
      errorResponse({ res, message: "Please fill required fields!" });
    }

    const org = await Org.findOne({ org_code: org_code });

    if (org) {
      //Retrieving id of the user to Org collection
      org.users.pull(req.user._id);
      await org.save(); // updating document

      //Linking user with org
      const user = await User.findOne({ _id: req.user._id });
      user.org_joined = undefined;
      await user.save();

      const userData = await org.populate("users", "-password"); // retrieving respective users data using populate
      return userData;
    }
  } catch (error) {
    console.log(error);
    errorResponse({ res, message: "Something went wrong!" });
  }
};
module.exports = { create, join, fetch, leave };
