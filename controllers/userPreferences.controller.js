const UserPreferences = require("../models/userPreferences.model");
const User = require("../models/user.model");
const Country = require("../models/country.model");
const Sport = require("../models/sport.model");
const League = require("../models/league.model");
const errorHandler = require("../utils/error");
const responseHandler = require("../utils/response");
const mongoose = require("mongoose")

// Create User Preferences (Only if not already created)
const createUserPreferences = async (req, res) => {
  try {
    const { favoriteCountries = [], favoriteSports = [], favoriteLeagues = [] } = req.body;

    // Extract User ID from JWT Token
    const userId = req.user._id;

    // Fetch user details
    const user = await User.findById(userId).select("name email profilePic isVerified role");

    if (!user) {
      return errorHandler(res, 404, "User not found.");
    }

    // Check if user preferences already exist
    const existingPreferences = await UserPreferences.findOne({ userId });

    if (existingPreferences) {
      return errorHandler(res, 400, "User preferences already exist. Please update them instead.");
    }

    // Validate and fetch Country data
    const validCountries = await Country.find({ _id: { $in: favoriteCountries } }).select("_id name code");
    if (validCountries.length !== favoriteCountries.length) {
      return errorHandler(res, 400, "One or more provided country IDs are invalid.");
    }

    // Validate and fetch Sport data
    const validSports = await Sport.find({ _id: { $in: favoriteSports } }).select("_id name");
    if (validSports.length !== favoriteSports.length) {
      return errorHandler(res, 400, "One or more provided sport IDs are invalid.");
    }

    // Validate and fetch League data
    const validLeagues = await League.find({ _id: { $in: favoriteLeagues } }).select("_id name country");
    if (validLeagues.length !== favoriteLeagues.length) {
      return errorHandler(res, 400, "One or more provided league IDs are invalid.");
    }

    // Create new preferences
    const userPreferences = new UserPreferences({
      userId,
      favoriteCountries: validCountries.map((c) => c._id),
      favoriteSports: validSports.map((s) => s._id),
      favoriteLeagues: validLeagues.map((l) => l._id),
    });

    await userPreferences.save();

    return responseHandler(res, 201, "User preferences created successfully.", {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        profilePic: user.profilePic,
        isVerified: user.isVerified,
        role: user.role,
      },
      preferences: {
        favoriteCountries: validCountries.map((c) => ({
          id: c._id,
          name: c.name,
          code: c.code,
        })),
        favoriteSports: validSports.map((s) => ({
          id: s._id,
          name: s.name,
        })),
        favoriteLeagues: validLeagues.map((l) => ({
          id: l._id,
          name: l.name,
          country: l.country,
        })),
      },
    });
  } catch (error) {
    return errorHandler(res, 500, error.message || "Something went wrong while saving preferences.");
  }
};

// Get User Preferences
const getUserPreferences = async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.user || !req.user._id) {
      return errorHandler(res, 400, "User authentication failed.");
    }

    const userId = req.user._id;

    // Fetch user details
    const user = await User.findById(userId).select("name email profilePic isVerified role");
    if (!user) {
      return errorHandler(res, 404, "User not found.");
    }

    // Fetch user preferences
    const userPreferences = await UserPreferences.findOne({ userId })
      .populate("favoriteCountries", "name flag code")
      .populate("favoriteSports", "name logo")
      .populate({
        path: "favoriteLeagues",
        select: "name startDate endDate country",
        populate: { path: "country", select: "name code flag" }, // Populate country details for leagues
      })
      .lean(); // Optimize query performance

    // If no preferences are found, return empty preferences
    const formattedPreferences = userPreferences
      ? {
          favoriteCountries: userPreferences.favoriteCountries.map((c) => ({
            name: c.name,
            code: c.code,
            flag: c.flag,
          })),
          favoriteSports: userPreferences.favoriteSports.map((s) => ({
            name: s.name,
            logo: s.logo,
          })),
          favoriteLeagues: userPreferences.favoriteLeagues.map((l) => ({
            name: l.name,
            startDate: l.startDate, // Include start date
            endDate: l.endDate, // Include end date
            country: l.country ? { name: l.country.name, code: l.country.code, flag: l.country.flag } : null,
          })),
        }
      : { favoriteCountries: [], favoriteSports: [], favoriteLeagues: [] };

    return responseHandler(res, 200, "User preferences retrieved successfully.", {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        profilePic: user.profilePic,
        isVerified: user.isVerified,
        role: user.role,
      },
      preferences: formattedPreferences,
    });
  } catch (error) {
    return errorHandler(res, 500, error.message || "Something went wrong while fetching preferences.");
  }
};


const getAllUserPreferences = async (req, res) => {
  try {
    // Fetch all user preferences with necessary data
    const userPreferences = await UserPreferences.find()
      .populate("userId", "name email profilePic isVerified role") // Include user details
      .populate("favoriteCountries", "name flag code")
      .populate("favoriteSports", "name logo")
      .populate({
        path: "favoriteLeagues",
        select: "name country",
        populate: { path: "country", select: "name code flag" }, // Populate country details for leagues
      })
      .lean(); // Optimize query performance

    if (!userPreferences.length) {
      return errorHandler(res, 404, "No user preferences found.");
    }

    // Format response to remove ObjectIds and structure data properly
    const formattedPreferences = userPreferences.map((userPref) => ({
      user: userPref.userId
        ? {
            _id: userPref.userId._id,
            name: userPref.userId.name,
            email: userPref.userId.email,
            profilePic: userPref.userId.profilePic,
            isVerified: userPref.userId.isVerified,
            role: userPref.userId.role,
          }
        : null,
      preferences: {
        favoriteCountries: userPref.favoriteCountries.map((c) => ({
          name: c.name,
          code: c.code,
          flag: c.flag,
        })),
        favoriteSports: userPref.favoriteSports.map((s) => ({
          name: s.name,
          logo: s.logo,
        })),
        favoriteLeagues: userPref.favoriteLeagues.map((l) => ({
          name: l.name,
          country: l.country ? { name: l.country.name, code: l.country.code, flag: l.country.flag } : null,
        })),
      },
    }));

    return responseHandler(res, 200, "All user preferences retrieved successfully.", formattedPreferences);
  } catch (error) {
    console.error("Error fetching all user preferences:", error);
    return errorHandler(res, 500, error.message || "Something went wrong while fetching preferences.");
  }
};

const getUserPreferencesByPreferenceId = async (req, res) => {
  try {
    const { id } = req.params; // Extracting the preference document ID

    if (!id) {
      return errorHandler(res, 400, "Preference ID is required.");
    }

    console.log("Fetching user preferences for Preference ID:", id); // Debugging log

    const userPreferences = await UserPreferences.findById(id)
      .populate("userId", "name email profilePic isVerified role") // Include user details
      .populate("favoriteCountries", "name flag code")
      .populate("favoriteSports", "name logo")
      .populate({
        path: "favoriteLeagues",
        select: "name country",
        populate: { path: "country", select: "name code flag" }, // Populate country details for leagues
      })
      .lean(); // Optimize query performance

    if (!userPreferences) {
      return errorHandler(res, 404, "User preferences not found.");
    }

    // Format response to remove ObjectIds and structure data properly
    const formattedPreferences = {
      user: userPreferences.userId
        ? {
            _id: userPreferences.userId._id,
            name: userPreferences.userId.name,
            email: userPreferences.userId.email,
            profilePic: userPreferences.userId.profilePic,
            isVerified: userPreferences.userId.isVerified,
            role: userPreferences.userId.role,
          }
        : null,
      preferences: {
        favoriteCountries: userPreferences.favoriteCountries.map((c) => ({
          name: c.name,
          code: c.code,
          flag: c.flag,
        })),
        favoriteSports: userPreferences.favoriteSports.map((s) => ({
          name: s.name,
          logo: s.logo,
        })),
        favoriteLeagues: userPreferences.favoriteLeagues.map((l) => ({
          name: l.name,
          country: l.country ? { name: l.country.name, code: l.country.code, flag: l.country.flag } : null,
        })),
      },
    };

    return responseHandler(res, 200, "User preferences retrieved successfully.", formattedPreferences);
  } catch (error) {
    console.error("Error fetching user preferences by Preference ID:", error);
    return errorHandler(res, 500, error.message || "Something went wrong.");
  }
};

const updateUserPreferences = async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.user || !req.user._id) {
      return errorHandler(res, 400, "User authentication failed.");
    }

    const userId = req.user._id;

    // Fetch user details to ensure user exists
    const user = await User.findById(userId).select("name email profilePic isVerified role");
    if (!user) {
      return errorHandler(res, 404, "User not found.");
    }

    const { favoriteCountries = [], favoriteSports = [], favoriteLeagues = [] } = req.body;

    // Validate existing user preferences
    let userPreferences = await UserPreferences.findOne({ userId });
    if (!userPreferences) {
      return errorHandler(res, 404, "User preferences not found.");
    }

    // Validate and fetch full country details
    const populatedCountries = await Promise.all(
      favoriteCountries.map(async (id) => {
        if (!mongoose.isValidObjectId(id)) throw new Error(`Invalid country ID: ${id}`);
        const country = await Country.findById(id).select("name flag code");
        if (!country) throw new Error(`Country not found: ${id}`);
        return { _id: country._id, name: country.name, flag: country.flag, code: country.code };
      })
    );

    // Validate and fetch full sport details
    const populatedSports = await Promise.all(
      favoriteSports.map(async (id) => {
        if (!mongoose.isValidObjectId(id)) throw new Error(`Invalid sport ID: ${id}`);
        const sport = await Sport.findById(id).select("name logo");
        if (!sport) throw new Error(`Sport not found: ${id}`);
        return { _id: sport._id, name: sport.name, logo: sport.logo };
      })
    );

    // Validate and fetch full league details
    const populatedLeagues = await Promise.all(
      favoriteLeagues.map(async (id) => {
        if (!mongoose.isValidObjectId(id)) throw new Error(`Invalid league ID: ${id}`);
        const league = await League.findById(id).select("name");
        if (!league) throw new Error(`League not found: ${id}`);
        return { _id: league._id, name: league.name };
      })
    );

    // Update user preferences
    userPreferences.favoriteCountries = populatedCountries;
    userPreferences.favoriteSports = populatedSports;
    userPreferences.favoriteLeagues = populatedLeagues;
    await userPreferences.save();

    // Format response
    const formattedPreferences = {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        profilePic: user.profilePic,
        isVerified: user.isVerified,
        role: user.role,
      },
      preferences: {
        favoriteCountries: populatedCountries,
        favoriteSports: populatedSports,
        favoriteLeagues: populatedLeagues,
      },
    };

    return responseHandler(res, 200, "User preferences updated successfully.", formattedPreferences);
  } catch (error) {
    console.error("Error updating user preferences:", error);
    return errorHandler(res, 500, error.message || "Something went wrong while updating preferences.");
  }
};

const deleteUserPreference = async (req, res) => {
  try {
    const { id } = req.params; // Extracting the preference document ID

    if (!id) {
      return errorHandler(res, 400, "Preference ID is required.");
    }

    console.log("Deleting user preference for Preference ID:", id); // Debugging log

    const deletedPreference = await UserPreferences.findByIdAndDelete(id)
      .populate("userId", "name email profilePic isVerified role") // Populate user details
      .populate("favoriteCountries", "name flag code")
      .populate("favoriteSports", "name logo")
      .populate({
        path: "favoriteLeagues",
        select: "name country",
        populate: { path: "country", select: "name code flag" }, // Populate country details for leagues
      })
      .lean(); // Optimize query performance

    if (!deletedPreference) {
      return errorHandler(res, 404, "User preference not found.");
    }

    // Format response to structure data properly
    const formattedPreference = {
      user: deletedPreference.userId
        ? {
            _id: deletedPreference.userId._id,
            name: deletedPreference.userId.name,
            email: deletedPreference.userId.email,
            profilePic: deletedPreference.userId.profilePic,
            isVerified: deletedPreference.userId.isVerified,
            role: deletedPreference.userId.role,
          }
        : null,
      preferences: {
        favoriteCountries: deletedPreference.favoriteCountries.map((c) => ({
          name: c.name,
          code: c.code,
          flag: c.flag,
        })),
        favoriteSports: deletedPreference.favoriteSports.map((s) => ({
          name: s.name,
          logo: s.logo,
        })),
        favoriteLeagues: deletedPreference.favoriteLeagues.map((l) => ({
          name: l.name,
          country: l.country ? { name: l.country.name, code: l.country.code, flag: l.country.flag } : null,
        })),
      },
    };

    return responseHandler(res, 200, "User preference deleted successfully.", formattedPreference);
  } catch (error) {
    console.error("Error deleting user preference by Preference ID:", error);
    return errorHandler(res, 500, error.message || "Something went wrong.");
  }
};

module.exports = { createUserPreferences, getUserPreferences,getAllUserPreferences,getUserPreferencesByPreferenceId,updateUserPreferences,deleteUserPreference};