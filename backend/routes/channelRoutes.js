const express = require("express");
const protect = require("../middlewares/authMiddleware");
const {
  createChannel,
  joinChannel,
  fetchAllChannels,
  renameChannel,
  fetchOneChannel,
  getMembers,
  channelList,
  channelLeave,
} = require("../controllers/channelController");

const router = express.Router();

router.route("/create-channel").post(protect, createChannel);
router.route("/join-channel").post(protect, joinChannel);
router.route("/fetch-all-channels").get(protect, fetchAllChannels);
router.route("/rename-channel").put(protect, renameChannel);
router.route("/fetch-channel/:channelId").get(protect, fetchOneChannel);
router.route("/get-members").post(protect, getMembers);
router.route("/channel-list").get(protect, channelList);
router.route("/leave-channel/:channelId").get(protect, channelLeave);

module.exports = router;
