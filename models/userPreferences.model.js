const mongoose = require("mongoose");

const UserPreferencesSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // Ensures one user can have only one preferences document
    },
    favoriteCountries: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Country",
      },
    ],
    favoriteSports: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Sport",
      },
    ],
    favoriteLeagues: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "League",
      },
    ],
  },
  { timestamps: true }
);

const UserPreferences = mongoose.model("UserPreferences", UserPreferencesSchema);
module.exports = UserPreferences;