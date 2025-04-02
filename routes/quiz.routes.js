const express = require("express");
const router = express.Router();
const { validateToken, validateAdmin } = require("../middleware/auth.middleware");
const { createQuiz, updateQuiz, deleteQuiz, fetchQuizForUser, submitAnswer, getLeaderboard } = require("../controllers/quiz.controller");

// Routes
router.post("/", validateToken, validateAdmin, createQuiz); // Admin can create a quiz
router.patch("/:quizId", validateToken, validateAdmin, updateQuiz);
router.delete("/:quizId", validateToken, validateAdmin, deleteQuiz);
router.get("/user-quizes", validateToken, fetchQuizForUser);
router.post("/submit", validateToken, submitAnswer);
router.get("/leaderboard", validateToken, getLeaderboard);

module.exports = router;