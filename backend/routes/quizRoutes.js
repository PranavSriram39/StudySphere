const express = require("express");
const multer = require("multer");

const router = express.Router();
const protect = require("../middlewares/authMiddleware");
const { 
  createQuiz, 
  getQuizzes, 
  getQuiz, 
  submitQuiz, 
  getUserQuizzes, 
  stopQuiz,
  generateQuizAI 
} = require("../controllers/quizController");

// Configure multer memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage, 
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

router.route("/create-quiz").post(protect, createQuiz);
router.route("/get-quizzes").get(protect, getQuizzes);
router.route("/get-quiz").get(protect, getQuiz);
router.route("/submit-quiz").post(protect, submitQuiz);
router.route("/get-user-quizzes").get(protect, getUserQuizzes);
router.route("/stop-quiz").put(protect, stopQuiz);
router.route("/generate-quiz").post(protect, upload.single("file"), generateQuizAI);

module.exports = router;
