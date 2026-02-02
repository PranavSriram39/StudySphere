const { errorResponse } = require("../helpers/apiResponse");
const Message = require("../models/messageModel");

const fetchMsg = async (req, res) => {
  try {
    const { channelId } = req.params;

    const messages = await Message.find({
      channel: channelId,
    })
      .populate("sender", "name username ")
      .populate("receiver", "-password")
      .populate("channel");
    return messages;
  } catch (error) {
    console.log(error);
    return errorResponse({ res, message: "Something went wrong!" });
  }
};

const sendMsg = async (req, res) => {
  try {
    const { content, channel, type, receiver, mediaType, attachments } =
      req.body;

    const message = await Message.create({
      sender: req.user._id,
      type: type,
      receiver: receiver,
      content: content,
      channel: channel,
      mediaType: mediaType,
      attachments: attachments,
    });
    await message.populate("sender", "name");
    await message.populate("channel");
    await message.populate("receiver");

    return message;
  } catch (error) {
    console.log(error);
    return errorResponse({ res, message: "Something went wrong!" });
  }
};

const deleteMsg = async (req, res) => {
  try {
    const { messageId } = req.body;
    const deletedMessage = await Message.findOne({
      _id: messageId,
    });
    await Message.deleteOne({ _id: messageId });
    return deletedMessage;
  } catch (error) {
    console.log(error);
    return errorResponse({ res, message: "Something went wrong!" });
  }
};

module.exports = { fetch, fetchMsg, sendMsg, deleteMsg };
