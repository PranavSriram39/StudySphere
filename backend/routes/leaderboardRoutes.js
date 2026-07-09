const express = require("express");
const router = express.Router();
const protect = require("../middlewares/authMiddleware");
const {
  getOverallLeaderboard,
  getSubjectLeaderboard,
  getAssessmentLeaderboard,
  getOrganizationLeaderboard,
  getUserAnalytics,
  getRecentActivity,
  getTopics,
  getOrganizationMembers,
  getChannelMembers
} = require("../controllers/leaderboardController");

router.route("/overall").get(protect, getOverallLeaderboard);
router.route("/topics").get(protect, getTopics);
router.route("/subject/:subject").get(protect, getSubjectLeaderboard);
router.route("/assessment/:assessmentId").get(protect, getAssessmentLeaderboard);
router.route("/organization/:organizationId").get(protect, getOrganizationLeaderboard);
router.route("/analytics/user/:userId").get(protect, getUserAnalytics);
router.route("/recent-activity").get(protect, getRecentActivity);

router.route("/organization-members").get(protect, getOrganizationMembers);
router.route("/channel-members").get(protect, getChannelMembers);

module.exports = router;
