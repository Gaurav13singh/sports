const mongoose = require("mongoose");

const QuizSchema = new mongoose.Schema(
  {
    league: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "League", // Reference to the League model
      required: true,
    },
    question: {
      type: String,
      required: true,
      trim: true,
    },
    options: {
      type: [String], // Array of four options
      validate: {
        validator: (arr) => arr.length === 4, // Ensure exactly 4 options
        message: "Quiz must have exactly 4 options.",
      },
      required: true,
    },
    correctAnswer: {
      type: String,
      required: true,
      trim: true,
    },
    points: {
      type: Number,
      required: true,
      min: 1, // Each question must have at least 1 point
    },
  },
  { timestamps: true }
);

const Quiz = mongoose.model("Quiz", QuizSchema);
module.exports = Quiz;
