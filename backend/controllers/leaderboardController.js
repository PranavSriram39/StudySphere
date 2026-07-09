const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const QuizUserMap = require("../models/quizUserMapModel");
const Quiz = require("../models/quizModel");
const Org = require("../models/orgModel");
const mongoose = require("mongoose");
const { successResponse, errorResponse } = require("../helpers/apiResponse");

// Helper to compute Rank Score and metrics for a list of users
const calculateLeaderboardData = async (orgId, filters = {}) => {
  // Resolve org slug to ObjectId
  let orgDoc = await Org.findOne({ slug: orgId });
  if (!orgDoc && mongoose.isValidObjectId(orgId)) {
    orgDoc = await Org.findById(orgId);
  }
  const orgObjectId = orgDoc ? orgDoc._id : null;

  // Get all users in organization
  const query = { org_joined: orgId };
  if (filters.username) {
    query.name = { $regex: filters.username, $options: "i" };
  }
  const users = await User.find(query, "name username email image currentStreak longestStreak badges createdAt");

  // Get all quizzes in organization to filter attempts
  const quizQuery = { org_id: orgObjectId };
  if (filters.subject) {
    quizQuery.subject = { $regex: filters.subject, $options: "i" };
  }
  if (filters.assessmentId) {
    quizQuery._id = filters.assessmentId;
  }
  
  const quizzes = await Quiz.find(quizQuery);
  const quizIds = quizzes.map(q => q._id);

  // Get all submissions
  const submissionQuery = { quiz_id: { $in: quizIds } };
  if (filters.dateRange) {
    submissionQuery.createdAt = {
      $gte: filters.dateRange.start,
      $lte: filters.dateRange.end
    };
  }
  if (filters.difficulty) {
    submissionQuery.difficulty = filters.difficulty;
  }

  const submissions = await QuizUserMap.find(submissionQuery).populate("quiz_id");

  // Group submissions by user
  const userSubmissions = {};
  submissions.forEach(sub => {
    const uid = sub.user_id.toString();
    if (!userSubmissions[uid]) {
      userSubmissions[uid] = [];
    }
    userSubmissions[uid].push(sub);
  });

  const leaderboard = [];

  for (const user of users) {
    const attempts = userSubmissions[user._id.toString()] || [];
    if (attempts.length === 0 && !filters.includeAll) {
      continue; // Skip users with no attempts in overall rankings unless explicitly requested
    }

    const totalAttempts = attempts.length;
    const completedAttempts = attempts.filter(a => a.completionStatus === "Completed").length;

    let totalScore = 0;
    let totalPossibleScore = 0;
    let totalCorrect = 0;
    let totalWrong = 0;
    let totalSkipped = 0;
    let totalTimeTaken = 0;
    let highestScore = 0;
    let lowestScore = totalAttempts > 0 ? 999999 : 0;
    let fastestCompletion = totalAttempts > 0 ? 999999 : 0;
    let totalQuizDurations = 0;

    attempts.forEach(a => {
      totalScore += a.points || 0;
      
      let quizMarks = a.totalMarks;
      if (!quizMarks && a.quiz_id) {
        try {
          const parsed = typeof a.quiz_id.quiz === 'string' ? JSON.parse(a.quiz_id.quiz) : a.quiz_id.quiz;
          quizMarks = parsed?.totalMarks ?? parsed?.questions?.length ?? (parsed?.questions ? parsed.questions.reduce((sum, q) => sum + (q.marks ?? 1), 0) : 10);
        } catch (e) {
          quizMarks = 10;
        }
      }
      totalPossibleScore += quizMarks || 10;
      totalCorrect += a.correct || 0;
      totalWrong += a.wrong || 0;
      totalSkipped += a.skipped || 0;
      totalTimeTaken += a.timeTaken || 0;

      if (a.points > highestScore) highestScore = a.points;
      if (a.points < lowestScore) lowestScore = a.points;
      if (a.timeTaken > 0 && a.timeTaken < fastestCompletion) fastestCompletion = a.timeTaken;

      // Extract duration from quiz object
      let dur = 10;
      try {
        dur = a.quiz_id?.quiz ? (JSON.parse(a.quiz_id.quiz).duration || 10) : 10;
      } catch (e) {
        dur = 10;
      }
      totalQuizDurations += dur * 60; // in seconds
    });

    if (lowestScore === 999999) lowestScore = 0;
    if (fastestCompletion === 999999) fastestCompletion = 0;

    totalPossibleScore = Math.max(1, totalPossibleScore);

    const overallPercentage = totalPossibleScore > 0 ? (totalScore / totalPossibleScore) * 100 : 0;
    const overallAccuracy = (totalCorrect + totalWrong) > 0 ? (totalCorrect / (totalCorrect + totalWrong)) * 100 : 0;
    const completionRate = totalAttempts > 0 ? (completedAttempts / totalAttempts) * 100 : 0;
    const consistency = Math.min((user.currentStreak || 0) * 10, 100);

    // Speed score = average percentage of time remaining
    let speedScore = 0;
    if (totalAttempts > 0 && totalQuizDurations > 0) {
      const avgRatio = totalTimeTaken / totalQuizDurations;
      speedScore = Math.max(0, (1 - avgRatio) * 100);
    }

    // Weighted ranking formula:
    // 40% Total Score, 25% Accuracy, 15% Completion Rate, 10% Consistency, 10% Speed
    const rankScore = (0.40 * overallPercentage) +
                      (0.25 * overallAccuracy) +
                      (0.15 * completionRate) +
                      (0.10 * consistency) +
                      (0.10 * speedScore);

    // Determine performance level
    let performanceLevel = "Bronze";
    if (rankScore >= 85) performanceLevel = "Grandmaster";
    else if (rankScore >= 70) performanceLevel = "Master";
    else if (rankScore >= 50) performanceLevel = "Gold";
    else if (rankScore >= 35) performanceLevel = "Silver";

    leaderboard.push({
      userId: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      image: user.image,
      organization: orgDoc ? orgDoc.name : (user.org_joined || "StudySphere"),
      totalAssessments: quizzes.length,
      completedAssessments: totalAttempts,
      pendingAssessments: Math.max(0, quizzes.length - totalAttempts),
      totalAttempts,
      overallMarks: totalScore,
      overallScore: `${totalScore} / ${totalPossibleScore}`,
      currentStreak: user.currentStreak || 0,
      longestStreak: user.longestStreak || 0,
      badges: user.badges || [],
      overallPercentage,
      overallAccuracy,
      totalCorrect,
      totalWrong,
      totalSkipped,
      avgScore: totalAttempts > 0 ? (totalScore / totalAttempts) : 0,
      highestScore,
      lowestScore,
      avgTimeTaken: totalAttempts > 0 ? (totalTimeTaken / totalAttempts) : 0,
      fastestCompletion,
      totalTimeSpent: totalTimeTaken,
      lastAssessmentDate: attempts.length > 0 ? attempts[0].createdAt : null,
      rankScore,
      performanceLevel,
      rankMovement: "same",
      status: totalAttempts > 0 ? "Active" : "Inactive"
    });
  }

  // Sort by weighted rank score, tie-breaking on accuracy, time taken, and last attempt date
  leaderboard.sort((a, b) => {
    if (Math.abs(b.rankScore - a.rankScore) > 0.001) {
      return b.rankScore - a.rankScore;
    }
    if (Math.abs(b.overallAccuracy - a.overallAccuracy) > 0.001) {
      return b.overallAccuracy - a.overallAccuracy;
    }
    if (a.avgTimeTaken !== b.avgTimeTaken) {
      return a.avgTimeTaken - b.avgTimeTaken;
    }
    if (a.lastAssessmentDate && b.lastAssessmentDate) {
      return new Date(a.lastAssessmentDate) - new Date(b.lastAssessmentDate);
    }
    return 0;
  });

  // Assign Rank ID
  leaderboard.forEach((item, index) => {
    item.rank = index + 1;
    item.id = index + 1; // for datagrid row id mapping
  });

  return leaderboard;
};

// GET /api/leaderboard/overall
const getOverallLeaderboard = asyncHandler(async (req, res) => {
  try {
    const orgId = req.query.org_id || req.headers["org-id"];
    if (!orgId) {
      return errorResponse({ res, message: "Organization ID is required!", status: 400 });
    }

    let orgDoc = await Org.findOne({ slug: orgId });
    if (!orgDoc && mongoose.isValidObjectId(orgId)) {
      orgDoc = await Org.findById(orgId);
    }
    if (!orgDoc) {
      return errorResponse({ res, message: "Organization not found!", status: 404 });
    }

    const isMember = orgDoc.users.some(u => u.toString() === req.user._id.toString()) || orgDoc.admin_id.toString() === req.user._id.toString();
    if (!isMember) {
      return errorResponse({ res, message: "Forbidden: You are not authorized to view this organization's leaderboard", status: 403 });
    }

    const { username, topic, subject, difficulty, dateFilter } = req.query;

    const filters = { username, topic, subject, difficulty };

    // Handle date filters
    if (dateFilter) {
      const now = new Date();
      let start = new Date();
      if (dateFilter === "today") {
        start.setHours(0, 0, 0, 0);
      } else if (dateFilter === "yesterday") {
        start.setDate(start.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        const end = new Date();
        end.setDate(end.getDate() - 1);
        end.setHours(23, 59, 59, 999);
        filters.dateRange = { start, end };
      } else if (dateFilter === "week") {
        start.setDate(start.getDate() - 7);
      } else if (dateFilter === "month") {
        start.setDate(start.getDate() - 30);
      } else if (dateFilter === "quarter") {
        start.setDate(start.getDate() - 90);
      }

      if (dateFilter !== "yesterday") {
        filters.dateRange = { start, end: now };
      }
    }

    const leaderboard = await calculateLeaderboardData(orgId, filters);
    successResponse({
      res,
      message: "Overall leaderboard fetched successfully!",
      data: leaderboard
    });
  } catch (error) {
    console.error(error);
    errorResponse({ res, message: "Failed to load leaderboard." });
  }
});

// GET /api/leaderboard/topics
const getTopics = asyncHandler(async (req, res) => {
  try {
    const orgId = req.query.org_id || req.headers["org-id"];
    if (!orgId) {
      return errorResponse({ res, message: "Organization ID is required!", status: 400 });
    }

    let orgDoc = await Org.findOne({ slug: orgId });
    if (!orgDoc && mongoose.isValidObjectId(orgId)) {
      orgDoc = await Org.findById(orgId);
    }
    if (!orgDoc) {
      return errorResponse({ res, message: "Organization not found!", status: 404 });
    }

    const isMember = orgDoc.users.some(u => u.toString() === req.user._id.toString()) || orgDoc.admin_id.toString() === req.user._id.toString();
    if (!isMember) {
      return errorResponse({ res, message: "Forbidden: You are not authorized to view this organization's topics", status: 403 });
    }

    const orgObjectId = orgDoc._id;

    const topics = await Quiz.distinct("subject", { org_id: orgObjectId });
    
    successResponse({
      res,
      message: "Topics fetched successfully!",
      data: topics.filter(Boolean).sort()
    });
  } catch (error) {
    console.error(error);
    errorResponse({ res, message: "Failed to load topics." });
  }
});

// GET /api/leaderboard/subject/:subject
const getSubjectLeaderboard = asyncHandler(async (req, res) => {
  try {
    const orgId = req.query.org_id || req.headers["org-id"];
    const { subject } = req.params;
    if (!orgId) {
      return errorResponse({ res, message: "Organization ID is required!", status: 400 });
    }

    let orgDoc = await Org.findOne({ slug: orgId });
    if (!orgDoc && mongoose.isValidObjectId(orgId)) {
      orgDoc = await Org.findById(orgId);
    }
    if (!orgDoc) {
      return errorResponse({ res, message: "Organization not found!", status: 404 });
    }

    const isMember = orgDoc.users.some(u => u.toString() === req.user._id.toString()) || orgDoc.admin_id.toString() === req.user._id.toString();
    if (!isMember) {
      return errorResponse({ res, message: "Forbidden: You are not authorized to view this organization's leaderboard", status: 403 });
    }

    const leaderboard = await calculateLeaderboardData(orgId, { subject });
    successResponse({
      res,
      message: "Topic-wise leaderboard fetched successfully!",
      data: leaderboard
    });
  } catch (error) {
    console.error(error);
    errorResponse({ res, message: "Failed to load subject leaderboard." });
  }
});

// GET /api/leaderboard/assessment/:assessmentId
const getAssessmentLeaderboard = asyncHandler(async (req, res) => {
  try {
    const orgId = req.query.org_id || req.headers["org-id"];
    const { assessmentId } = req.params;
    if (!orgId) {
      return errorResponse({ res, message: "Organization ID is required!", status: 400 });
    }

    let orgDoc = await Org.findOne({ slug: orgId });
    if (!orgDoc && mongoose.isValidObjectId(orgId)) {
      orgDoc = await Org.findById(orgId);
    }
    if (!orgDoc) {
      return errorResponse({ res, message: "Organization not found!", status: 404 });
    }

    const isMember = orgDoc.users.some(u => u.toString() === req.user._id.toString()) || orgDoc.admin_id.toString() === req.user._id.toString();
    if (!isMember) {
      return errorResponse({ res, message: "Forbidden: You are not authorized to view this organization's leaderboard", status: 403 });
    }

    const leaderboard = await calculateLeaderboardData(orgId, { assessmentId });
    successResponse({
      res,
      message: "Assessment-wise leaderboard fetched successfully!",
      data: leaderboard
    });
  } catch (error) {
    console.error(error);
    errorResponse({ res, message: "Failed to load assessment leaderboard." });
  }
});

// GET /api/leaderboard/organization/:organizationId
const getOrganizationLeaderboard = asyncHandler(async (req, res) => {
  try {
    const { organizationId } = req.params;

    let orgDoc = await Org.findOne({ slug: organizationId });
    if (!orgDoc && mongoose.isValidObjectId(organizationId)) {
      orgDoc = await Org.findById(organizationId);
    }
    if (!orgDoc) {
      return errorResponse({ res, message: "Organization not found!", status: 404 });
    }

    const isMember = orgDoc.users.some(u => u.toString() === req.user._id.toString()) || orgDoc.admin_id.toString() === req.user._id.toString();
    if (!isMember) {
      return errorResponse({ res, message: "Forbidden: You are not authorized to view this organization's stats", status: 403 });
    }

    // Get stats across all members in this organization
    const leaderboard = await calculateLeaderboardData(organizationId, { includeAll: true });
    
    if (leaderboard.length === 0) {
      return successResponse({
        res,
        message: "No organization stats found",
        data: {
          orgName: organizationId,
          topPerformer: "N/A",
          avgScore: 0,
          avgAccuracy: 0,
          totalMembers: 0,
          totalAssessments: 0,
          totalAttempts: 0
        }
      });
    }

    const totalAttempts = leaderboard.reduce((sum, item) => sum + item.totalAttempts, 0);
    const avgScore = leaderboard.reduce((sum, item) => sum + item.avgScore, 0) / leaderboard.length;
    const avgAccuracy = leaderboard.reduce((sum, item) => sum + item.overallAccuracy, 0) / leaderboard.length;
    
    // Unique assessments count
    const users = leaderboard.map(l => l.userId);
    const uniqueQuizzes = await QuizUserMap.distinct("quiz_id", { user_id: { $in: users } });

    successResponse({
      res,
      message: "Organization-wise metrics fetched!",
      data: {
        orgName: organizationId,
        topPerformer: leaderboard[0]?.name || "N/A",
        avgScore: avgScore || 0,
        avgAccuracy: avgAccuracy || 0,
        totalMembers: leaderboard.length,
        totalAssessments: uniqueQuizzes.length,
        totalAttempts: totalAttempts || 0,
        mostActiveUser: leaderboard.sort((a,b) => b.totalAttempts - a.totalAttempts)[0]?.name || "N/A"
      }
    });
  } catch (error) {
    console.error(error);
    errorResponse({ res, message: "Failed to load organization stats." });
  }
});

// GET /api/analytics/user/:userId
const getUserAnalytics = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    const orgId = req.query.org_id || req.headers["org-id"];


    const user = await User.findById(userId, "name username email image currentStreak longestStreak badges createdAt org_joined");
    if (!user) {
      return errorResponse({ res, message: "User not found!" });
    }

    // Get all user attempts
    const attempts = await QuizUserMap.find({ user_id: userId }).populate("quiz_id").sort({ createdAt: -1 });

    // Compute overall rank in organization
    let rank = "N/A";
    if (orgId) {
      const globalLeaderboard = await calculateLeaderboardData(orgId);
      const foundIdx = globalLeaderboard.findIndex(l => l.userId.toString() === userId);
      if (foundIdx !== -1) {
        rank = foundIdx + 1;
      }
    }

    // Attempt history items
    const history = attempts.map((a, idx) => {
      const qObj = a.quiz_id?.quiz ? JSON.parse(a.quiz_id.quiz) : {};
      const correct = a.correct ?? a.points ?? 0;
      
      let quizMarks = a.totalMarks;
      if (!quizMarks && a.quiz_id) {
        try {
          const parsed = typeof a.quiz_id.quiz === 'string' ? JSON.parse(a.quiz_id.quiz) : a.quiz_id.quiz;
          quizMarks = parsed?.totalMarks ?? parsed?.questions?.length ?? 10;
        } catch (e) {
          quizMarks = 10;
        }
      }
      const total = quizMarks || 10;
      const percentage = a.percentage ?? (total > 0 ? (correct / total) * 100 : 0);
      const attempted = correct + (a.wrong ?? 0);
      const computedAccuracy = attempted > 0 ? (correct / attempted) * 100 : 0;

      return {
        id: a._id,
        assessmentName: qObj.title || a.quiz_id?.title || "Assessment",
        subject: a.quiz_id?.subject || "General",
        topic: qObj.questions?.[0]?.topic || a.quiz_id?.subject || "General",
        dateAttempted: a.createdAt,
        startTime: a.startTime || a.createdAt,
        endTime: a.endTime || a.createdAt,
        timeTaken: a.timeTaken || 0,
        scoreObtained: correct,
        totalMarks: total,
        percentage,
        accuracy: computedAccuracy,
        correct,
        wrong: a.wrong ?? 0,
        skipped: a.skipped ?? 0,
        result: correct >= (qObj.passingMarks || Math.ceil(total / 2)) ? "Pass" : "Fail",
        attemptNumber: a.attemptNumber || 1,
        difficulty: a.difficulty || "Medium",
        completionStatus: a.completionStatus || "Completed",
        rank: idx + 1
      };
    });

    // Summary calculations
    const totalAttempts = attempts.length;
    const completedAttempts = attempts.filter(a => a.completionStatus === "Completed").length;
    let totalCorrect = 0;
    let totalWrong = 0;
    let totalSkipped = 0;
    let totalScore = 0;
    let totalPossible = 0;
    let totalTimeTaken = 0;
    let highestScore = 0;
    let lowestScore = totalAttempts > 0 ? 999999 : 0;
    let fastestAttempt = totalAttempts > 0 ? 999999 : 0;
    let slowestAttempt = 0;

    const topicStats = {};

    attempts.forEach(a => {
      const correct = a.correct ?? a.points ?? 0;
      totalCorrect += correct;
      totalWrong += a.wrong ?? 0;
      totalSkipped += a.skipped ?? 0;
      totalScore += correct;

      let quizMarks = a.totalMarks;
      if (!quizMarks && a.quiz_id) {
        try {
          const parsed = typeof a.quiz_id.quiz === 'string' ? JSON.parse(a.quiz_id.quiz) : a.quiz_id.quiz;
          quizMarks = parsed?.totalMarks ?? parsed?.questions?.length ?? 10;
        } catch (e) {
          quizMarks = 10;
        }
      }
      totalPossible += quizMarks || 10;
      totalTimeTaken += a.timeTaken || 0;

      if (correct > highestScore) highestScore = correct;
      if (correct < lowestScore) lowestScore = correct;

      const timeT = a.timeTaken || 0;
      if (timeT > 0 && timeT < fastestAttempt) fastestAttempt = timeT;
      if (timeT > slowestAttempt) slowestAttempt = timeT;

      const topic = a.quiz_id?.subject || "General";
      if (!topicStats[topic]) {
        topicStats[topic] = { correct: 0, total: 0 };
      }
      topicStats[topic].correct += correct;
      topicStats[topic].total += correct + (a.wrong ?? 0);
    });

    if (lowestScore === 999999) lowestScore = 0;
    if (fastestAttempt === 999999) fastestAttempt = 0;

    // Get total assessments in organization to compute pending
    let orgDoc = null;
    if (user.org_joined) {
      orgDoc = await Org.findOne({ slug: user.org_joined });
      if (!orgDoc && mongoose.isValidObjectId(user.org_joined)) {
        orgDoc = await Org.findById(user.org_joined);
      }
    }
    const orgObjectId = orgDoc ? orgDoc._id : null;
    const quizzes = orgObjectId ? await Quiz.find({ org_id: orgObjectId }) : [];
    const totalAssessments = quizzes.length;
    const pendingAssessments = Math.max(0, totalAssessments - totalAttempts);

    // Compute weekly/monthly progress (attempts in last 7 / 30 days)
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const weeklyProgress = attempts.filter(a => new Date(a.createdAt) >= sevenDaysAgo).length;
    const monthlyProgress = attempts.filter(a => new Date(a.createdAt) >= thirtyDaysAgo).length;

    let bestTopic = "N/A";
    let weakestTopic = "N/A";
    let maxAcc = -1;
    let minAcc = 101;

    Object.keys(topicStats).forEach(topic => {
      const { correct, total } = topicStats[topic];
      const acc = total > 0 ? (correct / total) * 100 : 0;
      if (acc > maxAcc) {
        maxAcc = acc;
        bestTopic = topic;
      }
      if (acc < minAcc) {
        minAcc = acc;
        weakestTopic = topic;
      }
    });

    successResponse({
      res,
      message: "User analytics fetched successfully!",
      data: {
        userInfo: {
          name: user.name,
          username: user.username,
          email: user.email,
          image: user.image,
          organization: orgDoc ? orgDoc.name : (user.org_joined || "None"),
          joinedDate: user.createdAt,
          role: "Student",
          badges: user.badges || [],
          currentStreak: user.currentStreak || 0,
          longestStreak: user.longestStreak || 0
        },
        summary: {
          totalAssessments,
          totalAttempts,
          completedAttempts,
          pendingAssessments,
          avgScore: totalAttempts > 0 ? (totalScore / totalAttempts) : 0,
          highestScore,
          lowestScore,
          avgAccuracy: (totalCorrect + totalWrong) > 0 ? (totalCorrect / (totalCorrect + totalWrong)) * 100 : 0,
          totalTimeSpent: totalTimeTaken,
          averageTime: totalAttempts > 0 ? (totalTimeTaken / totalAttempts) : 0,
          fastestAttempt,
          slowestAttempt,
          bestTopic,
          weakestTopic,
          currentRank: rank,
          badgesCount: (user.badges || []).length,
          totalCorrect,
          totalWrong,
          totalSkipped,
          correctAnswers: totalCorrect,
          wrongAnswers: totalWrong,
          skippedAnswers: totalSkipped,
          weeklyProgress,
          monthlyProgress
        },
        history
      }
    });
  } catch (error) {
    console.error(error);
    errorResponse({ res, message: "Failed to load user analytics." });
  }
});

// GET /api/leaderboard/recent-activity
const getRecentActivity = asyncHandler(async (req, res) => {
  try {
    const orgId = req.query.org_id || req.headers["org-id"];
    if (!orgId) {
      return errorResponse({ res, message: "Organization ID is required!" });
    }

    // Resolve org slug to ObjectId
    let orgDoc = await Org.findOne({ slug: orgId });
    if (!orgDoc && mongoose.isValidObjectId(orgId)) {
      orgDoc = await Org.findById(orgId);
    }
    const orgObjectId = orgDoc ? orgDoc._id : null;

    // Get quizzes of the organization
    const quizzes = await Quiz.find({ org_id: orgObjectId });
    const quizIds = quizzes.map(q => q._id);

    // Get 10 recent submissions
    const recentSubmissions = await QuizUserMap.find({ quiz_id: { $in: quizIds } })
      .populate("user_id", "name username image")
      .populate("quiz_id", "title subject")
      .sort({ createdAt: -1 })
      .limit(10);

    const activities = recentSubmissions.map(sub => {
      const qTitle = sub.quiz_id?.title || "Assessment";
      const uName = sub.user_id?.name || sub.user_id?.username || "Student";
      
      let message = `${uName} completed ${qTitle} Assessment`;
      if (sub.percentage === 100) {
        message = `${uName} scored 100% on ${qTitle}!`;
      }

      return {
        id: sub._id,
        user: {
          name: uName,
          image: sub.user_id?.image
        },
        message,
        timestamp: sub.createdAt
      };
    });

    successResponse({
      res,
      message: "Recent activity fetched!",
      data: activities
    });
  } catch (error) {
    console.error(error);
    errorResponse({ res, message: "Failed to load recent activities." });
  }
});

// Award badges and streaks automation logic exported to be called in quiz submit route
const awardBadgesAndStreaks = async (user_id, latestAttempt) => {
  try {
    const user = await User.findById(user_id);
    if (!user) return;

    // 1. Calculate Streaks
    const allAttempts = await QuizUserMap.find({ user_id }).sort({ createdAt: -1 });
    
    let currentStreak = user.currentStreak || 0;
    let longestStreak = user.longestStreak || 0;

    if (allAttempts.length === 1) {
      currentStreak = 1;
    } else if (allAttempts.length > 1) {
      const latestDate = new Date(allAttempts[0].createdAt).setHours(0,0,0,0);
      const prevDate = new Date(allAttempts[1].createdAt).setHours(0,0,0,0);
      const diffTime = Math.abs(latestDate - prevDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        currentStreak += 1;
      } else if (diffDays > 1) {
        currentStreak = 1;
      }
    }

    if (currentStreak > longestStreak) {
      longestStreak = currentStreak;
    }

    // 2. Award Badges
    const badges = new Set(user.badges || []);

    if (latestAttempt.correct === latestAttempt.totalMarks && latestAttempt.totalMarks > 0) {
      badges.add("Perfect Score");
    }

    if (latestAttempt.timeTaken > 0 && latestAttempt.timeTaken < 60 && latestAttempt.totalMarks >= 5) {
      badges.add("Fast Solver");
    }

    if (latestAttempt.accuracy === 100) {
      badges.add("Top Performer");
    }

    const perfectCount = allAttempts.filter(a => a.correct === a.totalMarks && a.totalMarks > 0).length;
    if (perfectCount >= 3) {
      badges.add("Quiz Champion");
    }

    if (allAttempts.length >= 100) {
      badges.add("100 Assessments Club");
    }

    const totalCorrect = allAttempts.reduce((sum, a) => sum + (a.correct || 0), 0);
    if (totalCorrect >= 500) {
      badges.add("500 Questions Solved");
    }

    const quiz = await Quiz.findById(latestAttempt.quiz_id);
    if (quiz) {
      const parsedQuiz = JSON.parse(quiz.quiz);
      const questions = parsedQuiz.questions || [];
      const topics = questions.map(q => q.topic).filter(Boolean);
      
      const isPerfectAttempt = latestAttempt.correct === latestAttempt.totalMarks;
      if (isPerfectAttempt) {
        topics.forEach(t => {
          const lower = t.toLowerCase();
          if (lower.includes("java") && !lower.includes("javascript")) badges.add("Java Expert");
          else if (lower.includes("react")) badges.add("React Expert");
          else if (lower.includes("mongodb")) badges.add("MongoDB Expert");
          else if (lower.includes("network") || lower.includes("subnetting")) badges.add("Network Master");
        });
      }
    }

    if (currentStreak >= 30) badges.add("Gold");
    else if (currentStreak >= 15) badges.add("Silver");
    else if (currentStreak >= 7) badges.add("Bronze");

    user.currentStreak = currentStreak;
    user.longestStreak = longestStreak;
    user.badges = Array.from(badges);
    await user.save();

  } catch (error) {
    console.error("Error in awardBadgesAndStreaks:", error);
  }
};

const getOrganizationMembers = asyncHandler(async (req, res) => {
  try {
    const orgId = req.query.org_id || req.headers["org-id"];
    if (!orgId) {
      return errorResponse({ res, message: "Organization ID is required!", status: 400 });
    }

    let orgDoc = await Org.findOne({ slug: orgId });
    if (!orgDoc && mongoose.isValidObjectId(orgId)) {
      orgDoc = await Org.findById(orgId);
    }
    if (!orgDoc) {
      return errorResponse({ res, message: "Organization not found!", status: 404 });
    }

    const isMember = orgDoc.users.some(uid => uid.toString() === req.user._id.toString()) || orgDoc.admin_id.toString() === req.user._id.toString();
    if (!isMember) {
      return errorResponse({ res, message: "Forbidden: You are not a member of this organization", status: 403 });
    }

    const allMembersStats = await calculateLeaderboardData(orgDoc.slug, { includeAll: true });

    const Channel = require("../models/channelModel");
    const users = await User.find({ org_joined: orgDoc.slug });
    const userMap = {};
    users.forEach(u => {
      userMap[u._id.toString()] = u;
    });

    const channels = await Channel.find({ org_id: orgDoc._id });

    const members = allMembersStats.map(stat => {
      const userDoc = userMap[stat.userId.toString()];
      if (!userDoc) return null;

      let role = "Member";
      if (orgDoc.admin_id.toString() === userDoc._id.toString()) {
        role = "Organization Creator";
      } else if (channels.some(ch => ch.admin_id.toString() === userDoc._id.toString())) {
        role = "Channel Creator";
      }

      const joinedChannels = channels
        .filter(ch => ch.users.some(uid => uid.toString() === userDoc._id.toString()))
        .map(ch => ({ id: ch._id, name: ch.name }));

      let onlineStatus = "Offline";
      if (userDoc.lastLogin) {
        const diffMs = new Date() - new Date(userDoc.lastLogin);
        const diffMins = diffMs / 1000 / 60;
        if (diffMins <= 5) {
          onlineStatus = "Online";
        } else if (diffMins <= 15) {
          onlineStatus = "Away";
        }
      }

      return {
        ...stat,
        role,
        joinedDate: userDoc.createdAt,
        lastLogin: userDoc.lastLogin || userDoc.updatedAt,
        onlineStatus,
        channels: joinedChannels,
        email: userDoc.email
      };
    }).filter(Boolean);

    let filteredMembers = members;
    const search = (req.query.search || "").toLowerCase();
    if (search) {
      filteredMembers = filteredMembers.filter(m => {
        return (
          (m.name || "").toLowerCase().includes(search) ||
          (m.username || "").toLowerCase().includes(search) ||
          (m.email || "").toLowerCase().includes(search) ||
          (m.role || "").toLowerCase().includes(search) ||
          m.channels.some(ch => ch.name.toLowerCase().includes(search)) ||
          (m.organization || "").toLowerCase().includes(search)
        );
      });
    }

    const filterRole = req.query.role;
    if (filterRole) {
      filteredMembers = filteredMembers.filter(m => m.role === filterRole);
    }

    const filterChannel = req.query.channel;
    if (filterChannel) {
      filteredMembers = filteredMembers.filter(m => m.channels.some(ch => ch.id.toString() === filterChannel || ch.name === filterChannel));
    }

    const filterLevel = req.query.level;
    if (filterLevel) {
      filteredMembers = filteredMembers.filter(m => m.performanceLevel === filterLevel);
    }

    const filterStatus = req.query.status;
    if (filterStatus) {
      filteredMembers = filteredMembers.filter(m => m.onlineStatus === filterStatus);
    }

    const sortBy = req.query.sortBy || "rank";
    filteredMembers.sort((a, b) => {
      if (sortBy === "rank") return a.rank - b.rank;
      if (sortBy === "highestScore" || sortBy === "score") return b.rankScore - a.rankScore;
      if (sortBy === "accuracy") return b.overallAccuracy - a.overallAccuracy;
      if (sortBy === "newest") return new Date(b.joinedDate) - new Date(a.joinedDate);
      if (sortBy === "oldest") return new Date(a.joinedDate) - new Date(b.joinedDate);
      if (sortBy === "alphabetical") return (a.name || "").localeCompare(b.name || "");
      return 0;
    });

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const totalCount = filteredMembers.length;
    const totalPages = Math.ceil(totalCount / limit) || 1;
    const paginatedMembers = filteredMembers.slice((page - 1) * limit, page * limit);

    const onlineNow = members.filter(m => m.onlineStatus === "Online").length;
    const activeToday = members.filter(m => {
      if (!m.lastLogin) return false;
      const diffMs = new Date() - new Date(m.lastLogin);
      return diffMs <= 24 * 60 * 60 * 1000;
    }).length;

    let totalScoreAll = 0;
    let totalAccuracyAll = 0;
    let totalAttemptsAll = 0;
    let membersWithAttempts = 0;

    members.forEach(m => {
      totalAttemptsAll += m.totalAttempts;
      if (m.totalAttempts > 0) {
        totalScoreAll += m.avgScore;
        totalAccuracyAll += m.overallAccuracy;
        membersWithAttempts += 1;
      }
    });

    const avgScore = membersWithAttempts > 0 ? (totalScoreAll / membersWithAttempts) : 0;
    const avgAccuracy = membersWithAttempts > 0 ? (totalAccuracyAll / membersWithAttempts) : 0;

    const stats = {
      totalMembers: members.length,
      activeToday,
      onlineNow,
      avgScore,
      avgAccuracy,
      totalAssessments: totalAttemptsAll,
      highestRank: 1
    };

    successResponse({
      res,
      message: "Organization members fetched successfully",
      data: {
        members: paginatedMembers,
        pagination: {
          totalCount,
          totalPages,
          currentPage: page,
          limit
        },
        stats
      }
    });
  } catch (error) {
    console.error(error);
    errorResponse({ res, message: "Failed to fetch organization members" });
  }
});

const getChannelMembers = asyncHandler(async (req, res) => {
  try {
    const orgId = req.query.org_id || req.headers["org-id"];
    const channelId = req.query.channel_id;

    if (!orgId || !channelId) {
      return errorResponse({ res, message: "Organization ID and Channel ID are required!", status: 400 });
    }

    let orgDoc = await Org.findOne({ slug: orgId });
    if (!orgDoc && mongoose.isValidObjectId(orgId)) {
      orgDoc = await Org.findById(orgId);
    }
    if (!orgDoc) {
      return errorResponse({ res, message: "Organization not found!", status: 404 });
    }

    const Channel = require("../models/channelModel");
    const channelDoc = await Channel.findOne({ _id: channelId, org_id: orgDoc._id });
    if (!channelDoc) {
      return errorResponse({ res, message: "Channel not found!", status: 404 });
    }

    const isMember = channelDoc.users.some(uid => uid.toString() === req.user._id.toString()) || channelDoc.admin_id.toString() === req.user._id.toString();
    if (!isMember) {
      return errorResponse({ res, message: "Forbidden: You are not a member of this channel", status: 403 });
    }

    const allMembersStats = await calculateLeaderboardData(orgDoc.slug, { includeAll: true });

    const chMemberIds = channelDoc.users.map(uid => uid.toString());
    if (!chMemberIds.includes(channelDoc.admin_id.toString())) {
      chMemberIds.push(channelDoc.admin_id.toString());
    }

    const users = await User.find({ _id: { $in: chMemberIds } });
    const userMap = {};
    users.forEach(u => {
      userMap[u._id.toString()] = u;
    });

    const channels = await Channel.find({ org_id: orgDoc._id });

    const members = allMembersStats
      .filter(stat => chMemberIds.includes(stat.userId.toString()))
      .map(stat => {
        const userDoc = userMap[stat.userId.toString()];
        if (!userDoc) return null;

        let role = "Member";
        if (orgDoc.admin_id.toString() === userDoc._id.toString()) {
          role = "Organization Creator";
        } else if (channels.some(ch => ch.admin_id.toString() === userDoc._id.toString())) {
          role = "Channel Creator";
        }

        let onlineStatus = "Offline";
        if (userDoc.lastLogin) {
          const diffMs = new Date() - new Date(userDoc.lastLogin);
          const diffMins = diffMs / 1000 / 60;
          if (diffMins <= 5) {
            onlineStatus = "Online";
          } else if (diffMins <= 15) {
            onlineStatus = "Away";
          }
        }

        return {
          ...stat,
          role,
          joinedDate: userDoc.createdAt,
          lastLogin: userDoc.lastLogin || userDoc.updatedAt,
          onlineStatus,
          channels: [{ id: channelDoc._id, name: channelDoc.name }],
          email: userDoc.email
        };
      }).filter(Boolean);

    let filteredMembers = members;
    const search = (req.query.search || "").toLowerCase();
    if (search) {
      filteredMembers = filteredMembers.filter(m => {
        return (
          (m.name || "").toLowerCase().includes(search) ||
          (m.username || "").toLowerCase().includes(search) ||
          (m.email || "").toLowerCase().includes(search) ||
          (m.role || "").toLowerCase().includes(search)
        );
      });
    }

    const filterRole = req.query.role;
    if (filterRole) {
      filteredMembers = filteredMembers.filter(m => m.role === filterRole);
    }

    const filterLevel = req.query.level;
    if (filterLevel) {
      filteredMembers = filteredMembers.filter(m => m.performanceLevel === filterLevel);
    }

    const filterStatus = req.query.status;
    if (filterStatus) {
      filteredMembers = filteredMembers.filter(m => m.onlineStatus === filterStatus);
    }

    const sortBy = req.query.sortBy || "rank";
    filteredMembers.sort((a, b) => {
      if (sortBy === "rank") return a.rank - b.rank;
      if (sortBy === "highestScore" || sortBy === "score") return b.rankScore - a.rankScore;
      if (sortBy === "accuracy") return b.overallAccuracy - a.overallAccuracy;
      if (sortBy === "newest") return new Date(b.joinedDate) - new Date(a.joinedDate);
      if (sortBy === "oldest") return new Date(a.joinedDate) - new Date(b.joinedDate);
      if (sortBy === "alphabetical") return (a.name || "").localeCompare(b.name || "");
      return 0;
    });

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const totalCount = filteredMembers.length;
    const totalPages = Math.ceil(totalCount / limit) || 1;
    const paginatedMembers = filteredMembers.slice((page - 1) * limit, page * limit);

    let totalScoreAll = 0;
    let totalAccuracyAll = 0;
    let totalAttemptsAll = 0;
    let membersWithAttempts = 0;
    let topPerformer = "—";
    let topRankScore = -1;

    members.forEach(m => {
      totalAttemptsAll += m.totalAttempts;
      if (m.totalAttempts > 0) {
        totalScoreAll += m.avgScore;
        totalAccuracyAll += m.overallAccuracy;
        membersWithAttempts += 1;
      }
      if (m.rankScore > topRankScore) {
        topRankScore = m.rankScore;
        topPerformer = m.name || m.username;
      }
    });

    const avgScore = membersWithAttempts > 0 ? (totalScoreAll / membersWithAttempts) : 0;
    const avgAccuracy = membersWithAttempts > 0 ? (totalAccuracyAll / membersWithAttempts) : 0;

    const stats = {
      totalMembers: members.length,
      avgScore,
      avgAccuracy,
      topPerformer
    };

    successResponse({
      res,
      message: "Channel members fetched successfully",
      data: {
        members: paginatedMembers,
        pagination: {
          totalCount,
          totalPages,
          currentPage: page,
          limit
        },
        stats
      }
    });
  } catch (error) {
    console.error(error);
    errorResponse({ res, message: "Failed to fetch channel members" });
  }
});

module.exports = {
  getOverallLeaderboard,
  getSubjectLeaderboard,
  getAssessmentLeaderboard,
  getOrganizationLeaderboard,
  getUserAnalytics,
  getRecentActivity,
  awardBadgesAndStreaks,
  getTopics,
  calculateLeaderboardData,
  getOrganizationMembers,
  getChannelMembers
};
