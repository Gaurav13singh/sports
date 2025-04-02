const mongoose = require("mongoose");
const Quiz = require("../models/quiz.model");
const League = require("../models/league.model");
const responseHandler = require("../utils/response");
const errorHandler = require("../utils/error");
const UserPreferences = require("../models/userPreferences.model");
const Score = require("../models/score.model"); 

const createQuiz = async (req, res) => {
    try {
        const { league, question, options, correctAnswer, points } = req.body;

        // Validate required fields
        if (!league || !question || !options || !correctAnswer || !points) {
            return errorHandler(res, 400, "All fields are required.");
        }

        // Validate League ObjectId
        if (!mongoose.Types.ObjectId.isValid(league)) {
            return errorHandler(res, 400, "Invalid League ID.");
        }

        // Check if the question already exists
        const existingQuiz = await Quiz.findOne({ question });
        if (existingQuiz) {
            return errorHandler(res, 400, "This question already exists.");
        }

        // Check if League exists and fetch details
        const leagueData = await League.findById(league).select("name country startDate endDate").populate("country", "name code flag");
        if (!leagueData) {
            return errorHandler(res, 404, "League not found.");
        }

        // Create a new quiz
        const quiz = new Quiz({
            league,
            question,
            options,
            correctAnswer,
            points,
        });

        // Save to DB
        await quiz.save();

        // Return response with league details
        return responseHandler(res, 201, "Quiz created successfully.", {
            _id: quiz._id,
            question: quiz.question,
            options: quiz.options,
            correctAnswer: quiz.correctAnswer,
            points: quiz.points,
            league: {
                _id: leagueData._id,
                name: leagueData.name,
                startDate: leagueData.startDate,
                endDate: leagueData.endDate,
                country: leagueData.country ? {
                    name: leagueData.country.name,
                    code: leagueData.country.code,
                    flag: leagueData.country.flag,
                } : null,
            },
        });
    } catch (error) {
        return errorHandler(res, 500, error.message || "Something went wrong while creating the quiz.");
    }
};

const updateQuiz = async (req, res) => {
    try {
        const { quizId } = req.params;
        const { question, options, correctAnswer, points, league } = req.body;

        // Validate Quiz ObjectId
        if (!mongoose.Types.ObjectId.isValid(quizId)) {
            return errorHandler(res, 400, "Invalid Quiz ID.");
        }

        // Find the quiz
        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return errorHandler(res, 404, "Quiz not found.");
        }

        // If league is being updated, validate it
        if (league && !mongoose.Types.ObjectId.isValid(league)) {
            return errorHandler(res, 400, "Invalid League ID.");
        }

        // Check if the new question already exists in another quiz
        if (question && question !== quiz.question) {
            const existingQuiz = await Quiz.findOne({ question });
            if (existingQuiz) {
                return errorHandler(res, 400, "This question already exists.");
            }
        }

        // Update quiz details
        quiz.question = question || quiz.question;
        quiz.options = options || quiz.options;
        quiz.correctAnswer = correctAnswer || quiz.correctAnswer;
        quiz.points = points || quiz.points;
        quiz.league = league || quiz.league;

        // Save updated quiz
        await quiz.save();

        // Fetch updated league details
        const leagueData = await League.findById(quiz.league).select("name startDate endDate country").populate("country", "name code flag");

        return responseHandler(res, 200, "Quiz updated successfully.", {
            _id: quiz._id,
            question: quiz.question,
            options: quiz.options,
            correctAnswer: quiz.correctAnswer,
            points: quiz.points,
            league: {
                _id: leagueData._id,
                name: leagueData.name,
                startDate: leagueData.startDate,
                endDate: leagueData.endDate,
                country: leagueData.country ? {
                    name: leagueData.country.name,
                    code: leagueData.country.code,
                    flag: leagueData.country.flag,
                } : null,
            },
        });
    } catch (error) {
        return errorHandler(res, 500, error.message || "Something went wrong while updating the quiz.");
    }
};

const deleteQuiz = async (req, res) => {
    try {
        const { quizId } = req.params;

        // Validate Quiz ObjectId
        if (!mongoose.Types.ObjectId.isValid(quizId)) {
            return errorHandler(res, 400, "Invalid Quiz ID.");
        }

        // Find and delete the quiz
        const quiz = await Quiz.findByIdAndDelete(quizId).populate({
            path: "league",
            select: "name startDate endDate country",
            populate: { path: "country", select: "name code flag" },
        });

        if (!quiz) {
            return errorHandler(res, 404, "Quiz not found.");
        }

        return responseHandler(res, 200, "Quiz deleted successfully.", {
            _id: quiz._id,
            question: quiz.question,
            options: quiz.options,
            correctAnswer: quiz.correctAnswer,
            points: quiz.points,
            league: quiz.league
                ? {
                    _id: quiz.league._id,
                    name: quiz.league.name,
                    startDate: quiz.league.startDate,
                    endDate: quiz.league.endDate,
                    country: quiz.league.country ? {
                        name: quiz.league.country.name,
                        code: quiz.league.country.code,
                        flag: quiz.league.country.flag,
                    } : null,
                }
                : null,
        });
    } catch (error) {
        return errorHandler(res, 500, error.message || "Something went wrong while deleting the quiz.");
    }
};

const fetchQuizForUser = async (req, res) => {
    try {
        // Ensure user is authenticated
        if (!req.user || !req.user._id) {
            return errorHandler(res, 400, "User authentication failed.");
        }

        const userId = req.user._id;

        // Fetch user preferences to get favorite leagues
        const userPreferences = await UserPreferences.findOne({ userId }).select("favoriteLeagues");
        if (!userPreferences || userPreferences.favoriteLeagues.length === 0) {
            return errorHandler(res, 404, "No favorite leagues found for this user.");
        }

        // Fetch quizzes for the user's favorite leagues
        const quizzes = await Quiz.find({ league: { $in: userPreferences.favoriteLeagues } })
            .select("question options correctAnswer points league")  // Include 'correctAnswer' field
            .populate({
                path: "league",
                select: "name startDate endDate country",
                populate: { path: "country", select: "name code flag" },
            });

        // If no quizzes found, return empty response
        if (!quizzes.length) {
            return responseHandler(res, 200, "No quizzes available for your favorite leagues.", []);
        }

        return responseHandler(res, 200, "Quizzes retrieved successfully.", quizzes);
    } catch (error) {
        return errorHandler(res, 500, error.message || "Something went wrong while fetching quizzes.");
    }
};

const submitAnswer = async (req, res) => {
    try {
        // Ensure user is authenticated
        if (!req.user || !req.user._id) {
            return errorHandler(res, 400, "User authentication failed.");
        }

        const userId = req.user._id;
        const { quizId, selectedAnswer } = req.body;

        // Validate input
        if (!quizId || !selectedAnswer) {
            return errorHandler(res, 400, "Quiz ID and selected answer are required.");
        }

        // Fetch the quiz question
        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return errorHandler(res, 404, "Quiz not found.");
        }

        // Find the user's score record
        let userScore = await Score.findOne({ user: userId });

        // Ensure userScore exists
        if (!userScore) {
            userScore = new Score({ user: userId, totalScore: 0, submittedQuizzes: [] });
        }

        // Check if the user has already submitted an answer for this quiz
        const alreadyAnswered = userScore.submittedQuizzes.some((entry) => entry.quiz.toString() === quizId);

        if (alreadyAnswered) {
            return errorHandler(res, 400, "You have already answered this quiz.");
        }

        // Check if the answer is correct
        const isCorrect = quiz.correctAnswer === selectedAnswer;
        let pointsEarned = isCorrect ? quiz.points : 0;

        // Update total score if the answer is correct
        if (isCorrect) {
            userScore.totalScore += pointsEarned;
        }

        // Store the quiz submission
        userScore.submittedQuizzes.push({ quiz: quizId, selectedAnswer, isCorrect });

        await userScore.save(); // Save the updated score

        return responseHandler(res, 200, isCorrect ? "Correct answer! Your score has been updated." : "Incorrect answer! Better luck next time.", {
            userId: userScore.user,
            totalScore: userScore.totalScore
        });

    } catch (error) {
        return errorHandler(res, 500, error.message || "Something went wrong while submitting the answer.");
    }
};

const getLeaderboard = async (req, res) => {
    try {
        const leaderboard = await Score.find()
            .sort({ totalScore: -1 }) // Sort by highest score
            .limit(10) // Get top 10 users
            .populate("user", "name profilePic"); // Populate user details

        if (!leaderboard.length) {
            return responseHandler(res, 200, "No leaderboard data available.", []);
        }

        return responseHandler(res, 200, "Leaderboard fetched successfully.", leaderboard);
    } catch (error) {
        return errorHandler(res, 500, error.message || "Error fetching leaderboard.");
    }
};


module.exports = { createQuiz, updateQuiz, deleteQuiz, fetchQuizForUser,submitAnswer,getLeaderboard };