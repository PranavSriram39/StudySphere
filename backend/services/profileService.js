const User = require("../models/userModel");
const Org = require("../models/orgModel");
const Channel = require("../models/channelModel");
const Quiz = require("../models/quizModel");
const QuizUserMap = require("../models/quizUserMapModel");
const mongoose = require("mongoose");
const { calculateLeaderboardData } = require("../controllers/leaderboardController");

const getProfileData = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return "not_found";

    // Update last active
    user.lastLogin = new Date();
    await user.save();

    // Find organization joined
    let org = null;
    if (user.org_joined) {
      org = await Org.findOne({ slug: user.org_joined });
      if (!org && mongoose.isValidObjectId(user.org_joined)) {
        org = await Org.findById(user.org_joined);
      }
    }

    // Find joined channels
    let joinedChannels = [];
    if (org) {
      joinedChannels = await Channel.find({
        org_id: org._id,
        users: { $in: [user._id] }
      });
    }

    // Leaderboard calculations for this user
    let currentRank = "N/A";
    let performanceLevel = "Bronze";
    let rankScore = 0;
    let rankMovement = "same";

    if (org) {
      const leaderboard = await calculateLeaderboardData(org._id, {});
      const myRank = leaderboard.find(item => item.userId.toString() === user._id.toString());
      if (myRank) {
        currentRank = myRank.rank;
        performanceLevel = myRank.performanceLevel;
        rankScore = myRank.rankScore;
        rankMovement = myRank.rankMovement;
      }
    }

    // Role-specific aggregation
    let roleData = {};
    
    // Check if user is Org Creator
    const managedOrgs = await Org.find({ admin_id: user._id });
    const isOrgCreator = managedOrgs.length > 0;

    // Check if user is Channel Creator
    const managedChannels = await Channel.find({ admin_id: user._id });
    const isChannelCreator = managedChannels.length > 0;

    if (isOrgCreator) {
      const orgIds = managedOrgs.map(o => o._id);
      const channelsCount = await Channel.countDocuments({ org_id: { $in: orgIds } });
      const uniqueMembersCount = managedOrgs.reduce((sum, o) => sum + (o.users?.length || 0), 0);
      const quizzesCreatedCount = await Quiz.countDocuments({ org_id: { $in: orgIds }, createdBy: user._id });
      const quizzesPublishedCount = await Quiz.countDocuments({ org_id: { $in: orgIds }, published: true });

      roleData = {
        role: "Organization Creator",
        organizationsManaged: managedOrgs.map(o => ({ id: o._id, name: o.name, slug: o.slug, membersCount: o.users?.length || 0 })),
        channelsCount,
        membersCount: uniqueMembersCount,
        createdQuizzes: quizzesCreatedCount,
        publishedQuizzes: quizzesPublishedCount
      };
    } else if (isChannelCreator) {
      const channelIds = managedChannels.map(c => c._id);
      const membersCount = managedChannels.reduce((sum, c) => sum + (c.users?.length || 0), 0);
      const quizzesCreatedCount = await Quiz.countDocuments({ channel_id: { $in: channelIds } });

      roleData = {
        role: "Channel Creator",
        channelsManaged: managedChannels.map(c => ({ id: c._id, name: c.name, membersCount: c.users?.length || 0 })),
        membersCount,
        createdQuizzes: quizzesCreatedCount
      };
    } else {
      // Regular Member
      const attemptsCount = await QuizUserMap.countDocuments({ user_id: user._id });
      
      roleData = {
        role: "Member",
        attemptsCount,
        badges: user.badges || [],
        certificatesCount: attemptsCount > 0 ? 1 : 0
      };
    }

    return {
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        phone: user.phone || user.mobile_number || "",
        bio: user.bio || "",
        linkedin: user.linkedin || "",
        github: user.github || "",
        portfolio: user.portfolio || "",
        skills: user.skills || [],
        image: user.image || "",
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        org_joined: user.org_joined
      },
      organization: org ? { id: org._id, name: org.name, slug: org.slug } : null,
      channels: joinedChannels.map(c => ({ id: c._id, name: c.name })),
      leaderboard: {
        currentRank,
        performanceLevel,
        rankScore,
        rankMovement
      },
      roleData
    };
  } catch (error) {
    console.error(error);
    return null;
  }
};

const updateProfileData = async (req, res) => {
  try {
    const { name, bio, phone, linkedin, github, portfolio, skills, image } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return "not_found";

    let hasChangedAvatar = false;
    if (image && image !== user.image) {
      user.image = image;
      hasChangedAvatar = true;
    }

    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (phone !== undefined) user.phone = phone;
    if (linkedin !== undefined) user.linkedin = linkedin;
    if (github !== undefined) user.github = github;
    if (portfolio !== undefined) user.portfolio = portfolio;
    if (skills !== undefined) user.skills = Array.isArray(skills) ? skills : skills.split(",").map(s => s.trim()).filter(Boolean);

    user.recentActivities.unshift({
      title: hasChangedAvatar ? "Profile Picture Changed" : "Profile Updated",
      description: hasChangedAvatar 
        ? "Updated personal profile picture"
        : "Updated contact info and professional details",
      icon: "profile",
      timestamp: new Date()
    });
    if (user.recentActivities.length > 15) user.recentActivities.pop();

    await user.save();
    return user;
  } catch (error) {
    console.error(error);
    return null;
  }
};

const getProgressReport = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return "not_found";

    const { dateRange, topic, difficulty, org_id, channel_id } = req.query;

    const quizQuery = {};
    if (org_id) {
      let orgDoc = await Org.findOne({ slug: org_id });
      if (!orgDoc && mongoose.isValidObjectId(org_id)) {
        orgDoc = await Org.findById(org_id);
      }
      if (orgDoc) {
        quizQuery.org_id = orgDoc._id;
      }
    }
    if (channel_id) {
      quizQuery.channel_id = channel_id;
    }
    if (topic) {
      quizQuery.subject = topic;
    }

    const matchingQuizzes = await Quiz.find(quizQuery).select("_id title subject passingScore difficulty totalMarks");
    const quizIds = matchingQuizzes.map(q => q._id);

    const attemptQuery = { user_id: user._id };
    if (org_id || channel_id || topic) {
      attemptQuery.quiz_id = { $in: quizIds };
    }
    if (difficulty) {
      attemptQuery.difficulty = difficulty;
    }

    if (dateRange && dateRange !== "All Time") {
      const now = new Date();
      let startDate = new Date();
      if (dateRange === "Last 7 Days") {
        startDate.setDate(now.getDate() - 7);
      } else if (dateRange === "Last 30 Days") {
        startDate.setDate(now.getDate() - 30);
      } else if (dateRange === "Last 90 Days") {
        startDate.setDate(now.getDate() - 90);
      }
      attemptQuery.createdAt = { $gte: startDate };
    }

    const attempts = await QuizUserMap.find(attemptQuery).populate("quiz_id").sort({ createdAt: 1 });
    const completedAttempts = attempts.filter(a => a.quiz_id);

    const totalAttempted = completedAttempts.length;
    let totalScore = 0;
    let highestScore = 0;
    let lowestScore = totalAttempted > 0 ? 99999 : 0;
    let totalAccuracy = 0;
    let totalTime = 0;
    let passedCount = 0;
    let failedCount = 0;

    const topicStats = {};
    const scoreProgress = [];
    const accuracyTrend = [];
    const timeAnalysis = [];

    completedAttempts.forEach((attempt, index) => {
      const quiz = attempt.quiz_id;
      const score = attempt.points ?? 0;
      const qCount = quiz.quiz ? (JSON.parse(quiz.quiz).questions?.length || 10) : 10;
      const pointsPercent = attempt.percentage ?? ((score / qCount) * 100);
      const passBoundary = quiz.passingScore || 50;

      if (pointsPercent >= passBoundary) {
        passedCount++;
      } else {
        failedCount++;
      }

      totalScore += pointsPercent;
      highestScore = Math.max(highestScore, pointsPercent);
      lowestScore = Math.min(lowestScore, pointsPercent);
      totalAccuracy += attempt.accuracy ?? pointsPercent;
      totalTime += attempt.timeTaken ?? 0;

      const attemptDate = attempt.createdAt ? new Date(attempt.createdAt).toLocaleDateString() : `Quiz ${index + 1}`;
      scoreProgress.push({
        date: attemptDate,
        score: pointsPercent,
        quizName: quiz.title,
        topic: quiz.subject,
        accuracy: attempt.accuracy ?? pointsPercent,
        timeTaken: attempt.timeTaken ?? 0
      });

      accuracyTrend.push({
        date: attemptDate,
        accuracy: attempt.accuracy ?? pointsPercent,
        quizName: quiz.title,
        topic: quiz.subject,
        score: pointsPercent,
        timeTaken: attempt.timeTaken ?? 0
      });

      timeAnalysis.push({
        name: quiz.title || `Quiz ${index + 1}`,
        avgTime: attempt.timeTaken ?? 0,
        topic: quiz.subject,
        date: attemptDate,
        score: pointsPercent,
        accuracy: attempt.accuracy ?? pointsPercent
      });

      const topicName = quiz.subject || "General";
      if (!topicStats[topicName]) {
        topicStats[topicName] = { topic: topicName, totalScore: 0, count: 0 };
      }
      topicStats[topicName].totalScore += pointsPercent;
      topicStats[topicName].count += 1;
    });

    if (lowestScore === 99999) lowestScore = 0;
    const avgScore = totalAttempted > 0 ? (totalScore / totalAttempted) : 0;
    const avgAccuracy = totalAttempted > 0 ? (totalAccuracy / totalAttempted) : 0;
    const avgTimeVal = totalAttempted > 0 ? (totalTime / totalAttempted) : 0;

    const topicPerformance = Object.values(topicStats).map(t => ({
      topic: t.topic,
      avgScore: t.totalScore / t.count
    }));

    const diffStats = {
      Easy: { avgScore: 0, attempts: 0, total: 0 },
      Medium: { avgScore: 0, attempts: 0, total: 0 },
      Hard: { avgScore: 0, attempts: 0, total: 0 }
    };
    completedAttempts.forEach(attempt => {
      const diff = attempt.difficulty || attempt.quiz_id?.difficulty || "Medium";
      const score = attempt.percentage ?? 0;
      if (diffStats[diff]) {
        diffStats[diff].total += score;
        diffStats[diff].attempts += 1;
      }
    });
    const difficultyPerformance = Object.keys(diffStats).map(d => ({
      difficulty: d,
      avgScore: diffStats[d].attempts > 0 ? (diffStats[d].total / diffStats[d].attempts) : 0,
      attempts: diffStats[d].attempts
    }));

    const weeklyActivity = [];
    const dateMap = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toLocaleDateString();
      dateMap[dStr] = 0;
    }
    completedAttempts.forEach(attempt => {
      const dStr = new Date(attempt.createdAt).toLocaleDateString();
      if (dateMap[dStr] !== undefined) {
        dateMap[dStr] += 1;
      }
    });
    Object.keys(dateMap).forEach(d => {
      weeklyActivity.push({
        date: d,
        count: dateMap[d]
      });
    });

    let currentRankVal = "—";
    if (user.org_joined) {
      const standings = await calculateLeaderboardData(user.org_joined, { includeAll: true });
      const myStanding = standings.find(s => s.userId.toString() === user._id.toString());
      if (myStanding) {
        currentRankVal = myStanding.rank;
      }
    }

    return {
      totalAttempted,
      completed: totalAttempted,
      passedCount,
      failedCount,
      avgScore,
      highestScore,
      lowestScore,
      totalTime,
      currentRank: currentRankVal,
      organization: user.org_joined || "—",
      channel: channel_id || "—",
      scoreProgress,
      topicPerformance,
      difficultyPerformance,
      weeklyActivity,
      accuracyTrend,
      timeAnalysis
    };
  } catch (error) {
    console.error(error);
    return null;
  }
};

const getLeaderboardAnalytics = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return "not_found";

    const { dateRange, topic, difficulty, org_id, channel_id } = req.query;

    const quizQuery = {};
    if (org_id) {
      let orgDoc = await Org.findOne({ slug: org_id });
      if (!orgDoc && mongoose.isValidObjectId(org_id)) {
        orgDoc = await Org.findById(org_id);
      }
      if (orgDoc) {
        quizQuery.org_id = orgDoc._id;
      }
    }
    if (channel_id) {
      quizQuery.channel_id = channel_id;
    }
    if (topic) {
      quizQuery.subject = topic;
    }

    const matchingQuizzes = await Quiz.find(quizQuery).select("_id title subject passingScore difficulty totalMarks");
    const quizIds = matchingQuizzes.map(q => q._id);

    const attemptQuery = { user_id: user._id };
    if (org_id || channel_id || topic) {
      attemptQuery.quiz_id = { $in: quizIds };
    }
    if (difficulty) {
      attemptQuery.difficulty = difficulty;
    }

    if (dateRange && dateRange !== "All Time") {
      const now = new Date();
      let startDate = new Date();
      if (dateRange === "Last 7 Days") {
        startDate.setDate(now.getDate() - 7);
      } else if (dateRange === "Last 30 Days") {
        startDate.setDate(now.getDate() - 30);
      } else if (dateRange === "Last 90 Days") {
        startDate.setDate(now.getDate() - 90);
      }
      attemptQuery.createdAt = { $gte: startDate };
    }

    const attempts = await QuizUserMap.find(attemptQuery).populate("quiz_id").sort({ createdAt: 1 });
    const completedAttempts = attempts.filter(a => a.quiz_id);

    let currentRankVal = 1;
    let totalScoreVal = 0;
    let rankScoreVal = 0;
    let orgRankVal = "—";
    let channelRankVal = "—";
    let topicRankVal = "—";
    let bestTopic = "—";
    let weakestTopic = "—";
    let totalUsersCount = 1;

    if (user.org_joined) {
      const orgStandings = await calculateLeaderboardData(user.org_joined, { includeAll: true });
      totalUsersCount = orgStandings.length || 1;
      const myStanding = orgStandings.find(s => s.userId.toString() === user._id.toString());
      if (myStanding) {
        currentRankVal = myStanding.rank;
        totalScoreVal = myStanding.totalScore;
        rankScoreVal = myStanding.rankScore;
        orgRankVal = myStanding.rank;
      }

      if (channel_id) {
        const Channel = require("../models/channelModel");
        const chDoc = await Channel.findById(channel_id);
        if (chDoc) {
          const chMemberIds = chDoc.users.map(uid => uid.toString());
          if (!chMemberIds.includes(chDoc.admin_id.toString())) {
            chMemberIds.push(chDoc.admin_id.toString());
          }
          const chStandings = orgStandings
            .filter(s => chMemberIds.includes(s.userId.toString()))
            .sort((a,b) => b.rankScore - a.rankScore);
          const myChRankIndex = chStandings.findIndex(s => s.userId.toString() === user._id.toString());
          if (myChRankIndex !== -1) {
            channelRankVal = myChRankIndex + 1;
          }
        }
      }
    }

    const topicStats = {};
    completedAttempts.forEach(attempt => {
      const t = attempt.quiz_id?.subject || "General";
      const score = attempt.percentage ?? 0;
      if (!topicStats[t]) {
        topicStats[t] = { topic: t, totalScore: 0, count: 0 };
      }
      topicStats[t].totalScore += score;
      topicStats[t].count += 1;
    });

    let highestAvg = -1;
    let lowestAvg = 99999;
    Object.keys(topicStats).forEach(t => {
      const avg = topicStats[t].totalScore / topicStats[t].count;
      if (avg > highestAvg) {
        highestAvg = avg;
        bestTopic = t;
      }
      if (avg < lowestAvg) {
        lowestAvg = avg;
        weakestTopic = t;
      }
    });
    if (lowestAvg === 99999) weakestTopic = "—";

    const rankHistory = [];
    let runningPoints = 0;
    completedAttempts.forEach((attempt, idx) => {
      runningPoints += attempt.points ?? 0;
      const attemptDate = attempt.createdAt ? new Date(attempt.createdAt).toLocaleDateString() : `Quiz ${idx + 1}`;
      rankHistory.push({
        date: attemptDate,
        rankScore: runningPoints,
        quizName: attempt.quiz_id?.title,
        topic: attempt.quiz_id?.subject,
        score: attempt.percentage ?? 0,
        accuracy: attempt.accuracy ?? 0,
        timeTaken: attempt.timeTaken ?? 0,
        rank: idx + 1
      });
    });

    const topicComparison = Object.keys(topicStats).map(t => ({
      topic: t,
      avgScore: topicStats[t].totalScore / topicStats[t].count
    }));

    let excellentCount = 0;
    let goodCount = 0;
    let averageCount = 0;
    let needsImprovementCount = 0;

    completedAttempts.forEach(attempt => {
      const p = attempt.percentage ?? 0;
      if (p >= 85) excellentCount++;
      else if (p >= 70) goodCount++;
      else if (p >= 50) averageCount++;
      else needsImprovementCount++;
    });

    const scoreDistribution = [
      { name: "Excellent (>=85%)", value: excellentCount },
      { name: "Good (70-84%)", value: goodCount },
      { name: "Average (50-69%)", value: averageCount },
      { name: "Needs Improvement (<50%)", value: needsImprovementCount }
    ].filter(d => d.value > 0);

    let avgAccuracy = 0;
    let avgTime = 0;
    let avgScore = 0;
    let completedCount = 0;
    completedAttempts.forEach(attempt => {
      avgAccuracy += attempt.accuracy ?? 0;
      avgTime += attempt.timeTaken ?? 0;
      avgScore += attempt.percentage ?? 0;
      if (attempt.completionStatus === "Completed") completedCount++;
    });
    const count = completedAttempts.length || 1;
    avgAccuracy = avgAccuracy / count;
    avgTime = avgTime / count;
    avgScore = avgScore / count;

    let scoreVarianceSum = 0;
    completedAttempts.forEach(attempt => {
      const diff = (attempt.percentage ?? 0) - avgScore;
      scoreVarianceSum += diff * diff;
    });
    const stdDev = Math.sqrt(scoreVarianceSum / count);
    const consistencyVal = Math.max(0, Math.min(100, 100 - stdDev));
    const speedVal = Math.max(0, Math.min(100, (1 - (avgTime / 300)) * 100));

    const performanceRadar = [
      { subject: "Accuracy", value: avgAccuracy },
      { subject: "Speed", value: speedVal },
      { subject: "Consistency", value: consistencyVal },
      { subject: "Attempts", value: Math.min(100, count * 5) },
      { subject: "Score", value: avgScore },
      { subject: "Completion", value: (completedCount / count) * 100 }
    ];

    const streakGraph = [];
    const dateMap = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toLocaleDateString();
      dateMap[dStr] = 0;
    }
    completedAttempts.forEach(attempt => {
      const dStr = new Date(attempt.createdAt).toLocaleDateString();
      if (dateMap[dStr] !== undefined) {
        dateMap[dStr] += 1;
      }
    });
    Object.keys(dateMap).forEach(d => {
      streakGraph.push({
        date: d,
        count: dateMap[d]
      });
    });

    const monthStats = {};
    completedAttempts.forEach(attempt => {
      const monthName = attempt.createdAt ? new Date(attempt.createdAt).toLocaleString("default", { month: "short" }) : "Jan";
      if (!monthStats[monthName]) {
        monthStats[monthName] = { month: monthName, total: 0, count: 0 };
      }
      monthStats[monthName].total += attempt.percentage ?? 0;
      monthStats[monthName].count += 1;
    });
    const monthlyPerformance = Object.values(monthStats).map(m => ({
      month: m.month,
      avgScore: m.total / m.count
    }));

    const quizTimeline = completedAttempts.map((attempt, index) => ({
      assessmentName: attempt.quiz_id?.title || `Quiz ${index + 1}`,
      completedTime: attempt.createdAt ? new Date(attempt.createdAt).toLocaleString() : new Date().toLocaleString(),
      score: attempt.percentage ?? 0,
      totalMarks: attempt.totalMarks || 100,
      result: (attempt.percentage ?? 0) >= (attempt.quiz_id?.passingScore || 50) ? "Passed" : "Failed",
      topic: attempt.quiz_id?.subject || "General",
      accuracy: attempt.accuracy ?? 0,
      timeTaken: attempt.timeTaken ?? 0,
      rank: index + 1
    })).reverse();

    const percentileVal = ((totalUsersCount - currentRankVal + 1) / totalUsersCount) * 100;

    return {
      currentRank: currentRankVal,
      rankHistory: rankHistory,
      overallPercentile: percentileVal,
      totalScore: totalScoreVal,
      totalPoints: rankScoreVal,
      orgRank: orgRankVal,
      channelRank: channelRankVal,
      topicRank: topicRankVal,
      bestTopic,
      weakestTopic,
      topicComparison,
      scoreDistribution,
      performanceRadar,
      streakGraph,
      monthlyPerformance,
      quizTimeline
    };
  } catch (error) {
    console.error(error);
    return null;
  }
};

const getUpcomingActivities = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return "not_found";

    const activities = [];

    if (user.org_joined) {
      const org = await Org.findOne({ slug: user.org_joined });
      if (org) {
        const joinedChannels = await Channel.find({ org_id: org._id, users: { $in: [user._id] } });
        const chIds = joinedChannels.map(c => c._id);
        
        // Find upcoming quizzes (startDateTime is in the future) or active quizzes not attempted yet
        const now = new Date();
        const upcomingQuizzes = await Quiz.find({
          org_id: org._id,
          channel_id: { $in: chIds },
          published: true,
          is_active: true,
          startDateTime: { $gt: now }
        }).populate("channel_id");

        upcomingQuizzes.forEach(quiz => {
          activities.push({
            title: `Upcoming Quiz: ${quiz.title}`,
            description: `Scheduled in #${quiz.channel_id.name}`,
            date: quiz.startDateTime,
            icon: "quiz"
          });
        });

        // Find active quizzes closing soon (endDateTime in the future)
        const activeQuizzesClosing = await Quiz.find({
          org_id: org._id,
          channel_id: { $in: chIds },
          published: true,
          is_active: true,
          endDateTime: { $gt: now }
        }).populate("channel_id");

        // Check if attempted
        const attemptedMap = await QuizUserMap.find({ user_id: user._id }).select("quiz_id");
        const attemptedIds = attemptedMap.map(a => a.quiz_id.toString());

        activeQuizzesClosing.forEach(quiz => {
          if (!attemptedIds.includes(quiz._id.toString())) {
            activities.push({
              title: `Deadline: ${quiz.title}`,
              description: `Complete before deadline in #${quiz.channel_id.name}`,
              date: quiz.endDateTime,
              icon: "deadline"
            });
          }
        });
      }
    }

    return activities.sort((a,b) => new Date(a.date) - new Date(b.date));
  } catch (error) {
    console.error(error);
    return null;
  }
};

module.exports = {
  getProfileData,
  updateProfileData,
  getProgressReport,
  getUpcomingActivities,
  getLeaderboardAnalytics
};
