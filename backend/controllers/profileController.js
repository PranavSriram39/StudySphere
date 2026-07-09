const asyncHandler = require("express-async-handler");
const { errorResponse, successResponse } = require("../helpers/apiResponse");
const {
  getProfileData,
  updateProfileData,
  getProgressReport,
  getUpcomingActivities,
  getLeaderboardAnalytics
} = require("../services/profileService");

const getProfile = asyncHandler(async (req, res) => {
  const data = await getProfileData(req, res);
  if (data === "not_found") {
    return errorResponse({ res, status: 404, message: "User profile not found" });
  }
  if (data) {
    successResponse({
      res,
      message: "Profile fetched successfully",
      data
    });
  } else {
    errorResponse({ res, message: "Error fetching profile data" });
  }
});

const updateProfile = asyncHandler(async (req, res) => {
  const data = await updateProfileData(req, res);
  if (data === "not_found") {
    return errorResponse({ res, status: 404, message: "User not found" });
  }
  if (data) {
    successResponse({
      res,
      message: "Profile updated successfully",
      data
    });
  } else {
    errorResponse({ res, message: "Error updating profile details" });
  }
});

const uploadAvatar = asyncHandler(async (req, res) => {
  const { image } = req.body;
  if (!image) {
    return errorResponse({ res, status: 400, message: "Image url is required" });
  }

  // Reuse updateProfileData logic to set the image and log activity
  req.body = { image };
  const data = await updateProfileData(req, res);
  if (data) {
    successResponse({
      res,
      message: "Avatar uploaded and saved successfully",
      data: { image: data.image }
    });
  } else {
    errorResponse({ res, message: "Failed to upload avatar" });
  }
});

const getActivity = asyncHandler(async (req, res) => {
  const User = require("../models/userModel");
  const user = await User.findById(req.user._id);
  if (user) {
    successResponse({
      res,
      message: "Activity logs fetched successfully",
      data: user.recentActivities || []
    });
  } else {
    errorResponse({ res, status: 404, message: "User not found" });
  }
});

const getProgress = asyncHandler(async (req, res) => {
  const data = await getProgressReport(req, res);
  if (data) {
    successResponse({
      res,
      message: "Progress report fetched successfully",
      data
    });
  } else {
    errorResponse({ res, message: "Failed to fetch progress report" });
  }
});

const getUpcoming = asyncHandler(async (req, res) => {
  const data = await getUpcomingActivities(req, res);
  if (data) {
    successResponse({
      res,
      message: "Upcoming activities fetched successfully",
      data
    });
  } else {
    errorResponse({ res, message: "Failed to fetch upcoming activities" });
  }
});

const getLeaderboard = asyncHandler(async (req, res) => {
  const data = await getLeaderboardAnalytics(req, res);
  if (data) {
    successResponse({
      res,
      message: "Leaderboard analytics fetched successfully",
      data
    });
  } else {
    errorResponse({ res, message: "Failed to fetch leaderboard analytics" });
  }
});

module.exports = {
  getProfile,
  updateProfile,
  uploadAvatar,
  getActivity,
  getProgress,
  getUpcoming,
  getLeaderboard
};
