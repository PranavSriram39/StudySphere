const express = require("express");

const router = express.Router();
const protect = require("../middlewares/authMiddleware");
const {
  accessChat,
  fetchAllMessages,
  sendMessage,
  deletMessage,
} = require("../controllers/chatController");

// router.route("/access-chat").post(protect, accessChat);
router.route("/fetch-message/:channelId").get(protect, fetchAllMessages);
router.route("/send-message").post(protect, sendMessage);
router.route("/delete-message").post(protect, deletMessage);

module.exports = router;
