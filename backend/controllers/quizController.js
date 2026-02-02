const asyncHandler = require("express-async-handler");
const { errorResponse, successResponse } = require("../helpers/apiResponse");
const { create, getAll, get, submit, getQuizByUser, stopQ } = require("../services/quizService");

const createQuiz = asyncHandler(async (req, res) => {
  const data = await create(req, res);
  if(data === "empty"){
    errorResponse({
      res,
      message: "Please fill all the fields",
    });
  }
  else if (data) {
    successResponse({
      res,
      message: "Quiz created successfully",
      data: data,
    });
  } else {
    errorResponse({
      res,
      message: "Something went wrong! Unable to create uiz",
    });
  }
});

const getQuizzes = asyncHandler(async (req, res) => {
  const data = await getAll(req, res);
  if (data === "empty") {
    errorResponse({
      res,
      message: "Please fill all the fields",
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
    });
  }
});

const getQuiz = asyncHandler(async (req, res) => {
  const data = await get(req, res);
  if (data === "empty") {
    errorResponse({
      res,
      message: "Please fill all the fields",
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
    });
  }
});

const submitQuiz = asyncHandler(async (req, res) => {
  const data = await submit(req, res);
  if (data === "empty") {
    errorResponse({
      res,
      message: "Please fill all the fields",
    });
  }else if (data === "exists") {
    errorResponse({
      res,
      message: "User already submitted the quiz",
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
      message: "Something went wrong! Unable to get quizzes",
    });
  }
});

const getUserQuizzes = asyncHandler(async (req, res) => {
  const data = await getQuizByUser(req, res);
  if (data === "empty") {
    errorResponse({
      res,
      message: "Please fill all the fields",
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
    });
  }
});

const stopQuiz = asyncHandler(async (req, res) => {
  const data = await stopQ(req, res);
  if (data === "empty") {
    errorResponse({
      res,
      message: "Please fill all the fields",
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
      message: "Something went wrong! Unable to get quizzes",
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
