const express = require("express");
const {
  register,
  login,
  getUser,
  forgotPassword,
  resetPassword,
  getUserProgress,
} = require("../controllers/userController");
const {
  getProfile,
  updateProfile,
  uploadAvatar,
  getActivity,
  getProgress,
  getUpcoming,
  getLeaderboard
} = require("../controllers/profileController");
const protect = require("../middlewares/authMiddleware");

const router = express.Router();
router.route("/register").post(register);
router.route("/login").post(login);
router.route("/user").get(protect, getUser);
router.route("/forgot-password").post(forgotPassword);
router.route("/reset-password").post(resetPassword);
router.route("/get-user-progress/:org").get(getUserProgress);

router.route("/profile").get(protect, getProfile).patch(protect, updateProfile);
router.route("/profile/upload-avatar").post(protect, uploadAvatar);
router.route("/profile/activity").get(protect, getActivity);
router.route("/profile/progress").get(protect, getProgress);
router.route("/profile/upcoming").get(protect, getUpcoming);
router.route("/profile/leaderboard-analytics").get(protect, getLeaderboard);

module.exports = router;
