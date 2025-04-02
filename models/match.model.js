const mongoose = require("mongoose");

const MatchSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },
    league: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "League", // Reference to the League model
      required: true,
    },
    firstTeam: {
      type: String,
      required: true,
      trim: true,
    },
    secondTeam: {
      type: String,
      required: true,
      trim: true,
    },
    matchDateTime: {
      type: Date,
      required: true,
    },
    venue: {
      type: String,
      required: true,
      trim: true,
    },
    ottPlatform: {
      type: String,
      trim: true,
      default: null,
    },
    location: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
  },
  { timestamps: true }
);

const Match = mongoose.model("Match", MatchSchema);
module.exports = Match;