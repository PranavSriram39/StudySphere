const asyncHandler = require("express-async-handler");
const { successResponse, errorResponse } = require("../helpers/apiResponse");
const {
  access,
  fetchMsg,
  sendMsg,
  deleteMsg,
} = require("../services/chatService");

const accessChat = asyncHandler(async (req, res) => {
  const { chatName, userList } = req.body;
  if (!chatName || !userList) {
    return errorResponse({ res, message: "Please fill required fields!" });
  }
  const data = await access(req, res);

  if (data) {
    successResponse({
      res,
      message: "Chat created successfully",
      data: data,
    });
  } else {
    return errorResponse({
      res,
      message: "Something went wrong! Unable to create chat",
    });
  }
});

const fetchAllMessages = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!channelId) {
    return errorResponse({ res, message: "Please fill required fields!" });
  }
  const data = await fetchMsg(req, res);
  if (data) {
    successResponse({
      res,
      message: "Messages fetched successfully",
      data: data,
    });
  } else {
    return errorResponse({
      res,
      message: "Something went wrong! Unable to fetch messages",
    });
  }
});

const sendMessage = asyncHandler(async (req, res) => {
  const { content, channel, type, receiver } = req.body;
  if (!channel || !type || !receiver) {
    return errorResponse({ res, message: "Please fill required fields!" });
  }
  const data = await sendMsg(req, res);
  if (data) {
    successResponse({
      res,
      message: "Message sent successfully",
      data: data,
    });
  } else {
    return errorResponse({
      res,
      message: "Something went wrong! Unable to send message",
    });
  }
});

const deletMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.body;
  if (!messageId) {
    return errorResponse({ res, message: "Please fill required fields!" });
  }
  const data = await deleteMsg(req, res);
  if (data) {
    successResponse({
      res,
      message: "Message deleted successfully",
      data: data,
    });
  } else {
    return errorResponse({
      res,
      message: "Something went wrong! Unable to send message",
    });
  }
});

module.exports = {
  accessChat,
  // fetchChat,
  fetchAllMessages,
  sendMessage,
  deletMessage,
};
