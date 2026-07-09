const { errorResponse } = require("../helpers/apiResponse");
const Quiz = require("../models/quizModel");
const QuizUserMap = require("../models/quizUserMapModel");
const User = require("../models/userModel");
const Org = require("../models/orgModel");
const Channel = require("../models/channelModel");

const create = async (req, res) => {
  try {
    const {
      title,
      subject,
      quiz,
      org_id,
      channel_id,
      published,
      startDateTime,
      endDateTime,
      negativeMarking,
      maxAttempts,
      instructions,
      randomizeQuestions,
      randomizeOptions,
    } = req.body;

    if (!title || !quiz || !org_id || !channel_id) {
      return "empty";
    }

    // Resolve organization
    const org = await Org.findById(org_id);
    if (!org) {
      return "not_found_org";
    }

    // Resolve channel
    const channel = await Channel.findById(channel_id);
    if (!channel) {
      return "not_found_channel";
    }

    // RBAC: Only Organization Creator or Channel Creator can create quizzes
    const isOrgCreator = org.admin_id.toString() === req.user._id.toString();
    const isChannelCreator = channel.admin_id.toString() === req.user._id.toString();

    if (!isOrgCreator && !isChannelCreator) {
      return "unauthorized";
    }

    const quizData = await Quiz.create({
      title,
      subject: subject || "General",
      quiz,
      org_id,
      channel_id,
      is_active: true,
      createdBy: req.user._id,
      published: published !== undefined ? published : true,
      startDateTime: startDateTime ? new Date(startDateTime) : undefined,
      endDateTime: endDateTime ? new Date(endDateTime) : undefined,
      negativeMarking: negativeMarking || false,
      maxAttempts: maxAttempts || 1,
      instructions: instructions || "",
      randomizeQuestions: randomizeQuestions || false,
      randomizeOptions: randomizeOptions || false,
    });

    await quizData.populate("org_id");
    await quizData.populate("channel_id");

    if (quizData) {
      const User = require("../models/userModel");
      const user = await User.findById(req.user._id);
      if (user) {
        const isPub = quizData.published;
        user.recentActivities.unshift({
          title: isPub ? "Quiz Published" : "Created Quiz",
          description: isPub 
            ? `Published quiz "${quizData.title}" in #${quizData.channel_id.name}`
            : `Saved draft quiz "${quizData.title}" in #${quizData.channel_id.name}`,
          icon: "quiz",
          timestamp: new Date()
        });
        if (user.recentActivities.length > 15) user.recentActivities.pop();
        await user.save();
      }
      return quizData;
    }
    return null;
  } catch (error) {
    console.log(error);
  }
};

const getAll = async (req, res) => {
  try {
    const { org_id, channel_id, active } = req.query;

    if (!org_id || !channel_id) {
      return "empty";
    }

    // Resolve organization & channel
    const org = await Org.findById(org_id);
    if (!org) {
      return "not_found";
    }
    const channel = await Channel.findById(channel_id);
    if (!channel) {
      return "not_found";
    }

    // Ensure user is member of organization & channel
    const isOrgMember = org.users.some(u => u.toString() === req.user._id.toString()) || org.admin_id.toString() === req.user._id.toString();
    const isChannelMember = channel.users.some(u => u.toString() === req.user._id.toString()) || channel.admin_id.toString() === req.user._id.toString();

    if (!isOrgMember || !isChannelMember) {
      return "unauthorized";
    }

    const quizzes = await Quiz.find({
      org_id,
      channel_id,
      is_active: active ? true : false,
    }).sort({ updatedAt: -1 });
    return quizzes;
  } catch (error) {
    console.log(error);
  }
};

const get = async (req, res) => {
  try {
    const { quiz_id } = req.query;

    if (!quiz_id) {
      return "empty";
    }

    const quizDoc = await Quiz.findById(quiz_id);
    if (!quizDoc) {
      return "not_found";
    }

    // Check membership
    const org = await Org.findById(quizDoc.org_id);
    const channel = await Channel.findById(quizDoc.channel_id);

    const isOrgMember = org && (org.users.some(u => u.toString() === req.user._id.toString()) || org.admin_id.toString() === req.user._id.toString());
    const isChannelMember = channel && (channel.users.some(u => u.toString() === req.user._id.toString()) || channel.admin_id.toString() === req.user._id.toString());

    if (!isOrgMember || !isChannelMember) {
      return "unauthorized";
    }

    const submissions = await QuizUserMap.find({
      quiz_id,
    }).populate("user_id", "-password");

    return {
      quiz: [quizDoc],
      isOrgCreator: org.admin_id.toString() === req.user._id.toString(),
      isChannelCreator: channel.admin_id.toString() === req.user._id.toString(),
      isQuizCreator: quizDoc.createdBy && quizDoc.createdBy.toString() === req.user._id.toString(),
      submissions: submissions.map((data) => ({
        user: data.user_id,
        points: data.points,
      })),
    };
  } catch (error) {
    console.log(error);
  }
};

const submit = async (req, res) => {
  try {
    const {
      quiz_id,
      answers,
      points,
      startTime,
      endTime,
      timeTaken,
      correct,
      wrong,
      skipped,
      totalMarks,
      percentage,
      accuracy,
      difficulty,
      completionStatus,
      attemptNumber,
    } = req.body;

    if (!quiz_id) {
      return "empty";
    }

    const quizDoc = await Quiz.findById(quiz_id);
    if (!quizDoc) {
      return "not_found";
    }

    const org = await Org.findById(quizDoc.org_id);
    const channel = await Channel.findById(quizDoc.channel_id);

    if (!org || !channel) {
      return "not_found";
    }

    // Restriction: Organization Creators cannot attempt quizzes inside their organization
    if (org.admin_id.toString() === req.user._id.toString()) {
      return "org_creator_restriction";
    }

    // Restriction: Quiz Creators (or Channel Creator of the quiz's channel who created it) cannot attempt
    if (quizDoc.createdBy && quizDoc.createdBy.toString() === req.user._id.toString()) {
      return "quiz_creator_restriction";
    }
    if (channel.admin_id.toString() === req.user._id.toString() && quizDoc.createdBy?.toString() === req.user._id.toString()) {
      return "quiz_creator_restriction";
    }

    // Attempt limits verification
    const userSubmittedQuizzes = await QuizUserMap.find({
      user_id: req.user._id,
      quiz_id,
    });
    const maxAttempts = quizDoc.maxAttempts || 1;
    if (userSubmittedQuizzes.length >= maxAttempts) {
      return "exists";
    }

    // Quiz Timing verification
    const now = new Date();
    if (quizDoc.startDateTime && now < new Date(quizDoc.startDateTime)) {
      return "upcoming";
    }
    if (quizDoc.endDateTime && now > new Date(quizDoc.endDateTime)) {
      return "expired";
    }

    const quizzes = await QuizUserMap.create({
      quiz_id,
      user_id: req.user._id,
      answers,
      points,
      startTime,
      endTime,
      timeTaken,
      correct,
      wrong,
      skipped,
      totalMarks,
      percentage,
      accuracy,
      difficulty,
      completionStatus,
      attemptNumber: userSubmittedQuizzes.length + 1,
    });

    // Auto-award badges and update streaks
    const { awardBadgesAndStreaks } = require("../controllers/leaderboardController");
    await awardBadgesAndStreaks(req.user._id, quizzes);

    const userPointData = await User.findOne(
      { _id: req.user._id },
      { "quizPerformance.currentPerformance": 1, _id: 0 }
    );
    const prevPoints = userPointData?.quizPerformance?.currentPerformance;
    const newPoints = prevPoints ? prevPoints + points : points;

    const user = await User.findById(req.user._id);
    if (user) {
      user.quizPerformance.currentPerformance = newPoints;
      user.quizPerformance.pastPerformances.push(newPoints);
      user.recentActivities.unshift({
        title: "Attempted Quiz",
        description: `Attempted assessment "${quizDoc.title}" (Score: ${points}/${totalMarks})`,
        icon: "quiz",
        timestamp: new Date()
      });
      if (user.recentActivities.length > 15) user.recentActivities.pop();
      await user.save();
    }

    return quizzes;
  } catch (error) {
    console.log(error);
  }
};

const getQuizByUser = async (req, res) => {
  try {
    const { org_id, active, channel_id } = req.query;

    if (!org_id) {
      return "empty";
    }

    // Resolve organization & check membership
    const org = await Org.findById(org_id);
    if (!org) {
      return "not_found";
    }

    const isMember = org.users.some(u => u.toString() === req.user._id.toString()) || org.admin_id.toString() === req.user._id.toString();
    if (!isMember) {
      return "unauthorized";
    }

    let quizzes = null;
    if (channel_id) {
      quizzes = await Quiz.find({
        org_id,
        channel_id,
        is_active: active ? true : false,
      });
    } else {
      quizzes = await Quiz.find({
        org_id,
        is_active: active ? true : false,
      }).populate("channel_id");
    }

    if (!channel_id) {
      quizzes = quizzes.filter((quiz) =>
        quiz.channel_id?.users.some(
          (user) => user.toString() === req.user._id.toString()
        )
      );
    }

    let userSubmittedQuizzes = await QuizUserMap.find({
      user_id: req.user._id,
    }).populate("quiz_id");

    userSubmittedQuizzes = userSubmittedQuizzes.filter(
      (userMap) => userMap.quiz_id
    );

    userSubmittedQuizzes = userSubmittedQuizzes
      .map((userMap) => ({
        quiz: userMap.quiz_id,
        points: userMap.points,
        startTime: userMap.startTime,
        endTime: userMap.endTime,
        timeTaken: userMap.timeTaken,
        correct: userMap.correct,
        wrong: userMap.wrong,
        skipped: userMap.skipped,
        totalMarks: userMap.totalMarks,
        percentage: userMap.percentage,
        accuracy: userMap.accuracy,
        difficulty: userMap.difficulty,
        completionStatus: userMap.completionStatus,
        attemptNumber: userMap.attemptNumber,
        createdAt: userMap.createdAt
      }))
      .filter(Boolean);

    const submittedQuizIds = userSubmittedQuizzes.map((userMap) =>
      userMap.quiz._id.toString()
    );

    const notSubmittedQuizzes = quizzes.filter(
      (quiz) => !submittedQuizIds.includes(quiz._id.toString())
    );

    return {
      notSubmittedQuizzes,
      userSubmittedQuizzes,
    };
  } catch (error) {
    console.log(error);
  }
};

const stopQ = async (req, res) => {
  try {
    const { quiz_id } = req.query;

    if (!quiz_id) {
      return "empty";
    }

    const quiz = await Quiz.findById(quiz_id);
    if (!quiz) {
      return "not_found";
    }

    // Resolve org & channel to check creator rules
    const org = await Org.findById(quiz.org_id);
    const channel = await Channel.findById(quiz.channel_id);

    const isOrgCreator = org && org.admin_id.toString() === req.user._id.toString();
    const isChannelCreator = channel && channel.admin_id.toString() === req.user._id.toString();
    const isQuizCreator = quiz.createdBy && quiz.createdBy.toString() === req.user._id.toString();

    // Only creators can stop/deactivate quizzes
    if (!isOrgCreator && !isChannelCreator && !isQuizCreator) {
      return "unauthorized";
    }

    await Quiz.updateOne(
      { _id: quiz_id },
      { $set: { is_active: false } },
      { new: true }
    );
    const quizzes = await Quiz.find({
      _id: quiz_id,
    });
    return quizzes;
  } catch (error) {
    console.log(error);
  }
};

module.exports = { create, getAll, get, submit, getQuizByUser, stopQ };
