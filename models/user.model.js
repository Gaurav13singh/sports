const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String, // Required for manual sign-up (hashed password)
    },
    profilePic: {
      type: String, // URL of the profile picture
      default: "",
    },
    isVerified: {
      type: Boolean,
      default: true, // Google Sign-In users are verified
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
    accountMethod: {
      type: String,
      enum: ["google", "manual", "facebook"],
      required: true, // Track signup method
    },
    providerId: {
      type: String, // Stores Google UID for Google sign-in users
      default: null,
    },
    lastLogin: {
      type: Date, // Stores last login timestamp
      default: Date.now,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", UserSchema);
module.exports = User;
