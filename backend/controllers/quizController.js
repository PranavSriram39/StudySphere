const asyncHandler = require("express-async-handler");
const { errorResponse, successResponse } = require("../helpers/apiResponse");
const { create, getAll, get, submit, getQuizByUser, stopQ } = require("../services/quizService");

const createQuiz = asyncHandler(async (req, res) => {
  const data = await create(req, res);
  if (data === "empty") {
    errorResponse({
      res,
      message: "Please fill all the fields",
      status: 400,
    });
  } else if (data === "not_found_org" || data === "not_found_channel") {
    errorResponse({
      res,
      message: "Organization or Channel not found",
      status: 404,
    });
  } else if (data === "unauthorized") {
    errorResponse({
      res,
      message: "Forbidden: Only Organization Creators or Channel Admins can create quizzes",
      status: 403,
    });
  } else if (data) {
    successResponse({
      res,
      message: "Quiz created successfully",
      data: data,
    });
  } else {
    errorResponse({
      res,
      message: "Something went wrong! Unable to create quiz",
      status: 500,
    });
  }
});

const getQuizzes = asyncHandler(async (req, res) => {
  const data = await getAll(req, res);
  if (data === "empty") {
    errorResponse({
      res,
      message: "Please fill all the fields",
      status: 400,
    });
  } else if (data === "not_found") {
    errorResponse({
      res,
      message: "Resource not found",
      status: 404,
    });
  } else if (data === "unauthorized") {
    errorResponse({
      res,
      message: "Forbidden: You are not authorized to access this channel's quizzes",
      status: 403,
    });
  } else if (data) {
    successResponse({
      res,
      message: "Quizzes fetched successfully",
      data: data,
    });
  } else {
    errorResponse({
      res,
      message: "Something went wrong! Unable to get quizzes",
      status: 500,
    });
  }
});

const getQuiz = asyncHandler(async (req, res) => {
  const data = await get(req, res);
  if (data === "empty") {
    errorResponse({
      res,
      message: "Please fill all the fields",
      status: 400,
    });
  } else if (data === "not_found") {
    errorResponse({
      res,
      message: "Quiz not found",
      status: 404,
    });
  } else if (data === "unauthorized") {
    errorResponse({
      res,
      message: "Forbidden: You are not authorized to view this quiz",
      status: 403,
    });
  } else if (data) {
    successResponse({
      res,
      message: "Quizzes fetched successfully",
      data: data,
    });
  } else {
    errorResponse({
      res,
      message: "Something went wrong! Unable to get quizzes",
      status: 500,
    });
  }
});

const submitQuiz = asyncHandler(async (req, res) => {
  const data = await submit(req, res);
  if (data === "empty") {
    errorResponse({
      res,
      message: "Please fill all the fields",
      status: 400,
    });
  } else if (data === "not_found") {
    errorResponse({
      res,
      message: "Quiz, Organization, or Channel not found",
      status: 404,
    });
  } else if (data === "org_creator_restriction") {
    errorResponse({
      res,
      message: "Forbidden: Organization Creators cannot attempt assessments.",
      status: 403,
    });
  } else if (data === "quiz_creator_restriction") {
    errorResponse({
      res,
      message: "Forbidden: You cannot attempt an assessment that you created.",
      status: 403,
    });
  } else if (data === "exists") {
    errorResponse({
      res,
      message: "Conflict: Attempt limits reached for this assessment.",
      status: 409,
    });
  } else if (data === "upcoming") {
    errorResponse({
      res,
      message: "Unprocessable Entity: This assessment has not started.",
      status: 422,
    });
  } else if (data === "expired") {
    errorResponse({
      res,
      message: "Unprocessable Entity: This assessment has ended.",
      status: 422,
    });
  } else if (data) {
    successResponse({
      res,
      message: "Quizzes submitted successfully",
      data: data,
    });
  } else {
    errorResponse({
      res,
      message: "Something went wrong! Unable to submit quiz",
      status: 500,
    });
  }
});

const getUserQuizzes = asyncHandler(async (req, res) => {
  const data = await getQuizByUser(req, res);
  if (data === "empty") {
    errorResponse({
      res,
      message: "Please fill all the fields",
      status: 400,
    });
  } else if (data === "not_found") {
    errorResponse({
      res,
      message: "Organization not found",
      status: 404,
    });
  } else if (data === "unauthorized") {
    errorResponse({
      res,
      message: "Forbidden: You are not a member of this organization",
      status: 403,
    });
  } else if (data) {
    successResponse({
      res,
      message: "Quizzes fetched successfully",
      data: data,
    });
  } else {
    errorResponse({
      res,
      message: "Something went wrong! Unable to get quizzes",
      status: 500,
    });
  }
});

const stopQuiz = asyncHandler(async (req, res) => {
  const data = await stopQ(req, res);
  if (data === "empty") {
    errorResponse({
      res,
      message: "Please fill all the fields",
      status: 400,
    });
  } else if (data === "not_found") {
    errorResponse({
      res,
      message: "Quiz not found",
      status: 404,
    });
  } else if (data === "unauthorized") {
    errorResponse({
      res,
      message: "Forbidden: You are not authorized to stop this quiz",
      status: 403,
    });
  } else if (data) {
    successResponse({
      res,
      message: "Quizzes stopped successfully",
      data: data,
    });
  } else {
    errorResponse({
      res,
      message: "Something went wrong! Unable to stop quiz",
      status: 500,
    });
  }
});

module.exports = {
  createQuiz,
  getQuizzes,
  getQuiz,
  submitQuiz,
  getUserQuizzes,
  stopQuiz,
};
