const mongoose = require("mongoose");

const ScoreSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    totalScore: {
      type: Number,
      default: 0,
    },
    submittedQuizzes: [
      {
        quiz: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },
        selectedAnswer: { type: String, required: true },
        isCorrect: { type: Boolean, required: true },
      }
    ]
  },
  { timestamps: true }
);

const Score = mongoose.model("Score", ScoreSchema);
module.exports = Score;
