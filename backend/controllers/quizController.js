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

const generateQuizAI = asyncHandler(async (req, res) => {
  const requestId = req.id || Math.random().toString(36).substring(7);
  
  if (!req.file) {
    return res.status(400).send({
      success: false,
      message: "No PDF uploaded",
      errorCode: "NO_FILE",
      details: "Please select a valid PDF file to upload.",
      timestamp: new Date().toISOString(),
      requestId
    });
  }

  const isPdf = req.file.mimetype === "application/pdf" || req.file.originalname.toLowerCase().endsWith(".pdf");
  if (!isPdf) {
    return res.status(400).send({
      success: false,
      message: "Invalid PDF format",
      errorCode: "INVALID_FORMAT",
      details: "Uploaded file must be a PDF.",
      timestamp: new Date().toISOString(),
      requestId
    });
  }

  try {
    const FormData = require("form-data");
    const axios = require("axios");

    const form = new FormData();
    form.append("file", req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });
    form.append("title", req.body.title || "Quiz");
    form.append("num_questions", req.body.num_questions || "10");
    form.append("difficulty", req.body.difficulty || "Medium");
    form.append("duration", req.body.duration || "10");

    const pyBackendUrl = process.env.PYTHON_BACKEND_URL || (
      process.env.NODE_ENV === "production"
        ? "https://studysphere-py-backend.onrender.com/generate-quiz"
        : "http://localhost:10000/generate-quiz"
    );

    if (process.env.NODE_ENV !== "production") {
      console.log(`[DEVELOPMENT] Incoming request to generate quiz. Title: ${req.body.title}, Qs: ${req.body.num_questions}`);
      console.log(`[DEVELOPMENT] PDF size: ${req.file.size} bytes`);
      console.log(`[DEVELOPMENT] Forwarding request to Python backend at: ${pyBackendUrl}`);
    }

    const startTime = Date.now();
    const response = await axios.post(pyBackendUrl, form, {
      headers: {
        ...form.getHeaders(),
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 90000, // 90 seconds timeout for large PDFs
    });
    const durationTime = Date.now() - startTime;

    if (process.env.NODE_ENV !== "production") {
      console.log(`[DEVELOPMENT] Groq response time: ${durationTime}ms`);
      console.log(`[DEVELOPMENT] Questions generated: ${response.data.quiz?.questions?.length || 0}`);
    }

    return res.status(200).send({
      success: true,
      message: "Quiz generated successfully",
      quiz: response.data.quiz,
      timestamp: new Date().toISOString(),
      requestId
    });

  } catch (error) {
    console.error("[ERROR] Failed to communicate with Python backend:", error.message);
    const status = error.response?.status || 500;
    const errorMessage = error.response?.data?.error || error.response?.data?.message || "Failed to generate quiz. Check server logs.";
    const errorCode = error.response?.data?.errorCode || "PYTHON_BACKEND_FAILED";
    const details = error.response?.data?.details || error.message;

    return res.status(status).send({
      success: false,
      message: errorMessage,
      errorCode,
      details,
      timestamp: new Date().toISOString(),
      requestId
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
  generateQuizAI,
};
