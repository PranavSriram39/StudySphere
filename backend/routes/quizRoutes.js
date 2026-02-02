const express = require("express");

const router = express.Router();
const protect = require("../middlewares/authMiddleware");
const { createQuiz, getQuizzes, getQuiz, submitQuiz, getUserQuizzes, stopQuiz } = require("../controllers/quizController");

router.route("/create-quiz").post(protect, createQuiz);
router.route("/get-quizzes").get(getQuizzes);
router.route("/get-quiz").get(protect, getQuiz);
router.route("/submit-quiz").post(protect, submitQuiz);
router.route("/get-user-quizzes").get(protect, getUserQuizzes);
router.route("/stop-quiz").put(protect, stopQuiz);

module.exports = router;
