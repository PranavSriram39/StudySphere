const { errorResponse } = require("../helpers/apiResponse");
const Channel = require("../models/channelModel");
const Org = require("../models/orgModel");

const create = async (req, res) => {
  try {
    const { name, description, org_id } = req.body;

    const channel = await Channel.create({
      admin_id: req.user._id,
      name,
      description,
      org_id,
    });
    channel.users.push(req.user._id);
    await channel.save();
    await channel.populate("users", "-password");
    await channel.populate("admin_id", "-password");
    await channel.populate("org_id");

    if (channel) {
      const data = await Channel.findOne({ _id: channel._id });
      return data;
    }
    return null;
  } catch (error) {
    console.log(error);
  }
};

const join = async (req, res) => {
  try {
    const { channelId, org_id } = req.body;
    const channel = await Channel.findOne({ _id: channelId, org_id: org_id });
    if (!channel) {
      return null;
    }

    if (channel.users.includes(req.user._id)) {
      return "exists";
    }

    channel.users.push(req.user._id);
    await channel.save();
    await channel.populate("users", "-password");
    await channel.populate("admin_id", "-password");
    await channel.populate("org_id");

    return channel;
  } catch (error) {
    console.log(error);
  }
};

const fetchAll = async (req, res) => {
  try {
    const { org } = req.query;
    const org_id = await Org.findOne({ slug: org }).select("_id");
    const allChannels = await Channel.find({
      org_id,
      $and: [{ users: { $elemMatch: { $eq: req.user._id } } }],
    })
      .populate("admin_id", "-password")
      .populate("users", "-password")
      .sort({ updatedAt: -1 });
    return allChannels;
  } catch (error) {
    console.log(error);
  }
};

const rename = async (req, res) => {
  try {
    const { channelId, name } = req.body;
    const updatedChat = await Channel.findByIdAndUpdate(
      { _id: channelId },
      { name },
      { new: true }
    )
      .populate("users", "-password")
      .populate("admin_id", "-password");

    return updatedChat;
  } catch (error) {
    console.log(error);
  }
};

const fetch = async (req, res) => {
  try {
    const { channelId } = req.params;
    const channel = await Channel.findOne({
      _id: channelId,
      $and: [{ users: { $elemMatch: { $eq: req.user._id } } }],
    })
      .populate("admin_id", "-password")
      .populate("users", "-password");
    return channel;
  } catch (error) {
    console.log(error);
  }
};

const members = async (req, res) => {
  try {
    const { channelId, searchKey } = req.body;
    const channel = await Channel.findOne({ _id: channelId }).populate("users");

    if (!channel) {
      return null;
    }

    const matchingUsers = [];

    channel.users.forEach((user) => {
      if (
        (user.name && user.name.match(new RegExp(searchKey, "i"))) ||
        (user.email && user.email.match(new RegExp(searchKey, "i")))
      ) {
        matchingUsers.push(user);
      }
    });
    return matchingUsers;
  } catch (error) {
    console.log(error);
  }
};

const fetchList = async (req, res) => {
  try {
    const { org, search } = req.query;
    const org_id = await Org.findOne({ slug: org }).select("_id");
    const allChannels = await Channel.find({
      org_id,
    })
      .populate("admin_id", "-password")
      .populate("users", "-password")
      .sort({ updatedAt: -1 });

    const matchingChannels = [];

    allChannels.forEach((channel) => {
      if (channel.name && channel.name.match(new RegExp(search, "i"))) {
        matchingChannels.push(channel);
      }
    });
    return matchingChannels;
  } catch (error) {
    console.log(error);
  }
};

const leaveChannel = async (req, res) => {
  try {
    const { channelId } = req.params;
    const channel = await Channel.findById({
      _id: channelId,
    });
    channel.users.pull(req?.user?._id);
    await channel.save();
    return channel;
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  create,
  join,
  fetchAll,
  rename,
  fetch,
  members,
  fetchList,
  leaveChannel,
};
